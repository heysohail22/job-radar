import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { database } from "../src/database";
const db = database(),
  snapshot: Record<string, unknown> = {
    project: "tybrswbrqmoxznizheuu",
    createdAt: new Date().toISOString(),
  };
for (const table of ["jobs", "job_matches", "job_workspace_state"]) {
  const all: unknown[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await db
      .from(table)
      .select("*")
      .order(table === "job_workspace_state" ? "match_id" : "id")
      .range(from, from + 499);
    if (error) throw new Error("Backup read failed.");
    all.push(...data);
    if (data.length < 500) break;
  }
  snapshot[table] = all;
}
const jobs = snapshot.jobs as { id: string }[],
  matches = snapshot.job_matches as { id: string; job_id: string }[],
  states = snapshot.job_workspace_state as { match_id: string }[];
if (
  matches.some((m) => !jobs.some((j) => j.id === m.job_id)) ||
  states.some((s) => !matches.some((m) => m.id === s.match_id))
)
  throw new Error("Backup references are invalid.");
await mkdir("../.local/backups", { recursive: true, mode: 0o700 });
const path = `../.local/backups/jobs-${Date.now()}.json`,
  content = JSON.stringify(snapshot, null, 2);
await writeFile(path, content, { mode: 0o600, flag: "wx" });
const digest = createHash("sha256").update(content).digest("hex");
if (
  createHash("sha256")
    .update(await readFile(path))
    .digest("hex") !== digest
)
  throw new Error("Backup verification failed.");
await writeFile(path + ".sha256", digest + "\n", { mode: 0o600 });
console.log(
  JSON.stringify({
    backup: path,
    sha256: digest,
    counts: {
      jobs: jobs.length,
      matches: matches.length,
      states: states.length,
    },
  }),
);
