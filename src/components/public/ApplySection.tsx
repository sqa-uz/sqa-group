import { getTranslations } from "next-intl/server";
import ApplicationForm from "./ApplicationForm";
import { getDisabledPageKeys } from "@/lib/pageSettings";

/** Reusable application block embedded at the bottom of service pages. */
export default async function ApplySection({ defaultService }: { defaultService?: string }) {
  const disabled = new Set(await getDisabledPageKeys());
  if (disabled.has("apply")) return null;
  const t = await getTranslations("apply");
  return (
    <section id="apply" className="mt-16 grid gap-8 rounded-card border border-line bg-band p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("formTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("intro")}</p>
        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-ink-soft">{t("docsTitle")}</h3>
        <ul className="mt-3 space-y-2">
          {(["doc1", "doc2", "doc3", "doc4", "doc5"] as const).map((k) => (
            <li key={k} className="flex items-start gap-2.5 text-sm text-ink">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-primary">
                <path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t(k)}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs leading-relaxed text-ink-soft">
          {t("stateNote")}{" "}
          <a href="https://singlewindow.uz" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
            singlewindow.uz →
          </a>
        </p>
      </div>
      <div className="rounded-card border border-line bg-paper p-5 sm:p-6">
        <ApplicationForm defaultService={defaultService} />
      </div>
    </section>
  );
}
