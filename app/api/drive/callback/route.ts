import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { exchangeCode } from "@/lib/google";

// After Google sign-in, we do NOT save anything anywhere (no database).
// The reusable key is handed to the admin once, to paste into hosting settings.
export async function GET(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.redirect(new URL("/admin/login", req.url));
  const fail = (msg: string) =>
    NextResponse.redirect(new URL(`/admin/drive-result?ok=0&msg=${encodeURIComponent(msg)}`, req.url));

  const { searchParams } = new URL(req.url);
  if (searchParams.get("error")) return fail("Google sign-in was cancelled. Press Connect and Allow to finish.");
  const code = searchParams.get("code") || "";
  const state = searchParams.get("state") || "";
  const jar = cookies();
  const wantState = jar.get("mud_oauth")?.value || "";
  const verifier = jar.get("mud_pkce")?.value || "";
  if (!code || !state || state !== wantState || !verifier) {
    return fail("That sign-in link expired. Press Connect with Google again.");
  }

  const origin = new URL(req.url).origin;
  try {
    const { refreshToken, email } = await exchangeCode(origin, code, verifier);
    if (!refreshToken) {
      return fail("Google did not give a reusable key. Open myaccount.google.com → Security → remove this app's access, then Connect again.");
    }
    const res = NextResponse.redirect(new URL(`/admin/drive-result?ok=1&fresh=1&msg=${encodeURIComponent(email || "Google Drive")}`, req.url));
    res.cookies.delete("mud_oauth");
    res.cookies.delete("mud_pkce");
    // Held 5 minutes in a cookie only you can read, then gone. Copy it to hosting settings.
    res.cookies.set("mud_token", `${refreshToken}::${email}`, { httpOnly: true, path: "/", maxAge: 300, sameSite: "lax" });
    return res;
  } catch (e: any) {
    return fail(e.message || "Google connection failed. Please try again.");
  }
}
