# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Use GitHub's private vulnerability reporting:
**Security → Advisories → Report a vulnerability** on this repository.

Include:

- what the issue is and who it affects,
- steps to reproduce,
- any proof-of-concept or logs (with secrets removed),
- the version or commit you tested.

You can expect an acknowledgement within a few days. This is a volunteer
project, so please allow reasonable time for a fix before public disclosure.

## What is in scope

- Authentication and session handling (`lib/auth.ts`, `middleware.ts`)
- Event token / QR authorization (`lib/db.ts`, upload routes)
- Drive scope and file isolation (`lib/drive.ts`)
- Secret encryption (`lib/crypto.ts`)
- Upload relay and file type/size validation
- Any way for a guest to read, list or delete another event's files

## Operator responsibilities

This is a self-hosted application. Whoever deploys it must:

- set a long, unique `ADMIN_PASSWORD` and a random `JWT_SECRET` (32+ chars),
- keep `.env.local` and hosting environment variables private,
- use HTTPS in production,
- keep the Google OAuth app in testing mode with only trusted test users,
- review who has access to the Google account that owns the Drive folder,
- redeploy after changing environment variables.

## Known design choices

- The admin password is stored as a plain environment variable because
  Next.js strips `$` characters from `.env` values, which breaks bcrypt hashes.
  It is compared in constant time and never sent to the browser.
- Drive refresh tokens are encrypted at rest with AES-256-GCM using a key
  derived from `JWT_SECRET`.
- Guests upload through short-lived, single-file resumable URLs. The browser
  never receives the Drive credentials.
- Uploaded files are verified to be inside the intended event folder before
  they appear in the gallery.
- Deleting moves files to the Drive trash (recoverable for 30 days); it does
  not permanently erase them.
