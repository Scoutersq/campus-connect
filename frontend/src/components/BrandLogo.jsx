import React from "react";
import logoAsset from "../assets/campusconnect2.png";

export default function BrandLogo({ className = "" }) {
  const baseClasses = "h-12 w-auto object-contain";
  const combinedClasses = className
    ? `${baseClasses} ${className}`.trim()
    : baseClasses;

  return (
    <img src={logoAsset} alt="Campus Connect logo" className={combinedClasses} loading="lazy" />
  );
}
