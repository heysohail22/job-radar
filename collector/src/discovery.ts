import { load } from "cheerio";
import { canonicalUrl, safeFetch } from "./network";
import type { Store } from "./store";
export type Discovery = { url: string; title?: string; company?: string };
export async function search(
  query: string,
  store: Store,
): Promise<Discovery[]> {
  if (!process.env.TAVILY_API_KEY)
    throw new Error("TAVILY_API_KEY is missing.");
  await store.reserve("tavily");
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      auto_parameters: false,
      max_results: 10,
      include_answer: false,
      include_raw_content: false,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error("Tavily search failed.");
  const data = (await r.json()) as {
    results?: { url: string; title: string }[];
  };
  return (data.results ?? []).flatMap((r) => {
    try {
      return [{ url: canonicalUrl(r.url), title: r.title }];
    } catch {
      return [];
    }
  });
}
export async function firecrawl(url: string, store: Store) {
  await store.reserve("firecrawl");
  const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    signal: AbortSignal.timeout(45000),
  });
  if (!r.ok) throw new Error("Firecrawl extraction failed.");
  const data = (await r.json()) as { data?: { markdown?: string } };
  return data.data?.markdown ?? "";
}
export async function boardJobs(
  provider: string,
  board: string,
): Promise<Discovery[]> {
  const slug = encodeURIComponent(board);
  if (provider === "greenhouse") {
    const r = JSON.parse(
      (
        await safeFetch(
          `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
        )
      ).text,
    );
    return (r.jobs ?? []).map((j: { absolute_url: string; title: string }) => ({
      url: j.absolute_url,
      title: j.title,
      company: board,
    }));
  }
  if (provider === "lever" || provider === "lever-eu") {
    const origin =
      provider === "lever-eu"
        ? "https://api.eu.lever.co"
        : "https://api.lever.co";
    const r = JSON.parse(
      (await safeFetch(`${origin}/v0/postings/${slug}?mode=json`)).text,
    );
    return r.map((j: { hostedUrl: string; text: string }) => ({
      url: j.hostedUrl,
      title: j.text,
      company: board,
    }));
  }
  if (provider === "ashby") {
    const r = JSON.parse(
      (await safeFetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}`))
        .text,
    );
    return (r.jobs ?? []).map((j: { jobUrl: string; title: string }) => ({
      url: j.jobUrl,
      title: j.title,
      company: board,
    }));
  }
  return [];
}
export async function feedJobs(): Promise<Discovery[]> {
  const jobs: Discovery[] = [];
  const r = JSON.parse(
    (
      await safeFetch(
        "https://remotive.com/api/remote-jobs?category=software-dev",
        10_000_000,
      )
    ).text,
  );
  for (const j of r.jobs ?? [])
    jobs.push({ url: j.url, title: j.title, company: j.company_name });
  return jobs;
}
export async function rssJobs(): Promise<Discovery[]> {
  const r = await safeFetch(
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
  );
  const $ = load(r.text, { xml: true });
  return $("item")
    .toArray()
    .map((el) => ({
      url: $(el).find("link").text().trim(),
      title: $(el).find("title").text().trim(),
    }));
}
