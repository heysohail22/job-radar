// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({ update: vi.fn(), feed: vi.fn() }));
vi.mock("@/lib/server/queries", () => ({
  updateMatch: mocks.update,
  getFeed: mocks.feed,
}));
import { PATCH } from "@/app/api/matches/[matchId]/route";
import { GET } from "@/app/api/jobs/route";
import { AppError } from "@/lib/validation";
const id = "11111111-1111-4111-8111-111111111111";
const context = { params: Promise.resolve({ matchId: id }) };
function request(body: unknown, origin = "http://localhost:3000") {
  return new Request(`http://localhost:3000/api/matches/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}
beforeEach(() => vi.clearAllMocks());
describe("website API", () => {
  it("does not call Supabase for cross-origin writes or forbidden columns", async () => {
    expect(
      (
        await PATCH(
          request({ revision: 0, isSaved: true }, "http://evil.test"),
          context,
        )
      ).status,
    ).toBe(403);
    expect(
      (await PATCH(request({ revision: 0, profile_version: "other" }), context))
        .status,
    ).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("updates the exact match with the narrow validated payload", async () => {
    mocks.update.mockResolvedValue({
      revision: 2,
      is_saved: true,
      application_status: "interview",
    });
    const response = await PATCH(
      request({ revision: 1, isSaved: true }),
      context,
    );
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(id, {
      revision: 1,
      isSaved: true,
    });
    expect((await response.json()).application_status).toBe("interview");
  });
  it("reports concurrent edits without leaking server errors", async () => {
    mocks.update.mockRejectedValue(new AppError("Refresh and try again.", 409));
    expect(
      (await PATCH(request({ revision: 0, status: "applied" }), context))
        .status,
    ).toBe(409);
    mocks.update.mockRejectedValue(new Error("private database detail"));
    const response = await PATCH(
      request({ revision: 0, status: "applied" }),
      context,
    );
    expect(JSON.stringify(await response.json())).not.toContain(
      "private database detail",
    );
  });
  it("validates filter input before querying the database", async () => {
    expect(
      (await GET(new Request("http://localhost:3000/api/jobs?score=1000")))
        .status,
    ).toBe(400);
    expect(mocks.feed).not.toHaveBeenCalled();
  });
});
