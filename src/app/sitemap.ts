import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { locales } from "@/i18n/routing";

const STATIC_PATHS = [
  "",
  "/about",
  "/certification-body",
  "/what-we-certify",
  "/laboratories",
  "/team",
  "/news",
  "/financing",
  "/schemes",
  "/accreditation/certification",
  "/accreditation/laboratories",
  "/appeals",
  "/contacts",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sqa.uz";
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const p of STATIC_PATHS) {
      entries.push({ url: `${base}/${locale}${p}`, changeFrequency: "monthly", priority: p === "" ? 1 : 0.7 });
    }
  }

  const [staff, news] = await Promise.all([
    prisma.staff.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.news.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }),
  ]);

  for (const locale of locales) {
    for (const s of staff) {
      entries.push({ url: `${base}/${locale}/team/${s.slug}`, lastModified: s.updatedAt, priority: 0.5 });
    }
    for (const n of news) {
      entries.push({ url: `${base}/${locale}/news/${n.slug}`, lastModified: n.updatedAt, priority: 0.6 });
    }
  }

  return entries;
}
