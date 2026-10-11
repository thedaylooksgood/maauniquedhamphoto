import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

// Tells the dashboard whether the one-time Google setup is done,
// so it can show "Connect" or friendly setup steps instead.
export async function GET(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const origin = new URL(req.url).origin;
  const redirectUri = `${(process.env.SITE_URL || origin).replace(/\/$/, "")}/api/drive/callback`;
  return NextResponse.json({ configured, redirectUri });
}
