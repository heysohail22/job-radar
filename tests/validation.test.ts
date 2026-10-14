// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  parseFilters,
  parseMutation,
  safeApplicationUrl,
  safeReturnPath,
} from "@/lib/validation";
import { assertLocalRequest } from "@/lib/server/security";
import { mapJob } from "@/lib/jobs";
describe("request boundaries", () => {
  it("rejects unsupported filters and malformed pagination", () => {
    for (const query of [
      "mode=somewhere",
      "score=101",
      "page=-1",
      "page=1.5",
      "posting=published",
      "stage=saved",
      "q=" + "x".repeat(201),
    ])
      expect(() => parseFilters(new URLSearchParams(query))).toThrow();
  });
  it("does not permit arbitrary columns or bookmark/status conflation", () => {
    expect(parseMutation({ revision: 0, isSaved: true })).toEqual({
      revision: 0,
      isSaved: true,
    });
    for (const input of [
      { revision: 0, isSaved: "true" },
      { revision: 0, status: "saved" },
      { revision: 0, total_score: 100 },
      { isSaved: true },
      { revision: 0 },
    ])
      expect(() => parseMutation(input)).toThrow();
  });
  it("only accepts safe source links and local return routes", () => {
    expect(
      safeApplicationUrl("javascript:alert(1)", "https://example.com/job"),
    ).toBe("https://example.com/job");
    expect(
      safeApplicationUrl("data:text/html,hi", "https://user:pass@example.com"),
    ).toBeNull();
    expect(safeReturnPath("//evil.com")).toBe("/");
    expect(safeReturnPath("/saved?q=Python&mode=remote")).toBe(
      "/saved?q=Python&mode=remote",
    );
  });
  it("requires local same-origin mutations", () => {
    expect(() =>
      assertLocalRequest(
        new Request("http://127.0.0.1:3000/api/matches/id", {
          headers: { origin: "http://127.0.0.1:3000" },
        }),
        true,
      ),
    ).not.toThrow();
    for (const [url, headers] of [
      ["http://public.example/api", { origin: "http://public.example" }],
      ["http://127.0.0.1:3000/api", { origin: "https://evil.example" }],
      ["http://127.0.0.1:3000/api", {}],
      [
        "http://127.0.0.1:3000/api",
        { origin: "http://127.0.0.1:3000", "sec-fetch-site": "cross-site" },
      ],
    ] as [string, Record<string, string>][])
      expect(() =>
        assertLocalRequest(new Request(url, { headers }), true),
      ).toThrow();
  });
  it("preserves unknown data rather than fabricating a score or salary", () => {
    const j = mapJob({
      id: "id",
      company: "Company",
      title: "Role",
      apply_url: "javascript:bad",
      total_score: null,
    });
    expect(j.score).toBeNull();
    expect(j.pay).toBeNull();
    expect(j.breakdown).toEqual([]);
    expect(j.applicationUrl).toBeNull();
    expect(j.matchId).toBeNull();
  });
});
