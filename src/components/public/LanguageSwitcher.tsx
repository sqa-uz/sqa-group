"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";

/** Short labels on screen; full endonyms (in their own language) for screen readers. */
const LABELS: Record<string, { short: string; full: string }> = {
  uz: { short: "O'z", full: "O'zbekcha" },
  ru: { short: "Рус", full: "Русский" },
  en: { short: "Eng", full: "English" },
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname(); // current path without locale prefix

  return (
    <div className="flex items-center rounded-card border border-line bg-paper p-0.5" role="group" aria-label={t("language")}>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          onClick={() => router.replace(pathname, { locale: l })}
          aria-current={l === locale ? "true" : undefined}
          aria-label={LABELS[l].full}
          className={`min-h-6 rounded-[2px] px-2.5 py-1 text-xs font-semibold transition-colors ${
            l === locale ? "bg-primary text-white" : "text-ink-soft hover:text-primary"
          }`}
        >
          {LABELS[l].short}
        </button>
      ))}
    </div>
  );
}
