/**
 * Converts between the stored article markup (see article.ts) and the visual
 * editor's document (TipTap/ProseMirror JSON). The database keeps the markup, so the
 * public pages and old articles are unaffected by the editor.
 */
import { parseArticle, type Block, type Inline } from "./article";

export type PMMark = { type: string; attrs?: Record<string, unknown> };
export type PMNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  text?: string;
  marks?: PMMark[];
};

// ---------- markup -> document ----------

function inlineToNodes(nodes: Inline[], marks: PMMark[] = []): PMNode[] {
  return nodes.flatMap((n): PMNode[] => {
    switch (n.type) {
      case "text":
        return n.text ? [{ type: "text", text: n.text, ...(marks.length ? { marks } : {}) }] : [];
      case "bold":
        return inlineToNodes(n.children, [...marks, { type: "bold" }]);
      case "italic":
        return inlineToNodes(n.children, [...marks, { type: "italic" }]);
      case "mark":
        return inlineToNodes(n.children, [...marks, { type: "highlight" }]);
      case "link":
        return inlineToNodes(n.children, [...marks, { type: "link", attrs: { href: n.href } }]);
    }
  });
}

const para = (content: Inline[]): PMNode => {
  const nodes = inlineToNodes(content);
  return nodes.length ? { type: "paragraph", content: nodes } : { type: "paragraph" };
};

function blockToNodes(block: Block): PMNode[] {
  switch (block.type) {
    case "paragraph":
      return [para(block.content)];
    case "heading":
      return [{ type: "heading", attrs: { level: block.level }, content: inlineToNodes(block.content) }];
    case "list":
      return [
        {
          type: block.ordered ? "orderedList" : "bulletList",
          content: block.items.map((item) => ({ type: "listItem", content: [para(item)] })),
        },
      ];
    case "quote":
      return [
        {
          type: "blockquote",
          content: [
            ...block.lines.map(para),
            ...(block.cite ? [{ type: "paragraph", content: [{ type: "text", text: `— ${block.cite}` }] }] : []),
          ],
        },
      ];
    case "callout": {
      const inner = block.blocks.flatMap(blockToNodes);
      return [{ type: "callout", attrs: { tone: block.tone }, content: inner.length ? inner : [{ type: "paragraph" }] }];
    }
    case "images":
      return block.images.map((img) => ({ type: "image", attrs: { src: img.src, alt: img.caption || null } }));
    case "video":
      return [{ type: "youtube", attrs: { src: `https://www.youtube.com/watch?v=${block.youtubeId}` } }];
    case "table": {
      const row = (cells: Inline[][], cellType: string): PMNode => ({
        type: "tableRow",
        content: cells.map((c) => ({ type: cellType, content: [para(c)] })),
      });
      return [
        {
          type: "table",
          content: [
            ...(block.head.length ? [row(block.head, "tableHeader")] : []),
            ...block.rows.map((r) => row(r, "tableCell")),
          ],
        },
      ];
    }
    case "button":
      return [{ type: "articleButton", attrs: { label: block.label, href: block.href } }];
    case "divider":
      return [{ type: "horizontalRule" }];
  }
}

export function markupToDoc(markup: string): PMNode {
  const content = parseArticle(markup).flatMap(blockToNodes);
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

// ---------- document -> markup ----------

const MARK_ORDER = ["link", "highlight", "bold", "italic"];

function wrapMark(text: string, mark: PMMark): string {
  switch (mark.type) {
    case "bold":
      return `**${text}**`;
    case "italic":
      return `*${text}*`;
    case "highlight":
      return `==${text}==`;
    case "link":
      return `[${text}](${String(mark.attrs?.href ?? "")})`;
    default:
      return text;
  }
}

/** Inline content to one line of markup; neighbouring text with the same marks is merged first. */
function inlineToMarkup(nodes: PMNode[] = []): string {
  const runs: { text: string; marks: PMMark[] }[] = [];
  for (const n of nodes) {
    if (n.type === "hardBreak") {
      runs.push({ text: "\n", marks: [] });
      continue;
    }
    if (n.type !== "text" || !n.text) continue;
    const marks = (n.marks ?? []).filter((m) => MARK_ORDER.includes(m.type));
    const last = runs[runs.length - 1];
    if (last && JSON.stringify(last.marks) === JSON.stringify(marks)) last.text += n.text;
    else runs.push({ text: n.text, marks });
  }
  return runs
    .map(({ text, marks }) => {
      if (!marks.length || !text.trim()) return text;
      // keep spaces outside the markers so **bold** still parses
      const lead = text.match(/^\s*/)?.[0] ?? "";
      const trail = text.match(/\s*$/)?.[0] ?? "";
      let core = text.trim();
      const sorted = [...marks].sort((a, b) => MARK_ORDER.indexOf(b.type) - MARK_ORDER.indexOf(a.type));
      for (const m of sorted) core = wrapMark(core, m);
      return lead + core + trail;
    })
    .join("");
}

const textOf = (node: PMNode): string => inlineToMarkup(node.content).replace(/\n/g, " ").trim();

function youtubeUrl(src: string): string {
  const id = src.match(/(?:embed\/|v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1];
  return id ? `https://www.youtube.com/watch?v=${id}` : src;
}

function nodeToMarkup(node: PMNode): string {
  switch (node.type) {
    case "paragraph":
      return inlineToMarkup(node.content)
        .split("\n")
        .map((l) => l.trim())
        .join("\n");
    case "heading":
      return `${Number(node.attrs?.level) === 3 ? "###" : "##"} ${textOf(node)}`;
    case "bulletList":
    case "orderedList":
      return (node.content ?? [])
        .map((li, i) => {
          const text = (li.content ?? []).map((c) => (c.type === "paragraph" ? textOf(c) : nodeToMarkup(c))).filter(Boolean).join(" ");
          return `${node.type === "orderedList" ? `${i + 1}.` : "-"} ${text}`;
        })
        .join("\n");
    case "blockquote":
      return (node.content ?? [])
        .map((p) => textOf(p))
        .filter(Boolean)
        .map((l) => `> ${l}`)
        .join("\n");
    case "callout": {
      const tone = ["info", "success", "warning"].includes(String(node.attrs?.tone)) ? String(node.attrs?.tone) : "info";
      return `::: ${tone}\n${docBodyToMarkup(node.content ?? [], "\n")}\n:::`;
    }
    case "image": {
      const src = String(node.attrs?.src ?? "");
      return src ? `![${String(node.attrs?.alt ?? "").replace(/[\[\]]/g, "")}](${src})` : "";
    }
    case "youtube":
      return youtubeUrl(String(node.attrs?.src ?? ""));
    case "table": {
      const rows = (node.content ?? []).map((row) => (row.content ?? []).map((cell) => (cell.content ?? []).map(textOf).join(" ").replace(/\|/g, "/")));
      if (!rows.length) return "";
      const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
      return [line(rows[0]), `|${rows[0].map(() => "---").join("|")}|`, ...rows.slice(1).map(line)].join("\n");
    }
    case "articleButton":
      return `[[${String(node.attrs?.label ?? "").replace(/[|\]]/g, "")}|${String(node.attrs?.href ?? "")}]]`;
    case "horizontalRule":
      return "---";
    default:
      return node.content ? docBodyToMarkup(node.content) : "";
  }
}

function docBodyToMarkup(nodes: PMNode[], sep = "\n\n"): string {
  const parts: string[] = [];
  nodes.forEach((n, i) => {
    const text = nodeToMarkup(n);
    if (!text.trim()) return;
    // consecutive images stay on adjacent lines so they form one gallery
    const joinTight = n.type === "image" && nodes[i - 1]?.type === "image" && parts.length;
    if (joinTight) parts[parts.length - 1] += `\n${text}`;
    else parts.push(text);
  });
  return parts.join(sep);
}

export function docToMarkup(doc: PMNode): string {
  return docBodyToMarkup(doc.content ?? []).trim();
}
