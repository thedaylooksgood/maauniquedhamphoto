import { NextResponse } from "next/server";
import { readDB, writeDB, publicBucket, uploadPageUrl } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { randomToken } from "@/lib/crypto";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const db = await readDB();
  const b = db.buckets.find((x) => x.id === params.id);
  if (!b) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (typeof body.name === "string" && body.name.trim()) b.name = body.name.trim().slice(0, 80);
  if (typeof body.description === "string") b.description = body.description.slice(0, 300);
  if (typeof body.isActive === "boolean") b.isActive = body.isActive;
  if (body.regenerateQR === true) b.qrToken = randomToken(16); // old QR stops working instantly
  await writeDB(db);
  return NextResponse.json({ bucket: publicBucket(b), url: uploadPageUrl(b) });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const db = await readDB();
  db.buckets = db.buckets.filter((x) => x.id !== params.id);
  await writeDB(db);
  return NextResponse.json({ ok: true });
}
