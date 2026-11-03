import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { isLocalMediaUrl } from "@/lib/media-url";

export default function NewsCard({
  slug,
  title,
  summary,
  imageUrl,
  date,
  readMoreLabel,
  headingLevel = 3,
}: {
  slug: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  date: string;
  readMoreLabel: string;
  /** 2 on the blog index (cards sit right under the page h1), 3 inside a titled section. */
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <Link href={`/news/${slug}`} className="card card-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden bg-band">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            unoptimized={isLocalMediaUrl(imageUrl)}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="guilloche h-full w-full opacity-80" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <time className="text-xs font-medium text-ink-soft">{date}</time>
        <Heading className="mt-2 font-bold leading-snug text-ink group-hover:text-primary">{title}</Heading>
        {summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{summary}</p>}
        <span className="mt-auto pt-4 text-sm font-semibold text-primary">{readMoreLabel} →</span>
      </div>
    </Link>
  );
}
