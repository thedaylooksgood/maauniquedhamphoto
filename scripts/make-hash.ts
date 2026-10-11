// Usage: npx tsx scripts/make-hash.ts "Your-Strong-Password-12+chars"
import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const pw = process.argv[2];
  if (!pw || pw.length < 12) {
    console.error('Usage: npx tsx scripts/make-hash.ts "Your-Strong-Password-12+chars"');
    process.exit(1);
  }
  const hash = await bcrypt.hash(pw, 12);
  const dbPath = path.join(process.cwd(), "data", "db.json");
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  let db: any = { admin: {}, driveAccounts: [], buckets: [], uploads: [], devices: [] };
  try { db = JSON.parse(await fs.readFile(dbPath, "utf8")); } catch {}
  db.admin = { ...(db.admin || {}), passwordHash: hash, activeSessionId: null, sessions: [], updatedAt: new Date().toISOString() };
  db.driveAccounts ??= []; db.buckets ??= []; db.uploads ??= []; db.devices ??= [];
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
  console.log("OK — password set in data/db.json");
  console.log("Paste into Vercel env / .env.local as ADMIN_PASSWORD_HASH:");
  console.log(hash);
}
main();
