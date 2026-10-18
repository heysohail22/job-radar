import { test } from "node:test";
import assert from "node:assert/strict";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { PersistentSaver } from "../src/checkpoint";
import type { Store } from "../src/store";
test("a new graph process resumes a persisted checkpoint without repeating the successful node", async () => {
  let snapshot: Record<string, unknown> = {},
    firstCalls = 0,
    fail = true;
  const store = {
    checked: async (p: PromiseLike<unknown>) => {
      const r = (await p) as { data: unknown };
      return r.data;
    },
    db: {
      from: () => ({
        update: (value: { checkpoint: Record<string, unknown> }) => ({
          eq: async () => {
            snapshot = value.checkpoint;
            return { data: null, error: null };
          },
        }),
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { checkpoint: snapshot },
              error: null,
            }),
          }),
        }),
      }),
    },
  } as unknown as Store;
  const state = Annotation.Root({ count: Annotation<number>() });
  const build = (saver: PersistentSaver) =>
    new StateGraph(state)
      .addNode("first", async () => {
        firstCalls++;
        return { count: 1 };
      })
      .addNode("second", async (s) => {
        if (fail) throw new Error("simulated restart");
        return { count: s.count + 1 };
      })
      .addEdge(START, "first")
      .addEdge("first", "second")
      .addEdge("second", END)
      .compile({ checkpointer: saver });
  const config = {
    configurable: { thread_id: "resume-test" },
    durability: "sync" as const,
  };
  await assert.rejects(() =>
    build(new PersistentSaver(store, "run")).invoke({}, config),
  );
  fail = false;
  const restored = new PersistentSaver(store, "run");
  await restored.restore();
  const result = await build(restored).invoke(null, config);
  assert.equal(result.count, 2);
  assert.equal(firstCalls, 1);
});
