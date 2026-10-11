import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { envAccount, trashDriveFile } from "@/lib/drive";

export async function DELETE(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  try {
    await trashDriveFile(envAccount(), id); // trashed, recoverable 30 days
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Delete failed" }, { status: 500 });
  }
}
