import type { Job, JobStatus } from "./types";
import { safeApplicationUrl } from "./validation";
const text = (x: unknown) => (typeof x === "string" && x.trim() ? x : null);
const strings = (x: unknown) =>
  Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : [];
const number = (x: unknown) =>
  typeof x === "number" && Number.isFinite(x) ? x : null;
export function mapJob(r: Record<string, unknown>): Job {
  const evidence = Array.isArray(r.matching_evidence)
    ? r.matching_evidence.flatMap((x) =>
        typeof x === "string"
          ? [x]
          : x &&
              typeof x === "object" &&
              "evidence" in x &&
              typeof x.evidence === "string"
            ? [x.evidence]
            : [],
      )
    : [];
  const scores = [
    ["Technical", "technical_score"],
    ["Projects", "project_score"],
    ["Experience", "experience_score"],
    ["Geography", "geography_score"],
    ["Role", "role_score"],
  ];
  return {
    id: String(r.id),
    matchId: text(r.match_id),
    company: text(r.company) ?? "Company not listed",
    title: text(r.title) ?? "Untitled opportunity",
    location: text(r.location_text),
    mode: text(r.work_mode) ?? "unknown",
    eligibility: text(r.eligible_from_india) ?? "unclear",
    pay: text(r.compensation_text),
    description: text(r.description),
    skills: strings(r.required_skills),
    preferredSkills: strings(r.preferred_skills),
    responsibilities: strings(r.responsibilities),
    missing: strings(r.missing_requirements),
    recommendation: text(r.recommendation),
    evidence,
    score: number(r.total_score),
    breakdown: scores.flatMap(([name, key]) => {
      const value = number(r[key]);
      return value === null ? [] : [{ label: name, value }];
    }),
    applicationUrl: safeApplicationUrl(r.apply_url, r.canonical_url),
    postingStatus: text(r.posting_status) ?? "uncertain",
    firstSeen: text(r.first_seen_at),
    lastVerified: text(r.last_verified_at),
    isSaved: r.is_saved === true,
    status: (text(r.application_status) ?? "new") as JobStatus,
    revision: number(r.revision) ?? 0,
  };
}
export function displayDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(date);
}
