import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import { adminHref, adminMessages, getAdminLocale } from "@/i18n/admin";
import { getAnalyticsReport, type AnalyticsReport } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;

function BarList({ title, rows, note, format }: { title: string; rows: { label: string; count: number }[]; note?: string; format?: (l: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="card bg-white p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">—</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="relative overflow-hidden rounded-card px-2 py-1.5 text-sm">
              <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${(r.count / max) * 100}%` }} />
              <span className="relative flex justify-between gap-3">
                <span className="truncate text-ink">{format ? format(r.label) : r.label}</span>
                <span className="font-semibold tabular-nums text-ink">{r.count}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {note && <p className="mt-3 text-xs text-ink-soft">{note}</p>}
    </section>
  );
}

function DailyChart({ data, labels }: { data: AnalyticsReport["daily"]; labels: { views: string; visitors: string } }) {
  const max = Math.max(1, ...data.map((d) => d.views));
  const w = 100 / data.length;
  return (
    <div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-48 w-full" role="img" aria-label={labels.views}>
        {data.map((d, i) => {
          const hv = (d.views / max) * 38;
          const hu = (d.visitors / max) * 38;
          return (
            <g key={d.day}>
              <title>{`${d.day}: ${d.views} ${labels.views.toLowerCase()}, ${d.visitors} ${labels.visitors.toLowerCase()}`}</title>
              <rect x={i * w + w * 0.12} y={40 - hv} width={w * 0.76} height={hv} className="fill-primary/25" />
              <rect x={i * w + w * 0.12} y={40 - hu} width={w * 0.76} height={hu} className="fill-primary" />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.day.slice(5)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-primary/25" />{labels.views}</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-primary" />{labels.visitors}</span>
      </div>
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ lang?: string; days?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  const params = await searchParams;
  const locale = getAdminLocale(params);
  const t = adminMessages[locale];
  const a = t.analytics;
  const days = RANGES.find((r) => String(r) === params.days) ?? 30;

  const report = await getAnalyticsReport(days);
  const regionNames = new Intl.DisplayNames([locale === "uz" ? "uz" : locale], { type: "region" });
  const country = (code: string) => {
    try {
      return `${regionNames.of(code) ?? code} (${code})`;
    } catch {
      return code;
    }
  };

  const kpis = [
    { label: a.views, value: report.views },
    { label: a.visitors, value: report.visitors, hint: a.visitorsHint },
    { label: a.perVisitor, value: report.visitors ? (report.views / report.visitors).toFixed(1) : "0" },
    { label: a.leads, value: report.leads },
  ];

  return (
    <AdminShell email={session.user.email ?? ""} locale={locale}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{a.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">{a.intro}</p>
        </div>
        <nav aria-label={a.range} className="flex gap-1 rounded-card border border-line bg-white p-1">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={adminHref("/admin/analytics", locale, { days: r })}
              className={`rounded-card px-3 py-1.5 text-sm font-semibold ${r === days ? "bg-primary text-white" : "text-ink-soft hover:text-primary"}`}
            >
              {r} {a.days}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card bg-white p-5">
            <p className="text-sm font-semibold text-ink-soft">{k.label}</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-ink">{k.value}</p>
            {k.hint && <p className="mt-1 text-xs text-ink-soft">{k.hint}</p>}
          </div>
        ))}
      </div>

      {report.views === 0 ? (
        <div className="card mt-6 bg-white p-6 text-sm text-ink-soft">{a.empty}</div>
      ) : (
        <>
          <section className="card mt-6 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{a.daily}</h2>
            <div className="mt-4">
              <DailyChart data={report.daily} labels={{ views: a.views, visitors: a.visitors }} />
            </div>
          </section>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <BarList title={a.pages} rows={report.pages} format={(p) => (p === "/" ? a.home : p)} />
            <BarList title={a.referrers} rows={report.referrers} note={a.direct} />
            <BarList title={a.countries} rows={report.countries} format={country} />
            <div className="grid gap-4">
              <BarList title={a.devices} rows={report.devices} format={(d) => a.device[d as keyof typeof a.device] ?? d} />
              <BarList title={a.languages} rows={report.locales} format={(l) => t.languageNames[l as keyof typeof t.languageNames] ?? l} />
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
