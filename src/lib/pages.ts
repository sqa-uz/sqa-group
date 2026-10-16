/** Registry of public pages whose visibility can be toggled from the admin panel.
   `key` is the stable id stored in the PageSetting table. A missing row = enabled. */
export type PageDef = {
  key: string;
  href: string; // locale-relative public route
  navKey: string; // translation key in the "nav" namespace
  label: string; // English label shown in the admin panel
  group: "main" | "more";
};

export const PAGES: PageDef[] = [
  { key: "about", href: "/about", navKey: "about", label: "About", group: "main" },
  { key: "certification-body", href: "/certification-body", navKey: "certificationBody", label: "Certification body", group: "main" },
  { key: "laboratories", href: "/laboratories", navKey: "laboratories", label: "Laboratories", group: "main" },
  { key: "team", href: "/team", navKey: "team", label: "Team", group: "main" },
  { key: "news", href: "/news", navKey: "news", label: "Blog", group: "main" },
  { key: "contacts", href: "/contacts", navKey: "contacts", label: "Contacts", group: "main" },
  { key: "apply", href: "/apply", navKey: "apply", label: "Apply", group: "more" },
  { key: "financing", href: "/financing", navKey: "financing", label: "Financing", group: "more" },
  { key: "schemes", href: "/schemes", navKey: "schemes", label: "Certification schemes", group: "more" },
  { key: "accreditation-certification", href: "/accreditation/certification", navKey: "accreditationCertification", label: "Accreditation — certification", group: "more" },
  { key: "accreditation-laboratories", href: "/accreditation/laboratories", navKey: "accreditationLaboratories", label: "Accreditation — laboratories", group: "more" },
  { key: "appeals", href: "/appeals", navKey: "appeals", label: "Appeals & complaints", group: "more" },
];

export const PAGE_KEYS = new Set(PAGES.map((p) => p.key));
