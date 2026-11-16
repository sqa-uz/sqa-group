import { describe, expect, it } from "vitest";
import { articleHeadings, parseArticle, parseInline, readingMinutes, safeHref, youtubeId } from "@/lib/article";

describe("article markup", () => {
  it("keeps old plain-text articles as one paragraph per line", () => {
    const blocks = parseArticle("First line.\nSecond line.\n\nThird.");
    expect(blocks.map((b) => b.type)).toEqual(["paragraph", "paragraph", "paragraph"]);
  });

  it("parses headings with unique ids for the table of contents", () => {
    const blocks = parseArticle("## Sertifikatlash\ntext\n## Sertifikatlash\n### Bosqichlar");
    expect(articleHeadings(blocks)).toEqual([
      { id: "sertifikatlash", text: "Sertifikatlash", level: 2 },
      { id: "sertifikatlash-2", text: "Sertifikatlash", level: 2 },
      { id: "bosqichlar", text: "Bosqichlar", level: 3 },
    ]);
  });

  it("parses lists, quotes with author, callouts, tables, buttons and dividers", () => {
    const blocks = parseArticle(
      [
        "- one",
        "- two",
        "1. first",
        "2. second",
        "> Quality first.",
        "> — Director",
        "::: warning",
        "Check the **deadline**.",
        ":::",
        "| Code | Name |",
        "|---|---|",
        "| 3917 | Pipes |",
        "[[Apply|/apply]]",
        "---",
      ].join("\n")
    );
    expect(blocks.map((b) => b.type)).toEqual(["list", "list", "quote", "callout", "table", "button", "divider"]);
    const quote = blocks[2];
    expect(quote.type === "quote" && quote.cite).toBe("Director");
    const callout = blocks[3];
    expect(callout.type === "callout" && callout.tone).toBe("warning");
    const table = blocks[4];
    expect(table.type === "table" && table.rows.length).toBe(1);
  });

  it("groups consecutive images into one gallery and embeds YouTube", () => {
    const blocks = parseArticle(
      "![Lab](https://example.com/a.jpg)\n![](https://example.com/b.jpg)\nhttps://youtu.be/dQw4w9WgXcQ"
    );
    expect(blocks[0].type === "images" && blocks[0].images.length).toBe(2);
    expect(blocks[1]).toEqual({ type: "video", youtubeId: "dQw4w9WgXcQ" });
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe("dQw4w9WgXcQ");
  });

  it("parses inline bold, italic, highlight and links", () => {
    expect(parseInline("a **b** *c* ==d== [e](https://sqa.uz)")).toEqual([
      { type: "text", text: "a " },
      { type: "bold", children: [{ type: "text", text: "b" }] },
      { type: "text", text: " " },
      { type: "italic", children: [{ type: "text", text: "c" }] },
      { type: "text", text: " " },
      { type: "mark", children: [{ type: "text", text: "d" }] },
      { type: "text", text: " " },
      { type: "link", href: "https://sqa.uz", children: [{ type: "text", text: "e" }] },
    ]);
  });

  it("refuses unsafe links and images", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("//evil.example")).toBeNull();
    expect(parseInline("[x](javascript:alert(1))")[0].type).toBe("text");
    expect(parseArticle("![x](http://insecure.example/a.jpg)")).toEqual([]);
    expect(parseArticle("[[Go|javascript:alert(1)]]")[0].type).toBe("paragraph");
  });

  it("estimates reading time", () => {
    expect(readingMinutes("word ".repeat(10))).toBe(1);
    expect(readingMinutes("word ".repeat(900))).toBe(5);
  });
});
