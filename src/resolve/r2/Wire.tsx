import React from "react";
import { TRACE_INK } from "./plan";

// ===========================================================================
// The CRT Scope trace (kit/Scope) generalised to run along any path: lines
// and cubic curves, sampled by arc length. A bump is a local wave packet in a
// colour (a voice, a data packet), placed by arc length s. Same smooth
// carrier as the kit's Scope (no jitter); the offset runs along the normal.
// ===========================================================================

export type Pt = { x: number; y: number };
export type Seg = ["L", Pt, Pt] | ["C", Pt, Pt, Pt, Pt];
export type Path = { pts: Pt[]; s: number[]; L: number };
export type WireBump = { s: number; amp: number; sigma?: number; rgb: string };

const cubic = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const a = (1 - t) ** 3;
  const b = 3 * (1 - t) ** 2 * t;
  const c = 3 * (1 - t) * t * t;
  const d = t ** 3;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
};

/** dense polyline + cumulative arc length */
export const buildPath = (segs: Seg[]): Path => {
  const pts: Pt[] = [];
  for (const seg of segs) {
    if (seg[0] === "L") {
      const [, a, b] = seg;
      const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6));
      for (let i = pts.length ? 1 : 0; i <= n; i++) pts.push({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n });
    } else {
      const [, p0, p1, p2, p3] = seg;
      const n = 160;
      for (let i = pts.length ? 1 : 0; i <= n; i++) pts.push(cubic(p0, p1, p2, p3, i / n));
    }
  }
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, s, L: s[s.length - 1] };
};

/** position + unit normal at arc length s (clamped to the path) */
export const pathAt = (p: Path, s: number) => {
  const t = Math.max(0, Math.min(p.L, s));
  let lo = 0;
  let hi = p.s.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (p.s[mid] <= t) lo = mid;
    else hi = mid;
  }
  const a = p.pts[lo];
  const b = p.pts[hi];
  const span = p.s[hi] - p.s[lo] || 1;
  const k = (t - p.s[lo]) / span;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: a.x + dx * k, y: a.y + dy * k, nx: -dy / len, ny: dx / len };
};

const gauss = (x: number, c: number, s: number) => Math.exp(-((x - c) ** 2) / (2 * s * s));

export const Wire: React.FC<{
  path: Path;
  frame: number;
  s0?: number;
  s1?: number;
  bumps?: WireBump[];
  hum?: number;
  stroke?: number;
  color?: string;
  /** phase offset so two wires never wiggle in lockstep */
  phase?: number;
}> = ({ path, frame: f, s0 = 0, s1, bumps = [], hum = 1.4, stroke = 2.6, color = TRACE_INK, phase = 0 }) => {
  const end = Math.min(path.L, s1 ?? path.L);
  if (end - s0 < 2) return null;
  const off = (s: number) => {
    const u = s + phase;
    // longer wavelengths than kit/Scope: on a curved trace its 30px partial reads as a zigzag
    const carrier = 0.72 * Math.sin(u * 0.1 - f * 0.42) + 0.28 * Math.sin(u * 0.16 + f * 0.31);
    const amp = bumps.reduce((a, b) => a + b.amp * gauss(s, b.s, b.sigma ?? 60), 0);
    return carrier * amp + hum * Math.sin(u * 0.05 + f * 0.07);
  };
  const ptAt = (s: number) => {
    const p = pathAt(path, s);
    const o = off(s);
    return `${(p.x + p.nx * o).toFixed(1)},${(p.y + p.ny * o).toFixed(1)}`;
  };
  const line = (a: number, b: number) => {
    const out: string[] = [];
    for (let s = a; s < b; s += 3) out.push(ptAt(s));
    out.push(ptAt(b));
    return out.join(" ");
  };
  return (
    <g>
      <polyline points={line(s0, end)} fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
      {bumps.map((b, i) => {
        if (b.amp < 0.5) return null;
        const sg = b.sigma ?? 60;
        const a = Math.max(s0, b.s - 2.6 * sg);
        const c = Math.min(end, b.s + 2.6 * sg);
        if (c - a < 3) return null;
        return (
          <polyline
            key={i}
            points={line(a, c)}
            fill="none"
            stroke={`rgba(${b.rgb},${Math.min(1, 0.4 + b.amp / 26).toFixed(3)})`}
            strokeWidth={stroke + 0.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};
