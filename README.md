# 🛕 Maa Unique Dham — Photos Portal (Next.js, ₹0 hosting)

Scan → Upload → HD save in **your own 5TB Google Drive**. No app, no login for guests, opens in seconds.

**No database anywhere.** Events are folders in your Drive, and every photo's filename itself carries the date, name, phone and device (`20261011-143022__Ramesh-Kumar__9876543210__a1b2c3d4__IMG.jpg`). Delete the site tomorrow — your Drive stays perfectly organised on its own.

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
First page load takes ~10 seconds (it compiles). `.env.local` needs: `SITE_URL`, `JWT_SECRET` (32+ random chars), `ADMIN_PASSWORD_HASH` (below), Google keys (below).

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
