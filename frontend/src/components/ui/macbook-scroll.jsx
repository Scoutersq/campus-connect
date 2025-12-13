import React, { useEffect, useRef, useState } from "react";
import "./macbook-scroll.css";

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function MacbookScroll({
  title,
  badge,
  src,
  alt = "Campus dashboard preview",
  showGradient = true,
  className = "",
}) {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateProgress = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height + viewport;
      const raw = (viewport - rect.top) / total;
      setProgress((prev) => {
        const next = clamp(raw);
        return Math.abs(next - prev) > 0.005 ? next : prev;
      });
    };

    let frameId = 0;
    const onScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateProgress();
      });
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const emerge = clamp((progress - 0.08) / 0.55);
  const exit = clamp((progress - 0.72) / 0.2);
  const lift = 32 - emerge * 70 + exit * 34;
  const scale = 0.82 + emerge * 0.28 - exit * 0.18;
  let opacity = clamp(emerge * 1.1, 0, 1);
  if (exit > 0) {
    opacity = clamp(1 - exit * 1.3, 0, 1);
  }
  const shadowOpacity = clamp(emerge * 0.38 - exit * 0.4, 0, 0.4);

  const imageStyle = {
    transform: `translate3d(-50%, ${lift}%, 0) scale(${scale})`,
    opacity,
  };

  const shadowStyle = {
    opacity: shadowOpacity,
  };

  return (
    <section ref={containerRef} className={`macbook-scroll ${className}`}>
      {(badge || title) && (
        <div className="macbook-scroll__header">
          {badge && <div className="macbook-scroll__badge">{badge}</div>}
          {title && <div className="macbook-scroll__title">{title}</div>}
        </div>
      )}
      <div className="macbook-scroll__stage">
        <div className="macbook-scroll__device">
          <div className="macbook-scroll__lid">
            {showGradient && <div className="macbook-scroll__screen-gradient" />}
            <div className="macbook-scroll__bezel" aria-hidden="true" />
            <div className="macbook-scroll__notch" aria-hidden="true" />
          </div>
          <div className="macbook-scroll__hinge" />
          <div className="macbook-scroll__body">
            <div className="macbook-scroll__body-inner">
              <div className="macbook-scroll__speakers" aria-hidden="true">
                <div className="macbook-scroll__speaker macbook-scroll__speaker--left" />
                <div className="macbook-scroll__speaker macbook-scroll__speaker--right" />
              </div>
              <div className="macbook-scroll__keyboard">
                <div className="macbook-scroll__keys" />
              </div>
              <div className="macbook-scroll__trackpad" />
              <div className="macbook-scroll__sticker" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className="macbook-scroll__image-shadow" style={shadowStyle} />
        {src && (
          <img
            src={src}
            alt={alt}
            className="macbook-scroll__image"
            style={imageStyle}
            loading="lazy"
          />
        )}
      </div>
    </section>
  );
}
