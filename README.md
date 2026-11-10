# 🛕 Maa Unique Dham — Photos Portal (Next.js, ₹0 hosting)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![No database](https://img.shields.io/badge/database-none-2ea44f)](docs/ARCHITECTURE.md#why-drive-is-the-database)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Scan → Upload → HD save in **your own 5TB Google Drive**. No app, no login for guests, opens in seconds.

**No database anywhere.** Events are folders in your Drive, and every photo's filename itself carries the date, name, phone and device (`20261011-143022__Ramesh-Kumar__9876543210__a1b2c3d4__IMG.jpg`). Delete the site tomorrow — your Drive stays perfectly organised on its own.

> **Open source, built for community use.** Maa Unique Dham is the reference
> deployment; any temple, gurudwara, church, school, wedding or community group
> can fork this, rebrand it, and run it on its own Drive. MIT licensed.

## Who it's for

- Temples, gurudwaras, churches and other places of worship
- Festivals, satsangs, weddings and family functions
- Schools, nonprofits and community organisations
- Anyone who wants event photos **without** a paid gallery service, guest
  accounts, or an app install

## Why open source

Commercial event-photo products charge per event, push guests into an app, and
keep the originals on their servers. This portal flips that:

- **Your storage, your photos** — everything lands in the organiser's own
  Google Drive, in dated event folders that still make sense without the site.
- **Zero infrastructure cost** — no database, no storage add-on, no paid tier.
  Next.js on free hosting is enough.
- **Guest-first** — one QR, no account, no app; works on low-end phones and
  slow connections.
- **Private by design** — least-privilege `drive.file` scope, no public links,
  authenticated downloads.
- **Reusable engineering** — Drive-as-database, chunked resumable uploads,
  scoped capability URLs and encrypted secrets are documented in
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for other low-cost,
  privacy-first projects.

## What you get
- 📦 **Event buckets** — each event is a dated folder + its own secret QR. A QR only feeds its own event, nowhere else.
- 📷 **Cute QR** — small pink lotus in the middle by default; one tap to swap the temple seal in. PNG / SVG download, Copy link, Share, Print.
- 🔒 **Private** — Drive files have no public links. The home page shows no admin entry at all. `/admin` is cookie-locked (middleware) + signature-checked on every API, and the dashboard renders nothing until sign-in passes.
- 🖼️ **Gallery** — big magnified preview, full-quality download, phone-share, trash (recoverable 30 days), search, photo/video filter, who-sent-what table.
- 📱 **Device fingerprinting** — every upload stamps name + phone + device + exact time into the filename.
- 🔐 **Password-only auth** — one env var, rate-limited login, multi-device friendly.

## Run it (localhost)
```
npm install
npm run dev        # wait for "Ready", open http://localhost:3000
```
First page load takes ~10 seconds (it compiles). `.env.local` needs: `SITE_URL`, `JWT_SECRET` (32+ random chars), `ADMIN_PASSWORD` (below), Google keys (below).

## Password
Type it straight into settings — no scrambling step, no script:
- Local: `ADMIN_PASSWORD=darjeeling123` in `.env.local`
- Vercel: Settings → Environment Variables → `ADMIN_PASSWORD`
- Avoid the `$` sign in it (settings files eat dollar signs). Changing later: dashboard → Settings → Change password → paste the new one + redeploy.

## Google Drive — proper setup, once ever (free)
1. Google Cloud Console → new project → switch on **Google Drive API** → Credentials → Create → **OAuth client ID → Web application** → Authorised redirect URI = your site + `/api/drive/callback` (local: `http://localhost:3000/api/drive/callback`). Keep it in **Testing** mode, add the temple Gmail as test user.
2. Put Client ID + Secret in settings (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), restart/redeploy.
3. Dashboard → Login → **Google Drive** tab → **Connect with Google** → pick the 5TB Gmail → Allow → copy the **one key** shown → paste as `GOOGLE_REFRESH_TOKEN` → redeploy. Done forever.
4. The portal makes its own **"Maa Unique Dham"** folder and only ever touches what it creates (`drive.file` least-permission — compliant, no review needed for own use).

## How to add events properly (daily use)
1. **Events tab** → name it clearly with date (`Navratri Day 3 — 2026`) → optional corner folder → **Create**.
2. **Show QR & share options** → PNG download for print, or Copy link / Share for WhatsApp. The QR holds the event's secret — anyone with it can upload, but only into that event.
3. **Pause** an event when the function ends (QR stops working, photos stay). **Replace QR** if a QR leaks. **Trash** only when truly done (Drive trash keeps it 30 days).
4. **Gallery**: pick the event → tap a photo → preview big → Full quality (download), Share (phone-to-phone), or trash.
5. Filenames in Drive already tell the story: `date-time__name__phone__device__original` — sort, search and backup straight from Drive itself.

## Vercel (free) checklist
Push to GitHub → Import → add env vars → Deploy:
- `SITE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
No database, no storage add-on, nothing else. Redeploy after every env change.

## Contributing

Issues, ideas and pull requests are welcome. Start with
[CONTRIBUTING.md](CONTRIBUTING.md); for anything security-related, follow
[SECURITY.md](SECURITY.md) instead of opening a public issue.
Architecture notes live in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

[MIT](LICENSE) © 2026 thedaylooksgood.

Not affiliated with Google. Google Drive and Google Cloud are trademarks of
Google LLC.

