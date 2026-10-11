"use client";
import { ArrowRight } from "lucide-react";
import React from "react";

type Props = {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  block?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
};

// Temple-saffron FlowButton: orbiting beam border, hover flood fill,
// sliding arrow + shifting label, pill morph, glow shadows.
export default function FireButton({ children, variant = "primary", block, disabled, type = "button", href, onClick, style }: Props) {
  const cls = `fire fire-${variant}${block ? " fire-block" : ""}`;
  const inner = (
    <>
      <span className="beamTrack"><span className="beamSpinner" /></span>
      <span className="innerBg" />
      <span className="circle" />
      <ArrowRight size={17} className="fa faL" />
      <span className="fl">{children}</span>
      <ArrowRight size={17} className="fa faR" />
    </>
  );
  if (href) {
    return <a className={cls} style={style} href={href} onClick={onClick as any}>{inner}</a>;
  }
  return <button className={cls} style={style} type={type} disabled={disabled} onClick={onClick}>{inner}</button>;
}
