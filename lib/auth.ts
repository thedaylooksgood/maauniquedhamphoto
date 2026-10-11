import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { readDB, writeDB } from "./db";
import { randomToken } from "./crypto";

const COOKIE = "mud_admin";
const DAYS = 7;
const MAX_SESSIONS = 10;

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error("Set JWT_SECRET (min 16 chars) in .env");
  return s;
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12); // strong bcrypt, pure-JS so it works on free hosting
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

// MULTI-LOGIN MODE (for now): every sign-in adds a session, nobody gets kicked.
// To go back to single-admin later, keep only the newest session on login.
export async function createAdminSession() {
  const db = await readDB();
  const sessionId = randomToken(16);
  db.admin.sessions = [...(db.admin.sessions || []), sessionId].slice(-MAX_SESSIONS);
  db.admin.activeSessionId = sessionId;
  db.admin.updatedAt = new Date().toISOString();
  await writeDB(db);
  const token = jwt.sign({ sid: sessionId, role: "admin" }, secret(), { expiresIn: `${DAYS}d` });
  cookies().set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: DAYS * 24 * 3600,
  });
  return sessionId;
}

export async function destroySession() {
  try {
    const token = cookies().get(COOKIE)?.value;
    if (token) {
      const payload = jwt.verify(token, secret()) as { sid: string };
      const db = await readDB();
      db.admin.sessions = (db.admin.sessions || []).filter((s) => s !== payload.sid);
      await writeDB(db);
    }
  } catch {}
  cookies().delete(COOKIE);
}

export async function requireAdmin(): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const token = cookies().get(COOKIE)?.value;
    if (!token) return { ok: false, reason: "Not logged in" };
    const payload = jwt.verify(token, secret()) as { sid: string };
    const db = await readDB();
    const sessions = db.admin.sessions || [];
    const valid = sessions.includes(payload.sid) || payload.sid === db.admin.activeSessionId;
    if (!valid) return { ok: false, reason: "Session expired — please sign in again." };
    return { ok: true };
  } catch {
    return { ok: false, reason: "Session expired" };
  }
}

export async function logoutEverywhere() {
  const db = await readDB();
  db.admin.sessions = [];
  db.admin.activeSessionId = null;
  await writeDB(db);
  cookies().delete(COOKIE);
}
