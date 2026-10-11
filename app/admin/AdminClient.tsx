"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCard from "@/components/QRCard";
import FireButton from "@/components/FireButton";
import {
  PackagePlus, QrCode, Images, HardDrive, Settings as SettingsIcon, LogOut,
  Search, Download, Trash2, Plus, Pause, Play, RefreshCw, X, Users, Film, Lock, CalendarHeart,
  LogIn as GoogleIcon, FolderOpen, Undo2, Check, Info,
} from "lucide-react";

type Bucket = { id:string; name:string; slug:string; description:string; isActive:boolean; createdAt:string; driveFolderId:string; driveAccountId:string };
type Up = { id:string; bucketId:string; fileId:string; filename:string; mime:string; size:number; uploaderName:string; uploaderPhone?:string; deviceId:string; createdAt:string };

export default function AdminClient(){
  const r = useRouter();
  const [tab,setTab]=useState<"events"|"gallery"|"drive"|"settings">("events");
  const [buckets,setBuckets]=useState<Bucket[]>([]);
  const [accounts,setAccounts]=useState<any[]>([]);
  const [uploads,setUploads]=useState<Up[]>([]);
  const [devices,setDevices]=useState<any[]>([]);
  const [sel,setSel]=useState("");
  const [q,setQ]=useState(""); const [type,setType]=useState("all");
  const [light,setLight]=useState<Up|null>(null);
  const [msg,setMsg]=useState("");

  const [nm,setNm]=useState(""); const [ds,setDs]=useState("");
  const [acc,setAcc]=useState(""); const [parent,setParent]=useState("");
  const [folders,setFolders]=useState<any[]>([]);

  async function load(){
    const me = await fetch("/api/auth/me").then(x=>x.json()).catch(()=>({ok:false}));
    if(!me.ok){ r.push("/admin/login"); return; }
    const b = await fetch("/api/buckets").then(x=>x.json());
    if(b.buckets){ setBuckets(b.buckets); if(!sel && b.buckets[0]) setSel(b.buckets[0].id); if(b.buckets[0] && !acc) setAcc(b.buckets[0].driveAccountId); }
    const d = await fetch("/api/drive/accounts").then(x=>x.json());
    if(d.accounts) { setAccounts(d.accounts); if(!acc && d.accounts[0]) setAcc(d.accounts[0].id); }
  }
  async function loadGallery(){
    const p = new URLSearchParams({ bucketId: sel, q, type });
    const g = await fetch("/api/uploads?"+p).then(x=>x.json());
    if(g.uploads){ setUploads(g.uploads); setDevices(g.devices||[]); }
  }
  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ if(tab==="gallery") loadGallery(); },[tab,sel]);
  useEffect(()=>{ if(acc){ fetch(`/api/drive/folders?accountId=${acc}${parent?`&parent=${parent}`:""}`).then(x=>x.json()).then(j=>{ if(j.folders) setFolders(j.folders); }).catch(()=>{}); } },[acc]);

  async function create(){
    setMsg("");
    const res = await fetch("/api/buckets/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:nm,description:ds,driveAccountId:acc,parentFolderId:parent})}).then(x=>x.json());
    if(res.error) setMsg(res.error);
    else { setMsg("Done! Your new event is ready — scroll down to see its QR and share it."); setNm(""); setDs(""); load(); }
  }
  async function delUpload(id:string){
    if(!confirm("Delete this photo/video? It will also be removed from Google Drive.")) return;
    await fetch("/api/uploads/delete?id="+id,{method:"DELETE"});
    loadGallery();
  }
  function dlUrl(u:Up){ return `/api/media/${u.id}`; }

  const tabs = [
    { k: "events", label: "Events & QR codes", icon: QrCode },
    { k: "gallery", label: "Received photos", icon: Images },
    { k: "drive", label: "Google Drive", icon: HardDrive },
    { k: "settings", label: "Settings", icon: SettingsIcon },
  ] as const;

  return (
    <main className="wrap">
      <section className="quote reveal" style={{marginBottom:12}}>
        <img src="/lotus.svg" alt="Lotus" style={{width:110}} />
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
              <div className="howrow"><span className="stepnum">1</span><p><b>Name your event</b>Type the function name below, for example &ldquo;Diwali Bhandara&rdquo;.</p></div>
              <div className="howrow"><span className="stepnum">2</span><p><b>Pick where it gets stored</b>Choose your Google account and folder. Don&apos;t have one connected yet? Open the &ldquo;Google Drive&rdquo; tab first — it takes 5 minutes.</p></div>
              <div className="howrow"><span className="stepnum">3</span><p><b>Press Create, then share the QR</b>A QR code appears below. Print it or send it on WhatsApp. Anyone who scans it can send photos — only into this event.</p></div>
            </div>
            <label className="lbl">Step 1 — Event name *</label>
            <input className="in" placeholder="e.g. Navratri Celebration 2026" value={nm} onChange={e=>setNm(e.target.value)} />
            <label className="lbl">A short note for guests (optional)</label>
            <input className="in" placeholder="e.g. Temple premises, 26 October evening" value={ds} onChange={e=>setDs(e.target.value)} />
            <div className="grid2">
              <div><label className="lbl">Step 2a — Which Google account?</label>
                <select className="in" value={acc} onChange={e=>setAcc(e.target.value)}>
                  {accounts.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
                <p className="muted" style={{margin:"6px 0 0"}}>Photos eat storage, so each event can use a different account. Change it any time for new events.</p></div>
              <div><label className="lbl">Step 2b — Inside which folder?</label>
                <select className="in" value={parent} onChange={e=>setParent(e.target.value)}>
                  <option value="">Main folder (simplest)</option>
                  {folders.map((f:any)=><option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <p className="muted" style={{margin:"6px 0 0"}}>A dated folder with your event&apos;s name is created inside it automatically.</p></div>
            </div>
            <div style={{marginTop:14}}><FireButton block onClick={create}><Plus size={17} /> Step 3 — Create event</FireButton></div>
            {msg && <div className="notice">{msg}</div>}
            {!accounts.length && <div className="notice"><Info size={14} style={{verticalAlign:-2}} /> First, connect your Google Drive in the <b>Google Drive</b> tab. Without it, photos have nowhere to go.</div>}
          </section>

          <h3 style={{margin:"18px 0 8px"}}><CalendarHeart size={17} style={{verticalAlign:-2}} /> Your events ({buckets.length})</h3>
          <div>
            {buckets.map(b=>(<BucketRow key={b.id} b={b} onChange={load} />))}
            {!buckets.length && (
              <div className="card empty"><img src="/lotus.svg" alt="" /><b>No events yet</b><p className="muted">Create your first event above. Its QR will appear here, ready to print or share.</p></div>
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
            <div className="card empty"><img src="/lotus.svg" alt="" /><b>Nothing here yet</b><p className="muted">Share this event&apos;s QR from the &ldquo;Events & QR codes&rdquo; tab. As soon as someone uploads, their photos appear here.</p></div>
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
                <a className="btn btn-p" href={dlUrl(light)} download={light.filename}><Download size={17} /> Save in full quality</a>
                <button className="btn btn-g" style={{color:"#fff",borderColor:"#fff",background:"transparent"}} onClick={()=>delUpload(light.id)}><Trash2 size={17} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {tab==="drive" && <DriveTab accounts={accounts} onChange={load} />}
      {tab==="settings" && <SettingsTab />}
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
        <button className="btn btn-g" onClick={async()=>{if(!confirm("Remove this event from the list? Photos already in Google Drive stay safe."))return; await fetch(`/api/buckets/${b.id}`,{method:"DELETE"}); onChange();}}><Trash2 size={15} /></button>
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
      <div className="guide"><b>How to use it:</b> press PNG to download, print it and stick it at the entrance — or press Share to send it on WhatsApp. The temple logo sits in the middle automatically.</div>
      <QRCard url={url} eventName={name} />
    </>
  );
}

function DriveTab({ accounts, onChange }:{ accounts:any[]; onChange:()=>void }){
  const [configured,setConfigured]=useState<boolean|null>(null);
  const [redirectUri,setRedirectUri]=useState("");
  const [browse,setBrowse]=useState("");
  const [trail,setTrail]=useState<{id:string;name:string}[]>([]);
  const [folders,setFolders]=useState<any[]>([]);
  const [newName,setNewName]=useState("");
  const [msg,setMsg]=useState("");

  useEffect(()=>{
    fetch("/api/drive/status").then(x=>x.json()).then(j=>{ setConfigured(!!j.configured); setRedirectUri(j.redirectUri||""); }).catch(()=>setConfigured(false));
  },[]);

  const cur = trail.length ? trail[trail.length-1].id : "";
  useEffect(()=>{
    if(!browse) return;
    setTrail([]); setFolders([]);
    fetch(`/api/drive/folders?accountId=${browse}`).then(x=>x.json()).then(j=>{ if(j.folders) setFolders(j.folders); }).catch(()=>{});
  },[browse]);

  async function openFolder(id:string,name:string){
    const t=[...trail,{id,name}];
    setTrail(t);
    const j=await fetch(`/api/drive/folders?accountId=${browse}&parent=${id}`).then(x=>x.json()).catch(()=>null);
    if(j?.folders) setFolders(j.folders);
  }
  async function goUp(){
    const t=trail.slice(0,-1);
    setTrail(t);
    const parent=t.length?t[t.length-1].id:"";
    const j=await fetch(`/api/drive/folders?accountId=${browse}${parent?`&parent=${parent}`:""}`).then(x=>x.json()).catch(()=>null);
    if(j?.folders) setFolders(j.folders);
  }
  async function useThisFolder(){
    setMsg("");
    const r=await fetch("/api/drive/accounts/patch",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:browse,rootFolderId:cur||"root"})}).then(x=>x.json());
    if(r.error) setMsg(r.error);
    else { setMsg("Saved! New events using this account will store photos in the folder you picked."); setBrowse(""); onChange(); }
  }
  async function makeFolder(){
    setMsg("");
    if(newName.trim().length<2){ setMsg("Type a name for the new folder first."); return; }
    const r=await fetch("/api/drive/folders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accountId:browse,parent:cur,name:newName.trim()})}).then(x=>x.json());
    if(r.error){ setMsg(r.error); return; }
    setNewName("");
    const j=await fetch(`/api/drive/folders?accountId=${browse}${cur?`&parent=${cur}`:""}`).then(x=>x.json()).catch(()=>null);
    if(j?.folders) setFolders(j.folders);
  }

  return (
    <section className="card pad reveal">
      <h2><HardDrive size={19} style={{verticalAlign:-3}} /> Your Google Drive space</h2>
      <p className="muted">Every photo lives in your own Google account (your 5TB) — never on this website. Connect with Google login, then point each account at the folder you want.</p>

      {configured===false && (
        <div className="guide"><b>One-time setup by the site owner (5 minutes, done once ever):</b>
          <div className="howrow"><span className="stepnum">1</span><p><b>Make a free Google login key</b>Open Google Cloud Console → new project → Credentials → Create → OAuth client ID → <b>Web application</b>. Under &ldquo;Authorised redirect URIs&rdquo; paste exactly:<br /><code style={{fontSize:11,wordBreak:"break-all"}}>{redirectUri||"loading…"}</code></p></div>
          <div className="howrow"><span className="stepnum">2</span><p><b>Paste the 2 codes into the site</b>Put the Client ID + Client Secret in <code>.env.local</code> as <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> (on Vercel: Settings → Environment Variables), then restart. The Connect button appears here by itself.</p></div>
        </div>
      )}

      <div style={{margin:"12px 0"}}>
        <a href="/api/drive/connect" style={{textDecoration:"none"}}><FireButton><GoogleIcon size={17} /> Connect with Google</FireButton></a>
        <p className="muted" style={{margin:"8px 0 0"}}>Press it, choose the Gmail that has your 5TB space, press Allow. The portal asks Google for the <b>minimum permission</b> (only its own files) and makes its own &ldquo;Maa Unique Dham&rdquo; folder — it can never touch anything else in your Drive. Add as many accounts as you like.</p>
      </div>
      {msg && <div className="notice">{msg}</div>}

      <h3>Connected accounts ({accounts.length})</h3>
      {!accounts.length && <div className="card empty"><img src="/lotus.svg" alt="" /><b>No account connected yet</b><p className="muted">Press &ldquo;Connect with Google&rdquo; above — no codes to copy, no scripts to run.</p></div>}
      {accounts.map(a=>(
        <div key={a.id} className="bucket" style={{marginBottom:10}}>
          <div className="row" style={{alignItems:"center"}}>
            <b>{a.label}</b>
            <button className="btn btn-g btn-sm" style={{marginLeft:"auto"}} onClick={()=>{ setBrowse(browse===a.id?"":a.id); setMsg(""); }}><FolderOpen size={15} /> {browse===a.id?"Close folder picker":"Choose storage folder"}</button>
            <button className="btn btn-g btn-sm" onClick={async()=>{ if(accounts.length<=1){alert("Keep at least one account connected.");return;} if(!confirm("Disconnect this account? Events using it must be moved first."))return; const r=await fetch("/api/drive/accounts?id="+a.id,{method:"DELETE"}).then(x=>x.json()); if(r.error) alert(r.error); onChange(); }}><Trash2 size={15} /></button>
          </div>
          <p className="muted" style={{margin:"6px 0 0"}}>Photos currently go into: <code style={{fontSize:11}}>{a.rootFolderId==="root"?"My Drive (main folder)":a.rootFolderId.slice(0,24)+"…"}</code></p>
          {browse===a.id && (
            <div style={{marginTop:10,borderTop:"1px dashed var(--line)",paddingTop:10}}>
              <p className="muted" style={{margin:"0 0 6px"}}><b>Where in this account?</b> Tap folders to look inside. Google&apos;s safety rule means only folders made by this portal are listed here — your private files stay invisible to it. When you are in the right place, press &ldquo;Use this folder&rdquo;.</p>
              <div className="row" style={{alignItems:"center",marginBottom:8}}>
                <span className="badge">My Drive{trail.map(t=>` / ${t.name}`).join("")}</span>
                {!!trail.length && <button className="btn btn-g btn-sm" onClick={goUp}><Undo2 size={14} /> Back</button>}
                <button className="btn btn-p btn-sm" style={{marginLeft:"auto"}} onClick={useThisFolder}><Check size={15} /> Use this folder</button>
              </div>
              {folders.map((f:any)=>(
                <button key={f.id} className="folder" style={{width:"100%",marginBottom:6}} onClick={()=>openFolder(f.id,f.name)}>
                  <span className="f"><FolderOpen size={20} /></span> <b>{f.name}</b> <span>— tap to open</span>
                </button>
              ))}
              {!folders.length && <p className="muted">No subfolders here — you can still press &ldquo;Use this folder&rdquo;, or make one below.</p>}
              <div className="row" style={{marginTop:8}}>
                <input className="in" style={{flex:1}} placeholder="New folder name, e.g. Temple Events 2026" value={newName} onChange={e=>setNewName(e.target.value)} />
                <button className="btn btn-g" onClick={makeFolder}><Plus size={16} /> Make folder</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

function SettingsTab(){
  const [c,setC]=useState(""); const [n,setN]=useState(""); const [m,setM]=useState("");
  async function ch(){
    setM("");
    const r = await fetch("/api/admin/change-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({current:c,next:n})}).then(x=>x.json());
    if(r.error) setM(r.error); else { setM("Password changed. Please sign in again with the new one."); setTimeout(()=>window.location.href="/admin/login",1200); }
  }
  return (
    <section className="card pad reveal">
      <h2><Lock size={18} style={{verticalAlign:-2}} /> Safety settings</h2>
      <p className="muted">In plain words: your password is stored scrambled (never readable), sign-ins are slowed down after wrong guesses, and your Drive files are never shared publicly. Several people may stay signed in at the same time for now.</p>
      <div className="guide"><b>Changing the password?</b> Pick something long you can remember, like three words plus a number (example: &ldquo;lotus-temple-morning-7&rdquo;). Everyone signed in will need the new one.</div>
      <label className="lbl">Your current password</label><input className="in" type="password" value={c} onChange={e=>setC(e.target.value)} />
      <label className="lbl">Your new password (12 or more characters)</label><input className="in" type="password" value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. lotus-temple-morning-7" />
      <button className="btn btn-d btn-block" style={{marginTop:12}} onClick={ch}>Change my password</button>
      {m && <div className="notice">{m}</div>}
    </section>
  );
}
