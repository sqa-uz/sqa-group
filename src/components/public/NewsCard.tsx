import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { isLocalMediaUrl } from "@/lib/media-url";
import LearnChevron from "./LearnChevron";

export default function NewsCard({
  slug,
  title,
  summary,
  imageUrl,
  date,
  readMoreLabel,
}: {
  slug: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  date: string;
  readMoreLabel: string;
}) {
  return (
    <Link href={`/news/${slug}`} className="t-learn card card-hover group flex flex-col overflow-hidden">
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
        <h3 className="mt-2 font-bold leading-snug text-ink group-hover:text-primary">{title}</h3>
        {summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{summary}</p>}
        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary">
          {readMoreLabel} <LearnChevron />
        </span>
      </div>
    </Link>
  );
}
