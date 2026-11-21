/* Company structure for the /structure page. The overview and each unit's tree follow the
   organisational charts in the annexes of the regulations (SQA.MS-N for the certification body,
   SQA.SL-N for the laboratory); the people come from the company's staff list. Labels and texts
   live in messages (structurePage). Keep the names in step with the team page when staff change. */

export type ViewId = "home" | "organ" | "lab-sqa" | "s-lab" | "quality";
export type IconId = "director" | "organ" | "lab" | "quality" | "accounting" | "hr" | "regulator" | "partner";

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

/** A person in a role card; `as` names their position (a key under structurePage.positions). */
export type Member = { id: string; as?: string };

export type OrgNode =
  | { type: "director"; icon: IconId }
  | { type: "external"; icon: IconId }
  | { type: "unit"; icon: IconId; code?: string; page?: string }
  | { type: "support"; icon: IconId }
  | { type: "role"; members: Member[]; lead?: boolean }
  | { type: "function" };

/** Node ids double as message keys under structurePage.nodes. */
export const NODES: Record<string, OrgNode> = {
  regulators: { type: "external", icon: "regulator" },
  director: { type: "director", icon: "director" },
  partners: { type: "external", icon: "partner" },
  accounting: { type: "support", icon: "accounting" },
  "lab-sqa": { type: "unit", icon: "lab", code: "O'ZAKK.SL.0162", page: "/laboratories/sqa" },
  organ: { type: "unit", icon: "organ", code: "O'ZAKK.MS.0052", page: "/certification-body" },
  quality: { type: "unit", icon: "quality" },
  "s-lab": { type: "unit", icon: "lab", code: "O'ZAKK.SL.0437", page: "/laboratories/s-lab" },
  hr: { type: "support", icon: "hr" },

  // certification body (annex A of SQA.MS-N)
  "organ-head": { type: "role", lead: true, members: [{ id: "valiyev" }] },
  "organ-staff": {
    type: "role",
    members: [
      { id: "inagamov", as: "lead" },
      { id: "gulyamov" },
      { id: "daminjonov" },
      { id: "fjorabekov" },
      { id: "tohirov" },
      { id: "ojorabekov", as: "intern" },
      { id: "qodirjonov", as: "intern" },
      { id: "habibullayev", as: "intern" },
    ],
  },
  "of-intake": { type: "function" },
  "of-decision": { type: "function" },
  "of-issue": { type: "function" },
  "of-normative": { type: "function" },
  "of-other": { type: "function" },

  // testing laboratories (annex of SQA.SL-N; S-LAB follows the same scheme)
  "lab-head": { type: "role", lead: true, members: [{ id: "ubaydullayev" }] },
  "lab-staff": {
    type: "role",
    members: [
      { id: "majidov", as: "technical" },
      { id: "ikromov", as: "lead" },
      { id: "raupova", as: "lead" },
      { id: "gadoyev" },
      { id: "toyshiyeva" },
      { id: "abdumavlonova" },
      { id: "abdusalomov" },
      { id: "mahmadaliyeva" },
    ],
  },
  "slab-head": { type: "role", lead: true, members: [{ id: "sabitov" }] },
  "slab-staff": { type: "role", members: [] },
  "lf-testing": { type: "function" },
  "lf-reports": { type: "function" },
  "lf-equipment": { type: "function" },
  "lf-normative": { type: "function" },
  "lf-uncertainty": { type: "function" },
  "lf-other": { type: "function" },

  // quality management
  "qm-lead": { type: "role", lead: true, members: [{ id: "iskandarov" }] },
};

export type Edge = [string, string, ("d" | undefined)?];

export type View = {
  /** the unit this view opens (absent on the overview) */
  head?: string;
  tiers: string[][];
  /** [from, to, "d" for a dashed link (works with)] */
  edges: Edge[];
  /** indentation level per tier on phones (defaults to the tier index) */
  mobileDepth?: Record<number, number>;
};

const ORGAN_FUNCTIONS = ["of-intake", "of-decision", "of-issue", "of-normative", "of-other"];
const LAB_FUNCTIONS = ["lf-testing", "lf-reports", "lf-equipment", "lf-normative", "lf-uncertainty", "lf-other"];

const fan = (from: string, to: string[]): Edge[] => to.map((t) => [from, t]);

export const VIEWS: Record<ViewId, View> = {
  // the top of both annexes: director, the units below, the outside bodies beside
  home: {
    tiers: [
      ["regulators", "director", "partners"],
      ["accounting", "lab-sqa", "organ", "quality", "s-lab", "hr"],
    ],
    edges: [
      ["regulators", "director", "d"],
      ["director", "partners", "d"],
      ...fan("director", ["accounting", "lab-sqa", "organ", "quality", "s-lab", "hr"]),
      ["lab-sqa", "organ", "d"],
      ["organ", "quality", "d"],
      ["quality", "s-lab", "d"],
    ],
    mobileDepth: { 0: 0, 1: 1 },
  },
  organ: {
    head: "organ",
    tiers: [["organ"], ["organ-head"], ["organ-staff"], ORGAN_FUNCTIONS],
    edges: [["organ", "organ-head"], ["organ-head", "organ-staff"], ...fan("organ-staff", ORGAN_FUNCTIONS)],
  },
  "lab-sqa": {
    head: "lab-sqa",
    tiers: [["lab-sqa"], ["lab-head"], ["lab-staff"], LAB_FUNCTIONS],
    edges: [["lab-sqa", "lab-head"], ["lab-head", "lab-staff"], ...fan("lab-staff", LAB_FUNCTIONS)],
  },
  "s-lab": {
    head: "s-lab",
    tiers: [["s-lab"], ["slab-head"], ["slab-staff"], LAB_FUNCTIONS],
    edges: [["s-lab", "slab-head"], ["slab-head", "slab-staff"], ...fan("slab-staff", LAB_FUNCTIONS)],
  },
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

/** Units each one works with (the dashed lines of the annexes). */
export const RELATED: Partial<Record<ViewId, ViewId[]>> = {
  organ: ["lab-sqa", "quality"],
  "lab-sqa": ["organ", "quality"],
  "s-lab": ["quality"],
  quality: ["organ", "lab-sqa", "s-lab"],
};

export const isView = (v: string): v is ViewId => v in VIEWS;

export function headcount(view: ViewId): number {
  return VIEWS[view].tiers.flat().reduce((n, id) => {
    const node = NODES[id];
    return n + (node.type === "role" ? node.members.length : 0);
  }, 0);
}

export const TOTAL_STAFF = (["organ", "lab-sqa", "s-lab", "quality"] as ViewId[]).reduce((n, v) => n + headcount(v), 0);
