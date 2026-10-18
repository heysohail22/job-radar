import { Store } from "../src/store";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";
if (
  !process.env.TAVILY_API_KEY ||
  (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) ||
  process.env.OLD_COLLECTOR_DISABLED !== "true"
)
  throw new Error(
    "Configure fresh keys, verify preview, and disable the old collector first.",
  );
const store = new Store();
const preview = await store.checked(
  store.db
    .from("collector_runs")
    .select("id")
    .eq("status", "completed")
    .contains("summary", { mode: "preview" })
    .limit(1),
);
if (!preview?.length)
  throw new Error("Complete a successful preview before enabling the timer.");
const pnpm = execFileSync("which", ["pnpm"], { encoding: "utf8" }).trim();
const root = resolve(".."),
  target = resolve(homedir(), ".config/systemd/user");
let service = await readFile("systemd/job-radar-collector.service", "utf8");
service = service
  .replace("WorkingDirectory=%h/Desktop/resume", `WorkingDirectory=${root}`)
  .replace(
    "ExecStart=/usr/bin/env pnpm collect",
    `Environment="PATH=${dirname(process.execPath)}:/usr/local/bin:/usr/bin:/bin"\nExecStart=${pnpm} collect`,
  );
await mkdir(target, { recursive: true });
await writeFile(resolve(target, "job-radar-collector.service"), service);
await writeFile(
  resolve(target, "job-radar-collector.timer"),
  await readFile("systemd/job-radar-collector.timer"),
);
execFileSync("systemctl", ["--user", "daemon-reload"]);
execFileSync("systemctl", [
  "--user",
  "enable",
  "--now",
  "job-radar-collector.timer",
]);
console.log("Daily user timer enabled.");
