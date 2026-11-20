import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { guardPage } from "@/lib/pageSettings";
import { LABS, labBySlug } from "@/lib/labs";
import Reveal from "@/components/public/Reveal";
import { CertificateCard } from "@/components/public/DocDownload";
import ApplySection from "@/components/public/ApplySection";
import OrgStructure, { type OrgCopy } from "@/components/public/OrgStructure";

type Unit = { code: string; standard: string; valid: string };

export function generateStaticParams() {
  return LABS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const lab = labBySlug(slug);
  if (!lab) return {};
  const t = await getTranslations({ locale, namespace: "laboratories" });
  return { title: t(lab.title), description: t(lab.text) };
}

export default async function LaboratoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const lab = labBySlug(slug);
  if (!lab) notFound();
  setRequestLocale(locale);
  await guardPage("laboratories");
  const t = await getTranslations("laboratories");
  const ta = await getTranslations("about");
  const tc = await getTranslations("common");
  const unit = (ta.raw("units") as Unit[])[lab.unit];
  const other = LABS.find((l) => l.slug !== lab.slug)!;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <Link href="/laboratories" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-primary">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("allLabs")}
        </Link>
        <p className="eyebrow mb-2 mt-6">
          {unit?.code} · {unit?.standard}
        </p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t(lab.title)}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t(lab.text)}</p>
        <p className="mt-3 text-sm font-semibold text-primary">{unit?.valid}</p>
      </Reveal>

      {lab.chart && (
        <Reveal>
          <section id="structure" className="mt-12 scroll-mt-24">
            <p className="eyebrow mb-2">{t("structureEyebrow")}</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("structureTitle")}</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">{t("structureIntro")}</p>
            <OrgStructure chart={lab.chart} copy={t.raw("structure") as OrgCopy} />
          </section>
        </Reveal>
      )}

      <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <div className="max-w-sm">
            <CertificateCard
              img={lab.certificate.img}
              caption={lab.certificate.caption}
              href={lab.certificate.href}
              downloadLabel={t("downloadCert")}
            />
          </div>
        </Reveal>
        <div className="space-y-8">
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

          {/* the other laboratory */}
          <Reveal delay={80}>
            <Link href={`/laboratories/${other.slug}`} className="t-learn card card-hover group grid overflow-hidden sm:grid-cols-[40%_1fr]">
              <div className="relative aspect-[16/9] overflow-hidden sm:aspect-auto sm:min-h-[150px]">
                <Image src={other.photo} alt="" fill sizes="(max-width: 640px) 100vw, 260px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-col p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">{t("otherLab")}</p>
                <h3 className="mt-1.5 text-lg font-bold text-ink group-hover:text-primary">{t(other.title)}</h3>
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-primary">
                  {tc("readMore")}
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                    <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          </Reveal>
        </div>
      </div>

      <ApplySection defaultService="testing" />
    </div>
  );
}
