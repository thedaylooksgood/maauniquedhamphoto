import crypto from "node:crypto";

const ALGO = "aes-256-gcm";

function key(): Buffer {
  const s = process.env.JWT_SECRET || "dev-secret-change-me-32chars-min!!";
  return crypto.createHash("sha256").update(s).digest();
}

// Encrypt Drive refresh tokens at rest. Never send tokens to the browser.
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("hex");
}
