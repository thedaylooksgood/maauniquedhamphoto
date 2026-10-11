import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display, Amita, Yatra_One } from "next/font/google";
import { Flame } from "lucide-react";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap", variable: "--font-manrope" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700", "800"], style: ["normal", "italic"], display: "swap", variable: "--font-playfair" });
const amita = Amita({ subsets: ["latin", "devanagari"], weight: ["400", "700"], display: "swap", variable: "--font-amita" });
const yatra = Yatra_One({ subsets: ["latin", "devanagari"], weight: ["400"], display: "swap", variable: "--font-yatra" });

export const metadata: Metadata = {
  title: "Maa Unique Dham — Photos Portal",
  description: "Scan the QR, offer your photos & videos. Saved in HD to the temple Drive.",
  manifest: "/manifest.json",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#FFF9F0" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${playfair.variable} ${amita.variable} ${yatra.variable}`}>
        <div className="aura" aria-hidden />
        <header className="top">
          <div className="top-in">
            <div className="logo"><img src="/temple-logo.svg" alt="Temple" width={44} height={44} /></div>
            <div className="brand"><b className="nepali-display">माँ Unique धाम</b><span>Photos Portal</span></div>
            <div className="top-act">
              <a className="btn btn-g btn-sm" href="/admin"><Flame size={15} /> Admin</a>
            </div>
          </div>
        </header>
        <div className="anim-page">{children}</div>
        <footer className="foot"><span className="nepali-display">जय माता दी</span> — every memory, a flower at her feet.</footer>
      </body>
    </html>
  );
}
