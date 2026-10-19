import json
import math
import re
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

PROFILE = json.loads(Path(__file__).with_name("profile.json").read_text())


class Requirement(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1)
    importance: Literal["required", "preferred"]
    fit: Literal["matched", "transferable", "missing", "unknown"]
    evidence: str = Field(min_length=1)
    profileSkill: str | None


class Blocker(BaseModel):
    reason: str
    evidence: str = Field(min_length=1)


class Analysis(BaseModel):
    model_config = ConfigDict(extra="forbid")
    isSingleJob: bool
    title: str = Field(min_length=1)
    company: str = Field(min_length=1)
    location: str | None
    workMode: Literal["remote", "hybrid", "onsite", "unknown"]
    indiaEligibility: Literal["yes", "no", "unclear"]
    eligibilityEvidence: str
    mandatoryBlockers: list[Blocker]
    employmentType: str | None
    compensation: str | None
    currency: str | None
    experienceText: str | None
    minimumYears: float | None = Field(ge=0)
    experienceMandatory: bool
    experienceFit: Literal["entry", "preferred-gap", "stretch", "senior", "unknown"]
    experienceEvidence: str
    degreeRequirements: list[str]
    postingStatus: Literal["open", "closed", "uncertain"]
    postingEvidence: str
    skills: list[Requirement]
    responsibilities: list[Requirement]
    summary: str


def validate_evidence(a: Analysis, description: str):
    def norm(v):
        return " ".join(v.lower().split())

    body = norm(description)
    mode_terms = {
        "remote": r"\bremote\b|telecommut|work.from.home",
        "hybrid": r"\bhybrid\b",
        "onsite": r"on[ -]?site|in[ -]?person|in[ -]?office|work.from.office",
    }
    if a.workMode in mode_terms and not re.search(mode_terms[a.workMode], description, re.I):
        a.workMode = "unknown"  # A physical office address alone does not prove onsite work.
    if not a.isSingleJob:
        raise ValueError("Analysis contains a listing page, not one job.")
    if not a.skills or not a.responsibilities:
        raise ValueError("Analysis contains insufficient requirements.")
    for field, value in [
        ("compensation", a.compensation),
        ("experienceText", a.experienceText),
        *[("degreeRequirements", x) for x in a.degreeRequirements],
    ]:
        if value and norm(value) not in body:
            raise ValueError(f"Extracted facts: {field} must be verbatim JD text or absent.")
    if a.currency and norm(a.currency) not in body:
        a.currency = None
    for field, unknown in (
        ("eligibilityEvidence", a.indiaEligibility == "unclear"),
        ("postingEvidence", a.postingStatus == "uncertain"),
        ("experienceEvidence", a.experienceFit == "unknown" and a.minimumYears is None),
    ):
        if getattr(a, field) and norm(getattr(a, field)) not in body:
            if unknown:
                setattr(a, field, "")
            else:
                raise ValueError(
                    f"Analysis contains unsupported {field}; copy a contiguous quote or classify unknown."
                )
    for group in ("skills", "responsibilities", "mandatoryBlockers"):
        for index, item in enumerate(getattr(a, group)):
            if norm(item.evidence) not in body:
                raise ValueError(
                    f"Analysis contains unsupported {group}[{index}].evidence; copy a short exact source quote."
                )
    for blocker in a.mandatoryBlockers:
        if re.search(r"experience|background|skills", blocker.reason, re.I) and not re.search(
            r"degree|licen[cs]e|authoriz|citizen|resident|visa|work permit|senior|lead|staff|principal|\d+\s*(?:[-–]\s*\d+)?\+?\s*years?",
            blocker.evidence,
            re.I,
        ):
            raise ValueError(
                "Analysis contains a skills/background gap incorrectly treated as a hard blocker. Assess it in skills/responsibilities; do not invent professional experience requirements."
            )
    approved = {norm(s) for s in PROFILE["skills"]}
    for item in [*a.skills, *a.responsibilities]:
        if (
            item.fit in ("matched", "transferable")
            and norm(item.profileSkill or "") not in approved
        ):
            raise ValueError("Analysis claims a skill outside the approved profile.")
    if (
        a.indiaEligibility != "unclear"
        and not a.eligibilityEvidence
        or a.minimumYears is not None
        and not a.experienceEvidence
        or a.postingStatus != "uncertain"
        and not a.postingEvidence
    ):
        raise ValueError("A factual classification requires evidence.")
    return a


def score(a: Analysis):
    def rounding(v):
        return math.floor(v + 0.5)

    def dimension(items):
        weights = {"matched": 1, "transferable": 0.5, "missing": 0, "unknown": 0}
        total = sum(2 if r.importance == "required" else 1 for r in items)
        return (
            rounding(
                100
                * sum(weights[r.fit] * (2 if r.importance == "required" else 1) for r in items)
                / total
            )
            if total
            else 0
        )

    technical, role = dimension(a.skills), dimension(a.responsibilities)
    experience_fit = a.experienceFit
    if a.experienceMandatory and (a.minimumYears or 0) > PROFILE["professionalExperienceYears"]:
        experience_fit = "senior" if a.minimumYears > 3 else "stretch"
    elif (a.minimumYears or 0) > PROFILE[
        "professionalExperienceYears"
    ] and experience_fit == "entry":
        experience_fit = "preferred-gap"
    experience = {"entry": 100, "preferred-gap": 75, "stretch": 40, "senior": 0, "unknown": 50}[
        experience_fit
    ]
    total = rounding(technical * 0.6 + role * 0.25 + experience * 0.15)
    blocked = (
        bool(a.mandatoryBlockers)
        or a.indiaEligibility == "no"
        or a.postingStatus == "closed"
        or (a.experienceMandatory and (a.minimumYears or 0) > 3)
        or a.experienceFit == "senior"
        or "unpaid" in (a.employmentType or "").lower()
    )
    unknown = (
        a.indiaEligibility == "unclear"
        or ("intern" in (a.employmentType or "").lower() and not a.compensation)
        or any(r.importance == "required" and r.fit == "unknown" for r in a.skills)
    )
    status = (
        "rejected"
        if blocked
        else "uncertain"
        if unknown
        else "shortlisted"
        if total >= 70
        else "rejected"
    )
    return dict(
        technical=technical,
        role=role,
        experience=experience,
        total=total,
        status=status,
        reason="A mandatory restriction blocks this role."
        if blocked
        else "Eligibility or required skills need checking."
        if unknown
        else "Meets the initial skills-fit threshold."
        if total >= 70
        else "Below the initial skills-fit threshold.",
    )
