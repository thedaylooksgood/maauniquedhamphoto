import { NextResponse } from "next/server";
import { requireAdmin, verifyAdminPasswordAny, logoutEverywhere } from "@/lib/auth";

// No database, so a new password can't save itself —
// we verify the current one, then tell you exactly where to type the new one.
export async function POST(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { current, next } = await req.json().catch(() => ({}));
  if (!next || String(next).length < 12) {
    return NextResponse.json({ error: "New password must be 12+ characters (avoid the $ sign — it breaks settings files)" }, { status: 400 });
  }
  const ok = await verifyAdminPasswordAny(String(current || ""));
  if (!ok) return NextResponse.json({ error: "Current password wrong" }, { status: 401 });
  await logoutEverywhere();
  return NextResponse.json({
    ok: true,
    how: "Now set ADMIN_PASSWORD to your new password in hosting settings (.env.local locally, Environment Variables on Vercel) and redeploy. Then sign in with it.",
  });
}
