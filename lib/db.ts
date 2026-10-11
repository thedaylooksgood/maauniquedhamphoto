import { randomUUID } from "node:crypto";
import { randomToken } from "./crypto";
import {
  envAccount, listFolders, findOrCreateFolder, renameFolder,
  trashDriveFile, listFiles,
} from "./drive";
import { APP_ROOT_NAME } from "./google";

// =====================================================================
// NO DATABASE. Google Drive IS the store.
//  - Event buckets  = folders named  "{Display Name}__{slug}__{token}"
//                     paused ones start with "[PAUSED] "
//  - Uploads        = files named   "{YYYYMMDD-HHMMSS}__{Name}__{Phone}__{dev8}__{original}"
// Everything the dashboard shows is read live from Drive and parsed.
// =====================================================================

export type Bucket = {
  id: string; // Drive folder id
  name: string;
  slug: string;
  token: string;
  description: string;
  isActive: boolean;
  createdAt: string;
};

export type Upload = {
  id: string; // Drive file id
  bucketId: string;
  filename: string; // original filename
  mime: string;
  size: number;
  uploaderName: string;
  uploaderPhone: string;
  deviceId: string;
  createdAt: string;
  webViewLink?: string;
};

export type Device = { id: string; name: string; phone: string; uploadCount: number };

const SEP = "__";
const PAUSED = "[PAUSED] ";

export function newId(prefix = "") {
  return (prefix ? prefix + "_" : "") + randomUUID().slice(0, 8);
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\u0900-\u097F]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "event";
}

// Drive forbids  / \ : * ? " < > |  — and "__" is our field separator.
export function cleanPart(s: string, max: number) {
  return (s || "")
    .replace(/__+/g, "--")
    .replace(/[\/\\:*?"<>|\x00-\x1f]/g, "-")
    .trim()
    .slice(0, max);
}

export async function appRootId(): Promise<string> {
  return findOrCreateFolder(envAccount(), APP_ROOT_NAME, "root");
}

function parseBucketFolder(f: { id: string; name: string; description?: string; createdTime?: string }): Bucket | null {
  let raw = f.name;
  let isActive = true;
  if (raw.startsWith(PAUSED)) {
    isActive = false;
    raw = raw.slice(PAUSED.length);
  }
  const m = raw.match(/^(.*)__([^_]+)__([0-9a-f]{16,})$/);
  if (!m) return null; // not one of ours — ignore (never touches other folders)
  return {
    id: f.id,
    name: m[1] || "Untitled event",
    slug: m[2],
    token: m[3],
    description: f.description || "",
    isActive,
    createdAt: f.createdTime || "",
  };
}

export function bucketFolderName(b: { name: string; slug: string; token: string }, paused: boolean) {
  return (paused ? PAUSED : "") + `${b.name}__${b.slug}__${b.token}`;
}

export async function listBuckets(): Promise<Bucket[]> {
  const root = await appRootId();
  const folders = await listFolders(envAccount(), root, 100);
  return folders
    .map(parseBucketFolder)
    .filter((b): b is Bucket => !!b)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function findBucket(slug: string): Promise<Bucket | null> {
  const all = await listBuckets();
  return all.find((b) => b.slug === slug) ?? null;
}

export async function getBucketById(id: string): Promise<Bucket | null> {
  const all = await listBuckets();
  return all.find((b) => b.id === id) ?? null;
}

export async function createBucket(name: string, description: string, parentFolderId = ""): Promise<Bucket> {
  const cleanName = cleanPart(name.trim(), 70) || "Untitled event";
  const all = await listBuckets();
  const base = slugify(cleanName);
  let slug = base;
  let i = 2;
  while (all.some((b) => b.slug === slug)) slug = `${base}-${i++}`;
  const token = randomToken(12); // 24 hex chars, lives only in the folder name
  const root = await appRootId();
  const folderName = `${cleanName}${SEP}${slug}${SEP}${token}`;
  // create via Drive API with description
  const { accessToken } = await import("./drive");
  const t = await accessToken(envAccount());
  const created = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: folderName,
      description: (description || "").slice(0, 500),
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId || root],
    }),
  }).then((r) => r.json());
  if (!created.id) throw new Error("Could not create the event folder in Drive.");
  return { id: created.id as string, name: cleanName, slug, token, description: (description || "").slice(0, 500), isActive: true, createdAt: new Date().toISOString() };
}

export async function updateBucket(
  id: string,
  opts: { name?: string; description?: string; isActive?: boolean; regenerateToken?: boolean }
): Promise<Bucket> {
  const b = await getBucketById(id);
  if (!b) throw new Error("Event not found.");
  const next = {
    name: opts.name?.trim() ? cleanPart(opts.name.trim(), 70) : b.name,
    slug: b.slug, // slug never changes — printed QR links keep working
    token: opts.regenerateToken ? randomToken(12) : b.token,
  };
  const paused = opts.isActive === undefined ? !b.isActive ? true : false : !opts.isActive;
  await renameFolder(envAccount(), id, bucketFolderName(next, paused), opts.description ?? b.description);
  return { ...b, name: next.name, token: next.token, isActive: !paused, description: opts.description ?? b.description };
}

export async function deleteBucket(id: string) {
  // Trash (recoverable from Drive trash for 30 days) — photos stay safe.
  await trashDriveFile(envAccount(), id);
}

export function publicBucket(b: Bucket) {
  return { id: b.id, name: b.name, slug: b.slug, description: b.description, isActive: b.isActive, createdAt: b.createdAt };
}

export function uploadPageUrl(bucket: Bucket, origin: string) {
  return `${origin.replace(/\/$/, "")}/u/${bucket.slug}?k=${bucket.token}`;
}

// ---- filename vault ----
export function stampNow(d = new Date()) {
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function buildFileName(o: { name: string; phone: string; deviceId: string; original: string }) {
  const orig = cleanPart(o.original.replace(/\.[^.]{1,10}$/, ""), 80) + extOf(o.original);
  return [
    stampNow(),
    cleanPart(o.name, 40) || "Guest",
    cleanPart(o.phone.replace(/\D/g, ""), 15) || "nophone",
    cleanPart(o.deviceId, 12) || "nodevice",
    orig || "photo",
  ].join(SEP);
}

function extOf(f: string) {
  const m = f.match(/(\.[^.]{1,10})$/);
  return m ? m[1] : "";
}

export function parseFileName(stored: string): { datetime: string; uploaderName: string; uploaderPhone: string; deviceId: string; original: string } | null {
  const parts = stored.split(SEP);
  if (parts.length < 5) return null;
  if (!/^\d{8}-\d{6}$/.test(parts[0])) return null;
  const [stamp, name, phone, dev, ...rest] = parts;
  const d = `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(9, 11)}:${stamp.slice(11, 13)}:${stamp.slice(13, 15)}`;
  return {
    datetime: d,
    uploaderName: name || "Guest",
    uploaderPhone: phone === "nophone" ? "" : phone,
    deviceId: dev,
    original: rest.join(SEP) || stored,
  };
}

export async function listUploads(bucketId: string): Promise<Upload[]> {
  const files = await listFiles(envAccount(), bucketId, 200);
  return files.map((f) => {
    const p = parseFileName(f.name);
    return {
      id: f.id,
      bucketId,
      filename: p?.original || f.name,
      mime: f.mimeType || "",
      size: Number(f.size || 0),
      uploaderName: p?.uploaderName || "Guest",
      uploaderPhone: p?.uploaderPhone || "",
      deviceId: p?.deviceId || "unknown",
      createdAt: p ? p.datetime : f.createdTime || "",
      webViewLink: f.webViewLink,
    } as Upload;
  });
}

export function devicesFromUploads(uploads: Upload[]): Device[] {
  const map = new Map<string, Device>();
  for (const u of uploads) {
    const d = map.get(u.deviceId) || { id: u.deviceId, name: u.uploaderName, phone: u.uploaderPhone, uploadCount: 0 };
    d.uploadCount += 1;
    if (u.uploaderName && u.uploaderName !== "Guest") d.name = u.uploaderName;
    if (u.uploaderPhone) d.phone = u.uploaderPhone;
    map.set(u.deviceId, d);
  }
  return Array.from(map.values()).sort((a, b) => b.uploadCount - a.uploadCount);
}
