import { createClient } from "@supabase/supabase-js";

import type { Analysis } from "./analysis";
import { score } from "./analysis";
import type { Extracted } from "./extract";
export type Candidate = {
  id: string;
  url: string;
  title?: string;
  company?: string;
  status: string;
  attempts: number;
  content_hash?: string;
  profile_version?: string;
  analysis?: Analysis;
  description?: string;
  updated_at?: string;
};
export class Store {
  readonly db = collectorDatabase();
  async checked<T>(
    result: PromiseLike<{ data: T; error: unknown }>,
  ): Promise<T> {
    const { data, error } = await result;
    if (error)
      throw new Error(
        "Collector persistence failed. Check database provisioning.",
      );
    return data;
  }
  async reserve(provider: "tavily" | "firecrawl", credits = 1) {
    const upper = provider.toUpperCase();
    const n = (key: string, fallback: number) => {
      const v = Number(process.env[key] ?? fallback);
      if (!Number.isInteger(v) || v < 0)
        throw new Error("Invalid credit budget.");
      return v;
    };
    const data = await this.checked(
      this.db.rpc("collector_reserve_credit", {
        p_provider: provider,
        p_daily: n(upper + "_DAILY_LIMIT", 20),
        p_monthly: n(upper + "_MONTHLY_LIMIT", 900),
        p_credits: credits,
      }),
    );
    if (data !== true) throw new Error(`${provider} credit budget exhausted.`);
  }
  async saveCandidate(url: string, title?: string, company?: string) {
    await this.checked(
      this.db
        .from("collector_candidates")
        .upsert(
          { url, title, company },
          { onConflict: "url", ignoreDuplicates: true },
        ),
    );
  }
  async candidates(limit: number) {
    return (await this.checked(
      this.db
        .from("collector_candidates")
        .select("*")
        .order("updated_at", { ascending: true })
        .limit(limit),
    )) as Candidate[];
  }
  async updateCandidate(id: string, values: Record<string, unknown>) {
    await this.checked(
      this.db
        .from("collector_candidates")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", id),
    );
  }
  async publish(extracted: Extracted, a: Analysis) {
    const s = score(a);
    return this.checked(
      this.db.rpc("collector_ingest", {
        p_profile: "skills-v2",
        p_job: {
          canonical_url: extracted.url,
          apply_url: extracted.url,
          company: a.company,
          title: a.title,
          description: extracted.description,
          location_text: a.location,
          work_mode: a.workMode,
          eligible_from_india: a.indiaEligibility,
          employment_type: a.employmentType,
          experience_text: a.experienceText,
          minimum_experience_years: a.minimumYears,
          degree_requirements: a.degreeRequirements,
          compensation_text: a.compensation,
          currency: a.currency,
          required_skills: a.skills
            .filter((x) => x.importance === "required")
            .map((x) => x.name),
          preferred_skills: a.skills
            .filter((x) => x.importance === "preferred")
            .map((x) => x.name),
          responsibilities: a.responsibilities.map((x) => x.name),
          posting_status: a.postingStatus,
          source_type: extracted.method,
        },
        p_match: {
          technical_score: s.technical,
          role_score: s.role,
          experience_score: s.experience,
          total_score: s.total,
          matching_evidence: a.skills
            .filter((x) => x.fit === "matched" || x.fit === "transferable")
            .map((x) => `${x.name}: ${x.fit}. JD: ${x.evidence}`),
          missing_requirements: a.skills
            .filter((x) => x.fit === "missing" || x.fit === "unknown")
            .map((x) => x.name),
          recommendation: a.summary,
        },
      }),
    );
  }
}

function collectorDatabase() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new Error("Collector database configuration is missing.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(15000) }),
    },
  });
}
