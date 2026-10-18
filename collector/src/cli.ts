import { randomUUID } from "node:crypto";
import { Store } from "./store";
import { availableModels } from "./models";
import { PersistentSaver } from "./checkpoint";
import { buildGraph } from "./graph";
const write = process.argv.includes("--write");
const resumeIndex = process.argv.indexOf("--resume"),
  runId = resumeIndex >= 0 ? process.argv[resumeIndex + 1] : randomUUID();
try {
  if (!runId || !/^[0-9a-f-]{36}$/.test(runId))
    throw new Error("Invalid resume run ID.");
  if (!process.env.TAVILY_API_KEY)
    throw new Error("Add a replacement TAVILY_API_KEY to collector/.env.");
  availableModels();
  if (write && process.env.OLD_COLLECTOR_DISABLED !== "true")
    throw new Error(
      "Confirm the old collector is disabled before setting OLD_COLLECTOR_DISABLED=true.",
    );
  const store = new Store();
  const acquired = await store.checked(
    store.db.rpc("collector_acquire", { p_run: runId }),
  );
  if (!acquired)
    throw new Error(
      "Another collector run holds the lease. Retry after it finishes.",
    );
  try {
    if (resumeIndex < 0)
      await store.checked(
        store.db.from("collector_runs").insert({
          id: runId,
          summary: { mode: write ? "write" : "preview" },
        }),
      );
    else {
      const old = await store.checked(
        store.db
          .from("collector_runs")
          .select("summary,status")
          .eq("id", runId)
          .single(),
      );
      if (!old || old.summary.mode !== (write ? "write" : "preview"))
        throw new Error("Resume mode must match the original run.");
    }
    const saver = new PersistentSaver(store, runId);
    await saver.restore();
    const graph = buildGraph(store, write, saver);
    try {
      const result = await graph.invoke(resumeIndex >= 0 ? null : {}, {
        configurable: { thread_id: runId },
        durability: "sync",
      });
      await store.checked(
        store.db
          .from("collector_runs")
          .update({
            status: result.errors.length ? "partial" : "completed",
            finished_at: new Date().toISOString(),
            summary: {
              ...result.summary,
              errors: result.errors,
              mode: write ? "write" : "preview",
            },
          })
          .eq("id", runId),
      );
      // Only operational candidates expire; listings and all application state remain intact.
      await store.checked(
        store.db
          .from("collector_candidates")
          .delete()
          .in("status", ["rejected", "deferred"])
          .lt("updated_at", new Date(Date.now() - 90 * 86400000).toISOString()),
      );
      console.log(
        JSON.stringify({
          runId,
          mode: write ? "write" : "preview",
          ...result.summary,
          errors: result.errors,
        }),
      );
    } catch {
      await store.checked(
        store.db
          .from("collector_runs")
          .update({ status: "failed" })
          .eq("id", runId),
      );
      throw new Error(
        `Collector interrupted. Resume with --resume ${runId}${write ? " --write" : " --preview"}.`,
      );
    }
  } finally {
    await store.checked(
      store.db
        .from("collector_lease")
        .delete()
        .eq("name", "daily")
        .eq("run_id", runId),
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Collector failed.");
  process.exitCode = 1;
}
