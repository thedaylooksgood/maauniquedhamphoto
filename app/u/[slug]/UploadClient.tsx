"use client";
import { useRef, useState } from "react";
import FireButton from "@/components/FireButton";
import { Camera, Images, UploadCloud, CheckCircle2, Lock } from "lucide-react";

type Q = { id: string; file: File; preview: string; progress: number; status: "wait"|"up"|"done"|"err"; msg?: string };

const PIECE = 3 * 1024 * 1024; // 3MB pieces — any total size works

function deviceTag() {
  let d = "";
  try {
    d = localStorage.getItem("mud_device") || "";
    if (!d) { d = Math.random().toString(36).slice(2, 10); localStorage.setItem("mud_device", d); }
  } catch { d = Math.random().toString(36).slice(2, 10); }
  const ua = navigator.userAgent || "";
  const plat = /android/i.test(ua) ? "Android" : /iphone|ipad/i.test(ua) ? "iPhone" : /windows/i.test(ua) ? "Windows" : /mac/i.test(ua) ? "Mac" : "Phone";
  return `${d}-${plat}`;
}

async function uploadFile(slug: string, token: string, item: { file: File }, meta: { name: string; phone: string }, onP: (p: number) => void): Promise<void> {
  const { file } = item;
  const s = await fetch("/api/upload/session", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, token, filename: file.name, mime: file.type, size: file.size, uploaderName: meta.name || "Guest", uploaderPhone: meta.phone || "", deviceId: deviceTag() }),
  }).then(r => r.json());
  if (s.error || !s.sessionUrl) throw new Error(s.error || "Could not start upload");

  const total = file.size;
  for (let start = 0; start < total; start += PIECE) {
    const end = Math.min(start + PIECE - 1, total - 1);
    const piece = file.slice(start, end + 1);
    const r = await fetch("/api/upload/chunk", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "x-session": s.sessionUrl,
        "x-start": String(start),
        "x-end": String(end),
        "x-total": String(total),
      },
      body: piece,
    }).then(r => r.json());
    if (r.error) throw new Error(r.error);
    onP(Math.round(((end + 1) / total) * 100));
    if (r.done) {
      if (!r.fileId) throw new Error("Google went quiet — retry");
      const c = await fetch("/api/upload/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, fileId: r.fileId }),
      }).then(r => r.json());
      if (c.error) throw new Error(c.error);
      return;
    }
  }
  throw new Error("Upload stopped halfway — retry");
}

export default function UploadClient({ slug, token }: { slug: string; token: string; eventName: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [queue, setQueue] = useState<Q[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => /^(image|video)\//.test(f.type)).slice(0, 30);
    if (!arr.length) return;
    const items = arr.map(f => ({ id: Math.random().toString(36).slice(2), file: f, preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : "", progress: 0, status: "wait" as const }));
    setQueue(q => [...items, ...q]);
  }

  async function start() {
    if (!queue.length) { inputRef.current?.click(); return; }
    setBusy(true);
    let ok = 0;
    for (const item of queue) {
      if (item.status === "done") continue;
      setQueue(q => q.map(x => x.id === item.id ? { ...x, status: "up", msg: "" } : x));
      try {
        await uploadFile(slug, token, item, { name: name.trim(), phone: phone.trim() }, (p) =>
          setQueue(q => q.map(x => x.id === item.id ? { ...x, progress: p } : x)));
        ok++;
        setQueue(q => q.map(x => x.id === item.id ? { ...x, status: "done", progress: 100 } : x));
      } catch (e: any) {
        setQueue(q => q.map(x => x.id === item.id ? { ...x, status: "err", msg: e.message } : x));
      }
    }
    setDone(d => d + ok); setBusy(false);
  }

  const pending = queue.filter(q => q.status !== "done").length;

  return (
    <section className="card pad reveal d2">
      <div className="drop" onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("over"); }}
        onDragLeave={e => e.currentTarget.classList.remove("over")}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("over"); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); }}>
        <div className="big floaty"><UploadCloud size={44} color="#c2410c" /></div>
        <b>Tap to add photos &amp; videos</b>
        <div className="muted">Camera, gallery, or drag here — any size, full quality</div>
      </div>
      <div className="cam">
        <label className="btn btn-g"><Camera size={17} /> Camera<input ref={inputRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} /></label>
        <label className="btn btn-g"><Images size={17} /> Gallery<input type="file" accept="image/*,video/*" multiple hidden onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} /></label>
      </div>

      <details style={{ marginTop: 12 }}>
        <summary className="muted" style={{ cursor: "pointer", fontSize: 13 }}>Add your name (optional)</summary>
        <div className="grid2" style={{ marginTop: 8 }}>
          <input className="in" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} maxLength={40} />
          <input className="in" placeholder="Phone (optional)" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 12))} />
        </div>
      </details>

      {!!queue.length && (
        <div className="queue">
          {queue.map(q => (
            <div className="q" key={q.id}>
              {q.file.type.startsWith("image/") ? <img src={q.preview} alt="" /> : <video preload="metadata" />}
              <div className="qm"><b>{q.file.name}</b><span>{(q.file.size / 1048576).toFixed(1)} MB</span>
                <div className="bar"><i style={{ width: q.progress + "%" }} /></div></div>
              {q.status === "done" ? <span className="badge ok"><CheckCircle2 size={11} style={{ verticalAlign: -1 }} /> Done</span>
                : q.status === "err" ? <span className="badge err" title={q.msg}>Tap Upload to retry</span>
                : q.status === "up" ? <span className="badge">{q.progress}%</span>
                : <span className="badge">Ready</span>}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <FireButton block disabled={busy || !queue.length} onClick={start}>
          <UploadCloud size={18} /> {busy ? "Uploading…" : pending ? `Upload ${pending} file${pending > 1 ? "s" : ""}` : "Upload"}
        </FireButton>
      </div>
      {done > 0 && <div className="okbox" style={{ marginTop: 12 }}><CheckCircle2 size={20} color="#15803d" /> Saved! <b>{done}</b> file{done > 1 ? "s are" : " is"} in the temple Drive in full quality.</div>}
      <p className="muted" style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "center" }}><Lock size={12} /> Private — only the temple admin can see these.</p>
    </section>
  );
}
