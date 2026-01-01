import React from "react";
import logoAsset from "../assets/cc-2-logo.webp";

export default function BrandLogo({ className = "" }) {
  const base = "w-auto object-contain bg-transparent";
  const applied = className ? `${base} ${className}`.trim() : `${base} h-12`;

  return (
    <img
      src={logoAsset}
      alt="Campus Connect logo"
      className={applied}
      loading="lazy"
      style={{ backgroundColor: 'transparent' }}
    />
  );
}
