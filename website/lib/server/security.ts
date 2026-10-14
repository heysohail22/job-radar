import "server-only";
import { AppError } from "@/lib/validation";
export function assertLocalRequest(request: Request, mutation = false) {
  const url = new URL(request.url);
  if (!["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname))
    throw new AppError(
      "This personal workspace is available on localhost only.",
      403,
    );
  const host = request.headers.get("host") ?? url.host;
  let incoming: URL;
  try {
    incoming = new URL(`${url.protocol}//${host}`);
  } catch {
    throw new AppError("Invalid request host.", 403);
  }
  if (!["localhost", "127.0.0.1", "[::1]", "::1"].includes(incoming.hostname))
    throw new AppError("Invalid request host.", 403);
  if (mutation) {
    const origin = request.headers.get("origin");
    if (origin !== incoming.origin)
      throw new AppError("This update must come from the local website.", 403);
    const site = request.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none")
      throw new AppError("Cross-site updates are not allowed.", 403);
  }
}
