import { readDB } from "@/lib/db";
import { notFound } from "next/navigation";
import UploadClient from "./UploadClient";

export const dynamic = "force-dynamic";

export default async function UploadPage({ params, searchParams }: { params: { slug: string }; searchParams: { k?: string } }) {
  const db = await readDB();
  const b = db.buckets.find((x) => x.slug === params.slug && x.isActive);
  if (!b || b.qrToken !== searchParams.k) notFound();
  return (
    <main className="wrap" style={{maxWidth:640}}>
      <section className="hero">
        <img className="hero-lotus" src="/lotus.svg" alt="" />
        <div className="nepali-display reveal" style={{fontSize:24,color:"var(--saffron-d)"}}>माँ को अर्पित</div>
        <span className="pill reveal"><span className="pulse-dot" /> {b.name}</span>
        <h1 className="reveal d1">Offer your <span className="shimmer">photos</span></h1>
        <p className="reveal d2">{b.description || "Share the moments you captured. They will be kept safely in full quality."}</p>
        <p className="muted reveal d3">No account needed &bull; Goes to this event only &bull; Nobody else can see your photos</p>
      </section>
      <section className="quote reveal d3" style={{marginTop:14}}>
        <p>&ldquo;Whatever is offered with love — a flower, a photo, a prayer — <em>Maa</em> accepts it with grace.&rdquo;</p>
      </section>
      <UploadClient slug={b.slug} token={b.qrToken} eventName={b.name} />
    </main>
  );
}
