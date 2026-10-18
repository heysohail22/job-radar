import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app";
import type { Database } from "../src/database";
const id = "11111111-1111-4111-8111-111111111111";
function fixture(user = "owner") {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const db = {
    auth: {
      getUser: async (token: string) => ({
        data: { user: token === "valid" ? { id: user } : null },
        error: null,
      }),
    },
    rpc: async (name: string, args: Record<string, unknown>) => {
      calls.push({ name, args });
      return name === "job_radar_update_state"
        ? {
            data: {
              revision: 2,
              application_status: "applied",
              is_saved: true,
            },
            error: null,
          }
        : { data: { jobs: [], total: 0, summary: { total: 0 } }, error: null };
    },
  } as unknown as Database;
  return { app: buildApp({ db, ownerId: "owner" }), calls };
}
test("public browsing never calls the private feed; unauthenticated and other-user mutations fail", async () => {
  const { app, calls } = fixture();
  assert.equal((await app.inject({ url: "/api/public/jobs" })).statusCode, 200);
  assert.equal(calls[0].name, "job_radar_public_feed");
  assert.equal(
    (
      await app.inject({
        method: "PATCH",
        url: `/api/matches/${id}`,
        payload: { revision: 0, status: "applied" },
      })
    ).statusCode,
    401,
  );
  assert.equal(calls.length, 1);
  await app.close();
  const other = fixture("someone-else");
  assert.equal(
    (
      await other.app.inject({
        url: "/api/jobs",
        headers: { authorization: "Bearer valid" },
      })
    ).statusCode,
    403,
  );
  assert.equal(other.calls.length, 0);
  await other.app.close();
});
test("owner mutations preserve the narrow exact-match/revision contract and reject arbitrary fields", async () => {
  const { app, calls } = fixture();
  const headers = { authorization: "Bearer valid" };
  assert.equal(
    (
      await app.inject({
        method: "PATCH",
        url: `/api/matches/${id}`,
        headers,
        payload: { revision: 1, status: "applied", total_score: 100 },
      })
    ).statusCode,
    400,
  );
  assert.equal(calls.length, 0);
  const res = await app.inject({
    method: "PATCH",
    url: `/api/matches/${id}`,
    headers,
    payload: { revision: 1, status: "applied" },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().application_status, "applied");
  assert.equal(calls[0].args.p_match_id, id);
  assert.equal(calls[0].args.p_revision, 1);
  assert.equal(calls[0].args.p_is_saved, null);
  assert.equal(
    (
      await app.inject({
        url: "/api/jobs",
        headers: { ...headers, origin: "https://attacker.example" },
      })
    ).statusCode,
    403,
  );
  await app.close();
});
test("stale revision conflicts remain conflicts; internal errors are not exposed", async () => {
  const f = fixture();
  const db = {
    auth: {
      getUser: async () => ({ data: { user: { id: "owner" } }, error: null }),
    },
    rpc: async () => ({
      data: null,
      error: { code: "PT409", message: "private SQL" },
    }),
  } as unknown as Database;
  const app = buildApp({ db, ownerId: "owner" });
  const res = await app.inject({
    method: "PATCH",
    url: `/api/matches/${id}`,
    headers: { authorization: "Bearer valid" },
    payload: { revision: 0, status: "applied" },
  });
  assert.equal(res.statusCode, 409);
  assert.ok(!res.body.includes("private SQL"));
  await app.close();
  await f.app.close();
});
