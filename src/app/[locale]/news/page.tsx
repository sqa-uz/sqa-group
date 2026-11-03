import { getTranslations, setRequestLocale } from "next-intl/server";
import { guardPage } from "@/lib/pageSettings";
import { prisma } from "@/lib/prisma";
import NewsCard from "@/components/public/NewsCard";
import Reveal from "@/components/public/Reveal";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "news" });
  return { title: t("title") };
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await guardPage("news");
  const t = await getTranslations("news");
  const tc = await getTranslations("common");

  const news = await prisma.news.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    include: { translations: { where: { locale } } },
  });

  const dateFmt = new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <p className="eyebrow mb-2">{t("subtitle")}</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
      </Reveal>

      {news.length === 0 ? (
        <p className="mt-10 text-ink-soft">{t("emptyState")}</p>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {news.map((n, i) =>
            n.translations[0] ? (
              <Reveal key={n.id} delay={(i % 3) * 70}>
                <NewsCard
                  headingLevel={2}
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
      )}
    </div>
  );
}
