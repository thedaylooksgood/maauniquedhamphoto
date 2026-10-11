import { NextResponse } from "next/server";
import { findBucket, buildFileName } from "@/lib/db";
import { envAccount, createResumableSession } from "@/lib/drive";

// Public but tightly scoped: needs correct slug + secret bucket token.
// The uploader's name/phone/device + timestamp are stamped INTO the filename,
// so the dashboard can later show who sent what with no database at all.
// Returns a one-file upload URL locked to THIS event's Drive folder.
export async function POST(req: Request) {
  const { slug, token, filename, mime, size, uploaderName, uploaderPhone, deviceId } = await req.json().catch(() => ({}));
  if (!slug || !token || !filename || !size) {
    return NextResponse.json({ error: "Missing details" }, { status: 400 });
  }
  if (typeof size !== "number" || size <= 0 || size > 5 * 1024 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5GB)" }, { status: 400 });
  }
  if (!/^(image|video)\//.test(String(mime || ""))) {
    return NextResponse.json({ error: "Only photos and videos allowed" }, { status: 400 });
  }
  try {
    const bucket = await findBucket(String(slug));
    if (!bucket || !bucket.isActive || bucket.token !== token) {
      return NextResponse.json({ error: "This QR link is invalid or closed." }, { status: 403 });
    }
    const stored = buildFileName({
      name: String(uploaderName || "Guest"),
      phone: String(uploaderPhone || ""),
      deviceId: String(deviceId || "nodevice"),
      original: String(filename),
    });
    const sessionUrl = await createResumableSession(envAccount(), bucket.id, stored, String(mime), size);
    return NextResponse.json({ sessionUrl, stored });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not start upload" }, { status: 500 });
  }
}
