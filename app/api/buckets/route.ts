import { readDB, writeDB, publicBucket } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const db = await readDB();
  return NextResponse.json({ buckets: db.buckets.map((b) => ({ ...publicBucket(b), driveFolderId: b.driveFolderId, driveAccountId: b.driveAccountId })) });
}
