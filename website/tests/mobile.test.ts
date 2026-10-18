import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configureSession,
  apiOrigin,
  fetchFeed,
  fetchJob,
  mutateJob,
} from "../../mobile/src/api";
import { resolveTheme } from "../../mobile/src/theme";
import type { Job } from "../lib/types";

afterEach(() => {
  vi.unstubAllGlobals();
  configureSession(null, async () => {});
});
describe("mobile API boundary", () => {
  it("allows HTTPS backends while restricting plaintext to loopback", () => {
    expect(apiOrigin("http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
    expect(apiOrigin("https://example.com")).toBe("https://example.com");
    for (const url of [
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
    configureSession(
      { access_token: "test-token", refresh_token: "refresh" },
      async () => {},
    );
    await mutateJob({ matchId: "match-123", revision: 7 } as Job, {
      isSaved: false,
    });
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toContain("/api/matches/match-123");
    expect(JSON.parse(options.body)).toEqual({ revision: 7, isSaved: false });
    expect(options.headers.Authorization).toBe("Bearer test-token");
  });
  it("surfaces conflicts for refresh rather than treating them as success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: "Refresh this job." }),
      }),
    );
    configureSession(
      { access_token: "test-token", refresh_token: "refresh" },
      async () => {},
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
    configureSession(
      { access_token: "test-token", refresh_token: "refresh" },
      async () => {},
    );
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
  it("browses public jobs over HTTPS without sending private profile or tracking fields", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jobs: [
          {
            id: "job-public",
            title: "Engineer",
            company: "Example",
            apply_url: "javascript:alert(1)",
          },
        ],
        total: 32,
        summary: { total: 32, remote: 9, last_seen: null },
      }),
    });
    vi.stubGlobal("fetch", fetcher);
    const feed = await fetchFeed("discover", {
      search: "C++ & AI",
      mode: "remote",
      location: "India",
      minScore: 80,
      posting: "open",
      sort: "recent",
      page: 2,
      stage: "all",
    });
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe(
      "https://tybrswbrqmoxznizheuu.supabase.co/rest/v1/rpc/job_radar_public_feed",
    );
    expect(options.headers.apikey).toMatch(/^sb_publishable_/);
    expect(JSON.parse(options.body)).toEqual({
      p_search: "C++ & AI",
      p_mode: "remote",
      p_location: "India",
      p_posting: "open",
      p_sort: "recent",
      p_limit: 20,
      p_offset: 20,
    });
    expect(feed.jobs[0]).toMatchObject({
      matchId: null,
      score: null,
      applicationUrl: null,
    });
  });
  it("reports internet failure without asking for a computer during public browsing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Network request failed")),
    );
    await expect(fetchJob("missing")).rejects.toThrow(
      "Check your internet connection",
    );
  });
  it("returns a missing-job error for an unavailable public role", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          jobs: [],
          total: 0,
          summary: { total: 32, remote: 9, last_seen: null },
        }),
      }),
    );
    await expect(fetchJob("missing")).rejects.toMatchObject({ status: 404 });
  });
  it("follows system appearance unless explicitly overridden", () => {
    expect(resolveTheme("system", "dark")).toBe("dark");
    expect(resolveTheme("system", null)).toBe("light");
    expect(resolveTheme("light", "dark")).toBe("light");
    expect(resolveTheme("dark", "light")).toBe("dark");
  });
});
