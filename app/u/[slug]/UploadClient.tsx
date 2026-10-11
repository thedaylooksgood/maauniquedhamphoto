"use client";
import { useRef, useState } from "react";
import FireButton from "@/components/FireButton";
import { User, Phone, Camera, Images, UploadCloud, CheckCircle2, RefreshCw, Lock } from "lucide-react";

type Q = { id: string; file: File; preview: string; progress: number; status: "wait"|"up"|"done"|"err"; msg?: string };

function deviceId() {
  let d = localStorage.getItem("mud_device");
  if (!d) { d = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("mud_device", d); }
  return d;
}

function putWithProgress(url: string, file: File, onP: (p:number)=>void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onP(Math.round((e.loaded/e.total)*100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
      else reject(new Error("Upload failed (" + xhr.status + ")"));
    };
    xhr.onerror = () => reject(new Error("Network issue — please retry"));
    xhr.send(file);
  });
}

export default function UploadClient({ slug, token, eventName }: { slug: string; token: string; eventName: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [queue, setQueue] = useState<Q[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => /^(image|video)\//.test(f.type)).slice(0, 30);
    if (!arr.length) { alert("Please select photos or videos only"); return; }
    const items = arr.map(f => ({ id: Math.random().toString(36).slice(2), file: f, preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : "", progress: 0, status: "wait" as const }));
    setQueue(q => [...items, ...q]);
  }

  async function start() {
    if (!name.trim() || name.trim().length < 2) { alert("Please enter your name"); return; }
    if (!queue.length) { inputRef.current?.click(); return; }
    setBusy(true);
    let ok = 0;
    for (const item of queue) {
      if (item.status === "done") continue;
      setQueue(q => q.map(x => x.id===item.id ? {...x, status:"up", msg:""} : x));
      try {
        const s = await fetch("/api/upload/session", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ slug, token, filename: item.file.name, mime: item.file.type, size: item.file.size, uploaderName: name.trim(), uploaderPhone: phone.trim(), deviceId: deviceId() })
        }).then(r=>r.json());
        if (s.error) throw new Error(s.error);
        const respText = await putWithProgress(s.sessionUrl, item.file, (p)=>
          setQueue(q => q.map(x => x.id===item.id ? {...x, progress:p} : x)));
        let fileId = "";
        try { fileId = JSON.parse(respText).id; } catch { throw new Error("Google confirmation missing"); }
        const c = await fetch("/api/upload/complete", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ slug, token, fileId })
        }).then(r=>r.json());
        if (c.error) throw new Error(c.error);
        ok++;
        setQueue(q => q.map(x => x.id===item.id ? {...x, status:"done", progress:100} : x));
      } catch (e:any) {
        setQueue(q => q.map(x => x.id===item.id ? {...x, status:"err", msg:e.message} : x));
      }
    }
    setDone(ok); setBusy(false);
  }

  return (
    <section className="card pad reveal d4" style={{marginTop:14}}>
      <h2>{eventName} — Upload</h2>
      <p className="muted">Your name is required so the temple knows who offered what. Phone is optional.</p>
      <div className="grid2">
        <div><label className="lbl"><User size={13} style={{verticalAlign:-2}} /> Your name *</label>
          <input className="in" placeholder="e.g. Priya Sharma" value={name} onChange={e=>setName(e.target.value)} maxLength={60} /></div>
        <div><label className="lbl"><Phone size={13} style={{verticalAlign:-2}} /> Phone (optional)</label>
          <input className="in" placeholder="98765…" inputMode="numeric" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,12))} /></div>
      </div>

      <div className="drop" onClick={()=>inputRef.current?.click()}
        onDragOver={e=>{e.preventDefault();e.currentTarget.classList.add("over")}}
        onDragLeave={e=>e.currentTarget.classList.remove("over")}
        onDrop={e=>{e.preventDefault();e.currentTarget.classList.remove("over"); if(e.dataTransfer.files) addFiles(e.dataTransfer.files)}}>
        <div className="big floaty"><UploadCloud size={42} color="#c2410c" /></div>
        <b>Tap to choose photos &amp; videos</b>
        <div className="muted">Or drag and drop here &bull; Full HD originals &bull; Videos welcome</div>
      </div>
      <div className="cam">
        <label className="btn btn-g"><Camera size={17} /> Camera<input ref={inputRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={e=>{if(e.target.files) addFiles(e.target.files); e.target.value=""}} /></label>
        <label className="btn btn-g"><Images size={17} /> Gallery<input type="file" accept="image/*,video/*" multiple hidden onChange={e=>{if(e.target.files) addFiles(e.target.files); e.target.value=""}} /></label>
      </div>

      {!!queue.length && (
        <div className="queue">
          {queue.map(q=>(
            <div className="q" key={q.id}>
              {q.file.type.startsWith("image/") ? <img src={q.preview} alt=""/> : <video preload="metadata"><span>Video</span></video>}
              <div className="qm"><b>{q.file.name}</b><span>{(q.file.size/1048576).toFixed(1)} MB</span>
                <div className="bar"><i style={{width:q.progress+"%"}}/></div></div>
              {q.status==="done" ? <span className="badge ok"><CheckCircle2 size={11} style={{verticalAlign:-1}} /> Done</span>
               : q.status==="err" ? <span className="badge err" title={q.msg}><RefreshCw size={11} /> Retry</span>
               : q.status==="up" ? <span className="badge">{q.progress}%</span>
               : <span className="badge">Ready</span>}
            </div>
          ))}
        </div>
      )}

      <div style={{marginTop:14}}>
      <FireButton block disabled={busy} onClick={start}>
        <UploadCloud size={18} /> {busy ? "Offering…" : `Offer ${queue.filter(q=>q.status!=="done").length || ""} files`.trim() || "Offer files"}
      </FireButton>
      </div>
      {done>0 && <div className="okbox" style={{marginTop:12}}><CheckCircle2 size={20} color="#15803d" /> Thank you, {name.split(" ")[0] || "devotee"}! <b>{done}</b> offering{done>1?"s":""} received in the temple Drive.</div>}
      <p className="muted" style={{marginTop:10}}><Lock size={12} style={{verticalAlign:-1}} /> Private — only the temple admin can view. Your photos are never made public.</p>
    </section>
  );
}
