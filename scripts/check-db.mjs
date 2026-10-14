import { createClient } from "@supabase/supabase-js";
const { SUPABASE_URL, SUPABASE_SECRET_KEY, JOB_RADAR_PROFILE_VERSION } =
  process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !JOB_RADAR_PROFILE_VERSION) {
  console.error("Supabase server configuration is incomplete.");
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (input, init) =>
      fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
  },
});
const { data, error } = await db.rpc("job_radar_feed", {
  p_profile: JOB_RADAR_PROFILE_VERSION,
  p_limit: 1,
});
if (error) {
  console.error(
    "Supabase connection check failed:",
    error.code ?? "network error",
  );
  process.exit(1);
}
if (!data?.summary || !Array.isArray(data.jobs)) {
  console.error("Unexpected database response.");
  process.exit(1);
}
console.log("Supabase connection verified:", JSON.stringify(data.summary));
