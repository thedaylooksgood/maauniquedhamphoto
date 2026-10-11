"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Seal from "@/components/Seal";
import FireButton from "@/components/FireButton";
import { CheckCircle2, XCircle, Copy, KeyRound } from "lucide-react";

export default function DriveResult({ searchParams }: { searchParams: { ok?: string; fresh?: string; msg?: string } }) {
  const ok = searchParams.ok === "1";
  const fresh = searchParams.fresh === "1";
  const [token, setToken] = useState("");
  const [email, setEmail] = useState(searchParams.msg || "");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (ok && fresh) {
      fetch("/api/drive/token-once").then(x=>x.json()).then(j=>{
        if (j.token) { setToken(j.token); if (j.email) setEmail(j.email); }
      }).catch(()=>{});
    }
  }, [ok, fresh]);

  async function copy(t: string, what: string) {
    try { await navigator.clipboard.writeText(t); setCopied(what); setTimeout(()=>setCopied(""), 2000); }
    catch { setCopied("Copy failed — select and copy by hand"); }
  }

  return (
    <main className="wrap" style={{maxWidth:560}}>
      <section className="card pad reveal" style={{marginTop:30, textAlign:"center"}}>
        <div style={{display:"grid",placeItems:"center",marginBottom:8}}><Seal size={100} ring={false} /></div>
        {ok ? <CheckCircle2 size={40} color="#15803d" /> : <XCircle size={40} color="#b91c1c" />}
        <h2 className="font-display" style={{marginTop:8}}>{ok ? "Google signed in" : "Not connected yet"}</h2>
        {!ok && <p className="muted">{searchParams.msg || "Something went wrong. Please try again."}</p>}
        {ok && !fresh && <p className="muted">Signed in as <b>{email}</b>.</p>}
        {ok && fresh && (
          <>
            <p className="muted">Signed in as <b>{email}</b>. <b>Last step — one paste, ever:</b> copy this key into your hosting settings as <code>GOOGLE_REFRESH_TOKEN</code>, redeploy, and Drive is permanently connected. The key is shown once and never stored anywhere.</p>
            <div className="guide" style={{textAlign:"left"}}>
              <b><KeyRound size={14} style={{verticalAlign:-2}} /> Your Google key (tap to copy)</b>
              <div><code style={{fontSize:11,wordBreak:"break-all"}}>{token || "loading your key…"}</code></div>
              <div className="row" style={{marginTop:8}}>
                <button className="btn btn-p btn-sm" disabled={!token} onClick={()=>copy(token, "key")}>{copied==="key" ? "Copied!" : <><Copy size={14} /> Copy key</>}</button>
                <button className="btn btn-g btn-sm" onClick={()=>copy("GOOGLE_REFRESH_TOKEN=" + token, "line")}>{copied==="line" ? "Copied!" : <><Copy size={14} /> Copy as settings line</>}</button>
              </div>
            </div>
            <div className="guide" style={{textAlign:"left"}}><b>Where to paste it:</b> localhost → <code>.env.local</code>. Vercel → Settings → Environment Variables → add <code>GOOGLE_REFRESH_TOKEN</code> → Redeploy. That&apos;s it — events and uploads start working.</div>
          </>
        )}
        <div style={{marginTop:10}}><Link href="/admin" style={{textDecoration:"none"}}><FireButton>Back to dashboard</FireButton></Link></div>
      </section>
    </main>
  );
}
