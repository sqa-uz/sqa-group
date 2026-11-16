"use client";

import { useActionState } from "react";
import Image from "next/image";
import { saveNews } from "@/lib/actions";
import TranslationTabs from "./TranslationTabs";
import SubmitButton from "./SubmitButton";
import { Input, Textarea } from "./Field";
import ArticleEditor from "./ArticleEditor";
import { adminMessages, type AdminLocale } from "@/i18n/admin";
import { isLocalMediaUrl } from "@/lib/media-url";
import FileUploadButton from "./FileUploadButton";

type NewsData = {
  id: string;
  status: string;
  imageUrl: string | null;
  featured?: boolean;
  publishedAt?: Date | string | null;
  translations: { locale: string; title: string; summary: string | null; body: string }[];
};

export default function NewsForm({ news, locale }: { news?: NewsData; locale: AdminLocale }) {
  const [state, action] = useActionState(saveNews, undefined);
  const tr = (locale: string) => news?.translations.find((t) => t.locale === locale);
  const t = adminMessages[locale];
  const adminLocale = locale;
  const value = (name: string, fallback = "") => state?.values?.[name] ?? fallback;
  const published = state?.values ? state.values.publish === "on" : (news ? news.status === "published" : true);
  const featured = state?.values ? state.values.featured === "on" : Boolean(news?.featured);
  const publishedDay = news?.publishedAt
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(new Date(news.publishedAt))
    : "";

  return (
    <form key={state?.formKey ?? news?.id ?? "new"} action={action} className="space-y-6">
      {news && <input type="hidden" name="id" value={news.id} />}
      <input type="hidden" name="adminLang" value={locale} />

      <TranslationTabs
        render={(locale) => (
          <div className="space-y-4">
            <Input label={`${t.news.formTitle} (${locale})`} name={`${locale}_title`} defaultValue={value(`${locale}_title`, tr(locale)?.title ?? "")} />
            <Textarea label={`${t.news.summary} (${locale})`} name={`${locale}_summary`} rows={2} defaultValue={value(`${locale}_summary`, tr(locale)?.summary ?? "")} />
            <ArticleEditor
              label={`${t.news.body} (${locale})`}
              name={`${locale}_body`}
              defaultValue={value(`${locale}_body`, tr(locale)?.body ?? "")}
              adminLocale={adminLocale}
            />
          </div>
        )}
      />

      <div className="card bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{t.common.settings}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="publish" defaultChecked={published} className="h-4 w-4 accent-[#2003bd]" />
            <span className="text-sm font-semibold">{t.common.showOnSite}</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="featured" defaultChecked={featured} className="h-4 w-4 accent-[#2003bd]" />
            <span className="text-sm font-semibold">{t.news.featured}</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{t.news.publishDate}</span>
            <input
              type="date"
              name="publishedAt"
              defaultValue={value("publishedAt", publishedDay)}
              className="rounded-card border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
            <span className="mt-1 block text-xs text-ink-soft">{t.news.publishDateHint}</span>
          </label>
          <div className="flex items-center gap-4">
            <FileUploadButton
              name="image"
              accept="image/jpeg,image/png,image/webp"
              label={t.news.coverImage}
              hint={t.news.imageHint}
              buttonLabel={t.common.chooseFile}
              noFileLabel={t.common.noFileSelected}
            />
            {news?.imageUrl && (
              <Image src={news.imageUrl} alt="" width={96} height={54} unoptimized={isLocalMediaUrl(news.imageUrl)} className="rounded-card border border-line object-cover" />
            )}
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-card border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{state.error}</p>
      )}

      <SubmitButton pendingLabel={t.common.saving}>{news ? t.news.save : t.news.create}</SubmitButton>
    </form>
  );
}
