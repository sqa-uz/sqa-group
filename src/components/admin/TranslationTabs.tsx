"use client";

import { useState } from "react";
import { locales } from "@/i18n/routing";

const LABELS: Record<string, string> = { uz: "O'zbekcha", ru: "Русский", en: "English" };

/**
 * Tabbed translation editor. All locales' fields stay mounted (hidden, not
 * unmounted) so every value submits with the form.
 */
export default function TranslationTabs({
  render,
}: {
  render: (locale: string) => React.ReactNode;
}) {
  const [active, setActive] = useState<string>(locales[0]);

  return (
    <div>
      <div className="flex gap-1 border-b border-line" role="tablist">
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={active === l}
            onClick={() => setActive(l)}
            className={`-mb-px rounded-t-[6px] border px-4 py-2 text-sm font-semibold transition-colors ${
              active === l
                ? "border-line border-b-white bg-white text-primary"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {LABELS[l]}
          </button>
        ))}
      </div>
      {locales.map((l) => (
        <div key={l} hidden={active !== l} className="rounded-b-card border border-t-0 border-line bg-white p-5">
          {render(l)}
        </div>
      ))}
    </div>
  );
}
