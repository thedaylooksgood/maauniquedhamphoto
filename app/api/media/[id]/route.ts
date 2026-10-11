import { requireAdmin } from "@/lib/auth";
import { envAccount, driveFetch, verifyFileInFolder } from "@/lib/drive";
import { parseFileName } from "@/lib/db";
import { NextResponse } from "next/server";

// Private proxy: Drive files stay PRIVATE (no public links).
// Only a signed-in admin can stream bytes through here, and only from the
// event folder given — never from anywhere else in the Drive.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const bucketId = searchParams.get("bucketId") || "";
  const dl = searchParams.get("download") === "1";
  try {
    const account = envAccount();
    const meta = bucketId
      ? await verifyFileInFolder(account, params.id, bucketId)
      : null;
    const r = await driveFetch(account, params.id);
    if (!r.ok) return NextResponse.json({ error: "Drive fetch failed" }, { status: 502 });
    const buf = Buffer.from(await r.arrayBuffer());
    const stored = meta?.name || "photo";
    const filename = (parseFileName(stored)?.original || stored).replace(/"/g, "");
    return new Response(buf, {
      headers: {
        "Content-Type": r.headers.get("content-type") || "application/octet-stream",
        "Content-Length": String(buf.length),
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `${dl ? "attachment" : "inline"}; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Fetch failed" }, { status: 500 });
  }
}
