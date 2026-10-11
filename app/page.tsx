import FireButton from "@/components/FireButton";
import { QrCode, Camera, CheckCircle2, ShieldCheck, Zap, FolderHeart } from "lucide-react";

export default function Home() {
  return (
    <main className="wrap">
      <section className="hero">
        <img className="hero-lotus" src="/lotus.svg" alt="" />
        <div className="nepali-display reveal" style={{fontSize:26,color:"var(--saffron-d)"}}>माँ के चरणों में</div>
        <span className="pill reveal"><span className="pulse-dot" /> No login &bull; No app &bull; Opens in seconds</span>
        <h1 className="reveal d1">Offer your <span className="shimmer">memories</span> at her feet</h1>
        <p className="reveal d2">Every photo you clicked at the Dham becomes an offering. Scan the event QR, upload in one tap — saved in full HD, organised by event, kept private in the temple Drive.</p>
        <div className="steps reveal d3">
          <div className="step"><b><QrCode size={24} style={{display:"inline"}} /></b>1. Scan the QR</div>
          <div className="step"><b><Camera size={24} style={{display:"inline"}} /></b>2. Upload photos</div>
          <div className="step"><b><CheckCircle2 size={24} style={{display:"inline"}} /></b>3. Done, blessed</div>
        </div>
        <div className="row reveal d4" style={{justifyContent:"center",marginTop:16}}>
          <FireButton href="/admin">Open Admin Dashboard</FireButton>
        </div>
      </section>

      <div className="lotus-divider reveal d3"><img src="/lotus.svg" alt="Lotus offered to Maa Durga" /></div>

      <section className="quote reveal d3">
        <p>&ldquo;Wherever the devotee remembers her with a pure heart, there <em>Maa Durga</em> arrives — protector of the faithful, destroyer of darkness, mother of all courage.&rdquo;</p>
        <cite>— Offered with devotion at Maa Unique Dham</cite>
      </section>

      <section className="grid3 reveal d4" style={{marginTop:14}}>
        <div className="feature"><span className="ic"><Zap size={19} /></span><div><b>Opens instantly</b><span>Light pages, made for slow temple networks.</span></div></div>
        <div className="feature"><span className="ic"><FolderHeart size={19} /></span><div><b>Event-wise buckets</b><span>Each event gets its own folder and QR.</span></div></div>
        <div className="feature"><span className="ic"><ShieldCheck size={19} /></span><div><b>Private by design</b><span>Only the admin can view the photos.</span></div></div>
      </section>

      <section className="card pad reveal d5" style={{marginTop:14}}>
        <h2>How it works</h2>
        <p className="muted">The priest or organiser creates an event bucket and shares its QR. Devotees scan it and offer their photos into that event only. Everything lands in the temple&apos;s Google Drive — named, dated and organised.</p>
        <div className="row">
          <span className="badge ok">Per-event QR</span>
          <span className="badge ok">HD originals</span>
          <span className="badge ok">Device registry</span>
          <span className="badge ok">Private gallery</span>
          <span className="badge ok">Shared admin access</span>
        </div>
      </section>
    </main>
  );
}
