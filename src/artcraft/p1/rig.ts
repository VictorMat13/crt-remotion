// ===========================================================================
// AcP1Hook rig: world layout, pulse timeline and keyed 3D camera for the
// "power-on rail" hook. Pure math (Easing + EASE only) so framing can be
// checked numerically outside Remotion.
// Camera model = src/invideo3/p1/rig.ts (keyed position + look-at, CSS chain
// translateZ(P) rotateX rotateY translate3d(-C)), same world convention:
//   x right, y DOWN (floor y = 0, up is negative), z toward the start camera.
// The rail (the scope line) runs along x = 0 on the floor, past the Claude
// mark (near the opening camera) away from the lens toward -z. The twelve Craft windows stand
// along it, alternating left / right, toed in toward the rail; each app's icon
// stands on the rail at its window's depth.
// ===========================================================================
import { Easing } from "remotion";
import { APPS, EASE, type AppId } from "../theme";

export type V3 = { x: number; y: number; z: number };

export const DUR = 240;

// ---------------------------------------------------------------- lens
// Full-bleed 1080x960, principal point at the centre of the 9:8 safe area (y 77-922).
export const CX = 540;
export const CY = 500;
export const P = 800;

export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
/** eased 0 -> 1 between frames a and b */
export const seg = (f: number, a: number, b: number, ease: (n: number) => number = TRAVEL) => ease(c01((f - a) / (b - a)));

// ---------------------------------------------------------------- world
export const WIN = { w: 800, h: 500, bottom: -100, gap: 150, yaw: 26, z0: -680, spacing: 600 } as const;
export const ICON = 128; // app icon, standing on the rail
export const CLAUDE = { z: 60, size: 170 } as const;

const hexRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

// Bright documents bloom out to white through the tube's black crush: dim them ~25%.
// Dark UIs lose their panels to the crush: flatten + lift them so the panels survive.
const DARK_UI = "contrast(0.78)";
const SHOT_GRADE: Record<AppId, { grade: string; bright: number }> = {
  photocraft: { grade: "", bright: 0.78 },
  filmcraft: { grade: DARK_UI, bright: 1.22 },
  effectcraft: { grade: DARK_UI, bright: 1.22 },
  vectorcraft: { grade: "contrast(0.9)", bright: 1.05 },
  lightcraft: { grade: DARK_UI, bright: 1.2 },
  designcraft: { grade: "", bright: 0.68 },
  pdfcraft: { grade: "", bright: 0.66 },
  soundcraft: { grade: DARK_UI, bright: 1.2 },
  wordcraft: { grade: "", bright: 0.6 },
  gridcraft: { grade: "", bright: 0.6 },
  deckcraft: { grade: "", bright: 0.6 },
  cadcraft: { grade: DARK_UI, bright: 1.22 },
};

export type Win = {
  i: number;
  id: AppId;
  rgb: string;
  side: -1 | 1;
  /** centre of the window plane */
  c: V3;
  /** rotateY in degrees (toed in toward the rail) */
  rot: number;
  /** z of the icon / station on the rail */
  z: number;
  /** CSS filter grade for the screenshot + its brightness */
  grade: string;
  bright: number;
};

export const WINDOWS: Win[] = APPS.map((a, i) => {
  const side = (i % 2 === 0 ? -1 : 1) as -1 | 1;
  const yawR = (WIN.yaw * Math.PI) / 180;
  const z = WIN.z0 - i * WIN.spacing;
  return {
    i,
    id: a.id,
    rgb: hexRgb(a.accent),
    side,
    c: { x: side * (WIN.gap + (Math.cos(yawR) * WIN.w) / 2), y: WIN.bottom - WIN.h / 2, z },
    rot: -side * WIN.yaw,
    z,
    grade: SHOT_GRADE[a.id].grade,
    bright: SHOT_GRADE[a.id].bright,
  };
});

// ---------------------------------------------------------------- the pulse
// Station index s: 0 = the Claude mark, k = window k-1. Each hop is an eased
// move to the next station; hops overlap so the pulse never stops, it only
// leans into each icon. After EffectCraft it races down the other nine.
const HOPS: [number, number, number][] = [
  [-40, 34, 1], // already racing on f0, just clear of the Claude mark
  [28, 60, 1],
  [46, 78, 1],
  [64, 94, 1],
  [86, 132, 9.4], // past the last window, into the deep
];
export const pulseS = (f: number) => HOPS.reduce((a, [t0, t1, n]) => a + n * seg(f, t0, t1), 0);
export const stationZ = (s: number) => (s <= 1 ? CLAUDE.z + (WIN.z0 - CLAUDE.z) * s : WIN.z0 - (s - 1) * WIN.spacing);
export const pulseZ = (f: number) => stationZ(pulseS(f));
/** pulse envelope: full while racing, fades out deep after the row */
export const pulseAmp = (f: number) => 1 - seg(f, 118, 138, DECEL);

/** frame the pulse reaches window i */
export const ARRIVE: number[] = WINDOWS.map((w) => {
  for (let k = -80; k < 1200; k++) {
    const f = k / 4;
    if (pulseS(f) >= w.i + 1 - 1e-6) return f;
  }
  return 9999;
});

// power-on: a bright line snaps across (2f), then opens vertically to the picture (8f, eased)
export const LINE_F = 2;
export const OPEN_F = 8;
export const powerOf = (i: number, f: number) => {
  const a = ARRIVE[i];
  const line = seg(f, a, a + LINE_F, DECEL); // line width 0 -> 1
  const open = seg(f, a + LINE_F - 0.5, a + LINE_F + OPEN_F, ENTER); // picture height 0 -> 1
  const beam = f < a ? 0 : 1 - seg(f, a + LINE_F + 1, a + LINE_F + OPEN_F, DECEL); // beam brightness
  const over = f < a ? 0 : 1 - seg(f, a + LINE_F, a + 13, DECEL); // overexposure decays
  const wake = seg(f, a - 2, a + 8, ENTER); // icon wakes
  return { on: f >= a, line, open, beam, over, wake };
};

// later packets trickle down the rail from the Claude mark (they keep the trace alive)
export const PACKETS = [128, 150, 171, 191, 210, 228].map((t0) => ({ t0, t1: t0 + 120 }));
export const packetZ = (p: { t0: number; t1: number }, f: number) => CLAUDE.z - 7400 * seg(f, p.t0, p.t1, DECEL);

// ---------------------------------------------------------------- camera
// 0-85    behind the pulse, riding down the rail (already moving on f0);
//         PhotoCraft slides off the left edge ~45-62, FilmCraft passes on the right ~84-100
// 72-196  crane: rises and pulls back over the row while the other nine light
// 96-240  hands over into a push toward PhotoCraft (front, sharp); the push
//         is still under way on the last frame
// Each pose is a full (camera, look-at) pair; the moves are overlapping eased
// segments, so the camera never stops between them.
export type CamParams = { C: V3; T: V3 };
type Pose = { C: V3; T: V3 };
const POSE_START: Pose = { C: { x: 0, y: -520, z: 1040 }, T: { x: 0, y: -40, z: -950 } };
const POSE_RIDE: Pose = { C: { x: 0, y: -490, z: -800 }, T: { x: 0, y: -80, z: -2700 } };
const POSE_CRANE: Pose = { C: { x: -110, y: -1180, z: 620 }, T: { x: -470, y: -120, z: -1500 } };
/** framing on the last frame (PhotoCraft x ~110-810, the row receding to the right) */
const POSE_END: Pose = { C: { x: -250, y: -900, z: 150 }, T: { x: -550, y: -200, z: -1100 } };
// move windows per axis: the crane's pull-back (z) turns into the push while it is still
// rising (y) and sliding left (x), so the camera never comes to rest between the moves
type Win3 = { x: [number, number]; y: [number, number]; z: [number, number] };
const RIDE: Win3 = { x: [-40, 104], y: [-40, 104], z: [-40, 104] };
const CRANE: Win3 = { x: [84, 196], y: [72, 160], z: [76, 150] };
const PUSH: Win3 = { x: [120, 300], y: [128, 300], z: [96, 300] };
const CRANE_T: [number, number] = [78, 160];
const PUSH_T: [number, number] = [120, 300];
const AXES = ["x", "y", "z"] as const;

const track = (f: number, key: "C" | "T"): V3 => {
  const out = { ...POSE_START[key] };
  for (const a of AXES) {
    const cw = key === "C" ? CRANE[a] : CRANE_T;
    const pw = key === "C" ? PUSH[a] : PUSH_T;
    const kPush = seg(f, pw[0], pw[1]) / seg(DUR - 1, pw[0], pw[1]); // 1 on the last frame, still rising
    out[a] +=
      (POSE_RIDE[key][a] - POSE_START[key][a]) * seg(f, RIDE[a][0], RIDE[a][1]) +
      (POSE_CRANE[key][a] - POSE_RIDE[key][a]) * seg(f, cw[0], cw[1]) +
      (POSE_END[key][a] - POSE_CRANE[key][a]) * kPush;
  }
  return out;
};

const ORBIT_RAD = -0.22;
const ORBIT_T: [number, number] = [126, 290];

export const camParams = (f: number): CamParams => {
  const C = track(f, "C");
  const T = track(f, "T");
  // phase 3 orbit (orchestrator, Oct 13): the camera swings around its look-at point while it
  // pushes, so the row and the floor slide past each other (visible parallax on every frame)
  const orbit = ORBIT_RAD * seg(f, ORBIT_T[0], ORBIT_T[1]);
  if (orbit !== 0) {
    const dx = C.x - T.x;
    const dz = C.z - T.z;
    C.x = T.x + dx * Math.cos(orbit) - dz * Math.sin(orbit);
    C.z = T.z + dx * Math.sin(orbit) + dz * Math.cos(orbit);
  }
  // ambient drift so no frame is ever frozen
  C.x += 6 * Math.sin(f / 37);
  C.y += 4 * Math.sin(f / 51 + 1.1);
  return { C, T };
};

export type Cam = { C: V3; T: V3; th: number; ph: number; ct: number; st: number; cp: number; sp: number; focus: number };

const orient = ({ C, T }: CamParams): Cam => {
  const fx = T.x - C.x;
  const fy = T.y - C.y;
  const fz = T.z - C.z;
  const th = Math.atan2(fx, -fz);
  const ph = Math.atan2(-fy, Math.hypot(fx, fz));
  return { C, T, th, ph, ct: Math.cos(th), st: Math.sin(th), cp: Math.cos(ph), sp: Math.sin(ph), focus: 1 };
};

// Same math as the CSS chain translateZ(P) rotateX(ph) rotateY(th) translate3d(-C).
export const toCam = (cam: Cam, p: V3) => {
  const x = p.x - cam.C.x;
  const y = p.y - cam.C.y;
  const z = p.z - cam.C.z;
  const x1 = cam.ct * x + cam.st * z;
  const z1 = -cam.st * x + cam.ct * z;
  const y2 = cam.cp * y - cam.sp * z1;
  const z2 = cam.sp * y + cam.cp * z1;
  return { x: x1, y: y2, d: -z2 };
};

export const project = (cam: Cam, p: V3) => {
  const q = toCam(cam, p);
  const s = P / q.d;
  return { d: q.d, s, sx: CX + q.x * s, sy: CY + q.y * s };
};

// focus: rides the window that is powering on (phase 1), then settles on PhotoCraft
const focusPoint = (f: number): V3 => {
  const s = Math.min(3, Math.max(1, pulseS(f + 4)));
  const i0 = Math.min(2, Math.floor(s) - 1);
  const i1 = Math.min(2, i0 + 1);
  const u = s - 1 - i0;
  const a = WINDOWS[i0].c;
  const b = WINDOWS[i1].c;
  const ride: V3 = { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u };
  const k = seg(f, 96, 168);
  const pc = WINDOWS[0].c;
  return { x: ride.x + (pc.x - ride.x) * k, y: ride.y + (pc.y - ride.y) * k, z: ride.z + (pc.z - ride.z) * k };
};

export const camAt = (f: number): Cam => {
  const cam = orient(camParams(f));
  cam.focus = toCam(cam, focusPoint(f)).d;
  return cam;
};

// depth of field: screen-space blur from relative defocus
export const DOF_K = 6;
export const DOF_BAND = 0.15;
export const DOF_MAX = 8;
export const dofPx = (cam: Cam, d: number) => {
  const b = Math.min(DOF_MAX, DOF_K * Math.max(0, Math.abs(cam.focus / Math.max(1, d) - 1) - DOF_BAND));
  return b < 0.5 ? 0 : Math.round(b * 4) / 4;
};
