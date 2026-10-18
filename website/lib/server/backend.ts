import "server-only";
import { cookies } from "next/headers";
import { AppError } from "@job-radar/contracts";
export function backendOrigin() {
  const u = new URL(process.env.BACKEND_URL ?? "http://127.0.0.1:3001");
  if (
    u.username ||
    u.password ||
    u.pathname !== "/" ||
    !(
      u.protocol === "https:" ||
      (u.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname))
    )
  )
    throw new AppError("Invalid backend configuration.", 503);
  return u.origin;
}
export async function backendRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = (await cookies()).get("jr-access")?.value;
  let response: Response;
  try {
    response = await fetch(backendOrigin() + path, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
      signal: AbortSignal.timeout(70000),
    });
  } catch {
    throw new AppError(
      "Cannot connect to the Job Radar backend. Start pnpm backend and retry.",
      503,
    );
  }
  const body = await response.json();
  if (!response.ok)
    throw new AppError(body.error ?? "The request failed.", response.status);
  return body as T;
}
export function localWorkspace() {
  return process.env.AUTH_MODE === "local";
}
export async function signedIn() {
  if (localWorkspace()) return true;
  return !!(await cookies()).get("jr-access")?.value;
}
