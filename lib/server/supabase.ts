import "server-only";
import { createClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/validation";
export function getDatabase() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new AppError(
      "Add the Supabase server configuration to .env.local, then restart the website.",
      503,
    );
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }),
    },
  });
}
export function getProfile() {
  const profile = process.env.JOB_RADAR_PROFILE_VERSION;
  if (!profile)
    throw new AppError(
      "Choose JOB_RADAR_PROFILE_VERSION in .env.local before loading your workspace.",
      503,
    );
  return profile;
}
