"use client";

import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { cssNumber, cssTimeMs } from "@/lib/motion";

const SPINS = 1; // full turns of 0-9 before each reel lands

/**
 * transitions-dev "spinning counter": one slot-machine reel per digit. The
 * server renders the final number (so it reads correctly without JS); on
 * mount the reels drop to 0 and spin to the value once the figure scrolls
 * into view, with a vertical motion blur that decays as each reel settles.
 */
export default function SpinningCounter({ value, className = "" }: { value: number; className?: string }) {
  const digits = String(value).split("").map(Number);
  const root = useRef<HTMLSpanElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // Before paint: park every reel on 0 so the spin starts from the bottom.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.querySelectorAll<HTMLElement>(".t-reel-strip").forEach((strip) => {
      strip.style.transition = "none";
      strip.style.transform = "translateY(0)";
    });
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dur = cssTimeMs(el, "--reel-dur", 1400);
    const stagger = cssTimeMs(el, "--reel-stagger", 90);
    const maxBlur = cssNumber(el, "--reel-spin-blur", 3);
    let raf = 0;

    const spin = () => {
      const strips = [...el.querySelectorAll<HTMLElement>(".t-reel-strip")];
      const blurs = [...el.querySelectorAll<SVGFEGaussianBlurElement>("feGaussianBlur")];
      strips.forEach((strip, col) => {
        const cell = strip.firstElementChild?.getBoundingClientRect().height ?? 0;
        const target = SPINS * 10 + digits[col];
        strip.style.transition = `transform var(--reel-dur) var(--reel-ease) ${col * stagger}ms`;
        strip.style.transform = `translateY(${-target * cell}px)`;
      });
      // Decay each column's vertical blur from --reel-spin-blur to 0 over its own window.
      const start = performance.now();
      const tick = (now: number) => {
        let running = false;
        blurs.forEach((b, col) => {
          const t = Math.min(1, Math.max(0, (now - start - col * stagger) / dur));
          const y = maxBlur * (1 - t) * (t > 0 ? 1 : 0);
          b.setAttribute("stdDeviation", `0 ${y.toFixed(2)}`);
          if (t < 1) running = true;
          // Settled: drop the filter so the digit renders crisp again.
          else strips[col].style.filter = "none";
        });
        if (running) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        spin();
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
    // digits derive from value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={root} className={`stat-reel ${className}`}>
      <span className="sr-only">{value}</span>
      <span className="t-reel" aria-hidden="true">
        {digits.map((d, col) => (
          <span key={col} className="t-reel-col">
            <svg width="0" height="0" className="absolute" aria-hidden="true">
              <filter id={`${uid}-b${col}`} x="0" y="-50%" width="100%" height="200%">
                <feGaussianBlur stdDeviation="0 0" />
              </filter>
            </svg>
            {/* Server HTML lands on the final digit; JS resets to 0 before the spin. */}
            <span
              className="t-reel-strip"
              style={{ transform: `translateY(calc(var(--reel-cell) * ${-(SPINS * 10 + d)}))`, filter: `url(#${uid}-b${col})` }}
            >
              {Array.from({ length: (SPINS + 1) * 10 }, (_, i) => (
                <span key={i} className="t-reel-digit">
                  {i % 10}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
