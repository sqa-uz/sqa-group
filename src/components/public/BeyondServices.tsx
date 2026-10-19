import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/public/Reveal";
import SectionHeading from "@/components/public/SectionHeading";

type Item = { key: "management" | "export" | "mark"; title: string; text: string; link: string };

const HREF: Record<Item["key"], string> = {
  management: "/apply",
  export: "/news/sqa-group-and-ac-inorms-gmbh-our-official-partner-in-germany",
  mark: "/schemes",
};

const ICON: Record<Item["key"], string> = {
  // gear in a document: management system
  management: "M6 3h9l4 4v14H6zM15 3v4h4M12.5 11.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM12.5 9.8v1.2M12.5 16v1.2M9.8 13.5h1.2M14.6 13.5h1.2",
  // globe with arrow: export
  export: "M12 3a9 9 0 1 0 9 9M3.6 9h11M3.6 15h9M12 3c-2.5 2.5-3 13.5 0 18M12 3c1.5 1.5 2.3 4 2.6 6.5M16 14l5 0M18.5 11.5L21 14l-2.5 2.5",
  // seal with check: conformity mark
  mark: "M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.2 15.8l1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2zM8.5 12.2l2.3 2.3 4.7-4.9",
};

/** Services beyond the accredited scope: management systems, export to Europe, the conformity mark. */
export default async function BeyondServices({ heading = true }: { heading?: boolean }) {
  const t = await getTranslations("beyond");
  const items = t.raw("items") as Item[];
  return (
    <div>
      {heading && (
        <Reveal>
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        </Reveal>
      )}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {items.map((it, i) => (
          <Reveal key={it.key} delay={i * 80}>
            <Link href={HREF[it.key]} className="card card-hover group flex h-full flex-col border-t-2 border-t-primary p-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-primary">
                <path d={ICON[it.key]} />
              </svg>
              <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-primary">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{it.text}</p>
              <span className="mt-auto pt-4 text-sm font-semibold text-primary">{it.link} →</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
