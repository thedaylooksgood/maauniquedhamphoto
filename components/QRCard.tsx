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
  const hiRef = useRef<any>(null); // print-sharp 2048px twin, built on demand
  const [logo, setLogo] = useState("/final-lotus.png");
  const [copied, setCopied] = useState(false);

  function qrOptions(size: number, margin: number, imgMargin: number): any {
    return {
      width: size, height: size, data: url, margin,
      image: logo, imageOptions: { crossOrigin: "anonymous", margin: imgMargin, imageSize: 0.4 },
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
    };
  }

  // 2048px print twin (GPay-poster sharp). Built lazily so the page stays fast.
  function hiQR() {
    if (!hiRef.current) hiRef.current = new QRCodeStyling(qrOptions(2048, 64, 48));
    return hiRef.current;
  }

  useEffect(() => {
    const saved = localStorage.getItem("mud_logo") || "";
    // Old dull SVG lotuses were deleted — fall back to the final lotus.
    if (saved && !/lotus(-bloom|-pink)?\.svg$/.test(saved)) setLogo(saved);
    else { localStorage.removeItem("mud_logo"); setLogo("/final-lotus.png"); }
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const qr = new QRCodeStyling(qrOptions(260, 8, 8));
    qr.append(ref.current);
    qrRef.current = qr;
    hiRef.current = null; // rebuild print twin if logo/url changed
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

  // One beautiful shareable image: seal, Devanagari temple name in Amita,
  // event name in Playfair, cute QR, lotus flourishes. Ready for WhatsApp/print.
  async function makePoster(): Promise<Blob> {
    try {
      await Promise.all([
        (document as any).fonts?.load("700 80px Amita"),
        (document as any).fonts?.load("700 60px 'Playfair Display'"),
        (document as any).fonts?.load("700 40px Manrope"),
        (document as any).fonts?.load("500 32px Manrope"),
      ]);
    } catch {}
    const qrBlob = await hiQR().getRawData("png"); // 2048px source → crisp at any size
    if (!qrBlob) throw new Error("QR not ready yet");
    const [seal, lotus, qr] = await Promise.all([
      loadImg("/logo.png"),
      loadImg("/final-lotus.png"),
      loadImg(URL.createObjectURL(qrBlob)),
    ]);
    const W = 1080, H = 1680;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const x = cv.getContext("2d")!;
    // backdrop: warm radial glow on cream
    const bg = x.createRadialGradient(W/2, 420, 80, W/2, 420, 900);
    bg.addColorStop(0, "#FFFDF8"); bg.addColorStop(1, "#FFF3E4");
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    // double frame
    x.strokeStyle = "#c1121f"; x.lineWidth = 7; x.strokeRect(26, 26, W - 52, H - 52);
    x.strokeStyle = "#c9950a"; x.lineWidth = 2.5; x.strokeRect(48, 48, W - 96, H - 96);
    // corner flourishes: small faded lotuses
    x.save(); x.globalAlpha = 0.22;
    x.drawImage(lotus, 70, 66, 150, 100);
    x.save(); x.translate(W - 70, 66); x.scale(-1, 1); x.drawImage(lotus, 0, 0, 150, 100); x.restore();
    x.restore();
    // seal medallion
    x.save();
    x.shadowColor = "rgba(193,18,31,.35)"; x.shadowBlur = 45;
    x.beginPath(); x.arc(W/2, 280, 140, 0, Math.PI*2);
    x.fillStyle = "#fff"; x.fill();
    x.restore();
    x.save();
    x.beginPath(); x.arc(W/2, 280, 140, 0, Math.PI*2); x.clip();
    x.drawImage(seal, W/2-140, 140, 280, 280);
    x.restore();
    x.strokeStyle = "#c1121f"; x.lineWidth = 6;
    x.beginPath(); x.arc(W/2, 280, 140, 0, Math.PI*2); x.stroke();
    x.strokeStyle = "#c9950a"; x.lineWidth = 2.5;
    x.beginPath(); x.arc(W/2, 280, 152, 0, Math.PI*2); x.stroke();
    // temple name in Amita Devanagari
    x.fillStyle = "#9a3412"; x.textAlign = "center";
    x.font = "700 92px Amita, serif";
    x.fillText("माँ यूनिक धाम", W/2, 545);
    // event name in Playfair, wrapped, max 2 lines
    x.fillStyle = "#2b1a12"; x.font = "700 60px 'Playfair Display', serif";
    const words = eventName.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (x.measureText(t).width > W - 200 && line) { lines.push(line); line = w; }
      else line = t;
      if (lines.length === 2) break;
    }
    if (line) lines.push(line);
    lines.slice(0, 2).forEach((l, i) => x.fillText(l, W/2, 625 + i * 70));
    // gold divider with diamond
    const dy = 625 + (lines.slice(0, 2).length - 1) * 70 + 56;
    x.strokeStyle = "#c9950a"; x.lineWidth = 3.5;
    x.beginPath(); x.moveTo(W/2 - 170, dy); x.lineTo(W/2 - 24, dy); x.moveTo(W/2 + 24, dy); x.lineTo(W/2 + 170, dy); x.stroke();
    x.save(); x.translate(W/2, dy); x.rotate(Math.PI/4);
    x.fillStyle = "#c9950a"; x.fillRect(-11, -11, 22, 22); x.restore();
    // cute QR in soft white card
    const qs = 590, qy = dy + 42;
    x.save();
    x.shadowColor = "rgba(124,45,18,.25)"; x.shadowBlur = 40;
    x.fillStyle = "#fff";
    x.beginPath(); (x as any).roundRect((W-qs)/2 - 22, qy - 22, qs + 44, qs + 44, 40); x.fill();
    x.restore();
    x.drawImage(qr, (W-qs)/2, qy, qs, qs);
    // lotus + plain instruction
    x.drawImage(lotus, W/2 - 80, qy + qs + 30, 160, 107);
    x.fillStyle = "#7c2d12"; x.font = "700 44px Manrope, sans-serif";
    x.fillText("Scan to add photos & videos", W/2, qy + qs + 193);
    x.fillStyle = "#8a6f5c"; x.font = "500 33px Manrope, sans-serif";
    x.fillText("No login needed  •  Full quality", W/2, qy + qs + 241);
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
        <button className="btn btn-p" onClick={()=>hiQR().download({name:eventName+"-QR-2048px", extension:"png"})}><Download size={16} /> HD PNG</button>
        <button className="btn btn-g" onClick={()=>hiQR().download({name:eventName+"-QR-print", extension:"svg"})}><Download size={16} /> SVG</button>
        <button className="btn btn-g" onClick={copyLink}>{copied ? "Copied!" : <><Link2 size={16} /> Copy link</>}</button>
        <button className="btn btn-g" onClick={share}><Share2 size={16} /> Share</button>
        <button className="btn btn-g" onClick={()=>window.print()}><Printer size={16} /> Print</button>
      </div>
      <p className="muted" style={{textAlign:"center",margin:"8px 0 0",fontSize:12}}>HD PNG is 2048px — sharp on big flex prints. SVG is vector — infinitely sharp for print shops.</p>
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
