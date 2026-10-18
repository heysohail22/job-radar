from copy import deepcopy
from uuid import uuid4
import json

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from job_radar.app import create_app
from job_radar.config import Settings
from job_radar.database import Database, ApiError
from job_radar.analysis import Analysis, validate_evidence, score
from job_radar.checkpoint import SupabaseSaver
from job_radar.graph import build_graph
from job_radar.network import canonical_url, public_address, PublicResolver
from job_radar.extract import extract_html, complete_description

ID = str(uuid4())
MATCH = str(uuid4())
JD = "Python India requirements: Build REST APIs using Python. " * 25


def analysis(**overrides):
    data = dict(
        isSingleJob=True,
        title="Python Developer",
        company="Example",
        location="India",
        workMode="remote",
        indiaEligibility="yes",
        eligibilityEvidence="India",
        mandatoryBlockers=[],
        employmentType="full-time",
        compensation=None,
        currency=None,
        experienceText=None,
        minimumYears=None,
        experienceMandatory=False,
        experienceFit="entry",
        experienceEvidence="",
        degreeRequirements=[],
        postingStatus="uncertain",
        postingEvidence="",
        skills=[
            dict(
                name="Python",
                importance="required",
                fit="matched",
                evidence="Python",
                profileSkill="Python",
            )
        ],
        responsibilities=[
            dict(
                name="REST APIs",
                importance="required",
                fit="matched",
                evidence="REST APIs",
                profileSkill="REST APIs",
            )
        ],
        summary="Skills aligned",
    )
    return Analysis.model_validate({**data, **overrides})


class FakeDb:
    def __init__(self, settings=None):
        self.settings = settings or Settings(_env_file=None, auth_mode="local")
        self.tables = {
            "collector_runs": [],
            "collector_candidates": [],
            "collector_sources": [],
            "jobs": [],
        }
        self.calls = []
        self.saved, self.status, self.revision = False, "new", 0

    def rows(self, table, **params):
        rows = self.tables.get(table, [])
        for k, v in params.items():
            if isinstance(v, str) and v.startswith("eq."):
                rows = [r for r in rows if str(r.get(k)) == v[3:]]
        return deepcopy(rows)

    def patch(self, table, body, **params):
        out = []
        for row in self.tables[table]:
            if all(not v.startswith("eq.") or str(row.get(k)) == v[3:] for k, v in params.items()):
                row.update(deepcopy(body))
                out.append(row)
        return deepcopy(out)

    def insert(self, table, body, **kwargs):
        self.tables[table].extend(deepcopy(body if isinstance(body, list) else [body]))

    def rpc(self, name, args):
        self.calls.append((name, args))
        if name == "job_radar_update_state":
            if args["p_revision"] != self.revision:
                raise ApiError("This job changed. Refresh and try again.", 409)
            if args["p_is_saved"] is not None:
                self.saved = args["p_is_saved"]
            if args["p_status"] is not None:
                self.status = args["p_status"]
            self.revision += 1
            return dict(revision=self.revision, is_saved=self.saved, application_status=self.status)
        if name in ("job_radar_feed", "job_radar_public_feed"):
            return dict(
                jobs=[
                    dict(
                        id=ID,
                        match_id=MATCH,
                        title="Python Developer",
                        company="Example",
                        is_saved=self.saved,
                        application_status=self.status,
                        revision=self.revision,
                    )
                ],
                total=1,
                summary={},
            )
        return True

    def request(self, method, path, **kwargs):
        if path == "/auth/v1/user" and kwargs.get("token") == "valid":
            return {"id": "owner"}
        raise ApiError("Unauthorized", 502)

    def close(self):
        pass


class FakeRuntime:
    def start(self):
        pass

    async def close(self):
        pass

    async def enqueue(self, write, ident):
        return ID


def client(db):
    return TestClient(
        create_app(db.settings, db, FakeRuntime()),
        base_url="http://127.0.0.1",
        client=("127.0.0.1", 10000),
    )


def test_api_contract_and_independent_applied_bookmark_state():
    db = FakeDb()
    with client(db) as c:
        assert c.get("/api/jobs?mode=remote&score=60").json()["jobs"][0]["matchId"] == MATCH
        assert (
            c.patch("/api/matches/" + MATCH, json={"revision": 0, "status": "applied"}).status_code
            == 200
        )
        assert (
            c.patch("/api/matches/" + MATCH, json={"revision": 1, "isSaved": True}).status_code
            == 200
        )
        job = c.get("/api/jobs").json()["jobs"][0]
        assert job["status"] == "applied" and job["isSaved"]
        assert (
            c.patch("/api/matches/" + MATCH, json={"revision": 0, "status": "new"}).status_code
            == 409
        )
        for bad in [
            {"revision": True, "isSaved": True},
            {"revision": 2, "status": "hired"},
            {"revision": 2, "score": 100},
        ]:
            assert c.patch("/api/matches/" + MATCH, json=bad).status_code == 400
        assert c.get("/api/jobs?score=101").status_code == 400
        assert c.get("/api/jobs?view=invalid").status_code == 400
        assert c.get("/api/jobs", headers={"Origin": "https://evil.example"}).status_code == 403
        assert c.get("/api/jobs", headers={"Host": "evil.example"}).status_code == 403
        assert c.post("/api/collector/runs", json={"write": False}).status_code == 202
        assert c.post("/api/collector/runs", json={"write": "yes"}).status_code == 400


def test_public_deployment_requires_owner_and_local_rejects_remote():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, auth_mode="local", host="0.0.0.0")
    db = FakeDb(Settings(_env_file=None, auth_mode="owner", host="0.0.0.0", owner_user_id="owner"))
    with client(db) as c:
        assert c.get("/api/jobs").status_code == 401
        assert c.get("/api/jobs", headers={"Authorization": "Bearer bad"}).status_code == 401
        assert c.get("/api/jobs", headers={"Authorization": "Bearer valid"}).status_code == 200
        assert c.post("/api/collector/runs", json={}).status_code == 401
        assert c.get("/api/public/jobs").status_code == 200
        name, args = db.calls[-1]
        assert (
            name == "job_radar_public_feed"
            and "p_profile" not in args
            and "p_min_score" not in args
        )
    local = FakeDb()
    with TestClient(
        create_app(local.settings, local, FakeRuntime()),
        base_url="http://127.0.0.1",
        client=("192.168.1.5", 1),
    ) as c:
        assert c.get("/api/jobs", headers={"X-Forwarded-For": "127.0.0.1"}).status_code == 403


def test_postgrest_conflict_and_errors_do_not_expose_secrets():
    s = Settings(
        _env_file=None,
        supabase_url="https://example.supabase.co",
        supabase_secret_key="secret-value",
    )

    def handler(req):
        assert req.headers["apikey"] == "secret-value"
        return httpx.Response(409, json={"code": "PT409", "message": "sensitive database detail"})

    db = Database(s, httpx.MockTransport(handler))
    with pytest.raises(ApiError) as e:
        db.rpc("job_radar_update_state", {})
    assert e.value.status == 409 and "sensitive" not in str(e.value)
    db.close()


def test_scoring_preserves_stretch_and_requires_supported_evidence():
    assert score(validate_evidence(analysis(), JD))["status"] == "shortlisted"
    assert (
        score(analysis(experienceFit="stretch", minimumYears=2, experienceMandatory=True))["status"]
        == "shortlisted"
    )
    assert score(analysis(indiaEligibility="unclear"))["status"] == "uncertain"
    assert score(analysis(indiaEligibility="no"))["status"] == "rejected"
    assert score(analysis(minimumYears=4, experienceMandatory=True))["status"] == "rejected"
    with pytest.raises(ValueError):
        validate_evidence(analysis(compensation="₹100000"), JD)
    bad = analysis()
    bad.skills[0].profileSkill = "Invented skill"
    with pytest.raises(ValueError):
        validate_evidence(bad, JD)


def test_extraction_and_ssrf_checks():
    assert (
        canonical_url("https://example.com/job?utm_source=x&id=1#top")
        == "https://example.com/job?id=1"
    )
    for url in [
        "http://127.0.0.1/job",
        "http://169.254.169.254/latest",
        "http://10.0.0.1",
        "file:///tmp/a",
        "https://u:p@example.com",
    ]:
        with pytest.raises(ValueError):
            canonical_url(url)
    assert not public_address("::ffff:127.0.0.1") and not public_address("100.64.0.1")
    raw = (
        '<script type="application/ld+json">'
        + json.dumps({"@type": "JobPosting", "title": "Python Developer", "description": JD})
        + "</script>"
    )
    result = extract_html(raw, "https://example.com/job")
    assert result["title"] == "Python Developer" and complete_description(result["description"])


def test_langgraph_checkpoint_resumes_without_repeating_discovery(monkeypatch):
    from job_radar import discovery

    db = FakeDb(Settings(_env_file=None, auth_mode="local", max_queries=1, max_candidates=2))
    run = str(uuid4())
    db.tables["collector_runs"] = [{"id": run, "checkpoint": {}}]
    candidates = [
        dict(
            id=str(uuid4()),
            url=f"https://example.com/job/{i}",
            status="pending",
            attempts=0,
            description=JD,
        )
        for i in range(2)
    ]
    db.tables["collector_candidates"] = candidates

    class Store:
        def __init__(self):
            self.db = db

        def save_candidates(self, rows):
            pass

        def candidates(self, write):
            return candidates

        def update_candidate(self, ident, values):
            db.patch("collector_candidates", values, id="eq." + ident)

        def publish(self, *args):
            raise AssertionError("Preview must not publish")

    searches = []
    monkeypatch.setattr(discovery, "search", lambda q, store: searches.append(q) or [])
    monkeypatch.setattr(discovery, "feed_jobs", lambda source: [])
    monkeypatch.setattr(discovery, "rss_jobs", lambda source: [])
    count = 0

    def interrupted():
        nonlocal count
        count += 1
        if count == 8:
            raise InterruptedError("simulated restart")

    saver = SupabaseSaver(db, run)
    cfg = {"configurable": {"thread_id": run}}
    graph = build_graph(
        Store(),
        False,
        saver,
        interrupted,
        planner=lambda s: ["python jobs"],
        analyzer=lambda d, s: analysis(),
    )
    with pytest.raises(InterruptedError):
        graph.invoke({}, cfg, durability="sync")
    # Recreate saver and graph just as a restarted process does.
    graph = build_graph(
        Store(),
        False,
        SupabaseSaver(db, run),
        planner=lambda s: ["must not repeat"],
        analyzer=lambda d, s: analysis(),
    )
    final = graph.invoke(None, cfg, durability="sync")
    assert searches == ["python jobs"]
    assert final["summary"]["processed"] == 2
    assert all(r["status"] == "shortlisted" for r in db.tables["collector_candidates"])


def test_runtime_lease_prevents_overlap_and_write_guard(monkeypatch):
    from job_radar.runtime import CollectorRuntime
    from job_radar import runtime as module

    monkeypatch.setattr(module, "available_models", lambda s: [object()])
    s = Settings(
        _env_file=None, auth_mode="local", tavily_api_key="test", old_collector_disabled=False
    )
    db = FakeDb(s)
    runtime = CollectorRuntime(db)
    with pytest.raises(ApiError) as e:
        runtime._prepare(True)
    assert e.value.status == 409
    original_rpc = db.rpc
    db.rpc = lambda name, args: False if name == "collector_acquire" else original_rpc(name, args)
    with pytest.raises(ApiError) as e:
        runtime._prepare(False)
    assert e.value.status == 409 and not db.tables["collector_runs"]


def test_source_connection_rejects_dns_rebinding(monkeypatch):
    import asyncio
    from aiohttp.resolver import ThreadedResolver

    async def resolve(self, host, port=0, family=0):
        return [{"host": "127.0.0.1"}]

    monkeypatch.setattr(ThreadedResolver, "resolve", resolve)

    async def check():
        resolver = PublicResolver()
        try:
            with pytest.raises(ValueError):
                await resolver.resolve("public-looking.example", 443)
        finally:
            await resolver.close()

    asyncio.run(check())
