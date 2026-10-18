import asyncio
from collections import defaultdict, deque
from contextlib import asynccontextmanager
import ipaddress
import json
import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from .config import Settings
from .database import Database, ApiError
from .contracts import feed, mutate, uuid
from .runtime import CollectorRuntime


def create_app(settings=None, db=None, runtime=None):
    settings = settings or Settings()
    db = db or Database(settings)
    runtime = runtime or CollectorRuntime(db)

    @asynccontextmanager
    async def lifespan(app):
        runtime.start()
        yield
        await runtime.close()
        db.close()

    app = FastAPI(title="AI Job Radar", version="0.2.0", lifespan=lifespan)
    app.state.db, app.state.collector = db, runtime
    buckets = defaultdict(deque)

    @app.middleware("http")
    async def access(request, call_next):
        origin = request.headers.get("origin")
        allowed = [s.strip() for s in settings.website_origins.split(",")]
        try:
            if settings.auth_mode == "local":
                host = request.url.hostname
                peer = request.client.host if request.client else ""
                try:
                    loopback = ipaddress.ip_address(peer).is_loopback
                except ValueError:
                    loopback = False
                if (
                    not loopback
                    or host not in ("localhost", "127.0.0.1", "::1")
                    or request.headers.get("sec-fetch-site") == "cross-site"
                ):
                    raise ApiError("Local workspace access requires a loopback connection.", 403)
            if origin and origin not in allowed:
                raise ApiError("Origin is not allowed.", 403)
            # Read a bounded body even when a caller omits Content-Length.
            body = bytearray()
            async for chunk in request.stream():
                body.extend(chunk)
                if len(body) > 8192:
                    raise ApiError("Request body is too large.", 413)
            request._body = bytes(body)
            peer = request.client.host if request.client else "unknown"
            key = (peer, request.url.path if request.url.path.startswith("/api/auth/") else "*")
            bucket = buckets[key]
            current = time.monotonic()
            while bucket and bucket[0] < current - 60:
                bucket.popleft()
            if len(bucket) >= (8 if request.url.path == "/api/auth/login" else 120):
                raise ApiError("Too many requests. Try again shortly.", 429)
            bucket.append(current)
            if len(buckets) > 5000:
                for old in list(buckets):
                    if not buckets[old] or buckets[old][-1] < current - 60:
                        del buckets[old]
            if request.method == "OPTIONS":
                response = Response(
                    status_code=204,
                    headers={
                        "Access-Control-Allow-Headers": "Authorization,Content-Type",
                        "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
                    },
                )
            else:
                response = await call_next(request)
        except ApiError as exc:
            response = JSONResponse({"error": exc.message}, status_code=exc.status)
        response.headers["Cache-Control"] = "no-store"
        if origin and origin in allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
        return response

    @app.exception_handler(ApiError)
    async def api_error(request, exc):
        return JSONResponse({"error": exc.message}, status_code=exc.status)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, exc):
        return JSONResponse({"error": "Invalid request."}, status_code=400)

    @app.exception_handler(Exception)
    async def unknown_error(request, exc):
        return JSONResponse({"error": "The request could not be completed."}, status_code=500)

    def owner(request):
        if settings.auth_mode == "local":
            return
        if not settings.owner_user_id:
            raise ApiError("Owner account has not been configured.", 503)
        token = request.headers.get("authorization", "")
        if not token.startswith("Bearer "):
            raise ApiError("Sign in to your workspace.", 401)
        try:
            user = db.request("GET", "/auth/v1/user", token=token[7:])
        except ApiError:
            raise ApiError("Your session expired. Sign in again.", 401) from None
        if user.get("id") != settings.owner_user_id:
            raise ApiError("This workspace is owner-only.", 403)

    async def body(request):
        try:
            value = json.loads(await request.body())
            if not isinstance(value, dict):
                raise ValueError()
            return value
        except (ValueError, TypeError):
            raise ApiError("Invalid request.", 400) from None

    @app.get("/health")
    def health():
        return {"ok": True}

    @app.post("/api/auth/login")
    async def login(request: Request):
        if settings.auth_mode == "local":
            raise ApiError("Sign-in is disabled in local workspace mode.", 404)
        if not settings.owner_user_id:
            raise ApiError("Owner account has not been configured.", 503)
        b = await body(request)
        if (
            not isinstance(b.get("email"), str)
            or not isinstance(b.get("password"), str)
            or len(b["email"]) > 254
            or len(b["password"]) > 512
        ):
            raise ApiError("Enter your email and password.", 400)
        return await asyncio.to_thread(auth_session, "password", b)

    def auth_session(grant, b):
        try:
            result = db.request("POST", "/auth/v1/token", params={"grant_type": grant}, body=b)
        except ApiError:
            raise ApiError("Sign-in failed.", 401) from None
        if (result.get("user") or {}).get("id") != settings.owner_user_id:
            raise ApiError("Sign-in failed.", 401)
        return {k: result.get(k) for k in ("access_token", "refresh_token")} | {
            "expires_at": int(time.time()) + result.get("expires_in", 3600)
        }

    @app.post("/api/auth/refresh")
    async def refresh(request: Request):
        if settings.auth_mode == "local":
            raise ApiError("Sign-in is disabled in local workspace mode.", 404)
        if not settings.owner_user_id:
            raise ApiError("Owner account has not been configured.", 503)
        b = await body(request)
        if not isinstance(b.get("refresh_token"), str) or len(b["refresh_token"]) > 4096:
            raise ApiError("Invalid session.", 400)
        return await asyncio.to_thread(
            auth_session, "refresh_token", {"refresh_token": b["refresh_token"]}
        )

    @app.get("/api/auth/me")
    def me(request: Request):
        owner(request)
        return {"owner": True, "mode": settings.auth_mode}

    @app.post("/api/auth/logout")
    def logout(request: Request):
        owner(request)
        if settings.auth_mode != "local":
            db.request(
                "POST",
                "/auth/v1/logout",
                params={"scope": "local"},
                token=request.headers["authorization"][7:],
            )
        return {"ok": True}

    @app.get("/api/public/jobs")
    def public_jobs(request: Request):
        return feed(db, request.query_params, public=True)

    @app.get("/api/public/jobs/{ident}")
    def public_detail(ident: str, request: Request):
        result = feed(db, {}, job_id=ident, public=True)
        if not result["jobs"]:
            raise ApiError("Job not found.", 404)
        return result["jobs"][0]

    @app.get("/api/jobs")
    def jobs(request: Request):
        owner(request)
        view = request.query_params.get("view", "discover")
        if view not in ("discover", "saved", "applications"):
            raise ApiError("Invalid view.", 400)
        return feed(db, request.query_params, view=view)

    @app.get("/api/jobs/{ident}")
    def detail(ident: str, request: Request):
        owner(request)
        result = feed(db, {}, job_id=ident)
        if not result["jobs"]:
            raise ApiError("Job not found.", 404)
        return result["jobs"][0]

    @app.patch("/api/matches/{ident}")
    async def update(ident: str, request: Request):
        await asyncio.to_thread(owner, request)
        return await asyncio.to_thread(mutate, db, ident, await body(request))

    @app.get("/api/runs")
    def runs(request: Request):
        owner(request)
        return db.rows(
            "collector_runs",
            select="id,started_at,finished_at,status,summary",
            order="started_at.desc",
            limit="100",
        )

    @app.get("/api/candidates")
    def candidates(request: Request):
        owner(request)
        return db.rows(
            "collector_candidates",
            select="id,url,title,company,status,score,reason,updated_at",
            order="updated_at.desc",
            limit="100",
        )

    @app.post("/api/collector/runs", status_code=202)
    async def collect(request: Request):
        await asyncio.to_thread(owner, request)
        b = await body(request)
        if set(b) - {"write", "resumeRunId"} or "write" in b and type(b["write"]) is not bool:
            raise ApiError("Invalid collection request.", 400)
        ident = uuid(b["resumeRunId"]) if b.get("resumeRunId") else None
        run = await runtime.enqueue(b.get("write", True), ident)
        return {"runId": run, "status": "running"}

    return app
