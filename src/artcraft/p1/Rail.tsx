import React from "react";
import { PH } from "../theme";
import { ARRIVE, CLAUDE, DECEL, PACKETS, WINDOWS, c01, packetZ, project, pulseAmp, pulseZ, seg, toCam, type Cam, type V3 } from "./rig";

// ===========================================================================
// The floor of the tube, drawn in screen space from the rig's own projection
// (same math as the CSS camera, so it lines up with the 3D planes):
//  - a faint graticule (the scope's grid) lying on the floor, fading with depth
//  - the scope line as a rail along x = 0, from behind the Claude mark into
//    the deep. Its waveform lies in the floor plane (lateral), so it reads as
//    a wave from a camera riding along it. Packets are local wave packets in a
//    color: the Claude voice + pulse (coral), each app answering (its accent).
// The ribbon is a filled polygon with perspective width (never under ~1.8px,
// the tube eats 1px lines).
// ===========================================================================

const NEAR = 36;
const Z_BACK = 1800; // the rail starts behind the opening camera
const Z_DEEP = -11800;

type Bump = { z: number; amp: number; sigma: number; rgb: string };

const gauss = (x: number, c: number, s: number) => Math.exp(-((x - c) ** 2) / (2 * s * s));

/** every packet on the rail at frame f */
export const railBumps = (f: number): Bump[] => {
  const out: Bump[] = [];
  // Claude is talking at the open (the pulse is leaving it), then answers each later packet it sends
  const launch = PACKETS.reduce((a, p) => Math.max(a, c01((f - p.t0 + 6) / 6) * (1 - seg(f, p.t0, p.t0 + 22, DECEL))), 0);
  const claudeVoice = Math.max(1 - seg(f, 4, 40, DECEL), 0.75 * launch) * (0.78 + 0.22 * Math.sin(f * 0.21));
  out.push({ z: CLAUDE.z, amp: 26 * claudeVoice + 3, sigma: 95, rgb: PH.claudeRgb });
  // the pulse: a coral packet, stretched while it races
  const pz = pulseZ(f);
  const v = Math.abs(pulseZ(f + 0.5) - pulseZ(f - 0.5));
  const pa = pulseAmp(f);
  if (pa > 0.01) out.push({ z: pz, amp: 34 * pa, sigma: 70 + 0.7 * v, rgb: PH.claudeRgb });
  // trickling packets (the trace never goes quiet)
  for (const p of PACKETS) {
    if (f < p.t0 - 1) continue;
    const z = packetZ(p, f);
    const a = c01((f - p.t0 + 1) / 5) * (1 - seg(f, p.t1 - 30, p.t1, DECEL));
    if (a > 0.01) out.push({ z, amp: 20 * a, sigma: 64, rgb: PH.claudeRgb });
  }
  // each app answers on its own station when the pulse lands, then idles; packets passing make it blip
  for (const w of WINDOWS) {
    const a = ARRIVE[w.i];
    if (f < a - 2) continue;
    const hit = c01((f - a + 2) / 4) * (1 - 0.7 * seg(f, a + 4, a + 34, DECEL));
    let blip = 0;
    for (const p of PACKETS) if (f >= p.t0) blip += gauss(packetZ(p, f), w.z, 160);
    const amp = 22 * hit * (0.8 + 0.2 * Math.sin(f * 0.17 + w.i)) + 12 * Math.min(1, blip);
    if (amp > 0.5) out.push({ z: w.z, amp, sigma: 85, rgb: w.rgb });
  }
  return out;
};

const lateralAt = (z: number, f: number, bumps: Bump[]) => {
  const carrier = 0.62 * Math.sin(z * 0.045 - f * 0.42) + 0.38 * Math.sin(z * 0.11 + f * 0.31);
  let amp = 0;
  for (const b of bumps) amp += b.amp * gauss(z, b.z, b.sigma);
  return carrier * amp + 2.2 * Math.sin(z * 0.018 + f * 0.07);
};

/** first z (from Z_BACK toward the deep) in front of the lens */
const firstVisibleZ = (cam: Cam) => {
  let z = Z_BACK;
  for (let k = 0; k < 400 && z > Z_DEEP; k++) {
    if (toCam(cam, { x: 0, y: 0, z }).d >= NEAR) return z;
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
    const q = project(cam, { x: lateralAt(z, f, bumps), y: 0, z });
    if (q.d >= NEAR) pts.push({ x: q.sx, y: q.sy, s: q.s });
    let near = false;
    for (const b of bumps) if (Math.abs(z - b.z) < 2.8 * b.sigma) near = true;
    const step = Math.min(near ? 7 : 48, Math.max(4, q.d * 0.006));
    z -= step;
  }
  return pts;
};

// ------------------------------------------------------------- graticule
const G = 260;
const XN = 20;
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
const gridAlpha = (d: number) => 0.36 * (1 - 0.8 * c01((d - 2400) / 10000)) * c01(d / 260);
/** the tube's ceiling: the same graticule overhead. It is only ever seen far away (the camera looks down the
 *  tunnel), so it keeps its strength with depth and fades only near the end of the tube. */
const CEIL_Y = -1350;
const ceilAlpha = (d: number) => 0.27 * (1 - c01((d - 8000) / 5000)) * c01(d / 260);

export const Floor: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const bumps = railBumps(frame);
  const zA = firstVisibleZ(cam);

  // graticule: lines along the rail (chunked so they fade with depth) and across it, on the floor and overhead
  const grid: React.ReactNode[] = [];
  const CH = 8;
  const zSpan = (Z_BACK - Z_DEEP) / CH;
  for (const [y, alpha] of [
    [0, gridAlpha],
    [CEIL_Y, ceilAlpha],
  ] as const) {
    for (let k = -XN; k <= XN; k++) {
      if (k === 0 && y === 0) continue; // the rail is the floor's centre line
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

  // the rail
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
