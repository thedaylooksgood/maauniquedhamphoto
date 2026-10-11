import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ ok: false, reason: a.reason }, { status: 401 });
  return NextResponse.json({ ok: true });
}
