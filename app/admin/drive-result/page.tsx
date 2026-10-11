import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

export default function DriveResult({ searchParams }: { searchParams: { ok?: string; msg?: string } }) {
  const ok = searchParams.ok === "1";
  return (
    <main className="wrap" style={{maxWidth:520}}>
      <section className="card pad reveal" style={{marginTop:30, textAlign:"center"}}>
        <img src="/lotus.svg" alt="" style={{width:110}} />
        {ok ? <CheckCircle2 size={40} color="#15803d" /> : <XCircle size={40} color="#b91c1c" />}
        <h2 className="font-display" style={{marginTop:8}}>{ok ? "Google Drive connected" : "Not connected yet"}</h2>
        <p className="muted">
          {ok
            ? <>Signed in as <b>{searchParams.msg}</b>. Now pick which folder its photos go into, on the next screen.</>
            : (searchParams.msg || "Something went wrong. Please try again.")}
        </p>
        <Link href="/admin" className="btn btn-p" style={{marginTop:8}}>Back to dashboard</Link>
      </section>
    </main>
  );
}
