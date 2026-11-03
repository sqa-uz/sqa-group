"use client";

import { useEffect, useRef } from "react";

/**
 * transitions-dev "texts reveal": children marked .t-stagger-line--N rise in
 * one after another, blurred to sharp, once the block has mounted.
 */
export default function StaggerReveal({
  children,
  className = "",
  stagger,
}: {
  children: React.ReactNode;
  className?: string;
  /** Overrides --stagger-stagger, e.g. "80ms" for a slower hero rhythm. */
  stagger?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const block = ref.current;
    if (!block) return;
    block.classList.remove("is-hiding");
    block.classList.remove("is-shown");
    void block.offsetHeight;
    block.classList.add("is-shown");
  }, []);

  return (
    <div
      ref={ref}
      className={`t-stagger ${className}`}
      style={stagger ? ({ "--stagger-stagger": stagger } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
