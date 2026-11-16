import Image from "next/image";
import { guardPage } from "@/lib/pageSettings";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { isLocalMediaUrl } from "@/lib/media-url";
import { articleHeadings, parseArticle, readingMinutes } from "@/lib/article";
import ArticleBody from "@/components/public/ArticleBody";
import { ArticleToc, ReadingProgress, ShareButtons } from "@/components/public/ArticleTools";
import NewsCard from "@/components/public/NewsCard";
import Reveal from "@/components/public/Reveal";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const article = await prisma.news.findUnique({
    where: { slug },
    include: { translations: { where: { locale } } },
  });
  const tr = article?.translations[0];
  return {
    title: tr?.title ?? "Blog",
    description: tr?.summary ?? undefined,
    openGraph: tr
      ? {
          type: "article",
          title: tr.title,
          description: tr.summary ?? undefined,
          publishedTime: article?.publishedAt?.toISOString(),
          images: article?.imageUrl ? [article.imageUrl] : undefined,
        }
      : undefined,
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  await guardPage("news");
  const t = await getTranslations("news");
  const tc = await getTranslations("common");

  const article = await prisma.news.findUnique({
    where: { slug },
    include: { translations: { where: { locale } } },
  });
  if (!article || article.status !== "published" || !article.translations[0]) notFound();
  const tr = article.translations[0];

  const blocks = parseArticle(tr.body);
  const headings = articleHeadings(blocks).filter((h) => h.level === 2 || h.level === 3);
  const minutes = readingMinutes(tr.body);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sqa.uz";
  const url = `${base}/${locale}/news/${article.slug}`;

  const dateFmt = new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const publishedFilter = { status: "published", translations: { some: { locale } } };
  const [older, newer, more] = await Promise.all([
    article.publishedAt
      ? prisma.news.findFirst({
          where: { ...publishedFilter, publishedAt: { lt: article.publishedAt } },
          orderBy: { publishedAt: "desc" },
          include: { translations: { where: { locale } } },
        })
      : null,
    article.publishedAt
      ? prisma.news.findFirst({
          where: { ...publishedFilter, publishedAt: { gt: article.publishedAt } },
          orderBy: { publishedAt: "asc" },
          include: { translations: { where: { locale } } },
        })
      : null,
    prisma.news.findMany({
      where: { ...publishedFilter, NOT: { id: article.id } },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: { translations: { where: { locale } } },
    }),
  ]);

  const share = (
    <ShareButtons url={url} title={tr.title} label={t("share")} copyLabel={t("copyLink")} copiedLabel={t("linkCopied")} />
  );

  return (
    <article className="mx-auto max-w-[1200px] px-4 py-14">
      <ReadingProgress targetId="article-content" />
      <Reveal>
        <div className="mx-auto max-w-3xl">
          <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <span aria-hidden="true">←</span> {t("allPosts")}
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-ink-soft">
            {article.featured && (
              <span className="rounded-[2px] bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">{t("featured")}</span>
            )}
            {article.publishedAt && <time dateTime={article.publishedAt.toISOString()}>{dateFmt.format(article.publishedAt)}</time>}
            <span aria-hidden="true">·</span>
            <span>{t("minRead", { n: minutes })}</span>
          </div>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-[2.6rem]">{tr.title}</h1>
          {tr.summary && <p className="mt-4 text-lg leading-relaxed text-ink-soft sm:text-xl">{tr.summary}</p>}
        </div>
      </Reveal>

      {article.imageUrl && (
        <Reveal delay={80}>
          <figure className="card mx-auto mt-9 max-w-5xl overflow-hidden">
            <Image src={article.imageUrl} alt="" width={1600} height={900} sizes="(max-width: 1100px) 100vw, 1024px" unoptimized={isLocalMediaUrl(article.imageUrl)} className="max-h-[560px] w-full object-cover" priority />
          </figure>
        </Reveal>
      )}

      <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div id="article-content" className="min-w-0">
          {headings.length >= 2 && (
            <details className="mb-8 rounded-card border border-line bg-band px-5 py-4 lg:hidden">
              <summary className="cursor-pointer text-sm font-bold text-ink">{t("contents")}</summary>
              <ul className="mt-3 space-y-1.5">
                {headings.map((h) => (
                  <li key={h.id} className={h.level === 3 ? "pl-4" : ""}>
                    <a href={`#${h.id}`} className="text-sm text-ink-soft hover:text-primary">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <ArticleBody blocks={blocks} className="max-w-[720px]" />
          <div className="mt-12 border-t border-line pt-6 lg:hidden">{share}</div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-32 space-y-8">
            {headings.length >= 2 && <ArticleToc title={t("contents")} headings={headings} />}
            {share}
          </div>
        </aside>
      </div>

      {(older || newer) && (
        <nav aria-label={t("morePosts")} className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2">
          {[
            { item: older, label: t("previous"), align: "" },
            { item: newer, label: t("next"), align: "sm:text-right sm:col-start-2" },
          ].map(({ item, label, align }) =>
            item?.translations[0] ? (
              <Link key={item.id} href={`/news/${item.slug}`} className={`card card-hover group block p-5 ${align}`}>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">{label}</span>
                <span className="mt-2 block font-bold leading-snug text-ink group-hover:text-primary">{item.translations[0].title}</span>
              </Link>
            ) : null
          )}
        </nav>
      )}

      {more.length > 0 && (
        <section className="mt-16 border-t border-line pt-10">
          <Reveal>
            <h2 className="text-xl font-bold">{t("latestTitle")}</h2>
          </Reveal>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {more.map((n, i) =>
              n.translations[0] ? (
                <Reveal key={n.id} delay={i * 70}>
                  <NewsCard
                    slug={n.slug}
                    title={n.translations[0].title}
                    summary={n.translations[0].summary}
                    imageUrl={n.imageUrl}
                    date={n.publishedAt ? dateFmt.format(n.publishedAt) : ""}
                    readMoreLabel={tc("readMore")}
                    meta={t("minRead", { n: readingMinutes(n.translations[0].body) })}
                  />
                </Reveal>
              ) : null
            )}
          </div>
        </section>
      )}
    </article>
  );
}
