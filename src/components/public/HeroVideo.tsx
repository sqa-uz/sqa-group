"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Background footage for the home hero. Clips play in the given order and
 * cross-fade into each other; a single clip simply loops. Footage that keeps
 * moving needs a pause control (WCAG 2.2.2), shown in the hero's corner.
 */
export default function HeroVideo({ sources }: { sources: string[] }) {
  const t = useTranslations("common");
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const video = videos.current[active];
    if (!video) return;
    if (paused) {
      video.pause();
      return;
    }
    // Autoplay can be refused (e.g. data saver); the shaded backdrop still reads fine.
    video.play().catch(() => {});
  }, [active, paused]);

  return (
    <>
      {sources.map((src, i) => (
        <video
          key={src}
          ref={(el) => {
            videos.current[i] = el;
          }}
          aria-hidden="true"
          className={`hero-video${i === active ? " is-active" : ""}`}
          src={src}
          muted
          playsInline
          loop={sources.length === 1}
          preload={i === 0 ? "auto" : "metadata"}
          onEnded={() => {
            const next = (i + 1) % sources.length;
            const v = videos.current[next];
            if (v) v.currentTime = 0;
            setActive(next);
          }}
        />
      ))}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={t(paused ? "playVideo" : "pauseVideo")}
        title={t(paused ? "playVideo" : "pauseVideo")}
        className="hero-video-toggle absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-card border border-white/40 bg-white/15 text-white backdrop-blur-sm transition-colors hover:border-white/70 hover:bg-white/25"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          {paused ? <path d="M3 1.5v11l9-5.5z" /> : <path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" />}
        </svg>
      </button>
    </>
  );
}
