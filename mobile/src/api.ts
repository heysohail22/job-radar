import type {
  Feed,
  Filters,
  Job,
  Mutation,
  View,
} from "@job-radar/contracts/types";
import { mapJob } from "@job-radar/contracts/jobs";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function apiOrigin(
  value = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3001",
) {
  const url = new URL(value);
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    !(
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    )
  ) {
    throw new Error(
      "Use HTTPS for hosted APIs or HTTP on localhost for local development.",
    );
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
export type Session = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};
let session: Session | null = null;
let saveSession: (session: Session | null) => Promise<void> = async () => {};
let refreshPromise: Promise<void> | null = null;
export function configureSession(
  value: Session | null,
  persist: typeof saveSession,
) {
  session = value;
  saveSession = persist;
}
export function localWorkspace() {
  return (
    process.env.EXPO_PUBLIC_AUTH_MODE !== "owner" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(new URL(apiOrigin()).hostname)
  );
}
export function hasSession() {
  return session !== null || localWorkspace();
}
export async function login(email: string, password: string) {
  const value = await request<Session>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false,
  );
  await saveSession(value);
  session = value;
}
export async function logout() {
  try {
    if (session)
      await request("/api/auth/logout", { method: "POST", body: "{}" });
  } finally {
    session = null;
    await saveSession(null);
  }
}
async function refreshSession() {
  if (!refreshPromise)
    refreshPromise = (async () => {
      if (!session) throw new ApiError("Sign in to your workspace.", 401);
      const value = await request<Session>(
        "/api/auth/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        },
        false,
      );
      await saveSession(value);
      session = value;
    })().finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}
async function request<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
  retried = false,
): Promise<T> {
  if (authenticated && !session && !localWorkspace())
    throw new ApiError(
      "Sign in to view your saved jobs and application progress.",
      401,
    );
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 70000);
  try {
    const response = await fetch(`${apiOrigin()}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(authenticated && session
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
        ...init.headers,
      },
    });
    if (
      response.status === 401 &&
      authenticated &&
      !retried &&
      !localWorkspace()
    ) {
      try {
        await refreshSession();
      } catch {
        session = null;
        await saveSession(null);
        throw new ApiError("Your session expired. Sign in again.", 401);
      }
      return request<T>(path, init, true, true);
    }
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
      "Cannot connect to the backend. For local use, start pnpm backend and reverse port 3001 over ADB, then retry.",
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
export const fetchFeed = async (
  view: View,
  filters: Filters,
  personal = hasSession(),
): Promise<Feed> => {
  if (view === "discover" && !personal && !localWorkspace())
    return fetchPublicFeed(filters);
  try {
    return await request<Feed>(`/api/jobs?${feedQuery(view, filters)}`);
  } catch (error) {
    if (
      view === "discover" &&
      localWorkspace() &&
      !session &&
      !(error instanceof ApiError)
    )
      return fetchPublicFeed(filters);
    throw error;
  }
};
export const fetchJob = async (id: string, personal = false): Promise<Job> => {
  if (personal || hasSession()) {
    try {
      return await request<Job>(`/api/jobs/${encodeURIComponent(id)}`);
    } catch (error) {
      if (personal || session || !localWorkspace() || error instanceof ApiError)
        throw error;
    }
  }
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
