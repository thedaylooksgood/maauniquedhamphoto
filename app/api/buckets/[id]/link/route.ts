import { NextResponse } from "next/server";
import { getBucketById, uploadPageUrl } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Admin-only: returns the full private upload URL (with secret token) for QR.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const b = await getBucketById(params.id);
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const origin = new URL(req.url).origin;
  return NextResponse.json({ url: uploadPageUrl(b, origin), slug: b.slug });
}
