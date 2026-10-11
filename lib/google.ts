import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";

// SAFETY-FIRST Google access (follows Google's own least-privilege rule):
// - drive.file ONLY: the portal can touch just the files/folders IT creates.
//   It can never see, open or change anything else in your Drive.
//   This also means no "restricted scope" review is ever needed for own-temple use.
// - No email scope: we read your address from Drive itself (about API) only to label the account.
// - PKCE on every login + short-lived state cookie + offline refresh tokens stored AES-encrypted.
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
export const APP_ROOT_NAME = "Maa Unique Dham";

export function redirectUri(origin: string) {
  const base = (process.env.SITE_URL || origin).replace(/\/$/, "");
  return `${base}/api/drive/callback`;
}

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) {
    throw new Error(
      "Google login needs its one-time free key first (README: 5 min, done once). After that this button just works."
    );
  }
  return { clientId, clientSecret };
}

export function newPkce() {
  const verifier = crypto.randomBytes(48).toString("hex"); // 96 chars, valid PKCE
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function buildAuthUrl(origin: string, state: string, challenge: string) {
  const { clientId, clientSecret } = googleConfig();
  const c = new OAuth2Client(clientId, clientSecret, redirectUri(origin));
  return c.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forces Google to always return a reusable refresh token
    scope: SCOPES,
    state,
    code_challenge_method: "S256",
    code_challenge: challenge,
  } as any);
}

export async function exchangeCode(origin: string, code: string, verifier: string) {
  const { clientId, clientSecret } = googleConfig();
  const c = new OAuth2Client(clientId, clientSecret, redirectUri(origin));
  const { tokens } = await c.getToken({ code, codeVerifier: verifier } as any);
  if (!tokens.access_token) throw new Error("Google did not return access. Please try again.");
  // Label the account with the owner's address (via Drive itself — no extra permission asked).
  let email = "";
  try {
    const about = await fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }).then((r) => r.json());
    email = about?.user?.emailAddress || "";
  } catch {}
  return { refreshToken: tokens.refresh_token || "", email, accessToken: tokens.access_token };
}
