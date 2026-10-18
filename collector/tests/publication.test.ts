import { test } from "node:test";
import assert from "node:assert/strict";
import { MemorySaver } from "@langchain/langgraph";
import { buildGraph } from "../src/graph";
import type { Store } from "../src/store";
import type { Analysis } from "../src/analysis";
test("write run publishes cached preview results immediately despite the refresh cooldown", async () => {
  let published = 0,
    marked = false;
  const store = {
    candidates: async () => [
      {
        id: "candidate",
        url: "https://example.com/job",
        canonical_url: "https://example.com/canonical",
        status: "shortlisted",
        profile_version: "skills-v2",
        description: "Cached complete description",
        analysis: {} as Analysis,
        updated_at: new Date().toISOString(),
      },
    ],
    publish: async (extracted: { url: string }) => {
      assert.equal(extracted.url, "https://example.com/canonical");
      published++;
    },
    updateCandidate: async (_id: string, value: { published_at?: string }) => {
      marked = !!value.published_at;
    },
  } as unknown as Store;
  const graph = buildGraph(store, true, new MemorySaver());
  const config = {
    configurable: { thread_id: "publish-preview" },
    durability: "sync" as const,
  };
  await graph.updateState(
    config,
    { queries: [], summary: { processed: 0, published: 0 }, errors: [] },
    "discover",
  );
  const result = await graph.invoke(null, config);
  assert.equal(published, 1);
  assert.equal(marked, true);
  assert.equal(result.summary.published, 1);
});
