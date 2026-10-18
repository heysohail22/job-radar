import { MemorySaver } from "@langchain/langgraph";
import { serialize, deserialize } from "node:v8";
import type { Store } from "./store";
// Persist the pinned MemorySaver's byte storage without losing Uint8Array types.
// Runs are single-writer under a DB lease. The promise queue serializes snapshots.
export class PersistentSaver extends MemorySaver {
  private queue = Promise.resolve();
  constructor(
    private store: Store,
    private runId: string,
  ) {
    super();
  }
  async restore() {
    const row = await this.store.checked(
      this.store.db
        .from("collector_runs")
        .select("checkpoint")
        .eq("id", this.runId)
        .single(),
    );
    if (row?.checkpoint?.blob) {
      const saved = deserialize(Buffer.from(row.checkpoint.blob, "base64"));
      this.storage = saved.storage;
      this.writes = saved.writes;
    }
  }
  private save() {
    this.queue = this.queue.then(async () => {
      const blob = serialize({
        storage: this.storage,
        writes: this.writes,
      }).toString("base64");
      await this.store.checked(
        this.store.db
          .from("collector_runs")
          .update({ checkpoint: { blob } })
          .eq("id", this.runId),
      );
    });
    return this.queue;
  }
  override async put(...args: Parameters<MemorySaver["put"]>) {
    const result = await super.put(...args);
    await this.save();
    return result;
  }
  override async putWrites(...args: Parameters<MemorySaver["putWrites"]>) {
    await super.putWrites(...args);
    await this.save();
  }
}
