/* Company structure for the /structure page: units, the people in each role, and the
   drill-down views. Names come from the company's own staff list; labels and texts live in
   messages (structurePage). Keep this in step with the team page when staff change. */

export type ViewId = "home" | "organ" | "lab-sqa" | "s-lab" | "quality";
export type IconId = "director" | "organ" | "lab" | "quality" | "accounting" | "hr";

/** [Latin, Cyrillic] */
export const PEOPLE: Record<string, [string, string]> = {
  valiyev: ["Xojiakbar Valiyev", "Хожиакбар Валиев"],
  inagamov: ["Shuxrat Inagamov", "Шухрат Инагамов"],
  gulyamov: ["Saidg'ani Gulyamov", "Саидгани Гулямов"],
  daminjonov: ["Ibrohim Daminjonov", "Иброхим Даминжонов"],
  fjorabekov: ["Firdavs Jo'rabekov", "Фирдавс Жорабеков"],
  tohirov: ["Mirsaid Tohirov", "Мирсаид Тохиров"],
  ojorabekov: ["Omonbek Jo'rabekov", "Омонбек Жорабеков"],
  qodirjonov: ["Ibrohim Qodirjonov", "Иброхим Кодиржонов"],
  habibullayev: ["Xurshid Habibullayev", "Хуршид Хабибуллаев"],
  ubaydullayev: ["Hamidulla Ubaydullayev", "Хамидулла Убайдуллаев"],
  majidov: ["Hamidulla Majidov", "Хамидулла Мажидов"],
  ikromov: ["Abbos Ikromov", "Аббос Икромов"],
  raupova: ["Dilfuza Raupova", "Дилфуза Раупова"],
  gadoyev: ["Shodibek Gadoyev", "Шодибек Гадоев"],
  toyshiyeva: ["Ziyodaxon Toyshiyeva", "Зиёдахон Тойшиева"],
  abdumavlonova: ["Munisa Abdumavlonova", "Муниса Абдумавлонова"],
  abdusalomov: ["Sherzod Abdusalomov", "Шерзод Абдусаломов"],
  mahmadaliyeva: ["Fayziniso Mahmadaliyeva", "Файзинисо Махмадалиева"],
  sabitov: ["G'ayrat Sabitov", "Гайрат Сабитов"],
  iskandarov: ["Suhrob Iskandarov", "Сухроб Искандаров"],
};

export type OrgNode =
  | { type: "director"; icon: IconId }
  | { type: "unit"; icon: IconId; code?: string; page?: string }
  | { type: "support"; icon: IconId }
  | { type: "role"; people: string[]; lead?: boolean };

/** Node ids double as message keys under structurePage.nodes. */
export const NODES: Record<string, OrgNode> = {
  director: { type: "director", icon: "director" },
  organ: { type: "unit", icon: "organ", code: "O'ZAKK.MS.0052", page: "/certification-body" },
  "lab-sqa": { type: "unit", icon: "lab", code: "O'ZAKK.SL.0162", page: "/laboratories/sqa" },
  "s-lab": { type: "unit", icon: "lab", code: "O'ZAKK.SL.0437", page: "/laboratories/s-lab" },
  quality: { type: "unit", icon: "quality" },
  accounting: { type: "support", icon: "accounting" },
  hr: { type: "support", icon: "hr" },

  "organ-head": { type: "role", lead: true, people: ["valiyev"] },
  "organ-lead": { type: "role", people: ["inagamov"] },
  "organ-spec": { type: "role", people: ["gulyamov", "daminjonov", "fjorabekov", "tohirov"] },
  "organ-intern": { type: "role", people: ["ojorabekov", "qodirjonov", "habibullayev"] },

  "lab-head": { type: "role", lead: true, people: ["ubaydullayev"] },
  "lab-tech": { type: "role", people: ["majidov"] },
  "lab-lead": { type: "role", people: ["ikromov", "raupova"] },
  "lab-spec": { type: "role", people: ["gadoyev", "toyshiyeva", "abdumavlonova", "abdusalomov", "mahmadaliyeva"] },

  "slab-head": { type: "role", lead: true, people: ["sabitov"] },
  "qm-lead": { type: "role", lead: true, people: ["iskandarov"] },
};

export type View = {
  /** the unit this view opens (absent on the overview) */
  head?: string;
  tiers: string[][];
  /** [from, to, "d" for a dashed link (works with)] */
  edges: [string, string, ("d" | undefined)?][];
  /** centre a card under the given cards on wide screens */
  align?: Record<string, string[]>;
  /** indentation level per tier on phones (defaults to the tier index) */
  mobileDepth?: Record<number, number>;
};

export const VIEWS: Record<ViewId, View> = {
  home: {
    tiers: [["director"], ["organ", "lab-sqa", "s-lab", "accounting", "hr"], ["quality"]],
    edges: [
      ["director", "organ"],
      ["director", "lab-sqa"],
      ["director", "s-lab"],
      ["director", "accounting"],
      ["director", "hr"],
      ["organ", "quality", "d"],
      ["lab-sqa", "quality", "d"],
    ],
    align: { quality: ["organ", "lab-sqa"] },
    mobileDepth: { 2: 1 },
  },
  organ: {
    head: "organ",
    tiers: [["organ"], ["organ-head"], ["organ-lead"], ["organ-spec"], ["organ-intern"]],
    edges: [
      ["organ", "organ-head"],
      ["organ-head", "organ-lead"],
      ["organ-lead", "organ-spec"],
      ["organ-spec", "organ-intern"],
    ],
  },
  "lab-sqa": {
    head: "lab-sqa",
    tiers: [["lab-sqa"], ["lab-head"], ["lab-tech", "lab-lead"], ["lab-spec"]],
    edges: [
      ["lab-sqa", "lab-head"],
      ["lab-head", "lab-tech"],
      ["lab-head", "lab-lead"],
      ["lab-lead", "lab-spec"],
    ],
    align: { "lab-spec": ["lab-lead"] },
  },
  "s-lab": { head: "s-lab", tiers: [["s-lab"], ["slab-head"]], edges: [["s-lab", "slab-head"]] },
  quality: { head: "quality", tiers: [["quality"], ["qm-lead"]], edges: [["quality", "qm-lead"]] },
};

/** Facts shown in the side panel; values are legal data from the accreditation certificates. */
export const FACTS: Partial<Record<ViewId, { key: "acc" | "std" | "valid"; value: string }[]>> = {
  organ: [
    { key: "acc", value: "O'ZAKK.MS.0052" },
    { key: "std", value: "O'z DSt ISO/IEC 17065:2015" },
    { key: "valid", value: "11.01.2027" },
  ],
  "lab-sqa": [
    { key: "acc", value: "O'ZAKK.SL.0162" },
    { key: "std", value: "O'z DSt ISO/IEC 17025:2019" },
    { key: "valid", value: "10.01.2027" },
  ],
  "s-lab": [
    { key: "acc", value: "O'ZAKK.SL.0437" },
    { key: "std", value: "O'z DSt ISO/IEC 17025:2019" },
    { key: "valid", value: "11.05.2031" },
  ],
};

export const RELATED: Partial<Record<ViewId, ViewId[]>> = {
  organ: ["lab-sqa", "s-lab", "quality"],
  "lab-sqa": ["organ", "s-lab", "quality"],
  "s-lab": ["organ", "lab-sqa"],
  quality: ["organ", "lab-sqa"],
};

export const isView = (v: string): v is ViewId => v in VIEWS;

export function headcount(view: ViewId): number {
  return VIEWS[view].tiers.flat().reduce((n, id) => {
    const node = NODES[id];
    return n + (node.type === "role" ? node.people.length : 0);
  }, 0);
}

export const TOTAL_STAFF = (["organ", "lab-sqa", "s-lab", "quality"] as ViewId[]).reduce((n, v) => n + headcount(v), 0);
