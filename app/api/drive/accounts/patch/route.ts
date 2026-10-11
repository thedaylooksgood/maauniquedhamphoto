import { NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Change an account's nickname or storage folder (visual picker in the dashboard).
export async function PATCH(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { id, label, rootFolderId } = await req.json().catch(() => ({}));
  const db = await readDB();
  const acc = db.driveAccounts.find((x) => x.id === id);
  if (!acc) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (typeof label === "string" && label.trim()) acc.label = label.trim().slice(0, 80);
  if (typeof rootFolderId === "string" && rootFolderId.trim()) acc.rootFolderId = rootFolderId.trim();
  await writeDB(db);
  return NextResponse.json({ ok: true });
}
