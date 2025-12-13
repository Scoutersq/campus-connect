"use client";

import React, { useEffect, useRef } from "react";
import "./background-ripple-effect.css";

export function BackgroundRippleEffect({ className = "", pulseDuration = 16 }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    const node = backdropRef.current;
    if (!node) return;

    const handlePointerMove = (event) => {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      node.style.setProperty("--pointer-x", `${x}%`);
      node.style.setProperty("--pointer-y", `${y}%`);
    };

    const handlePointerLeave = () => {
      node.style.setProperty("--pointer-x", "50%");
      node.style.setProperty("--pointer-y", "35%");
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  useEffect(() => {
    const node = backdropRef.current;
    if (!node) return;
    node.style.setProperty("--pulse-duration", `${pulseDuration}s`);
  }, [pulseDuration]);

  return (
    <div ref={backdropRef} className={`background-ripple-effect ${className}`}>
      <div className="background-ripple-effect__layer" />
      <div className="background-ripple-effect__layer background-ripple-effect__layer--alt" />
      <span className="background-ripple-effect__ring" />
      <span className="background-ripple-effect__ring" />
      <span className="background-ripple-effect__ring" />
    </div>
  );
}
