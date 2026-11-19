/**
 * Security-print rosette (the guilloche found on certificates) for light bands.
 * Drawn in the brand colour at low opacity, so it follows the light and dark themes;
 * decorative only. The icons and dot grid come from the site-wide texture (globals.css).
 */

/** Rosette made of rotated sine-modulated rings, rounded to keep the markup small. */
function rosettePaths(): string[] {
  const rings = 7;
  const points = 180;
  const paths: string[] = [];
  for (let k = 0; k < rings; k++) {
    const base = 70 + k * 16; // ring radius
    const amp = 9 + k * 1.5; // wave depth
    const petals = 18;
    const phase = (k * Math.PI) / rings;
    let d = "";
    for (let i = 0; i <= points; i++) {
      const t = (i / points) * Math.PI * 2;
      const r = base + amp * Math.sin(petals * t + phase);
      const x = 200 + r * Math.cos(t);
      const y = 200 + r * Math.sin(t);
      d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    paths.push(d + "Z");
  }
  return paths;
}

const ROSETTE = rosettePaths();

export default function CertificateBackdrop({ side = "right" }: { side?: "left" | "right" }) {
  const place = side === "right" ? "-right-40 -top-32 lg:-right-28" : "-left-40 -bottom-40 lg:-left-28";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden text-primary">
      <svg
        viewBox="0 0 400 400"
        className={`absolute ${place} h-[560px] w-[560px] opacity-[0.08] motion-safe:animate-[spin_240s_linear_infinite]`}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
      >
        {ROSETTE.map((d, i) => (
          <path key={i} d={d} />
        ))}
        <circle cx="200" cy="200" r="52" strokeWidth="0.6" />
        <circle cx="200" cy="200" r="46" strokeWidth="0.4" strokeDasharray="1.5 2.5" />
      </svg>
    </div>
  );
}
