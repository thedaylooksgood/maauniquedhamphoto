import { NextResponse } from "next/server";
import { readDB, writeDB, newId } from "@/lib/db";
import { verifyFileInFolder } from "@/lib/drive";

// Called AFTER the phone PUTs bytes straight to Google.
// Verifies the file is inside THIS bucket's folder, then registers device+uploader.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { slug, token, fileId, filename, mime, size, uploaderName, uploaderPhone, deviceId } = body ?? {};
  if (!slug || !token || !fileId) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (!uploaderName || String(uploaderName).trim().length < 2) {
    return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
  }
  const db = await readDB();
  const bucket = db.buckets.find((b) => b.slug === slug && b.isActive);
  if (!bucket || bucket.qrToken !== token) return NextResponse.json({ error: "Invalid event link" }, { status: 403 });
  const account = db.driveAccounts.find((x) => x.id === bucket.driveAccountId);
  if (!account) return NextResponse.json({ error: "Storage not connected" }, { status: 500 });

  try {
    const meta = await verifyFileInFolder(account, String(fileId), bucket.driveFolderId);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const ua = req.headers.get("user-agent") || "";
    const devId = String(deviceId || "unknown").slice(0, 60);

    const upload = {
      id: newId("up"),
      bucketId: bucket.id,
      fileId: meta.id,
      filename: String(filename || meta.name).slice(0, 150),
      mime: String(mime || meta.mimeType || ""),
      size: Number(size) || Number(meta.size || 0),
      uploaderName: String(uploaderName).trim().slice(0, 60),
      uploaderPhone: String(uploaderPhone || "").replace(/\D/g, "").slice(0, 15),
      deviceId: devId,
      userAgent: ua.slice(0, 200),
      ip,
      createdAt: new Date().toISOString(),
    };
    db.uploads.unshift(upload);

    let dev = db.devices.find((d) => d.id === devId && d.bucketId === bucket.id);
    if (!dev) {
      dev = { id: devId, bucketId: bucket.id, name: upload.uploaderName, phone: upload.uploaderPhone, userAgent: ua.slice(0, 200), ip, firstSeen: upload.createdAt, uploadCount: 0 };
      db.devices.unshift(dev);
    }
    dev.uploadCount += 1;
    dev.name = upload.uploaderName;
    if (upload.uploaderPhone) dev.phone = upload.uploaderPhone;

    await writeDB(db);
    return NextResponse.json({ ok: true, id: upload.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Verification failed" }, { status: 400 });
  }
}
