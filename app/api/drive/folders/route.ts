import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { envAccount, listFolders, findOrCreateFolder } from "@/lib/drive";
import { appRootId } from "@/lib/db";

// Browse folders inside the portal's own area (Google only shows what the app made).
export async function GET(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const parent = searchParams.get("parent") || "";
  try {
    const acc = envAccount();
    const root = await appRootId();
    const folders = await listFolders(acc, parent || root);
    return NextResponse.json({ folders, root });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Make a new folder inside the portal's own area.
export async function POST(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { parent, name } = await req.json().catch(() => ({}));
  if (!name || String(name).trim().length < 2) {
    return NextResponse.json({ error: "Give the new folder a name." }, { status: 400 });
  }
  try {
    const acc = envAccount();
    const root = await appRootId();
    const id = await findOrCreateFolder(acc, String(name).trim().slice(0, 80), parent || root);
    return NextResponse.json({ id, name: String(name).trim() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
