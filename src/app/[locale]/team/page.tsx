import { getTranslations, setRequestLocale } from "next-intl/server";
import { guardPage } from "@/lib/pageSettings";
import { prisma } from "@/lib/prisma";
import StaffCard from "@/components/public/StaffCard";
import Reveal from "@/components/public/Reveal";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "team" });
  return { title: t("title") };
}

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await guardPage("team");
  const t = await getTranslations("team");

  const staff = await prisma.staff.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: { translations: { where: { locale } } },
  });

  const deptLabel = (d: string) =>
    d === "laboratory" ? t("deptLaboratory") : d === "slab" ? t("deptSlab") : d === "specialists" ? t("deptSpecialists") : d === "management" ? t("deptManagement") : t("deptCertification");

  const groups: { key: string; label: string }[] = [
    { key: "management", label: t("deptManagement") },
    { key: "specialists", label: t("deptSpecialists") },
    { key: "certification", label: t("deptCertification") },
    { key: "laboratory", label: t("deptLaboratory") },
    { key: "slab", label: t("deptSlab") },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14">
      <Reveal>
        <p className="eyebrow mb-2">{t("subtitle")}</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
      </Reveal>

      {staff.length === 0 && <p className="mt-10 text-ink-soft">{t("emptyState")}</p>}

      {groups.map((g) => {
        const members = staff.filter((s) => s.department === g.key && s.translations[0]);
        if (members.length === 0) return null;
        return (
          <section key={g.key} className="mt-12">
            <Reveal>
              <h2 className="border-l-4 border-primary pl-3 text-xl font-bold">{g.label}</h2>
            </Reveal>
            <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {members.map((s, i) => (
                <Reveal key={s.id} delay={(i % 4) * 60}>
                  <StaffCard
                    slug={s.slug}
                    name={s.translations[0].name}
                    position={s.translations[0].position}
                    photoUrl={s.photoUrl}
                    department={deptLabel(s.department)}
                  />
                </Reveal>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
