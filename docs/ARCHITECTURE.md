# Architecture

This app is deliberately small: **Next.js 14 (App Router) + Google Drive**.
There is no database, no object storage, and no background worker.

```text
Guest phone                     Next.js on Vercel                  Google Drive
-----------                     ------------------                  ------------
scan QR  ──► /u/[slug]?k=token ──► verify slug + secret token ──► event folder
choose photos                    create resumable session
                                 ◄── one-file upload URL
upload 3 MB pieces ─────────────► relay each piece ──────────────► Drive
                                 verify file is in the right folder
                                 ◄── file id
done                             filename = metadata
```

## Why Drive is the database

Each event is a folder named:

```text
{Display Name}__{slug}__{24-char-secret-token}
[PAUSED] {Display Name}__{slug}__{token}
```

Each upload is a file named:

```text
20261011-143022__Ramesh-Kumar__9876543210__a1b2c3d4-Android__IMG_1234.jpg
```

Everything the dashboard shows is read live from Drive and parsed from those
names. That means:

- deleting the site never deletes or disorganises the photos,
- the archive is usable directly from Drive, without this app,
- there is no migration, backup or database bill,
- pausing an event is a folder rename, and replacing a leaked QR is a token
  rotation followed by a rename.

The trade-off is that folder names are the schema: **never rename event
folders by hand.**

## Four patterns worth reusing

### 1. Drive as a zero-cost store

For small organisations, a shared Drive is storage they already have.
Using `drive.file` scope means the app only sees files it created itself and
can never browse the rest of the account.

### 2. Browser → server → Drive chunked upload

Browsers cannot call Google's resumable-upload endpoint directly (CORS), and
serverless functions cap request bodies. The app creates a resumable session,
then relays **3 MB pieces** with `Content-Range`. Any file size gets through,
including multi-GB video, one small request at a time.

### 3. Capability URLs instead of accounts

A guest needs no login. The QR contains a slug plus a high-entropy secret
token. The server checks both against the folder name, then issues an upload
URL scoped to one file in one folder. Rotating the token invalidates every
printed QR for that event.

### 4. Metadata in filenames

Uploader name, phone, device and timestamp are encoded into the filename.
No schema, no rows, and the information survives even if the app is deleted.
Parsing is centralized in `lib/db.ts`.

## Security layers

| Layer | Implementation |
|---|---|
| Admin pages | `middleware.ts` cookie gate |
| Every admin API | signed JWT checked again server-side |
| Login | constant-time compare + per-IP rate limit |
| Drive secrets | AES-256-GCM encrypted at rest, never sent to browsers |
| Guest uploads | event token + MIME/size validation + one-file session URL |
| Folder isolation | uploaded file is verified to be inside the event folder |
| Deletion | Drive trash (30-day recovery), never permanent delete |

## Key files

| File | Responsibility |
|---|---|
| `lib/db.ts` | folder/file naming, parsing, event and upload models |
| `lib/drive.ts` | OAuth client, resumable sessions, listing, trash |
| `lib/auth.ts` | password check, JWT session cookie |
| `lib/crypto.ts` | AES-256-GCM secret encryption, random tokens |
| `app/api/upload/*` | session creation, chunk relay, completion check |
| `app/admin/AdminClient.tsx` | events, QR, gallery, devices, settings |
| `app/u/[slug]/UploadClient.tsx` | guest upload flow |

## Non-goals

- Multi-tenant SaaS with per-customer billing
- Public social feeds or likes
- Facial recognition, tagging, or automatic moderation
- Storing photos anywhere other than the organiser's own Drive
