// ===========================================================================
// AcP7WhereHeading rig: world layout, timeline and the keyed 2.5D camera.
// Pure math (Easing + EASE only) so framing can be checked numerically.
// Camera model = src/artcraft/p1/rig.ts (position + look-at, CSS chain
// translateZ(P) rotateX rotateY translate3d(-C)); world convention:
//   x right, y DOWN, z toward the viewer. The front plane is z = 0.
// The scope trace runs along y = 0 in the front plane. Front plane, left to
// right: the mic ring (the person), the claude.ai composer under the trace,
// the Claude mark, then the custom app window hanging under the trace with a
// hairline drop from the line into its sidebar (the Fish 8 card language).
// The twelve Craft icons start ON the trace with their download bars; the row
// swings back off the line into depth (rising away), hinged near its left end.
// ===========================================================================
import { Easing } from "remotion";
import { APPS, EASE, type AppId } from "../theme";

export type V3 = { x: number; y: number; z: number };

export const W = 1080;
export const H = 960;
export const DUR = 300;

// ---------------------------------------------------------------- lens
export const CX = 540;
export const CY = 480;
export const P = 1000;

export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
/** eased 0 -> 1 between frames a and b */
export const seg = (f: number, a: number, b: number, ease: (n: number) => number = TRAVEL) => ease(c01((f - a) / (b - a)));
/** 0 -> 1 -> 0 envelope: rise over [a, a+up], fall over [b-down, b] */
export const env = (f: number, a: number, b: number, up = 3, down = 4) =>
  Math.min(c01((f - a) / up), c01((b - f) / down));

// ---------------------------------------------------------------- world (front plane, z = 0)
export const MIC = { x: 80, size: 220 } as const;
export const CLAUDE = { x: 740, size: 150 } as const;
export const COMP = { left: -30, top: 180, w: 840, h: 370 } as const;
export const WIN = { left: 1040, top: 120, w: 900, h: 660, title: 64, side: 290 } as const;
export const CANVAS = { left: WIN.left, top: WIN.top + WIN.title, w: WIN.w - WIN.side, h: WIN.h - WIN.title } as const; // 610 x 596
export const SIDE = { left: WIN.left + WIN.w - WIN.side, top: CANVAS.top, w: WIN.side, h: CANVAS.h } as const;
/** the hairline drop from the trace into the app window, over its sidebar */
export const DROP_X = SIDE.left + SIDE.w / 2; // 1795
export const ROW = { x0: 120, sp: 280, icon: 190 } as const;

// ---------------------------------------------------------------- timeline
// VO: "where everything's heading" 0-45 | "won't need to download and pay for
// apps anymore" 45-110 | "just tell AI what you need" 110-160 | "and it'll
// build it for you" 160-215 | "fully custom, with exactly the features you
// want" 215-300.
export const SWING: [number, number] = [36, 106];
export const GLITCH = [60, 161];
export const MIC_IN = 68; // earlier (orchestrator): no empty stretch while the row recedes
export const COMP_IN = 76;
export const CLAUDE_IN = 110;
export const WAKE = 161;
/** the build packet: Claude -> along the trace -> down the drop into the window */
export type Run = { run: [number, number]; down: [number, number]; rgb: "claude" | "user"; from: number };
export const BUILD: Run = { run: [164, 190], down: [190, 196], rgb: "claude", from: CLAUDE.x };
export const WIN_IN = 193; // assembles while the camera is still trucking toward it
export const CROP_T = 224;
export const RESIZE_T = 246;
export const MARK_T = 264;
export const EXPORT_T = 280;
/** one packet per feature: Claude sends crop / resize / watermark; the person asks for Export PNG */
export const FEATURE_RUNS: Run[] = [
  { run: [206, 220], down: [220, CROP_T], rgb: "claude", from: CLAUDE.x },
  { run: [228, 242], down: [242, RESIZE_T], rgb: "claude", from: CLAUDE.x },
  { run: [246, 260], down: [260, MARK_T], rgb: "claude", from: CLAUDE.x },
  { run: [258, 276], down: [276, EXPORT_T], rgb: "user", from: MIC.x },
];
export const CURSOR_IN = 283;
export const PRESS = 294;

// ---------------------------------------------------------------- the spoken request
export const REQUEST = "I need a photo editor that crops, resizes and adds my watermark.";
// word start frames (syllable-weighted, a short breath after "crops,")
const SYL = [1, 1, 1, 2, 3, 1, 1, 3, 1, 1, 1, 3];
export const WORDS = REQUEST.split(" ");
export const WORD_AT: number[] = (() => {
  const at: number[] = [];
  let t = 113;
  for (let i = 0; i < WORDS.length; i++) {
    at.push(t);
    t += 0.9 + 1.35 * SYL[i] + (WORDS[i].endsWith(",") ? 2 : 0);
  }
  return at;
})();
export const TALK_END = WORD_AT[WORD_AT.length - 1] + 7;
/** each word leaves the mic as a green packet and runs to the Claude mark */
export const WORD_RUN = 14;

/** speech envelope 0..1 at frame f (syllable pulses inside each word) */
export const speech = (f: number) => {
  let v = 0;
  for (let i = 0; i < WORDS.length; i++) {
    const a = WORD_AT[i];
    const len = 1.35 * SYL[i] + 0.8;
    if (f < a - 1 || f > a + len + 2) continue;
    const k = env(f, a - 1, a + len + 2, 1.5, 2.5);
    const syl = 0.62 + 0.38 * Math.abs(Math.sin(((f - a) / 1.35) * Math.PI));
    v = Math.max(v, k * syl);
  }
  return v;
};

// ---------------------------------------------------------------- the row
export type RowIcon = { i: number; id: AppId; rgb: string; home: V3 };
const hexRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};
export const ICONS: RowIcon[] = APPS.map((a, i) => ({ i, id: a.id, rgb: hexRgb(a.accent), home: { x: ROW.x0 + i * ROW.sp, y: 0, z: 0.5 } }));

const norm = (v: V3): V3 => {
  const l = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};
/** the row's final direction: back into depth, rising a little, spread to the right so every icon stays readable */
const V_END = norm({ x: 0.72, y: -0.2, z: -0.66 });
const OMEGA = Math.acos(V_END.x);
const A0: V3 = { x: ROW.x0, y: 0, z: 0.5 };
const A1: V3 = { x: 300, y: -230, z: -440 };
/** after the swing the row keeps sinking away (ambient, never stops) */
const A_DRIFT: V3 = { x: 30, y: -50, z: -520 };

export const rowSwing = (f: number) => seg(f, SWING[0], SWING[1]);
export const iconPos = (i: number, f: number): V3 => {
  const u = rowSwing(f);
  const s0 = Math.sin((1 - u) * OMEGA) / Math.sin(OMEGA);
  const s1 = Math.sin(u * OMEGA) / Math.sin(OMEGA);
  const d = { x: s0 + s1 * V_END.x, y: s1 * V_END.y, z: s1 * V_END.z };
  const k = seg(f, 96, 380);
  const a = {
    x: A0.x + (A1.x - A0.x) * u + A_DRIFT.x * k,
    y: A0.y + (A1.y - A0.y) * u + A_DRIFT.y * k,
    z: A0.z + (A1.z - A0.z) * u + A_DRIFT.z * k,
  };
  const r = i * ROW.sp;
  return { x: a.x + r * d.x, y: a.y + r * d.y, z: a.z + r * d.z };
};

// download progress: each bar fills in irregular chunks, then stalls (staggered)
const STALL = [58, 66, 52, 74, 61, 70, 55, 78, 64, 72, 57, 68];
const P0 = [0.22, 0.48, 0.12, 0.36, 0.6, 0.18, 0.41, 0.07, 0.3, 0.52, 0.15, 0.27];
const RATE = [0.0062, 0.0049, 0.0071, 0.0055, 0.0042, 0.0066, 0.0051, 0.0074, 0.0058, 0.0046, 0.0069, 0.0053];
/** fill speed factor (1 = full rate) */
export const dlSpeed = (i: number, f: number) => {
  const stall = 1 - seg(f, STALL[i] - 18, STALL[i] + 4, DECEL);
  const chunk = 0.55 + 0.45 * Math.abs(Math.sin(f * 0.13 + i * 1.9)) * (0.7 + 0.3 * Math.sin(f * 0.051 + i));
  return stall * chunk;
};
const PROG: number[][] = ICONS.map((ic) => {
  const out: number[] = [];
  let p = P0[ic.i];
  for (let f = 0; f <= DUR + 2; f++) {
    out.push(Math.min(0.97, p));
    p += RATE[ic.i] * dlSpeed(ic.i, f);
  }
  return out;
});
export const progress = (i: number, f: number) => {
  const a = Math.max(0, Math.min(PROG[i].length - 2, Math.floor(f)));
  const t = c01(f - a);
  return PROG[i][a] + (PROG[i][a + 1] - PROG[i][a]) * t;
};
/** the receded row sinks out of the picture while the camera trucks to the app */
export const rowFade = (f: number) => 1 - seg(f, 170, 206, DECEL);
/** the bars dim once they stall */
export const barDim = (i: number, f: number) => 1 - 0.55 * seg(f, STALL[i], STALL[i] + 34, DECEL);

// ---------------------------------------------------------------- camera
type Mv = { t: [number, number]; tx?: number; ty?: number; d?: number; yaw?: number; pitch?: number };
const BASE = { tx: 530, ty: 50, d: 560, yaw: -34, pitch: 15 };
const MOVES: Mv[] = [
  // phase 1: already pulling back and swinging round to face the line on f0
  { t: [-14, 112], d: 420, yaw: 28, pitch: -9 },
  { t: [-14, 104], tx: -160 },
  { t: [34, 116], ty: 140 },
  // phase 2: a slow push on the mic + composer, drifting toward the Claude mark
  { t: [98, 170], d: -45, yaw: 5, tx: 34, ty: -6 },
  // phase 3: truck right with the build packet to the app window, easing out wide
  { t: [168, 224], tx: 1086, ty: 200, d: 150, yaw: 4, pitch: -2.5 }, // later (orchestrator): leaves the composer as the window assembles
  // then a slow push while the camera orbits the window (still moving on the last frame)
  { t: [206, 340], d: -36, yaw: -8, ty: -12 },
];

export type CamParams = { C: V3; T: V3 };
export const camParams = (f: number): CamParams => {
  let tx = BASE.tx;
  let ty = BASE.ty;
  let d = BASE.d;
  let yaw = BASE.yaw;
  let pitch = BASE.pitch;
  for (const m of MOVES) {
    const k = seg(f, m.t[0], m.t[1]);
    tx += (m.tx ?? 0) * k;
    ty += (m.ty ?? 0) * k;
    d += (m.d ?? 0) * k;
    yaw += (m.yaw ?? 0) * k;
    pitch += (m.pitch ?? 0) * k;
  }
  // ambient drift so no frame is ever frozen
  tx += 5 * Math.sin(f / 37);
  ty += 4 * Math.sin(f / 51 + 1.1);
  yaw += 0.6 * Math.sin(f / 43);
  const yr = (yaw * Math.PI) / 180;
  const pr = (pitch * Math.PI) / 180;
  const T = { x: tx, y: ty, z: 0 };
  const C = { x: tx + d * Math.sin(yr) * Math.cos(pr), y: ty - d * Math.sin(pr), z: d * Math.cos(yr) * Math.cos(pr) };
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

export const camAt = (f: number): Cam => {
  const cam = orient(camParams(f));
  // focus: the row while it downloads, then the front plane (the target)
  const onRow = toCam(cam, iconPos(1.6, f)).d;
  const onT = toCam(cam, cam.T).d;
  const k = seg(f, 52, 108);
  cam.focus = onRow + (onT - onRow) * k;
  return cam;
};

// depth of field: screen-space blur from relative defocus
const DOF_K = 7;
const DOF_BAND = 0.12;
const DOF_MAX = 9;
export const dofPx = (cam: Cam, d: number) => {
  const b = Math.min(DOF_MAX, DOF_K * Math.max(0, Math.abs(cam.focus / Math.max(1, d) - 1) - DOF_BAND));
  return b < 0.5 ? 0 : Math.round(b * 4) / 4;
};
/** depth haze: far planes sink toward black */
export const haze = (cam: Cam, d: number) => 1 - 0.42 * c01((d - cam.focus) / 2600);
