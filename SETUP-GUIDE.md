# 🛕 Complete Setup Guide — Maa Unique Dham Photos Portal
### (No coding needed. Just follow in order. ~30 minutes, ₹0.)

You need only 3 free things: a **Gmail with your 5TB space**, a **GitHub** account, a **Vercel** account.

---

## PART 1 — Get the code running on your computer (5 min)

1. Install **Node.js** (LTS version) from nodejs.org. Next → Next → Finish.
2. Open the project folder `Maa Unique Dham Photos Portal` in a terminal / PowerShell **inside that folder**.
3. Run:
   ```
   npm install
   npm run dev
   ```
4. Wait for `✓ Ready`. Open **http://localhost:3000**.
   - First page takes ~10 seconds (it compiles). A 404 before "Ready" is normal — wait.
   - If you ever see `Cannot find module './682.js'` or similar: stop the server (Ctrl+C), delete the `.next` folder, run `npm run dev` again.

## PART 2 — Set the 3 local secrets (2 min)

Open the file `.env.local` in the project folder. It must contain:

```
SITE_URL=http://localhost:3000
JWT_SECRET=local-dev-secret-change-this-to-32-plus-random-chars-abc123
ADMIN_PASSWORD=darjeeling123
```

- `ADMIN_PASSWORD` is your dashboard password. Change `darjeeling123` to anything 12+ characters. **Avoid the `$` sign** — settings files eat dollar signs.
- Restart the server after editing this file. Login at http://localhost:3000/admin with your password.

## PART 3 — Put it on GitHub + Vercel (10 min)

1. Push the folder to GitHub (web upload works: github.com → New repository → Upload files).
2. Go to **vercel.com** → Add New → Project → Import your repository → Deploy.
3. You get a live address like `https://maa-unique-dham-photos.vercel.app`. Note it down — you need it below.

## PART 4 — The 6 settings on Vercel (5 min) — DO NOT SKIP

Vercel project → **Settings** → **Environment Variables**. Add each (tick Production + Preview + Development):

| Name | Value |
|---|---|
| `SITE_URL` | Your Vercel address, e.g. `https://maa-unique-dham-photos.vercel.app` (no `/` at end) |
| `JWT_SECRET` | Any 64 random characters, e.g. `5aa1ead2903b236a3eabd4f5b054a43fd5ecb825ddb76f85362e60b634c7b033` |
| `ADMIN_PASSWORD` | `darjeeling123` (or your own 12+ char password, no `$`) |
| `GOOGLE_CLIENT_ID` | From Part 5 (ends in `.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | From Part 5 |
| `GOOGLE_REFRESH_TOKEN` | Leave empty now — you get it in Part 6 |

Delete any old dead ones if you see them: `ADMIN_PASSWORD_HASH`, `UPSTASH_*`.

Then **Deployments** → newest → three dots → **Redeploy**. Settings only apply after a redeploy. **Every time you change a setting, redeploy.**

## PART 5 — Google's one-time free key (5 min, done once ever)

Google forces every app to register once — no app on earth can skip this. It is free.

1. Go to **console.cloud.google.com** → New project (any name, e.g. `Maa-Unique-Dham`).
2. Left menu → **APIs & Services → Library** → search **Google Drive API** → **Enable**.
3. Left menu → **APIs & Services → OAuth consent screen**:
   - User type: **External** → Create.
   - App name: `Maa Unique Dham Photos`, support email: your Gmail → Save.
   - Scopes: skip (Add none) → Save.
   - **Test users → Add users → add your temple Gmail** → Save. (App stays in Testing — exactly right for own-temple use.)
4. Left menu → **Credentials → Create Credentials → OAuth client ID**:
   - Type: **Web application**. Name anything.
   - Under **Authorised redirect URIs** add BOTH lines:
     - `http://localhost:3000/api/drive/callback`
     - `https://YOUR-VERCEL-ADDRESS/api/drive/callback` (your real address from Part 3)
   - Create → copy the **Client ID** and **Client Secret** into Vercel settings (Part 4) → **Redeploy**.

## PART 6 — Connect your 5TB Drive (2 min, done once ever)

1. Open `https://YOUR-VERCEL-ADDRESS/admin` → login.
2. **Google Drive** tab → **Connect with Google** → choose the Gmail with 5TB → **Allow**.
3. The page shows you **one key** (once only, stored nowhere).
4. Copy it → Vercel → add as **`GOOGLE_REFRESH_TOKEN`** → **Redeploy**.
5. Reload the Drive tab → it says **"Connected as …"**. ✅ Done forever.

**Why this is safe:** the portal asks Google for `drive.file` only — it can touch just the files it creates itself (its own "Maa Unique Dham" folder). It can never see or open anything else in your Drive. Keys live encrypted on the server; browsers only get short-lived single-file upload links.

## PART 7 — Daily use: events the proper way

1. **Events tab** → name it with the date, e.g. `Navratri Day 3 — 2026` → optional corner folder → **Create**. (It becomes a dated Drive folder whose name quietly carries the secret QR key — no list is kept anywhere.)
2. **Show QR & share options** → the QR has a small lotus in the middle (one tap swaps your temple seal in).
   - **PNG** = download for printing, stick at the entrance.
   - **Copy link / Share** = send on WhatsApp.
3. Guests scan → type name → tap photos → Offer. Photos land HD in that event's folder only, filenames already telling the story: `date-time__name__phone__device__original`.
4. **Gallery**: pick the event → tap a photo → big preview → **Full quality** (download), **Share** (phone-to-phone), or trash.
5. When the function ends: **Pause** the event (QR dies, photos stay). If a QR leaks: **Replace QR**. Trash an event only when truly done (Drive trash keeps it 30 days).

## PART 8 — If something breaks (read this first)

| Problem | Cause → Fix |
|---|---|
| Login stuck on "Verifying" | Old version. Push latest code + redeploy. (Fixed: buttons can't freeze anymore.) |
| "Admin password is not set" | A setting is missing or you skipped redeploy. Check Part 4, then Redeploy. |
| "Wrong password" | You're typing it wrong, or Vercel has a different `ADMIN_PASSWORD` than you think. Re-check, redeploy. |
| "Drive not connected" | `GOOGLE_REFRESH_TOKEN` missing → do Part 6. |
| "This QR link is invalid or closed" | Event paused, QR replaced, or folder renamed by hand in Drive. **Never rename event folders in Drive by hand** — the secret key lives in the name. |
| Upload fails halfway | Big video + slow net. Retry; small files first to test. |
| `Cannot find module './682.js'` (localhost) | Delete `.next` folder, `npm run dev` again. |
| Gallery empty but uploads happened | Wrong event selected in the dropdown, or files still uploading. |
| Changed password, locked out | Set `ADMIN_PASSWORD` to the new one in settings → redeploy. That screen IS the recovery. |

## PART 9 — Changing things later
- **New password**: dashboard → Settings → Change password → paste into settings → redeploy.
- **New Drive account**: Drive tab → Reconnect/change account → Allow → paste new key → redeploy.
- **New site address**: update `SITE_URL` + add the new redirect URI in Google Cloud (Part 5.4) → redeploy.
- **Logo**: replace `public/logo.png` (keep the name) → redeploy. QR seal updates by itself.
