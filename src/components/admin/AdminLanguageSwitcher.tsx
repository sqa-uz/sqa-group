"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { locales } from "@/i18n/routing";
import type { AdminLocale } from "@/i18n/admin";

const LABELS: Record<AdminLocale, string> = { uz: "O'z", ru: "Рус", en: "Eng" };

export default function AdminLanguageSwitcher({ locale }: { locale: AdminLocale }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center rounded-card border border-line bg-paper p-0.5" role="group" aria-label="Language">
      {locales.map((nextLocale) => {
        const params = new URLSearchParams(searchParams.toString());
        if (nextLocale === "uz") params.delete("lang");
        else params.set("lang", nextLocale);
        const href = params.toString() ? `${pathname}?${params}` : pathname;
        return (
          <Link
            key={nextLocale}
            href={href}
            className={`rounded-[6px] px-2.5 py-1 text-xs font-semibold transition-colors ${
              locale === nextLocale ? "bg-primary text-white" : "text-ink-soft hover:text-primary"
            }`}
          >
            {LABELS[nextLocale]}
          </Link>
        );
      })}
    </div>
  );
}
