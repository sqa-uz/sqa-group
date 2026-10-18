import { getTranslations, setRequestLocale } from "next-intl/server";
import { guardPage } from "@/lib/pageSettings";
import Reveal from "@/components/public/Reveal";
import { CertificateCard } from "@/components/public/DocDownload";
import ApplySection from "@/components/public/ApplySection";

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

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <p className="eyebrow mb-2">O&#39;z DSt ISO/IEC 17025:2019</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
      </Reveal>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {([
          ["lab1Title", "lab1Text", "lab1Badge"],
          ["lab2Title", "lab2Text", "lab2Badge"],
        ] as const).map(([title, text, badge], i) => (
          <Reveal key={title} delay={i * 80}>
            <section className="card h-full p-7">
              <span className="inline-block rounded-[2px] bg-band px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary">
                {t(badge)}
              </span>
              <h2 className="mt-4 text-xl font-bold">{t(title)}</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{t(text)}</p>
            </section>
          </Reveal>
        ))}
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

      <div className="mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
        <Reveal>
          <CertificateCard
            img="/images/certificates/testing-laboratory-2025.jpeg"
            caption="O'ZAKK.SL.0162"
            href="/documents/sqa-laboratory-certificate.pdf"
            downloadLabel={t("downloadCert")}
          />
        </Reveal>
        <Reveal delay={80}>
          <CertificateCard
            img="/images/certificates/s-lab-2026.jpeg"
            caption="O'ZAKK.SL.0437"
            href="/documents/sqa-s-lab-certificate.pdf"
            downloadLabel={t("downloadCert")}
          />
        </Reveal>
      </div>

      <ApplySection defaultService="testing" />
    </div>
  );
}
