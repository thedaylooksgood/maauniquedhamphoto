"use client";
import { useEffect, useRef, useState } from "react";
// @ts-ignore
import QRCodeStyling from "qr-code-styling";
import { Download, Share2, Printer, ImagePlus } from "lucide-react";

export default function QRCard({ url, eventName }: { url: string; eventName: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const qrRef = useRef<any>(null);
  const [logo, setLogo] = useState("/temple-logo.svg");

  useEffect(() => {
    const saved = localStorage.getItem("mud_logo");
    if (saved) setLogo(saved);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const qr = new QRCodeStyling({
      width: 260, height: 260, data: url, margin: 8,
      image: logo, imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: 0.42 },
      dotsOptions: { color: "#7c2d12", type: "rounded" },
      cornersSquareOptions: { color: "#c2410c", type: "extra-rounded" },
      cornersDotOptions: { color: "#c2410c" },
      backgroundOptions: { color: "#ffffff" },
    });
    qr.append(ref.current);
    qrRef.current = qr;
  }, [url, logo]);

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { const d = String(reader.result); localStorage.setItem("mud_logo", d); setLogo(d); };
    reader.readAsDataURL(f);
  }

  async function share() {
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: eventName, text: `${eventName} — offer your photos`, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(()=>{});
      alert("Link copied — share it on WhatsApp");
    }
  }

  return (
    <div className="qrbox">
      <div ref={ref} style={{display:"grid",placeItems:"center"}} />
      <b>{eventName}</b>
      <div><code style={{fontSize:11,wordBreak:"break-all"}}>{url}</code></div>
      <div className="row" style={{justifyContent:"center",marginTop:10}}>
        <button className="btn btn-p" onClick={()=>qrRef.current?.download({name:eventName+"-QR", extension:"png"})}><Download size={16} /> PNG</button>
        <button className="btn btn-g" onClick={()=>qrRef.current?.download({name:eventName+"-QR", extension:"svg"})}><Download size={16} /> SVG</button>
        <button className="btn btn-g" onClick={share}><Share2 size={16} /> Share</button>
        <button className="btn btn-g" onClick={()=>window.print()}><Printer size={16} /> Print</button>
      </div>
      <div style={{marginTop:10}}>
        <label className="muted"><ImagePlus size={13} style={{verticalAlign:-2}} /> Temple logo in QR centre: <input type="file" accept="image/*" onChange={onLogo} /></label>
      </div>
    </div>
  );
}
