import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readDB, writeDB, newId } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { exchangeCode, googleConfig, APP_ROOT_NAME } from "@/lib/google";
import { findOrCreateFolder } from "@/lib/drive";
import { encrypt } from "@/lib/crypto";

// Step 2: Google sends the admin back here → we save their Drive connection.
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
    const { clientId, clientSecret } = googleConfig();
    const db = await readDB();
    const label = email ? `Google Drive (${email})` : `Google Drive ${new Date().toLocaleDateString()}`;
    let acc = email ? db.driveAccounts.find((x) => x.label === label) : undefined;
    if (acc) {
      acc.clientId = clientId;
      acc.clientSecret = clientSecret;
      acc.refreshTokenEnc = encrypt(refreshToken);
    } else {
      acc = {
        id: newId("drv"),
        label,
        clientId,
        clientSecret,
        refreshTokenEnc: encrypt(refreshToken),
        rootFolderId: "root",
        createdAt: new Date().toISOString(),
      };
      db.driveAccounts.unshift(acc);
    }
    // The portal keeps its own folder ("Maa Unique Dham") so it only ever
    // touches what it created — this is what keeps it inside Google's rules.
    try {
      const appFolder = await findOrCreateFolder(acc, APP_ROOT_NAME, "root");
      if (!acc.rootFolderId || acc.rootFolderId === "root") acc.rootFolderId = appFolder;
    } catch {}
    await writeDB(db);
    const res = NextResponse.redirect(
      new URL(`/admin/drive-result?ok=1&msg=${encodeURIComponent(email || "Google Drive")}`, req.url)
    );
    res.cookies.delete("mud_oauth");
    res.cookies.delete("mud_pkce");
    return res;
  } catch (e: any) {
    return fail(e.message || "Google connection failed. Please try again.");
  }
}
