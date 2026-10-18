import argparse
import asyncio
import json
from .config import Settings
from .database import Database
from .runtime import CollectorRuntime


async def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--resume")
    args = parser.parse_args()
    db = Database(Settings())
    runtime = CollectorRuntime(db)
    try:
        ident = await runtime.enqueue(args.write, args.resume)
        await runtime.task
        row = db.rows("collector_runs", id="eq." + ident, select="id,status,summary")[0]
        print(json.dumps(row))
        if row["status"] == "failed":
            raise SystemExit(1)
    finally:
        await runtime.close()
        db.close()


if __name__ == "__main__":
    asyncio.run(run())
