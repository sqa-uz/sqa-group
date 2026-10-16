import { describe, it, expect } from "vitest";
import { ITEMS, search, formatCode } from "../../src/lib/scopeSearch";

describe("certification scope data", () => {
  it("holds every position of scope O'ZAKK.MS.0052 rev. 11", () => {
    expect(ITEMS).toHaveLength(188);
    expect(ITEMS[0].n).toBe("1.1");
    expect(ITEMS.at(-1)?.n).toBe("2.29");
  });
  it("has a name, a standard and only 10-digit codes on every position", () => {
    for (const i of ITEMS) {
      expect(i.name.length).toBeGreaterThan(3);
      expect(i.norms.length).toBeGreaterThan(0);
      expect(i.codes.length).toBeGreaterThan(0);
      for (const c of i.codes) expect(c).toMatch(/^\d{10}$/);
    }
  });
});

describe("search by TN VED code", () => {
  it("matches a full code exactly", () => {
    const r = search("3406000000");
    expect(r.mode).toBe("code");
    expect(r.items.map((i) => i.n)).toEqual(["1.1"]);
  });
  it("matches a code prefix", () => {
    const r = search("3917");
    expect(r.items.length).toBeGreaterThan(3);
    expect(r.items.every((i) => i.codes.some((c) => c.startsWith("3917")))).toBe(true);
  });
  it("accepts codes typed with spaces or dots", () => {
    expect(search("3406 00 000 0").items.map((i) => i.n)).toEqual(["1.1"]);
    expect(search("3406.00").items.map((i) => i.n)).toEqual(["1.1"]);
  });
  it("falls back to the longest shared prefix when the exact code is not listed", () => {
    const r = search("3406009999");
    expect(r.mode).toBe("code");
    if (r.mode !== "code") return;
    expect(r.exact).toBe(false);
    expect(r.prefix).toBe("340600");
    expect(r.items.map((i) => i.n)).toEqual(["1.1"]);
  });
  it("returns nothing for a code outside the scope", () => {
    expect(search("0101").items).toHaveLength(0);
  });
});

describe("search by name", () => {
  it("is case-insensitive and treats ё as е", () => {
    expect(search("СВЕЧИ").items.map((i) => i.n)).toEqual(["1.1"]);
    expect(search("плёнка").items.length).toBeGreaterThan(0);
  });
  it("finds other word forms", () => {
    expect(search("плёнки").items.length).toBe(search("пленка").items.length);
    expect(search("свечей парафиновых").items.map((i) => i.n)).toEqual(["1.1"]);
  });
  it("requires every word to match", () => {
    const both = search("линолеум подоснове").items;
    expect(both.length).toBeGreaterThan(0);
    expect(search("линолеум свечи").items).toHaveLength(0);
  });
  it("finds positions by standard", () => {
    expect(search("ГОСТ 32415").items.map((i) => i.n)).toEqual(["1.2"]);
  });
  it("lists everything for an empty query", () => {
    expect(search("  ").items).toHaveLength(188);
  });
});

describe("formatCode", () => {
  it("groups a 10-digit code like the nomenclature", () => {
    expect(formatCode("3917211000")).toBe("3917 21 100 0");
  });
});
