"use client";

import { useEffect, useRef } from "react";

/** transitions-dev "success check": fades, rotates and bobs in while the tick strokes itself on. */
export default function SuccessCheck({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const check = ref.current;
    if (!check) return;
    check.setAttribute("data-state", "out");
    void check.offsetWidth; // force reflow so keyframes restart
    check.setAttribute("data-state", "in");
  }, []);

  return (
    <span ref={ref} className={`t-success-check ${className}`} data-state="out" aria-hidden="true">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" stroke="currentColor" strokeOpacity="0.4" />
        <path d="M11 18.5l4.5 4.5L25 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
