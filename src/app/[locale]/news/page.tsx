import { getTranslations, setRequestLocale } from "next-intl/server";
import { guardPage } from "@/lib/pageSettings";
import { prisma } from "@/lib/prisma";
import { readingMinutes } from "@/lib/article";
import NewsBrowser from "@/components/public/NewsBrowser";
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

  const items = news.flatMap((n) => {
    const tr = n.translations[0];
    if (!tr) return [];
    return [
      {
        id: n.id,
        slug: n.slug,
        title: tr.title,
        summary: tr.summary,
        imageUrl: n.imageUrl,
        date: n.publishedAt ? dateFmt.format(n.publishedAt) : "",
        year: n.publishedAt ? n.publishedAt.getFullYear() : null,
        meta: t("minRead", { n: readingMinutes(tr.body) }),
        featured: n.featured,
      },
    ];
  });

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <p className="eyebrow mb-2">{t("subtitle")}</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
      </Reveal>

      {items.length === 0 ? (
        <p className="mt-10 text-ink-soft">{t("emptyState")}</p>
      ) : (
        <NewsBrowser
          items={items}
          labels={{
            search: t("searchPlaceholder"),
            all: t("allYears"),
            featured: t("featured"),
            readMore: tc("readMore"),
            nothingFound: t("nothingFound"),
          }}
        />
      )}
    </div>
  );
}
