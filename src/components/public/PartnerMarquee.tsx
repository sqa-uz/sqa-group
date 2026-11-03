"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { isLocalMediaUrl } from "@/lib/media-url";

export type PartnerItem = { id: string; name: string; logoUrl: string; websiteUrl: string | null };

function Row({
  partners,
  unique,
  direction,
  paused,
}: {
  partners: PartnerItem[];
  unique: number;
  direction: "left" | "right";
  paused: boolean;
}) {
  // Track is duplicated so the keyframe translateX(-50%) loops seamlessly
  const track = [...partners, ...partners];
  return (
    <div className="marquee" data-paused={paused}>
      <div className={`marquee-track marquee-track--${direction}`}>
        {track.map((p, i) => {
          const tile = (
            <div className="partner-logo flex h-20 w-44 items-center justify-center px-4">
              <Image
                src={p.logoUrl}
                alt={p.name}
                width={192}
                height={96}
                unoptimized={isLocalMediaUrl(p.logoUrl)}
                className="max-h-14 w-auto max-w-full object-contain"
              />
            </div>
          );
          return p.websiteUrl ? (
            <a
              key={`${p.id}-${i}`}
              href={p.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={p.name}
              // Each partner is announced and focusable once; the repeats only fill the loop.
              tabIndex={i >= unique ? -1 : 0}
              aria-hidden={i >= unique ? true : undefined}
              className="flex items-center"
            >
              {tile}
            </a>
          ) : (
            <div key={`${p.id}-${i}`} className="flex items-center" aria-hidden={i >= unique ? true : undefined}>
              {tile}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One row of partner logos drifting left; pauses on hover, keyboard focus or the
 * pause button (WCAG 2.2.2), and becomes a static grid under reduced motion.
 */
export default function PartnerMarquee({ partners }: { partners: PartnerItem[] }) {
  const t = useTranslations("common");
  const [paused, setPaused] = useState(false);
  if (partners.length === 0) return null;
  // Densify: short partner lists would leave visible gaps in the loop
  let row = partners;
  while (row.length < 10) row = [...row, ...partners];
  return (
    <div>
      <Row partners={row} unique={partners.length} direction="left" paused={paused} />
      <div className="marquee-toggle mt-4 flex justify-center">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="inline-flex min-h-8 items-center gap-2 rounded-card border border-line px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary"
        >
          <svg width="10" height="10" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M3 1.5v11l9-5.5z" /> : <path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" />}
          </svg>
          {t(paused ? "playLogos" : "pauseLogos")}
        </button>
      </div>
    </div>
  );
}
