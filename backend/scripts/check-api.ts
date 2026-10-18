import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { database } from "../src/database";
const credentials = await readFile("../.local/owner-access.txt", "utf8");
const email = /Owner email: (.*)/.exec(credentials)![1],
  password = /Temporary password: (.*)/.exec(credentials)![1];
const origin = "http://127.0.0.1:3001";
const login = await fetch(origin + "/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
  signal: AbortSignal.timeout(10000),
});
assert.equal(login.status, 200);
const session = (await login.json()) as { access_token: string };
const headers = {
  Authorization: "Bearer " + session.access_token,
  "Content-Type": "application/json",
};
assert.equal((await fetch(origin + "/api/jobs")).status, 401);
const db = database();
let jid: string | undefined;
try {
  const { data, error } = await db.rpc("collector_ingest", {
    p_profile: "skills-v2",
    p_job: {
      canonical_url: "https://example.com/job-radar-api-" + Date.now(),
      company: "API verification",
      title: "Temporary API verification",
      description: "Temporary persistence check, removed automatically.",
      work_mode: "remote",
      eligible_from_india: "yes",
      posting_status: "uncertain",
      required_skills: [],
      preferred_skills: [],
      responsibilities: [],
    },
    p_match: {
      technical_score: 90,
      role_score: 90,
      experience_score: 100,
      total_score: 92,
      matching_evidence: [],
      missing_requirements: [],
      recommendation: "Verification only",
    },
  });
  if (error) throw new Error("Fixture creation failed.");
  jid = data;
  const detail = await fetch(origin + "/api/jobs/" + jid, { headers });
  assert.equal(detail.status, 200);
  const job = (await detail.json()) as { matchId: string; revision: number };
  const first = await fetch(origin + "/api/matches/" + job.matchId, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      revision: job.revision,
      status: "applied",
      isSaved: true,
    }),
  });
  assert.equal(first.status, 200);
  const conflict = await fetch(origin + "/api/matches/" + job.matchId, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ revision: job.revision, status: "interview" }),
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(conflict.status, 409);
  const fresh = (await (
    await fetch(origin + "/api/jobs/" + jid, { headers })
  ).json()) as { status: string; isSaved: boolean };
  assert.equal(fresh.status, "applied");
  assert.equal(fresh.isSaved, true);
  console.log(
    "Live backend verified: owner sign-in, unauthenticated denial, Applied+Saved persistence, immediate HTTP 409 conflict.",
  );
} finally {
  if (jid) {
    const { error } = await db.from("jobs").delete().eq("id", jid);
    if (error) throw new Error("Fixture cleanup failed.");
  }
  await fetch(origin + "/api/auth/logout", {
    method: "POST",
    headers,
    body: "{}",
  });
}
