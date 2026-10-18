"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

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

export default function Header({ hiddenHrefs = [] }: { hiddenHrefs?: string[] }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const hidden = new Set(hiddenHrefs);
  const nav = NAV.filter((i) => !hidden.has(i.href));
  const more = MORE.filter((i) => !hidden.has(i.href));

  const linkCls = (href: string) =>
    `whitespace-nowrap text-sm font-medium transition-colors hover:text-primary ${
      pathname === href ? "text-primary" : "text-ink"
    }`;

  return (
    <>
    {/* Utility bar: contacts, theme, language and the request button */}
    <div className="border-b border-line bg-band">
      <div className="mx-auto flex h-11 max-w-[1320px] items-center justify-between gap-3 px-4">
        <div className="hidden items-center gap-5 text-xs font-medium text-ink-soft md:flex">
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

    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-3" aria-label={tc("companyName")}>
          <Image src="/images/logo/logo-black.jpg" alt="" width={42} height={42} className="rounded-none" priority />
          <span className="hidden text-sm font-bold leading-tight sm:block">
            Standart and Quality
            <br />
            Assessment Group
          </span>
        </Link>

        <nav className="hidden items-center gap-5 xl:flex" aria-label="Main">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)}>
              {t(item.key)}
            </Link>
          ))}
          {more.length > 0 && (
          <div className="relative">
            <button
              className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-ink transition-colors hover:text-primary"
              onClick={() => setMoreOpen((v) => !v)}
              onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
              aria-expanded={moreOpen}
              aria-haspopup="true"
            >
              {t("accreditation")}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-card border border-line bg-paper p-2 shadow-card">
                {more.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-none px-3 py-2 text-sm text-ink hover:bg-band hover:text-primary"
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
            className="flex h-9 w-9 items-center justify-center rounded-card border border-line xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
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
        <nav className="border-t border-line bg-paper px-4 py-3 xl:hidden" aria-label="Mobile">
          {[...nav, ...more].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-none px-2 py-2.5 text-sm font-medium text-ink hover:bg-band hover:text-primary"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      )}
    </header>
    </>
  );
}
