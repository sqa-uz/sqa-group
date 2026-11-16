/* eslint-disable @next/next/no-img-element -- article images come from any https host the editor pastes */
import type { Block, CalloutTone, Inline } from "@/lib/article";

const CALLOUT: Record<CalloutTone, { box: string; icon: string; path: string }> = {
  info: {
    box: "border-primary/25 bg-primary/[0.06]",
    icon: "bg-primary text-white",
    path: "M12 8h.01M11 12h1v5h1",
  },
  success: {
    box: "border-emerald-500/30 bg-emerald-500/[0.07]",
    icon: "bg-emerald-600 text-white",
    path: "M8 12.5l2.5 2.5L16 9.5",
  },
  warning: {
    box: "border-amber-500/35 bg-amber-500/[0.08]",
    icon: "bg-amber-500 text-white",
    path: "M12 7.5v5.5M12 16.5h.01",
  },
};

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function InlineNodes({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.type) {
          case "text":
            return <span key={i}>{n.text}</span>;
          case "bold":
            return (
              <strong key={i} className="font-bold text-ink">
                <InlineNodes nodes={n.children} />
              </strong>
            );
          case "italic":
            return (
              <em key={i}>
                <InlineNodes nodes={n.children} />
              </em>
            );
          case "mark":
            return (
              <mark key={i} className="rounded-[3px] bg-primary/15 px-1 text-ink">
                <InlineNodes nodes={n.children} />
              </mark>
            );
          case "link":
            return (
              <a
                key={i}
                href={n.href}
                {...(isExternal(n.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
              >
                <InlineNodes nodes={n.children} />
              </a>
            );
        }
      })}
    </>
  );
}

function BlockNode({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p>
          <InlineNodes nodes={block.content} />
        </p>
      );
    case "heading": {
      const Tag = block.level === 2 ? "h2" : "h3";
      return (
        <Tag
          id={block.id}
          className={
            block.level === 2
              ? "mb-4 mt-10 scroll-mt-32 text-2xl font-black leading-snug tracking-tight text-ink"
              : "mb-3 mt-8 scroll-mt-32 text-xl font-bold leading-snug text-ink"
          }
        >
          <InlineNodes nodes={block.content} />
        </Tag>
      );
    }
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={`mb-5 space-y-2 pl-6 leading-relaxed text-ink-soft ${
            block.ordered ? "list-decimal marker:font-bold marker:text-primary" : "list-disc marker:text-primary"
          }`}
        >
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              <InlineNodes nodes={item} />
            </li>
          ))}
        </Tag>
      );
    }
    case "quote":
      return (
        <figure className="my-8 border-l-4 border-primary bg-band px-6 py-5">
          <blockquote className="text-lg font-medium italic leading-relaxed text-ink">
            {block.lines.map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">
                <InlineNodes nodes={line} />
              </p>
            ))}
          </blockquote>
          {block.cite && <figcaption className="mt-3 text-sm font-semibold text-primary">— {block.cite}</figcaption>}
        </figure>
      );
    case "callout": {
      const style = CALLOUT[block.tone];
      return (
        <aside className={`my-7 flex gap-4 rounded-card border p-5 ${style.box}`}>
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.icon}`} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d={style.path} />
            </svg>
          </span>
          <div className="min-w-0 flex-1 [&>*:last-child]:mb-0 [&_p]:text-ink">
            {block.blocks.map((b, i) => (
              <BlockNode key={i} block={b} />
            ))}
          </div>
        </aside>
      );
    }
    case "images":
      return (
        <div className={`my-8 grid gap-3 ${block.images.length === 1 ? "" : block.images.length === 2 || block.images.length === 4 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          {block.images.map((img, i) => (
            <figure key={i} className="overflow-hidden rounded-card border border-line bg-band">
              <img src={img.src} alt={img.caption} loading="lazy" className="h-full max-h-[560px] w-full object-cover" />
              {img.caption && <figcaption className="bg-paper px-4 py-2.5 text-sm text-ink-soft">{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      );
    case "video":
      return (
        <div className="my-8 aspect-video overflow-hidden rounded-card border border-line bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${block.youtubeId}`}
            title="YouTube"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      );
    case "table":
      return (
        <div className="my-7 overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            {block.head.length > 0 && (
              <thead className="bg-primary text-white">
                <tr>
                  {block.head.map((cell, i) => (
                    <th key={i} className="px-4 py-3 font-semibold">
                      <InlineNodes nodes={cell} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-t border-line odd:bg-paper even:bg-band">
                  {row.map((cell, c) => (
                    <td key={c} className="px-4 py-3 text-ink-soft">
                      <InlineNodes nodes={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "button":
      return (
        <p className="my-7">
          <a
            href={block.href}
            {...(isExternal(block.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="inline-flex items-center gap-2 rounded-card bg-primary px-5 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-primary-bright"
          >
            {block.label}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </p>
      );
    case "divider":
      return <hr className="my-10 border-0 border-t border-line" />;
  }
}

export default function ArticleBody({ blocks, className = "" }: { blocks: Block[]; className?: string }) {
  return (
    <div className={`article-body text-base ${className}`}>
      {blocks.map((block, i) => (
        <BlockNode key={i} block={block} />
      ))}
    </div>
  );
}
