"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";

const LABELS: Record<string, string> = { uz: "O'z", ru: "Рус", en: "Eng" };

/** Language switcher as a segmented control: the active pill slides to the chosen language (transitions-dev tabs sliding). */
export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname(); // current path without locale prefix
  const bar = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);

  const moveTo = useCallback((tab: HTMLElement | null | undefined, animate: boolean) => {
    const p = pill.current;
    if (!p || !tab) return;
    if (!animate) {
      const prev = p.style.transition;
      p.style.transition = "none";
      p.style.transform = `translateX(${tab.offsetLeft}px)`;
      p.style.width = `${tab.offsetWidth}px`;
      void p.offsetWidth;
      p.style.transition = prev;
    } else {
      p.style.transform = `translateX(${tab.offsetLeft}px)`;
      p.style.width = `${tab.offsetWidth}px`;
    }
  }, []);

  const activeTab = useCallback(
    () => bar.current?.querySelector<HTMLElement>('.t-tab[aria-current="true"]'),
    [],
  );

  // First paint and resize: snap the pill under the current language without animating.
  useLayoutEffect(() => {
    moveTo(activeTab(), false);
    bar.current?.setAttribute("data-ready", "");
  }, [locale, moveTo, activeTab]);
  useEffect(() => {
    const onResize = () => moveTo(activeTab(), false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [moveTo, activeTab]);

  return (
    <div ref={bar} className="lang-tabs t-tabs" role="group" aria-label="Language">
      <span ref={pill} className="t-tabs-pill" aria-hidden="true" />
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          className="t-tab"
          onClick={(e) => {
            if (l === locale) return;
            moveTo(e.currentTarget, true);
            router.replace(pathname, { locale: l });
          }}
          aria-current={l === locale ? "true" : undefined}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
