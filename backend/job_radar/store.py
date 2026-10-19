from datetime import datetime, timezone, timedelta
import re
from .analysis import score


def now():
    return datetime.now(timezone.utc).isoformat()


class Store:
    def __init__(self, db):
        self.db = db

    def reserve(self, provider):
        s = self.db.settings
        if (
            self.db.rpc(
                "collector_reserve_credit",
                dict(
                    p_provider=provider,
                    p_daily=getattr(s, provider + "_daily_limit"),
                    p_monthly=getattr(s, provider + "_monthly_limit"),
                    p_credits=1,
                ),
            )
            is not True
        ):
            raise ValueError("Provider credit budget exhausted.")

    def save_candidates(self, items):
        rows = list(
            {
                r["url"]: dict(url=r["url"], title=r.get("title"), company=r.get("company"))
                for r in items
            }.values()
        )
        for i in range(0, len(rows), 100):
            self.db.insert("collector_candidates", rows[i : i + 100], conflict="url", ignore=True)

    def candidates(self, write):
        current = datetime.now(timezone.utc)
        day = (current - timedelta(days=1)).isoformat()
        three = (current - timedelta(days=3)).isoformat()
        conditions = [
            "status.eq.pending",
            f"and(status.eq.deferred,updated_at.lt.{day})",
            f"and(status.neq.pending,status.neq.deferred,updated_at.lt.{three})",
        ]
        if write:
            conditions.append("and(status.eq.shortlisted,published_at.is.null)")
        rows = self.db.rows(
            "collector_candidates",
            select="*",
            order="updated_at.asc",
            limit="500",
            **{"or": "(" + ",".join(conditions) + ")"},
        )
        # Mix recent discoveries with the backlog so fresh employer vacancies
        # cannot be starved behind hundreds of old search/index pages.
        recent = self.db.rows(
            "collector_candidates",
            select="*",
            status="eq.pending",
            order="updated_at.desc",
            limit="500",
        )
        ready = self.db.rows(
            "collector_candidates",
            select="*",
            status="eq.pending",
            description="not.is.null",
            order="updated_at.desc",
            limit="100",
        )
        cached = (
            self.db.rows(
                "collector_candidates",
                select="*",
                status="eq.shortlisted",
                published_at="is.null",
                profile_version="eq.skills-v2",
                limit="500",
            )
            if write
            else []
        )

        def rank(c):
            title = c.get("title") or ""
            return (
                (1000 if c["status"] == "shortlisted" and not c.get("published_at") else 0)
                + (200 if c.get("description") and len(c["description"]) >= 500 else 0)
                + (
                    100
                    if re.search(r"jobs\.(lever|ashbyhq)\.com|boards\.greenhouse\.io", c["url"])
                    else 0
                )
                + (
                    200
                    if re.search(
                        r"junior|intern|graduate|associate|trainee|entry|0\s*(?:-|–|to)\s*[123]",
                        title,
                        re.I,
                    )
                    else 0
                )
                + (
                    1000
                    if re.search(
                        r"python|fastapi|generative|genai|llm|rag|agent|automation|\bai\b|backend|software engineer|frontend",
                        title,
                        re.I,
                    )
                    else 0
                )
                - (
                    80
                    if re.search(r"senior|staff|principal|director|head of|lead ", title, re.I)
                    else 0
                )
            )

        return sorted(
            {r["id"]: r for r in cached + ready + recent + rows}.values(), key=rank, reverse=True
        )

    def update_candidate(self, ident, values):
        self.db.patch("collector_candidates", {**values, "updated_at": now()}, id="eq." + ident)

    def publish(self, extracted, a):
        s = score(a)
        self.db.rpc(
            "collector_ingest",
            dict(
                p_profile=self.db.settings.job_radar_profile_version,
                p_job=dict(
                    canonical_url=extracted["url"],
                    apply_url=extracted["url"],
                    company=a.company,
                    title=a.title,
                    description=extracted["description"],
                    location_text=a.location,
                    work_mode=a.workMode,
                    eligible_from_india=a.indiaEligibility,
                    employment_type=a.employmentType,
                    experience_text=a.experienceText,
                    minimum_experience_years=a.minimumYears,
                    degree_requirements=a.degreeRequirements,
                    compensation_text=a.compensation,
                    currency=a.currency,
                    required_skills=[r.name for r in a.skills if r.importance == "required"],
                    preferred_skills=[r.name for r in a.skills if r.importance == "preferred"],
                    responsibilities=[r.name for r in a.responsibilities],
                    posting_status=a.postingStatus,
                    source_type=extracted["method"],
                ),
                p_match=dict(
                    technical_score=s["technical"],
                    role_score=s["role"],
                    experience_score=s["experience"],
                    total_score=s["total"],
                    matching_evidence=[
                        f"{r.name}: {r.fit}. JD: {r.evidence}"
                        for r in a.skills
                        if r.fit in ("matched", "transferable")
                    ],
                    missing_requirements=[
                        r.name for r in a.skills if r.fit in ("missing", "unknown")
                    ],
                    recommendation=a.summary,
                ),
            ),
        )
