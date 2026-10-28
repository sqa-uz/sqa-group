"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";

const LABELS: Record<string, string> = { uz: "O'z", ru: "Рус", en: "Eng" };

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname(); // current path without locale prefix

  return (
    <div className="flex items-center rounded-card border border-line bg-paper p-0.5" role="group" aria-label="Language">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => router.replace(pathname, { locale: l })}
          aria-current={l === locale ? "true" : undefined}
          className={`rounded-[2px] px-2.5 py-1 text-xs font-semibold transition-colors ${
            l === locale ? "bg-primary text-white" : "text-ink-soft hover:text-primary"
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
