import { NextResponse } from "next/server";
import { readDB, writeDB, newId } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";

function mask(a: any) {
  return { id: a.id, label: a.label, rootFolderId: a.rootFolderId, createdAt: a.createdAt, connected: !!a.refreshTokenEnc };
}

export async function GET() {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const db = await readDB();
  return NextResponse.json({ accounts: db.driveAccounts.map(mask) });
}

export async function POST(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { label, clientId, clientSecret, refreshToken, rootFolderId } = await req.json().catch(() => ({}));
  if (!label || !clientId || !clientSecret || !refreshToken || !rootFolderId) {
    return NextResponse.json({ error: "Fill all fields: name, Client ID, Secret, Refresh token, Folder ID" }, { status: 400 });
  }
  const db = await readDB();
  const acc = {
    id: newId("drv"), label: String(label).slice(0, 60),
    clientId: String(clientId).trim(), clientSecret: String(clientSecret).trim(),
    refreshTokenEnc: encrypt(String(refreshToken).trim()),
    rootFolderId: String(rootFolderId).trim(), createdAt: new Date().toISOString(),
  };
  db.driveAccounts.unshift(acc);
  await writeDB(db);
  return NextResponse.json({ account: mask(acc) });
}

export async function DELETE(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const db = await readDB();
  if (db.buckets.some((b) => b.driveAccountId === id)) {
    return NextResponse.json({ error: "An event still uses this account. Move the event first." }, { status: 400 });
  }
  db.driveAccounts = db.driveAccounts.filter((x) => x.id !== id);
  await writeDB(db);
  return NextResponse.json({ ok: true });
}
