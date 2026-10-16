import { getTranslations, setRequestLocale } from "next-intl/server";
import { guardPage } from "@/lib/pageSettings";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/public/Reveal";
import SectionHeading from "@/components/public/SectionHeading";

/**
 * Schemes of paragraph 93 of the Regulation on product certification
 * (Annex 2 to Cabinet of Ministers Resolution No. 502 of 14.08.2024, as amended by No. 472 of 07.09.2026).
 * `mark`: the scheme requires the conformity mark. `inScope`: listed in our accreditation scope O'ZAKK.MS.0052.
 * `seller`: a seller (importer) may also apply, not only the manufacturer.
 */
const SCHEMES = [
  { key: "1S", mark: true, inScope: true, seller: false },
  { key: "2S", mark: true, inScope: true, seller: false },
  { key: "3S", mark: true, inScope: true, seller: true },
  { key: "3A", mark: true, inScope: false, seller: true },
  { key: "4S", mark: false, inScope: true, seller: true },
  { key: "5S", mark: true, inScope: false, seller: false },
  { key: "6S", mark: true, inScope: false, seller: false },
  { key: "7S", mark: true, inScope: false, seller: false },
  { key: "8S", mark: true, inScope: false, seller: false },
  { key: "9S", mark: false, inScope: true, seller: true },
] as const;

const SOURCES = [
  { key: "source502", href: "https://lex.uz/docs/-7080176" },
  { key: "source318", href: "https://lex.uz/docs/-337769" },
] as const;

/** Scheme codes as written in each language: 1С (Cyrillic) in Russian, 1S in Uzbek, 1C in English. */
function schemeCode(key: string, locale: string) {
  if (key === "3A") return locale === "ru" ? "3А" : "3A";
  const n = key.slice(0, -1);
  return n + (locale === "ru" ? "С" : locale === "uz" ? "S" : "C");
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "schemes" });
  return { title: t("title"), description: t("intro") };
}

export default async function SchemesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await guardPage("schemes");
  const t = await getTranslations("schemes");
  const tn = await getTranslations("nav");
  const validity = t.raw("validity") as { title: string; text: string }[];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
      </Reveal>

      <Reveal delay={60}>
        <div className="mt-8 max-w-4xl rounded-card border border-primary/30 border-l-4 border-l-primary bg-band p-5 sm:p-6">
          <h2 className="font-bold text-ink">{t("noticeTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("noticeText")}</p>
        </div>
      </Reveal>

      <section className="mt-14">
        <Reveal>
          <SectionHeading eyebrow={t("schemesEyebrow")} title={t("schemesTitle")} />
          <p className="mt-3 max-w-3xl text-ink-soft">{t("schemesText")}</p>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {SCHEMES.map((s, i) => (
            <Reveal key={s.key} delay={(i % 2) * 60}>
              <article className="card flex h-full flex-col p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 min-w-12 shrink-0 items-center justify-center rounded-card bg-primary px-2 text-lg font-black text-white">
                    {schemeCode(s.key, locale)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold leading-snug text-ink">{t(`schemes.${s.key}.title`)}</h3>
                    {s.inScope && (
                      <span className="mt-1.5 inline-block rounded-[6px] bg-band px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {t("inScope")}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t(`schemes.${s.key}.text`)}</p>
                <div className="mt-auto pt-4">
                <dl className="grid gap-1.5 border-t border-line pt-3 text-xs sm:grid-cols-[8.5rem_1fr]">
                  <dt className="font-semibold uppercase tracking-wide text-ink-soft">{t("applicantLabel")}</dt>
                  <dd className="text-ink">{t(s.seller ? "applicantMakerOrSeller" : "applicantMaker")}</dd>
                  <dt className="font-semibold uppercase tracking-wide text-ink-soft">{t("markLabel")}</dt>
                  <dd className="text-ink">{t(s.mark ? "markYes" : "markNo")}</dd>
                </dl>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <section className="card h-full p-6">
            <h2 className="text-lg font-bold text-ink">{t("validityTitle")}</h2>
            <dl className="mt-4 space-y-4">
              {validity.map((v) => (
                <div key={v.title} className="border-l-2 border-primary pl-3">
                  <dt className="text-sm font-bold text-ink">{v.title}</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-ink-soft">{v.text}</dd>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>
        <Reveal delay={80}>
          <section className="card h-full p-6">
            <h2 className="text-lg font-bold text-ink">{t("markTitle")}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
              <p>{t("markText1")}</p>
              <p>{t("markText2")}</p>
              <p>{t("markText3")}</p>
            </div>
          </section>
        </Reveal>
      </div>

      <Reveal delay={60}>
        <div className="guilloche mt-12 rounded-card p-7 text-white">
          <h2 className="text-lg font-bold">{t("noteTitle")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{t("noteText")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/apply" className="inline-block rounded-card bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-band">
              {tn("request")} →
            </Link>
            <Link href="/what-we-certify" className="rounded-card border border-white/60 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              {tn("products")}
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{t("sourcesTitle")}</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {SOURCES.map((s) => (
              <li key={s.key}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {t(s.key)} ↗
                </a>
              </li>
            ))}
            <li className="text-ink-soft">{t("sourceLetter")}</li>
          </ul>
        </section>
      </Reveal>
    </div>
  );
}
