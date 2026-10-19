import Image from "next/image";
import { guardPage } from "@/lib/pageSettings";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import Reveal from "@/components/public/Reveal";
import SectionHeading from "@/components/public/SectionHeading";
import { ITEMS } from "@/lib/scopeSearch";
import BeyondServices from "@/components/public/BeyondServices";

type Unit = { title: string; code: string; standard: string; text: string; valid: string; href: string };
type Card = { title: string; text: string };

// Figures that follow the data rather than being typed into the copy
const UNIQUE_CODES = new Set(ITEMS.flatMap((i) => i.codes)).size;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), description: t("intro") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await guardPage("about");
  const t = await getTranslations("about");
  const tc = await getTranslations("contacts");
  const tn = await getTranslations("nav");
  const staffCount = await prisma.staff.count({ where: { published: true } });

  const units = t.raw("units") as Unit[];
  const groups = t.raw("groups") as string[];
  const principles = t.raw("principles") as Card[];
  const steps = t.raw("steps") as Card[];
  const story = t.raw("story") as string[];
  const timeline = t.raw("timeline") as { year: string; text: string }[];

  const stats = [
    { value: units.length, label: t("statAccreditations") },
    { value: ITEMS.length, label: t("statProducts") },
    { value: UNIQUE_CODES, label: t("statCodes") },
    ...(staffCount > 0 ? [{ value: staffCount, label: t("statTeam") }] : []),
  ];

  return (
    <div>
      {/* intro + company details */}
      <div className="mx-auto max-w-[1200px] px-4 py-14">
        <Reveal>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
        </Reveal>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <Reveal className="max-w-3xl">
            <p className="eyebrow mb-2">{t("storyEyebrow")}</p>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t("storyTitle")}</h2>
            <div className="article-body mt-5">
              {story.map((p, i) => (
                <p key={i} className={i === story.length - 1 ? "font-semibold text-ink" : undefined}>
                  {p}
                </p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink">{t("detailsTitle")}</h2>
              <dl className="mt-4 space-y-4">
                {[
                  { label: t("detailsName"), value: t("detailsNameValue") },
                  { label: t("detailsAddress"), value: tc("address") },
                  { label: t("detailsPhone"), value: "+998 95 195 80 40", href: "tel:+998951958040" },
                  { label: t("detailsEmail"), value: "info@sqa.uz", href: "mailto:info@sqa.uz" },
                ].map((d) => (
                  <div key={d.label} className="border-l-2 border-primary pl-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{d.label}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-ink">
                      {d.href ? (
                        <a href={d.href} className="hover:text-primary">
                          {d.value}
                        </a>
                      ) : (
                        d.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <Image src="/images/office/office.jpg" alt="" width={400} height={260} className="mt-6 w-full rounded-card border border-line object-cover" />
            </div>
          </Reveal>
        </div>

        {/* key figures */}
        <Reveal delay={60}>
          <ul className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line lg:grid-cols-4">
            {stats.map((s) => (
              <li key={s.label} className="bg-paper p-5 sm:p-6">
                <p className="text-3xl font-black tracking-tight text-primary sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-ink-soft">{s.label}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* milestones */}
      <section className="mx-auto max-w-[1200px] px-4 pb-16">
        <ol className="relative grid gap-6 border-l-2 border-line pl-6 md:grid-cols-4 md:gap-5 md:border-l-0 md:border-t-2 md:pl-0 md:pt-6">
          {timeline.map((m, i) => (
            <li key={m.year} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-card bg-primary md:-top-[31px] md:left-0"
              />
              <Reveal delay={i * 80}>
                <p className="text-3xl font-black tracking-tight text-primary">{m.year}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{m.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* accredited units */}
      <section className="bg-band">
        <div className="mx-auto max-w-[1200px] px-4 py-16">
          <Reveal>
            <SectionHeading eyebrow={t("unitsEyebrow")} title={t("unitsTitle")} />
          </Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {units.map((u, i) => (
              <Reveal key={u.code} delay={i * 80}>
                <Link href={u.href} className="card card-hover group flex h-full flex-col p-6">
                  <span className="self-start rounded-[2px] bg-band px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary">{u.code}</span>
                  <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-primary">{u.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-ink-soft">{u.standard}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{u.text}</p>
                  {u.valid && <p className="mt-auto pt-4 text-xs font-medium text-ink-soft">{u.valid}</p>}
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* beyond the accredited scope */}
      <section className="mx-auto max-w-[1200px] px-4 py-16">
        <BeyondServices />
      </section>

      {/* product groups */}
      <section className="mx-auto max-w-[1200px] px-4 py-16">
        <Reveal>
          <SectionHeading eyebrow={t("groupsEyebrow")} title={t("groupsTitle")} />
          <p className="mt-3 max-w-3xl text-ink-soft">{t("groupsText")}</p>
        </Reveal>
        <Reveal delay={80}>
          <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <li key={g} className="flex gap-3 text-sm leading-snug text-ink">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-[2px] bg-primary" />
                {g}
              </li>
            ))}
          </ul>
          <Link href="/what-we-certify" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
            {t("groupsLink")} →
          </Link>
        </Reveal>
      </section>

      {/* principles */}
      <section className="bg-band">
        <div className="mx-auto max-w-[1200px] px-4 py-16">
          <Reveal>
            <SectionHeading eyebrow={t("principlesEyebrow")} title={t("principlesTitle")} />
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((p, i) => (
              <Reveal key={p.title} delay={i * 60}>
                <div className="card h-full p-6">
                  <h3 className="font-bold text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.text}</p>
                  {i === principles.length - 1 && (
                    <Link href="/appeals" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                      {tn("appeals")} →
                    </Link>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* certification steps */}
      <section className="mx-auto max-w-[1200px] px-4 py-16">
        <Reveal>
          <SectionHeading eyebrow={t("stepsEyebrow")} title={t("stepsTitle")} />
        </Reveal>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 50} className="flex h-full gap-4 rounded-card border border-line bg-paper p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] bg-primary text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
        <Link href="/schemes" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
          {tn("schemes")} →
        </Link>

        <Reveal delay={80}>
          <div className="guilloche mt-12 rounded-card p-7 text-white">
            <h2 className="text-lg font-bold">{t("ctaTitle")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{t("ctaText")}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/apply" className="rounded-card bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-band">
                {tn("request")} →
              </Link>
              <Link href="/contacts" className="rounded-card border border-white/60 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                {tn("contacts")}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
