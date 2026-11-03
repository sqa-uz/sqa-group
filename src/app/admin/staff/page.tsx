import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/AdminShell";
import LocaleBadges from "@/components/admin/LocaleBadges";
import { deleteStaff } from "@/lib/actions";
import { isLocalMediaUrl } from "@/lib/media-url";
import { adminHref, adminMessages, getAdminLocale } from "@/i18n/admin";

export const dynamic = "force-dynamic";

export default async function AdminStaffList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lang?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  const params = await searchParams;
  const { q } = params;
  const locale = getAdminLocale(params);
  const t = adminMessages[locale];
  const departmentLabel: Record<string, string> = {
    certification: t.staff.certificationBody,
    laboratory: t.staff.testingLaboratory,
    slab: t.staff.slabLaboratory,
    management: t.staff.management,
  };

  const staff = await prisma.staff.findMany({
    orderBy: { order: "asc" },
    include: { translations: true },
    where: q
      ? { translations: { some: { name: { contains: q, mode: "insensitive" } } } }
      : undefined,
  });

  return (
    <AdminShell email={session.user.email ?? ""} locale={locale}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t.staff.title}</h1>
        <Link href={adminHref("/admin/staff/new", locale)} className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-bright">
          {t.staff.add}
        </Link>
      </div>

      <form className="mt-4">
        {locale !== "uz" && <input type="hidden" name="lang" value={locale} />}
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder={t.staff.search}
          className="w-full max-w-xs rounded-card border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </form>

      <div className="card mt-4 overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">{t.staff.member}</th>
              <th className="px-4 py-3">{t.staff.department}</th>
              <th className="px-4 py-3">{t.common.translations}</th>
              <th className="px-4 py-3">{t.common.status}</th>
              <th className="px-4 py-3">{t.common.order}</th>
              <th className="px-4 py-3 text-right">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const name = s.translations.find((t) => t.locale === "uz")?.name ?? s.translations[0]?.name ?? s.slug;
              return (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.photoUrl ? (
                        <Image src={s.photoUrl} alt="" width={36} height={36} unoptimized={isLocalMediaUrl(s.photoUrl)} className="h-9 w-9 rounded-card object-cover object-top" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-card bg-band text-sm font-bold text-primary">{name.charAt(0)}</span>
                      )}
                      <span className="font-semibold">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{departmentLabel[s.department] ?? s.department}</td>
                  <td className="px-4 py-3">
                    <LocaleBadges translations={s.translations} requiredFields={["name", "position"]} locale={locale} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {s.published ? t.common.published : t.common.draft}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{s.order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/uz/team/${s.slug}`} target="_blank" className="text-xs font-semibold text-ink-soft hover:text-primary">{t.common.preview}</a>
                      <Link href={adminHref(`/admin/staff/${s.id}`, locale)} className="rounded-card border border-line px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary">{t.common.edit}</Link>
                      <form action={deleteStaff}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="rounded-card border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">{t.common.delete}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {staff.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-soft">{t.staff.noItems}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
