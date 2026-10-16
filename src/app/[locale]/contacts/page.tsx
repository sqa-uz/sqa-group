import { getTranslations, setRequestLocale } from "next-intl/server";
import { guardPage } from "@/lib/pageSettings";
import Reveal from "@/components/public/Reveal";
import { OFFICE } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contacts" });
  return { title: t("title") };
}

export default async function ContactsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await guardPage("contacts");
  const t = await getTranslations("contacts");

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
      </Reveal>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <Reveal>
            <div className="card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{t("addressTitle")}</h2>
              <p className="mt-2 font-medium leading-relaxed">{t("address")}</p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="card p-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{t("phoneTitle")}</h2>
                <a href="tel:+998951958040" className="mt-2 block text-lg font-bold text-primary hover:underline">
                  +998 95 195 80 40
                </a>
              </div>
              <div className="card p-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{t("emailTitle")}</h2>
                <a href="mailto:info@sqa.uz" className="mt-2 block text-lg font-bold text-primary hover:underline">
                  info@sqa.uz
                </a>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{t("hoursTitle")}</h2>
              <p className="mt-2 font-medium">{t("hours")}</p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="card overflow-hidden">
            <iframe
              title={t("addressTitle")}
              src={OFFICE.embedSrc}
              width="100%"
              height="440"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="block h-[440px] w-full border-0"
            />
            <a
              href={OFFICE.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block border-t border-line px-4 py-3 text-center text-sm font-semibold text-primary hover:underline"
            >
              {t("openInMaps")} →
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
