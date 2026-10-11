import { NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteDriveFile } from "@/lib/drive";

export async function DELETE(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const db = await readDB();
  const up = db.uploads.find((u) => u.id === id);
  if (!up) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bucket = db.buckets.find((b) => b.id === up.bucketId);
  const account = db.driveAccounts.find((x) => x.id === bucket?.driveAccountId);
  if (account) await deleteDriveFile(account, up.fileId).catch(() => {});
  db.uploads = db.uploads.filter((u) => u.id !== id);
  await writeDB(db);
  return NextResponse.json({ ok: true });
}
