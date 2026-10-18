import { createClient } from "@supabase/supabase-js";
import {
  AppError,
  mapJob,
  type Feed,
  type Filters,
  type Mutation,
  type View,
} from "@job-radar/contracts";
export function database() {
  const { SUPABASE_URL: url, SUPABASE_SECRET_KEY: key } = process.env;
  if (!url || !key)
    throw new AppError("Backend database configuration is missing.", 503);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(15000) }),
    },
  });
}
export type Database = ReturnType<typeof database>;
export function profile() {
  return process.env.JOB_RADAR_PROFILE_VERSION ?? "skills-v2";
}
export async function feed(
  db: Database,
  view: View,
  filters: Filters,
  jobId?: string,
  publicOnly = false,
): Promise<Feed> {
  const args = {
    p_search: filters.search,
    p_mode: filters.mode,
    p_location: filters.location,
    p_posting: filters.posting,
    p_sort: publicOnly && filters.sort === "best" ? "recent" : filters.sort,
    p_limit: 20,
    p_offset: (filters.page - 1) * 20,
    ...(jobId ? { p_job_id: jobId } : {}),
  };
  const { data, error } = await db.rpc(
    publicOnly ? "job_radar_public_feed" : "job_radar_feed",
    publicOnly
      ? args
      : {
          ...args,
          p_profile: profile(),
          p_view: view,
          p_min_score: filters.minScore,
          p_stage: filters.stage,
        },
  );
  if (error || !data || !Array.isArray(data.jobs))
    throw new AppError("Jobs could not be loaded.", 502);
  return {
    jobs: data.jobs.map(mapJob),
    total: data.total,
    summary: {
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      tracked: 0,
      ...data.summary,
    },
  };
}
export async function update(db: Database, id: string, change: Mutation) {
  const { data, error } = await db.rpc("job_radar_update_state", {
    p_match_id: id,
    p_profile: profile(),
    p_revision: change.revision,
    p_is_saved: change.isSaved ?? null,
    p_status: change.status ?? null,
  });
  if (error) {
    if (error.code === "40001")
      throw new AppError("This job changed. Refresh and try again.", 409);
    if (error.code === "P0002") throw new AppError("Match not found.", 404);
    throw new AppError("The update could not be saved.", 502);
  }
  return data;
}
