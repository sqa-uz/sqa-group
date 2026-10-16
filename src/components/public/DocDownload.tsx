import Image from "next/image";

/** A download button for a document (PDF/Word). Server component — just an anchor. */
export default function DocDownload({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-2.5 rounded-card border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0 text-primary">
        <path d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 15v1.5A1.5 1.5 0 005.5 18h9a1.5 1.5 0 001.5-1.5V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {label}
    </a>
  );
}

/** A certificate preview card: image + caption + download link. */
export function CertificateCard({
  img,
  caption,
  href,
  downloadLabel,
}: {
  img: string;
  caption: string;
  href: string;
  downloadLabel: string;
}) {
  return (
    <figure className="card overflow-hidden">
      <a href={img} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative aspect-[3/4] bg-white">
          <Image src={img} alt={caption} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-contain p-3 transition-transform duration-300 hover:scale-[1.02]" />
        </div>
      </a>
      <figcaption className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <span className="text-xs font-bold tracking-wide text-ink-soft">{caption}</span>
        <a href={href} download className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 15v1.5A1.5 1.5 0 005.5 18h9a1.5 1.5 0 001.5-1.5V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {downloadLabel}
        </a>
      </figcaption>
    </figure>
  );
}
