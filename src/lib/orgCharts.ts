import type { OrgChart } from "@/components/public/OrgStructure";

/* Organisational charts as drawn in the annexes of the units' regulations.
   Solid = reports to, dashed = works with. Labels and texts live in messages. */

const TOP_ROW = {
  cols: "lg:grid-cols-6",
  items: [
    { id: "regulators", col: "lg:col-span-2" },
    { id: "director", col: "order-first col-span-2 sm:order-none sm:col-span-1 lg:col-span-2" },
    { id: "partners", col: "lg:col-span-2" },
  ],
};

const UNDER_MAIN = "col-span-2 sm:col-span-1 sm:col-start-2 lg:col-start-3";

/** Certification body, annex A of SQA.MS-N. */
export const certificationBodyChart: OrgChart = {
  main: "organ",
  solid: [
    ["director", "accounting"],
    ["director", "labSqa"],
    ["director", "organ"],
    ["director", "quality"],
    ["director", "slab"],
    ["director", "hr"],
    ["organ", "head"],
    ["head", "specialists"],
    ["specialists", "fIntake"],
    ["specialists", "fDecision"],
    ["specialists", "fIssue"],
    ["specialists", "fNormative"],
    ["specialists", "fOther"],
  ],
  dashed: [
    ["regulators", "director"],
    ["director", "partners"],
    ["labSqa", "organ"],
    ["organ", "quality"],
    ["quality", "slab"],
    ["quality", "head"],
    ["quality", "specialists"],
  ],
  rows: [
    TOP_ROW,
    {
      cols: "lg:grid-cols-6",
      items: [{ id: "accounting" }, { id: "labSqa" }, { id: "organ" }, { id: "quality" }, { id: "slab" }, { id: "hr" }],
    },
    { cols: "lg:grid-cols-6", items: [{ id: "head", col: UNDER_MAIN }] },
    { cols: "lg:grid-cols-6", items: [{ id: "specialists", col: UNDER_MAIN }] },
    {
      cols: "lg:grid-cols-5",
      items: [{ id: "fIntake" }, { id: "fDecision" }, { id: "fIssue" }, { id: "fNormative" }, { id: "fOther" }],
    },
  ],
  external: ["regulators", "partners"],
  functions: ["fIntake", "fDecision", "fIssue", "fNormative", "fOther"],
};

/** SQA testing laboratory, annex of SQA.SL-N. */
export const sqaLabChart: OrgChart = {
  main: "lab",
  solid: [
    ["director", "accounting"],
    ["director", "organ"],
    ["director", "lab"],
    ["director", "quality"],
    ["director", "slab"],
    ["director", "hr"],
    ["lab", "head"],
    ["head", "specialists"],
    ["specialists", "fTesting"],
    ["specialists", "fReports"],
    ["specialists", "fEquipment"],
    ["specialists", "fNormative"],
    ["specialists", "fUncertainty"],
    ["specialists", "fOther"],
  ],
  dashed: [
    ["regulators", "director"],
    ["director", "partners"],
    ["organ", "lab"],
    ["lab", "quality"],
    ["quality", "slab"],
    ["quality", "head"],
    ["quality", "specialists"],
  ],
  rows: [
    TOP_ROW,
    {
      cols: "lg:grid-cols-6",
      items: [{ id: "accounting" }, { id: "organ" }, { id: "lab" }, { id: "quality" }, { id: "slab" }, { id: "hr" }],
    },
    { cols: "lg:grid-cols-6", items: [{ id: "head", col: UNDER_MAIN }] },
    { cols: "lg:grid-cols-6", items: [{ id: "specialists", col: UNDER_MAIN }] },
    {
      cols: "lg:grid-cols-6",
      items: [
        { id: "fTesting" },
        { id: "fReports" },
        { id: "fEquipment" },
        { id: "fNormative" },
        { id: "fUncertainty" },
        { id: "fOther" },
      ],
    },
  ],
  external: ["regulators", "partners"],
  functions: ["fTesting", "fReports", "fEquipment", "fNormative", "fUncertainty", "fOther"],
};

/** S-LAB testing laboratory: same structure as the SQA laboratory, with S-LAB as the unit in focus. */
const UNDER_SLAB = "col-span-2 sm:col-span-1 sm:col-start-2 lg:col-start-5";

export const sLabChart: OrgChart = {
  main: "slab",
  solid: [
    ["director", "accounting"],
    ["director", "organ"],
    ["director", "lab"],
    ["director", "quality"],
    ["director", "slab"],
    ["director", "hr"],
    ["slab", "head"],
    ["head", "specialists"],
    ["specialists", "fTesting"],
    ["specialists", "fReports"],
    ["specialists", "fEquipment"],
    ["specialists", "fNormative"],
    ["specialists", "fUncertainty"],
    ["specialists", "fOther"],
  ],
  dashed: [
    ["regulators", "director"],
    ["director", "partners"],
    ["lab", "quality"],
    ["quality", "slab"],
    ["quality", "head"],
    ["quality", "specialists"],
  ],
  rows: [
    TOP_ROW,
    {
      cols: "lg:grid-cols-6",
      items: [{ id: "accounting" }, { id: "organ" }, { id: "lab" }, { id: "quality" }, { id: "slab" }, { id: "hr" }],
    },
    { cols: "lg:grid-cols-6", items: [{ id: "head", col: UNDER_SLAB }] },
    { cols: "lg:grid-cols-6", items: [{ id: "specialists", col: UNDER_SLAB }] },
    sqaLabChart.rows[4],
  ],
  external: ["regulators", "partners"],
  functions: sqaLabChart.functions,
};
