/**
 * Quiet background for light bands: a security-print rosette (the guilloche found on
 * certificates), a fine dot texture and a few faint line icons of the certification
 * trade. Everything is drawn in the brand colour at low opacity, so it follows the
 * light and dark themes, and it is decorative only (aria-hidden, no pointer events).
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

/* 24×24 line icons: stamp, magnifier, flask, shield-check, certificate, gauge */
const ICONS: { d: string[]; x: string; y: string; size: number; rotate: number }[] = [
  { d: ["M9 3h6l-1 7h-4z", "M5 14h14v3H5z", "M4 21h16"], x: "4%", y: "14%", size: 64, rotate: -12 },
  { d: ["M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z", "m20 20-4.2-4.2"], x: "14%", y: "72%", size: 52, rotate: 8 },
  { d: ["M9 3h6M10 3v6.2L4.8 18.4A1.7 1.7 0 0 0 6.3 21h11.4a1.7 1.7 0 0 0 1.5-2.6L14 9.2V3", "M7.2 15h9.6"], x: "33%", y: "6%", size: 46, rotate: 14 },
  { d: ["M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z", "m9 12 2 2 4-4"], x: "48%", y: "80%", size: 56, rotate: -6 },
  { d: ["M4 4h16v12H4z", "M8 8h8M8 11h5", "m14 16 1 5 2-1.5 2 1.5 1-5"], x: "92%", y: "78%", size: 58, rotate: 10 },
  { d: ["M4 15a8 8 0 1 1 16 0", "m12 15 4-5", "M12 15h.01"], x: "66%", y: "10%", size: 44, rotate: -10 },
];

export default function CertificateBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden text-primary">
      {/* fine dot texture, fading towards the centre so text stays clean */}
      <div
        className="absolute inset-0 opacity-[0.55] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,transparent_30%,black_95%)]"
        style={{
          backgroundImage: "radial-gradient(color-mix(in srgb, var(--color-primary) 22%, transparent) 1px, transparent 1.2px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* rosette, half outside the band on the right */}
      <svg
        viewBox="0 0 400 400"
        className="absolute -right-40 -top-32 h-[560px] w-[560px] opacity-[0.09] motion-safe:animate-[spin_240s_linear_infinite] lg:-right-28"
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

      {/* faint icons of the trade */}
      {ICONS.map((icon, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute hidden opacity-[0.07] sm:block"
          style={{ left: icon.x, top: icon.y, width: icon.size, height: icon.size, transform: `rotate(${icon.rotate}deg)` }}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon.d.map((d, j) => (
            <path key={j} d={d} />
          ))}
        </svg>
      ))}
    </div>
  );
}
