import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type DriveAccount = {
  id: string;
  label: string; // e.g. "Main 5TB account"
  clientId: string;
  clientSecret: string;
  refreshTokenEnc: string; // AES-encrypted, never sent to browser
  rootFolderId: string; // Drive folder where buckets live
  createdAt: string;
};

export type Bucket = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  qrToken: string; // secret scoped to this bucket only
  driveAccountId: string;
  driveFolderId: string; // dedicated folder for THIS event only
  cover?: string;
  isActive: boolean;
  createdAt: string;
};

export type Upload = {
  id: string;
  bucketId: string;
  fileId: string; // Drive file id
  filename: string;
  mime: string;
  size: number;
  uploaderName: string;
  uploaderPhone?: string;
  deviceId: string;
  userAgent?: string;
  ip?: string;
  createdAt: string;
};

export type Device = {
  id: string;
  bucketId: string;
  name: string;
  phone?: string;
  userAgent?: string;
  ip?: string;
  firstSeen: string;
  uploadCount: number;
};

type DB = {
  admin: { passwordHash: string; activeSessionId: string | null; sessions: string[]; updatedAt: string };
  driveAccounts: DriveAccount[];
  buckets: Bucket[];
  uploads: Upload[];
  devices: Device[];
};

const DB_PATH = path.join(process.cwd(), "data", "db.json");

async function ensureFile() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    const seed: DB = {
      admin: { passwordHash: "", activeSessionId: null, sessions: [], updatedAt: new Date().toISOString() },
      driveAccounts: [],
      buckets: [],
      uploads: [],
      devices: [],
    };
    await fs.writeFile(DB_PATH, JSON.stringify(seed, null, 2));
  }
}

export async function readDB(): Promise<DB> {
  await ensureFile();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw) as DB;
}

export async function writeDB(db: DB) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = DB_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_PATH);
}

export function newId(prefix = "") {
  return (prefix ? prefix + "_" : "") + randomUUID().slice(0, 8);
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\u0900-\u097F]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "event";
}

// ---- bucket helpers ----
export async function getBucketBySlug(slug: string) {
  const db = await readDB();
  return db.buckets.find((b) => b.slug === slug && b.isActive) ?? null;
}

export async function getBucketById(id: string) {
  const db = await readDB();
  return db.buckets.find((b) => b.id === id) ?? null;
}

export function publicBucket(b: Bucket) {
  return { id: b.id, name: b.name, slug: b.slug, description: b.description ?? "", isActive: b.isActive, createdAt: b.createdAt };
}

export function uploadPageUrl(bucket: Bucket) {
  const base = process.env.SITE_URL ?? "";
  return `${base}/u/${bucket.slug}?k=${bucket.qrToken}`;
}
