"""One-process scheduler and background collector; Supabase owns durable state."""

import asyncio
from datetime import datetime, timedelta, timezone
import logging
import threading
import time
from uuid import uuid4
from zoneinfo import ZoneInfo
from .database import ApiError
from .checkpoint import SupabaseSaver
from .graph import build_graph
from .models import available_models
from .store import Store, now

log = logging.getLogger("job_radar")


class CollectorRuntime:
    def __init__(self, db):
        self.db, self.settings = db, db.settings
        self.task = None
        self.scheduler = None
        self.stopping = threading.Event()
        self.lock = asyncio.Lock()

    def _prepare(self, write, run_id=None, schedule_day=None):
        s = self.settings
        if not s.tavily_api_key.get_secret_value():
            raise ApiError("Configure TAVILY_API_KEY before collection.", 503)
        available_models(s)
        if write and not s.old_collector_disabled:
            raise ApiError("Disable the legacy collector before enabling writes.", 409)
        ident = run_id or str(uuid4())
        if not self.db.rpc("collector_acquire", {"p_run": ident}):
            raise ApiError("Another collector run is active. Try again later.", 409)
        try:
            if schedule_day and self.db.rows(
                "collector_runs",
                select="id",
                **{"summary->>schedule_day": "eq." + schedule_day},
                limit="1",
            ):
                raise ApiError("Today’s scheduled run already exists.", 409)
            if not run_id:
                self.db.insert(
                    "collector_runs",
                    dict(
                        id=ident,
                        summary=dict(
                            mode="write" if write else "preview",
                            runtime="python",
                            schedule_day=schedule_day,
                        ),
                    ),
                )
            else:
                rows = self.db.rows(
                    "collector_runs", id="eq." + ident, select="summary,checkpoint,status"
                )
                if (
                    not rows
                    or rows[0]["status"] not in ("running", "failed")
                    or rows[0]["summary"].get("runtime") != "python"
                    or rows[0]["summary"].get("mode") != ("write" if write else "preview")
                ):
                    raise ApiError("This run cannot be resumed in the requested mode.", 400)
                self.db.patch(
                    "collector_runs", {"status": "running", "finished_at": None}, id="eq." + ident
                )
        except Exception:
            self.db.delete("collector_lease", name="eq.daily", run_id="eq." + ident)
            raise
        return ident

    async def enqueue(self, write, run_id=None, schedule_day=None):
        async with self.lock:
            if self.stopping.is_set():
                raise ApiError("Service is stopping.", 503)
            if self.task and not self.task.done():
                raise ApiError("A collector run is already active.", 409)
            ident = await asyncio.to_thread(self._prepare, write, run_id, schedule_day)
            self.task = asyncio.create_task(asyncio.to_thread(self._run, ident, write))
            return ident

    def _run(self, ident, write):
        started, renewed = time.monotonic(), 0

        def guard():
            nonlocal renewed
            if self.stopping.is_set() or time.monotonic() - started > 90 * 60:
                raise InterruptedError("Collection interrupted; checkpoint retained.")
            if time.monotonic() - renewed > 45:
                rows = self.db.patch(
                    "collector_lease",
                    {"expires_at": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()},
                    name="eq.daily",
                    run_id="eq." + ident,
                    expires_at="gt." + now(),
                )
                if not rows:
                    raise InterruptedError("Collector lease was lost.")
                renewed = time.monotonic()

        try:
            guard()
            row = self.db.rows("collector_runs", id="eq." + ident, select="summary")[0]
            original = row["summary"]
            saver = SupabaseSaver(self.db, ident)
            graph = build_graph(Store(self.db), write, saver, guard)
            result = graph.invoke(
                None if saver.data["latest"] else {},
                config={
                    "configurable": {"thread_id": ident},
                    "recursion_limit": self.settings.max_candidates + 10,
                },
                durability="sync",
            )
            self.db.patch(
                "collector_runs",
                dict(
                    status="partial" if result["errors"] else "completed",
                    finished_at=now(),
                    summary={**original, **result["summary"], "errors": result["errors"]},
                ),
                id="eq." + ident,
            )
        except Exception:
            # Exceptions from providers can contain credentials or full JDs. Never log them.
            try:
                self.db.patch(
                    "collector_runs",
                    {"status": "running" if self.stopping.is_set() else "failed"},
                    id="eq." + ident,
                )
            except Exception:
                pass
            log.warning("Collector run %s interrupted; checkpoint retained.", ident)
        finally:
            try:
                self.db.delete("collector_lease", name="eq.daily", run_id="eq." + ident)
            except Exception:
                log.warning("Collector lease will expire automatically.")

    async def tick(self):
        if self.task and not self.task.done():
            return
        # Resume interrupted Python runs first. Old Node checkpoints remain intact.
        rows = await asyncio.to_thread(
            self.db.rows,
            "collector_runs",
            select="id,summary",
            status="eq.running",
            order="started_at.asc",
            limit="50",
        )
        for row in rows:
            if row["summary"].get("runtime") == "python":
                await self.enqueue(row["summary"].get("mode") == "write", row["id"])
                return
        s = self.settings
        local = datetime.now(ZoneInfo(s.collector_timezone))
        if (local.hour, local.minute) < (s.collector_hour, s.collector_minute):
            return
        day = local.date().isoformat()
        recent = await asyncio.to_thread(
            self.db.rows,
            "collector_runs",
            select="id,summary",
            **{"summary->>schedule_day": "eq." + day},
            limit="1",
        )
        if not recent:
            await self.enqueue(s.collector_write, schedule_day=day)

    async def _schedule(self):
        while not self.stopping.is_set():
            try:
                await self.tick()
            except Exception:
                log.warning("Scheduled collection deferred; verify configuration or active lease.")
            await asyncio.sleep(30)

    def start(self):
        if self.settings.collector_enabled:
            ZoneInfo(self.settings.collector_timezone)
            self.scheduler = asyncio.create_task(self._schedule())

    async def close(self):
        self.stopping.set()
        if self.scheduler:
            self.scheduler.cancel()
            await asyncio.gather(self.scheduler, return_exceptions=True)
        if self.task:
            # Provider calls have bounded timeouts; guard stops at the next step.
            await self.task
