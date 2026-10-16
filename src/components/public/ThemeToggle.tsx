"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "@/lib/theme";

type Theme = "light" | "dark";
const EVENT = "sqa-theme-change";

function read(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage blocked (private mode): the choice still holds for this page view
  }
  window.dispatchEvent(new Event(EVENT));
}

export default function ThemeToggle() {
  const t = useTranslations("common");
  const theme = useSyncExternalStore<Theme>(subscribe, read, () => "light");
  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = t(next === "dark" ? "themeDark" : "themeLight");

  return (
    <button
      type="button"
      onClick={() => apply(next)}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-card border border-line bg-paper text-ink-soft transition-colors hover:border-primary hover:text-primary"
    >
      {theme === "dark" ? (
        // sun: switch back to light
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // moon: switch to dark
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5a8.5 8.5 0 1 0 10.6 10.6z" />
        </svg>
      )}
    </button>
  );
}
