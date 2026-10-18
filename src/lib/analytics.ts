import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { locales } from "@/i18n/routing";

/* ---------- pure helpers (unit-tested) ---------- */

const BOT_UA = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch|go-http/i;

export function isBot(userAgent: string | null | undefined) {
  return !userAgent || BOT_UA.test(userAgent);
}

export function deviceFrom(userAgent: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

/**
 * "/ru/what-we-certify?q=1" -> { locale: "ru", path: "/what-we-certify" }.
 * Returns null for anything that is not a public page of this site.
 */
export function splitPath(raw: string): { locale: string; path: string } | null {
  if (typeof raw !== "string" || raw.length > 300 || !raw.startsWith("/")) return null;
  const clean = raw.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const [, first = "", ...rest] = clean.split("/");
  if (!(locales as readonly string[]).includes(first)) return null;
  const path = "/" + rest.join("/");
  if (!/^\/[a-z0-9\-/]*$/i.test(path)) return null;
  return { locale: first, path: path === "/" ? "/" : path.replace(/\/+$/, "") };
}

/** Host of an external referrer, or null for direct visits and our own pages. */
export function referrerHost(referrer: string | null | undefined, ownHost: string | null | undefined) {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    const own = (ownHost ?? "").split(":")[0].replace(/^www\./, "").toLowerCase();
    if (!host || host === own || host.endsWith(".vercel.app")) return null;
    return host.slice(0, 120);
  } catch {
    return null;
  }
}

/** Daily-rotating, salted hash: counts unique visitors per day without storing IPs or setting cookies. */
export function visitorId(ip: string, userAgent: string, day: string, secret: string) {
  return createHash("sha256").update(`${secret}|${day}|${ip}|${userAgent}`).digest("hex").slice(0, 24);
}

/* ---------- storage ---------- */

let tableReady: Promise<unknown> | null = null;

/** Creates the PageView table on first use, same SQL as the Prisma migration (idempotent). */
export function ensurePageViewTable() {
  tableReady ??= (async () => {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "PageView" (
      "id" TEXT NOT NULL,
      "path" TEXT NOT NULL,
      "locale" TEXT NOT NULL,
      "referrer" TEXT,
      "country" TEXT,
      "device" TEXT NOT NULL,
      "visitor" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
    )`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PageView_createdAt_idx" ON "PageView"("createdAt")`);
  })().catch((err) => {
    tableReady = null; // retry on the next request
    throw err;
  });
  return tableReady;
}

/* ---------- reporting ---------- */

export type AnalyticsReport = {
  days: number;
  views: number;
  visitors: number;
  daily: { day: string; views: number; visitors: number }[];
  pages: { label: string; count: number }[];
  referrers: { label: string; count: number }[];
  countries: { label: string; count: number }[];
  devices: { label: string; count: number }[];
  locales: { label: string; count: number }[];
  leads: number;
};

const TZ = "Asia/Tashkent";

export async function getAnalyticsReport(days: number): Promise<AnalyticsReport> {
  await ensurePageViewTable();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const top = (field: "path" | "referrer" | "country" | "device" | "locale", take = 10) =>
    prisma.pageView
      .groupBy({
        by: [field],
        where: { createdAt: { gte: since }, ...(field === "referrer" || field === "country" ? { [field]: { not: null } } : {}) },
        _count: { _all: true },
        orderBy: { _count: { [field]: "desc" } },
        take,
      })
      .then((rows) => rows.map((r) => ({ label: String(r[field] ?? ""), count: r._count._all })));

  const [totals, daily, pages, referrers, countries, devices, localeRows, leads] = await Promise.all([
    prisma.$queryRaw<{ views: bigint; visitors: bigint }[]>`
      SELECT COUNT(*) AS views, COUNT(DISTINCT "visitor") AS visitors
      FROM "PageView" WHERE "createdAt" >= ${since}`,
    prisma.$queryRaw<{ day: string; views: bigint; visitors: bigint }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS day,
             COUNT(*) AS views, COUNT(DISTINCT "visitor") AS visitors
      FROM "PageView" WHERE "createdAt" >= ${since}
      GROUP BY 1 ORDER BY 1`,
    top("path"),
    top("referrer", 8),
    top("country", 8),
    top("device", 3),
    top("locale", 3),
    prisma.lead.count({ where: { createdAt: { gte: since } } }),
  ]);

  // fill missing days with zeros so the chart has an even axis
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series: AnalyticsReport["daily"] = [];
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  for (let i = days - 1; i >= 0; i--) {
    const day = fmt.format(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
    const d = byDay.get(day);
    series.push({ day, views: Number(d?.views ?? 0), visitors: Number(d?.visitors ?? 0) });
  }

  return {
    days,
    views: Number(totals[0]?.views ?? 0),
    visitors: Number(totals[0]?.visitors ?? 0),
    daily: series,
    pages,
    referrers,
    countries,
    devices,
    locales: localeRows,
    leads,
  };
}
