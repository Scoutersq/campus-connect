import React, { useEffect, useRef, useState } from "react";
import "./showcase-tablet.css";

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function ShowcaseTablet({
  src,
  alt = "Campus dashboard preview",
  className = "",
}) {
  const containerRef = useRef(null);
  const [targetProgress, setTargetProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const animatedProgressRef = useRef(0);
  const animationFrameRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const host = containerRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height + viewport;
      const raw = (viewport - rect.top) / total;
      setTargetProgress((prev) => {
        const next = clamp(raw);
        return Math.abs(next - prev) > 0.002 ? next : prev;
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

  useEffect(() => {
      const animate = () => {
        const current = animatedProgressRef.current;
        const target = targetProgress;
        const next = current + (target - current) * 0.2;

      if (Math.abs(next - target) < 0.0005) {
        animatedProgressRef.current = target;
        setDisplayProgress(target);
        animationFrameRef.current = 0;
        return;
      }

      animatedProgressRef.current = next;
      setDisplayProgress(next);
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
    };
  }, [targetProgress]);

  const straightProgress = clamp((displayProgress - 0.08) / 0.55);
  const eased = straightProgress < 1 ? 1 - Math.pow(1 - straightProgress, 2.2) : 1;
  const tiltFactor = 1 - eased;

  const transform = `perspective(1600px) rotateX(${16 * tiltFactor}deg) translateY(${clamp(
    tiltFactor * 32,
    0,
    32
  )}px) scale(${0.88 + eased * 0.12})`;

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
                <img src={src} alt={alt} className="showcase-tablet__image" loading="lazy" />
              )}
              <div className="showcase-tablet__glow" style={glowStyle} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
