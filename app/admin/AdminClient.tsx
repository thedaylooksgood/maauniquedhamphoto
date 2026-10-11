"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCard from "@/components/QRCard";
import FireButton from "@/components/FireButton";
import {
  PackagePlus, QrCode, Images, HardDrive, Settings as SettingsIcon, LogOut,
  Search, Download, Trash2, Plus, Pause, Play, RefreshCw, X, Users, Film, Lock, CalendarHeart,
  LogIn as GoogleIcon, FolderOpen, Undo2, Check, Info, Share2, Copy, ShieldCheck, KeyRound, CheckCircle2,
} from "lucide-react";
import Seal from "@/components/Seal";

type Bucket = { id:string; name:string; slug:string; description:string; isActive:boolean; createdAt:string };
type Up = { id:string; bucketId:string; fileId:string; filename:string; mime:string; size:number; uploaderName:string; uploaderPhone?:string; deviceId:string; createdAt:string; webViewLink?:string };

export default function AdminClient(){
  const r = useRouter();
  const [ready,setReady]=useState(false); // nothing renders until login is proven
  const [tab,setTab]=useState<"events"|"gallery"|"drive"|"settings">("events");
  const [buckets,setBuckets]=useState<Bucket[]>([]);
  const [uploads,setUploads]=useState<Up[]>([]);
  const [devices,setDevices]=useState<any[]>([]);
  const [sel,setSel]=useState("");
  const [q,setQ]=useState(""); const [type,setType]=useState("all");
  const [light,setLight]=useState<Up|null>(null);
  const [msg,setMsg]=useState("");

  const [nm,setNm]=useState(""); const [ds,setDs]=useState("");
  const [parent,setParent]=useState("");
  const [corners,setCorners]=useState<any[]>([]);

  async function load(){
    const me = await fetch("/api/auth/me").then(x=>x.json()).catch(()=>({ok:false}));
    if(!me.ok){ r.push("/admin/login"); return; }
    setReady(true);
    const b = await fetch("/api/buckets").then(x=>x.json()).catch(()=>null);
    if(b?.buckets){ setBuckets(b.buckets); if(!sel && b.buckets[0]) setSel(b.buckets[0].id); }
    else if(b?.error) setMsg(b.error);
    const f = await fetch("/api/drive/folders").then(x=>x.json()).catch(()=>null);
    if(f?.folders) setCorners(f.folders);
  }
  async function loadGallery(){
    const p = new URLSearchParams({ bucketId: sel, q, type });
    const g = await fetch("/api/uploads?"+p).then(x=>x.json());
    if(g.uploads){ setUploads(g.uploads); setDevices(g.devices||[]); }
  }
  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ if(ready && tab==="gallery") loadGallery(); },[tab,sel,ready]);

  async function create(){
    setMsg("");
    const res = await fetch("/api/buckets/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:nm,description:ds,parentFolderId:parent})}).then(x=>x.json());
    if(res.error) setMsg(res.error);
    else { setMsg("Done! Your new event is ready — scroll down to see its QR and share it."); setNm(""); setDs(""); setParent(""); load(); }
  }
  async function delUpload(id:string){
    if(!confirm("Move this photo/video to Drive trash? You can restore it from trash within 30 days.")) return;
    await fetch("/api/uploads/delete?id="+id,{method:"DELETE"});
    loadGallery();
  }
  function dlUrl(u:Up, download=false){ return `/api/media/${u.id}?bucketId=${u.bucketId}${download ? "&download=1" : ""}`; }
  async function shareFile(u:Up){
    try {
      const blob = await fetch(dlUrl(u)).then(x=>x.blob());
      const file = new File([blob], u.filename, { type: u.mime || blob.type });
      if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
        await (navigator as any).share({ files: [file], title: u.filename });
        return;
      }
      throw new Error("no-share");
    } catch {
      // Fallback: copy the Drive link (opens for anyone signed into Google with access).
      if (u.webViewLink) {
        try { await navigator.clipboard.writeText(u.webViewLink); alert("Drive link copied — share it anywhere."); }
        catch { alert("Copy this link: " + u.webViewLink); }
      } else alert("Sharing is not supported on this browser — use Download instead.");
    }
  }

  const tabs = [
    { k: "events", label: "Events & QR codes", icon: QrCode },
    { k: "gallery", label: "Received photos", icon: Images },
    { k: "drive", label: "Google Drive", icon: HardDrive },
    { k: "settings", label: "Settings", icon: SettingsIcon },
  ] as const;

  return (
    <main className="wrap">
      {!ready && (
        <section className="card pad" style={{marginTop:30, textAlign:"center"}}>
          <div style={{display:"grid",placeItems:"center",marginBottom:8}}><Seal size={90} ring={false} /></div>
          <p className="muted"><ShieldCheck size={14} style={{verticalAlign:-2}} /> Checking your sign-in… nothing here is visible until that passes.</p>
        </section>
      )}
      {ready && (<>
      <section className="quote reveal" style={{marginBottom:12}}>
        <img src="/lotus-bloom.svg" alt="Lotus" style={{width:130}} />
        <p>Welcome, sevak. From here you create <em>events</em>, share their <em>QR codes</em>, and receive every photo as an <em>offering</em> — safe and organised.</p>
      </section>

      <div className="tabs no-print">
        {tabs.map(t=>(<button key={t.k} className={"tab"+(tab===t.k?" on":"")} onClick={()=>setTab(t.k)}><t.icon size={15} style={{verticalAlign:-2}} /> {t.label}</button>))}
        <button className="tab" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"}); r.push("/admin/login");}}><LogOut size={15} style={{verticalAlign:-2}} /> Logout</button>
      </div>

      {tab==="events" && (
        <>
          <section className="card pad reveal">
            <h2><PackagePlus size={19} style={{verticalAlign:-3}} /> Create a new event</h2>
            <p className="muted">Think of an event like a labelled box. Example: &ldquo;Navratri Day 3&rdquo;. Everything guests send through that event&apos;s QR lands in that box only.</p>
            <div className="guide"><b>How it works, step by step:</b>
              <div className="howrow"><span className="stepnum">1</span><p><b>Name your event</b>Type the function name below, for example &ldquo;Diwali Bhandara&rdquo;. It becomes a dated folder in your Drive — the folder name also quietly carries the secret QR key, so no list is kept anywhere.</p></div>
              <div className="howrow"><span className="stepnum">2</span><p><b>Pick its corner (optional)</b>Events live inside &ldquo;Maa Unique Dham&rdquo; in your Drive. You can tuck one inside a sub-folder if you like, or leave it in the main hall.</p></div>
              <div className="howrow"><span className="stepnum">3</span><p><b>Press Create, then share the QR</b>A cute QR with a small lotus in the middle appears below. Print it or send it on WhatsApp. Anyone who scans it can send photos — only into this event.</p></div>
            </div>
            <label className="lbl">Step 1 — Event name *</label>
            <input className="in" placeholder="e.g. Navratri Celebration 2026" value={nm} onChange={e=>setNm(e.target.value)} />
            <label className="lbl">A short note for guests (optional)</label>
            <input className="in" placeholder="e.g. Temple premises, 26 October evening" value={ds} onChange={e=>setDs(e.target.value)} />
            <label className="lbl">Step 2 — Which corner of the Drive?</label>
            <select className="in" value={parent} onChange={e=>setParent(e.target.value)}>
              <option value="">Main hall (simplest)</option>
              {corners.map((f:any)=><option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <div style={{marginTop:14}}><FireButton block onClick={create}><Plus size={17} /> Step 3 — Create event</FireButton></div>
            {msg && <div className="notice">{msg}</div>}
          </section>

          <h3 style={{margin:"18px 0 8px"}}><CalendarHeart size={17} style={{verticalAlign:-2}} /> Your events ({buckets.length})</h3>
          <div>
            {buckets.map(b=>(<BucketRow key={b.id} b={b} onChange={load} />))}
            {!buckets.length && (
              <div className="card empty"><img src="/lotus-pink.svg" alt="" /><b>No events yet</b><p className="muted">Create your first event above. Its QR will appear here, ready to print or share.</p></div>
            )}
          </div>
        </>
      )}

      {tab==="gallery" && (
        <>
          <section className="card pad reveal">
            <h2><Images size={19} style={{verticalAlign:-3}} /> Photos devotees have sent</h2>
            <p className="muted">Only you can see this page. Guests can never open it — each guest only sees their own upload screen. Tap any photo to see it big and download it in full quality.</p>
          </section>
          <div className="stats">
            <div className="stat"><b>{uploads.length}</b><span>items received</span></div>
            <div className="stat"><b>{uploads.filter(u=>u.mime.startsWith("image/")).length}</b><span>photos</span></div>
            <div className="stat"><b>{uploads.filter(u=>u.mime.startsWith("video/")).length}</b><span>videos</span></div>
            <div className="stat"><b>{devices.length}</b><span>people / phones</span></div>
          </div>
          <div className="tools">
            <select className="in" style={{maxWidth:230}} value={sel} onChange={e=>setSel(e.target.value)}>
              {buckets.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <div className="search"><input className="in" style={{paddingLeft:14}} placeholder="Search a name, phone or file…" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")loadGallery()}} /></div>
            <select className="in" style={{maxWidth:140}} value={type} onChange={e=>setType(e.target.value)}>
              <option value="all">Photos + videos</option><option value="photo">Photos only</option><option value="video">Videos only</option>
            </select>
            <button className="btn btn-d" onClick={loadGallery}><Search size={16} /> Find</button>
          </div>
          {uploads.length > 0 ? (
            <div className="gal">
              {uploads.map(u=>(
                <button className="g" key={u.id} onClick={()=>setLight(u)}>
                  <img src={dlUrl(u)} alt={u.filename} loading="lazy" />
                  {u.mime.startsWith("video/") && <span className="pl"><Film size={28} /></span>}
                  <span className="wh">{u.uploaderName}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="card empty"><img src="/lotus-pink.svg" alt="" /><b>Nothing here yet</b><p className="muted">Share this event&apos;s QR from the &ldquo;Events & QR codes&rdquo; tab. As soon as someone uploads, their photos appear here.</p></div>
          )}

          <h3 style={{marginTop:22}}><Users size={17} style={{verticalAlign:-2}} /> Who sent what ({devices.length} people)</h3>
          <p className="muted">Every phone is remembered, so you always know which photos came from whom.</p>
          <div className="card" style={{overflowX:"auto"}}>
            <table className="t"><thead><tr><th>Person</th><th>Phone</th><th>Their phone ID</th><th>Photos sent</th></tr></thead>
            <tbody>{devices.map((d:any)=>(<tr key={d.id}><td><b>{d.name}</b></td><td>{d.phone||"Not given"}</td><td><code style={{fontSize:11}}>{d.id.slice(0,14)}…</code></td><td>{d.uploadCount}</td></tr>))}</tbody></table>
          </div>

          {light && (
            <div className="lb open" onClick={()=>setLight(null)}>
              <div className="lb-t" onClick={e=>e.stopPropagation()}>
                <button className="x" onClick={()=>setLight(null)}><X size={18} /></button>
                <b>{light.uploaderName} — {light.filename}</b>
              </div>
              <div className="lb-b" onClick={e=>e.stopPropagation()}>
                {light.mime.startsWith("video/") ? <video src={dlUrl(light)} controls playsInline /> : <img src={dlUrl(light)} alt="" />}
              </div>
              <div className="lb-a no-print" onClick={e=>e.stopPropagation()}>
                <a className="btn btn-p" href={dlUrl(light, true)} download={light.filename}><Download size={17} /> Full quality</a>
                <button className="btn btn-g" style={{color:"#fff",borderColor:"#fff",background:"transparent"}} onClick={()=>shareFile(light)}><Share2 size={17} /></button>
                <button className="btn btn-g" style={{color:"#fff",borderColor:"#fff",background:"transparent"}} onClick={()=>delUpload(light.id)}><Trash2 size={17} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {tab==="drive" && <DriveTab onChange={load} />}
      {tab==="settings" && <SettingsTab />}
      </>)}
    </main>
  );
}

function BucketRow({ b, onChange }:{ b:any; onChange:()=>void }){
  const [open,setOpen]=useState(false);
  return (
    <div className="bucket">
      <div className="row" style={{alignItems:"center"}}>
        <h3>{b.name}</h3>
        <span className="badge" style={{marginLeft:"auto"}}>{b.isActive?"Taking uploads":"Paused"}</span>
      </div>
      <p className="muted">{b.description||"No note added."} &bull; Web address: <code>/u/{b.slug}</code></p>
      <div className="guide" style={{margin:"8px 0"}}><b>What this means:</b> anyone with this event&apos;s QR sends photos straight into its own folder in your Google Drive. They cannot see other events or other people&apos;s photos.</div>
      <div className="row">
        <button className="btn btn-p" onClick={()=>setOpen(!open)}><QrCode size={16} /> {open?"Hide the QR":"Show QR & share options"}</button>
        <button className="btn btn-g" onClick={async()=>{await fetch(`/api/buckets/${b.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({isActive:!b.isActive})}); onChange();}}>{b.isActive?<><Pause size={15}/> Pause uploads</>:<><Play size={15}/> Resume uploads</>}</button>
        <button className="btn btn-g" onClick={async()=>{if(!confirm("Make a brand-new QR? The old printed QR will stop working immediately."))return; await fetch(`/api/buckets/${b.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({regenerateQR:true})}); onChange();}}><RefreshCw size={15} /> Replace QR</button>
        <button className="btn btn-g" onClick={async()=>{if(!confirm("Move this whole event to Drive trash? Its photos go to trash too, recoverable for 30 days."))return; await fetch(`/api/buckets/${b.id}`,{method:"DELETE"}); onChange();}}><Trash2 size={15} /></button>
      </div>
      {open && <div style={{marginTop:12}}><QRWithToken id={b.id} name={b.name} /></div>}
    </div>
  );
}

function QRWithToken({ id, name }:{ id:string; name:string }){
  const [url,setUrl]=useState("");
  useEffect(()=>{
    fetch(`/api/buckets/${id}/link`).then(x=>x.json()).then(u=>{ if(u?.url) setUrl(u.url); }).catch(()=>{});
  },[id]);
  if(!url) return <p className="muted">Preparing the QR…</p>;
  return (
    <>
      <div className="guide"><b>How to use it:</b> press PNG to download, print it and stick it at the entrance — or Copy link / Share to send it on WhatsApp. A small lotus sits in the middle automatically.</div>
      <QRCard url={url} eventName={name} />
    </>
  );
}

function DriveTab({ onChange }:{ onChange:()=>void }){
  const [st,setSt]=useState<any>(null);
  const [trail,setTrail]=useState<{id:string;name:string}[]>([]);
  const [folders,setFolders]=useState<any[]>([]);
  const [newName,setNewName]=useState("");
  const [msg,setMsg]=useState("");

  useEffect(()=>{
    fetch("/api/drive/status").then(x=>x.json()).then(j=>{ setSt(j); }).catch(()=>setSt({clientConfigured:false}));
  },[]);

  const cur = trail.length ? trail[trail.length-1].id : "";
  async function refresh(p:string){
    const j=await fetch(`/api/drive/folders${p?`?parent=${p}`:""}`).then(x=>x.json()).catch(()=>null);
    if(j?.folders) setFolders(j.folders);
    else if(j?.error) setMsg(j.error);
  }
  useEffect(()=>{ if(st?.driveReady){ setTrail([]); refresh(""); } },[st?.driveReady]);

  async function openFolder(id:string,name:string){
    const t=[...trail,{id,name}];
    setTrail(t); refresh(id);
  }
  async function goUp(){
    const t=trail.slice(0,-1);
    setTrail(t); refresh(t.length?t[t.length-1].id:"");
  }
  async function makeFolder(){
    setMsg("");
    if(newName.trim().length<2){ setMsg("Type a name for the new corner first."); return; }
    const r=await fetch("/api/drive/folders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({parent:cur,name:newName.trim()})}).then(x=>x.json());
    if(r.error){ setMsg(r.error); return; }
    setNewName(""); refresh(cur); onChange();
  }

  return (
    <section className="card pad reveal">
      <h2><HardDrive size={19} style={{verticalAlign:-3}} /> Your Google Drive space</h2>
      <p className="muted">Every photo lives in your own Google account (your 5TB) — never on this website. There is no database anywhere: events are folders, and each photo&apos;s filename itself carries who sent it and when.</p>

      {st && !st.clientConfigured && (
        <div className="guide"><b>One-time setup by the site owner (5 minutes, done once ever):</b>
          <div className="howrow"><span className="stepnum">1</span><p><b>Make a free Google login key</b>Open Google Cloud Console → new project → switch on the Drive API → Credentials → Create → OAuth client ID → <b>Web application</b>. Under &ldquo;Authorised redirect URIs&rdquo; paste exactly:<br /><code style={{fontSize:11,wordBreak:"break-all"}}>{st.redirectUri||"loading…"}</code></p></div>
          <div className="howrow"><span className="stepnum">2</span><p><b>Paste the 2 codes into the site</b>Put the Client ID + Client Secret in <code>.env.local</code> as <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> (on Vercel: Settings → Environment Variables), then restart. The Connect button appears here by itself.</p></div>
        </div>
      )}

      {(!st || st.clientConfigured) && (
        <div style={{margin:"12px 0"}}>
          <a href="/api/drive/connect" style={{textDecoration:"none"}}><FireButton><GoogleIcon size={17} /> {st?.driveReady ? "Reconnect / change account" : "Connect with Google"}</FireButton></a>
          <p className="muted" style={{margin:"8px 0 0"}}>Press it, choose the Gmail with your 5TB space, press Allow — you&apos;ll get <b>one key to paste</b> into settings (shown once, stored nowhere). The portal asks Google for the <b>minimum permission</b> (only its own &ldquo;Maa Unique Dham&rdquo; folder) — it can never touch anything else in your Drive.</p>
        </div>
      )}
      {st?.driveReady && (
        <div className="okbox" style={{textAlign:"left"}}><CheckCircle2 size={18} color="#15803d" /> Connected{st.email ? <> as <b>{st.email}</b></> : null} — photos live in the <b>{st.rootName || "Maa Unique Dham"}</b> folder.</div>
      )}
      {st?.clientConfigured && !st?.driveReady && (
        <div className="notice">Drive key not pasted yet — press Connect above, copy the key, add <code>GOOGLE_REFRESH_TOKEN</code> to settings and redeploy.{st.hint ? <> Note: {st.hint}</> : null}</div>
      )}
      {msg && <div className="notice">{msg}</div>}

      {st?.driveReady && (
        <>
          <h3>Corners of your temple folder</h3>
          <p className="muted">Make tidy sub-folders here (e.g. &ldquo;2026&rdquo;, &ldquo;Festivals&rdquo;) and pick one while creating an event. Only folders made by this portal are listed — your private files stay invisible to it.</p>
          <div className="row" style={{alignItems:"center",marginBottom:8}}>
            <span className="badge">{st.rootName || "Maa Unique Dham"}{trail.map(t=>` / ${t.name}`).join("")}</span>
            {!!trail.length && <button className="btn btn-g btn-sm" onClick={goUp}><Undo2 size={14} /> Back</button>}
          </div>
          {folders.map((f:any)=>(
            <button key={f.id} className="folder" style={{width:"100%",marginBottom:6}} onClick={()=>openFolder(f.id,f.name)}>
              <span className="f"><FolderOpen size={20} /></span> <b>{f.name}</b> <span>— tap to open</span>
            </button>
          ))}
          {!folders.length && <p className="muted">No corners yet — make one below, or just create events (they appear here by themselves).</p>}
          <div className="row" style={{marginTop:8}}>
            <input className="in" style={{flex:1}} placeholder="New corner, e.g. Festivals 2026" value={newName} onChange={e=>setNewName(e.target.value)} />
            <button className="btn btn-g" onClick={makeFolder}><Plus size={16} /> Make corner</button>
          </div>
        </>
      )}
    </section>
  );
}

function SettingsTab(){
  const [c,setC]=useState(""); const [n,setN]=useState(""); const [m,setM]=useState("");
  async function ch(){
    setM("");
    const r = await fetch("/api/admin/change-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({current:c,next:n})}).then(x=>x.json());
    if(r.error) setM(r.error);
    else setM("Verified! " + (r.how || "Now update the password in hosting settings and redeploy."));
  }
  async function copyHow(){
    try { await navigator.clipboard.writeText("ADMIN_PASSWORD=" + n); setM("Copied: ADMIN_PASSWORD=<your new password>. Paste it into hosting settings and redeploy."); }
    catch { setM("Copy failed — type it by hand into hosting settings."); }
  }
  return (
    <section className="card pad reveal">
      <h2><Lock size={18} style={{verticalAlign:-2}} /> Safety settings</h2>
      <p className="muted">In plain words: your password lives only as a scrambled line in hosting settings (never readable), sign-ins are slowed down after wrong guesses, and your Drive files are never shared publicly. Any number of people may stay signed in.</p>
      <div className="guide"><b>Changing the password?</b> Pick something long you can remember (example: &ldquo;lotus-temple-morning-7&rdquo; — avoid the <code>$</code> sign). Press the button, then paste the new password into hosting settings. Everyone will then need the new one.</div>
      <label className="lbl">Your current password</label><input className="in" type="password" value={c} onChange={e=>setC(e.target.value)} />
      <label className="lbl">Your new password (12 or more characters)</label><input className="in" type="password" value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. lotus-temple-morning-7" />
      <button className="btn btn-d btn-block" style={{marginTop:12}} onClick={ch}>Change my password</button>
      {m && <div className="notice">{m}</div>}
      {m.startsWith("Verified!") && (
        <div className="guide"><b><KeyRound size={14} style={{verticalAlign:-2}} /> Then paste this into hosting settings and redeploy:</b>
          <div><code style={{fontSize:12}}>ADMIN_PASSWORD=(your new password)</code></div>
          <button className="btn btn-g btn-sm" style={{marginTop:8}} onClick={copyHow}><Copy size={14} /> Copy settings line</button>
        </div>
      )}
    </section>
  );
}
