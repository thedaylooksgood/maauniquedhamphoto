"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FireButton from "@/components/FireButton";
import { Flame, Lock } from "lucide-react";

export default function LoginClient() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const r = useRouter();
  async function go(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const res = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ password: pw }) }).then(x=>x.json());
    setBusy(false);
    if (res.ok) r.push("/admin");
    else setErr(res.error || "Login failed");
  }
  return (
    <main className="wrap" style={{maxWidth:440}}>
      <section className="card pad reveal" style={{marginTop:30, textAlign:"center"}}>
        <div className="floaty" style={{fontSize:44}}><Flame size={44} color="#c2410c" /></div>
        <h2>Admin Login</h2>
        <p className="muted">Everyone you share this password with can stay signed in together.</p>
        <form onSubmit={go} style={{textAlign:"left"}}>
          <label className="lbl"><Lock size={13} style={{verticalAlign:-2}} /> Admin password</label>
          <input className="in" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Enter strong password" autoFocus />
          {err && <div className="notice" style={{borderColor:"#fca5a5",background:"#fef2f2"}}>{err}</div>}
          <div style={{marginTop:14}}><FireButton block disabled={busy} type="submit">{busy?"Verifying…":"Sign in"}</FireButton></div>
        </form>
      </section>
    </main>
  );
}
