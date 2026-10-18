"use client";

import { useEffect, useRef, useState } from "react";

type Step = { title: string; text: string };

/** Certification steps on one line; the line fills and the steps light up as the block scrolls through view. */
export default function StepsTimeline({ steps }: { steps: Step[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the block's top reaches 85% of the viewport, 1 when it reaches 35%
      const p = (vh * 0.85 - r.top) / (vh * 0.5);
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

  const lit = Math.round(progress * (steps.length - 1));

  return (
    <div ref={ref} className="relative mt-10">
      {/* rail: vertical on phones, horizontal on wide screens */}
      <span aria-hidden="true" className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-line lg:left-[8.33%] lg:right-[8.33%] lg:top-[19px] lg:bottom-auto lg:h-0.5 lg:w-auto" />
      <span
        aria-hidden="true"
        className="absolute left-[19px] top-2 h-[calc((100%-1rem)*var(--p))] w-0.5 bg-primary transition-[height,width] duration-300 lg:left-[8.33%] lg:top-[19px] lg:h-0.5 lg:w-[calc(83.34%*var(--p))]"
        style={{ "--p": progress } as React.CSSProperties}
      />
      <ol className="grid gap-8 lg:grid-cols-6 lg:gap-4">
      {steps.map((s, i) => {
        const on = i <= lit;
        return (
          <li key={s.title} className="relative flex gap-4 lg:flex-col lg:items-center lg:gap-3 lg:text-center">
            <span
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border-2 text-sm font-bold transition-colors duration-300 ${
                on ? "border-primary bg-primary text-white" : "border-line bg-paper text-ink-soft"
              }`}
            >
              {i + 1}
            </span>
            <div>
              <h3 className={`font-bold transition-colors duration-300 ${on ? "text-ink" : "text-ink-soft"}`}>{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.text}</p>
            </div>
          </li>
        );
      })}
      </ol>
    </div>
  );
}
