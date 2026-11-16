"use client";

import { useRef, useState, useTransition } from "react";
import { uploadArticleImage } from "@/lib/actions";
import { parseArticle, readingMinutes, articleWordCount } from "@/lib/article";
import { adminMessages, type AdminLocale } from "@/i18n/admin";
import ArticleBody from "@/components/public/ArticleBody";

type EditorText = (typeof adminMessages)[AdminLocale]["news"]["editor"];

const ICONS: Record<string, string> = {
  h2: "M4 6v12M12 6v12M4 12h8M16 10l2.5-1.5V18M15.5 18h5",
  h3: "M4 6v12M11 6v12M4 12h7M15.5 9.5c.6-.6 1.3-1 2.2-1 1.2 0 2 .8 2 1.8s-.8 1.7-2 1.7c1.3 0 2.3.8 2.3 2s-1 2-2.3 2c-1 0-1.8-.4-2.4-1.1",
  bold: "M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z",
  italic: "M10 5h8M6 19h8M14 5l-4 14",
  highlight: "M9 11l-5 5v3h3l5-5M14 6l4 4M12 8l4 4-5 5-4-4z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  bulletList: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  numberedList: "M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M4 9h3M4 14.5c.4-.6 1-1 1.6-1 .8 0 1.4.5 1.4 1.2 0 1.3-3 2.2-3 3.8h3",
  quote: "M7 7h4v5c0 2.5-1.5 4-4 5M14 7h4v5c0 2.5-1.5 4-4 5",
  callout: "M4 5h16v11H9l-5 4zM12 8.5v3M12 14h.01",
  table: "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14",
  button: "M3 8h18v8H3zM8 12h8",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9h.01",
  video: "M3 6h18v12H3zM10 9.5v5l4.5-2.5z",
  divider: "M3 12h18M7 7h10M7 17h10",
};

function Icon({ name }: { name: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/**
 * Article body editor: a plain textarea (the form submits it as is) with a toolbar
 * that inserts the article markup, image upload, and a live preview of the public page.
 */
export default function ArticleEditor({
  name,
  label,
  defaultValue,
  adminLocale,
}: {
  name: string;
  label: string;
  defaultValue: string;
  adminLocale: AdminLocale;
}) {
  const t: EditorText = adminMessages[adminLocale].news.editor;
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [calloutOpen, setCalloutOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const area = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  /** Replace the current selection, then put the caret/selection back where it is useful. */
  function apply(edit: (before: string, selected: string, after: string) => { text: string; selStart: number; selEnd: number }) {
    const el = area.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const { text, selStart, selEnd } = edit(value.slice(0, start), value.slice(start, end), value.slice(end));
    setValue(text);
    setMode("write");
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    });
  }

  const wrap = (open: string, close: string, placeholder: string) =>
    apply((before, selected, after) => {
      const inner = selected || placeholder;
      return {
        text: before + open + inner + close + after,
        selStart: before.length + open.length,
        selEnd: before.length + open.length + inner.length,
      };
    });

  /** Prefix every selected line (or the current line). */
  const prefixLines = (prefix: (i: number) => string, placeholder: string) =>
    apply((before, selected, after) => {
      const lineStart = before.lastIndexOf("\n") + 1;
      const head = before.slice(0, lineStart);
      const lineHead = before.slice(lineStart);
      const nextBreak = after.indexOf("\n");
      const lineTail = nextBreak === -1 ? after : after.slice(0, nextBreak);
      const tail = nextBreak === -1 ? "" : after.slice(nextBreak);
      const source = lineHead + selected + lineTail || placeholder;
      const lines = source.split("\n").map((l, i) => prefix(i) + l.replace(/^(#{2,3}\s+|[-*•]\s+|\d+[.)]\s+|>\s?)/, ""));
      const block = lines.join("\n");
      return { text: head + block + tail, selStart: head.length + block.length, selEnd: head.length + block.length };
    });

  /** Insert a standalone block on its own lines. */
  const insertBlock = (block: string, selectFrom?: number, selectLength?: number) =>
    apply((before, selected, after) => {
      const lead = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
      const trail = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
      void selected;
      const at = before.length + lead.length;
      return {
        text: before + lead + block + trail + after,
        selStart: selectFrom !== undefined ? at + selectFrom : at + block.length,
        selEnd: selectFrom !== undefined ? at + selectFrom + (selectLength ?? 0) : at + block.length,
      };
    });

  const toolRunners = (): { key: string; title: string; run: () => void }[] => [
    { key: "h2", title: t.h2, run: () => prefixLines(() => "## ", t.h2) },
    { key: "h3", title: t.h3, run: () => prefixLines(() => "### ", t.h3) },
    { key: "bold", title: t.bold, run: () => wrap("**", "**", t.bold) },
    { key: "italic", title: t.italic, run: () => wrap("*", "*", t.italic) },
    { key: "highlight", title: t.highlight, run: () => wrap("==", "==", t.highlight) },
    {
      key: "link",
      title: t.link,
      run: () => {
        const url = window.prompt(t.linkPrompt, "https://");
        if (url && url !== "https://") wrap("[", `](${url.trim()})`, t.link);
      },
    },
    { key: "bulletList", title: t.bulletList, run: () => prefixLines(() => "- ", t.bulletList) },
    { key: "numberedList", title: t.numberedList, run: () => prefixLines((i) => `${i + 1}. `, t.numberedList) },
    { key: "quote", title: t.quote, run: () => prefixLines(() => "> ", t.quote) },
    { key: "callout", title: t.callout, run: () => setCalloutOpen((o) => !o) },
    {
      key: "table",
      title: t.table,
      run: () => insertBlock("| A | B | C |\n|---|---|---|\n| 1 | 2 | 3 |\n| 4 | 5 | 6 |", 2, 1),
    },
    {
      key: "button",
      title: t.button,
      run: () => {
        const text = window.prompt(t.buttonTextPrompt);
        if (!text) return;
        const url = window.prompt(t.buttonUrlPrompt, "https://");
        if (url && url !== "https://") insertBlock(`[[${text.trim()}|${url.trim()}]]`);
      },
    },
    { key: "image", title: t.image, run: () => fileInput.current?.click() },
    {
      key: "video",
      title: t.video,
      run: () => {
        const url = window.prompt(t.videoPrompt, "https://www.youtube.com/watch?v=");
        if (url && /youtu/.test(url)) insertBlock(url.trim());
      },
    },
    { key: "divider", title: t.divider, run: () => insertBlock("---") },
  ];
  const runTool = (key: string) => toolRunners().find((tool) => tool.key === key)?.run();
  const tools = (
    [
      ["h2", t.h2], ["h3", t.h3], ["bold", t.bold], ["italic", t.italic], ["highlight", t.highlight], ["link", t.link],
      ["bulletList", t.bulletList], ["numberedList", t.numberedList], ["quote", t.quote], ["callout", t.callout],
      ["table", t.table], ["button", t.button], ["image", t.image], ["video", t.video], ["divider", t.divider],
    ] as const
  ).map(([key, title]) => ({ key, title }));

  function onImage(file: File | undefined) {
    if (!file) return;
    const data = new FormData();
    data.set("image", file);
    data.set("adminLang", adminLocale);
    setStatus(t.uploading);
    startUpload(async () => {
      const res = await uploadArticleImage(data);
      if (res.url) {
        setStatus(null);
        insertBlock(`![](${res.url})`, 2, 0);
      } else {
        setStatus(res.error ?? t.uploadFailed);
      }
      if (fileInput.current) fileInput.current.value = "";
    });
  }

  const words = articleWordCount(value);
  const blocks = mode === "preview" ? parseArticle(value) : [];
  const tab = (m: "write" | "preview", text: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      className={`rounded-card px-3 py-1.5 text-xs font-semibold transition-colors ${mode === m ? "bg-primary text-white" : "text-ink-soft hover:text-ink"}`}
    >
      {text}
    </button>
  );

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
        <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
        <div className="flex gap-1 rounded-card border border-line p-0.5">
          {tab("write", t.write)}
          {tab("preview", t.preview)}
        </div>
      </div>

      <div className="rounded-card border border-line bg-white focus-within:border-primary">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-band/80 px-1.5 py-1 backdrop-blur" role="toolbar" aria-label={label}>
          {tools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              title={tool.title}
              aria-label={tool.title}
              aria-expanded={tool.key === "callout" ? calloutOpen : undefined}
              disabled={tool.key === "image" && uploading}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => runTool(tool.key)}
              className="flex h-8 w-8 items-center justify-center rounded-card text-ink-soft transition-colors hover:bg-white hover:text-primary disabled:opacity-40"
            >
              <Icon name={tool.key} />
            </button>
          ))}
          {calloutOpen && (
            <div className="flex items-center gap-1 pl-1">
              {(
                [
                  ["info", t.calloutInfo, "bg-primary"],
                  ["success", t.calloutSuccess, "bg-emerald-600"],
                  ["warning", t.calloutWarning, "bg-amber-500"],
                ] as const
              ).map(([tone, text, dot]) => (
                <button
                  key={tone}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setCalloutOpen(false);
                    insertBlock(`::: ${tone}\n${text}\n:::`, tone.length + 5, text.length);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-card border border-line bg-white px-2 py-1 text-xs font-semibold text-ink hover:border-primary"
                >
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  {text}
                </button>
              ))}
            </div>
          )}
        </div>

        <textarea
          ref={area}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={18}
          hidden={mode === "preview"}
          className="block w-full resize-y bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed text-ink outline-none"
        />
        {mode === "preview" && (
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            {blocks.length ? <ArticleBody blocks={blocks} /> : <p className="text-sm text-ink-soft">{t.emptyPreview}</p>}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2 text-xs text-ink-soft">
          <span>
            {words} {t.words} · {readingMinutes(value)} {t.minRead}
          </span>
          {status && <span className={uploading ? "text-primary" : "text-amber-700"}>{status}</span>}
        </div>
      </div>

      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onImage(e.target.files?.[0])} />

      <details className="mt-2 text-xs text-ink-soft">
        <summary className="cursor-pointer font-semibold hover:text-primary">{t.help}</summary>
        <ul className="mt-2 space-y-1 rounded-card bg-band px-4 py-3 font-mono leading-relaxed">
          {t.helpLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
