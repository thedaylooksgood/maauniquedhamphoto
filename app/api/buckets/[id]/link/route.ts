import { NextResponse } from "next/server";
import { readDB, uploadPageUrl } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Admin-only: returns the full private upload URL (with secret token) for QR.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const db = await readDB();
  const b = db.buckets.find((x) => x.id === params.id);
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ url: uploadPageUrl(b), slug: b.slug });
}
