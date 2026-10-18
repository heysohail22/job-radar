"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest } from "@/lib/server/backend";
export async function login(form: FormData) {
  let session: { access_token: string; refresh_token: string };
  try {
    session = await backendRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
  } catch {
    redirect("/login?error=1");
  }
  const jar = await cookies();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
  jar.set("jr-access", session.access_token, options);
  jar.set("jr-refresh", session.refresh_token, options);
  redirect("/");
}
export async function logout() {
  try {
    await backendRequest("/api/auth/logout", { method: "POST", body: "{}" });
  } catch {}
  const jar = await cookies();
  jar.delete("jr-access");
  jar.delete("jr-refresh");
  redirect("/");
}
