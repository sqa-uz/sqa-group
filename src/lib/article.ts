/**
 * Article markup for blog posts: a small, safe Markdown dialect.
 *
 * Old articles are plain text with one paragraph per line, and they keep rendering
 * exactly as before. New articles can use (each on its own line):
 *   ## Heading / ### Subheading
 *   - bullet / 1. numbered
 *   > quote (a last line starting with "— " is the author)
 *   ::: info | success | warning   …   :::      highlighted box
 *   ![caption](https://…)                       image; several in a row form a gallery
 *   https://youtu.be/…                          YouTube video
 *   | a | b |                                   table (first row is the header)
 *   [[Button text|https://…]]                   button
 *   ---                                         divider
 * Inline: **bold**, *italic*, ==highlight==, [link](https://…).
 *
 * The parser builds plain data; nothing is ever rendered as raw HTML.
 */

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; children: Inline[] }
  | { type: "italic"; children: Inline[] }
  | { type: "mark"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

export type CalloutTone = "info" | "success" | "warning";

export type Block =
  | { type: "paragraph"; content: Inline[] }
  | { type: "heading"; level: 2 | 3; id: string; text: string; content: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; lines: Inline[][]; cite?: string }
  | { type: "callout"; tone: CalloutTone; blocks: Block[] }
  | { type: "images"; images: { src: string; caption: string }[] }
  | { type: "video"; youtubeId: string }
  | { type: "table"; head: Inline[][]; rows: Inline[][][] }
  | { type: "button"; label: string; href: string }
  | { type: "divider" };

export const CALLOUT_TONES: CalloutTone[] = ["info", "success", "warning"];

/** Links may only point to the web, mail, phone or a page of this site. */
export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/^https?:\/\/[^\s]+$/i.test(href)) return href;
  if (/^(mailto|tel):[^\s]+$/i.test(href)) return href;
  if (/^\/(?!\/)[^\s]*$/.test(href)) return href;
  return null;
}

/** Images may only come from https or this site. */
export function safeImageSrc(raw: string): string | null {
  const src = raw.trim();
  if (/^https:\/\/[^\s]+$/i.test(src)) return src;
  if (/^\/(?!\/)[^\s]*$/.test(src)) return src;
  return null;
}

export function youtubeId(raw: string): string | null {
  const url = raw.trim();
  const m =
    url.match(/^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:[^\s#]*&)?v=([\w-]{11})(?:[&#][^\s]*)?$/i) ??
    url.match(/^https?:\/\/(?:www\.)?youtube\.com\/(?:shorts|embed|live)\/([\w-]{11})(?:[?#][^\s]*)?$/i) ??
    url.match(/^https?:\/\/youtu\.be\/([\w-]{11})(?:[?#][^\s]*)?$/i);
  return m ? m[1] : null;
}

const INLINE_RULES: { re: RegExp; make: (m: RegExpExecArray) => Inline | null }[] = [
  { re: /\*\*(.+?)\*\*/, make: (m) => ({ type: "bold", children: parseInline(m[1]) }) },
  { re: /==(.+?)==/, make: (m) => ({ type: "mark", children: parseInline(m[1]) }) },
  {
    re: /\[([^\]]+)\]\(([^)\s]+)\)/,
    make: (m) => {
      const href = safeHref(m[2]);
      return href ? { type: "link", href, children: parseInline(m[1]) } : null;
    },
  },
  { re: /(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/, make: (m) => ({ type: "italic", children: parseInline(m[1]) }) },
  { re: /(?<!\w)_(?!\s)(.+?)(?<!\s)_(?!\w)/, make: (m) => ({ type: "italic", children: parseInline(m[1]) }) },
];

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let rest = text;
  while (rest) {
    let best: { index: number; length: number; node: Inline | null; raw: string } | null = null;
    for (const rule of INLINE_RULES) {
      const m = rule.re.exec(rest);
      if (m && (!best || m.index < best.index)) best = { index: m.index, length: m[0].length, node: rule.make(m), raw: m[0] };
    }
    if (!best) {
      out.push({ type: "text", text: rest });
      break;
    }
    if (best.index > 0) out.push({ type: "text", text: rest.slice(0, best.index) });
    out.push(best.node ?? { type: "text", text: best.raw });
    rest = rest.slice(best.index + best.length);
  }
  // merge neighbouring text nodes
  return out.reduce<Inline[]>((acc, node) => {
    const last = acc[acc.length - 1];
    if (node.type === "text" && last?.type === "text") last.text += node.text;
    else acc.push(node);
    return acc;
  }, []);
}

export function inlineText(nodes: Inline[]): string {
  return nodes.map((n) => (n.type === "text" ? n.text : inlineText(n.children))).join("");
}

export function slugifyHeading(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[ʻʼ'’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || "section";
}

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const BUTTON_LINE = /^\[\[([^|\]]+)\|([^\]]+)\]\]$/;
const LIST_BULLET = /^[-*•]\s+(.+)$/;
const LIST_ORDERED = /^\d+[.)]\s+(.+)$/;

function splitRow(line: string): string[] {
  return line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

function parseLines(lines: string[], ids: Map<string, number>): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // ::: callout
    const callout = line.match(/^:::\s*(info|success|warning)?\s*$/i);
    if (callout) {
      const tone = (callout[1]?.toLowerCase() ?? "info") as CalloutTone;
      const inner: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") inner.push(lines[i++]);
      i++; // closing :::
      blocks.push({ type: "callout", tone, blocks: parseLines(inner, ids) });
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length as 2 | 3;
      const content = parseInline(heading[2].trim());
      const text = inlineText(content);
      const base = slugifyHeading(text);
      const seen = ids.get(base) ?? 0;
      ids.set(base, seen + 1);
      blocks.push({ type: "heading", level, id: seen ? `${base}-${seen + 1}` : base, text, content });
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      blocks.push({ type: "divider" });
      i++;
      continue;
    }

    if (IMAGE_LINE.test(line)) {
      const images: { src: string; caption: string }[] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(IMAGE_LINE);
        if (!m) break;
        const src = safeImageSrc(m[2]);
        if (src) images.push({ src, caption: m[1].trim() });
        i++;
      }
      if (images.length) blocks.push({ type: "images", images });
      continue;
    }

    const video = youtubeId(line);
    if (video) {
      blocks.push({ type: "video", youtubeId: video });
      i++;
      continue;
    }

    const button = line.match(BUTTON_LINE);
    if (button) {
      const href = safeHref(button[2]);
      if (href) blocks.push({ type: "button", label: button[1].trim(), href });
      else blocks.push({ type: "paragraph", content: parseInline(line) });
      i++;
      continue;
    }

    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = splitRow(lines[i].trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      const [head = [], ...body] = rows;
      blocks.push({
        type: "table",
        head: head.map(parseInline),
        rows: body.map((r) => r.map(parseInline)),
      });
      continue;
    }

    if (line.startsWith(">")) {
      const raw: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        raw.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      let cite: string | undefined;
      const last = raw[raw.length - 1];
      if (raw.length > 1 && /^(—|--)\s*/.test(last)) {
        cite = last.replace(/^(—|--)\s*/, "");
        raw.pop();
      }
      blocks.push({ type: "quote", lines: raw.filter((l) => l.trim()).map(parseInline), cite });
      continue;
    }

    const ordered = LIST_ORDERED.test(line);
    if (ordered || LIST_BULLET.test(line)) {
      const re = ordered ? LIST_ORDERED : LIST_BULLET;
      const items: Inline[][] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(re);
        if (!m) break;
        items.push(parseInline(m[1]));
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    blocks.push({ type: "paragraph", content: parseInline(line) });
    i++;
  }
  return blocks;
}

export function parseArticle(body: string): Block[] {
  return parseLines(body.replace(/\r\n?/g, "\n").split("\n"), new Map());
}

export function articleHeadings(blocks: Block[]): { id: string; text: string; level: 2 | 3 }[] {
  return blocks.flatMap((b) => (b.type === "heading" ? [{ id: b.id, text: b.text, level: b.level }] : []));
}

/** Words in the visible text, for "N min read". */
export function articleWordCount(body: string): number {
  const text = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#>*_=|:\-[\]]/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(body: string): number {
  return Math.max(1, Math.round(articleWordCount(body) / 180));
}
