"use client";
import { useEffect, useRef, useState } from "react";
// @ts-ignore
import QRCodeStyling from "qr-code-styling";
import { Download, Share2, Printer, ImagePlus, Copy, Link2, Image as ImageIcon } from "lucide-react";

// Cute QR: a small pink lotus blooms in the middle by default.
// The admin can swap in the temple seal (or any picture) below.
export default function QRCard({ url, eventName }: { url: string; eventName: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const qrRef = useRef<any>(null);
  const [logo, setLogo] = useState("/final-lotus.png");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mud_logo");
    if (saved) setLogo(saved);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const qr = new QRCodeStyling({
      width: 260, height: 260, data: url, margin: 8,
      image: logo, imageOptions: { crossOrigin: "anonymous", margin: 8, imageSize: 0.4 },
      dotsOptions: {
        type: "rounded",
        gradient: {
          type: "linear", rotation: Math.PI / 4,
          colorStops: [{ offset: 0, color: "#7c2d12" }, { offset: 1, color: "#c9950a" }],
        },
      },
      cornersSquareOptions: { color: "#c2410c", type: "extra-rounded" },
      cornersDotOptions: { color: "#c1121f" },
      backgroundOptions: { round: 0.2, color: "#ffffff" },
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

  function loadImg(src: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = src;
    });
  }

  // One beautiful shareable image: seal on top, cute QR in the middle,
  // lotus + instructions below. Ready for WhatsApp / print.
  async function makePoster(): Promise<Blob> {
    await (document as any).fonts?.ready?.catch(()=>{});
    const qrBlob = await qrRef.current?.getRawData("png");
    if (!qrBlob) throw new Error("QR not ready yet");
    const [seal, lotus, qr] = await Promise.all([
      loadImg("/logo.png"),
      loadImg("/final-lotus.png"),
      loadImg(URL.createObjectURL(qrBlob)),
    ]);
    const W = 1080, H = 1520;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const x = cv.getContext("2d")!;
    // backdrop
    x.fillStyle = "#FFF9F0"; x.fillRect(0, 0, W, H);
    x.strokeStyle = "#c2410c"; x.lineWidth = 6;
    x.strokeRect(24, 24, W - 48, H - 48);
    x.strokeStyle = "#c9950a"; x.lineWidth = 2;
    x.strokeRect(44, 44, W - 88, H - 88);
    // seal
    x.save();
    x.beginPath(); x.arc(W/2, 250, 150, 0, Math.PI*2); x.clip();
    x.fillStyle = "#fff"; x.fillRect(W/2-150, 100, 300, 300);
    x.drawImage(seal, W/2-150, 100, 300, 300);
    x.restore();
    x.strokeStyle = "#c1121f"; x.lineWidth = 5;
    x.beginPath(); x.arc(W/2, 250, 150, 0, Math.PI*2); x.stroke();
    // temple name
    x.fillStyle = "#c2410c"; x.textAlign = "center";
    x.font = "70px 'Yatra One', serif";
    x.fillText("माँ Unique धाम", W/2, 500);
    // event name (wrapped)
    x.fillStyle = "#2b1a12"; x.font = "700 62px 'Playfair Display', serif";
    const words = eventName.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (x.measureText(t).width > W - 160 && line) { lines.push(line); line = w; }
      else line = t;
      if (lines.length === 2) break;
    }
    if (line) lines.push(line);
    lines.slice(0, 2).forEach((l, i) => x.fillText(l, W/2, 585 + i * 72));
    // gold divider
    const dy = 585 + lines.slice(0,2).length * 72;
    x.strokeStyle = "#c9950a"; x.lineWidth = 4;
    x.beginPath(); x.moveTo(W/2 - 130, dy); x.lineTo(W/2 + 130, dy); x.stroke();
    // cute QR
    const qs = 620, qy = dy + 40;
    x.fillStyle = "#fff";
    x.beginPath(); (x as any).roundRect((W-qs)/2 - 18, qy - 18, qs + 36, qs + 36, 36); x.fill();
    x.drawImage(qr, (W-qs)/2, qy, qs, qs);
    // lotus + instruction
    x.drawImage(lotus, W/2 - 70, qy + qs + 50, 140, 140);
    x.fillStyle = "#7c2d12"; x.font = "700 42px Manrope, sans-serif";
    x.fillText("Scan to offer your photos", W/2, qy + qs + 260);
    x.fillStyle = "#8a6f5c"; x.font = "500 32px Manrope, sans-serif";
    x.fillText("No login needed  •  Full quality", W/2, qy + qs + 310);
    return await new Promise<Blob>((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error("Poster failed")), "image/png"));
  }

  const [posterBusy, setPosterBusy] = useState(false);
  async function downloadPoster() {
    setPosterBusy(true);
    try {
      const blob = await makePoster();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = eventName + "-QR-poster.png";
      a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
    } catch { alert("Poster failed — try the PNG button instead."); }
    setPosterBusy(false);
  }
  async function sharePoster() {
    setPosterBusy(true);
    try {
      const blob = await makePoster();
      const file = new File([blob], eventName + "-QR-poster.png", { type: "image/png" });
      if ((navigator as any).canShare?.({ files: [file] })) {
        await (navigator as any).share({ files: [file], title: eventName });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
      }
    } catch {}
    setPosterBusy(false);
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false), 2000); }
    catch { alert("Copy this link: " + url); }
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
        <button className="btn btn-g" onClick={copyLink}>{copied ? "Copied!" : <><Link2 size={16} /> Copy link</>}</button>
        <button className="btn btn-g" onClick={share}><Share2 size={16} /> Share</button>
        <button className="btn btn-g" onClick={()=>window.print()}><Printer size={16} /> Print</button>
      </div>
      <div className="row" style={{justifyContent:"center",marginTop:10}}>
        <button className="btn btn-p" disabled={posterBusy} onClick={downloadPoster}><ImageIcon size={16} /> {posterBusy ? "Making…" : "Poster image"}</button>
        <button className="btn btn-g" disabled={posterBusy} onClick={sharePoster}><Share2 size={16} /> Share poster</button>
      </div>
      <div className="row" style={{justifyContent:"center",marginTop:10}}>
        <button className="btn btn-g btn-sm" onClick={()=>{ localStorage.setItem("mud_logo","/logo.png"); setLogo("/logo.png"); }}>Use temple seal instead</button>
        <button className="btn btn-g btn-sm" onClick={()=>{ localStorage.setItem("mud_logo","/final-lotus.png"); setLogo("/final-lotus.png"); }}>Use lotus instead</button>
      </div>
      <div style={{marginTop:10}}>
        <label className="muted"><ImagePlus size={13} style={{verticalAlign:-2}} /> …or your own picture in the middle: <input type="file" accept="image/*" onChange={onLogo} /></label>
      </div>
    </div>
  );
}
