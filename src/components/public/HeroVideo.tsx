"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Background footage for the home hero. Clips play in the given order and
 * cross-fade into each other; a single clip simply loops.
 */
export default function HeroVideo({ sources }: { sources: string[] }) {
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const video = videos.current[active];
    if (!video) return;
    video.currentTime = 0;
    // Autoplay can be refused (e.g. data saver); the shaded backdrop still reads fine.
    video.play().catch(() => {});
  }, [active]);

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
          onEnded={() => setActive((i + 1) % sources.length)}
        />
      ))}
    </>
  );
}
