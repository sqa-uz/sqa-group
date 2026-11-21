import { getTranslations, setRequestLocale } from "next-intl/server";
import { guardPage } from "@/lib/pageSettings";
import Reveal from "@/components/public/Reveal";
import OrgExplorer from "@/components/public/OrgExplorer";
import { prisma } from "@/lib/prisma";
import { STAFF_SLUG } from "@/lib/orgExplorer";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "structurePage" });
  return { title: t("metaTitle"), description: t("lead") };
}

export default async function StructurePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await guardPage("structure");
  const t = await getTranslations("structurePage");

  // photos come from the published team profiles; people without one keep their initials
  const bySlug = Object.fromEntries(Object.entries(STAFF_SLUG).map(([id, slug]) => [slug, id]));
  const staff = await prisma.staff
    .findMany({ where: { published: true, slug: { in: Object.values(STAFF_SLUG) } }, select: { slug: true, photoUrl: true } })
    .catch(() => []);
  const photos: Record<string, string> = {};
  for (const s of staff) if (s.photoUrl) photos[bySlug[s.slug]] = s.photoUrl;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <p className="eyebrow mb-2">{t("eyebrow")}</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("lead")}</p>
      </Reveal>
      <OrgExplorer photos={photos} />
    </div>
  );
}
