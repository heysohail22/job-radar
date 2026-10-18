from hashlib import sha256
from datetime import datetime, timezone
import re
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from .analysis import Analysis, score
from . import discovery, models
from .extract import board_from_url, extract, complete_description
from .network import canonical_url
from .store import now


class State(TypedDict, total=False):
    queries: list[str]
    summary: dict
    errors: list[str]
    candidate_ids: list[str]
    index: int


def build_graph(store, write, saver, guard=lambda: None, source=None, planner=None, analyzer=None):
    from .network import SourceClient

    source = source or SourceClient()
    s = store.db.settings
    planner = planner or models.plan_queries
    analyzer = analyzer or models.analyze

    def plan(state):
        guard()
        return dict(
            queries=planner(s),
            summary=dict(
                discovered=0, processed=0, published=0, uncertain=0, rejected=0, deferred=0
            ),
            errors=[],
            index=0,
        )

    def discover(state):
        guard()
        errors, count = list(state["errors"]), 0

        def accept(results):
            nonlocal count
            rows, boards = [], {}
            for item in results:
                if re.match(
                    r"^(accountant|recruiter|sales representative|registered nurse|truck driver|customer support representative)\b",
                    item.get("title") or "",
                    re.I,
                ):
                    continue
                try:
                    url = canonical_url(item["url"])
                except ValueError:
                    continue
                rows.append({**item, "url": url})
                b = board_from_url(url)
                if b:
                    ident = b["provider"] + ":" + b["board"]
                    boards[ident] = {"id": ident, **b}
                count += 1
            store.save_candidates(rows)
            if boards:
                store.db.insert(
                    "collector_sources", list(boards.values()), conflict="provider,board"
                )

        for query in state["queries"]:
            guard()
            try:
                results = discovery.search(query, store)
            except Exception:
                errors.append("A Tavily query failed or its budget was exhausted.")
                break
            accept(results)
        for name, fn in [("remotive", discovery.feed_jobs), ("weworkremotely", discovery.rss_jobs)]:
            guard()
            try:
                results = fn(source)
            except Exception:
                errors.append(name + " feed unavailable.")
                continue
            accept(results)
        for board in store.db.rows(
            "collector_sources", select="*", order="last_checked_at.asc.nullsfirst", limit="20"
        ):
            guard()
            try:
                results = discovery.board_jobs(board["provider"], board["board"], source)
            except Exception:
                errors.append("An employer board was unavailable.")
                continue
            accept(results)
            store.db.patch("collector_sources", {"last_checked_at": now()}, id="eq." + board["id"])
        ids = [c["id"] for c in store.candidates(write)][: s.max_candidates]
        return dict(
            summary={**state["summary"], "discovered": count}, errors=errors, candidate_ids=ids
        )

    def process(state):
        guard()
        index, summary = state["index"], dict(state["summary"])
        if index >= len(state["candidate_ids"]):
            return {}
        rows = store.db.rows(
            "collector_candidates", select="*", id="eq." + state["candidate_ids"][index]
        )
        result = {"index": index + 1, "summary": summary}
        if not rows:
            return result
        c = rows[0]
        summary["processed"] += 1
        if (
            write
            and c["status"] == "shortlisted"
            and not c.get("published_at")
            and c.get("analysis")
            and c.get("description")
            and c.get("profile_version") == s.job_radar_profile_version
        ):
            store.publish(
                dict(
                    url=c.get("canonical_url") or c["url"],
                    description=c["description"],
                    method=c.get("extraction_method") or "cached",
                ),
                Analysis.model_validate(c["analysis"]),
            )
            store.update_candidate(c["id"], {"published_at": now()})
            summary["published"] += 1
            return result
        # A replay after a crash can encounter an already completed candidate.
        # Reuse its validated hash/analysis; publication RPC preserves tracking.
        try:
            extracted = (
                dict(
                    url=c.get("canonical_url") or c["url"],
                    description=c["description"],
                    method=c.get("extraction_method") or "cached",
                )
                if c.get("description")
                and complete_description(c["description"])
                and (
                    not c.get("updated_at")
                    or (
                        datetime.now(timezone.utc)
                        - datetime.fromisoformat(c["updated_at"].replace("Z", "+00:00"))
                    ).total_seconds()
                    < 3 * 86400
                )
                else extract(
                    c["url"],
                    source,
                    (lambda url: discovery.firecrawl(url, store))
                    if s.firecrawl_api_key.get_secret_value()
                    else None,
                )
            )
        except Exception:
            store.update_candidate(
                c["id"],
                dict(
                    status="deferred",
                    reason="Complete JD unavailable; extraction will retry.",
                    attempts=c["attempts"] + 1,
                ),
            )
            summary["deferred"] += 1
            return result
        description = "\n".join(
            filter(
                None, (extracted.get("title"), extracted.get("company"), extracted["description"])
            )
        )
        digest = sha256(description.encode()).hexdigest()
        try:
            analysis = (
                Analysis.model_validate(c["analysis"])
                if digest == c.get("content_hash")
                and c.get("profile_version") == s.job_radar_profile_version
                and c.get("analysis")
                else analyzer(description, s)
            )
        except Exception as error:
            store.update_candidate(
                c["id"],
                dict(
                    status="deferred",
                    reason="Model unavailable or evidence validation failed; retry later.",
                    description=description,
                    content_hash=digest,
                    canonical_url=extracted["url"],
                    extraction_method=extracted["method"],
                    attempts=c["attempts"] + 1,
                ),
            )
            summary["deferred"] += 1
            if isinstance(error, models.EvidenceError):
                return result
            # Pause safely instead of consuming quota on all remaining candidates.
            return {
                **result,
                "index": len(state["candidate_ids"]),
                "errors": [
                    *state["errors"],
                    "Model analysis paused; remaining candidates are queued.",
                ],
            }
        scored = score(analysis)
        guard()
        if write:
            existing = store.db.rows(
                "jobs", select="id", canonical_url="eq." + extracted["url"], limit="1"
            )
            if scored["status"] == "shortlisted" or existing:
                store.publish({**extracted, "description": description}, analysis)
                summary["published"] += 1
        values = dict(
            title=analysis.title,
            company=analysis.company,
            status=scored["status"],
            score=scored["total"],
            reason=scored["reason"],
            analysis=analysis.model_dump(),
            description=description,
            content_hash=digest,
            profile_version=s.job_radar_profile_version,
            extraction_method=extracted["method"],
            canonical_url=extracted["url"],
            attempts=c["attempts"] + 1,
        )
        if write and scored["status"] == "shortlisted":
            values["published_at"] = now()
        store.update_candidate(c["id"], values)
        if scored["status"] in ("uncertain", "rejected"):
            summary[scored["status"]] += 1
        return result

    builder = StateGraph(State)
    builder.add_node("plan", plan)
    builder.add_node("discover", discover)
    builder.add_node("process", process)
    builder.add_edge(START, "plan")
    builder.add_edge("plan", "discover")
    builder.add_edge("discover", "process")
    builder.add_conditional_edges(
        "process",
        lambda state: "process" if state["index"] < len(state["candidate_ids"]) else END,
        {"process": "process", END: END},
    )
    return builder.compile(checkpointer=saver)
