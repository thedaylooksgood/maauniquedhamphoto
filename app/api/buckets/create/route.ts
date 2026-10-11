import { NextResponse } from "next/server";
import { readDB, writeDB, newId, slugify, publicBucket, uploadPageUrl } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { findOrCreateFolder } from "@/lib/drive";
import { randomToken } from "@/lib/crypto";

export async function POST(req: Request) {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const { name, description, driveAccountId, parentFolderId, logoText } = await req.json().catch(() => ({}));
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Give the event a name (e.g. Diwali Bhandara)" }, { status: 400 });
  }
  const db = await readDB();
  const account = db.driveAccounts.find((x) => x.id === driveAccountId) ?? db.driveAccounts[0];
  if (!account) return NextResponse.json({ error: "Connect a Google Drive account first." }, { status: 400 });

  const parent = (typeof parentFolderId === "string" && parentFolderId) || account.rootFolderId;
  if (!parent) return NextResponse.json({ error: "Pick where to store this event in Drive." }, { status: 400 });

  // Dedicated folder for THIS event only — uploads can never leak elsewhere
  const folderName = `${new Date().toISOString().slice(0, 10)} ${name.trim()}`.slice(0, 100);
  let driveFolderId: string;
  try {
    driveFolderId = await findOrCreateFolder(account, folderName, parent);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Drive folder failed" }, { status: 500 });
  }

  const base = slugify(name);
  let slug = base;
  let i = 2;
  while (db.buckets.some((b) => b.slug === slug)) slug = `${base}-${i++}`;

  const bucket = {
    id: newId("bkt"),
    name: name.trim(),
    slug,
    description: typeof description === "string" ? description.slice(0, 300) : "",
    qrToken: randomToken(16),
    driveAccountId: account.id,
    driveFolderId,
    cover: typeof logoText === "string" ? logoText.slice(0, 60) : "",
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  db.buckets.unshift(bucket);
  await writeDB(db);
  return NextResponse.json({ bucket: { ...publicBucket(bucket), driveFolderId, driveAccountId: account.id }, url: uploadPageUrl(bucket) });
}
