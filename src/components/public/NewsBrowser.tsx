"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { isLocalMediaUrl } from "@/lib/media-url";
import LearnChevron from "./LearnChevron";
import NewsCard from "./NewsCard";

export type NewsItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  date: string;
  year: number | null;
  meta: string;
  featured: boolean;
};

type Labels = { search: string; all: string; featured: string; readMore: string; nothingFound: string };

/** Blog index: a large lead story, then a searchable grid with year filters. */
export default function NewsBrowser({ items, labels }: { items: NewsItem[]; labels: Labels }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<number | null>(null);

  const lead = items.find((n) => n.featured) ?? items[0];
  const years = useMemo(
    () => [...new Set(items.map((n) => n.year).filter((y): y is number => y !== null))].sort((a, b) => b - a),
    [items]
  );
  const filtering = query.trim() !== "" || year !== null;
  const q = query.trim().toLowerCase();
  const list = items.filter(
    (n) =>
      (filtering || n.id !== lead?.id) &&
      (year === null || n.year === year) &&
      (!q || n.title.toLowerCase().includes(q) || (n.summary ?? "").toLowerCase().includes(q))
  );

  return (
    <>
      {lead && !filtering && (
        <Link href={`/news/${lead.slug}`} className="t-learn card card-hover group mt-10 grid overflow-hidden lg:grid-cols-[1.25fr_1fr]">
          <div className="relative aspect-[16/9] overflow-hidden bg-band lg:aspect-auto lg:min-h-[340px]">
            {lead.imageUrl ? (
              <Image
                src={lead.imageUrl}
                alt=""
                fill
                priority
                unoptimized={isLocalMediaUrl(lead.imageUrl)}
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="guilloche h-full w-full" />
            )}
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-9">
            <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-ink-soft">
              {lead.featured && (
                <span className="rounded-[2px] bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">{labels.featured}</span>
              )}
              <span>{lead.date}</span>
              <span aria-hidden="true">·</span>
              <span>{lead.meta}</span>
            </p>
            <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-ink group-hover:text-primary sm:text-3xl">{lead.title}</h2>
            {lead.summary && <p className="mt-3 line-clamp-4 leading-relaxed text-ink-soft">{lead.summary}</p>}
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {labels.readMore} <LearnChevron />
            </span>
          </div>
        </Link>
      )}

      {items.length > 3 && (
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">{labels.search}</span>
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={labels.search}
              className="w-full rounded-card border border-line bg-paper py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors focus:border-primary"
            />
          </label>
          {years.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group">
              {[null, ...years].map((y) => (
                <button
                  key={y ?? "all"}
                  type="button"
                  aria-pressed={year === y}
                  onClick={() => setYear(y)}
                  className={`rounded-card border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    year === y ? "border-primary bg-primary text-white" : "border-line text-ink-soft hover:border-primary hover:text-primary"
                  }`}
                >
                  {y ?? labels.all}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {list.length > 0 ? (
        <div className={`grid gap-5 md:grid-cols-2 lg:grid-cols-3 ${items.length > 3 ? "mt-6" : "mt-10"}`}>
          {list.map((n) => (
            <NewsCard key={n.id} slug={n.slug} title={n.title} summary={n.summary} imageUrl={n.imageUrl} date={n.date} meta={n.meta} readMoreLabel={labels.readMore} />
          ))}
        </div>
      ) : (
        filtering && <p className="mt-8 text-ink-soft">{labels.nothingFound}</p>
      )}
    </>
  );
}
