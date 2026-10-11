import { NextResponse } from "next/server";
import { listUploads, devicesFromUploads } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Admin-only. Reads the event folder live from Drive and decodes the filenames.
// Uploaders can NEVER list the gallery — only the dashboard can.
export async function GET(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const bucketId = searchParams.get("bucketId") || "";
  const q = (searchParams.get("q") || "").toLowerCase();
  const type = searchParams.get("type") || "all";
  if (!bucketId) return NextResponse.json({ uploads: [], count: 0, totalBytes: 0, devices: [] });
  try {
    let list = await listUploads(bucketId);
    if (type === "photo") list = list.filter((u) => u.mime.startsWith("image/"));
    if (type === "video") list = list.filter((u) => u.mime.startsWith("video/"));
    if (q) list = list.filter((u) => (u.uploaderName + " " + u.filename + " " + (u.uploaderPhone || "")).toLowerCase().includes(q));
    const totalBytes = list.reduce((s, u) => s + (u.size || 0), 0);
    return NextResponse.json({
      uploads: list.slice(0, 200),
      count: list.length,
      totalBytes,
      devices: devicesFromUploads(await listUploads(bucketId)).slice(0, 200),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Drive read failed" }, { status: 500 });
  }
}
