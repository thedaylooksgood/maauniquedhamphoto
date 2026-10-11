import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";

// Hands the freshly-fetched Google key to the admin ONCE (then forgets it).
export async function GET() {
  const a = await requireAdmin();
  if (!a.ok) return NextResponse.json({ error: a.reason }, { status: 401 });
  const raw = cookies().get("mud_token")?.value || "";
  const res = NextResponse.json(
    raw ? { token: raw.split("::")[0], email: raw.split("::").slice(1).join("::") } : { token: "", email: "" }
  );
  res.cookies.delete("mud_token");
  return res;
}
