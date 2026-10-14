import { notFound } from "next/navigation";
import { Website } from "./website";
import { getFeed, getJob } from "@/lib/server/queries";
import { AppError, parseFilters, safeReturnPath } from "@/lib/validation";
import type { LoadResult, View } from "@/lib/types";
export type Search = Promise<Record<string, string | string[] | undefined>>;
export async function WebsitePage({
  view,
  searchParams,
  jobId,
}: {
  view: View;
  searchParams: Search;
  jobId?: string;
}) {
  const raw = await searchParams,
    p = new URLSearchParams();
  for (const [k, v] of Object.entries(raw))
    if (typeof v === "string") p.set(k, v);
  let filters = parseFilters(new URLSearchParams()),
    result: LoadResult;
  try {
    filters = parseFilters(jobId ? new URLSearchParams() : p);
    const [feed, detail] = await Promise.all([
      getFeed(view, filters),
      jobId ? getJob(jobId) : Promise.resolve(null),
    ]);
    result = { ok: true, feed, detail };
  } catch (e) {
    result = {
      ok: false,
      message:
        e instanceof AppError
          ? e.message
          : "Your workspace could not be loaded. Please try again.",
      setup: e instanceof AppError && e.status === 503,
    };
  }
  if (jobId && result.ok && !result.detail) notFound();
  return (
    <Website
      view={view}
      result={result}
      filters={filters}
      returnTo={safeReturnPath(raw.returnTo)}
    />
  );
}
