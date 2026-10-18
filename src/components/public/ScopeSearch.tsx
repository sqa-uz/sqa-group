"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ITEMS, normalize, search, formatCode, type ScopeItem } from "@/lib/scopeSearch";

const CODE_PREVIEW = 6;

function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  if (!tokens.length) return <>{text}</>;
  const norm = normalize(text);
  const marks: [number, number][] = [];
  for (const t of tokens) {
    let i = norm.indexOf(t);
    while (i !== -1) {
      marks.push([i, i + t.length]);
      i = norm.indexOf(t, i + t.length);
    }
  }
  if (!marks.length) return <>{text}</>;
  marks.sort((a, b) => a[0] - b[0]);
  const parts: React.ReactNode[] = [];
  let pos = 0;
  for (const [a, b] of marks) {
    if (b <= pos) continue;
    const start = Math.max(a, pos);
    if (start > pos) parts.push(text.slice(pos, start));
    parts.push(
      <mark key={start} className="rounded-none bg-primary/12 px-0.5 text-primary">
        {text.slice(start, b)}
      </mark>,
    );
    pos = b;
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return <>{parts}</>;
}

function ItemCard({ item, prefix, tokens }: { item: ScopeItem; prefix: string; tokens: string[] }) {
  const t = useTranslations("products");
  const [open, setOpen] = useState(false);
  const matched = prefix ? item.codes.filter((c) => c.startsWith(prefix)) : [];
  const rest = prefix ? item.codes.filter((c) => !c.startsWith(prefix)) : item.codes;
  const ordered = [...matched, ...rest];
  const shown = open ? ordered : ordered.slice(0, Math.max(CODE_PREVIEW, matched.length));
  const hidden = ordered.length - shown.length;

  return (
    <li className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="max-w-3xl text-[15px] font-semibold leading-snug text-ink">
          <Highlight text={item.name} tokens={tokens} />
        </h3>
        <span
          className="shrink-0 rounded-none bg-band px-2 py-0.5 text-[11px] font-semibold tracking-wide text-ink-soft"
          title={t(item.s === "502" ? "scheme502Full" : "scheme318Full")}
        >
          {t(item.s === "502" ? "scheme502" : "scheme318")}
        </span>
      </div>

      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-[9.5rem_1fr]">
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft sm:pt-1">{t("codesLabel")}</dt>
        <dd>
          <ul className="flex flex-wrap gap-1.5">
            {shown.map((c) => {
              const hit = prefix && c.startsWith(prefix);
              return (
                <li
                  key={c}
                  className={`rounded-none border px-2 py-0.5 font-mono text-[13px] tabular-nums ${
                    hit ? "border-primary bg-primary text-white" : "border-line bg-paper text-ink"
                  }`}
                >
                  {formatCode(c)}
                </li>
              );
            })}
            {hidden > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="rounded-none px-2 py-0.5 text-[13px] font-semibold text-primary hover:underline"
                >
                  {t("moreCodes", { count: hidden })}
                </button>
              </li>
            )}
          </ul>
        </dd>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft sm:pt-0.5">{t("normsLabel")}</dt>
        <dd className="text-ink-soft">
          <Highlight text={item.norms.join(" · ")} tokens={tokens} />
        </dd>
      </dl>
    </li>
  );
}

export default function ScopeSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const t = useTranslations("products");
  // Deep links: /what-we-certify?q=3917 (used by the search box on the home page)
  const [query, setQuery] = useState(initialQuery);

  // Keep the address shareable as the visitor types.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set("q", query.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }, [query]);

  const result = useMemo(() => search(query), [query]);
  const prefix = result.mode === "code" ? result.prefix : "";
  const tokens = result.mode === "text" ? result.tokens : [];

  return (
    <div>
      <div className="sticky top-16 z-10 -mx-4 bg-paper/90 px-4 py-4 backdrop-blur">
        <label htmlFor="scope-q" className="sr-only">
          {t("searchLabel")}
        </label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            id="scope-q"
            type="search"
            inputMode="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-14 w-full rounded-card border border-line bg-paper pl-12 pr-4 text-base text-ink shadow-card outline-none transition-colors placeholder:text-ink-soft/70 focus:border-primary"
          />
        </div>
        <p className="mt-2 text-sm text-ink-soft" aria-live="polite">
          {result.mode === "all" && t("countAll", { count: ITEMS.length })}
          {result.mode === "text" && t("countFound", { count: result.items.length, total: ITEMS.length })}
          {result.mode === "code" &&
            (result.items.length === 0
              ? t("codeNone", { code: result.digits })
              : result.exact
                ? t("codeFound", { count: result.items.length, code: result.digits })
                : t("codeNear", { count: result.items.length, digits: result.prefix.length, prefix: result.prefix }))}
        </p>
      </div>

      {result.items.length > 0 ? (
        <ul className="mt-2 space-y-3">
          {result.items.map((item) => (
            <ItemCard key={item.n} item={item} prefix={prefix} tokens={tokens} />
          ))}
        </ul>
      ) : (
        <div className="card mt-2 p-6">
          <p className="font-semibold text-ink">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-ink-soft">{t("emptyText")}</p>
          <Link href="/contacts" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            {t("contactUs")} →
          </Link>
        </div>
      )}
    </div>
  );
}
