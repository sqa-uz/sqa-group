import Image from "next/image";
import { guardPage } from "@/lib/pageSettings";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { isLocalMediaUrl } from "@/lib/media-url";
import StaffCard from "@/components/public/StaffCard";
import Reveal from "@/components/public/Reveal";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const member = await prisma.staff.findUnique({
    where: { slug },
    include: { translations: { where: { locale } } },
  });
  return { title: member?.translations[0]?.name ?? "Team" };
}

export default async function StaffDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  await guardPage("team");
  const t = await getTranslations("team");
  const tc = await getTranslations("common");

  const member = await prisma.staff.findUnique({
    where: { slug },
    include: { translations: { where: { locale } } },
  });
  if (!member || !member.published || !member.translations[0]) notFound();
  const tr = member.translations[0];

  const deptLabel = (d: string) =>
    d === "laboratory" ? t("deptLaboratory") : d === "management" ? t("deptManagement") : t("deptCertification");

  const related = await prisma.staff.findMany({
    where: { published: true, department: member.department, NOT: { id: member.id } },
    orderBy: { order: "asc" },
    take: 4,
    include: { translations: { where: { locale } } },
  });

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <Link href="/team" className="text-sm font-semibold text-primary hover:underline">
          ← {tc("back")}
        </Link>
      </Reveal>

      <div className="mt-6 grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <figure className="card overflow-hidden">
            <div className="relative aspect-[4/5] bg-band">
              {member.photoUrl ? (
                <Image src={member.photoUrl} alt={tr.name} fill unoptimized={isLocalMediaUrl(member.photoUrl)} sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover object-top" priority />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl font-black text-primary/25">{tr.name.charAt(0)}</div>
              )}
            </div>
          </figure>
        </Reveal>

        <Reveal delay={80}>
          <span className="inline-block rounded-none bg-band px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary">
            {deptLabel(member.department)}
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{tr.name}</h1>
          <p className="mt-2 text-lg font-medium text-primary">{tr.position}</p>
          {tr.intro && <p className="mt-5 text-lg leading-relaxed text-ink-soft">{tr.intro}</p>}
          {tr.bio && (
            <div className="article-body mt-5">
              {tr.bio.split("\n").filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
          {tr.expertise && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tr.expertise.split(",").map((e) => (
                <span key={e} className="rounded-none border border-line bg-band px-3 py-1.5 text-xs font-semibold text-ink">
                  {e.trim()}
                </span>
              ))}
            </div>
          )}
          {(member.email || member.phone) && (
            <div className="card mt-8 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide">{t("contactTitle")}</h2>
              <div className="mt-3 space-y-2 text-sm">
                {member.email && (
                  <a href={`mailto:${member.email}`} className="block font-medium text-primary hover:underline">
                    {member.email}
                  </a>
                )}
                {member.phone && (
                  <a href={`tel:${member.phone.replace(/\s/g, "")}`} className="block font-medium text-ink hover:text-primary">
                    {member.phone}
                  </a>
                )}
              </div>
            </div>
          )}
        </Reveal>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <Reveal>
            <h2 className="text-xl font-bold">{t("relatedTitle")}</h2>
          </Reveal>
          <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((s, i) =>
              s.translations[0] ? (
                <Reveal key={s.id} delay={i * 60}>
                  <StaffCard
                    slug={s.slug}
                    name={s.translations[0].name}
                    position={s.translations[0].position}
                    photoUrl={s.photoUrl}
                    department={deptLabel(s.department)}
                  />
                </Reveal>
              ) : null
            )}
          </div>
        </section>
      )}
    </div>
  );
}
