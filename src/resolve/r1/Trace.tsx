import React from "react";
import { PH } from "../theme";
import { occluders, type Quad } from "./World";
import {
  CLAUDE,
  DECEL,
  H,
  MARKER_RGB,
  MOMENT_IDX,
  PICK,
  RV,
  STRIP,
  TL,
  TRACE_Y,
  TRACE_Z0,
  TRACE_Z1,
  W,
  c01,
  panelAt,
  project,
  pulseAmp,
  pulseSx,
  seg,
  thumbMid,
  toCam,
  type Cam,
  type V3,
} from "./rig";

// ===========================================================================
// The scope trace: the rail along the strip's top edge, from behind the
// opening camera into the horizon. Drawn in screen space from the rig's own
// projection, OUTSIDE the camera blur (thin lines smear dark under an
// 8-sample blur), so it is hidden by hand where a plane stands between it and
// the lens (ray tests against the Claude mark, the moments in flight and the
// two panels). The wave is vertical, in world px, so it shrinks with depth.
//   coral  = Claude: talks at its mark, sends the pulse racing down the rail
//   marker colours = each best moment's station answers as the pulse lands
// ===========================================================================

type Bump = { z: number; amp: number; sigma: number; rgb: string };
const gauss = (x: number, c: number, s: number) => Math.exp(-((x - c) ** 2) / (2 * s * s));
const coral = PH.claudeRgb;
const NEAR = 40;
/** idle trace ink, a bit brighter than PH.trace so it survives the CRT grade */
const TRACE_INK = "rgba(243,241,236,0.55)";
const X = STRIP.x + 8; // a hair into the room

const stationZ = (k: number) => STRIP.z0 - thumbMid(MOMENT_IDX[k]);

export const traceBumps = (f: number): Bump[] => {
  const out: Bump[] = [];
  // Claude talks as it sends the pulse, then keeps a low voice
  const voice = (0.35 + 0.65 * (1 - seg(f, 6, 46, DECEL))) * (0.78 + 0.22 * Math.sin(f * 0.23));
  out.push({ z: CLAUDE.z, amp: 46 * voice, sigma: 150, rgb: coral });
  // the pulse: a coral packet, stretched while it races
  const pz = STRIP.z0 - pulseSx(f);
  const v = Math.abs(pulseSx(f + 0.5) - pulseSx(f - 0.5));
  const pa = pulseAmp(f);
  if (pa > 0.01) out.push({ z: pz, amp: 70 * pa, sigma: 140 + 0.55 * v, rgb: coral });
  // each best moment's station answers in its marker colour when the pulse lands
  PICK.forEach((t, k) => {
    if (f < t - 2) return;
    const hit = c01((f - t + 2) / 4) * (1 - 0.75 * seg(f, t + 4, t + 36, DECEL));
    const amp = 52 * hit * (0.8 + 0.2 * Math.sin(f * 0.19 + k));
    if (amp > 0.5) out.push({ z: stationZ(k), amp, sigma: 210, rgb: MARKER_RGB[k] });
  });
  return out;
};

const yAt = (z: number, f: number, bumps: Bump[]) => {
  const carrier = 0.62 * Math.sin(z * 0.05 - f * 0.42) + 0.38 * Math.sin(z * 0.12 + f * 0.31);
  let amp = 0;
  for (const b of bumps) amp += b.amp * gauss(z, b.z, b.sigma);
  return TRACE_Y + carrier * amp + 3 * Math.sin(z * 0.011 + f * 0.07);
};

// ------------------------------------------------------------- occlusion
const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const panelQuad = (p: typeof TL): Quad => ({
  c: panelAt(p, (p.u0 + p.u1) / 2, (p.v0 + p.v1) / 2),
  u: { x: 1, y: 0, z: 0 },
  hw: (p.u1 - p.u0) / 2,
  hh: (p.v1 - p.v0) / 2,
});
const PANELS: Quad[] = [panelQuad(TL), panelQuad(RV)];

const hidden = (C: V3, Q: V3, quads: Quad[]) => {
  const dir = sub(Q, C);
  for (const q of quads) {
    const n: V3 = { x: -q.u.z, y: 0, z: q.u.x };
    const den = dot(dir, n);
    if (Math.abs(den) < 1e-9) continue;
    const t = dot(sub(q.c, C), n) / den;
    if (t <= 0.0005 || t >= 0.999) continue;
    const hit: V3 = { x: C.x + dir.x * t, y: C.y + dir.y * t, z: C.z + dir.z * t };
    const r = sub(hit, q.c);
    if (Math.abs(dot(r, q.u)) <= q.hw && Math.abs(r.y) <= q.hh) return true;
  }
  return false;
};

// ------------------------------------------------------------- drawing
type SP = { x: number; y: number; s: number; vis: boolean };

const ribbon = (pts: SP[], wWorld: number, wMin: number, wMax: number) => {
  if (pts.length < 2) return "";
  const L: string[] = [];
  const R: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const l = Math.hypot(tx, ty) || 1;
    tx /= l;
    ty /= l;
    const hw = Math.min(wMax, Math.max(wMin, wWorld * pts[i].s)) / 2;
    L.push(`${(pts[i].x - ty * hw).toFixed(1)},${(pts[i].y + tx * hw).toFixed(1)}`);
    R.push(`${(pts[i].x + ty * hw).toFixed(1)},${(pts[i].y - tx * hw).toFixed(1)}`);
  }
  return L.concat(R.reverse()).join(" ");
};

/** visible runs of the trace between z0 and z1 (z0 > z1) */
const sample = (cam: Cam, f: number, bumps: Bump[], quads: Quad[], z0: number, z1: number): SP[][] => {
  const runs: SP[][] = [];
  let run: SP[] = [];
  let z = z0;
  while (z >= z1) {
    const Q: V3 = { x: X, y: yAt(z, f, bumps), z };
    const q = project(cam, Q);
    let near = false;
    for (const b of bumps) if (Math.abs(z - b.z) < 2.8 * b.sigma) near = true;
    if (q.d >= NEAR) {
      const onScreen = q.sx > -200 && q.sx < W + 200 && q.sy > -200 && q.sy < H + 200;
      const vis = onScreen && !hidden(cam.C, Q, quads);
      if (vis) run.push({ x: q.sx, y: q.sy, s: q.s, vis });
      else if (run.length) {
        runs.push(run);
        run = [];
      }
    }
    const step = q.d < NEAR ? 24 : near ? Math.max(5, Math.min(14, q.d * 0.004)) : Math.max(24, q.d * 0.012);
    z -= step;
  }
  if (run.length) runs.push(run);
  return runs;
};

/** first z (from TRACE_Z0 toward the deep) in front of the lens */
const firstVisibleZ = (cam: Cam) => {
  let z = TRACE_Z0;
  for (let k = 0; k < 600 && z > TRACE_Z1; k++) {
    if (toCam(cam, { x: X, y: TRACE_Y, z }).d >= NEAR) return z;
    z -= 20;
  }
  return TRACE_Z1;
};

export const Trace: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame: f }) => {
  const bumps = traceBumps(f);
  const quads = [...occluders(cam, f), ...PANELS];
  const zA = firstVisibleZ(cam);
  const base = sample(cam, f, bumps, quads, zA, TRACE_Z1);
  const lit = bumps
    .filter((b) => b.amp >= 1.5)
    .flatMap((b, i) => {
      const z0 = Math.min(zA, b.z + 2.6 * b.sigma);
      const z1 = Math.max(TRACE_Z1, b.z - 2.6 * b.sigma);
      if (z0 <= z1) return [];
      return sample(cam, f, bumps, quads, z0, z1).map((pts, j) => (
        <polygon key={`${i}-${j}`} points={ribbon(pts, 13, 3.4, 9)} fill={`rgba(${b.rgb},${Math.min(1, 0.5 + b.amp / 60).toFixed(3)})`} />
      ));
    });
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      {base.map((pts, i) => (
        <polygon key={i} points={ribbon(pts, 9, 2.6, 7)} fill={TRACE_INK} />
      ))}
      {lit}
    </svg>
  );
};
