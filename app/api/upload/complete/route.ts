import { NextResponse } from "next/server";
import { findBucket, parseFileName } from "@/lib/db";
import { envAccount, verifyFileInFolder } from "@/lib/drive";

// Called AFTER the phone PUTs bytes straight to Google.
// Verifies the file is inside THIS bucket's folder, then reads back
// who sent it from the filename itself. Nothing is stored anywhere else.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { slug, token, fileId } = body ?? {};
  if (!slug || !token || !fileId) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  try {
    const bucket = await findBucket(String(slug));
    if (!bucket || !bucket.isActive || bucket.token !== token) {
      return NextResponse.json({ error: "Invalid event link" }, { status: 403 });
    }
    const meta = await verifyFileInFolder(envAccount(), String(fileId), bucket.id);
    const p = parseFileName(meta.name);
    return NextResponse.json({
      ok: true,
      id: meta.id,
      uploader: p?.uploaderName || "Guest",
      when: p?.datetime || "",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Verification failed" }, { status: 400 });
  }
}
