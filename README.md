# 🛕 Maa Unique Dham — Photos Portal (Next.js, ₹0 hosting)

Scan → Upload → HD save in **your own 5TB Google Drive**. No app, no login for guests, opens in ~2 sec on phone.

## Kya milta hai
- 📦 **Event buckets** — har event ka alag Drive folder + alag QR. QR **sirf usi event me** upload karta hai, kahin aur nahi.
- 📷 **QR with mandir logo** — beech me logo, Download PNG/SVG, Share (WhatsApp), Print.
- 🔒 **Private** — Drive files me **koi public link nahi**. Gallery sirf admin dekh sakta hai. Upload URL 1 file / 1 event tak limited.
- 📱 **Device register** — naam + phone + device ID + time, kaun kya bheja.
- 🔐 **Strong auth** — bcrypt-12 password hash, rate-limit login, **shared admin access** (many people can stay signed in together for now).
- 💾 **Drive account per event** — har event ke liye alag Google account + folder chun sakte ho, kabhi bhi badal sakte ho.

## Free hosting (Vercel, ₹0) — non-coder steps
1. `npm install` → `npm run dev` (local check: http://localhost:3000)
2. GitHub me repo push karo.
3. https://vercel.com → New Project → repo import → Deploy (free). `SITE_URL` env me Vercel URL dalo (e.g. `https://mud-photos.vercel.app`).
4. Env vars (Vercel → Settings → Environment Variables):
   - `SITE_URL` = tumhara Vercel URL
   - `JWT_SECRET` = 32+ random chars (koi bhi lamba random)
   - `ADMIN_PASSWORD_HASH` = neeche wale step se
5. Strong password set karo (12+ chars, e.g. `Mandir@2026#Strong`):
   ```
   npx tsx scripts/make-hash.ts "Tumhara-Strong-Password"
   ```
   Jo hash print ho, use `.env.local` + Vercel env me `ADMIN_PASSWORD_HASH` me paste karo. Redeploy.

## Google Drive connect (one click, your 5TB is used)
1. One-time site setup (5 min, free, done once ever): Google Cloud Console → new project → **switch on the Google Drive API** → Credentials → Create → OAuth client ID → **Web application** → under Authorised redirect URIs paste your site address + `/api/drive/callback` (local: `http://localhost:3000/api/drive/callback`). Keep the app in **Testing** mode and add the temple Gmail under Test users. Copy the Client ID + Secret into `.env.local` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` and restart.
2. Open `/admin` → Login → **Google Drive** tab → **Connect with Google** → choose the Gmail with your 5TB space → Allow.
3. Under that account press **Choose storage folder** → tap into the folder you want (or Make folder) → **Use this folder**.
4. **Events** tab → make an event → **Show QR** → PNG download / Share / Print. No tokens, no scripts, no IDs to copy — ever.

## Why this is safe with Google's rules
- **Least permission**: the portal asks for `drive.file` only — it can touch just the files and folders it creates itself (its own "Maa Unique Dham" folder). It cannot see or open anything else in your Drive. No full-Drive access, ever.
- **Standard login**: same "Sign in with Google" OAuth every safe app uses, with PKCE + a one-time state check on every login.
- **Private by design**: Google keys live only on the server, encrypted (AES-256). The browser only ever gets short-lived, single-file upload links.
- **Own-temple use**: consent screen stays in Testing mode with the temple Gmail as test user — exactly what Google intends for personal/family tools. No verification review needed.

## Daily use
- Event wala: Events → Show QR → print ya WhatsApp share.
- Guest: QR scan → naam likho → 📷/🖼️ → Upload. Apni photo koi aur nahi dekh sakta.
- Admin: Gallery tab → filter (event/photo/video/search) → HD view → ⬇️ Download → 🗑️ delete. “Kaun kya bheja” table me device-wise.

## Security notes (sach)
- Password kabhi plain me save nahi hota (bcrypt-12). 8 galat try → 5 min block.
- Many admins may stay signed in together (multi-login is on for now).
- Drive refresh tokens AES-256-GCM se encrypted, browser ko kabhi nahi bheje jate. Upload ke liye short-lived one-file URL milta hai.
- Drive files private rahte hain; site `/api/media` se sirf logged-in admin ko stream hote hain.
- QR token leak ho to: Events → 🔄 New QR (purana turant band).

## Commands
```
npm install
npm run dev      # local
npm run build    # production check
npx tsx scripts/make-hash.ts "Strong-Password-12+"
```

