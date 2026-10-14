import { afterEach, describe, expect, it, vi } from "vitest";
import { apiOrigin, fetchFeed, mutateJob } from "../../mobile/src/api";
import { resolveTheme } from "../../mobile/src/theme";
import type { Job } from "../lib/types";

afterEach(() => vi.unstubAllGlobals());
describe("mobile API boundary", () => {
  it("keeps the privileged API on loopback", () => {
    expect(apiOrigin("http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
    for (const url of [
      "https://example.com",
      "http://192.168.1.2:3000",
      "http://secret@localhost:3000",
      "http://localhost:3000/api",
    ])
      expect(() => apiOrigin(url)).toThrow();
  });
  it("sends the exact matching record and revision without resetting application state", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetcher);
    await mutateJob({ matchId: "match-123", revision: 7 } as Job, {
      isSaved: false,
    });
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toContain("/api/matches/match-123");
    expect(JSON.parse(options.body)).toEqual({ revision: 7, isSaved: false });
    expect(options.headers.Origin).toBe("http://127.0.0.1:3000");
  });
  it("surfaces conflicts for refresh rather than treating them as success", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          status: 409,
          json: async () => ({ error: "Refresh this job." }),
        }),
    );
    await expect(
      mutateJob({ matchId: "match-123", revision: 7 } as Job, {
        status: "applied",
      }),
    ).rejects.toMatchObject({ status: 409, message: "Refresh this job." });
  });
  it("encodes literal search and pagination for server-side filtering", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ jobs: [] }) });
    vi.stubGlobal("fetch", fetcher);
    await fetchFeed("saved", {
      search: "C++ & AI",
      mode: "remote",
      location: "India",
      minScore: 80,
      posting: "open",
      sort: "recent",
      page: 2,
      stage: "all",
    });
    const params = new URL(fetcher.mock.calls[0][0]).searchParams;
    expect(params.get("q")).toBe("C++ & AI");
    expect(params.get("page")).toBe("2");
    expect(params.get("view")).toBe("saved");
  });
  it("follows system appearance unless explicitly overridden", () => {
    expect(resolveTheme("system", "dark")).toBe("dark");
    expect(resolveTheme("system", null)).toBe("light");
    expect(resolveTheme("light", "dark")).toBe("light");
    expect(resolveTheme("dark", "light")).toBe("dark");
  });
});
