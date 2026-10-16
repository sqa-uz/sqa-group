import { getTranslations, setRequestLocale } from "next-intl/server";
import Reveal from "@/components/public/Reveal";
import ApplicationForm from "@/components/public/ApplicationForm";
import { guardPage } from "@/lib/pageSettings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "apply" });
  return { title: t("title"), description: t("intro") };
}

export default async function ApplyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await guardPage("apply");
  const t = await getTranslations("apply");

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
      </Reveal>

      <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{t("docsTitle")}</h2>
          <ul className="mt-4 space-y-3">
            {(["doc1", "doc2", "doc3", "doc4", "doc5"] as const).map((k) => (
              <li key={k} className="flex items-start gap-3 rounded-card border border-line bg-paper p-4 text-sm font-medium">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-primary">
                  <path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t(k)}
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-card bg-band p-5">
            <p className="text-sm leading-relaxed text-ink-soft">{t("stateNote")}</p>
            <a
              href="https://singlewindow.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-card border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              {t("stateCta")} →
            </a>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <div className="card p-6 sm:p-7">
            <h2 className="text-xl font-bold">{t("formTitle")}</h2>
            <div className="mt-5">
              <ApplicationForm />
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
