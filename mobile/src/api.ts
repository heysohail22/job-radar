import type {
  Feed,
  Filters,
  Job,
  Mutation,
  View,
} from "../../website/lib/types";
import { mapJob } from "../../website/lib/jobs";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function apiOrigin(
  value = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3000",
) {
  const url = new URL(value);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.protocol !== "http:" ||
    url.username ||
    url.password ||
    url.pathname !== "/"
  ) {
    throw new Error("Use a local API URL, for example http://127.0.0.1:3000.");
  }
  return url.origin;
}
export function feedQuery(view: View, filters: Filters) {
  return new URLSearchParams({
    view,
    q: filters.search,
    mode: filters.mode,
    location: filters.location,
    score: String(filters.minScore),
    posting: filters.posting,
    sort: filters.sort,
    page: String(filters.page),
    stage: filters.stage,
  }).toString();
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const origin = apiOrigin();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${origin}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        ...init?.headers,
      },
    });
    const data = await response.json();
    if (!response.ok)
      throw new ApiError(
        data.error ?? "The request failed. Please retry.",
        response.status,
      );
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(
      "Cannot connect to your computer. Start AI Job Radar on your computer and reconnect your phone, then tap Retry.",
    );
  } finally {
    clearTimeout(timer);
  }
}
// Publishable credentials are deliberately public; database grants/RLS enforce access.
const publicOrigin = "https://tybrswbrqmoxznizheuu.supabase.co";
const publishableKey = "sb_publishable_wZMB1QqnbCYDJQWfDl3Hwg_cycZOlCM";
export async function fetchPublicFeed(
  filters: Filters,
  jobId?: string,
): Promise<Feed> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(
      `${publicOrigin}/rest/v1/rpc/job_radar_public_feed`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { apikey: publishableKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          p_search: filters.search,
          p_mode: filters.mode,
          p_location: filters.location,
          p_posting: filters.posting,
          p_sort: filters.sort === "company" ? "company" : "recent",
          p_limit: 20,
          p_offset: (filters.page - 1) * 20,
          ...(jobId ? { p_job_id: jobId } : {}),
        }),
      },
    );
    if (!response.ok)
      throw new Error("Jobs could not be loaded. Please try again.");
    const data = await response.json();
    if (
      !Array.isArray(data.jobs) ||
      !data.summary ||
      typeof data.total !== "number"
    )
      throw new Error("Jobs could not be loaded. Please try again.");
    return {
      jobs: data.jobs.map(mapJob),
      total: data.total,
      // These private counts are not provided by the public endpoint and are not displayed.
      summary: {
        ...data.summary,
        saved: 0,
        applied: 0,
        interview: 0,
        offer: 0,
        tracked: 0,
      },
    };
  } catch (error) {
    if (error instanceof TypeError || controller.signal.aborted)
      throw new Error(
        "Cannot connect to jobs. Check your internet connection, then retry.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export const fetchFeed = (view: View, filters: Filters) =>
  view === "discover"
    ? fetchPublicFeed(filters)
    : request<Feed>(`/api/jobs?${feedQuery(view, filters)}`);
export const fetchJob = async (id: string, personal = false): Promise<Job> => {
  if (personal) return request<Job>(`/api/jobs/${encodeURIComponent(id)}`);
  const feed = await fetchPublicFeed(
    {
      search: "",
      mode: "all",
      location: "",
      minScore: 0,
      posting: "all",
      sort: "recent",
      page: 1,
      stage: "all",
    },
    id,
  );
  if (!feed.jobs[0])
    throw new ApiError("This job is no longer available.", 404);
  return feed.jobs[0];
};
export const mutateJob = (job: Job, changes: Omit<Mutation, "revision">) => {
  if (!job.matchId)
    throw new Error("This role has no matching record to update.");
  return request(`/api/matches/${encodeURIComponent(job.matchId)}`, {
    method: "PATCH",
    body: JSON.stringify({ revision: job.revision, ...changes }),
  });
};
