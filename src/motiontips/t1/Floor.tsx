import React from "react";
import { PH } from "../theme";
import { WORD_AT } from "./Terminal";
import {
  ARRIVE,
  DECEL,
  ENTER_KEY,
  PACKETS,
  SCREENS,
  TRACE_Y,
  TRACE_Z0,
  c01,
  packetZ,
  project,
  pulseAmp,
  pulseZ,
  seg,
  toCam,
  type Cam,
  type V3,
} from "./rig";

// ===========================================================================
// The floor of the tube (at the trace's height: the screens and the line sit on it), drawn in screen space from the rig's own projection
// (same math as the CSS camera, so it lines up with the 3D planes). Drawn
// sharp, outside the motion blur (blur smears thin lines):
//  - a faint graticule (the scope's grid) on the floor and overhead
//  - the scope line as a rail along x = 0 from the terminal's top edge into
//    the deep. Its waveform lies in the floor plane (lateral), so it reads as
//    a wave from a camera riding along it. Packets are local wave packets:
//    Victor's voice (green) while he dictates, the coral pulse Claude sends
//    when the prompt goes, each screen answering in its own color, then coral
//    packets trickling down to keep the line alive.
// The ribbon is a filled polygon with perspective width (never under ~2.6px,
// the tube eats 1px lines).
// ===========================================================================

const NEAR = 36;
const Z_BACK = 1600; // the graticule runs behind the opening camera
const Z_DEEP = -9000;

type Bump = { z: number; amp: number; sigma: number; rgb: string };

const gauss = (x: number, c: number, s: number) => Math.exp(-((x - c) ** 2) / (2 * s * s));
const wordPulse = (f: number) => WORD_AT.reduce((a, t) => a + Math.exp(-((f - t) ** 2) / (2 * 2.4 * 2.4)), 0);

/** where the voice shows: the trace just behind the terminal's top edge, where it leaves it */
const VOICE_Z = TRACE_Z0 - 170;

/** every packet on the rail at frame f */
export const railBumps = (f: number): Bump[] => {
  const out: Bump[] = [];
  // Victor dictating: green, swelling on every word, gone once the prompt is sent
  const dict = c01((f + 20) / 6) * (1 - seg(f, ENTER_KEY - 1, ENTER_KEY + 8, DECEL));
  if (dict > 0.01) out.push({ z: VOICE_Z, amp: (10 + 18 * Math.min(1.3, wordPulse(f))) * dict * (0.85 + 0.15 * Math.sin(f * 0.21)), sigma: 120, rgb: PH.userRgb });
  // the pulse: a coral packet, stretched while it races
  const pz = pulseZ(f);
  const v = Math.abs(pulseZ(f + 0.5) - pulseZ(f - 0.5));
  const pa = pulseAmp(f);
  if (pa > 0.01) out.push({ z: pz, amp: 34 * pa, sigma: 70 + 0.6 * v, rgb: PH.claudeRgb });
  // trickling packets (the trace never goes quiet)
  for (const p of PACKETS) {
    if (f < p.t0 - 1) continue;
    const z = packetZ(p, f);
    const a = c01((f - p.t0 + 1) / 5) * (1 - seg(f, p.t1 - 30, p.t1, DECEL));
    if (a > 0.01) out.push({ z, amp: 20 * a, sigma: 64, rgb: PH.claudeRgb });
  }
  // each screen answers on its own station when the pulse lands, then idles; packets passing make it blip
  for (const s of SCREENS) {
    const a = ARRIVE[s.i];
    if (f < a - 2) continue;
    const hit = c01((f - a + 2) / 4) * (1 - 0.65 * seg(f, a + 4, a + 34, DECEL));
    let blip = 0;
    for (const p of PACKETS) if (f >= p.t0) blip += gauss(packetZ(p, f), s.z, 160);
    const amp = 22 * hit * (0.8 + 0.2 * Math.sin(f * 0.17 + s.i)) + 12 * Math.min(1, blip);
    if (amp > 0.5) out.push({ z: s.z, amp, sigma: 85, rgb: s.clip.rgb });
  }
  return out;
};

const lateralAt = (z: number, f: number, bumps: Bump[]) => {
  const carrier = 0.62 * Math.sin(z * 0.045 - f * 0.42) + 0.38 * Math.sin(z * 0.11 + f * 0.31);
  let amp = 0;
  for (const b of bumps) amp += b.amp * gauss(z, b.z, b.sigma);
  return carrier * amp + 2.2 * Math.sin(z * 0.018 + f * 0.07);
};

/** first z (from the foot of the terminal toward the deep) in front of the lens */
const firstVisibleZ = (cam: Cam, from: number) => {
  let z = from;
  for (let k = 0; k < 500 && z > Z_DEEP; k++) {
    if (toCam(cam, { x: 0, y: TRACE_Y, z }).d >= NEAR) return z;
    z -= 20;
  }
  return Z_DEEP;
};

type SP = { x: number; y: number; s: number };

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

const sampleRail = (cam: Cam, f: number, bumps: Bump[], z0: number, z1: number) => {
  const pts: SP[] = [];
  let z = z0;
  while (z >= z1) {
    const q = project(cam, { x: lateralAt(z, f, bumps), y: TRACE_Y, z });
    if (q.d >= NEAR) pts.push({ x: q.sx, y: q.sy, s: q.s });
    let near = false;
    for (const b of bumps) if (Math.abs(z - b.z) < 2.8 * b.sigma) near = true;
    const step = Math.min(near ? 7 : 48, Math.max(4, q.d * 0.006));
    z -= step;
  }
  return pts;
};

// ------------------------------------------------------------- graticule
const G = 280;
const XN = 18;
const lerp3 = (a: V3, b: V3, t: number): V3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
const clipped = (cam: Cam, a: V3, b: V3) => {
  const da = toCam(cam, a).d;
  const db = toCam(cam, b).d;
  if (da < NEAR && db < NEAR) return null;
  let p = a;
  let q = b;
  if (da < NEAR) p = lerp3(a, b, (NEAR - da) / (db - da));
  if (db < NEAR) q = lerp3(b, a, (NEAR - db) / (da - db));
  const P1 = project(cam, p);
  const P2 = project(cam, q);
  return { x1: P1.sx, y1: P1.sy, x2: P2.sx, y2: P2.sy, d: (P1.d + P2.d) / 2 };
};
const gridAlpha = (d: number) => 0.36 * (1 - 0.8 * c01((d - 2400) / 9000)) * c01(d / 260);
/** the tube's ceiling: the same graticule overhead, above the highest camera */
const CEIL_Y = -2300;
const ceilAlpha = (d: number) => 0.27 * (1 - c01((d - 8000) / 5000)) * c01(d / 260);

export const Floor: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const bumps = railBumps(frame);
  const zA = firstVisibleZ(cam, TRACE_Z0);

  const grid: React.ReactNode[] = [];
  const CH = 8;
  const zSpan = (Z_BACK - Z_DEEP) / CH;
  for (const [y, alpha] of [
    [TRACE_Y, gridAlpha],
    [CEIL_Y, ceilAlpha],
  ] as const) {
    for (let k = -XN; k <= XN; k++) {
      const x = k * G;
      for (let c = 0; c < CH; c++) {
        const s = clipped(cam, { x, y, z: Z_BACK - c * zSpan }, { x, y, z: Z_BACK - (c + 1) * zSpan });
        if (!s) continue;
        const a = alpha(s.d);
        if (a < 0.02) continue;
        grid.push(<line key={`l${y}-${k}-${c}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={`rgba(233,231,226,${a.toFixed(3)})`} strokeWidth={2} />);
      }
    }
    for (let z = Math.floor(Z_BACK / G) * G; z >= Z_DEEP; z -= G) {
      const s = clipped(cam, { x: -XN * G, y, z }, { x: XN * G, y, z });
      if (!s) continue;
      const a = alpha(toCam(cam, { x: 0, y, z }).d);
      if (a < 0.02) continue;
      grid.push(<line key={`c${y}-${z}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={`rgba(233,231,226,${a.toFixed(3)})`} strokeWidth={2} />);
    }
  }

  // the rail: idle line + lit packets over it
  const base = sampleRail(cam, frame, bumps, zA, Z_DEEP);
  const lit = bumps
    .filter((b) => b.amp >= 1.2)
    .map((b, i) => {
      const z0 = Math.min(zA, b.z + 2.6 * b.sigma);
      const z1 = Math.max(Z_DEEP, b.z - 2.6 * b.sigma);
      if (z0 <= z1) return null;
      const pts = sampleRail(cam, frame, bumps, z0, z1);
      if (pts.length < 2) return null;
      return <polygon key={i} points={ribbon(pts, 8, 3.2, 9)} fill={`rgba(${b.rgb},${Math.min(1, 0.45 + b.amp / 28).toFixed(3)})`} />;
    });

  return (
    <svg width={1080} height={960} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g>{grid}</g>
      <polygon points={ribbon(base, 6, 2.6, 7)} fill="rgba(243,241,236,0.82)" />
      {lit}
    </svg>
  );
};

