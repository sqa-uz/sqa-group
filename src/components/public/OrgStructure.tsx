"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export type OrgNodeCopy = { label: string; text: string };

export type OrgCopy = {
  hint: string;
  legendSubordination: string;
  legendInteraction: string;
  reportsTo: string;
  manages: string;
  interacts: string;
  nodes: Record<string, OrgNodeCopy>;
};

/** Shape of a chart: who reports to whom (solid), who works with whom (dashed), and the layout rows. */
export type OrgChart = {
  solid: [string, string][];
  dashed: [string, string][];
  /** rows on wide screens; `col` places a node in the row's grid */
  rows: { cols: string; items: { id: string; col?: string }[] }[];
  external: string[];
  functions: string[];
  /** the unit the page is about: highlighted and selected first */
  main: string;
};

type Line = { d: string; a: string; b: string; dashed: boolean };

function linked(chart: OrgChart, id: string) {
  return {
    parents: chart.solid.filter(([, c]) => c === id).map(([p]) => p),
    children: chart.solid.filter(([p]) => p === id).map(([, c]) => c),
    partners: chart.dashed.filter(([a, b]) => a === id || b === id).map(([a, b]) => (a === id ? b : a)),
  };
}

export default function OrgStructure({ chart, copy }: { chart: OrgChart; copy: OrgCopy }) {
  const uid = useId().replace(/:/g, "");
  const wrap = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const nodes = useRef(new Map<string, HTMLButtonElement>());
  const [lines, setLines] = useState<Line[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<string>(chart.main);
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ?? selected;

  const measure = useCallback(() => {
    const box = wrap.current;
    if (!box) return;
    const o = box.getBoundingClientRect();
    const r = (id: string) => {
      const b = nodes.current.get(id)!.getBoundingClientRect();
      return { l: b.left - o.left, r: b.right - o.left, t: b.top - o.top, b: b.bottom - o.top, cx: (b.left + b.right) / 2 - o.left, cy: (b.top + b.bottom) / 2 - o.top };
    };
    const out: Line[] = [];
    for (const [p, c] of chart.solid) {
      const a = r(p);
      const b = r(c);
      const mid = (a.b + b.t) / 2;
      out.push({ a: p, b: c, dashed: false, d: `M${a.cx} ${a.b}V${mid}H${b.cx}V${b.t - 6}` });
    }
    for (const [x, y] of chart.dashed) {
      const a = r(x);
      const b = r(y);
      let d: string;
      if (Math.abs(a.cy - b.cy) < 20) {
        // same row: straight line between the facing edges
        const [left, right] = a.cx < b.cx ? [a, b] : [b, a];
        d = `M${left.r} ${left.cy}H${right.l}`;
      } else {
        // down from the upper node, then across to the side of the lower one
        const [up, low] = a.cy < b.cy ? [a, b] : [b, a];
        const side = up.cx > low.cx ? low.r : low.l;
        d = `M${up.cx} ${up.b}V${low.cy}H${side}`;
      }
      out.push({ a: x, b: y, dashed: true, d });
    }
    setLines(out);
    setSize({ w: o.width, h: o.height });
  }, [chart]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const box = wrap.current;
    if (!box) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(box);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  const rel = linked(chart, active);
  const near = new Set<string>([active, ...rel.parents, ...rel.children, ...rel.partners]);
  const info = copy.nodes[selected];
  const sel = linked(chart, selected);

  const chipGroup = (title: string, ids: string[]) =>
    ids.length > 0 && (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ids.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className="rounded-[2px] border border-line bg-band px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-primary hover:text-primary"
            >
              {copy.nodes[id].label}
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-soft">
        <span>{copy.hint}</span>
        <span className="hidden items-center gap-2 lg:inline-flex">
          <svg width="28" height="6" aria-hidden="true">
            <line x1="0" y1="3" x2="28" y2="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {copy.legendSubordination}
        </span>
        <span className="hidden items-center gap-2 lg:inline-flex">
          <svg width="28" height="6" aria-hidden="true">
            <line x1="0" y1="3" x2="28" y2="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          {copy.legendInteraction}
        </span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div ref={wrap} className="relative" onMouseLeave={() => setHovered(null)}>
          {/* connectors, wide screens only */}
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block" width={size.w} height={size.h}>
            <defs>
              <marker id={`${uid}-arrow`} viewBox="0 0 8 8" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0 8 4 0 8z" className="fill-ink-soft" opacity="0.5" />
              </marker>
              <marker id={`${uid}-arrow-on`} viewBox="0 0 8 8" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0 8 4 0 8z" className="fill-primary" />
              </marker>
            </defs>
            {lines.map((l) => {
              const on = l.a === active || l.b === active;
              return (
                <path
                  key={`${l.a}-${l.b}`}
                  d={l.d}
                  fill="none"
                  strokeWidth={on ? 2 : 1.25}
                  strokeDasharray={l.dashed ? "5 4" : undefined}
                  markerEnd={l.dashed ? undefined : on ? `url(#${uid}-arrow-on)` : `url(#${uid}-arrow)`}
                  className={`transition-[stroke,opacity] duration-300 ${on ? "stroke-primary" : "stroke-ink-soft"} ${on ? "opacity-100" : "opacity-35"}`}
                />
              );
            })}
          </svg>

          <div className="relative space-y-4 lg:space-y-10">
            {chart.rows.map((row, ri) => (
              <div key={ri} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-x-4 ${row.cols}`}>
                {row.items.map(({ id, col }) => {
                  const isActive = id === active;
                  const isSelected = id === selected;
                  const external = chart.external.includes(id);
                  const fn = chart.functions.includes(id);
                  const main = id === chart.main;
                  return (
                    <button
                      key={id}
                      ref={(el) => {
                        if (el) nodes.current.set(id, el);
                      }}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelected(id);
                        // on phones the details sit below the chart: bring them into view
                        if (!window.matchMedia("(min-width: 1024px)").matches) {
                          requestAnimationFrame(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
                        }
                      }}
                      onMouseEnter={() => setHovered(id)}
                      onFocus={() => setHovered(id)}
                      onBlur={() => setHovered(null)}
                      className={`relative flex min-h-[64px] items-center justify-center rounded-[2px] border px-3 py-3 text-center text-[13px] font-semibold leading-snug hyphens-auto transition-all duration-300 ${
                        col ?? ""
                      } ${
                        main
                          ? "border-primary bg-primary text-white shadow-[0_8px_22px_rgb(32_3_189/0.28)]"
                          : external
                            ? "border-dashed border-line bg-band text-ink"
                            : fn
                              ? "border-line bg-paper text-ink-soft"
                              : "border-line bg-paper text-ink shadow-card"
                      } ${isActive && !main ? "border-primary text-primary" : ""} ${
                        isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-paper" : ""
                      } ${near.has(id) ? "opacity-100" : "lg:opacity-60"} hover:-translate-y-0.5`}
                    >
                      {copy.nodes[id].label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* details of the selected unit */}
        <aside ref={panel} aria-live="polite" className="card self-start border-t-4 border-t-primary p-6 lg:sticky lg:top-24">
          <p className="text-lg font-bold leading-snug text-ink">{info.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{info.text}</p>
          <div className="mt-5 space-y-4">
            {chipGroup(copy.reportsTo, sel.parents)}
            {chipGroup(copy.manages, sel.children)}
            {chipGroup(copy.interacts, sel.partners)}
          </div>
        </aside>
      </div>
    </div>
  );
}
