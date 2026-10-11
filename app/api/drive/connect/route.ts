import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { buildAuthUrl, newPkce } from "@/lib/google";
import { randomToken } from "@/lib/crypto";

// Step 1: admin clicks "Connect with Google" → we send them to Google.
export async function GET(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  const origin = new URL(req.url).origin;
  const state = randomToken(12);
  const { verifier, challenge } = newPkce();
  let url: string;
  try {
    url = buildAuthUrl(origin, state, challenge);
  } catch (e: any) {
    return NextResponse.redirect(
      new URL(`/admin/drive-result?ok=0&msg=${encodeURIComponent(e.message)}`, req.url)
    );
  }
  const res = NextResponse.redirect(url);
  const safe = { httpOnly: true, path: "/", maxAge: 600, sameSite: "lax" as const };
  res.cookies.set("mud_oauth", state, safe);
  res.cookies.set("mud_pkce", verifier, safe);
  return res;
}
