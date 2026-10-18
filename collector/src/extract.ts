import { load } from "cheerio";
import { assertRobots, canonicalUrl, safeFetch } from "./network";
export type Extracted = {
  url: string;
  description: string;
  title?: string;
  company?: string;
  method: string;
};
export function htmlText(html: string) {
  const $ = load(html);
  $("script,style,nav,footer,header,noscript").remove();
  return $.text()
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}
export function extractHtml(html: string, url: string): Extracted {
  const $ = load(html);
  let posting: Record<string, unknown> | undefined;
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    const r = v as Record<string, unknown>;
    if (
      r["@type"] === "JobPosting" ||
      (Array.isArray(r["@type"]) && r["@type"].includes("JobPosting"))
    )
      posting = r;
    if (r["@graph"]) walk(r["@graph"]);
  };
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      walk(JSON.parse($(el).text()));
    } catch {}
  });
  if (posting && typeof posting.description === "string")
    return {
      url,
      description: htmlText(posting.description),
      title: typeof posting.title === "string" ? posting.title : undefined,
      company:
        typeof posting.hiringOrganization === "object" &&
        posting.hiringOrganization
          ? String(
              (posting.hiringOrganization as Record<string, unknown>).name ??
                "",
            )
          : undefined,
      method: "jobposting-jsonld",
    };
  const section = $(
    '[data-testid="job-description"],.job-description,#job-description,[itemprop="description"]',
  ).first();
  const content = section.length
    ? section.html()
    : ($("main").first().html() ?? $("article").first().html());
  return {
    url,
    description: htmlText(content ?? ""),
    title: $("h1").first().text().trim(),
    method: "html",
  };
}
export function completeDescription(text: string) {
  return (
    text.length >= 500 &&
    text.split(/\s+/).length >= 80 &&
    /responsibilit|requirements|qualifications|what you|you will|we.re looking|experience|skills|about (the )?(role|job)|apply/i.test(
      text,
    ) &&
    !/access denied|verify you are human|just a moment|sign in to view/i.test(
      text.slice(0, 500),
    )
  );
}
export function boardFromUrl(input: string) {
  const u = new URL(canonicalUrl(input)),
    parts = u.pathname.split("/").filter(Boolean);
  if (["jobs.lever.co", "jobs.eu.lever.co"].includes(u.hostname) && parts[0])
    return {
      provider: u.hostname === "jobs.eu.lever.co" ? "lever-eu" : "lever",
      board: parts[0],
    };
  if (
    ["boards.greenhouse.io", "job-boards.greenhouse.io"].includes(u.hostname) &&
    parts[0]
  )
    return { provider: "greenhouse", board: parts[0] };
  if (u.hostname === "jobs.ashbyhq.com" && parts[0])
    return { provider: "ashby", board: parts[0] };
  return null;
}
async function directApi(url: string): Promise<Extracted | undefined> {
  const b = boardFromUrl(url);
  if (!b) return;
  const u = new URL(url),
    parts = u.pathname.split("/").filter(Boolean),
    id = parts.at(-1);
  if (b.provider.startsWith("lever") && parts.length >= 2) {
    const origin =
      b.provider === "lever-eu"
        ? "https://api.eu.lever.co"
        : "https://api.lever.co";
    const r = JSON.parse(
      (
        await safeFetch(
          `${origin}/v0/postings/${encodeURIComponent(b.board)}/${encodeURIComponent(id!)}?mode=json`,
        )
      ).text,
    );
    return {
      url,
      description: htmlText(
        [
          r.categories?.location ? `Location: ${r.categories.location}` : "",
          r.categories?.commitment
            ? `Employment type: ${r.categories.commitment}`
            : "",
          r.workplaceType ? `Work mode: ${r.workplaceType}` : "",
          r.description,
          ...(r.lists ?? []).map(
            (x: { text: string; content: string }) => x.text + " " + x.content,
          ),
          r.additional,
        ].join("\n"),
      ),
      title: r.text,
      method: "lever-api",
    };
  }
  if (b.provider === "greenhouse" && /^\d+$/.test(id ?? "")) {
    const r = JSON.parse(
      (
        await safeFetch(
          `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(b.board)}/jobs/${id}`,
        )
      ).text,
    );
    return {
      url,
      description: [
        r.location?.name ? `Location: ${r.location.name}` : "",
        htmlText(htmlText(r.content)),
      ]
        .filter(Boolean)
        .join("\n"),
      title: r.title,
      company: r.company_name,
      method: "greenhouse-api",
    };
  }
  if (b.provider === "ashby" && parts.length >= 2) {
    const r = JSON.parse(
      (
        await safeFetch(
          `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(b.board)}`,
        )
      ).text,
    );
    const job = r.jobs?.find(
      (x: { jobUrl: string }) => new URL(x.jobUrl).pathname === u.pathname,
    );
    if (job)
      return {
        url,
        description: [
          job.location ? `Location: ${job.location}` : "",
          job.employmentType ? `Employment type: ${job.employmentType}` : "",
          job.isRemote === true ? "Work mode: remote" : "",
          job.descriptionPlain ?? htmlText(job.descriptionHtml ?? ""),
        ]
          .filter(Boolean)
          .join("\n"),
        title: job.title,
        method: "ashby-api",
      };
  }
}
export async function extract(
  url: string,
  firecrawl?: (url: string) => Promise<string>,
): Promise<Extracted> {
  url = canonicalUrl(url);
  const parsed = new URL(url);
  if (
    (parsed.hostname.endsWith("indeed.com") &&
      /(?:-jobs\.html|\/jobs$)/.test(parsed.pathname)) ||
    (parsed.hostname.endsWith("linkedin.com") &&
      /\/jobs\/search/.test(parsed.pathname)) ||
    (boardFromUrl(url) &&
      parsed.pathname.split("/").filter(Boolean).length === 1)
  )
    throw new Error("Search/board index page is not a single job description.");
  await assertRobots(url);
  try {
    const r = await directApi(url);
    if (r && completeDescription(r.description)) return r;
  } catch {}
  try {
    const r = await safeFetch(url);
    const extracted = extractHtml(r.text, r.url);
    if (completeDescription(extracted.description)) return extracted;
  } catch {}
  if (process.env.ENABLE_BROWSER === "true") {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        serviceWorkers: "block",
        acceptDownloads: false,
      });
      await context.routeWebSocket("**/*", (socket) => socket.close());
      await context.route("**/*", async (route) => {
        try {
          if (
            !["document", "script", "xhr", "fetch"].includes(
              route.request().resourceType(),
            )
          )
            return await route.abort();
          const r = await safeFetch(route.request().url());
          await route.fulfill({
            status: r.status,
            body: r.text,
            contentType: r.type,
          });
        } catch {
          await route.abort();
        }
      });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      const r = extractHtml(await page.content(), page.url());
      if (completeDescription(r.description))
        return { ...r, method: "playwright" };
    } finally {
      await browser.close();
    }
  }
  if (firecrawl) {
    const text = await firecrawl(url);
    if (completeDescription(text))
      return { url, description: text, method: "firecrawl" };
  }
  throw new Error(
    "Complete description unavailable; candidate retained for retry.",
  );
}
