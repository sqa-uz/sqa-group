"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loginAction } from "@/lib/actions";
import { adminHref, adminMessages, type AdminLocale } from "@/i18n/admin";
import { locales } from "@/i18n/routing";
import { ADMIN_TAB_SESSION_KEY } from "./AdminTabSessionGuard";

const LANGUAGE_LABELS: Record<AdminLocale, string> = { uz: "O'z", ru: "Рус", en: "Eng" };

export default function AdminLoginForm({ locale }: { locale: AdminLocale }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const t = adminMessages[locale];

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm bg-white p-8">
        <div className="flex flex-col items-center">
          <Image src="/images/logo/logo-black.jpg" alt="SQA Group" width={64} height={64} className="rounded-card" />
          <h1 className="mt-4 text-lg font-bold">{t.auth.title}</h1>
          <div className="mt-4 flex items-center rounded-card border border-line bg-paper p-0.5" role="group" aria-label="Language">
            {locales.map((nextLocale) => (
              <Link
                key={nextLocale}
                href={adminHref("/admin/login", nextLocale)}
                className={`rounded-[6px] px-2.5 py-1 text-xs font-semibold transition-colors ${
                  locale === nextLocale ? "bg-primary text-white" : "text-ink-soft hover:text-primary"
                }`}
              >
                {LANGUAGE_LABELS[nextLocale]}
              </Link>
            ))}
          </div>
        </div>
        <form
          action={action}
          className="mt-6 space-y-4"
          onSubmit={() => {
            sessionStorage.setItem(ADMIN_TAB_SESSION_KEY, "active");
          }}
        >
          <input type="hidden" name="adminLang" value={locale} />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t.auth.email}</span>
            <input
              name="email"
              type="text"
              required
              autoComplete="username"
              className="w-full rounded-card border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t.auth.password}</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-card border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          {state?.error && (
            <p className="rounded-card border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-card bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-bright disabled:opacity-60"
          >
            {pending ? t.auth.signingIn : t.auth.signIn}
          </button>
        </form>
      </div>
    </div>
  );
}
