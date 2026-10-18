import {
  Annotation,
  StateGraph,
  START,
  END,
  MemorySaver,
} from "@langchain/langgraph";
import { createHash } from "node:crypto";
import { canonicalUrl } from "./network";
import { boardFromUrl, extract } from "./extract";
import { analyze, planQueries } from "./models";
import {
  boardJobs,
  feedJobs,
  rssJobs,
  search,
  firecrawl,
  type Discovery,
} from "./discovery";
import { score } from "./analysis";
import { Store } from "./store";
const State = Annotation.Root({
  queries: Annotation<string[]>(),
  summary: Annotation<Record<string, number>>(),
  errors: Annotation<string[]>(),
});
export function buildGraph(store: Store, write: boolean, saver: MemorySaver) {
  return new StateGraph(State)
    .addNode("plan", async () => ({
      queries: await planQueries(),
      summary: {
        discovered: 0,
        processed: 0,
        published: 0,
        uncertain: 0,
        rejected: 0,
        deferred: 0,
      },
      errors: [],
    }))
    .addNode("discover", async (state) => {
      const errors = [...state.errors];
      let discovered = 0;
      async function accept(results: Discovery[]) {
        for (const item of results) {
          if (
            /^(?:accountant|recruiter|sales representative|registered nurse|truck driver|customer support representative)\b/i.test(
              item.title ?? "",
            )
          )
            continue;

          let url: string;
          try {
            url = canonicalUrl(item.url);
          } catch {
            continue;
          }
          await store.saveCandidate(url, item.title, item.company);
          const b = boardFromUrl(url);
          if (b)
            await store.checked(
              store.db
                .from("collector_sources")
                .upsert(
                  { id: `${b.provider}:${b.board}`, ...b },
                  { onConflict: "provider,board" },
                ),
            );
          discovered++;
        }
      }
      for (const query of state.queries) {
        let results: Discovery[];
        try {
          results = await search(query, store);
        } catch {
          errors.push("A Tavily query failed or its budget was exhausted.");
          break;
        }
        await accept(results);
      }
      for (const [name, fn] of [
        ["remotive", feedJobs],
        ["weworkremotely", rssJobs],
      ] as const) {
        let results: Discovery[];
        try {
          results = await fn();
        } catch {
          errors.push(`${name} feed unavailable.`);
          continue;
        }
        await accept(results);
      }
      const sources = await store.checked(
        store.db
          .from("collector_sources")
          .select("*")
          .order("last_checked_at", { ascending: true, nullsFirst: true })
          .limit(20),
      );
      for (const source of sources ?? []) {
        let results: Discovery[];
        try {
          results = await boardJobs(source.provider, source.board);
        } catch {
          errors.push(`${source.provider} employer board unavailable.`);
          continue;
        }
        await accept(results);
        await store.checked(
          store.db
            .from("collector_sources")
            .update({ last_checked_at: new Date().toISOString() })
            .eq("id", source.id),
        );
      }
      return { summary: { ...state.summary, discovered }, errors };
    })
    .addNode("process", async (state) => {
      const summary = { ...state.summary },
        errors = [...state.errors];
      const max = Number(process.env.MAX_CANDIDATES ?? 100);
      if (!Number.isInteger(max) || max < 1 || max > 500)
        throw new Error("MAX_CANDIDATES must be between 1 and 500.");
      const candidates = await store.candidates(500, write);
      for (const c of candidates) {
        if (summary.processed >= max) break;
        const age = Date.now() - new Date(c.updated_at ?? 0).getTime();
        if (
          write &&
          c.status === "shortlisted" &&
          !c.published_at &&
          c.analysis &&
          c.description &&
          c.profile_version === "skills-v2"
        ) {
          await store.publish(
            {
              url: c.canonical_url ?? c.url,
              description: c.description,
              method: c.extraction_method ?? "cached",
            },
            c.analysis,
          );
          await store.updateCandidate(c.id, {
            published_at: new Date().toISOString(),
          });
          summary.processed++;
          summary.published++;
          continue;
        }
        if (
          c.status !== "pending" &&
          age < (c.status === "deferred" ? 86400000 : 3 * 86400000)
        )
          continue;
        summary.processed++;
        let extracted;
        try {
          extracted = await extract(
            c.url,
            process.env.FIRECRAWL_API_KEY
              ? (url) => firecrawl(url, store)
              : undefined,
          );
        } catch {
          await store.updateCandidate(c.id, {
            status: "deferred",
            reason: "Complete JD unavailable; extraction will retry.",
            attempts: c.attempts + 1,
          });
          summary.deferred++;
          continue;
        }
        const description = [
          extracted.title,
          extracted.company,
          extracted.description,
        ]
          .filter(Boolean)
          .join("\n");
        const hash = createHash("sha256").update(description).digest("hex");
        let analysis = c.analysis;
        if (
          hash !== c.content_hash ||
          c.profile_version !== "skills-v2" ||
          !analysis
        ) {
          try {
            analysis = await analyze(description);
          } catch {
            await store.updateCandidate(c.id, {
              status: "deferred",
              reason:
                "Model unavailable or analysis failed validation; retry later.",
              attempts: c.attempts + 1,
            });
            summary.deferred++;
            errors.push(
              "Model analysis paused; remaining candidates are queued.",
            );
            break;
          }
        }
        const result = score(analysis);
        // Publish before marking complete, so interrupted writes can safely retry.
        if (write) {
          const existing = await store.checked(
            store.db
              .from("jobs")
              .select("id")
              .eq("canonical_url", extracted.url)
              .maybeSingle(),
          );
          if (result.status === "shortlisted" || existing) {
            await store.publish({ ...extracted, description }, analysis);
            summary.published++;
          }
        }
        await store.updateCandidate(c.id, {
          title: analysis.title,
          company: analysis.company,
          status: result.status,
          score: result.total,
          reason: result.reason,
          analysis,
          description,
          content_hash: hash,
          profile_version: "skills-v2",
          extraction_method: extracted.method,
          canonical_url: extracted.url,
          ...(write && result.status === "shortlisted"
            ? { published_at: new Date().toISOString() }
            : {}),
          attempts: c.attempts + 1,
        });
        if (result.status === "uncertain") summary.uncertain++;
        if (result.status === "rejected") summary.rejected++;
      }
      return { summary, errors };
    })
    .addEdge(START, "plan")
    .addEdge("plan", "discover")
    .addEdge("discover", "process")
    .addEdge("process", END)
    .compile({ checkpointer: saver });
}
