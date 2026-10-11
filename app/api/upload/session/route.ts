import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { createResumableSession } from "@/lib/drive";

// Public but tightly scoped: needs correct slug + secret bucket token.
// Returns a one-file upload URL locked to THIS event's Drive folder.
export async function POST(req: Request) {
  const { slug, token, filename, mime, size } = await req.json().catch(() => ({}));
  if (!slug || !token || !filename || !size) {
    return NextResponse.json({ error: "Missing details" }, { status: 400 });
  }
  if (typeof size !== "number" || size <= 0 || size > 5 * 1024 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5GB)" }, { status: 400 });
  }
  const okTypes = /^(image|video)\//;
  if (!okTypes.test(String(mime || ""))) {
    return NextResponse.json({ error: "Only photos and videos allowed" }, { status: 400 });
  }
  const db = await readDB();
  const bucket = db.buckets.find((b) => b.slug === slug && b.isActive);
  if (!bucket || bucket.qrToken !== token) {
    return NextResponse.json({ error: "This QR link is invalid or closed." }, { status: 403 });
  }
  const account = db.driveAccounts.find((x) => x.id === bucket.driveAccountId);
  if (!account) return NextResponse.json({ error: "Event storage not connected." }, { status: 500 });
  try {
    const sessionUrl = await createResumableSession(account, bucket.driveFolderId, String(filename), String(mime), size);
    return NextResponse.json({ sessionUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not start upload" }, { status: 500 });
  }
}
