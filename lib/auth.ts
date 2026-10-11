import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { randomToken } from "./crypto";

const COOKIE = "mud_admin";
const DAYS = 7;

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error("Set JWT_SECRET (min 16 chars) in env.");
  return s;
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

// No database: the admin password lives in the ADMIN_PASSWORD env var
// (server-only, encrypted at rest by the host, never sent anywhere).
// Compared in constant time. NOTE: bcrypt hashes can't live in .env files —
// Next.js strips their $ signs — so the plain password goes here instead.
import crypto from "node:crypto";
export function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || !input) return false;
  const a = crypto.createHash("sha256").update(String(input)).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Back-compat: old setups stored a bcrypt hash. Supports both.
export async function verifyAdminPasswordAny(input: string): Promise<boolean> {
  if (verifyAdminPassword(input)) return true;
  const hash = process.env.ADMIN_PASSWORD_HASH || "";
  if (hash && hash.startsWith("$2")) {
    try { return await bcrypt.compare(String(input), hash); } catch { return false; }
  }
  return false;
}

// Stateless session: everything needed is inside the signed cookie.
// No server list, nothing to store, nothing that can desync between devices.
export async function createAdminSession() {
  const sessionId = randomToken(16);
  const token = jwt.sign({ sid: sessionId, role: "admin" }, secret(), { expiresIn: `${DAYS}d` });
  cookies().set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: DAYS * 24 * 3600,
  });
  return sessionId;
}

export async function destroySession() {
  cookies().delete(COOKIE);
}

export async function requireAdmin(): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const token = cookies().get(COOKIE)?.value;
    if (!token) return { ok: false, reason: "Not logged in" };
    jwt.verify(token, secret());
    return { ok: true };
  } catch {
    return { ok: false, reason: "Session expired — please sign in again." };
  }
}

export async function logoutEverywhere() {
  cookies().delete(COOKIE);
}
