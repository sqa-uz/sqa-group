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
import SpinningCounter from "@/components/public/SpinningCounter";
import StaggerReveal from "@/components/public/StaggerReveal";
import LearnChevron from "@/components/public/LearnChevron";
import BeyondServices from "@/components/public/BeyondServices";
import StepsTimeline from "@/components/public/StepsTimeline";
import { ITEMS } from "@/lib/scopeSearch";

const UNIQUE_CODES = new Set(ITEMS.flatMap((i) => i.codes)).size;

/** Service photos, free under the Unsplash License (unsplash.com/license). */
const PHOTO = {
  // unsplash.com/photos/yKnIbJV0RbY: a hand ticking off a checklist (no faces)
  certification: "https://images.unsplash.com/photo-1754548930574-6a995e5eb5a7?auto=format&fit=crop&w=1600&q=80",
  // unsplash.com/photos/fXv3QaHccgA: product testing room (bicycles)
  laboratory: "https://images.unsplash.com/photo-1700727448542-50531bc60211?auto=format&fit=crop&w=1200&q=80",
  // unsplash.com/photos/PkHf7BUWbtk: electrical measurements with a tester
  sLab: "https://images.unsplash.com/photo-1758101755915-462eddc23f57?auto=format&fit=crop&w=1200&q=80",
};

/** Line icons (24px grid) for the services cards. */
const ICON = {
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.6 9h16.8M3.6 15h16.8M12 3c-2.5 2.5-3.5 5.5-3.5 9s1 6.5 3.5 9M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9",
  box: "M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8",
  scales: "M12 3v18M8 21h8M4 7h16M4 7l-2.5 7a2.5 2.5 0 0 0 5 0zM20 7l-2.5 7a2.5 2.5 0 0 0 5 0z",
  flask: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 14h9",
  gauge: "M3.5 16a9 9 0 1 1 17 0M12 15l4.5-5M13.5 15a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM6.4 10.2l1.3.9M12 6.6v1.6",
  shield: "M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6zM9 12l2 2 4-4",
};

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

/** Reference pages, each with its PDF where the page is built around one. */
const DOC_ROWS = [
  {
    href: "/accreditation/certification",
    title: "accredCertTitle",
    teaser: "accredCertTeaser",
    icon: "M6 3h9l4 4v14H6zM15 3v4h4M9 13l2 2 4-4",
    pdfs: [{ href: "/documents/sqa-certification-body-scope.pdf", label: "O'ZAKK.MS.0052" }],
  },
  {
    href: "/accreditation/laboratories",
    title: "accredLabTitle",
    teaser: "accredLabTeaser",
    icon: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 14h9",
    pdfs: [
      { href: "/documents/sqa-laboratory-scope.pdf", label: "O'ZAKK.SL.0162" },
      { href: "/documents/sqa-s-lab-scope.pdf", label: "O'ZAKK.SL.0437" },
    ],
  },
  {
    href: "/schemes",
    title: "schemesTitle",
    teaser: "schemesTeaser",
    icon: "M4 5h6v5H4zM14 14h6v5h-6zM7 10v3a2 2 0 0 0 2 2h5M14 5h6v5h-6zM17 10v4",
    pdfs: [],
  },
  {
    href: "/financing",
    title: "financingTitle",
    teaser: "financingTeaser",
    icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM14.5 9a2.5 2 0 0 0-2.5-1.5c-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.9 2.5 2-1 2-2.5 2a2.5 2 0 0 1-2.5-1.5M12 6v1.5M12 16.5V18",
    pdfs: [],
  },
] as const;

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
  const units = ta.raw("units") as { code: string; standard: string; valid: string }[];
  const chips = t.raw("searchChips") as { code: string; label: string }[];
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
          <StaggerReveal className="max-w-2xl" stagger="var(--duration-micro)">
            <p className="t-stagger-line t-stagger-line--1 mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
              {t("heroEyebrow")}
            </p>
            <h1 className="t-stagger-line t-stagger-line--2 text-3xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="t-stagger-line t-stagger-line--3 mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
              {t("heroText")}
            </p>
          </StaggerReveal>
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
                <SpinningCounter value={s.value} />
              </p>
              <p className="mt-1 max-w-[14rem] text-sm text-ink-soft">{s.label}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* SERVICES: one large card for the certification body, two for the laboratories */}
      <section className="mx-auto max-w-[1200px] px-4 py-16">
        <Reveal>
          <SectionHeading eyebrow={t("servicesSubtitle")} title={t("servicesTitle")} />
        </Reveal>
        <div className="mt-8 grid gap-5 lg:grid-cols-2 lg:grid-rows-2">
          {/* certification body: full-bleed photo with the text laid over it */}
          <Reveal className="lg:row-span-2">
            <Link
              href="/certification-body"
              className="t-learn card card-hover group relative flex h-full min-h-[380px] flex-col justify-end overflow-hidden border-0 text-white"
            >
              <Image
                src={PHOTO.certification}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover object-[55%_center] transition-transform duration-500 group-hover:scale-105"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-primary-deep from-10% via-primary-deep/55 via-45% to-transparent to-80%" />
              <span className="absolute left-6 top-6 rounded-[2px] bg-white px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary">
                ISO/IEC 17065
              </span>
              {/* floating "certificate" tile: the tick strokes itself on when the card scrolls in */}
              <div
                aria-hidden="true"
                className="cert-float absolute left-6 top-[60px] flex items-center gap-3 rounded-card border border-white/30 bg-white/15 py-2.5 pl-2.5 pr-4 shadow-[0_14px_34px_-14px_rgb(8_4_60/0.7)] backdrop-blur-md sm:left-auto sm:right-6 sm:top-6"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                  <span className="t-success-check" data-state="on-reveal">
                    <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
                      <path d="M11 18.5l4.5 4.5L25 13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
                <span className="leading-tight">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">{t("certFloatLabel")}</span>
                  <span className="mt-0.5 block text-sm font-semibold">{t("certFloatValue")}</span>
                </span>
              </div>
              <div className="relative p-6 sm:p-8">
                <p className="text-[11px] font-bold tracking-wide text-white/75">
                  {units[0]?.code} · {units[0]?.valid}
                </p>
                <h3 className="mt-2 text-2xl font-bold sm:text-3xl">{t("certBodyCardTitle")}</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">{t("certBodyCardText")}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {[
                    { icon: ICON.globe, label: t("certChipOrigin") },
                    { icon: ICON.box, label: t("certChipProducts", { n: ITEMS.length }) },
                    { icon: ICON.scales, label: t("certChipImpartial") },
                  ].map((chip, i) => (
                    <li
                      key={chip.label}
                      className="cert-chip inline-flex items-center gap-1.5 rounded-card border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                        <path d={chip.icon} />
                      </svg>
                      {chip.label}
                    </li>
                  ))}
                </ul>
                <span className="mt-5 inline-flex items-center gap-1 rounded-card bg-white px-4 py-2 text-sm font-semibold text-primary">
                  {tc("readMore")} <LearnChevron />
                </span>
              </div>
            </Link>
          </Reveal>

          {/* laboratories */}
          {[
            { title: t("lab1CardTitle"), text: t("lab1CardText"), img: PHOTO.laboratory, unit: units[1], icon: ICON.flask },
            { title: t("lab2CardTitle"), text: t("lab2CardText"), img: PHOTO.sLab, unit: units[2], icon: ICON.gauge },
          ].map((c, i) => (
            <Reveal key={c.title} delay={(i + 1) * 80}>
              <Link href="/laboratories" className="t-learn card card-hover group grid h-full overflow-hidden sm:grid-cols-[40%_1fr]">
                <div className="relative aspect-[16/9] overflow-hidden sm:aspect-auto sm:min-h-[200px]">
                  <Image
                    src={c.img}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 240px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-[2px] bg-white px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary">
                    ISO/IEC 17025
                  </span>
                </div>
                <div className="flex flex-col p-5">
                  <div className="flex items-center gap-3">
                    <span className="lab-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={c.icon} />
                      </svg>
                    </span>
                    <p className="text-[11px] font-bold tracking-wide text-ink-soft">{c.unit?.code}</p>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-ink group-hover:text-primary">{c.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{c.text}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                      <path d={ICON.shield} />
                    </svg>
                    {c.unit?.valid}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-primary">
                    {tc("readMore")} <LearnChevron />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SCOPE LOOKUP: full-width band, big field and one-click popular searches */}
      {!disabledPages.includes("what-we-certify") && (
        <section className="guilloche-soft bg-primary text-white">
          <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-14 lg:grid-cols-[1fr_1.35fr] lg:items-center">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tp("homeTitle")}</h2>
              <p className="mt-3 max-w-md text-white/85">{tp("homeText")}</p>
            </Reveal>
            <Reveal delay={80}>
              <form action={`/${locale}/what-we-certify`} method="get" role="search" className="flex gap-2">
                <label htmlFor="home-scope-q" className="sr-only">
                  {tp("searchLabel")}
                </label>
                <input
                  id="home-scope-q"
                  name="q"
                  type="search"
                  autoComplete="off"
                  placeholder={tp("searchPlaceholder")}
                  className="h-14 min-w-0 flex-1 rounded-card border-0 bg-paper px-5 text-base text-ink shadow-card outline-none placeholder:text-ink-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                />
                <button
                  type="submit"
                  className="h-14 shrink-0 rounded-card border border-white/40 bg-white/15 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/70 hover:bg-white/25"
                >
                  {tp("homeButton")}
                </button>
              </form>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm text-white/75">{t("searchPopular")}</span>
                {chips.map((c) => (
                  <Link
                    key={c.code}
                    href={{ pathname: "/what-we-certify", query: { q: c.code } }}
                    className="rounded-card border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:border-white/70 hover:bg-white/20"
                  >
                    {c.label} <span className="ml-1 text-xs tabular-nums text-white/65">{c.code}</span>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* BEYOND: management systems, export to Europe, conformity mark */}
      <section className="mx-auto max-w-[1200px] px-4 py-16">
        <BeyondServices />
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

      {/* DOCUMENTS: one list of scopes, schemes and financing, with the PDFs one click away */}
      <section className="bg-band">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-16 lg:grid-cols-[1fr_2fr]">
          <Reveal>
            <SectionHeading eyebrow={t("docsEyebrow")} title={t("docsTitle")} />
            <p className="mt-3 text-ink-soft">{t("docsText")}</p>
          </Reveal>
          <Reveal delay={80}>
            <ul className="card divide-y divide-line">
              {DOC_ROWS.map((r) => (
                <li key={r.href} className="t-learn group relative flex items-start gap-4 p-5 transition-colors hover:bg-band/60 sm:items-center">
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-band text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d={r.icon} />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={r.href} className="font-bold text-ink after:absolute after:inset-0 group-hover:text-primary">
                      {t(r.title)}
                    </Link>
                    <p className="mt-0.5 text-sm text-ink-soft">{t(r.teaser)}</p>
                    {r.pdfs.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {r.pdfs.map((f) => (
                          <a
                            key={f.href}
                            href={f.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 inline-flex items-center gap-1.5 rounded-[2px] border border-line bg-paper px-2 py-1 text-[11px] font-bold tracking-wide text-ink-soft transition-colors hover:border-primary hover:text-primary"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
                            </svg>
                            PDF · {f.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="hidden text-ink-soft group-hover:text-primary sm:block">
                    <LearnChevron size={18} />
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* PARTNERS: one row of logos drifting left */}
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
