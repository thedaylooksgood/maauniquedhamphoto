import { findBucket } from "@/lib/db";
import { notFound } from "next/navigation";
import UploadClient from "./UploadClient";
import Seal from "@/components/Seal";

export const dynamic = "force-dynamic";

export default async function UploadPage({ params, searchParams }: { params: { slug: string }; searchParams: { k?: string } }) {
  let b = null;
  try {
    const found = await findBucket(params.slug);
    if (found && found.isActive && found.token === searchParams.k) b = found;
  } catch {}
  if (!b) notFound();
  return (
    <main className="wrap" style={{ maxWidth: 640, paddingTop: 12 }}>
      <section style={{ textAlign: "center", padding: "10px 0 4px" }}>
        <Seal size={76} ring={false} />
        <div className="nepali-display" style={{ fontSize: 20, color: "var(--saffron-d)", marginTop: 4 }}>माँ को अर्पित</div>
        <h1 className="font-display" style={{ fontSize: 25, margin: "4px 0" }}>{b.name}</h1>
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>Add your photos &amp; videos below — they save in full quality.</p>
      </section>
      <UploadClient slug={b.slug} token={b.token} eventName={b.name} />
    </main>
  );
}
