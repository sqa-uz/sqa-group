"use client";

import { useActionState } from "react";
import Image from "next/image";
import { saveStaff } from "@/lib/actions";
import TranslationTabs from "./TranslationTabs";
import SubmitButton from "./SubmitButton";
import { Input, Textarea, Select } from "./Field";
import { adminMessages, type AdminLocale } from "@/i18n/admin";
import { isLocalMediaUrl } from "@/lib/media-url";
import FileUploadButton from "./FileUploadButton";

type StaffData = {
  id: string;
  department: string;
  order: number;
  published: boolean;
  email: string | null;
  linkedin: string | null;
  phone: string | null;
  photoUrl: string | null;
  translations: { locale: string; name: string; position: string; intro: string | null; bio: string | null; expertise: string | null }[];
};

export default function StaffForm({ staff, locale }: { staff?: StaffData; locale: AdminLocale }) {
  const [state, action] = useActionState(saveStaff, undefined);
  const tr = (locale: string) => staff?.translations.find((t) => t.locale === locale);
  const t = adminMessages[locale];
  const value = (name: string, fallback = "") => state?.values?.[name] ?? fallback;
  const published = state?.values ? state.values.published === "on" : (staff?.published ?? true);

  return (
    <form key={state?.formKey ?? staff?.id ?? "new"} action={action} className="space-y-6">
      {staff && <input type="hidden" name="id" value={staff.id} />}
      <input type="hidden" name="adminLang" value={locale} />

      <TranslationTabs
        render={(locale) => (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={`${t.staff.name} (${locale})`} name={`${locale}_name`} defaultValue={value(`${locale}_name`, tr(locale)?.name ?? "")} />
              <Input label={`${t.staff.position} (${locale})`} name={`${locale}_position`} defaultValue={value(`${locale}_position`, tr(locale)?.position ?? "")} />
            </div>
            <Textarea label={`${t.staff.intro} (${locale})`} name={`${locale}_intro`} rows={2} defaultValue={value(`${locale}_intro`, tr(locale)?.intro ?? "")} />
            <Textarea label={`${t.staff.bio} (${locale})`} name={`${locale}_bio`} rows={5} defaultValue={value(`${locale}_bio`, tr(locale)?.bio ?? "")} />
            <Input label={`${t.staff.expertise} (${locale})`} name={`${locale}_expertise`} defaultValue={value(`${locale}_expertise`, tr(locale)?.expertise ?? "")} />
          </div>
        )}
      />

      <div className="card bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{t.common.settings}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select label={t.staff.department} name="department" defaultValue={value("department", staff?.department ?? "certification")}>
            <option value="certification">{t.staff.certificationBody}</option>
            <option value="laboratory">{t.staff.testingLaboratory}</option>
            <option value="slab">{t.staff.slabLaboratory}</option>
            <option value="management">{t.staff.management}</option>
            <option value="specialists">{t.staff.specialists}</option>
          </Select>
          <Input label={t.staff.sortOrder} name="order" type="number" min={0} max={10000} defaultValue={value("order", String(staff?.order ?? 0))} />
          <label className="flex items-end gap-2 pb-2">
            <input type="checkbox" name="published" defaultChecked={published} className="h-4 w-4 accent-[#2003bd]" />
            <span className="text-sm font-semibold">{t.common.showOnSite}</span>
          </label>
          <Input label={t.staff.email} name="email" type="email" defaultValue={value("email", staff?.email ?? "")} />
          <Input label={t.staff.phone} name="phone" defaultValue={value("phone", staff?.phone ?? "")} />
          <Input label={t.staff.linkedin} name="linkedin" type="url" placeholder="https://linkedin.com/in/..." defaultValue={value("linkedin", staff?.linkedin ?? "")} />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <FileUploadButton
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            label={t.staff.photo}
            hint={t.staff.photoHint}
            buttonLabel={t.common.chooseFile}
            noFileLabel={t.common.noFileSelected}
          />
          {staff?.photoUrl && (
            <Image src={staff.photoUrl} alt="" width={56} height={70} unoptimized={isLocalMediaUrl(staff.photoUrl)} className="rounded-card border border-line object-cover object-top" />
          )}
        </div>
      </div>

      {state?.error && (
        <p className="rounded-card border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{state.error}</p>
      )}

      <SubmitButton pendingLabel={t.common.saving}>{staff ? t.staff.save : t.staff.create}</SubmitButton>
    </form>
  );
}
