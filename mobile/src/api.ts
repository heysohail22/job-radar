import type {
  Feed,
  Filters,
  Job,
  Mutation,
  View,
} from "../../website/lib/types";

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
export const fetchFeed = (view: View, filters: Filters) =>
  request<Feed>(`/api/jobs?${feedQuery(view, filters)}`);
export const fetchJob = (id: string) =>
  request<Job>(`/api/jobs/${encodeURIComponent(id)}`);
export const mutateJob = (job: Job, changes: Omit<Mutation, "revision">) => {
  if (!job.matchId)
    throw new Error("This role has no matching record to update.");
  return request(`/api/matches/${encodeURIComponent(job.matchId)}`, {
    method: "PATCH",
    body: JSON.stringify({ revision: job.revision, ...changes }),
  });
};
