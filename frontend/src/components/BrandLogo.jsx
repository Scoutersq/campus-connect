import React from "react";
import logoAsset from "../assets/campusconnect2.png";

export default function BrandLogo({ className = "" }) {
  const base = "w-auto object-contain";
  const applied = className ? `${base} ${className}`.trim() : `${base} h-12`;

  return (
    <img src={logoAsset} alt="Campus Connect logo" className={applied} loading="lazy" />
  );
}
