import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getDisabledPageKeys } from "@/lib/pageSettings";
import AccreditationRibbon from "@/components/public/AccreditationRibbon";
import HeroVideo from "@/components/public/HeroVideo";
import PartnerMarquee from "@/components/public/PartnerMarquee";
import SectionHeading from "@/components/public/SectionHeading";
import StaffCard from "@/components/public/StaffCard";
import NewsCard from "@/components/public/NewsCard";
import Reveal from "@/components/public/Reveal";
import CountUp from "@/components/public/CountUp";
import StepsTimeline from "@/components/public/StepsTimeline";
import { ITEMS } from "@/lib/scopeSearch";

const UNIQUE_CODES = new Set(ITEMS.flatMap((i) => i.codes)).size;

/** Product groups of the accreditation scope, each with a line icon and a search that finds it. */
const GROUP_LINKS: { q: string; icon: string }[] = [
  { q: "трубы", icon: "M3 9h13a5 5 0 0 1 5 5v1M3 15h11a1 1 0 0 1 1 1v5M3 7v10M21 15h-4v6" },
  { q: "посуда", icon: "M4 11h16a8 8 0 0 1-16 0zM8 4v3M12 3v4M16 4v3M9 20h6" },
  { q: "фанера", icon: "M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4" },
  { q: "бумага", icon: "M6 3h9l4 4v14H6zM15 3v4h4M9 11h7M9 15h7M9 19h4" },
  { q: "плитки", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { q: "линолеум", icon: "M4 6a3 3 0 0 1 6 0v12a3 3 0 0 1-6 0zM7 3h13v15H10" },
  { q: "мебель", icon: "M6 3v10h12V3M5 13h14v3H5zM6 16v5M18 16v5" },
  { q: "спортивн", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.6 9h16.8M3.6 15h16.8M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" },
  { q: "велосипеды", icon: "M6 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM18 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM6 14.5l4-7h5l3 7M10 7.5h-2M12 14.5l3-7" },
  { q: "обувь", icon: "M3 17V8h5l2 4 6 1.5a4 4 0 0 1 4 3.5v1H3zM3 20h18" },
  { q: "упаковка", icon: "M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8" },
  { q: "термосы", icon: "M9 3h6v3H9zM8 6h8l1 3v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9z M7 11h10" },
];

export const revalidate = 120;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tt = await getTranslations("team");
  const tc = await getTranslations("common");
  const tp = await getTranslations("products");
  const ta = await getTranslations("about");
  const staffCount = await prisma.staff.count({ where: { published: true } });
  const steps = ta.raw("steps") as { title: string; text: string }[];
  const groups = ta.raw("groups") as string[];
  const stats = [
    { value: 3, label: ta("statAccreditations") },
    { value: ITEMS.length, label: ta("statProducts") },
    { value: UNIQUE_CODES, label: ta("statCodes") },
    ...(staffCount > 0 ? [{ value: staffCount, label: ta("statTeam") }] : []),
  ];
  const disabledPages = await getDisabledPageKeys();

  const [staff, news, partners] = await Promise.all([
    prisma.staff.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      take: 4,
      include: { translations: { where: { locale } } },
    }),
    prisma.news.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: { translations: { where: { locale } } },
    }),
    prisma.partner.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: { translations: { where: { locale } } },
    }),
  ]);

  const deptLabel = (d: string) =>
    d === "laboratory" ? tt("deptLaboratory") : d === "management" ? tt("deptManagement") : tt("deptCertification");

  const dateFmt = new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* HERO — thesis over footage: paperwork, laboratory, product testing, logistics, safety */}
      <section className="relative overflow-hidden bg-primary-deep text-white">
        <HeroVideo
          sources={[
            "/videos/hero-office.mp4",
            "/videos/hero-lab.mp4",
            "/videos/hero-testing.mp4",
            "/videos/hero-logistics.mp4",
            "/videos/hero-safety.mp4",
          ]}
        />
        <div aria-hidden="true" className="hero-shade" />
        <div className="hero-copy relative mx-auto max-w-[1200px] px-4 py-20 sm:py-24">
          <Reveal className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">{t("heroEyebrow")}</p>
            <h1 className="text-3xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">{t("heroText")}</p>
          </Reveal>
        </div>
      </section>

      {/* SIGNATURE: accreditation ribbon */}
      <AccreditationRibbon />

      {/* KEY FIGURES: count up as they scroll in */}
      <section className="border-b border-line">
        <ul className="mx-auto grid max-w-[1200px] grid-cols-2 px-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <li key={s.label} className={`py-8 lg:py-10 ${i % 2 ? "pl-6" : ""} ${i > 0 ? "lg:border-l lg:border-line lg:pl-8" : ""}`}>
              <p className="text-4xl font-black tracking-tight text-primary sm:text-5xl">
                <CountUp value={s.value} />
              </p>
              <p className="mt-1 max-w-[14rem] text-sm text-ink-soft">{s.label}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* SERVICES: certification body + two laboratories */}
      <section className="mx-auto max-w-[1200px] px-4 py-16">
        <Reveal>
          <SectionHeading eyebrow={t("servicesSubtitle")} title={t("servicesTitle")} />
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            { href: "/certification-body", title: t("certBodyCardTitle"), text: t("certBodyCardText"), badge: "ISO/IEC 17065" },
            { href: "/laboratories", title: t("lab1CardTitle"), text: t("lab1CardText"), badge: "ISO/IEC 17025" },
            { href: "/laboratories", title: t("lab2CardTitle"), text: t("lab2CardText"), badge: "O'ZAKK.SL.0437" },
          ].map((c, i) => (
            <Reveal key={i} delay={i * 80}>
              <Link href={c.href} className="card card-hover group block h-full p-6">
                <span className="inline-block rounded-none bg-band px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary">
                  {c.badge}
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-primary">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.text}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-primary">{tc("readMore")} →</span>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* SCOPE LOOKUP: jump straight into the "what we certify" search */}
        {!disabledPages.includes("what-we-certify") && (
          <Reveal delay={120}>
            <form
              action={`/${locale}/what-we-certify`}
              method="get"
              role="search"
              className="card mt-6 grid gap-4 p-6 md:grid-cols-[1fr_minmax(0,1.15fr)] md:items-center"
            >
              <div>
                <h3 className="text-lg font-bold text-ink">{tp("homeTitle")}</h3>
                <p className="mt-1 text-sm text-ink-soft">{tp("homeText")}</p>
              </div>
              <div className="flex gap-2">
                <label htmlFor="home-scope-q" className="sr-only">
                  {tp("searchLabel")}
                </label>
                <input
                  id="home-scope-q"
                  name="q"
                  type="search"
                  autoComplete="off"
                  placeholder={tp("searchPlaceholder")}
                  className="h-12 min-w-0 flex-1 rounded-card border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/70 focus:border-primary"
                />
                <button
                  type="submit"
                  className="h-12 shrink-0 rounded-card bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-bright"
                >
                  {tp("homeButton")}
                </button>
              </div>
            </form>
          </Reveal>
        )}
      </section>

      {/* HOW CERTIFICATION WORKS: the rail fills as you scroll */}
      <section className="bg-band">
        <div className="mx-auto max-w-[1200px] px-4 py-16">
          <Reveal>
            <SectionHeading eyebrow={ta("stepsEyebrow")} title={ta("stepsTitle")} />
          </Reveal>
          <StepsTimeline steps={steps} />
        </div>
      </section>

      {/* PRODUCT GROUPS: dark band, each group opens the scope search */}
      {!disabledPages.includes("what-we-certify") && (
        <section className="relative overflow-hidden bg-primary-deep text-white">
          <div className="mx-auto max-w-[1200px] px-4 py-16">
            <Reveal>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">{ta("groupsEyebrow")}</p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{ta("groupsTitle")}</h2>
              <p className="mt-3 max-w-2xl text-white/80">{ta("groupsText")}</p>
            </Reveal>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {groups.map((g, i) => (
                <li key={g}>
                  <Reveal delay={(i % 4) * 50} className="h-full">
                    <Link
                      href={{ pathname: "/what-we-certify", query: { q: GROUP_LINKS[i]?.q ?? "" } }}
                      className="group flex h-full items-start gap-3 rounded-card border border-white/15 bg-white/[0.04] p-4 transition-colors hover:border-white/40 hover:bg-white/10"
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 text-white/70 transition-colors group-hover:text-white">
                        <path d={GROUP_LINKS[i]?.icon ?? ""} />
                      </svg>
                      <span className="text-sm font-medium leading-snug text-white/90">{g}</span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
            <Link href="/what-we-certify" className="mt-8 inline-block rounded-card bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-band">
              {ta("groupsLink")} →
            </Link>
          </div>
        </section>
      )}

      {/* CERTIFICATES: compact row beside a short note */}
      <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 lg:grid-cols-[1fr_1.5fr]">
        <Reveal>
          <SectionHeading eyebrow={t("certificatesSubtitle")} title={t("certificatesTitle")} />
          <p className="mt-3 text-ink-soft">{t("certificatesText")}</p>
          <a href="https://akkred.uz" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            akkred.uz ↗
          </a>
        </Reveal>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { src: "/images/certificates/certification-body-2025.jpeg", caption: "O'ZAKK.MS.0052", href: "/documents/sqa-certification-body-certificate.pdf" },
            { src: "/images/certificates/testing-laboratory-2025.jpeg", caption: "O'ZAKK.SL.0162", href: "/documents/sqa-laboratory-certificate.pdf" },
            { src: "/images/certificates/s-lab-2026.jpeg", caption: "O'ZAKK.SL.0437", href: "/documents/sqa-s-lab-certificate.pdf" },
          ].map((c, i) => (
            <Reveal key={c.caption} delay={i * 80}>
              <a href={c.href} target="_blank" rel="noopener noreferrer" className="card card-hover block overflow-hidden">
                <figure>
                  <div className="relative aspect-[3/4] bg-white">
                    <Image src={c.src} alt={c.caption} fill sizes="(max-width: 1024px) 33vw, 240px" className="object-contain p-2" />
                  </div>
                  <figcaption className="border-t border-line px-2 py-2 text-center text-[10px] font-bold tracking-wide text-ink-soft sm:text-xs">
                    {c.caption}
                  </figcaption>
                </figure>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TEAM PREVIEW */}
      {staff.length > 0 && (
        <div className="bg-band">
        <section className="mx-auto max-w-[1200px] px-4 py-16">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow={t("teamSubtitle")} title={t("teamTitle")} />
              <Link href="/team" className="text-sm font-semibold text-primary hover:underline">
                {tc("viewAll")} →
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {staff.map((s, i) => {
              const tr = s.translations[0];
              if (!tr) return null;
              return (
                <Reveal key={s.id} delay={i * 70}>
                  <StaffCard
                    slug={s.slug}
                    name={tr.name}
                    position={tr.position}
                    photoUrl={s.photoUrl}
                    department={deptLabel(s.department)}
                  />
                </Reveal>
              );
            })}
          </div>
        </section>
        </div>
      )}

      {/* LATEST NEWS */}
      {news.length > 0 && (
        <section>
          <div className="mx-auto max-w-[1200px] px-4 py-16">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionHeading eyebrow={t("newsSubtitle")} title={t("newsTitle")} />
                <Link href="/news" className="text-sm font-semibold text-primary hover:underline">
                  {tc("viewAll")} →
                </Link>
              </div>
            </Reveal>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {news.map((n, i) => {
                const tr = n.translations[0];
                if (!tr) return null;
                return (
                  <Reveal key={n.id} delay={i * 80}>
                    <NewsCard
                      slug={n.slug}
                      title={tr.title}
                      summary={tr.summary}
                      imageUrl={n.imageUrl}
                      date={n.publishedAt ? dateFmt.format(n.publishedAt) : ""}
                      readMoreLabel={tc("readMore")}
                    />
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <div className="bg-band">
      {/* SPLIT: financing / schemes */}
      <section className="mx-auto grid max-w-[1200px] gap-5 px-4 py-16 md:grid-cols-2">
        {[
          { href: "/financing", title: t("financingTitle"), text: t("financingTeaser") },
          { href: "/schemes", title: t("schemesTitle"), text: t("schemesTeaser") },
        ].map((c, i) => (
          <Reveal key={c.href} delay={i * 80}>
            <Link href={c.href} className="card card-hover group block h-full border-l-4 border-l-primary p-7">
              <h3 className="text-lg font-bold text-ink group-hover:text-primary">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.text}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-primary">{tc("readMore")} →</span>
            </Link>
          </Reveal>
        ))}
      </section>

      {/* SPLIT: accreditation scopes */}
      <section className="mx-auto grid max-w-[1200px] gap-5 px-4 pb-16 md:grid-cols-2">
        {[
          { href: "/accreditation/certification", title: t("accredCertTitle"), text: t("accredCertTeaser") },
          { href: "/accreditation/laboratories", title: t("accredLabTitle"), text: t("accredLabTeaser") },
        ].map((c, i) => (
          <Reveal key={c.href} delay={i * 80}>
            <Link href={c.href} className="card card-hover group block h-full border-l-4 border-l-primary-deep p-7">
              <h3 className="text-lg font-bold text-ink group-hover:text-primary">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.text}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-primary">{tc("readMore")} →</span>
            </Link>
          </Reveal>
        ))}
      </section>

      </div>

      {/* PARTNERS: dual-direction carousel */}
      {partners.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-[1200px] px-4 py-16">
            <Reveal>
              <div className="text-center">
                <p className="eyebrow mb-2">{t("partnersSubtitle")}</p>
                <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t("partnersTitle")}</h2>
              </div>
            </Reveal>
            <div className="mt-10">
              <PartnerMarquee
                partners={partners
                  .map((p) => ({
                    id: p.id,
                    name: p.translations[0]?.name ?? "",
                    logoUrl: p.logoUrl,
                    websiteUrl: p.websiteUrl,
                  }))
                  .filter((p) => p.name)}
              />
            </div>
          </div>
        </section>
      )}

      {/* APPLY: submit certification application via official government portals */}
      <section className="guilloche-soft bg-primary">
        <div className="mx-auto max-w-[1200px] px-4 py-16">
          <Reveal>
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{t("applyTitle")}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">{t("applyText")}</p>
            </div>
          </Reveal>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="https://singlewindow.uz/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-card bg-white px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-band"
            >
              {t("applySingleWindow")} ↗
            </a>
            <a
              href="https://tris.uz/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-card border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t("applyTris")} ↗
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
