import React, { useEffect, useRef, useState } from "react";
import "./showcase-tablet.css";

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function ShowcaseTablet({
  src,
  alt = "Campus dashboard preview",
  className = "",
}) {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height + viewport;
      const raw = (viewport - rect.top) / total;
      setProgress((prev) => {
        const next = clamp(raw);
        return Math.abs(next - prev) > 0.003 ? next : prev;
      });
    };

    let frameId = 0;
    const schedule = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const straightProgress = clamp((progress - 0.08) / 0.55);
  const eased = straightProgress < 1 ? 1 - Math.pow(1 - straightProgress, 3) : 1;
  const tiltFactor = 1 - eased;

  const transform = `perspective(1600px) rotateX(${12 * tiltFactor}deg) rotateY(${-
    10 * tiltFactor
  }deg) translateY(${clamp(tiltFactor * 18, 0, 18)}px) scale(${0.9 + eased * 0.1})`;
  const deviceStyle = {
    transform,
    opacity: 0.75 + eased * 0.25,
  };

  const glowStyle = {
    opacity: 0.2 + eased * 0.35,
  };

  return (
    <section ref={containerRef} className={`showcase-tablet ${className}`}>
      <div className="showcase-tablet__device" style={deviceStyle}>
        <div className="showcase-tablet__frame">
          <div className="showcase-tablet__bezel">
            <span className="showcase-tablet__camera" aria-hidden="true" />
            <div className="showcase-tablet__screen">
              {src && (
                <img
                  src={src}
                  alt={alt}
                  className="showcase-tablet__image"
                  loading="lazy"
                />
              )}
              <div className="showcase-tablet__glow" style={glowStyle} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
