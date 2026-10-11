import { NextResponse } from "next/server";
import { createBucket, publicBucket, uploadPageUrl } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { name, description, parentFolderId } = await req.json().catch(() => ({}));
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Give the event a name (e.g. Diwali Bhandara)" }, { status: 400 });
  }
  try {
    const bucket = await createBucket(name, typeof description === "string" ? description : "", typeof parentFolderId === "string" ? parentFolderId : "");
    const origin = new URL(req.url).origin;
    return NextResponse.json({ bucket: publicBucket(bucket), url: uploadPageUrl(bucket, origin) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not create event" }, { status: 500 });
  }
}
