import { describe, expect, it } from "vitest";
import { parseArticle } from "@/lib/article";
import { docToMarkup, markupToDoc } from "@/lib/articleDoc";

const SAMPLE = [
  "## Sertifikatlash",
  "Oddiy **qalin** va *kursiv*, ==ajratilgan== hamda [havola](https://sqa.uz).",
  "- birinchi",
  "- ikkinchi",
  "1. bir",
  "2. ikki",
  "> Sifat birinchi.",
  "> — Direktor",
  "::: warning",
  "Muddatni **tekshiring**.",
  ":::",
  "![Laboratoriya](https://example.com/a.jpg)",
  "![](https://example.com/b.jpg)",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "| Kod | Nomi |",
  "|---|---|",
  "| 3917 | Quvurlar |",
  "[[Ariza berish|/uz/apply]]",
  "---",
  "### Yakun",
].join("\n");

describe("visual editor document <-> article markup", () => {
  it("round-trips every block type without changing what the site shows", () => {
    const again = docToMarkup(markupToDoc(SAMPLE));
    expect(parseArticle(again)).toEqual(parseArticle(SAMPLE));
  });

  it("keeps old plain-text articles as paragraphs", () => {
    const old = "Birinchi abzats.\nIkkinchi abzats.";
    expect(parseArticle(docToMarkup(markupToDoc(old)))).toEqual(parseArticle(old));
  });

  it("writes marks from editor text nodes", () => {
    const md = docToMarkup({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Salom " },
            { type: "text", text: "dunyo", marks: [{ type: "bold" }, { type: "link", attrs: { href: "https://sqa.uz" } }] },
            { type: "text", text: " " },
          ],
        },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Bo'lim" }] },
        { type: "youtube", attrs: { src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" } },
      ],
    });
    expect(md).toBe("Salom [**dunyo**](https://sqa.uz)\n\n## Bo'lim\n\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });

  it("gives an empty paragraph for an empty article", () => {
    expect(markupToDoc("")).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });
});
