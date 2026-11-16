"use client";

import { useEffect, useState } from "react";

/** Thin bar at the top of the window that fills as the reader moves through the article. */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const read = Math.min(Math.max(-rect.top + window.innerHeight * 0.25, 0), Math.max(total, 1));
      setProgress(total > 0 ? read / total : 1);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]" aria-hidden="true">
      <div className="h-full origin-left bg-primary-bright" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

/** Table of contents that marks the section currently on screen. */
export function ArticleToc({ title, headings }: { title: string; headings: { id: string; text: string; level: 2 | 3 }[] }) {
  const [active, setActive] = useState(headings[0]?.id);
  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  return (
    <nav aria-label={title}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{title}</p>
      <ul className="mt-3 space-y-1 border-l border-line">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? "location" : undefined}
              className={`-ml-px block border-l-2 py-1.5 text-sm leading-snug transition-colors ${h.level === 3 ? "pl-6" : "pl-4"} ${
                active === h.id ? "border-primary font-semibold text-primary" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const SHARE_ICONS = {
  telegram: "M21.5 4.5L2.8 11.7c-.9.4-.9 1.6.1 1.9l4.6 1.4 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.4 4.7 3.4c.6.4 1.4.1 1.5-.6L23 5.8c.2-.9-.7-1.6-1.5-1.3zM9 14.8l9.4-7.3-7.7 8.7",
  facebook: "M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z",
  linkedin: "M6 9v12M6 4.5v.5M10 21v-7a3 3 0 0 1 6 0v7M10 12v9M16 14v7h4v-7a5 5 0 0 0-8-4",
  whatsapp: "M3.5 20.5l1.3-4.4A8.5 8.5 0 1 1 8 19.3zM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .9a5 5 0 0 1-2.8-2.8l.9-1-1-2z",
};

export function ShareButtons({ url, title, label, copyLabel, copiedLabel }: { url: string; title: string; label: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const tx = encodeURIComponent(title);
  const links: { key: keyof typeof SHARE_ICONS; name: string; href: string }[] = [
    { key: "telegram", name: "Telegram", href: `https://t.me/share/url?url=${u}&text=${tx}` },
    { key: "facebook", name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: "linkedin", name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { key: "whatsapp", name: "WhatsApp", href: `https://wa.me/?text=${tx}%20${u}` },
  ];
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-card border border-line text-ink-soft transition-colors hover:border-primary hover:bg-primary hover:text-white";

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <a key={l.key} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.name} title={l.name} className={btn}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={SHARE_ICONS[l.key]} />
            </svg>
          </a>
        ))}
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* clipboard blocked: nothing to do */
            }
          }}
          aria-label={copied ? copiedLabel : copyLabel}
          title={copied ? copiedLabel : copyLabel}
          className={btn}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={copied ? "M5 12.5l4.5 4.5L19 7.5" : "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"} />
          </svg>
        </button>
      </div>
      <span className="sr-only" aria-live="polite">{copied ? copiedLabel : ""}</span>
    </div>
  );
}
