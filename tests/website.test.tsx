import React from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Job, Feed, Filters } from "@/lib/types";
const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  params: new URLSearchParams(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/saved",
  useSearchParams: () => navigation.params,
}));
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href, ...props }, children),
}));
vi.mock("@/components/ui/icon", () => ({
  Icon: () => null,
  RadarArt: () => null,
  EmptyArt: () => null,
}));
import { Website } from "@/components/website";
const job: Job = {
  id: "11111111-1111-4111-8111-111111111111",
  matchId: "22222222-2222-4222-8222-222222222222",
  company: "Test company",
  title: "AI Engineering Intern",
  location: "India",
  mode: "remote",
  eligibility: "yes",
  pay: null,
  description: "Build useful AI systems.",
  skills: ["Python", "LLMs"],
  preferredSkills: [],
  responsibilities: [],
  missing: ["Confirm pay period"],
  recommendation: "Strong match",
  evidence: [],
  score: 97,
  breakdown: [],
  applicationUrl: "https://example.com/apply",
  postingStatus: "open",
  firstSeen: null,
  lastVerified: null,
  isSaved: false,
  status: "interview",
  revision: 3,
};
const filters: Filters = {
  search: "",
  mode: "all",
  location: "",
  minScore: 0,
  posting: "all",
  sort: "best",
  page: 1,
  stage: "all",
};
function feed(jobs: Job[]): Feed {
  return {
    jobs,
    total: jobs.length,
    summary: {
      total: 12,
      remote: 9,
      saved: jobs.filter((j) => j.isSaved).length,
      applied: 0,
      interview: 1,
      offer: 0,
      tracked: 1,
      last_seen: null,
    },
  };
}
function props(jobs = [job]) {
  return {
    view: "discover" as const,
    result: { ok: true as const, feed: feed(jobs), detail: null },
    filters,
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  navigation.params = new URLSearchParams();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("job browsing and progress", () => {
  it("opens the job actually shown after filters hide the previous selection", async () => {
    const other = {
      ...job,
      id: "33333333-3333-4333-8333-333333333333",
      company: "Other",
      title: "Data Engineer",
    };
    const { rerender } = render(<Website {...props([job, other])} />);
    await userEvent.click(
      screen.getByRole("button", { name: "AI Engineering Intern" }),
    );
    rerender(<Website {...props([other])} />);
    expect(
      screen
        .getByRole("link", { name: "View opportunity" })
        .getAttribute("href"),
    ).toContain(other.id);
  });
  it("waits for a confirmed write, sends only bookmark state, then refreshes", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ revision: 4 }) }),
    );
    render(<Website {...props()} />);
    await userEvent.click(
      screen.getAllByRole("button", {
        name: /Save AI Engineering Intern at Test company/,
      })[0],
    );
    await waitFor(() => expect(navigation.refresh).toHaveBeenCalled());
    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(options?.body))).toEqual({
      isSaved: true,
      revision: 3,
    });
    expect(screen.getByRole("status").textContent).toContain(
      "Saved to your shortlist",
    );
  });
  it("keeps failure visible and does not pretend a failed write succeeded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Unable to connect")),
    );
    render(<Website {...props()} />);
    await userEvent.click(
      screen.getAllByRole("button", {
        name: /Save AI Engineering Intern at Test company/,
      })[0],
    );
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Unable to connect",
      ),
    );
    expect(navigation.refresh).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Unsave AI/ })).toBeNull();
  });
  it("requests a reload on a conflicting update", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: "Changed in another window" }),
      }),
    );
    render(<Website {...props()} />);
    await userEvent.click(
      screen.getAllByRole("button", {
        name: /Save AI Engineering Intern at Test company/,
      })[0],
    );
    await waitFor(() => expect(navigation.refresh).toHaveBeenCalled());
    expect(screen.getByRole("alert").textContent).toContain(
      "Changed in another window",
    );
  });
  it("opens the employer page without sending a mutation", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <Website
        {...props()}
        result={{ ok: true, feed: feed([job]), detail: job }}
      />,
    );
    const link = screen.getByRole("link", { name: "Apply on website" });
    expect(link.getAttribute("href")).toBe(job.applicationUrl);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Application status"), {
      target: { value: "offer" },
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.status).toBe("offer");
    expect(body).not.toHaveProperty("isSaved");
  });
  it("preserves filters and restarts pagination when the query changes", async () => {
    navigation.params = new URLSearchParams("mode=remote&page=3");
    render(<Website {...props()} />);
    await userEvent.type(
      screen.getByRole("searchbox", { name: "Search jobs" }),
      "Python",
    );
    await userEvent.click(screen.getByRole("button", { name: /^Search$/ }));
    expect(navigation.push.mock.calls[0][0]).toBe(
      "/saved?mode=remote&q=Python",
    );
  });
});
