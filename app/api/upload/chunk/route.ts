import { NextResponse } from "next/server";

// Forwards ONE chunk of a file to Google's resumable-upload URL.
// Why this exists: browsers are blocked from talking to Google's upload
// servers directly (CORS), so the site relays each piece server-to-server.
// Pieces are 3MB — small enough for free hosting limits — so files of
// ANY size (long videos included) get through, one piece at a time.
//
// POST raw bytes. Headers:
//   x-session : the upload URL returned by /api/upload/session (one file only)
//   x-start   : first byte index of this piece
//   x-end     : last byte index of this piece (inclusive)
//   x-total   : full file size in bytes
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const sessionUrl = req.headers.get("x-session") || "";
    const start = Number(req.headers.get("x-start"));
    const end = Number(req.headers.get("x-end"));
    const total = Number(req.headers.get("x-total"));
    if (!sessionUrl.startsWith("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable")) {
      return NextResponse.json({ error: "Bad upload ticket. Start again." }, { status: 400 });
    }
    if (![start, end, total].every((n) => Number.isInteger(n) && n >= 0) || end < start || end >= total) {
      return NextResponse.json({ error: "Bad piece boundaries." }, { status: 400 });
    }
    const buf = Buffer.from(await req.arrayBuffer());
    if (buf.length !== end - start + 1 || buf.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Piece size mismatch. Retry." }, { status: 400 });
    }
    const put = await fetch(sessionUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(buf.length),
        "Content-Range": `bytes ${start}-${end}/${total}`,
      },
      body: buf,
      redirect: "manual", // 308 = "piece received, send next" — not a redirect to follow
    });
    if (put.status === 308) {
      return NextResponse.json({ done: false });
    }
    if (put.ok) {
      const meta = await put.json().catch(() => ({}));
      return NextResponse.json({ done: true, fileId: meta.id || "" });
    }
    const t = await put.text().catch(() => "");
    return NextResponse.json({ error: `Google said no (${put.status}). Retry.` + t.slice(0, 80) }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "Network wobble — retrying usually works." }, { status: 500 });
  }
}
