"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import SuccessCheck from "./SuccessCheck";
import { submitApplication, type LeadState } from "@/lib/leads";

const inputCls =
  "w-full rounded-card border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary";

export default function ApplicationForm({ defaultService }: { defaultService?: string }) {
  const t = useTranslations("apply");
  const locale = useLocale();
  const [state, action, pending] = useActionState<LeadState | undefined, FormData>(submitApplication, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-card border border-green-200 bg-green-50 p-6 text-center">
        <SuccessCheck className="mx-auto text-green-600" />
        <p className="mt-3 font-semibold text-green-800">{t("success")}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {/* honeypot — hidden from real users */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("name")}</span>
          <input name="name" required maxLength={200} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("phone")}</span>
          <input name="phone" required maxLength={50} placeholder="+998" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("email")}</span>
          <input name="email" type="email" maxLength={200} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("company")}</span>
          <input name="company" maxLength={200} className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("serviceType")}</span>
        <select name="serviceType" required defaultValue={defaultService ?? "certification"} className={inputCls}>
          <option value="certification">{t("opt1")}</option>
          <option value="testing">{t("opt2")}</option>
          <option value="surveillance">{t("opt3")}</option>
          <option value="other">{t("opt4")}</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("message")}</span>
        <textarea name="message" required rows={4} maxLength={4000} className={inputCls} />
      </label>

      {state?.error && <p className="text-sm font-medium text-red-600">{t("error")}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-card bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-bright disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
