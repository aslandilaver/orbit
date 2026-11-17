/**
 * Hero visual. Each ring is a stage of the ORBIT lifecycle; bodies drift
 * outward from launch to graduation. Pure SVG + CSS: no canvas, no JS loop,
 * and motion stops entirely under prefers-reduced-motion.
 */
const C = 260;
const RINGS = [
  { r: 62, label: "01  NEW", speed: 70, bodies: [40] },
  { r: 112, label: "02  CURVE", speed: 110, bodies: [150, 290] },
  { r: 166, label: "03  READY", speed: 160, bodies: [215] },
  { r: 222, label: "04  GRADUATED", speed: 240, bodies: [320, 95] },
];

function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
}

function arc(r: number, from: number, to: number) {
  const s = polar(r, from);
  const e = polar(r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function OrbitVisual({ className }: { className?: string }) {
  const ticks = Array.from({ length: 120 }, (_, i) => i * 3);
  return (
    <svg viewBox="0 0 520 520" className={className} role="img" aria-label="Concentric orbits representing a token's path from launch to graduation">
      {/* Instrument ticks on the outer boundary */}
      <g stroke="var(--color-line-3)">
        {ticks.map((deg) => {
          const long = deg % 30 === 0;
          const a = polar(248, deg);
          const b = polar(long ? 238 : 243, deg);
          return <line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={1} opacity={long ? 0.9 : 0.45} />;
        })}
      </g>

      {/* Vertical reference axis */}
      <line x1={C} y1={C} x2={C} y2={C - 248} stroke="var(--color-line-2)" strokeDasharray="2 4" />

      {RINGS.map((ring, i) => (
        <g key={ring.r}>
          <circle
            cx={C}
            cy={C}
            r={ring.r}
            fill="none"
            stroke={i === 3 ? "var(--color-line-3)" : "var(--color-line-2)"}
            strokeDasharray={i === 0 ? "1 5" : undefined}
          />
          <text
            x={C + 6}
            y={C - ring.r - 6}
            fill="var(--color-fg-3)"
            fontSize="9"
            fontFamily="var(--font-mono)"
            letterSpacing="0.08em"
            style={{ whiteSpace: "pre" }}
          >
            {ring.label}
          </text>
          <g
            style={{
              transformOrigin: `${C}px ${C}px`,
              animation: `orbit-spin ${ring.speed}s linear infinite`,
            }}
          >
            {ring.bodies.map((deg, j) => {
              const p = polar(ring.r, deg);
              const lit = i === 2 && j === 0;
              return (
                <g key={deg}>
                  {lit && <circle cx={p.x} cy={p.y} r={9} fill="none" stroke="var(--color-accent)" strokeOpacity={0.35} />}
                  <circle cx={p.x} cy={p.y} r={lit ? 4 : 3} fill={lit ? "var(--color-accent)" : "var(--color-fg-2)"} />
                </g>
              );
            })}
          </g>
        </g>
      ))}

      {/* Progress arc: one token approaching graduation */}
      <path d={arc(166, 0, 248)} fill="none" stroke="var(--color-accent)" strokeOpacity={0.55} strokeWidth={1.5} strokeLinecap="round" />

      {/* Core */}
      <circle cx={C} cy={C} r={20} fill="var(--color-bg)" stroke="var(--color-line-3)" />
      <circle cx={C} cy={C} r={6} fill="var(--color-accent)" />
    </svg>
  );
}
