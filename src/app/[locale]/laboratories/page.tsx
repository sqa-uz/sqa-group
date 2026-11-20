import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { guardPage } from "@/lib/pageSettings";
import { LABS } from "@/lib/labs";
import Reveal from "@/components/public/Reveal";
import ApplySection from "@/components/public/ApplySection";

type Unit = { code: string; standard: string; valid: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "laboratories" });
  return { title: t("title") };
}

export default async function LaboratoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await guardPage("laboratories");
  const t = await getTranslations("laboratories");
  const ta = await getTranslations("about");
  const tc = await getTranslations("common");
  const units = ta.raw("units") as Unit[];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <p className="eyebrow mb-2">O&#39;z DSt ISO/IEC 17025:2019</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
      </Reveal>

      {/* one card per laboratory, each leading to its own page */}
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {LABS.map((lab, i) => {
          const unit = units[lab.unit];
          return (
            <Reveal key={lab.slug} delay={i * 80}>
              <Link href={`/laboratories/${lab.slug}`} className="t-learn card card-hover group flex h-full flex-col overflow-hidden">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={lab.photo}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-[2px] bg-white px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary">
                    {unit?.code}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <h2 className="text-xl font-bold text-ink group-hover:text-primary">{t(lab.title)}</h2>
                  <p className="mt-3 leading-relaxed text-ink-soft">{t(lab.text)}</p>
                  <p className="mt-4 text-xs font-semibold text-primary">{unit?.valid}</p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-primary">
                    {tc("readMore")}
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                      <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-12">
        <Reveal>
          <h2 className="text-xl font-bold">{t("equipmentTitle")}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {(["eq1", "eq2", "eq3", "eq4"] as const).map((k) => (
              <li key={k} className="flex items-start gap-3 text-sm font-medium text-ink">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-primary">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeOpacity="0.3" />
                  <path d="M6.5 10.5l2.5 2.5 4.5-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t(k)}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <ApplySection defaultService="testing" />
    </div>
  );
}
