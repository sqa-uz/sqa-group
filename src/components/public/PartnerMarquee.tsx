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
            <div className="flex h-24 w-44 items-center justify-center rounded-[2px] border border-line bg-white px-7 shadow-[0_1px_3px_rgba(16,21,58,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_28px_rgba(16,21,58,0.12)]">
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

/** Two logo rows moving in opposite directions; pauses on hover, static grid under reduced motion. */
export default function PartnerMarquee({ partners }: { partners: PartnerItem[] }) {
  if (partners.length === 0) return null;
  const half = Math.ceil(partners.length / 2);
  let rowA = partners.slice(0, half);
  let rowB = partners.length > 1 ? partners.slice(half) : partners;
  // Densify: short partner lists would leave visible gaps in the loop
  const densify = (row: PartnerItem[]) => {
    let out = row;
    while (out.length < 8) out = [...out, ...row];
    return out;
  };
  rowA = densify(rowA.length ? rowA : partners);
  rowB = densify(rowB.length ? rowB : partners);

  return (
    <div className="space-y-2">
      <Row partners={rowA} direction="left" />
      <Row partners={rowB} direction="right" />
    </div>
  );
}
