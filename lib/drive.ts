import { OAuth2Client } from "google-auth-library";

// Single Drive account, from env vars (no database).
// GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN.
export type DriveAccount = { clientId: string; clientSecret: string; refreshToken: string };

export function envAccount(): DriveAccount {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || "";
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Drive not connected. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN (README, one time).");
  }
  return { clientId, clientSecret, refreshToken };
}

export function oauthForAccount(a: DriveAccount) {
  const c = new OAuth2Client(a.clientId, a.clientSecret);
  c.setCredentials({ refresh_token: a.refreshToken });
  return c;
}

export async function accessToken(a: DriveAccount) {
  const c = oauthForAccount(a);
  const t = await c.getAccessToken();
  if (!t.token) throw new Error("Google auth failed — reconnect Drive (new refresh token).");
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
  const safe = filename.replace(/[\\/:*?"<>|]/g, "_").slice(0, 180) || "photo";
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
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,parents,webViewLink`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error("Could not verify upload with Google Drive.");
  const meta = await res.json();
  if (!meta.parents?.includes(expectedFolderId)) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    throw new Error("Upload landed outside this event folder — rejected for safety.");
  }
  return meta as { id: string; name: string; mimeType: string; size?: string; webViewLink?: string };
}

export async function driveFetch(account: DriveAccount, fileId: string) {
  const token = await accessToken(account);
  return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function trashDriveFile(account: DriveAccount, fileId: string) {
  const token = await accessToken(account);
  // Trash (recoverable from Drive trash for 30 days), never permanent delete.
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ trashed: true }),
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

export async function listFolders(account: DriveAccount, parentId: string, pageSize = 100) {
  const token = await accessToken(account);
  const q = encodeURIComponent(`'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=${pageSize}&orderBy=name&fields=files(id,name,description,createdTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  ).then((r) => r.json());
  return (res.files ?? []) as { id: string; name: string; description?: string; createdTime?: string }[];
}

export async function renameFolder(account: DriveAccount, folderId: string, name: string, description?: string) {
  const token = await accessToken(account);
  const body: any = { name };
  if (typeof description === "string") body.description = description.slice(0, 500);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Could not rename folder in Drive.");
}

export async function listFiles(account: DriveAccount, folderId: string, pageSize = 200) {
  const token = await accessToken(account);
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=${pageSize}&orderBy=createdTime desc&fields=files(id,name,mimeType,size,createdTime,webViewLink)`,
    { headers: { Authorization: `Bearer ${token}` } }
  ).then((r) => r.json());
  if (res.error) throw new Error(res.error.message || "Drive list failed.");
  return (res.files ?? []) as { id: string; name: string; mimeType: string; size?: string; createdTime?: string; webViewLink?: string }[];
}

export async function aboutEmail(account: DriveAccount): Promise<string> {
  const token = await accessToken(account);
  const about = await fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json()).catch(() => null);
  return about?.user?.emailAddress || "";
}
