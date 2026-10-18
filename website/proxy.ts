import { NextRequest, NextResponse } from "next/server";
export async function proxy(request: NextRequest) {
  if (!["localhost", "127.0.0.1", "[::1]"].includes(request.nextUrl.hostname))
    return new NextResponse(
      "This local website is available on localhost only.",
      { status: 403 },
    );
  const access = request.cookies.get("jr-access")?.value,
    refresh = request.cookies.get("jr-refresh")?.value;
  let exp = 0;
  try {
    exp =
      JSON.parse(
        Buffer.from(access?.split(".")[1] ?? "", "base64url").toString(),
      ).exp ?? 0;
  } catch {}
  if (!refresh || exp > Date.now() / 1000 + 60) return NextResponse.next();
  try {
    const response = await fetch(
      (process.env.BACKEND_URL ?? "http://127.0.0.1:3001") +
        "/api/auth/refresh",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
        signal: AbortSignal.timeout(70000),
      },
    );
    if (!response.ok) {
      if (response.status >= 500) return NextResponse.next();
      const out = NextResponse.redirect(new URL("/login", request.url));
      out.cookies.delete("jr-access");
      out.cookies.delete("jr-refresh");
      return out;
    }
    const session = await response.json();
    request.cookies.set("jr-access", session.access_token);
    request.cookies.set("jr-refresh", session.refresh_token);
    const headers = new Headers(request.headers);
    headers.set("cookie", request.cookies.toString());
    const out = NextResponse.next({ request: { headers } });
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    };
    out.cookies.set("jr-access", session.access_token, options);
    out.cookies.set("jr-refresh", session.refresh_token, options);
    return out;
  } catch {
    return NextResponse.next();
  }
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|figma/).*)"],
};
