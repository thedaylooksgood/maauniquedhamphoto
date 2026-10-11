import { OAuth2Client } from "google-auth-library";
import { decrypt } from "./crypto";
import type { DriveAccount } from "./db";

export function oauthForAccount(a: { clientId: string; clientSecret: string; refreshTokenEnc: string }) {
  const c = new OAuth2Client(a.clientId, a.clientSecret);
  c.setCredentials({ refresh_token: decrypt(a.refreshTokenEnc) });
  return c;
}

export async function accessToken(a: { clientId: string; clientSecret: string; refreshTokenEnc: string }) {
  const c = oauthForAccount(a);
  const t = await c.getAccessToken();
  if (!t.token) throw new Error("Google auth failed — reconnect Drive account.");
  return t.token;
}

// Short-lived capability URL scoped to ONE file in ONE folder.
// Browser PUTs bytes straight to Google — Drive secret never leaves server,
// and the URL can't list/read anything else. Supports HD video (GBs).
export async function createResumableSession(
  account: DriveAccount,
  folderId: string,
  filename: string,
  mime: string,
  size: number
): Promise<string> {
  const token = await accessToken(account);
  const safe = filename.replace(/[\\/:*?"<>|]/g, "_").slice(0, 150) || "photo";
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": mime || "application/octet-stream",
      "X-Upload-Content-Length": String(size),
    },
    body: JSON.stringify({ name: safe, parents: [folderId] }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Drive session failed (${res.status}): ${t.slice(0, 200)}`);
  }
  const url = res.headers.get("location");
  if (!url) throw new Error("Google did not return an upload URL. Try again.");
  return url;
}

// Confirm the uploaded file really landed inside this bucket's folder (bucket isolation).
export async function verifyFileInFolder(account: DriveAccount, fileId: string, expectedFolderId: string) {
  const token = await accessToken(account);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,parents,thumbnailLink,webViewLink`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error("Could not verify upload with Google Drive.");
  const meta = await res.json();
  if (!meta.parents?.includes(expectedFolderId)) {
    // Wrong folder → delete stray file, reject (prevents cross-bucket writes)
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    throw new Error("Upload landed outside this event folder — rejected for safety.");
  }
  return meta as { id: string; name: string; mimeType: string; size?: string; thumbnailLink?: string; webViewLink?: string };
}

export async function driveFetch(account: DriveAccount, fileId: string, range?: string) {
  const token = await accessToken(account);
  return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}`, ...(range ? { Range: range } : {}) },
  });
}

export async function deleteDriveFile(account: DriveAccount, fileId: string) {
  const token = await accessToken(account);
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${token}` },
  });
}

export async function findOrCreateFolder(account: DriveAccount, name: string, parentId: string): Promise<string> {
  const token = await accessToken(account);
  const q = encodeURIComponent(`name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const list = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  if (list.files?.[0]?.id) return list.files[0].id as string;
  const created = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  }).then((r) => r.json());
  if (!created.id) throw new Error("Could not create Drive folder for this event.");
  return created.id as string;
}

export async function listFolders(account: DriveAccount, parentId: string, pageSize = 50) {
  const token = await accessToken(account);
  const q = encodeURIComponent(`'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=${pageSize}&orderBy=name&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  ).then((r) => r.json());
  return (res.files ?? []) as { id: string; name: string }[];
}
