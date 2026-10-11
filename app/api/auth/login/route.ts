import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { verifyPassword, createAdminSession } from "@/lib/auth";

const attempts = new Map<string, { n: number; until: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const cur = attempts.get(ip);
  if (cur && Date.now() < cur.until && cur.n >= 8) {
    return NextResponse.json({ error: "Too many tries. Wait 5 minutes." }, { status: 429 });
  }
  const { password } = await req.json().catch(() => ({}));
  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Enter password" }, { status: 400 });
  }
  const db = await readDB();
  if (!db.admin.passwordHash) {
    return NextResponse.json({ error: "Admin password not set yet. Run setup (see README)." }, { status: 500 });
  }
  const ok = await verifyPassword(password, db.admin.passwordHash);
  if (!ok) {
    const n = (cur?.n ?? 0) + 1;
    attempts.set(ip, { n, until: n >= 8 ? Date.now() + 5 * 60 * 1000 : 0 });
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  attempts.delete(ip);
  await createAdminSession(); // invalidates any other logged-in device instantly
  return NextResponse.json({ ok: true });
}
