/** The two accredited testing laboratories, each with its own page under /laboratories/<slug>. */
export type Lab = {
  slug: "sqa" | "s-lab";
  /** index in about.units (code, standard, validity) */
  unit: number;
  title: "lab1Title" | "lab2Title";
  text: "lab1Text" | "lab2Text";
  photo: string;
  certificate: { img: string; caption: string; href: string };
};

export const LABS: Lab[] = [
  {
    slug: "sqa",
    unit: 1,
    title: "lab1Title",
    text: "lab1Text",
    // unsplash.com/photos/fXv3QaHccgA: product testing room (Unsplash License)
    photo: "https://images.unsplash.com/photo-1700727448542-50531bc60211?auto=format&fit=crop&w=1200&q=80",
    certificate: {
      img: "/images/certificates/testing-laboratory-2025.jpeg",
      caption: "O'ZAKK.SL.0162",
      href: "/documents/sqa-laboratory-certificate.pdf",
    },
  },
  {
    slug: "s-lab",
    unit: 2,
    title: "lab2Title",
    text: "lab2Text",
    // unsplash.com/photos/PkHf7BUWbtk: electrical measurements with a tester (Unsplash License)
    photo: "https://images.unsplash.com/photo-1758101755915-462eddc23f57?auto=format&fit=crop&w=1200&q=80",
    certificate: {
      img: "/images/certificates/s-lab-2026.jpeg",
      caption: "O'ZAKK.SL.0437",
      href: "/documents/sqa-s-lab-certificate.pdf",
    },
  },
];

export const labBySlug = (slug: string) => LABS.find((l) => l.slug === slug);
