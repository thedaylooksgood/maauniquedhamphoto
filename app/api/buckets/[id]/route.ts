import { NextResponse } from "next/server";
import { getBucketById, updateBucket, deleteBucket, publicBucket, uploadPageUrl } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const b = await updateBucket(params.id, {
      name: typeof body.name === "string" ? body.name : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      regenerateToken: body.regenerateQR === true,
    });
    const origin = new URL(req.url).origin;
    return NextResponse.json({ bucket: publicBucket(b), url: uploadPageUrl(b, origin) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  try {
    await deleteBucket(params.id); // trashed in Drive — recoverable for 30 days
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Delete failed" }, { status: 500 });
  }
}
