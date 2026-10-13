import React, { useId } from "react";
import { PH } from "../theme";
import { decel } from "./timebase";

// ===========================================================================
// A scope lane for P3. Same carrier math as kit/Scope (smooth sines, no
// jitter), extended with lit stretches: the parts of the line the sweep has
// passed stay lit in a color (persistence), brightest at the beam.
// Render inside an <svg> in screen units.
// ===========================================================================

export type Lit = {
  /** screen x range */
  a: number;
  b: number;
  rgb: string;
  /** carrier amplitude inside the lit stretch, px */
  amp: number;
  /** x where the persistence is brightest (the beam), defaults to b */
  head?: number;
  /** alpha far behind the head */
  far?: number;
  /** phosphor persistence: earlier passes of the carrier still glowing (count) */
  ghosts?: number;
};
export type Bump = { x: number; amp: number; sigma?: number };

const gauss = (x: number, c: number, s: number) => Math.exp(-((x - c) ** 2) / (2 * s * s));
const edge = (v: number) => Math.min(1, Math.max(0, v));

export const carrierAt = (x: number, frame: number) =>
  0.62 * Math.sin(x * 0.085 - frame * 0.42) + 0.38 * Math.sin(x * 0.21 + frame * 0.31);

export const Trace: React.FC<{
  frame: number;
  y: number;
  lit?: Lit[];
  bumps?: Bump[];
  hum?: number;
  x0?: number;
  x1?: number;
  stroke?: number;
  idle?: string;
}> = ({ frame, y, lit = [], bumps = [], hum = 1.2, x0 = -30, x1 = 1110, stroke = 2.2, idle = PH.trace }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ampAt = (x: number) => {
    let a = 0;
    for (const l of lit) if (l.b > l.a) a += l.amp * edge((x - l.a) / 16) * edge((l.b - x) / 16);
    for (const b of bumps) a += b.amp * gauss(x, b.x, b.sigma ?? 46);
    return a;
  };
  const yAtF = (x: number, fr: number) => y + carrierAt(x, fr) * ampAt(x) + hum * Math.sin(x * 0.05 + fr * 0.07);
  const yAt = (x: number) => yAtF(x, frame);
  const step = 3;
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += step) pts.push(`${x},${yAt(x).toFixed(1)}`);

  return (
    <g>
      <polyline points={pts.join(" ")} fill="none" stroke={idle} strokeWidth={stroke} strokeLinejoin="round" />
      {lit.map((l, i) => {
        const a = Math.max(x0, l.a);
        const b = Math.min(x1, l.b);
        if (b - a < 1.5) return null;
        const segAt = (fr: number) => {
          const seg: string[] = [];
          for (let x = a; x < b; x += 2) seg.push(`${x.toFixed(1)},${yAtF(x, fr).toFixed(1)}`);
          seg.push(`${b.toFixed(1)},${yAtF(b, fr).toFixed(1)}`);
          return seg.join(" ");
        };
        const head = l.head ?? l.b;
        const id = `p3l${uid}${i}`;
        const ghosts = Array.from({ length: l.ghosts ?? 0 }, (_, j) => j + 1);
        return (
          <g key={i}>
            <defs>
              <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={head - 420} y1={0} x2={head} y2={0}>
                <stop offset="0%" stopColor={`rgba(${l.rgb},${l.far ?? 0.62})`} />
                <stop offset="100%" stopColor={`rgba(${l.rgb},1)`} />
              </linearGradient>
            </defs>
            {ghosts.map((j) => (
              <polyline key={j} points={segAt(frame - 4 * j)} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinejoin="round" opacity={0.5 / j} />
            ))}
            <polyline points={segAt(frame)} fill="none" stroke={`url(#${id})`} strokeWidth={stroke + 0.6} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

/** the sweep's write head on a lane: small solid head, faint halo (fish8 pulse head) */
export const BeamHead: React.FC<{ x: number; y: number; rgb: string; o?: number }> = ({ x, y, rgb, o = 1 }) =>
  o <= 0.01 ? null : (
    <g opacity={o}>
      <circle cx={x} cy={y} r={10} fill={`rgba(${rgb},0.18)`} />
      <circle cx={x} cy={y} r={4.5} fill="#F3F1EC" />
    </g>
  );

/** one soft ring when something lands on the line (fish8 Ripple) */
export const Ripple: React.FC<{ x: number; y: number; r0: number; at: number; frame: number; rgb: string }> = ({ x, y, r0, at, frame, rgb }) => {
  const t = (frame - at) / 26;
  if (t < 0 || t > 1) return null;
  const k = decel(t);
  return <circle cx={x} cy={y} r={r0 + 46 * k} fill="none" stroke={`rgba(${rgb},1)`} strokeWidth={1.2} opacity={0.42 * (1 - t)} />;
};
