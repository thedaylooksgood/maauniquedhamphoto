import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { listFolders, findOrCreateFolder } from "@/lib/drive";

export async function GET(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId") || "";
  const parent = searchParams.get("parent") || "";
  const db = await readDB();
  const acc = db.driveAccounts.find((x) => x.id === accountId);
  if (!acc) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  try {
    const folders = await listFolders(acc, parent || acc.rootFolderId);
    return NextResponse.json({ folders, root: acc.rootFolderId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Make a new folder inside the chosen location (used by the visual picker).
export async function POST(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { accountId, parent, name } = await req.json().catch(() => ({}));
  if (!accountId || !name || String(name).trim().length < 2) {
    return NextResponse.json({ error: "Give the new folder a name." }, { status: 400 });
  }
  const db = await readDB();
  const acc = db.driveAccounts.find((x) => x.id === accountId);
  if (!acc) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  try {
    const id = await findOrCreateFolder(acc, String(name).trim().slice(0, 80), parent || acc.rootFolderId);
    return NextResponse.json({ id, name: String(name).trim() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
