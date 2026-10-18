import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import {
  AppError,
  isUuid,
  parseFilters,
  parseMutation,
  type View,
} from "@job-radar/contracts";
import { database, feed, update, type Database } from "./database";
export function buildApp(options: { db?: Database; ownerId?: string } = {}) {
  const app = Fastify({
    bodyLimit: 8192,
    logger: false,
    requestTimeout: 30000,
  });
  const db = () => options.db ?? database();
  const ownerId = () => options.ownerId ?? process.env.OWNER_USER_ID;
  app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
  app.addHook("onRequest", async (req, reply) => {
    reply.header("Cache-Control", "no-store");
    const origin = req.headers.origin;
    const allowed = (
      process.env.WEBSITE_ORIGINS ??
      "http://127.0.0.1:3000,http://localhost:3000"
    ).split(",");
    if (origin && !allowed.includes(origin))
      throw new AppError("Origin is not allowed.", 403);
    if (origin)
      reply
        .header("Access-Control-Allow-Origin", origin)
        .header("Vary", "Origin");
    if (req.method === "OPTIONS")
      return reply
        .header("Access-Control-Allow-Headers", "Authorization,Content-Type")
        .header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS")
        .code(204)
        .send();
  });
  async function owner(token?: string) {
    if (!ownerId())
      throw new AppError("Owner account has not been configured.", 503);
    if (!token?.startsWith("Bearer "))
      throw new AppError("Sign in to your workspace.", 401);
    const { data, error } = await db().auth.getUser(token.slice(7));
    if (error || !data.user)
      throw new AppError("Your session expired. Sign in again.", 401);
    if (data.user.id !== ownerId())
      throw new AppError("This workspace is owner-only.", 403);
  }
  app.setErrorHandler((error, _req, reply) => {
    const code =
      error && typeof error === "object" && "statusCode" in error
        ? Number(error.statusCode)
        : 500;
    const status =
      error instanceof AppError
        ? error.status
        : code >= 400 && code < 500
          ? code
          : 500;
    reply.code(status).send({
      error:
        error instanceof AppError
          ? error.message
          : status === 429
            ? "Too many requests. Try again shortly."
            : status === 400
              ? "Invalid request."
              : "The request could not be completed.",
    });
  });
  app.get("/health", async () => ({ ok: true }));
  app.post(
    "/api/auth/login",
    { config: { rateLimit: { max: 8, timeWindow: "1 minute" } } },
    async (req) => {
      if (!ownerId())
        throw new AppError("Owner account has not been configured.", 503);
      const b = req.body as Record<string, unknown> | null;
      if (
        !b ||
        typeof b.email !== "string" ||
        typeof b.password !== "string" ||
        b.email.length > 254 ||
        b.password.length > 512
      )
        throw new AppError("Enter your email and password.", 400);
      const { data, error } = await db().auth.signInWithPassword({
        email: b.email,
        password: b.password,
      });
      if (error || !data.session || data.user?.id !== ownerId())
        throw new AppError("Sign-in failed.", 401);
      return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      };
    },
  );
  app.post(
    "/api/auth/refresh",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (req) => {
      const b = req.body as { refresh_token?: string };
      if (
        !b ||
        typeof b.refresh_token !== "string" ||
        b.refresh_token.length > 4096
      )
        throw new AppError("Invalid session.", 400);
      const { data, error } = await db().auth.refreshSession({
        refresh_token: b.refresh_token,
      });
      if (error || !data.session || data.user?.id !== ownerId())
        throw new AppError("Sign in again.", 401);
      return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      };
    },
  );
  app.get("/api/auth/me", async (req) => {
    await owner(req.headers.authorization);
    return { owner: true };
  });
  app.post("/api/auth/logout", async (req) => {
    await owner(req.headers.authorization);
    await db().auth.admin.signOut(req.headers.authorization!.slice(7), "local");
    return { ok: true };
  });
  app.get("/api/public/jobs", async (req) =>
    feed(
      db(),
      "discover",
      parseFilters(new URL(req.url, "http://local").searchParams),
      undefined,
      true,
    ),
  );
  app.get<{ Params: { id: string } }>("/api/public/jobs/:id", async (req) => {
    if (!isUuid(req.params.id)) throw new AppError("Invalid job ID.", 400);
    const result = await feed(
      db(),
      "discover",
      parseFilters(new URLSearchParams()),
      req.params.id,
      true,
    );
    if (!result.jobs[0]) throw new AppError("Job not found.", 404);
    return result.jobs[0];
  });
  app.get("/api/jobs", async (req) => {
    await owner(req.headers.authorization);
    const p = new URL(req.url, "http://local").searchParams,
      view = p.get("view") ?? "discover";
    if (!["discover", "saved", "applications"].includes(view))
      throw new AppError("Invalid view.", 400);
    return feed(db(), view as View, parseFilters(p));
  });
  app.get<{ Params: { id: string } }>("/api/jobs/:id", async (req) => {
    await owner(req.headers.authorization);
    if (!isUuid(req.params.id)) throw new AppError("Invalid job ID.", 400);
    const result = await feed(
      db(),
      "discover",
      parseFilters(new URLSearchParams()),
      req.params.id,
    );
    if (!result.jobs[0]) throw new AppError("Job not found.", 404);
    return result.jobs[0];
  });
  app.patch<{ Params: { id: string } }>("/api/matches/:id", async (req) => {
    await owner(req.headers.authorization);
    if (!isUuid(req.params.id)) throw new AppError("Invalid match ID.", 400);
    return update(db(), req.params.id, parseMutation(req.body));
  });
  for (const table of ["collector_runs", "collector_candidates"] as const)
    app.get(
      "/api/" + (table === "collector_runs" ? "runs" : "candidates"),
      async (req) => {
        await owner(req.headers.authorization);
        const { data, error } = await db()
          .from(table)
          .select(
            table === "collector_runs"
              ? "id,started_at,finished_at,status,summary"
              : "id,url,title,company,status,score,reason,updated_at",
          )
          .order(table === "collector_runs" ? "started_at" : "updated_at", {
            ascending: false,
          })
          .limit(100);
        if (error)
          throw new AppError("Collector records could not be loaded.", 502);
        return data;
      },
    );
  return app;
}
