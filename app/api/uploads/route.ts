import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Admin-only. Uploaders can NEVER list the gallery — only the dashboard can.
export async function GET(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const bucketId = searchParams.get("bucketId") || "";
  const q = (searchParams.get("q") || "").toLowerCase();
  const type = searchParams.get("type") || "all";
  const db = await readDB();
  let list = db.uploads.slice().sort((x, y) => y.createdAt.localeCompare(x.createdAt));
  if (bucketId) list = list.filter((u) => u.bucketId === bucketId);
  if (type === "photo") list = list.filter((u) => u.mime.startsWith("image/"));
  if (type === "video") list = list.filter((u) => u.mime.startsWith("video/"));
  if (q) list = list.filter((u) => (u.uploaderName + " " + u.filename + " " + (u.uploaderPhone || "")).toLowerCase().includes(q));
  const totalBytes = list.reduce((s, u) => s + (u.size || 0), 0);
  return NextResponse.json({
    uploads: list.slice(0, 500),
    count: list.length,
    totalBytes,
    devices: db.devices.filter((d) => !bucketId || d.bucketId === bucketId).slice(0, 200),
  });
}
