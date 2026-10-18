import { database } from "../src/database";
import assert from "node:assert/strict";
const db = database(),
  url = "https://example.com/job-radar-verification-" + Date.now();
const job = {
  canonical_url: url,
  apply_url: url,
  company: "Verification fixture",
  title: "Temporary verification role",
  description:
    "Temporary database persistence verification fixture; removed after the check.",
  work_mode: "remote",
  eligible_from_india: "yes",
  required_skills: ["Python"],
  preferred_skills: [],
  responsibilities: ["Build APIs"],
  posting_status: "uncertain",
};
const match = {
  technical_score: 90,
  experience_score: 100,
  role_score: 90,
  total_score: 92,
  matching_evidence: ["Verification fixture"],
  missing_requirements: [],
  recommendation: "Verification only",
};
let jid: string | undefined;
try {
  const first = await db.rpc("collector_ingest", {
    p_job: job,
    p_match: match,
    p_profile: "skills-v2",
  });
  if (first.error) throw new Error("Initial ingestion failed.");
  jid = first.data;
  const m = await db
    .from("job_matches")
    .select("id")
    .eq("job_id", jid)
    .eq("profile_version", "skills-v2")
    .single();
  if (m.error) throw new Error("Match lookup failed.");
  const applied = await db.rpc("job_radar_update_state", {
    p_match_id: m.data.id,
    p_profile: "skills-v2",
    p_revision: 0,
    p_is_saved: true,
    p_status: "applied",
  });
  if (applied.error) throw new Error("Tracking update failed.");
  const again = await db.rpc("collector_ingest", {
    p_job: job,
    p_match: { ...match, total_score: 95 },
    p_profile: "skills-v2",
  });
  assert.equal(again.data, jid);
  if (again.error) throw new Error("Repeated ingestion failed.");
  const state = await db
    .from("job_workspace_state")
    .select("*")
    .eq("match_id", m.data.id)
    .single();
  assert.equal(state.data.application_status, "applied");
  assert.equal(state.data.is_saved, true);
  const conflict = await db.rpc("job_radar_update_state", {
    p_match_id: m.data.id,
    p_profile: "skills-v2",
    p_revision: 0,
    p_status: "interview",
  });
  assert.equal(conflict.error?.code, "PT409");
  const unsave = await db.rpc("job_radar_update_state", {
    p_match_id: m.data.id,
    p_profile: "skills-v2",
    p_revision: 1,
    p_is_saved: false,
  });
  assert.equal(unsave.data.application_status, "applied");
  console.log(
    "Verified ingestion deduplication, Applied persistence, bookmark independence and stale-revision conflict.",
  );
} finally {
  if (jid) {
    const { error } = await db.from("jobs").delete().eq("id", jid);
    if (error) throw new Error("Verification fixture cleanup failed.");
  }
}
