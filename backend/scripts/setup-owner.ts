import { randomBytes } from "node:crypto";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { database } from "../src/database";
const email = process.env.OWNER_EMAIL;
if (!email) throw new Error("Set OWNER_EMAIL in backend/.env first.");
const db = database();
const { data: users, error: listError } = await db.auth.admin.listUsers({
  perPage: 1000,
});
if (listError) throw new Error("Could not inspect owner accounts.");
const existing = users.users.find((u) => u.email === email);
if (existing) {
  await appendFile(".env", `\nOWNER_USER_ID=${existing.id}\n`);
  console.log("Existing owner configured. Password was not changed.");
} else {
  const password =
    process.env.OWNER_PASSWORD || randomBytes(24).toString("base64url");
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error("Owner account creation failed.");
  await mkdir("../.local", { recursive: true, mode: 0o700 });
  await writeFile(
    "../.local/owner-access.txt",
    `Owner email: ${email}\nTemporary password: ${password}\nChange this password after first sign-in.\n`,
    { mode: 0o600, flag: "wx" },
  );
  await appendFile(".env", `\nOWNER_USER_ID=${data.user.id}\n`);
  console.log(
    "Owner created. Credentials are in .local/owner-access.txt (not printed).",
  );
}
