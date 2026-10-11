import { readDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { driveFetch } from "@/lib/drive";
import { NextResponse } from "next/server";

// Private proxy: Drive files stay PRIVATE (no public links).
// Only a logged-in admin (single session) can stream bytes through here.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const db = await readDB();
  const up = db.uploads.find((u) => u.id === params.id);
  if (!up) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bucket = db.buckets.find((b) => b.id === up.bucketId);
  const account = db.driveAccounts.find((x) => x.id === bucket?.driveAccountId);
  if (!account) return NextResponse.json({ error: "Storage missing" }, { status: 500 });
  const thumb = _req.url.includes("thumb=1");
  const url = thumb
    ? `https://www.googleapis.com/drive/v3/files/${up.fileId}?alt=media`
    : `https://www.googleapis.com/drive/v3/files/${up.fileId}?alt=media`;
  void url;
  const r = await driveFetch(account, up.fileId);
  if (!r.ok) return NextResponse.json({ error: "Drive fetch failed" }, { status: 502 });
  const buf = Buffer.from(await r.arrayBuffer());
  return new Response(buf, {
    headers: {
      "Content-Type": up.mime || "application/octet-stream",
      "Content-Length": String(buf.length),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${encodeURIComponent(up.filename)}"`,
    },
  });
}
