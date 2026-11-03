"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import TashkentNow from "./TashkentNow";
import type { Weather } from "@/lib/weather";

const NAV = [
  { href: "/about", key: "about" },
  { href: "/certification-body", key: "certificationBody" },
  { href: "/what-we-certify", key: "products" },
  { href: "/laboratories", key: "laboratories" },
  { href: "/team", key: "team" },
  { href: "/news", key: "news" },
  { href: "/contacts", key: "contacts" },
] as const;

const MORE = [
  { href: "/apply", key: "apply" },
  { href: "/financing", key: "financing" },
  { href: "/schemes", key: "schemes" },
  { href: "/accreditation/certification", key: "accreditationCertification" },
  { href: "/accreditation/laboratories", key: "accreditationLaboratories" },
  { href: "/appeals", key: "appeals" },
] as const;

export default function Header({ hiddenHrefs = [], weather = null }: { hiddenHrefs?: string[]; weather?: Weather | null }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const moreId = useId();
  const mobileId = useId();

  // Escape closes whichever menu is open and returns focus to the button that opened it.
  useEffect(() => {
    if (!open && !moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (moreOpen) {
        setMoreOpen(false);
        moreButton.current?.focus();
      }
      if (open) {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, moreOpen]);

  const hidden = new Set(hiddenHrefs);
  const nav = NAV.filter((i) => !hidden.has(i.href));
  const more = MORE.filter((i) => !hidden.has(i.href));

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // The current page is marked by colour and an underline, not by colour alone.
  const linkCls = (href: string) =>
    `whitespace-nowrap text-sm font-medium transition-colors hover:text-primary ${
      isCurrent(href) ? "text-primary underline decoration-2 underline-offset-[6px]" : "text-ink"
    }`;

  return (
    <header className="sticky top-0 z-50">
    <a
      href="#main"
      className="sr-only rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[60]"
    >
      {tc("skipToContent")}
    </a>
    {/* Utility bar: contacts, theme, language and the request button */}
    <div className="border-b border-line bg-band">
      <div className="mx-auto flex h-11 max-w-[1320px] items-center justify-between gap-3 px-4">
        <div className="hidden items-center gap-5 text-xs font-medium text-ink-soft md:flex">
          <TashkentNow weather={weather} />
          <span aria-hidden="true" className="h-3 w-px bg-line" />
          <a href="tel:+998951958040" className="whitespace-nowrap transition-colors hover:text-primary">
            +998 95 195 80 40
          </a>
          <a href="mailto:info@sqa.uz" className="transition-colors hover:text-primary">
            info@sqa.uz
          </a>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          {!hidden.has("/apply") && (
            <Link
              href="/apply"
              className="whitespace-nowrap rounded-card bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-bright sm:px-4"
            >
              {t("request")}
            </Link>
          )}
        </div>
      </div>
    </div>

    <div className="relative border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-3" aria-label={tc("companyName")}>
          <Image src="/images/logo/logo-black.jpg" alt="" width={42} height={42} className="rounded-[2px]" priority />
          <span className="hidden text-sm font-bold leading-tight sm:block">
            Standart and Quality
            <br />
            Assessment Group
          </span>
        </Link>

        <nav className="hidden items-center gap-5 xl:flex" aria-label={tc("navMain")}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={linkCls(item.href)}
            >
              {t(item.key)}
            </Link>
          ))}
          {more.length > 0 && (
          <div
            className="relative"
            // Close only when focus leaves the button and its menu, so Tab can walk into the links.
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMoreOpen(false);
            }}
          >
            <button
              ref={moreButton}
              type="button"
              className={`flex items-center gap-1 whitespace-nowrap text-sm font-medium transition-colors hover:text-primary ${
                more.some((i) => isCurrent(i.href)) ? "text-primary" : "text-ink"
              }`}
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-controls={moreId}
            >
              {t("accreditation")}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            {moreOpen && (
              <div id={moreId} className="absolute right-0 top-full mt-2 w-72 rounded-card border border-line bg-paper p-2 shadow-card">
                {more.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    className={`block rounded-[2px] px-3 py-2 text-sm hover:bg-band hover:text-primary ${
                      isCurrent(item.href) ? "font-semibold text-primary" : "text-ink"
                    }`}
                  >
                    {t(item.key)}
                  </Link>
                ))}
              </div>
            )}
          </div>
          )}
        </nav>

        <div className="flex items-center gap-3 xl:hidden">
          <button
            ref={menuButton}
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-card border border-line xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={mobileId}
            aria-label={tc(open ? "menuClose" : "menuOpen")}
          >
            <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
              {open ? (
                <path d="M2 2l14 10M16 2L2 12" stroke="currentColor" strokeWidth="2" />
              ) : (
                <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="2" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id={mobileId} className="border-t border-line bg-paper px-4 py-3 xl:hidden" aria-label={tc("navMain")}>
          {[...nav, ...more].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={`block rounded-[2px] px-2 py-3 text-sm font-medium hover:bg-band hover:text-primary ${
                isCurrent(item.href) ? "bg-band text-primary" : "text-ink"
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      )}
    </div>
    </header>
  );
}
