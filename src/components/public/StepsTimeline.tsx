"use client";

import { useEffect, useRef, useState } from "react";

type Step = { title: string; text: string };

/* One line icon per certification step (24×24, stroke = currentColor). */
const ICONS: React.ReactNode[] = [
  // application: document with a send arrow
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 14h6M12 11l3 3-3 3" />
  </>,
  // review: magnifier with a check
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
    <path d="m8.5 11 1.8 1.8 3.4-3.6" />
  </>,
  // samples and testing: flask
  <>
    <path d="M9 3h6M10 3v6.2L4.8 18.4A1.7 1.7 0 0 0 6.3 21h11.4a1.7 1.7 0 0 0 1.5-2.6L14 9.2V3" />
    <path d="M7.2 15h9.6" />
  </>,
  // production assessment: factory
  <>
    <path d="M3 21V10l5 3V10l5 3V10l5 3V5h3v16z" />
    <path d="M7 17h2M12 17h2M17 17h1" />
  </>,
  // certificate: rosette
  <>
    <circle cx="12" cy="9" r="5.5" />
    <path d="m9.6 9 1.6 1.6 3.2-3.2" />
    <path d="M8.5 13.5 7 21l5-2.5 5 2.5-1.5-7.5" />
  </>,
  // periodic assessment: circular arrows
  <>
    <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
    <path d="M4 3v5h5" />
    <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
    <path d="M20 21v-5h-5" />
  </>,
];

/**
 * Certification steps as an animated route: the rail fills as the block scrolls
 * through view, a glowing marker rides its tip, each step lights up with its icon
 * and its card rises in. With reduced motion everything is shown lit and still.
 */
export default function StepsTimeline({ steps }: { steps: Step[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(1);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimated(true);
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the block's top reaches 85% of the viewport, 1 when it reaches 25%
      const p = (vh * 0.85 - r.top) / (vh * 0.6);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    const onScroll = () => requestAnimationFrame(update);
    const first = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const last = steps.length - 1;
  // a step lights up the moment the rail reaches its node
  const lit = Math.floor(progress * last + 0.02);
  const moving = animated && progress > 0 && progress < 1;

  return (
    <div ref={ref} className="relative mt-10" style={{ "--p": progress } as React.CSSProperties}>
      {/* rail: vertical on phones, horizontal on wide screens */}
      <span
        aria-hidden="true"
        className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-line lg:left-[8.33%] lg:right-[8.33%] lg:top-[23px] lg:bottom-auto lg:h-0.5 lg:w-auto"
      />
      <span
        aria-hidden="true"
        className="absolute left-[23px] top-6 h-[calc((100%-3rem)*var(--p))] w-0.5 bg-gradient-to-b from-primary to-primary-bright lg:left-[8.33%] lg:top-[23px] lg:h-0.5 lg:w-[calc(83.34%*var(--p))] lg:bg-gradient-to-r"
      />
      {/* marker riding the tip of the filled rail */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-[24px] top-[calc(1.5rem+(100%-3rem)*var(--p))] z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-bright shadow-[0_0_0_5px_rgb(61_39_232/0.18),0_0_16px_4px_rgb(61_39_232/0.45)] transition-opacity duration-300 lg:left-[calc(8.33%+83.34%*var(--p))] lg:top-[24px] ${
          moving ? "opacity-100" : "opacity-0"
        }`}
      />

      <ol className="relative grid gap-6 lg:grid-cols-6 lg:gap-4">
        {steps.map((s, i) => {
          const on = i <= lit;
          const current = moving && i === lit;
          return (
            <li
              key={s.title}
              className="group relative flex gap-4 lg:flex-col lg:items-center lg:gap-4 lg:text-center"
            >
              <span
                className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-[2px] border-2 transition-all duration-500 ${
                  on
                    ? "border-primary bg-primary text-white shadow-[0_6px_18px_rgb(32_3_189/0.28)]"
                    : "border-line bg-paper text-ink-soft"
                } ${current ? "scale-110" : "scale-100"}`}
              >
                {current && (
                  <span aria-hidden="true" className="absolute -inset-1 rounded-[2px] border-2 border-primary/60 motion-safe:animate-ping" />
                )}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ICONS[i % ICONS.length]}
                </svg>
              </span>

              <div
                className={`flex-1 rounded-[2px] border bg-paper p-4 shadow-card transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-card-hover lg:w-full ${
                  on ? "translate-y-0 opacity-100" : "translate-y-3 opacity-45"
                } ${current ? "border-primary" : "border-line"}`}
                style={{ transitionDelay: animated && on ? "80ms" : "0ms" }}
              >
                <p
                  className={`text-xs font-semibold tracking-[0.14em] transition-colors duration-300 ${
                    on ? "text-primary" : "text-ink-soft"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className={`mt-1 font-bold leading-snug transition-colors duration-300 ${on ? "text-ink" : "text-ink-soft"}`}>
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
