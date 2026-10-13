// ===========================================================================
// DrP1Hook rig: world layout, story timing and the keyed 3D camera for the
// "2 hours, one sentence" hook. Pure math (Easing + EASE only) so framing can
// be checked numerically outside Remotion.
// Camera model = src/artcraft/p1/rig.ts (keyed position + look-at, CSS chain
// translateZ(P) rotateX rotateY translate3d(-C)), same world convention:
//   x right, y DOWN (floor y = 0, up is negative), z toward the start camera.
// World units = px of the 5120x2880 Edit press shot; on the panels x = u.
//
// Resolve's Edit page, opened up in depth:
//  - the timeline panel (real crop: toolbar, readout, ruler, tracks) stands at
//    the front, z = 0, on the floor;
//  - the record viewer panel (real crop) stands a little behind it, above its
//    right half, where it sits in the app;
//  - where the source viewer would be, the source itself: two hours of footage
//    as one long strip of clips (real frames of the project, Resolve clip
//    style) on a wall facing the room, receding to the horizon of the tube. The
//    scope trace runs along its top edge like a rail, the Claude mark on it.
//  - floor and ceiling: the scope's graticule.
// ===========================================================================
import { Easing } from "remotion";
import { EASE } from "../theme";

export type V3 = { x: number; y: number; z: number };

export const W = 1080;
export const H = 960;
export const DUR = 240;

// ---------------------------------------------------------------- lens
// principal point near the centre of the 9:8 safe area (y 77-922)
export const CX = 540;
export const CY = 500;
export const P = 900;

export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
/** eased 0 -> 1 between frames a and b */
export const seg = (f: number, a: number, b: number, ease: (n: number) => number = TRAVEL) => ease(c01((f - a) / (b - a)));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: V3, b: V3, k: number): V3 => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) });

// ---------------------------------------------------------------- the two real panels
export const EDIT = { src: "resolve/shots/bmd-resolve21-Edit-hires.png", w: 5120, h: 2880 } as const;
/** the shot's floor line: the page bar starts at v 2786 */
const FLOOR_V = 2780;
export type Panel = { u0: number; u1: number; v0: number; v1: number; z: number };
/** timeline panel: the effects library at its left, tool row, readout, ruler, tracks (the mixer is cropped off) */
export const TL: Panel = { u0: 0, u1: 4712, v0: 1612, v1: FLOOR_V, z: 0 };
/** record viewer panel: options row, header, picture, jog bar, transport */
export const RV: Panel = { u0: 2750, u1: 4288, v0: 84, v1: 1612, z: -260 };
/** shot px (u, v) on a panel -> world (n = toward the camera) */
export const panelAt = (p: Panel, u: number, v: number, n = 0): V3 => ({ x: u, y: v - FLOOR_V, z: p.z + n });

// ---------------------------------------------------------------- timeline (shot px, from R3's measurements)
export const HEADER = { x0: 1232, x1: 1748 } as const; // track header column
export const LANE_X1 = 4712; // right end of the timeline lanes (mixer beyond)
export const RULER = { x0: 1750, y0: 1706, y1: 1789 } as const;
export const T0_X = 1756; // 01:00:00:00 on the ruler
/** px per second on the re-drawn ruler: the 60-second cut spans 660 px */
export const ZPS = 11;
export const ZONE = { y0: 1790, y1: 1847 } as const; // Resolve's "Video 4" drop zone
export const LANE_H = 122; // a standard track row (V3 is 1847..1969)
export const GROW = LANE_H - (ZONE.y1 - ZONE.y0); // 65: rows below shift down when V4 is created
export const PANEL_BOTTOM = 2772; // timeline panel bottom (page bar below)
export const COUNTER = { cx: 1490, base: 1767, font: 42.5, x0: 1252, x1: 1740, y0: 1712, y1: 1786 } as const;
/** the baked playhead line through the tracks (healed: the playhead is drawn live) */
export const BAKED_PH = { x0: 3937, x1: 3950 } as const;
/** record viewer image rect (where the cut plays) */
export const REC_VIEW = { x: 2756, y: 515, w: 1521, h: 648 } as const;

// ---------------------------------------------------------------- the source strip
// Strip-local coordinates: sx runs from the near end into the deep, sy down from the clip tops.
export const STRIP = {
  x: 400, // the wall plane (well left of the source viewer's slot, so the room sees its frames at an angle)
  top: -2420, // world y of the clip tops (level with the record viewer's picture)
  z0: 1500, // world z of the near end (out in the room, above the timeline panel)
  fw: 1800, // frame (thumbnail) width
  fh: 820, // frame height (2.19:1, the project's scope frame)
  border: 14,
  gap: 48,
} as const;
export const STRIP_H = STRIP.fh + 2 * STRIP.border;
/** strip-local -> world (n = off the wall, into the room) */
export const stripAt = (sx: number, sy: number, n = 0): V3 => ({ x: STRIP.x + n, y: STRIP.top + sy, z: STRIP.z0 - sx });
/** the scope trace (rail) runs along the strip's top edge */
export const TRACE_Y = STRIP.top - 170;
export const TRACE_Z0 = 3400; // starts behind the opening camera
export const TRACE_Z1 = -120000;
/** the Claude mark sits on the trace at the near end */
export const CLAUDE = { z: 120, size: 300 } as const;
/** the mark's position along the strip (sx) */
export const CLAUDE_SX = STRIP.z0 - CLAUDE.z;

// clip layout: 2..5 frames per clip, end to end (deterministic)
const hash = (i: number) => Math.abs(Math.sin(i * 91.345 + 3.17) * 24634.6345) % 1;
export type Thumb = { sx: number; clip: number; first: boolean; last: boolean };
export const THUMBS: Thumb[] = (() => {
  const out: Thumb[] = [];
  let sx = 0;
  let c = 0;
  while (sx < 110000) {
    const n = 2 + Math.floor(hash(c) * 4);
    for (let j = 0; j < n; j++) out.push({ sx: sx + STRIP.border + j * STRIP.fw, clip: c, first: j === 0, last: j === n - 1 });
    sx += n * STRIP.fw + 2 * STRIP.border + STRIP.gap;
    c++;
  }
  return out;
})();
/** centre sx of a strip frame */
export const thumbMid = (i: number) => THUMBS[i].sx + STRIP.fw / 2;

// ---------------------------------------------------------------- the story
// The pulse leaves the Claude mark already racing on f0 and runs down the rail.
// As it reaches each best moment, a Resolve marker drops on that frame and the
// frame lifts off the strip and flies forward and down onto the timeline's new
// track V4, packing the cut from 01:00:00:00. The readout rolls up per landing.
export const MOMENT_DUR = [9, 8, 10, 7, 9, 8, 9] as const; // seconds, sum 60
/** strip frame index of each best moment (deeper and deeper: the source is long) */
export const MOMENT_IDX = [1, 2, 4, 6, 9, 12, 16] as const;
export const PICK = [8, 16, 24, 32, 40, 48, 56] as const; // the pulse reaches the moment
export const LIFT = 6; // frames the frame pops out of the strip
export const LAND = [56, 66, 76, 86, 96, 106, 116] as const; // the clip lands on V4
export const TICK = 8; // the readout rolls up over 8 frames per landing
export const V4_AT = LAND[0] - 10; // the first drop creates V4
export const v4Grow = (f: number) => GROW * seg(f, V4_AT, V4_AT + 10);
export const MOMENT_X = MOMENT_DUR.map((_, k) => T0_X + MOMENT_DUR.slice(0, k).reduce((a, b) => a + b, 0) * ZPS);
export const MOMENT_W = MOMENT_DUR.map((d) => d * ZPS);
/** Resolve marker colours: Blue, Cyan, Green, Yellow, Pink, Purple, Blue */
export const MARKER_RGB = ["58,141,230", "47,197,201", "62,174,62", "229,194,31", "232,124,184", "154,98,217", "58,141,230"] as const;
export const PB0 = 140; // the record viewer plays the cut from the top (8x shuttle: the hi-res first three shots fill the rest of the hook)
export const PB_RATE = 8;
/** CameraMotionBlur draws its samples at f + 0.5 .. f + 1 - shutter/N (shutter 180): the mean
 *  sample time, so screen-space layers outside the blur line up with the blurred planes */
export const sampleTime = (f: number, samples: number) => f + 1 - (0.5 * (samples + 1)) / (2 * samples);
/** soft glitches: the cut completes */
export const GLITCH = [LAND[6] + 1];

// pulse position along the strip (sx): eased hops between the moments that overlap,
// so it never stops, it only leans into each pick; after the last it races on into the deep
const HOP_STOPS = [STRIP.z0 - CLAUDE.z, ...MOMENT_IDX.map(thumbMid), thumbMid(MOMENT_IDX[6]) + 60000];
const HOP_T: [number, number][] = [
  [-24, PICK[0] + 2],
  ...PICK.slice(1).map((p, k) => [PICK[k] - 3, p + 2] as [number, number]),
  [PICK[6] - 3, 190],
];
export const pulseSx = (f: number) => HOP_STOPS.slice(1).reduce((a, s, k) => a + (s - HOP_STOPS[k]) * seg(f, HOP_T[k][0], HOP_T[k][1]), HOP_STOPS[0]);
/** pulse envelope: full while racing, fades out deep */
export const pulseAmp = (f: number) => 1 - seg(f, 90, 116, DECEL);

// ---------------------------------------------------------------- playhead + readout
/** seconds into the timeline at frame f: rides the packing edge, then plays from the top */
export const playAt = (f: number) => {
  if (f >= PB0) return ((f - PB0) * PB_RATE) / 30;
  let t = 0;
  LAND.forEach((l, k) => {
    t += MOMENT_DUR[k] * seg(f, l, l + TICK, DECEL);
  });
  return t;
};
/** Resolve's record timecode (24 fps project), the timeline starts at 01:00:00:00 */
export const tc = (sec: number, hourBase = 1) => {
  const fr = Math.max(0, Math.floor(sec * 24 + 1e-6));
  const ff = fr % 24;
  const s = Math.floor(fr / 24);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(hourBase + Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(ff)}`;
};
export const momentAtSec = (sec: number) => {
  let acc = 0;
  for (let k = 0; k < MOMENT_DUR.length; k++) {
    acc += MOMENT_DUR[k];
    if (sec < acc) return k;
  }
  return MOMENT_DUR.length - 1;
};
/** 0..1 through the shot that is playing at sec */
export const shotProgress = (sec: number) => {
  const k = momentAtSec(sec);
  const start = MOMENT_DUR.slice(0, k).reduce((a, b) => a + b, 0);
  return c01((sec - start) / MOMENT_DUR[k]);
};

// ---------------------------------------------------------------- camera
// 0-60    beside the strip, looking down it to the horizon, drifting in behind
//         the pulse (already moving on f0); the record viewer stands at the right
// 30-128  pull back, drop and turn onto the timeline panel: the readout and the
//         new track V4 come up big as the moments land; the deep strip still
//         recedes above the panel
// 108-240 crane up and back to the record viewer while the cut plays, orbiting
//         slowly; still travelling on the last frame
export type CamParams = { C: V3; T: V3 };
type Pose = { C: V3; T: V3 };
/** each move eases the camera (C) and its look-at (T) from the previous pose to this one */
type Move = { C: V3; T: V3; c: [number, number]; t: [number, number] };
export const START: Pose = { C: { x: 2420, y: -1990, z: 2950 }, T: { x: 190, y: -560, z: -6000 } };
export const MOVES: Move[] = [
  // ride in beside the strip behind the pulse (already moving on f0)
  { C: { x: 2480, y: -1950, z: 2560 }, T: { x: 330, y: -640, z: -6000 }, c: [-30, 70], t: [-30, 70] },
  // follow the moments down onto the timeline
  { C: { x: 1680, y: -1330, z: 1330 }, T: { x: 1830, y: -1010, z: 0 }, c: [24, 104], t: [24, 100] },
  // slow push while the cut packs and the readout rolls up
  { C: { x: 1700, y: -1300, z: 1160 }, T: { x: 1840, y: -1000, z: 0 }, c: [84, 150], t: [84, 150] },
  // crane up and back to the record viewer while the cut plays (still under way on the last frame)
  { C: { x: 2560, y: -1640, z: 1720 }, T: { x: 3120, y: -1460, z: -260 }, c: [124, 292], t: [120, 286] },
];
const AXES = ["x", "y", "z"] as const;

const track = (f: number, key: "C" | "T"): V3 => {
  const out = { ...START[key] };
  let prev = START[key];
  for (const m of MOVES) {
    const k = seg(f, m[key === "C" ? "c" : "t"][0], m[key === "C" ? "c" : "t"][1]);
    for (const a of AXES) out[a] += (m[key][a] - prev[a]) * k;
    prev = m[key];
  }
  return out;
};

/** slow orbit round the look-at point in the last act */
export const ORBIT = { t: [130, 330] as [number, number], rad: -0.16 };

export const camParams = (f: number): CamParams => {
  const C = track(f, "C");
  const T = track(f, "T");
  const a = ORBIT.rad * seg(f, ORBIT.t[0], ORBIT.t[1]);
  if (a !== 0) {
    const dx = C.x - T.x;
    const dz = C.z - T.z;
    C.x = T.x + dx * Math.cos(a) - dz * Math.sin(a);
    C.z = T.z + dx * Math.sin(a) + dz * Math.cos(a);
  }
  // ambient drift so no frame is ever frozen
  C.x += 8 * Math.sin(f / 37);
  C.y += 6 * Math.sin(f / 51 + 1.1);
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

// focus: rides the pulse down the strip, racks onto the timeline as the moments
// land, then onto the record viewer
const focusPoint = (f: number): V3 => {
  const pulse = stripAt(Math.max(2400, Math.min(4800, pulseSx(f))), STRIP_H / 2);
  const tl = panelAt(TL, 2000, 1850);
  const rv = panelAt(RV, REC_VIEW.x + REC_VIEW.w / 2, REC_VIEW.y + REC_VIEW.h / 2);
  return lerp3(lerp3(pulse, tl, seg(f, 40, 90)), rv, seg(f, 126, 190));
};

export const camAt = (f: number): Cam => {
  const cam = orient(camParams(f));
  cam.focus = toCam(cam, focusPoint(f)).d;
  return cam;
};

// depth of field: screen-space blur from relative defocus
export const DOF_K = 3;
export const DOF_BAND = 0.3;
export const DOF_MAX = 2.5;
export const dofPx = (cam: Cam, d: number) => {
  const b = Math.min(DOF_MAX, DOF_K * Math.max(0, Math.abs(cam.focus / Math.max(1, d) - 1) - DOF_BAND));
  return b < 0.5 ? 0 : Math.round(b * 4) / 4;
};

/** depth haze: far planes sink toward black */
export const haze = (cam: Cam, d: number) => 1 - 0.5 * c01((d - Math.max(3000, cam.focus)) / 30000);

/** where moment k lands: its slot on V4 (shot px), the clip's top-left */
export const slotOf = (k: number) => ({ u: MOMENT_X[k] + 1, v: ZONE.y0 + 4, w: MOMENT_W[k] - 2, h: LANE_H - 8 });
