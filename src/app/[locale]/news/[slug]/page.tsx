import Image from "next/image";
import { guardPage } from "@/lib/pageSettings";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { isLocalMediaUrl } from "@/lib/media-url";
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
  return { title: tr?.title ?? "Blog", description: tr?.summary ?? undefined };
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

  const dateFmt = new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const more = await prisma.news.findMany({
    where: { status: "published", NOT: { id: article.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    include: { translations: { where: { locale } } },
  });

  return (
    <article className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <Link href="/news" className="text-sm font-semibold text-primary hover:underline">
          ← {tc("back")}
        </Link>
        <div className="mx-auto mt-6 max-w-3xl">
          {article.publishedAt && (
            <time className="text-sm font-medium text-ink-soft">
              {t("publishedOn")}: {dateFmt.format(article.publishedAt)}
            </time>
          )}
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{tr.title}</h1>
          {tr.summary && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{tr.summary}</p>}
        </div>
      </Reveal>

      {article.imageUrl && (
        <Reveal delay={80}>
          <figure className="card mx-auto mt-8 max-w-4xl overflow-hidden">
            <Image src={article.imageUrl} alt="" width={1200} height={675} unoptimized={isLocalMediaUrl(article.imageUrl)} className="w-full object-cover" priority />
          </figure>
        </Reveal>
      )}

      <Reveal delay={100}>
        <div className="article-body mx-auto mt-8 max-w-3xl text-base">
          {tr.body.split("\n").filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Reveal>

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
