import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const requireLogin = process.env.VERIFY_AUTH_MODE === "owner";
const credentials = requireLogin
  ? await readFile("../.local/owner-access.txt", "utf8")
  : "";
const email = /Owner email: (.*)/.exec(credentials)?.[1] ?? "",
  password = /Temporary password: (.*)/.exec(credentials)?.[1] ?? "";
const db = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } },
);
const url = "https://example.com/job-radar-browser-" + Date.now();
let jid: string | undefined;
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const inserted = await db.rpc("collector_ingest", {
    p_profile: "skills-v2",
    p_job: {
      canonical_url: url,
      apply_url: url,
      company: "Browser verification",
      title: "Temporary Python API verification role",
      description:
        "This temporary role verifies real application tracking. Removed after verification.",
      work_mode: "remote",
      eligible_from_india: "yes",
      posting_status: "uncertain",
      required_skills: ["Python"],
      preferred_skills: [],
      responsibilities: ["Build APIs"],
    },
    p_match: {
      technical_score: 90,
      role_score: 90,
      experience_score: 100,
      total_score: 92,
      matching_evidence: [],
      missing_requirements: [],
      recommendation: "Verification only",
    },
  });
  if (inserted.error)
    throw new Error("Could not create browser verification fixture.");
  jid = inserted.data;
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.name));
  if (requireLogin) {
    await page.goto("http://127.0.0.1:3000/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("http://127.0.0.1:3000/");
  }
  await page.goto("http://127.0.0.1:3000/jobs/" + jid);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Mark as applied", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector<HTMLSelectElement>(".jr-status-control select")
        ?.value === "applied",
  );
  await page.reload();
  await page.waitForFunction(
    () =>
      document.querySelector<HTMLSelectElement>(".jr-status-control select")
        ?.value === "applied",
  );
  await mkdir("../.local/screenshots", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "../.local/screenshots/applied-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".jr-status-control").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "../.local/screenshots/applied-phone.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  let token = "";
  if (requireLogin) {
    const login = await fetch("http://127.0.0.1:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(login.status, 200);
    const session = (await login.json()) as { access_token: string };
    token = session.access_token;
  }
  const response = await fetch("http://127.0.0.1:3001/api/jobs/" + jid, {
    headers: token ? { Authorization: "Bearer " + token } : {},
  });
  assert.equal(response.status, 200);
  const job = (await response.json()) as { status: string };
  assert.equal(job.status, "applied");
  if (requireLogin) {
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("http://127.0.0.1:3000/");
    assert.equal(
      (await page.context().cookies()).some((c) => c.name === "jr-access"),
      false,
    );
  } else
    assert.equal(
      await page.getByRole("link", { name: /Sign in for/ }).count(),
      0,
    );
  assert.deepEqual(errors, []);
  console.log(
    "Browser access → Mark as applied → reload → shared mobile API verified; screenshots saved privately.",
  );
} finally {
  await browser.close();
  if (jid) {
    const { error } = await db.from("jobs").delete().eq("id", jid);
    if (error) throw new Error("Browser fixture cleanup failed.");
  }
}
