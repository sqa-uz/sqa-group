"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitComplaint, type ComplaintState } from "@/lib/complaints";

const inputCls =
  "w-full rounded-card border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary";

export default function ComplaintForm() {
  const t = useTranslations("appeals");
  const locale = useLocale();
  const [state, action, pending] = useActionState<ComplaintState | undefined, FormData>(submitComplaint, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-card border border-green-200 bg-green-50 p-6 text-center">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true" className="mx-auto text-green-600">
          <circle cx="18" cy="18" r="17" stroke="currentColor" strokeOpacity="0.4" />
          <path d="M11 18.5l4.5 4.5L25 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-3 font-semibold text-green-800">{t("formSuccess")}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="rounded-card border border-line bg-band p-4">
        <p className="text-sm leading-relaxed text-ink-soft">{t("formLead")}</p>
        <a
          href="/documents/complaints-and-appeals.docx"
          download="complaints-and-appeals.docx"
          className="mt-3 inline-flex rounded-card border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          {t("downloadCta")}
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("submissionType")}</span>
          <select name="submissionType" required defaultValue="complaint" className={inputCls}>
            <option value="complaint">{t("submissionComplaint")}</option>
            <option value="appeal">{t("submissionAppeal")}</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("applicantName")}</span>
          <input name="applicantName" required maxLength={200} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("organization")}</span>
          <input name="organization" maxLength={200} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("applicantRole")}</span>
          <input name="applicantRole" maxLength={160} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("phone")}</span>
          <input name="phone" required maxLength={50} placeholder="+998" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("email")}</span>
          <input name="email" required type="email" maxLength={200} className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("postalAddress")}</span>
        <input name="postalAddress" maxLength={400} className={inputCls} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("relatedActivity")}</span>
          <select name="relatedActivity" required defaultValue="certification" className={inputCls}>
            <option value="certification">{t("activityCertification")}</option>
            <option value="testing">{t("activityTesting")}</option>
            <option value="surveillance">{t("activitySurveillance")}</option>
            <option value="decision">{t("activityDecision")}</option>
            <option value="other">{t("activityOther")}</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("referenceNumber")}</span>
          <input name="referenceNumber" maxLength={160} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("decisionDate")}</span>
          <input name="decisionDate" type="date" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("eventDate")}</span>
          <input name="eventDate" type="date" className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("complaintSubject")}</span>
        <input name="subject" required maxLength={240} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("details")}</span>
        <textarea name="details" required rows={5} maxLength={5000} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("grounds")}</span>
        <textarea name="grounds" rows={4} maxLength={3000} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("requestedOutcome")}</span>
        <textarea name="requestedOutcome" rows={3} maxLength={2000} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("attachmentsDescription")}</span>
        <textarea name="attachmentsDescription" rows={3} maxLength={2000} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("signatureName")}</span>
        <input name="signatureName" required maxLength={200} className={inputCls} />
      </label>

      {state?.error && <p className="text-sm font-medium text-red-600">{t("formError")}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-card bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-bright disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? t("formSending") : t("formSubmit")}
      </button>
    </form>
  );
}
