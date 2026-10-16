import { getTranslations, setRequestLocale } from "next-intl/server";
import { guardPage } from "@/lib/pageSettings";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/public/Reveal";
import ScopeSearch from "@/components/public/ScopeSearch";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });
  return { title: t("title"), description: t("intro") };
}

export default async function WhatWeCertifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);
  await guardPage("what-we-certify");
  const t = await getTranslations("products");
  const tn = await getTranslations("nav");

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <p className="eyebrow mb-2">O&apos;ZAKK.MS.0052 · O&apos;z DSt ISO/IEC 17065:2015</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
        <p className="mt-2 max-w-3xl text-sm text-ink-soft">{t("sourceNote")}</p>
      </Reveal>

      <div className="mt-6">
        <ScopeSearch initialQuery={typeof q === "string" ? q.slice(0, 120) : ""} />
      </div>

      <div className="guilloche mt-12 rounded-card p-7 text-white">
        <h2 className="text-lg font-bold">{t("ctaTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{t("ctaText")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/apply" className="rounded-card bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-band">
            {tn("apply")} →
          </Link>
          <Link href="/accreditation/certification" className="rounded-card border border-white/60 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
            {tn("accreditationCertification")}
          </Link>
        </div>
      </div>
    </div>
  );
}
