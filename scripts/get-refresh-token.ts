// Free Google OAuth refresh token helper (Desktop app, no hosting cost).
// 1. Google Cloud Console → APIs & Services → Enable "Google Drive API"
// 2. Credentials → Create → OAuth client ID → Desktop app → copy ID + Secret
// 3. Run: GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy npx tsx scripts/get-refresh-token.ts
import { OAuth2Client } from "google-auth-library";
import readline from "node:readline";

const id = process.env.GOOGLE_CLIENT_ID || "";
const secret = process.env.GOOGLE_CLIENT_SECRET || "";
if (!id || !secret) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first (see README).");
  process.exit(1);
}
const client = new OAuth2Client(id, secret, "urn:ietf:wg:oauth:2.0:oob");
const url = client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: ["https://www.googleapis.com/auth/drive"] });
console.log("\n1) Open this URL in the temple Gmail account:\n\n" + url + "\n");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("2) Paste the code here: ", async (code) => {
  try {
    const { tokens } = await client.getToken(code.trim());
    console.log("\n✅ REFRESH TOKEN (save in Drive accounts tab):\n");
    console.log(tokens.refresh_token);
    console.log("\nRoot Folder ID: open Drive folder → URL me /folders/XXXX wala XXXX copy karo.\n");
  } catch (e: any) {
    console.error("Failed:", e.message);
  }
  rl.close();
});
