import Link from "next/link";
import { backendRequest, localWorkspace } from "@/lib/server/backend";
import { safeApplicationUrl } from "@job-radar/contracts";
export default async function Review() {
  let candidates: Record<string, unknown>[] = [],
    runs: Record<string, unknown>[] = [],
    error = "";
  try {
    [candidates, runs] = await Promise.all([
      backendRequest<Record<string, unknown>[]>("/api/candidates"),
      backendRequest<Record<string, unknown>[]>("/api/runs"),
    ]);
  } catch {
    error = "Sign in and start the backend to view collector results.";
  }
  return (
    <main
      id="main-content"
      style={{ maxWidth: 1000, margin: "auto", padding: 24 }}
    >
      <Link href="/">← Jobs</Link>
      <h1>Collector and candidate review</h1>
      {error && (
        <p role="alert">
          {error} {!localWorkspace() && <Link href="/login">Sign in</Link>}
        </p>
      )}
      <h2>Recent runs</h2>
      {!runs.length && (
        <p>
          No runs recorded yet. Configure collector/.env and run pnpm
          collect:preview.
        </p>
      )}
      {runs.map((r) => (
        <article key={String(r.id)}>
          <h3>
            {String(r.status)} — {String(r.started_at)}
          </h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(r.summary, null, 2)}
          </pre>
        </article>
      ))}
      <h2>Needs checking and recent candidates</h2>
      {candidates.map((c) => (
        <article
          key={String(c.id)}
          style={{ borderBottom: "1px solid #aab", padding: 16 }}
        >
          <h3>{String(c.title ?? "Candidate awaiting extraction")}</h3>
          <p>
            {String(c.company ?? "")} · {String(c.status)} ·{" "}
            {c.score == null ? "Not scored" : String(c.score) + "% fit"}
          </p>
          <p>{String(c.reason ?? "Waiting for collection")}</p>
          {safeApplicationUrl(c.url) && (
            <a href={String(c.url)} target="_blank" rel="noopener noreferrer">
              Original source ↗
            </a>
          )}
        </article>
      ))}
    </main>
  );
}
