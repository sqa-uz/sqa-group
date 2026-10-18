import Image from "next/image";
import { isLocalMediaUrl } from "@/lib/media-url";

export type PartnerItem = { id: string; name: string; logoUrl: string; websiteUrl: string | null };

function Row({ partners, direction }: { partners: PartnerItem[]; direction: "left" | "right" }) {
  // Track is duplicated so the keyframe translateX(-50%) loops seamlessly
  const track = [...partners, ...partners];
  return (
    <div className="marquee">
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
              tabIndex={i >= partners.length ? -1 : 0}
              className="flex items-center"
            >
              {tile}
            </a>
          ) : (
            <div key={`${p.id}-${i}`} className="flex items-center" aria-label={p.name}>
              {tile}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** One row of partner logos drifting left; pauses on hover, static grid under reduced motion. */
export default function PartnerMarquee({ partners }: { partners: PartnerItem[] }) {
  if (partners.length === 0) return null;
  // Densify: short partner lists would leave visible gaps in the loop
  let row = partners;
  while (row.length < 10) row = [...row, ...partners];
  return <Row partners={row} direction="left" />;
}
