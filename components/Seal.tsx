"use client";
import Image from "next/image";

// The temple seal, presented as a glowing medallion.
export default function Seal({ size = 150, ring = true, priority = false }: { size?: number; ring?: boolean; priority?: boolean }) {
  return (
    <span className="seal-wrap floaty" style={{ width: size, height: size }}>
      {ring && <span className="seal-ring" aria-hidden />}
      <Image
        src="/logo.png"
        alt="Maa Unique Dham seal"
        width={size}
        height={size}
        className="seal-img"
        priority={priority}
      />
    </span>
  );
}
