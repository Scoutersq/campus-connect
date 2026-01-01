"use client";

import React, { useEffect, useRef, useState } from "react";
import "./background-ripple-effect.css";

export function BackgroundRippleEffect({ className = "", pulseDuration = 16 }) {
  const backdropRef = useRef(null);
  const pointerFrameRef = useRef(0);
  const pointerCoordsRef = useRef({ x: 50, y: 35 });
  const viewportSizeRef = useRef({ width: 1, height: 1 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 'ontouchstart' in window;
      setIsMobile(mobile);
      return mobile;
    };
    
    const mobile = checkMobile();
    const node = backdropRef.current;
    if (!node) return;

    // Skip pointer tracking on mobile for performance
    if (mobile) {
      node.style.setProperty("--pointer-x", "50%");
      node.style.setProperty("--pointer-y", "35%");
      return;
    }

    const lastApplied = { x: 50, y: 35 };

    const applyPointerPosition = (x, y) => {
      if (!node) return;
      const deltaX = Math.abs(x - lastApplied.x);
      const deltaY = Math.abs(y - lastApplied.y);
      // Increase threshold to reduce updates
      if (deltaX < 0.5 && deltaY < 0.5) return;
      lastApplied.x = x;
      lastApplied.y = y;
      node.style.setProperty("--pointer-x", `${x}%`);
      node.style.setProperty("--pointer-y", `${y}%`);
    };

    const resolvePointer = () => {
      const { width, height } = viewportSizeRef.current;
      const pointer = pointerCoordsRef.current;
      const normalizedX = width > 0 ? (pointer.x / width) * 100 : 50;
      const normalizedY = height > 0 ? (pointer.y / height) * 100 : 35;
      applyPointerPosition(normalizedX, normalizedY);
      pointerFrameRef.current = 0;
    };

    const scheduleResolve = () => {
      if (pointerFrameRef.current) return;
      pointerFrameRef.current = window.requestAnimationFrame(resolvePointer);
    };

    // Throttle pointer move events
    let lastMoveTime = 0;
    const handlePointerMove = (event) => {
      const now = Date.now();
      if (now - lastMoveTime < 50) return; // Throttle to 20fps max
      lastMoveTime = now;
      pointerCoordsRef.current = { x: event.clientX, y: event.clientY };
      scheduleResolve();
    };

    const handlePointerLeave = () => {
      pointerCoordsRef.current = { x: 0.5 * viewportSizeRef.current.width, y: 0.35 * viewportSizeRef.current.height };
      scheduleResolve();
    };

    let resizeTimeout;
    const updateViewportSize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        viewportSizeRef.current = {
          width: window.innerWidth || document.documentElement.clientWidth || 1,
          height: window.innerHeight || document.documentElement.clientHeight || 1,
        };
        scheduleResolve();
      }, 100);
    };

    viewportSizeRef.current = {
      width: window.innerWidth || document.documentElement.clientWidth || 1,
      height: window.innerHeight || document.documentElement.clientHeight || 1,
    };
    pointerCoordsRef.current = {
      x: viewportSizeRef.current.width * 0.5,
      y: viewportSizeRef.current.height * 0.35,
    };
    scheduleResolve();

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", updateViewportSize);

    return () => {
      if (pointerFrameRef.current) {
        window.cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = 0;
      }
      clearTimeout(resizeTimeout);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", updateViewportSize);
    };
  }, []);

  useEffect(() => {
    const node = backdropRef.current;
    if (!node) return;
    node.style.setProperty("--pulse-duration", `${pulseDuration}s`);
  }, [pulseDuration]);

  // Render fewer rings on mobile
  return (
    <div ref={backdropRef} className={`background-ripple-effect ${className}`}>
      <div className="background-ripple-effect__layer" />
      {!isMobile && <div className="background-ripple-effect__layer background-ripple-effect__layer--alt" />}
      <span className="background-ripple-effect__ring" />
      {!isMobile && <span className="background-ripple-effect__ring" />}
      {!isMobile && <span className="background-ripple-effect__ring" />}
    </div>
  );
}
