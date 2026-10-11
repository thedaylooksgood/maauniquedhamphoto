import { listBuckets, publicBucket } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

// Events are Drive folders — read live, no database.
export async function GET() {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  try {
    const buckets = await listBuckets();
    return NextResponse.json({ buckets: buckets.map(publicBucket) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Drive read failed" }, { status: 500 });
  }
}
