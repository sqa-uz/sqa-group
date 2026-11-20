"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import TashkentNow from "./TashkentNow";
import type { Weather } from "@/lib/weather";
import { cssTimeMs } from "@/lib/motion";

const NAV = [
  { href: "/about", key: "about" },
  { href: "/certification-body", key: "certificationBody" },
  { href: "/what-we-certify", key: "products" },
  { href: "/laboratories", key: "laboratories" },
  { href: "/team", key: "team" },
  { href: "/news", key: "news" },
  { href: "/contacts", key: "contacts" },
] as const;

/** Laboratories open as a menu so a visitor can go straight to one of them. */
const LABS_MENU = [
  { href: "/laboratories/sqa", key: "labSqa", code: "O'ZAKK.SL.0162" },
  { href: "/laboratories/s-lab", key: "labSlab", code: "O'ZAKK.SL.0437" },
  { href: "/laboratories", key: "labsAll", code: "" },
] as const;

const MORE = [
  { href: "/apply", key: "apply" },
  { href: "/financing", key: "financing" },
  { href: "/schemes", key: "schemes" },
  { href: "/accreditation/certification", key: "accreditationCertification" },
  { href: "/accreditation/laboratories", key: "accreditationLaboratories" },
  { href: "/appeals", key: "appeals" },
] as const;

type MenuItem = { href: string; label: string; hint?: string };

/** Header drop-down ("Laboratories", "Accreditation"): click to open, closes on blur, Escape or choice. */
function NavDropdown({
  label,
  items,
  active,
  align = "right",
  width = "w-72",
}: {
  label: string;
  items: MenuItem[];
  active?: boolean;
  align?: "left" | "right";
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  // Dropdown phase for the transitions-dev menu: open → closing (plays the close) → rest.
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    setClosing(false);
    setOpen(true);
  };
  const hide = () => {
    if (!open) return;
    setOpen(false);
    setClosing(true);
    const ms = cssTimeMs(document.documentElement, "--dropdown-close-dur", 150);
    timer.current = setTimeout(() => setClosing(false), ms);
  };
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div
      // .t-acc only drives the chevron flip here; the menu itself is a .t-dropdown.
      className="t-acc relative"
      data-open={open}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hide();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") hide();
      }}
    >
      <button
        type="button"
        className={`flex items-center gap-1 whitespace-nowrap text-sm font-medium transition-colors hover:text-primary ${
          active ? "text-primary" : "text-ink"
        }`}
        onClick={() => (open ? hide() : show())}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <span className="t-acc-chevron" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <div
        data-origin={align === "right" ? "top-right" : "top-left"}
        className={`t-dropdown absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-2 ${width} rounded-card border border-line bg-paper p-2 shadow-card${
          open ? " is-open" : closing ? " is-closing" : ""
        }`}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={hide}
            className="block rounded-[2px] px-3 py-2 text-sm text-ink hover:bg-band hover:text-primary"
          >
            {item.label}
            {item.hint && <span className="mt-0.5 block text-[11px] font-semibold tracking-wide text-ink-soft">{item.hint}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Header({ hiddenHrefs = [], weather = null }: { hiddenHrefs?: string[]; weather?: Weather | null }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hidden = new Set(hiddenHrefs);
  const nav = NAV.filter((i) => !hidden.has(i.href));
  const more = MORE.filter((i) => !hidden.has(i.href));

  const linkCls = (href: string) =>
    `whitespace-nowrap text-sm font-medium transition-colors hover:text-primary ${
      pathname === href || pathname.startsWith(`${href}/`) ? "text-primary" : "text-ink"
    }`;

  return (
    <div className="sticky top-0 z-50">
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

    <header className="relative border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-3" aria-label={tc("companyName")}>
          <Image src="/images/logo/logo-black.jpg" alt="" width={42} height={42} className="rounded-[2px]" priority />
          <span className="hidden text-sm font-bold leading-tight sm:block">
            Standart and Quality
            <br />
            Assessment Group
          </span>
        </Link>

        <nav className="hidden items-center gap-5 xl:flex" aria-label="Main">
          {nav.map((item) =>
            item.href === "/laboratories" ? (
              <NavDropdown
                key={item.href}
                label={t(item.key)}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                align="left"
                width="w-80"
                items={LABS_MENU.map((l) => ({ href: l.href, label: t(l.key), hint: l.code || undefined }))}
              />
            ) : (
              <Link key={item.href} href={item.href} className={linkCls(item.href)}>
                {t(item.key)}
              </Link>
            )
          )}
          {more.length > 0 && (
            <NavDropdown label={t("accreditation")} items={more.map((i) => ({ href: i.href, label: t(i.key) }))} />
          )}
        </nav>

        <div className="flex items-center gap-3 xl:hidden">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-card border border-line xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
          >
            <span className="t-icon-swap" data-state={open ? "b" : "a"} aria-hidden="true">
              <span className="t-icon" data-icon="a">
                <svg width="18" height="14" viewBox="0 0 18 14">
                  <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <span className="t-icon" data-icon="b">
                <svg width="18" height="14" viewBox="0 0 18 14">
                  <path d="M2 2l14 10M16 2L2 12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu: grows open as an accordion panel under the header bar. */}
      <div className="t-acc xl:hidden" data-open={open}>
        <div className="t-acc-panel">
          <div className="t-acc-panel-inner" inert={!open}>
            <nav className="border-t border-line bg-paper px-4 py-3" aria-label="Mobile">
              {[...nav, ...more].map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-[2px] px-2 py-2.5 text-sm font-medium text-ink hover:bg-band hover:text-primary"
                  >
                    {t(item.key)}
                  </Link>
                  {item.href === "/laboratories" && (
                    <div className="mb-1 ml-3 border-l border-line pl-2">
                      {LABS_MENU.filter((l) => l.href !== "/laboratories").map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setOpen(false)}
                          className="block rounded-[2px] px-2 py-2 text-sm text-ink-soft hover:bg-band hover:text-primary"
                        >
                          {t(l.key)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
    </div>
  );
}
