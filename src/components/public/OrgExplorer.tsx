"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { isLocalMediaUrl } from "@/lib/media-url";
import {
  FACTS,
  NODES,
  PEOPLE,
  RELATED,
  TOTAL_STAFF,
  VIEWS,
  headcount,
  isView,
  type IconId,
  type ViewId,
} from "@/lib/orgExplorer";

/* Drill-down company structure: the overview shows the units; choosing one flies its card to
   the head of its own tree and the people in it fan out below, with the details beside. */

const ICONS: Record<IconId, React.ReactNode> = {
  director: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18M11 12.5v2h2v-2" />
    </>
  ),
  organ: (
    <>
      <path d="M6 3h9l4 4v6" />
      <path d="M6 3a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h5" />
      <path d="M15 3v4h4M8.5 9h6M8.5 12.5h4" />
      <circle cx="17" cy="17" r="3" />
      <path d="M15.6 19.6 15 22.5l2-1 2 1-.6-2.9" />
    </>
  ),
  lab: (
    <>
      <path d="M9 3h6M10 3v6.5L4.8 18.3A1.8 1.8 0 0 0 6.4 21h11.2a1.8 1.8 0 0 0 1.6-2.7L14 9.5V3" />
      <path d="M7.2 15h9.6" />
    </>
  ),
  quality: (
    <>
      <path d="M12 3 5 6v5.2c0 4.4 2.9 7.9 7 9.8 4.1-1.9 7-5.4 7-9.8V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  accounting: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <rect x="8" y="6" width="8" height="3.5" rx=".8" />
      <path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01" />
    </>
  ),
  regulator: (
    <>
      <path d="M3 10 12 4l9 6" />
      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
    </>
  ),
  partner: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="m9.8 9 1.5 1.5 2.9-2.9" />
      <path d="M8.6 13 7.5 20l4.5-2.2 4.5 2.2-1.1-7" />
    </>
  ),
  hr: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.8 14.3A5 5 0 0 1 21 19.5" />
    </>
  ),
};

function Icon({ id, className = "h-5 w-5" }: { id: IconId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[id]}
    </svg>
  );
}

const Arrow = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const EASE = "cubic-bezier(.2,.8,.2,1)";

function elbow(x1: number, y1: number, x2: number, y2: number) {
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  if (Math.abs(dx) < 1) return `M${x1},${y1} V${y2}`;
  const r = Math.min(10, Math.abs(dx) / 2, (y2 - y1) / 2);
  const s = Math.sign(dx);
  return `M${x1},${y1} V${my - r} Q${x1},${my} ${x1 + s * r},${my} H${x2 - s * r} Q${x2},${my} ${x2},${my + r} V${y2}`;
}
function spine(x: number, y1: number, cx: number, cy: number) {
  const r = Math.max(0, Math.min(8, (cx - x) / 2, cy - y1));
  return `M${x},${y1} V${cy - r} Q${x},${cy} ${x + r},${cy} H${cx}`;
}

type Drawn = { p: SVGPathElement; dot: SVGCircleElement | null; tier: number; dashed: boolean };

export default function OrgExplorer({ photos = {} }: { photos?: Record<string, string> }) {
  const t = useTranslations("structurePage");
  const locale = useLocale();
  const [view, setView] = useState<ViewId>("home");
  const stage = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const aside = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const prev = useRef<ViewId | null>(null);
  const fromRect = useRef<DOMRect | null>(null);
  const busy = useRef(0);
  /** fade-out animations of the leaving view; React reuses some of those nodes, so they are cancelled once the new view is in */
  const leaving = useRef<Animation[]>([]);

  const person = (id: string) => (locale === "ru" ? PEOPLE[id][1] : PEOPLE[id][0]);
  const initials = (s: string) =>
    s
      .split(/\s+/)
      .map((w) => w.replace(/[^A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ]/g, "")[0] || "")
      .slice(0, 2)
      .join("")
      .toUpperCase();
  const staff = (n: number) => {
    if (locale === "uz") return `${n} nafar xodim`;
    if (locale === "en") return `${n} ${n === 1 ? "employee" : "employees"}`;
    const m10 = n % 10;
    const m100 = n % 100;
    const w = m10 === 1 && m100 !== 11 ? "сотрудник" : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? "сотрудника" : "сотрудников";
    return `${n} ${w}`;
  };
  const nt = (id: string, key: "title" | "short" | "sub" | "rel" | "desc") => {
    const k = `nodes.${id}.${key}`;
    return t.has(k) ? t(k) : "";
  };

  const card = (id: string) => stage.current?.querySelector<HTMLElement>(`[data-id="${id}"]`) ?? null;

  /** Position of an element inside the stage, unaffected by running transforms. */
  const box = (el: HTMLElement) => {
    let x = 0;
    let y = 0;
    let e: HTMLElement | null = el;
    while (e && e !== stage.current) {
      x += e.offsetLeft;
      y += e.offsetTop;
      e = e.offsetParent as HTMLElement | null;
    }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  };

  const layoutLinks = useCallback((): Drawn[] => {
    const st = stage.current;
    const s = svg.current;
    if (!st || !s) return [];
    const v = VIEWS[view];
    const mobile = window.matchMedia("(max-width: 900px)").matches;
    s.innerHTML = "";
    // drop the previous view's size first, so it does not stretch the stage
    s.setAttribute("width", "0");
    s.setAttribute("height", "0");
    const W = st.scrollWidth;
    const H = st.scrollHeight;
    s.setAttribute("width", String(W));
    s.setAttribute("height", String(H));
    s.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const ns = "http://www.w3.org/2000/svg";
    const out: Drawn[] = [];
    for (const [a, b, kind] of v.edges) {
      const dashed = kind === "d";
      if (mobile && dashed) continue;
      const ea = card(a);
      const eb = card(b);
      if (!ea || !eb) continue;
      const pa = box(ea);
      const pb = box(eb);
      const sameRow = Math.abs(pa.y + pa.h / 2 - (pb.y + pb.h / 2)) < 30;
      const p = document.createElementNS(ns, "path");
      let d: string;
      if (mobile) d = spine(pa.x + 14, pa.y + pa.h, pb.x, pb.y + Math.min(pb.h / 2, 26));
      else if (sameRow) {
        // neighbours in one row (as in the annexes): a straight dashed line between facing sides
        const [l, r] = pa.x < pb.x ? [pa, pb] : [pb, pa];
        const y = Math.max(l.y, r.y) + Math.min(l.h, r.h) / 2;
        d = `M${l.x + l.w},${y} H${r.x}`;
      } else d = elbow(pa.x + pa.w / 2, pa.y + pa.h, pb.x + pb.w / 2, pb.y);
      p.setAttribute("d", d);
      p.setAttribute("class", dashed ? "org-link is-dashed" : "org-link");
      s.appendChild(p);
      let dot: SVGCircleElement | null = null;
      if (!mobile && !sameRow) {
        dot = document.createElementNS(ns, "circle");
        dot.setAttribute("cx", String(pb.x + pb.w / 2));
        dot.setAttribute("cy", String(pb.y - 1));
        dot.setAttribute("r", "3.5");
        dot.setAttribute("class", dashed ? "org-dot is-dashed" : "org-dot");
        s.appendChild(dot);
      }
      out.push({ p, dot, tier: Number(eb.closest<HTMLElement>("[data-tier]")?.dataset.tier ?? 0), dashed });
    }
    return out;
     
  }, [view]);

  /* Draw and animate whenever the view changes. */
  useLayoutEffect(() => {
    leaving.current.forEach((a) => a.cancel());
    leaving.current = [];
    const links = layoutLinks();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const before = prev.current;
    prev.current = view;
    if (reduce) return;
    const flying = before ? (view === "home" ? card(before) : stage.current?.querySelector<HTMLElement>("[data-head]")) : null;
    const from = before ? fromRect.current : null;
    const base = from ? 220 : 0;
    stage.current?.querySelectorAll<HTMLElement>("[data-tier]").forEach((row) => {
      const i = Number(row.dataset.tier);
      row.querySelectorAll<HTMLElement>("[data-id]").forEach((c, j) => {
        if (c === flying) return;
        c.animate([{ opacity: 0, transform: "translateY(16px) scale(.97)" }, { opacity: 1, transform: "none" }], {
          duration: 440,
          delay: base + i * 95 + j * 45,
          easing: EASE,
          fill: "backwards",
        });
      });
    });
    Array.from(aside.current?.children ?? []).forEach((c, i) =>
      (c as HTMLElement).animate([{ opacity: 0, transform: "translateX(14px)" }, { opacity: 1, transform: "none" }], {
        duration: 420,
        delay: base + 80 + i * 70,
        easing: EASE,
        fill: "backwards",
      }),
    );
    for (const l of links) {
      const delay = Math.max(0, base + l.tier * 95 - 60);
      if (l.dashed) {
        l.p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: delay + 120, fill: "backwards" });
      } else {
        const len = l.p.getTotalLength();
        l.p.style.strokeDasharray = `${len} ${len}`;
        const a = l.p.animate([{ strokeDashoffset: String(len) }, { strokeDashoffset: "0" }], { duration: 480, delay, easing: EASE, fill: "backwards" });
        a.finished.then(() => (l.p.style.strokeDasharray = "")).catch(() => {});
      }
      l.dot?.animate([{ opacity: 0, transform: "scale(0)" }, { opacity: 1, transform: "scale(1)" }], { duration: 260, delay: delay + 400, easing: EASE, fill: "backwards" });
    }
    if (flying && from) {
      const to = flying.getBoundingClientRect();
      if (to.width) {
        const sx = from.width / to.width;
        const sy = from.height / to.height;
        const kf =
          Math.abs(sx - 1) < 0.1 && Math.abs(sy - 1) < 0.2
            ? [
                { transformOrigin: "0 0", transform: `translate(${from.left - to.left}px,${from.top - to.top}px) scale(${sx},${sy})` },
                { transformOrigin: "0 0", transform: "none" },
              ]
            : [
                {
                  transform: `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px,${from.top + from.height / 2 - (to.top + to.height / 2)}px) scale(${Math.max(0.3, Math.min(sx, sy, 1))})`,
                  opacity: 0.35,
                },
                { transform: "none", opacity: 1 },
              ];
        flying.animate(kf, { duration: 600, easing: EASE });
        flying.animate([{ boxShadow: "0 0 0 0 rgb(61 39 232 / .5)" }, { boxShadow: "0 0 0 14px rgb(61 39 232 / 0)" }], {
          duration: 750,
          delay: 560,
          easing: "ease-out",
        });
      }
    }
    if (before) {
      const focus = view === "home" ? flying : aside.current?.querySelector<HTMLElement>("h2");
      setTimeout(() => focus?.focus({ preventScroll: true }), 420);
    }
     
  }, [view, layoutLinks]);

  /* Redraw links when the stage resizes or the language changes. */
  useEffect(() => {
    let raf = 0;
    const relayout = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => layoutLinks());
    };
    const ro = new ResizeObserver(relayout);
    if (stage.current?.parentElement) ro.observe(stage.current.parentElement);
    document.fonts?.ready.then(relayout);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [layoutLinks, locale]);

  const go = useCallback(
    async (to: ViewId, origin?: HTMLElement | null, fromHash = false) => {
      if (to === view) return;
      const my = ++busy.current;
      let rect: DOMRect | null = origin?.isConnected ? origin.getBoundingClientRect() : null;
      if (!rect) {
        const c = view === "home" ? card(to) : stage.current?.querySelector<HTMLElement>("[data-head]");
        rect = c?.getBoundingClientRect() ?? null;
      }
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const els = [
          svg.current,
          ...Array.from(stage.current?.querySelectorAll<HTMLElement>("[data-id]") ?? []).filter((c) => c !== origin),
          ...Array.from(aside.current?.children ?? []).filter((c) => !origin || !c.contains(origin)),
        ].filter(Boolean) as Element[];
        const anims = els.map((el) =>
          el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-6px) scale(.98)" }], {
            duration: 170,
            easing: "ease-in",
            fill: "forwards",
          }),
        );
        leaving.current.push(...anims);
        await Promise.all(anims.map((a) => a.finished.catch(() => {})));
      }
      if (my !== busy.current) return;
      // keep the breadcrumb in view, and the flying card's start point with it
      const top = bar.current?.getBoundingClientRect().top ?? 0;
      let delta = 0;
      if (top < 80) {
        const y = window.scrollY;
        window.scrollTo({ top: y + top - 96 });
        delta = window.scrollY - y;
      }
      fromRect.current = rect ? new DOMRect(rect.left, rect.top - delta, rect.width, rect.height) : null;
      if (!fromHash) history.pushState(null, "", to === "home" ? location.pathname + location.search : `#${to}`);
      setView(to);
    },
     
    [view],
  );

  /* Deep links (#organ, #lab-sqa, …) and the browser's back button. */
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  }, [go]);
  useEffect(() => {
    const fromLocation = (): ViewId => {
      const h = location.hash.slice(1);
      return isView(h) ? h : "home";
    };
    const initial = fromLocation();
    if (initial !== "home") {
      prev.current = null; // open the linked unit directly, without the fly-in from the overview
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the hash is only readable after mount
      setView(initial);
    }
    const onPop = () => goRef.current(fromLocation(), null, true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const v = VIEWS[view];
  const drill = (id: string) => (isView(id) && id !== view && id !== "home" ? (id as ViewId) : null);

  const renderCard = (id: string) => {
    const n = NODES[id];
    const common = "relative z-[1] rounded-card border border-line bg-paper p-4 text-left shadow-card max-[900px]:w-auto";
    if (n.type === "director") {
      return (
        <div key={id} data-id={id} className={`${common} flex w-[300px] items-center gap-3.5 border-transparent bg-primary text-white`}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-white/15">
            <Icon id={n.icon} />
          </span>
          <span>
            <span className="block font-bold leading-snug">{nt(id, "title")}</span>
            <span className="block text-xs text-white/80">{nt(id, "sub")}</span>
          </span>
        </div>
      );
    }
    if (n.type === "support") {
      return (
        <div key={id} data-id={id} className={`${common} flex min-h-[150px] w-[var(--unit-w)] flex-col border-dashed bg-transparent shadow-none max-[900px]:min-h-0`}>
          <span className="grid h-10 w-10 place-items-center rounded-card border border-line text-ink-soft">
            <Icon id={n.icon} />
          </span>
          <span className="mt-3 font-bold leading-snug text-ink">{nt(id, "title")}</span>
          <span className="mt-1 text-xs text-ink-soft">{t("support")}</span>
        </div>
      );
    }
    if (n.type === "unit") {
      const target = drill(id);
      const isHead = v.head === id;
      const inner = (
        <>
          <span className="grid h-10 w-10 place-items-center rounded-card bg-band text-primary">
            <Icon id={n.icon} />
          </span>
          <span className="mt-3 block font-bold leading-snug text-ink">{nt(id, "title")}</span>
          <span className="mt-1 block text-xs tabular-nums text-ink-soft">{n.code ?? nt(id, "sub")}</span>
          {view === "home" && nt(id, "rel") && <span className="mt-1.5 hidden text-xs text-primary max-[900px]:block">↔ {nt(id, "rel")}</span>}
          <span className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
            <span className="rounded-card bg-band px-2 py-1 text-xs font-bold tabular-nums text-primary">{staff(headcount(id as ViewId))}</span>
            {target && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                {t("open")}
                <Arrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </span>
        </>
      );
      const cls = `${common} flex min-h-[176px] w-[var(--unit-w)] flex-col max-[900px]:min-h-0 ${
        isHead ? "border-primary shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]" : ""
      }`;
      return target ? (
        <button
          key={id}
          type="button"
          data-id={id}
          onClick={(e) => go(target, e.currentTarget)}
          aria-label={`${nt(id, "title")}. ${t("open")}`}
          className={`${cls} group cursor-pointer transition-[translate,border-color,box-shadow] duration-200 hover:-translate-y-[3px] hover:border-primary hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
        >
          {inner}
        </button>
      ) : (
        <div key={id} data-id={id} data-head={isHead || undefined} tabIndex={-1} className={cls}>
          {inner}
        </div>
      );
    }
    if (n.type === "external") {
      return (
        <div key={id} data-id={id} className={`${common} flex w-[240px] items-center gap-3 border-dashed bg-band shadow-none`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-card border border-line bg-paper text-ink-soft">
            <Icon id={n.icon} className="h-[18px] w-[18px]" />
          </span>
          <span className="text-[13px] font-semibold leading-snug text-ink">{nt(id, "title")}</span>
        </div>
      );
    }
    if (n.type === "function") {
      return (
        <div
          key={id}
          data-id={id}
          className="relative z-[1] w-[var(--fn-w)] hyphens-auto rounded-card border border-line bg-band px-2 py-3 text-center text-[12.5px] font-semibold leading-snug text-ink max-[900px]:w-auto max-[900px]:text-left"
        >
          {nt(id, "title")}
        </div>
      );
    }
    const members = n.members;
    return (
      <div key={id} data-id={id} className={`${common} ${members.length > 5 ? "w-[500px]" : "w-[300px]"} ${n.lead ? "border-t-[3px] border-t-primary" : ""}`}>
        <div className="flex items-start justify-between gap-2 text-[11px] font-bold uppercase leading-snug tracking-wide text-primary">
          <span>{nt(id, "title")}</span>
          {members.length > 1 && <span className="rounded-card bg-band px-1.5 py-0.5 tabular-nums tracking-normal">{members.length}</span>}
        </div>
        {members.length > 0 && (
          <ul className={`mt-3 grid gap-2 ${members.length > 5 ? "grid-cols-2 gap-x-4 max-[560px]:grid-cols-1" : ""}`}>
            {members.map(({ id: p, as }) => {
              const name = person(p);
              const photo = photos[p];
              const size = n.lead ? 52 : 40;
              return (
                <li key={p} className="flex items-center gap-3 text-sm font-medium leading-snug text-ink">
                  <span
                    aria-hidden="true"
                    style={{ width: size, height: size }}
                    className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full text-[12px] font-extrabold ${
                      n.lead ? "bg-primary text-white ring-2 ring-primary ring-offset-2" : "bg-band text-primary ring-1 ring-line"
                    }`}
                  >
                    {photo ? (
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes={`${size * 2}px`}
                        unoptimized={isLocalMediaUrl(photo)}
                        className="object-cover object-top"
                      />
                    ) : (
                      initials(name)
                    )}
                  </span>
                  <span>
                    {name}
                    {as && <span className="block text-[11.5px] font-normal text-ink-soft">{t(`positions.${as}`)}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  const renderAside = () => {
    if (view === "home") {
      const stats: [string, string][] = [
        [String(TOTAL_STAFF), t("statStaff")],
        ["3", t("statCertificates")],
        ["2", t("statLabs")],
        ["2013", t("statFounded")],
      ];
      return (
        <div className="grid grid-cols-4 gap-3 max-[900px]:grid-cols-2">
          {stats.map(([n, l], i) => (
            <div key={l} className="card p-4">
              <div className={`text-3xl font-black tabular-nums ${i === 0 ? "text-primary-bright" : "text-primary"}`}>{n}</div>
              <div className="mt-1.5 text-sm text-ink-soft">{l}</div>
            </div>
          ))}
        </div>
      );
    }
    const node = NODES[view];
    const icon = node.type === "unit" ? node.icon : "organ";
    const page = node.type === "unit" ? node.page : undefined;
    const facts: [string, string][] = [[t("staffL"), staff(headcount(view))], ...(FACTS[view] ?? []).map((f) => [t(f.key), f.value] as [string, string])];
    return (
      <>
        <section className="card p-5">
          <span className="grid h-10 w-10 place-items-center rounded-card bg-band text-primary">
            <Icon id={icon} />
          </span>
          <h2 tabIndex={-1} className="mt-3 text-xl font-black leading-tight text-ink outline-none">
            {nt(view, "title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{nt(view, "desc")}</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-line pt-4 text-sm">
            {facts.map(([k, val]) => (
              <div key={k} className="contents">
                <dt className="text-ink-soft">{k}</dt>
                <dd className="font-semibold tabular-nums text-ink [overflow-wrap:anywhere]">{val}</dd>
              </div>
            ))}
          </dl>
          {page && (
            <Link href={page} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {t("more")}
              <Arrow />
            </Link>
          )}
        </section>
        {RELATED[view] && (
          <section className="card p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">{t("related")}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {RELATED[view]!.map((r) => {
                const rn = NODES[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={(e) => go(r, e.currentTarget)}
                    className="inline-flex items-center gap-2 rounded-card border border-line bg-band py-1.5 pl-1.5 pr-3 text-[13px] font-bold text-ink transition-[translate,border-color] hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-card bg-paper text-primary">
                      <Icon id={rn.type === "unit" ? rn.icon : "organ"} className="h-3.5 w-3.5" />
                    </span>
                    {nt(r, "short")}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </>
    );
  };

  return (
    <div className="org-explorer mt-8 grid gap-4" data-view={view}>
      <nav ref={bar} aria-label="breadcrumb" className="flex min-h-[42px] flex-wrap items-center gap-3.5">
        {view !== "home" && (
          <button
            type="button"
            onClick={() => go("home")}
            className="inline-flex items-center gap-2 rounded-card border border-line bg-paper py-2 pl-3 pr-4 text-sm font-bold shadow-card transition-[translate,border-color] hover:-translate-x-0.5 hover:border-primary"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {t("back")}
          </button>
        )}
        <ol className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          {view === "home" ? (
            <li aria-current="page" className="font-semibold text-ink">
              {t("root")}
            </li>
          ) : (
            <>
              <li>
                <button type="button" onClick={() => go("home")} className="font-medium text-primary hover:underline">
                  {t("root")}
                </button>
              </li>
              <li aria-hidden="true" className="text-line">
                /
              </li>
              <li aria-current="page" className="font-semibold text-ink">
                {nt(view, "short")}
              </li>
            </>
          )}
        </ol>
      </nav>

      <div className={`grid items-start gap-4 ${view === "home" ? "" : "min-[1021px]:grid-cols-[minmax(0,1fr)_320px]"}`}>
        <div className="grid gap-5 overflow-x-auto rounded-card border border-line bg-paper px-5 pb-4 pt-7 max-[900px]:px-3.5 max-[900px]:pt-4">
          <div
            ref={stage}
            className="relative flex min-w-min flex-col items-center gap-[50px] px-1.5 py-1 max-[900px]:items-stretch max-[900px]:gap-3 max-[900px]:p-0"
          >
            <svg ref={svg} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-0 overflow-visible" />
            {v.tiers.map((tier, i) => (
              <div
                key={`${view}-${i}`}
                data-tier={i}
                className="flex items-stretch justify-center gap-4 max-[900px]:flex-col max-[900px]:gap-3 max-[900px]:pl-[calc(var(--d)*22px)]"
                style={{ "--d": v.mobileDepth?.[i] ?? i } as React.CSSProperties}
              >
                {tier.map(renderCard)}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-5 border-t border-line pt-3.5 text-[13px] text-ink-soft">
            <span className="inline-flex items-center gap-2">
              <i className="inline-block w-[30px] border-t-2 border-line" />
              {t("solid")}
            </span>
            {view === "home" && (
              <span className="inline-flex items-center gap-2 max-[900px]:hidden">
                <i className="inline-block w-[30px] border-t-2 border-dashed border-primary-bright" />
                {t("dashed")}
              </span>
            )}
          </div>
        </div>
        <aside ref={aside} aria-live="polite" className="grid gap-3.5">
          {renderAside()}
        </aside>
      </div>
    </div>
  );
}
