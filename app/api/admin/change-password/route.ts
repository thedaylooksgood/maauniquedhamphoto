import { NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/db";
import { requireAdmin, hashPassword, verifyPassword, logoutEverywhere } from "@/lib/auth";

export async function POST(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { current, next } = await req.json().catch(() => ({}));
  if (!next || String(next).length < 12) {
    return NextResponse.json({ error: "New password must be 12+ chars (mix case + number + symbol)" }, { status: 400 });
  }
  const db = await readDB();
  const ok = await verifyPassword(String(current || ""), db.admin.passwordHash);
  if (!ok) return NextResponse.json({ error: "Current password wrong" }, { status: 401 });
  db.admin.passwordHash = await hashPassword(String(next));
  await writeDB(db);
  await logoutEverywhere(); // force re-login on this device too
  return NextResponse.json({ ok: true });
}
