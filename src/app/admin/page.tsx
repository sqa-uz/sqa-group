import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import { adminHref, adminMessages, getAdminLocale } from "@/i18n/admin";
import { ensurePageViewTable } from "@/lib/analytics";

export const dynamic = "force-dynamic";

/** Page views and daily-unique visitors over the last 7 days; zeros if analytics are unavailable. */
async function getWeekTraffic() {
  try {
    await ensurePageViewTable();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [row] = await prisma.$queryRaw<{ views: bigint; visitors: bigint }[]>`
      SELECT COUNT(*) AS views, COUNT(DISTINCT "visitor") AS visitors FROM "PageView" WHERE "createdAt" >= ${since}`;
    return { views: Number(row?.views ?? 0), visitors: Number(row?.visitors ?? 0) };
  } catch {
    return { views: 0, visitors: 0 };
  }
}

async function getLeadCounts() {
  const [total, fresh] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "new" } }),
  ]);
  return { total, fresh };
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  const locale = getAdminLocale(await searchParams);
  const t = adminMessages[locale];

  const [staffTotal, staffPublished, newsTotal, newsPublished, partnersTotal, partnersPublished, leadCounts] =
    await Promise.all([
      prisma.staff.count(),
      prisma.staff.count({ where: { published: true } }),
      prisma.news.count(),
      prisma.news.count({ where: { status: "published" } }),
      prisma.partner.count(),
      prisma.partner.count({ where: { published: true } }),
      getLeadCounts(),
    ]);
  const traffic = await getWeekTraffic();

  const cards = [
    { href: "/admin/staff", label: t.nav.staff, total: staffTotal, published: staffPublished },
    { href: "/admin/news", label: t.nav.news, total: newsTotal, published: newsPublished },
    { href: "/admin/partners", label: t.nav.partners, total: partnersTotal, published: partnersPublished },
    { href: "/admin/leads", label: t.nav.applications, total: leadCounts.total, published: leadCounts.fresh },
  ];

  return (
    <AdminShell email={session.user.email ?? ""} locale={locale}>
      <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {t.dashboard.intro}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.href} href={adminHref(c.href, locale)} className="card card-hover bg-white p-6">
            <p className="text-sm font-semibold text-ink-soft">{c.label}</p>
            <p className="mt-2 text-3xl font-black text-ink">{c.total}</p>
            <p className="mt-1 text-xs text-ink-soft">
              {c.href === "/admin/leads" ? (
                <>
                  <span className="font-semibold text-amber-700">{c.published} {t.common.new}</span>
                  {" · "}
                  {c.total - c.published} {t.common.processed}
                </>
              ) : (
                <>
                  <span className="font-semibold text-green-700">{c.published} {t.common.published}</span>
                  {" · "}
                  {c.total - c.published} {t.common.draft}
                </>
              )}
            </p>
          </Link>
        ))}
      </div>
      <Link href={adminHref("/admin/analytics", locale)} className="card card-hover mt-4 flex flex-wrap items-center justify-between gap-4 bg-white p-6">
        <div>
          <p className="text-sm font-semibold text-ink-soft">{t.nav.analytics}</p>
          <p className="mt-2 text-3xl font-black text-ink">
            {traffic.views} <span className="text-base font-semibold text-ink-soft">{t.analytics.weekViews}</span>
          </p>
        </div>
        <p className="text-sm text-ink-soft">
          {traffic.visitors} {t.analytics.visitors.toLowerCase()} · <span className="font-semibold text-primary">→</span>
        </p>
      </Link>
      <div className="card mt-6 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{t.dashboard.quickActions}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={adminHref("/admin/staff/new", locale)} className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-bright">{t.dashboard.addStaff}</Link>
          <Link href={adminHref("/admin/news/new", locale)} className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-bright">{t.dashboard.addNews}</Link>
          <Link href={adminHref("/admin/partners/new", locale)} className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-bright">{t.dashboard.addPartner}</Link>
          <Link href={adminHref("/admin/leads", locale)} className="rounded-card border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary">{t.nav.applications}</Link>
        </div>
      </div>
    </AdminShell>
  );
}
