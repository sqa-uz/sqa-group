import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { OFFICE } from "@/lib/site";

const NAV = [
  { href: "/about", key: "about" },
  { href: "/certification-body", key: "certificationBody" },
  { href: "/what-we-certify", key: "products" },
  { href: "/laboratories", key: "laboratories" },
  { href: "/team", key: "team" },
  { href: "/news", key: "news" },
  { href: "/schemes", key: "schemes" },
  { href: "/apply", key: "apply" },
  { href: "/appeals", key: "appeals" },
  { href: "/contacts", key: "contacts" },
] as const;

export default function Footer({ hiddenHrefs = [] }: { hiddenHrefs?: string[] }) {
  const hidden = new Set(hiddenHrefs);
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const tc = useTranslations("contacts");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-band">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/images/logo/logo-black.jpg" alt="" width={44} height={44} className="rounded-[2px]" />
            <span className="text-sm font-bold leading-tight">
              Standart and Quality
              <br />
              Assessment Group
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{t("tagline")}</p>
          <div className="mt-4 flex gap-3">
            <a href="https://www.instagram.com/sqa.uz" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-card border border-line bg-paper text-ink-soft transition-colors hover:border-primary hover:text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.15A4 4 0 1 1 16 12a4 4 0 0 1-4 4zM19.85 5.59a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z"/></svg>
            </a>
            <a href="https://t.me/+998951958040" target="_blank" rel="noopener noreferrer" aria-label="Telegram: +998 95 195 80 40" className="flex h-9 w-9 items-center justify-center rounded-card border border-line bg-paper text-ink-soft transition-colors hover:border-primary hover:text-primary">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M21.7 3.3 3.4 10.4c-1.25.5-1.24 1.2-.23 1.51l4.7 1.47 1.8 5.55c.22.62.11.87.75.87.5 0 .72-.23 1-.5l2.26-2.2 4.7 3.48c.87.48 1.49.23 1.7-.8L23 4.83c.32-1.3-.5-1.9-1.3-1.53ZM9.6 13.05l9.18-5.8c.46-.28.88-.13.54.17l-7.58 6.84-.3 3.24-1.84-4.45Z"/>
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink">{t("navTitle")}</h3>
          <ul className="mt-4 space-y-2.5">
            {NAV.filter((item) => !hidden.has(item.href)).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-ink-soft transition-colors hover:text-primary">
                  {tn(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink">{t("contactsTitle")}</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-soft">
            <li>{tc("address")}</li>
            <li>
              <a href="tel:+998951958040" className="font-medium text-ink transition-colors hover:text-primary">
                +998 95 195 80 40
              </a>
            </li>
            <li>
              <a href="mailto:info@sqa.uz" className="font-medium text-ink transition-colors hover:text-primary">
                info@sqa.uz
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink">{t("officeTitle")}</h3>
          <div className="relative mt-3 h-36 overflow-hidden rounded-card border border-line bg-white shadow-card">
            <iframe
              title={t("officeTitle")}
              src={OFFICE.embedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0"
            />
            <a
              href={OFFICE.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("officeTitle")}
              className="absolute inset-0"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-ink-soft">
          <span>© {year} Standart and Quality Assessment Group. {t("rights")}</span>
          <span>O&#39;ZAKK.MS.0052 · O&#39;ZAKK.SL.0162 · O&#39;ZAKK.SL.0437</span>
        </div>
      </div>
    </footer>
  );
}
