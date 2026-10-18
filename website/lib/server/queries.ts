import "server-only";
import type { Feed, Filters, Job, Mutation, View } from "@job-radar/contracts";
import { AppError, isUuid } from "@job-radar/contracts";
import { backendRequest, signedIn } from "./backend";
export const PAGE_SIZE = 20;
export async function getFeed(view: View, filters: Filters): Promise<Feed> {
  const personal = await signedIn();
  if (!personal && view !== "discover")
    throw new AppError(
      "Sign in to view your saved jobs and applications.",
      401,
    );
  const params = new URLSearchParams({
    view,
    q: filters.search,
    mode: filters.mode,
    location: filters.location,
    score: String(filters.minScore),
    posting: filters.posting,
    sort: filters.sort,
    page: String(filters.page),
    stage: filters.stage,
  });
  return backendRequest<Feed>(
    `${personal ? "/api/jobs" : "/api/public/jobs"}?${params}`,
  );
}
export async function getJob(id: string): Promise<Job | null> {
  if (!isUuid(id)) return null;
  try {
    return await backendRequest<Job>(
      `${(await signedIn()) ? "/api/jobs" : "/api/public/jobs"}/${id}`,
    );
  } catch (e) {
    if (e instanceof AppError && e.status === 404) return null;
    throw e;
  }
}
export async function updateMatch(id: string, body: Mutation) {
  if (!isUuid(id)) throw new AppError("Invalid matching-record ID.", 400);
  return backendRequest(`/api/matches/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
