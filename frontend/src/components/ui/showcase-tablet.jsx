import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./showcase-tablet.css";

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function ShowcaseTablet({
  src,
  alt = "Campus dashboard preview",
  className = "",
  slides = [],
  autoAdvanceMs = 6500,
}) {
  const containerRef = useRef(null);
  const [targetProgress, setTargetProgress] = useState(0);
  const animatedProgressRef = useRef(0);
  const animationFrameRef = useRef(0);
  const deviceRef = useRef(null);
  const glowRef = useRef(null);
  const perspectiveRef = useRef(1600);
  const autoAdvanceRef = useRef(0);

  const computedSlides = useMemo(() => {
    if (Array.isArray(slides) && slides.length > 0) {
      return slides
        .map((entry) =>
          typeof entry === "string"
            ? { src: entry, alt }
            : { src: entry?.src, alt: entry?.alt ?? alt }
        )
        .filter((entry) => Boolean(entry.src))
        .slice(0, 10);
    }

    return src ? [{ src, alt }] : [];
  }, [slides, src, alt]);

  const slideCount = computedSlides.length;
  const [activeSlide, setActiveSlide] = useState(0);

  const stopAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current && typeof window !== "undefined") {
      window.clearInterval(autoAdvanceRef.current);
      autoAdvanceRef.current = 0;
    }
  }, []);

  const startAutoAdvance = useCallback(() => {
    if (slideCount <= 1 || typeof window === "undefined") return;
    stopAutoAdvance();
    autoAdvanceRef.current = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slideCount);
    }, Math.max(4000, autoAdvanceMs));
  }, [slideCount, autoAdvanceMs, stopAutoAdvance]);

  useEffect(() => {
    if (activeSlide >= slideCount) {
      setActiveSlide(0);
    }
  }, [activeSlide, slideCount]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    startAutoAdvance();
    return () => {
      stopAutoAdvance();
    };
  }, [startAutoAdvance, stopAutoAdvance]);

  const applyProgressStyles = useCallback((progress) => {
    const straightProgress = clamp((progress - 0.08) / 0.55);
    const eased = straightProgress < 1 ? 1 - Math.pow(1 - straightProgress, 2.2) : 1;
    const tiltFactor = 1 - eased;
    const translateY = clamp(tiltFactor * 32, 0, 32);
    const scale = 0.88 + eased * 0.12;
    const perspective = perspectiveRef.current;
    const deviceNode = deviceRef.current;
    const glowNode = glowRef.current;

    if (deviceNode) {
      deviceNode.style.transform = `perspective(${perspective}px) rotateX(${16 * tiltFactor}deg) translateY(${translateY}px) scale(${scale})`;
      deviceNode.style.opacity = `${0.75 + eased * 0.25}`;
    }

    if (glowNode) {
      glowNode.style.opacity = `${0.2 + eased * 0.35}`;
    }
  }, []);

  const updatePerspective = useCallback(() => {
    if (typeof window === "undefined") return;
    const viewport = window.innerWidth || document.documentElement?.clientWidth || 1024;
    let nextPerspective = 1600;

    if (viewport < 480) {
      nextPerspective = 900;
    } else if (viewport < 768) {
      nextPerspective = 1100;
    } else if (viewport < 1024) {
      nextPerspective = 1400;
    }

    perspectiveRef.current = nextPerspective;
    applyProgressStyles(animatedProgressRef.current);
  }, [applyProgressStyles]);

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
        applyProgressStyles(target);
        animationFrameRef.current = 0;
        return;
      }

      animatedProgressRef.current = next;
      applyProgressStyles(next);
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
  }, [targetProgress, applyProgressStyles]);

  useEffect(() => {
    applyProgressStyles(animatedProgressRef.current);
  }, [applyProgressStyles]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    updatePerspective();
    window.addEventListener("resize", updatePerspective);
    window.addEventListener("orientationchange", updatePerspective);

    return () => {
      window.removeEventListener("resize", updatePerspective);
      window.removeEventListener("orientationchange", updatePerspective);
    };
  }, [updatePerspective]);

  const handleSelect = useCallback(
    (nextIndex) => {
      if (!Number.isInteger(nextIndex) || nextIndex === activeSlide || nextIndex < 0 || nextIndex >= slideCount) {
        return;
      }
      stopAutoAdvance();
      setActiveSlide(nextIndex);
      startAutoAdvance();
    },
    [activeSlide, slideCount, startAutoAdvance, stopAutoAdvance]
  );

  const handleStep = useCallback(
    (direction) => {
      if (slideCount <= 1) return;
      const offset = direction === "prev" ? -1 : 1;
      const nextIndex = (activeSlide + offset + slideCount) % slideCount;
      handleSelect(nextIndex);
    },
    [activeSlide, slideCount, handleSelect]
  );

  return (
    <section ref={containerRef} className={`showcase-tablet ${className}`}>
      <div ref={deviceRef} className="showcase-tablet__device">
        <div className="showcase-tablet__frame">
          <div className="showcase-tablet__bezel">
            <span className="showcase-tablet__camera" aria-hidden="true" />
            <div className="showcase-tablet__screen">
              <div className="showcase-tablet__slides">
                <div
                  className="showcase-tablet__slides-track"
                  style={{ transform: `translate3d(-${activeSlide * 100}%, 0, 0)` }}
                >
                {computedSlides.map((slide, index) => (
                  <img
                    key={slide.src}
                    src={slide.src}
                    alt={slide.alt}
                    loading={index === 0 ? "eager" : "lazy"}
                    className="showcase-tablet__slide"
                  />
                ))}
                </div>
              </div>
              <div ref={glowRef} className="showcase-tablet__glow" aria-hidden="true" />
              {slideCount > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous preview"
                    className="showcase-tablet__nav-button showcase-tablet__nav-button--left"
                    onClick={() => handleStep("prev")}
                  >
                    <FaChevronLeft aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next preview"
                    className="showcase-tablet__nav-button showcase-tablet__nav-button--right"
                    onClick={() => handleStep("next")}
                  >
                    <FaChevronRight aria-hidden="true" />
                  </button>
                  <div className="showcase-tablet__dots" role="tablist" aria-label="Dashboard preview slides">
                    {computedSlides.map((slide, index) => (
                      <button
                        key={`${slide.src}-${index}`}
                        type="button"
                        role="tab"
                        aria-label={`View slide ${index + 1}`}
                        aria-selected={index === activeSlide}
                        className={`showcase-tablet__dot${index === activeSlide ? " showcase-tablet__dot--active" : ""}`}
                        onClick={() => handleSelect(index)}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
