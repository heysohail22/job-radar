import { z } from "zod";
const requirement = z.object({
  name: z.string().min(1),
  importance: z.enum(["required", "preferred"]),
  fit: z.enum(["matched", "transferable", "missing", "unknown"]),
  evidence: z.string().min(1),
  profileSkill: z.string().nullable(),
});
export const analysisSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().nullable(),
  workMode: z.enum(["remote", "hybrid", "onsite", "unknown"]),
  indiaEligibility: z.enum(["yes", "no", "unclear"]),
  eligibilityEvidence: z.string(),
  mandatoryBlockers: z.array(
    z.object({ reason: z.string(), evidence: z.string().min(1) }),
  ),
  employmentType: z.string().nullable(),
  compensation: z.string().nullable(),
  currency: z.string().nullable(),
  experienceText: z.string().nullable(),
  minimumYears: z.number().min(0).nullable(),
  experienceMandatory: z.boolean(),
  experienceFit: z.enum([
    "entry",
    "preferred-gap",
    "stretch",
    "senior",
    "unknown",
  ]),
  experienceEvidence: z.string(),
  degreeRequirements: z.array(z.string()),
  postingStatus: z.enum(["open", "closed", "uncertain"]),
  postingEvidence: z.string(),
  skills: z.array(requirement).min(1),
  responsibilities: z.array(requirement).min(1),
  summary: z.string(),
});
export type Analysis = z.infer<typeof analysisSchema>;
export function validateEvidence(
  a: Analysis,
  description: string,
  skills: readonly string[],
) {
  const norm = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim();
  const body = norm(description);
  for (const value of [
    a.compensation,
    a.experienceText,
    ...a.degreeRequirements,
  ]) {
    if (value && !body.includes(norm(value)))
      throw new Error("Extracted facts must be verbatim JD text.");
  }
  if (a.currency && !body.includes(norm(a.currency))) a.currency = null;
  const evidence = [...a.skills, ...a.responsibilities, ...a.mandatoryBlockers];
  for (const item of evidence)
    if (!body.includes(norm(item.evidence)))
      throw new Error("Analysis contains unsupported JD evidence.");
  for (const quote of [
    a.eligibilityEvidence,
    a.experienceEvidence,
    a.postingEvidence,
  ])
    if (quote && !body.includes(norm(quote)))
      throw new Error(
        "Analysis contains unsupported eligibility or experience evidence.",
      );
  for (const item of [...a.skills, ...a.responsibilities])
    if (
      ["matched", "transferable"].includes(item.fit) &&
      (!item.profileSkill ||
        !skills.some((s) => norm(s) === norm(item.profileSkill!)))
    )
      throw new Error("Analysis claims a skill outside the approved profile.");
  if (a.indiaEligibility !== "unclear" && !a.eligibilityEvidence)
    throw new Error("Eligibility requires evidence.");
  if (a.minimumYears !== null && !a.experienceEvidence)
    throw new Error("Experience requires evidence.");
  if (a.postingStatus !== "uncertain" && !a.postingEvidence)
    throw new Error("Posting status requires evidence.");
  return a;
}
export function score(a: Analysis) {
  const dimension = (items: Analysis["skills"]) => {
    const weights = { matched: 1, transferable: 0.5, missing: 0, unknown: 0 };
    const total = items.reduce(
      (s, r) => s + (r.importance === "required" ? 2 : 1),
      0,
    );
    return total
      ? Math.round(
          (100 *
            items.reduce(
              (s, r) =>
                s + weights[r.fit] * (r.importance === "required" ? 2 : 1),
              0,
            )) /
            total,
        )
      : 0;
  };
  const technical = dimension(a.skills),
    role = dimension(a.responsibilities);
  const experience = {
    entry: 100,
    "preferred-gap": 75,
    stretch: 40,
    senior: 0,
    unknown: 50,
  }[a.experienceFit];
  const total = Math.round(technical * 0.6 + role * 0.25 + experience * 0.15);
  const blocked =
    a.mandatoryBlockers.length > 0 ||
    a.indiaEligibility === "no" ||
    a.postingStatus === "closed" ||
    (a.experienceMandatory && (a.minimumYears ?? 0) > 3) ||
    a.experienceFit === "senior" ||
    /unpaid/i.test(a.employmentType ?? "");
  const unknown =
    a.indiaEligibility === "unclear" ||
    (/intern/i.test(a.employmentType ?? "") && !a.compensation) ||
    a.skills.some((x) => x.importance === "required" && x.fit === "unknown");
  return {
    technical,
    role,
    experience,
    total,
    status: blocked
      ? "rejected"
      : unknown
        ? "uncertain"
        : total >= 60
          ? "shortlisted"
          : "rejected",
    reason: blocked
      ? "A mandatory requirement or availability restriction blocks this role."
      : unknown
        ? "Eligibility or required skills need checking."
        : total >= 60
          ? "Meets the initial skills-fit threshold."
          : "Below the initial skills-fit threshold.",
  };
}
