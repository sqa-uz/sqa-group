"use client";

import { useRef, useState, useTransition } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { uploadArticleImage } from "@/lib/actions";
import { articleWordCount, readingMinutes, safeHref, youtubeId } from "@/lib/article";
import { docToMarkup, markupToDoc, type PMNode } from "@/lib/articleDoc";
import { adminMessages, type AdminLocale } from "@/i18n/admin";

type EditorText = (typeof adminMessages)[AdminLocale]["news"]["editor"];
type Tone = "info" | "success" | "warning";

/** Coloured box ("::: info" in the stored markup). */
const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return { tone: { default: "info" } };
  },
  parseHTML() {
    return [{ tag: "div[data-callout]", getAttrs: (el) => ({ tone: (el as HTMLElement).dataset.callout ?? "info" }) }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-callout": HTMLAttributes.tone, class: "editor-callout" }), 0];
  },
});

/** Call-to-action button ("[[Text|url]]" in the stored markup). */
const ArticleButton = Node.create({
  name: "articleButton",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return { label: { default: "" }, href: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "div[data-article-button]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-article-button": "", class: "editor-button" }, ["span", {}, `${HTMLAttributes.label} →`]];
  },
});

const ICONS: Record<string, string> = {
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
  divider: "M3 12h18",
  undo: "M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
  redo: "M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3",
};

function Icon({ name }: { name: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function ToolButton({
  icon,
  label,
  active,
  disabled,
  withText,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  withText?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 items-center gap-1.5 rounded-card px-2 text-xs font-semibold transition-colors disabled:opacity-40 ${
        active ? "bg-primary text-white" : "text-ink-soft hover:bg-white hover:text-primary"
      }`}
    >
      <Icon name={icon} />
      {withText && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />;

type Panel =
  | { kind: "link"; href: string }
  | { kind: "video"; url: string }
  | { kind: "button"; label: string; href: string }
  | { kind: "caption"; alt: string }
  | { kind: "callout" }
  | null;

/**
 * Visual article editor. People see formatted text while they write; the form receives
 * the article markup in a hidden field, which the site renders (and old articles use).
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
  const [markup, setMarkup] = useState(defaultValue);
  const [panel, setPanel] = useState<Panel>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const [, force] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false, strike: false }),
      Link.configure({ openOnClick: false, autolink: true, protocols: ["mailto", "tel"] }),
      Highlight,
      Image.configure({ inline: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ nocookie: true, controls: true, width: 640, height: 360 }),
      Placeholder.configure({ placeholder: t.placeholder }),
      Callout,
      ArticleButton,
    ],
    content: markupToDoc(defaultValue),
    editorProps: { attributes: { class: "article-editor-content", "aria-label": label } },
    onUpdate: ({ editor }) => setMarkup(docToMarkup(editor.getJSON() as PMNode)),
    onSelectionUpdate: () => force((n) => n + 1),
    onTransaction: () => force((n) => n + 1),
  });

  const chain = () => (editor as Editor).chain().focus();
  const style = editor?.isActive("heading", { level: 2 }) ? "h2" : editor?.isActive("heading", { level: 3 }) ? "h3" : "p";
  const inTable = !!editor?.isActive("table");
  const imageSelected = !!editor?.isActive("image");

  function openPanel(next: Panel) {
    setStatus(null);
    setPanel((cur) => (cur && next && cur.kind === next.kind ? null : next));
  }

  function applyPanel() {
    if (!editor || !panel) return;
    if (panel.kind === "link") {
      const href = safeHref(panel.href.trim());
      if (!panel.href.trim()) chain().extendMarkRange("link").unsetLink().run();
      else if (href) chain().extendMarkRange("link").setLink({ href }).run();
      else return setStatus(t.invalidLink);
    }
    if (panel.kind === "video") {
      const id = youtubeId(panel.url.trim());
      if (!id) return setStatus(t.invalidVideo);
      chain().setYoutubeVideo({ src: `https://www.youtube.com/watch?v=${id}` }).run();
    }
    if (panel.kind === "button") {
      const href = safeHref(panel.href.trim());
      if (!panel.label.trim() || !href) return setStatus(t.invalidButton);
      chain().insertContent({ type: "articleButton", attrs: { label: panel.label.trim(), href } }).run();
    }
    if (panel.kind === "caption") chain().updateAttributes("image", { alt: panel.alt.trim() || null }).run();
    setPanel(null);
    setStatus(null);
  }

  function insertCallout(tone: Tone) {
    if (!editor) return;
    const text = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, " ");
    chain()
      .insertContent({ type: "callout", attrs: { tone }, content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : [] }] })
      .run();
    setPanel(null);
  }

  function onImage(file: File | undefined) {
    if (!file || !editor) return;
    const data = new FormData();
    data.set("image", file);
    data.set("adminLang", adminLocale);
    setStatus(t.uploading);
    startUpload(async () => {
      const res = await uploadArticleImage(data);
      if (res.url) {
        setStatus(null);
        chain().setImage({ src: res.url }).run();
      } else {
        setStatus(res.error ?? t.uploadFailed);
      }
      if (fileInput.current) fileInput.current.value = "";
    });
  }

  const input = "min-w-0 flex-1 rounded-card border border-line bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-primary";
  const okButton = "rounded-card bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-bright";
  const enter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyPanel();
    }
  };

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <div className="rounded-card border border-line bg-white focus-within:border-primary">
        <div className="sticky top-0 z-10 rounded-t-card border-b border-line bg-band/95 backdrop-blur">
          <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1" role="toolbar" aria-label={label}>
            <select
              aria-label={t.textStyle}
              value={style}
              disabled={!editor}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "p") chain().setParagraph().run();
                else chain().setHeading({ level: v === "h2" ? 2 : 3 }).run();
              }}
              className="h-8 rounded-card border border-line bg-white px-2 text-xs font-semibold text-ink outline-none focus:border-primary"
            >
              <option value="p">{t.paragraph}</option>
              <option value="h2">{t.h2}</option>
              <option value="h3">{t.h3}</option>
            </select>
            <Divider />
            <ToolButton icon="bold" label={t.bold} active={editor?.isActive("bold")} onClick={() => chain().toggleBold().run()} />
            <ToolButton icon="italic" label={t.italic} active={editor?.isActive("italic")} onClick={() => chain().toggleItalic().run()} />
            <ToolButton icon="highlight" label={t.highlight} active={editor?.isActive("highlight")} onClick={() => chain().toggleHighlight().run()} />
            <ToolButton
              icon="link"
              label={t.link}
              active={editor?.isActive("link")}
              onClick={() => openPanel({ kind: "link", href: String(editor?.getAttributes("link").href ?? "") })}
            />
            <Divider />
            <ToolButton icon="bulletList" label={t.bulletList} active={editor?.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()} />
            <ToolButton icon="numberedList" label={t.numberedList} active={editor?.isActive("orderedList")} onClick={() => chain().toggleOrderedList().run()} />
            <ToolButton icon="quote" label={t.quote} active={editor?.isActive("blockquote")} onClick={() => chain().toggleBlockquote().run()} />
            <Divider />
            <ToolButton icon="image" label={t.image} withText disabled={uploading} onClick={() => fileInput.current?.click()} />
            <ToolButton icon="video" label={t.video} withText onClick={() => openPanel({ kind: "video", url: "" })} />
            <ToolButton icon="table" label={t.table} withText onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
            <ToolButton icon="callout" label={t.callout} withText active={editor?.isActive("callout")} onClick={() => openPanel({ kind: "callout" })} />
            <ToolButton icon="button" label={t.button} withText onClick={() => openPanel({ kind: "button", label: "", href: "" })} />
            <ToolButton icon="divider" label={t.divider} onClick={() => chain().setHorizontalRule().run()} />
            <Divider />
            <ToolButton icon="undo" label={t.undo} disabled={!editor?.can().undo()} onClick={() => chain().undo().run()} />
            <ToolButton icon="redo" label={t.redo} disabled={!editor?.can().redo()} onClick={() => chain().redo().run()} />
          </div>

          {(inTable || imageSelected || panel) && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-2.5 py-2 text-xs">
              {panel?.kind === "link" && (
                <>
                  <span className="font-semibold text-ink">{t.link}:</span>
                  <input autoFocus className={input} placeholder="https://..." value={panel.href} onChange={(e) => setPanel({ kind: "link", href: e.target.value })} onKeyDown={enter} />
                  <button type="button" className={okButton} onClick={applyPanel}>{t.apply}</button>
                  {editor?.isActive("link") && (
                    <button type="button" className="font-semibold text-ink-soft hover:text-primary" onClick={() => { chain().extendMarkRange("link").unsetLink().run(); setPanel(null); }}>
                      {t.removeLink}
                    </button>
                  )}
                </>
              )}
              {panel?.kind === "video" && (
                <>
                  <span className="font-semibold text-ink">{t.video}:</span>
                  <input autoFocus className={input} placeholder={t.videoPlaceholder} value={panel.url} onChange={(e) => setPanel({ kind: "video", url: e.target.value })} onKeyDown={enter} />
                  <button type="button" className={okButton} onClick={applyPanel}>{t.apply}</button>
                </>
              )}
              {panel?.kind === "button" && (
                <>
                  <input autoFocus className={input} placeholder={t.buttonText} value={panel.label} onChange={(e) => setPanel({ ...panel, label: e.target.value })} onKeyDown={enter} />
                  <input className={input} placeholder={t.buttonUrl} value={panel.href} onChange={(e) => setPanel({ ...panel, href: e.target.value })} onKeyDown={enter} />
                  <button type="button" className={okButton} onClick={applyPanel}>{t.apply}</button>
                </>
              )}
              {panel?.kind === "callout" && (
                <>
                  <span className="font-semibold text-ink">{t.calloutChoose}</span>
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
                      onClick={() => insertCallout(tone)}
                      className="inline-flex items-center gap-1.5 rounded-card border border-line bg-white px-2.5 py-1 font-semibold text-ink hover:border-primary"
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                      {text}
                    </button>
                  ))}
                </>
              )}
              {!panel && imageSelected && (
                <>
                  <span className="font-semibold text-ink">{t.image}:</span>
                  <button type="button" className="font-semibold text-primary hover:underline" onClick={() => openPanel({ kind: "caption", alt: String(editor?.getAttributes("image").alt ?? "") })}>
                    {t.caption}
                  </button>
                  <button type="button" className="font-semibold text-ink-soft hover:text-primary" onClick={() => chain().deleteSelection().run()}>
                    {t.remove}
                  </button>
                </>
              )}
              {panel?.kind === "caption" && (
                <>
                  <span className="font-semibold text-ink">{t.caption}:</span>
                  <input autoFocus className={input} value={panel.alt} onChange={(e) => setPanel({ kind: "caption", alt: e.target.value })} onKeyDown={enter} />
                  <button type="button" className={okButton} onClick={applyPanel}>{t.apply}</button>
                </>
              )}
              {!panel && inTable && (
                <>
                  <span className="font-semibold text-ink">{t.table}:</span>
                  {(
                    [
                      [t.addRow, () => chain().addRowAfter().run()],
                      [t.addColumn, () => chain().addColumnAfter().run()],
                      [t.deleteRow, () => chain().deleteRow().run()],
                      [t.deleteColumn, () => chain().deleteColumn().run()],
                      [t.deleteTable, () => chain().deleteTable().run()],
                    ] as const
                  ).map(([text, run]) => (
                    <button key={text} type="button" onMouseDown={(e) => e.preventDefault()} onClick={run} className="rounded-card border border-line bg-white px-2 py-1 font-semibold text-ink hover:border-primary">
                      {text}
                    </button>
                  ))}
                </>
              )}
              {panel && (
                <button type="button" className="ml-auto text-ink-soft hover:text-ink" onClick={() => { setPanel(null); setStatus(null); }}>
                  {t.cancel}
                </button>
              )}
            </div>
          )}
        </div>

        <EditorContent editor={editor} className="article-editor" />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2 text-xs text-ink-soft">
          <span>{t.hint}</span>
          <span>
            {status ? (
              <span className={uploading ? "text-primary" : "text-amber-700"}>{status}</span>
            ) : (
              <>
                {articleWordCount(markup)} {t.words} · {readingMinutes(markup)} {t.minRead}
              </>
            )}
          </span>
        </div>
      </div>

      <input type="hidden" name={name} value={markup} />
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onImage(e.target.files?.[0])} />
    </div>
  );
}
