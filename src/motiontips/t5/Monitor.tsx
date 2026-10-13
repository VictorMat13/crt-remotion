import React from "react";
import { PH } from "../theme";
import {
  BEATS,
  ECG_L,
  ECG_R,
  GAP,
  GRID,
  KICK,
  KICK_HEAD,
  KICK_X,
  LIFE,
  SCX,
  SCY,
  V,
  ageAt,
  blankAt,
  camAt,
  headX,
  lifeEnv,
  lifeFront,
  ownerK,
  yAt,
} from "./plan";

// ===========================================================================
// The heart monitor. Two layers, both drawn sharp outside the camera blur
// (motion blur smears thin lines):
//   Grid  - faint ECG grid on a background plane (parallax + a slow scroll)
//   Trace - the scope line as a bedside monitor: a sweep head runs right and
//           records the heart; the next head overwrites it behind a short
//           erase bar. Old rhythm in ink, flatline, then the green kick and
//           the line coming alive outward from it.
// ===========================================================================

const W = 1080;
const H = 960;
const INK = "233,231,226";
const GREEN = PH.userRgb;

// ---------------------------------------------------------------- grid
export const Grid: React.FC<{ f: number }> = ({ f }) => {
  const cam = camAt(f);
  const zg = 1 + (cam.z - 1) * GRID.parallax;
  const ox = cam.x * GRID.parallax + GRID.scroll * f;
  const oy = cam.y * GRID.parallax;
  const m = GRID.minor;
  const per = GRID.major / GRID.minor;
  const lines: React.ReactNode[] = [];
  const add = (vertical: boolean, g0: number, g1: number, o: number, c: number) => {
    for (let i = Math.floor(g0 / m); i <= Math.ceil(g1 / m); i++) {
      const s = c + (i * m - o) * zg;
      const major = ((i % per) + per) % per === 0;
      const stroke = `rgba(${INK},${major ? 0.34 : 0.14})`;
      const sw = major ? 1.6 : 1;
      lines.push(
        vertical ? (
          <line key={`v${i}`} x1={s} y1={0} x2={s} y2={H} stroke={stroke} strokeWidth={sw} />
        ) : (
          <line key={`h${i}`} x1={0} y1={s} x2={W} y2={s} stroke={stroke} strokeWidth={sw} />
        ),
      );
    }
  };
  add(true, ox - SCX / zg, ox + (W - SCX) / zg, ox, SCX);
  add(false, oy - SCY / zg, oy + (H - SCY) / zg, oy, SCY);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      {lines}
    </svg>
  );
};

// ---------------------------------------------------------------- trace
type Pt = [number, number];
const TAIL = V * 22; // fresh phosphor behind each head, px

/** sample xs: a coarse grid, dense around every R peak (spikes never alias), exact head + erase-bar edges */
const sampleXs = (f: number, x0: number, x1: number) => {
  const xs: number[] = [];
  for (let x = x0; x <= x1; x += 3) xs.push(x);
  const kLo = ownerK(x1, f) - 1;
  const kHi = ownerK(x0, f) + 1;
  for (let k = kLo; k <= kHi; k++) {
    const h = headX(k, f);
    xs.push(h, h + GAP + 0.01);
    for (const b of BEATS) {
      const p = headX(k, b.t);
      if (p < x0 - ECG_R || p > x1 - ECG_L) continue;
      for (let u = ECG_L; u <= ECG_R; u += 1.5) xs.push(p + u);
      for (let u = -14; u <= 14; u += 0.5) xs.push(p + u);
    }
  }
  return Array.from(new Set(xs.filter((x) => x >= x0 && x <= x1).map((x) => Math.round(x * 100) / 100))).sort((a, b) => a - b);
};

/** runs of the visible line, split at erase bars, optionally limited to [a, b] and to one owner head */
const runsOf = (f: number, xs: number[], a = -Infinity, b = Infinity, owner?: number) => {
  const runs: Pt[][] = [];
  let cur: Pt[] = [];
  for (const x of xs) {
    const ok = x >= a && x <= b && !blankAt(x, f) && (owner === undefined || ownerK(x, f) === owner);
    if (!ok) {
      if (cur.length > 1) runs.push(cur);
      cur = [];
      continue;
    }
    cur.push([x, yAt(x, f)]);
  }
  if (cur.length > 1) runs.push(cur);
  return runs;
};
const pts = (r: Pt[]) => r.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

export const Trace: React.FC<{ f: number }> = ({ f }) => {
  const cam = camAt(f);
  const x0 = Math.floor(cam.x - (SCX + 40) / cam.z);
  const x1 = Math.ceil(cam.x + (W - SCX + 40) / cam.z);
  const xs = sampleXs(f, x0, x1);
  const all = runsOf(f, xs);

  // heads in (or just off) view
  const heads: { k: number; h: number }[] = [];
  for (let k = ownerK(x1 + TAIL, f) - 1; k <= ownerK(x0, f) + 1; k++) {
    const h = headX(k, f);
    if (h > x0 - 20 && h - TAIL < x1) heads.push({ k, h });
  }

  // the line coming alive around the kick (green, soft-edged both ways)
  const env = lifeEnv(f);
  const lifeR = lifeFront(f) + LIFE.soft;
  const lifeA = KICK_X - lifeR;
  const lifeB = KICK_X + lifeR;
  const life = env > 0.004 ? runsOf(f, xs, Math.max(x0, lifeA), Math.min(x1, lifeB)) : [];
  const softT = LIFE.soft / (2 * lifeR);

  // green beats (after the kick), each where its own head recorded it
  const live: { runs: Pt[][]; age: number; key: string }[] = [];
  for (const [bi, b] of BEATS.entries()) {
    if (!b.live || b.t > f + 2) continue;
    for (let k = ownerK(x1, f) - 1; k <= ownerK(x0, f) + 1; k++) {
      const p = headX(k, b.t);
      if (p < x0 - ECG_R || p > x1 - ECG_L || ownerK(p, f) !== k) continue;
      const r = runsOf(f, xs, p + ECG_L - 4, p + ECG_R + 4, k);
      if (r.length) live.push({ runs: r, age: Math.max(0, ageAt(p, f)), key: `${bi}-${k}` });
    }
  }

  const tf = `translate(${(SCX - cam.x * cam.z).toFixed(2)} ${(SCY - cam.y * cam.z).toFixed(2)}) scale(${cam.z.toFixed(5)})`;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        {heads.map(({ k, h }) => (
          <linearGradient key={k} id={`t5-tail-${k}`} gradientUnits="userSpaceOnUse" x1={h - TAIL} y1={0} x2={h} y2={0}>
            <stop offset="0" stopColor={`rgb(${INK})`} stopOpacity={0} />
            <stop offset="0.55" stopColor={`rgb(${INK})`} stopOpacity={0.22} />
            <stop offset="1" stopColor={`rgb(${INK})`} stopOpacity={0.95} />
          </linearGradient>
        ))}
        {life.length ? (
          <linearGradient id="t5-life" gradientUnits="userSpaceOnUse" x1={lifeA} y1={0} x2={lifeB} y2={0}>
            <stop offset="0" stopColor={`rgb(${GREEN})`} stopOpacity={0} />
            <stop offset={softT.toFixed(4)} stopColor={`rgb(${GREEN})`} stopOpacity={0.9 * env} />
            <stop offset={(1 - softT).toFixed(4)} stopColor={`rgb(${GREEN})`} stopOpacity={0.9 * env} />
            <stop offset="1" stopColor={`rgb(${GREEN})`} stopOpacity={0} />
          </linearGradient>
        ) : null}
      </defs>
      <g transform={tf}>
        {/* a dark keyline under the line so it reads where a spike crosses a card */}
        {all.map((r, i) => (
          <polyline key={`u${i}`} points={pts(r)} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth={9} strokeLinejoin="round" />
        ))}
        {all.map((r, i) => (
          <polyline key={`b${i}`} points={pts(r)} fill="none" stroke={`rgba(${INK},0.62)`} strokeWidth={2.8} strokeLinejoin="round" />
        ))}
        {/* fresh phosphor behind each sweep head */}
        {heads.map(({ k, h }) =>
          runsOf(f, xs, Math.max(x0, h - TAIL), Math.min(x1, h), k).map((r, i) => (
            <polyline key={`t${k}-${i}`} points={pts(r)} fill="none" stroke={`url(#t5-tail-${k})`} strokeWidth={3.2} strokeLinejoin="round" />
          )),
        )}
        {life.map((r, i) => (
          <polyline key={`l${i}`} points={pts(r)} fill="none" stroke="url(#t5-life)" strokeWidth={3.2} strokeLinejoin="round" />
        ))}
        {live.map(({ runs, age, key }) =>
          runs.map((r, i) => (
            <polyline
              key={`g${key}-${i}`}
              points={pts(r)}
              fill="none"
              stroke={`rgba(${GREEN},${(0.6 + 0.4 * Math.exp(-age / 30)).toFixed(3)})`}
              strokeWidth={3.6}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )),
        )}
        {/* the sweep heads */}
        {heads.map(({ k, h }) =>
          h >= x0 && h <= x1 ? (
            <circle key={`d${k}`} cx={h} cy={yAt(h, f)} r={6.5} fill={k === KICK_HEAD && f >= KICK - 0.5 ? PH.user : `rgb(${INK})`} />
          ) : null,
        )}
      </g>
    </svg>
  );
};
