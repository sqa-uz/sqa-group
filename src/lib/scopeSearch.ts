import scope from "@/data/certification-scope.json";

export type ScopeItem = { n: string; s: string; name: string; norms: string[]; codes: string[] };

export const ITEMS = scope.items as ScopeItem[];
const MIN_FALLBACK_DIGITS = 4;

/** Lower-case, unify ё/е and the several apostrophes used in Uzbek Latin. */
export function normalize(s: string) {
  return s.toLowerCase().replace(/ё/g, "е").replace(/[’‘`ʻʼ]/g, "'");
}

/** Drop a word's inflectional ending so "плёнки" finds "плёнка" and "трубы" finds "трубки". */
const ENDING = /[аеиоуыэюяйь']+$/;
export function stem(word: string) {
  if (word.length < 5 || /\d/.test(word)) return word;
  // Long words lose their last two letters (-ых, -ами, -ого), then any trailing vowels.
  const s = (word.length >= 7 ? word.slice(0, -2) : word).replace(ENDING, "");
  return s.length >= 4 ? s : word;
}

const HAYSTACK = ITEMS.map((i) => normalize(`${i.name} ${i.norms.join(" ")}`));

export type Result =
  | { mode: "all"; items: ScopeItem[] }
  | { mode: "code"; digits: string; prefix: string; exact: boolean; items: ScopeItem[] }
  | { mode: "text"; tokens: string[]; items: ScopeItem[] };

export function search(query: string): Result {
  const q = query.trim();
  if (!q) return { mode: "all", items: ITEMS };

  // A TN VED code may be pasted with spaces or dots: "3917 21 100 0", "3917.21".
  const digits = q.replace(/[\s.\-]/g, "");
  if (/^\d{2,10}$/.test(digits)) {
    const byPrefix = (p: string) => ITEMS.filter((i) => i.codes.some((c) => c.startsWith(p)));
    const hits = byPrefix(digits);
    if (hits.length) return { mode: "code", digits, prefix: digits, exact: true, items: hits };
    // No position starts with the full code: fall back to the longest shared prefix.
    for (let len = digits.length - 1; len >= MIN_FALLBACK_DIGITS; len--) {
      const p = digits.slice(0, len);
      const near = byPrefix(p);
      if (near.length) return { mode: "code", digits, prefix: p, exact: false, items: near };
    }
    return { mode: "code", digits, prefix: digits, exact: true, items: [] };
  }

  const tokens = normalize(q).split(/\s+/).filter(Boolean).map(stem);
  const items = ITEMS.filter((_, idx) => tokens.every((t) => HAYSTACK[idx].includes(t)));
  return { mode: "text", tokens, items };
}

export function formatCode(c: string) {
  // 3917211000 -> 3917 21 100 0, the way codes are printed in the TN VED nomenclature
  return c.length === 10 ? `${c.slice(0, 4)} ${c.slice(4, 6)} ${c.slice(6, 9)} ${c.slice(9)}` : c;
}
