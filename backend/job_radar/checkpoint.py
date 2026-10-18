"""Supabase-backed LangGraph checkpointer, using existing private collector_runs.

Only JSON graph data is serialized; no pickle or executable deserialization. Old
Node/V8 checkpoints cannot be resumed by Python and are left untouched.
"""

import json
from copy import deepcopy
from threading import RLock
from langgraph.checkpoint.base import BaseCheckpointSaver, CheckpointTuple, WRITES_IDX_MAP


class SupabaseSaver(BaseCheckpointSaver):
    def __init__(self, db, run_id):
        super().__init__()
        self.db, self.run_id, self.lock = db, run_id, RLock()
        rows = db.rows("collector_runs", id="eq." + run_id, select="checkpoint")
        data = (rows[0].get("checkpoint") or {}) if rows else {}
        if data and data.get("format") != "python-json-v1":
            raise ValueError(
                "Legacy TypeScript checkpoint cannot resume in Python; start a new run."
            )
        self.data = data or {"format": "python-json-v1", "latest": None, "entries": {}}

    def _save(self):
        # Explicit JSON round-trip verifies the supported primitive-only state.
        self.db.patch(
            "collector_runs",
            {"checkpoint": json.loads(json.dumps(self.data))},
            id="eq." + self.run_id,
        )

    def get_tuple(self, config):
        with self.lock:
            cid = config["configurable"].get("checkpoint_id") or self.data["latest"]
            entry = self.data["entries"].get(cid)
            if not entry:
                return None
            return CheckpointTuple(
                config={
                    "configurable": {
                        "thread_id": self.run_id,
                        "checkpoint_ns": "",
                        "checkpoint_id": cid,
                    }
                },
                checkpoint=deepcopy(entry["checkpoint"]),
                metadata=deepcopy(entry["metadata"]),
                parent_config=deepcopy(entry["parent"]),
                pending_writes=[
                    (v["task"], v["channel"], deepcopy(v["value"]))
                    for v in entry["writes"].values()
                ],
            )

    def put(self, config, checkpoint, metadata, new_versions):
        with self.lock:
            cid = checkpoint["id"]
            parent_id = config["configurable"].get("checkpoint_id")
            self.data["entries"][cid] = {
                "checkpoint": deepcopy(checkpoint),
                "metadata": deepcopy(metadata),
                "parent": {
                    "configurable": {
                        "thread_id": self.run_id,
                        "checkpoint_ns": "",
                        "checkpoint_id": parent_id,
                    }
                }
                if parent_id
                else None,
                "writes": {},
            }
            self.data["latest"] = cid
            self.data["entries"] = {
                key: value for key, value in self.data["entries"].items() if key in (cid, parent_id)
            }
            self._save()
            return {
                "configurable": {
                    "thread_id": self.run_id,
                    "checkpoint_ns": "",
                    "checkpoint_id": cid,
                }
            }

    def put_writes(self, config, writes, task_id, task_path=""):
        with self.lock:
            entry = self.data["entries"][config["configurable"]["checkpoint_id"]]
            for i, (channel, value) in enumerate(writes):
                index = WRITES_IDX_MAP.get(channel, i)
                key = f"{task_id}:{index}"
                if index >= 0 and key in entry["writes"]:
                    continue
                entry["writes"][key] = {
                    "task": task_id,
                    "channel": channel,
                    "value": "Interrupted task; retry from checkpoint."
                    if isinstance(value, BaseException)
                    else deepcopy(value),
                }
            self._save()
