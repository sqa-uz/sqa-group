import Image from "next/image";
import Link from "next/link";
import { adminHref, adminMessages, type AdminLocale } from "@/i18n/admin";
import AdminLanguageSwitcher from "./AdminLanguageSwitcher";
import AdminTabSessionGuard from "./AdminTabSessionGuard";
import AdminLogoutForm from "./AdminLogoutForm";

const NAV = [
  { href: "/admin", key: "dashboard" },
  { href: "/admin/staff", key: "staff" },
  { href: "/admin/news", key: "news" },
  { href: "/admin/partners", key: "partners" },
  { href: "/admin/leads", key: "applications" },
  { href: "/admin/analytics", key: "analytics" },
  { href: "/admin/pages", key: "pages" },
  { href: "/admin/media", key: "media" },
] as const;

export default function AdminShell({
  children,
  email,
  locale,
}: {
  children: React.ReactNode;
  email: string;
  locale: AdminLocale;
}) {
  const t = adminMessages[locale];

  return (
    <div className="min-h-screen">
      <AdminTabSessionGuard locale={locale} />
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href={adminHref("/admin", locale)} className="flex items-center gap-2.5">
              <Image src="/images/logo/logo-black.jpg" alt="" width={30} height={30} className="rounded-[5px]" />
              <span className="text-sm font-bold">SQA Admin</span>
            </Link>
            <nav className="flex gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={adminHref(n.href, locale)}
                  className="rounded-[6px] px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-band hover:text-primary"
                >
                  {t.nav[n.key]}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <AdminLanguageSwitcher locale={locale} />
            <a href="/uz" target="_blank" className="text-xs font-medium text-ink-soft hover:text-primary">
              {t.nav.viewSite}
            </a>
            <span className="hidden text-xs text-ink-soft sm:block">{email}</span>
            <AdminLogoutForm locale={locale} label={t.nav.signOut} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 py-8">{children}</main>
    </div>
  );
}
