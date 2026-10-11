import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { envAccount, aboutEmail } from "@/lib/drive";
import { appRootId } from "@/lib/db";
import { APP_ROOT_NAME } from "@/lib/google";

// Tells the dashboard what the admin still needs to do:
// 1) one-time key (clientConfigured) 2) paste refresh token (driveReady).
export async function GET(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const clientConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const origin = new URL(req.url).origin;
  const redirectUri = `${(process.env.SITE_URL || origin).replace(/\/$/, "")}/api/drive/callback`;
  if (!clientConfigured) return NextResponse.json({ clientConfigured: false, driveReady: false, redirectUri });
  try {
    const acc = envAccount(); // throws until GOOGLE_REFRESH_TOKEN is pasted
    const email = await aboutEmail(acc).catch(() => "");
    let root = "";
    try { root = await appRootId(); } catch {}
    return NextResponse.json({ clientConfigured: true, driveReady: !!email || !!root, redirectUri, email, rootName: APP_ROOT_NAME });
  } catch (e: any) {
    return NextResponse.json({ clientConfigured: true, driveReady: false, redirectUri, hint: e.message });
  }
}
