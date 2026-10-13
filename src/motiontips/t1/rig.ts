// ===========================================================================
// MtP1Hook rig: world layout, timeline, keyed 3D camera, projection and depth
// of field for the hook ("This reel's own graphics"). Pure math (Easing + EASE
// only) so framing can be checked numerically outside Remotion.
// Camera model = src/artcraft/p1/rig.ts (keyed position + look-at, CSS chain
// translateZ(P) rotateX rotateY translate3d(-C)), same world convention:
//   x right, y DOWN (up is negative), z toward the start camera.
// The scope line runs along x = 0 from the top edge of Victor's Claude Code
// terminal (at the near end, leaning back to face the opening camera, hanging
// from the line) away from the lens toward -z, at the height of the graticule
// floor (TRACE_Y). Eight screens stand on it, alternating left / right, toed
// in toward it; each plays one of his real delivered graphics once the pulse
// powers it on.
// ===========================================================================
import { Easing } from "remotion";
import { EASE } from "../theme";

export type V3 = { x: number; y: number; z: number };

export const DUR = 190;

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
/** eased 0 -> 1 that reaches 1 on the last frame while still moving (window runs past the part) */
export const toEnd = (f: number, a: number, b: number) => seg(f, a, b) / seg(DUR - 1, a, b);

// ---------------------------------------------------------------- timeline
// VO: "I made every graphic in this video by typing to an AI." 0-~78 |
// "These three tips are why they don't look like AI made them." ~80-190.
export const ENTER_KEY = 50; // the prompt is sent
export const LAUNCH = 52; // the pulse leaves the terminal's top edge

// ---------------------------------------------------------------- world
/** Claude Code terminal: bottom edge at y = 0, z = TERM.z, leaning back by TERM.lean (rad); its top edge is where the trace starts */
export const TERM = { w: 960, h: 440, z: 0, lean: 0.46 } as const;
/** a point on the terminal plane from its own px (u right from the left edge, v down from the top edge) */
export const termPoint = (u: number, v: number): V3 => {
  const up = TERM.h - v; // distance up the plane from the bottom edge
  return { x: u - TERM.w / 2, y: -up * Math.cos(TERM.lean), z: TERM.z - up * Math.sin(TERM.lean) };
};
export const TERM_C = termPoint(TERM.w / 2, TERM.h / 2);
/** the scope trace leaves the terminal's top edge and runs straight down the row at that height
 *  (the terminal hangs from it, the screens stand on it) */
export const TRACE_Y = termPoint(0, 0).y;
export const TRACE_Z0 = termPoint(0, 0).z;

/** the screens: 9:8 (every clip is a 9:8 trim), standing on the trace, toed in toward it */
export const SCR = { w: 860, h: 764, gap: 190, yaw: 22, z0: -560, spacing: 540 } as const;
const SCR_BOTTOM = TRACE_Y - 10;

export type ClipDef = {
  /** public path of the trimmed 9:8 copy (960x854 h264); "<name>-still.jpg" beside it is its first frame */
  src: string;
  /** "r,g,b": the screen's station answers on the trace in this color */
  rgb: string;
};

// Victor's real delivered graphics, trimmed from the graphics/ folders of his reels
// (source file, in point, length; each trim covers its screen from power-on to the last frame)
export const CLIPS: ClipDef[] = [
  { src: "motiontips/t1/s0-ps-heartbeat.mp4", rgb: "70,170,255" }, // ArtCraft "So if there's an (9x8)" 0.0s +2.5s
  { src: "motiontips/t1/s1-color-wheels.mp4", rgb: "240,170,70" }, // Resolve "It can color grade (9x8)" 0.0s +4.1s
  { src: "motiontips/t1/s2-app-icons.mp4", rgb: "160,110,255" }, // ArtCraft "And this is where (9x8)" 0.0s +3.85s
  { src: "motiontips/t1/s3-remotion.mp4", rgb: "70,156,252" }, // Remotion Tips "Motion graphics used to (9x16)" 3.0s +3.6s, 9:8 crop at y 400
  { src: "motiontips/t1/s4-style-md.mp4", rgb: "233,231,226" }, // Remotion Tips "Thing is every video (9x8)" 2.8s +3.3s
  { src: "motiontips/t1/s5-render-queue.mp4", rgb: "245,140,60" }, // Resolve "Basically it's there to (9x8)" 0.9s +3.25s
  { src: "motiontips/t1/s6-rail.mp4", rgb: "225,80,150" }, // ArtCraft "Somebody just used Claude (9x8)" 3.4s +3.25s (past its baked overlay)
  { src: "motiontips/t1/s7-waveform.mp4", rgb: "90,220,160" }, // Remotion Tips "Rather than going Make (9x16)" 5.0s +3.1s, 9:8 crop at y 560
];

export type Scr = {
  i: number;
  side: -1 | 1;
  /** centre of the screen plane */
  c: V3;
  /** rotateY in degrees (toed in toward the rail) */
  rot: number;
  /** z of its station on the rail */
  z: number;
  clip: ClipDef;
};

export const SCREENS: Scr[] = CLIPS.map((clip, i) => {
  const side = (i % 2 === 0 ? -1 : 1) as -1 | 1;
  const yawR = (SCR.yaw * Math.PI) / 180;
  const z = SCR.z0 - i * SCR.spacing;
  return {
    i,
    side,
    c: { x: side * (SCR.gap + (Math.cos(yawR) * SCR.w) / 2), y: SCR_BOTTOM - SCR.h / 2, z },
    rot: -side * SCR.yaw,
    z,
    clip,
  };
});
export const LAST_Z = SCREENS[SCREENS.length - 1].z;

// ---------------------------------------------------------------- the pulse
// Station index s: 0 = the terminal's top edge, k = screen k-1. Each hop is an
// eased move to the next station; hops overlap so the pulse never stops, it
// only leans into each screen. After screen 3 it races down the other four.
const HOPS: [number, number, number][] = [
  [LAUNCH, LAUNCH + 12, 1],
  [LAUNCH + 8, LAUNCH + 20, 1],
  [LAUNCH + 16, LAUNCH + 28, 1],
  [LAUNCH + 24, LAUNCH + 36, 1],
  [LAUNCH + 32, LAUNCH + 62, 6.2], // the other four, then into the deep
];
export const pulseS = (f: number) => HOPS.reduce((a, [t0, t1, n]) => a + n * seg(f, t0, t1), 0);
export const stationZ = (s: number) => (s <= 1 ? TRACE_Z0 + (SCR.z0 - TRACE_Z0) * s : SCR.z0 - (s - 1) * SCR.spacing);
export const pulseZ = (f: number) => stationZ(pulseS(f));
/** pulse envelope: on at launch, fades out deep after the row */
export const pulseAmp = (f: number) => c01((f - LAUNCH + 1) / 3) * (1 - seg(f, LAUNCH + 54, LAUNCH + 74, DECEL));

/** frame the pulse reaches screen i (quarter-frame resolution) */
export const ARRIVE: number[] = SCREENS.map((s) => {
  for (let k = LAUNCH * 4; k < DUR * 8; k++) {
    const f = k / 4;
    if (pulseS(f) >= s.i + 1 - 1e-6) return f;
  }
  return 9999;
});

// power-on: a bright line snaps across (2f), then opens vertically to the picture (8f, eased)
export const LINE_F = 2;
export const OPEN_F = 8;
export const powerOf = (i: number, f: number) => {
  const a = ARRIVE[i];
  const line = seg(f, a, a + LINE_F, DECEL);
  const open = seg(f, a + LINE_F - 0.5, a + LINE_F + OPEN_F, ENTER);
  const beam = f < a ? 0 : 1 - seg(f, a + LINE_F + 1, a + LINE_F + OPEN_F, DECEL);
  const over = f < a ? 0 : 1 - seg(f, a + LINE_F, a + 13, DECEL);
  return { on: f >= a, line, open, beam, over };
};
/** comp frame a screen's clip starts playing (from the trim's first frame) */
export const playFrom = (i: number) => Math.round(ARRIVE[i]);

// later packets trickle down the rail from the terminal (they keep the trace alive)
export const PACKETS = [120, 140, 158, 175].map((t0) => ({ t0, t1: t0 + 110 }));
export const packetZ = (p: { t0: number; t1: number }, f: number) => TRACE_Z0 - 40 - 6400 * seg(f, p.t0, p.t1, DECEL);

// ---------------------------------------------------------------- camera
// 0-50    on the terminal while the prompt arrives: framed in the lower half,
//         the dark row of screens receding down the trace above it; a slow
//         arc around the terminal (the row slides behind it, the prompt stays
//         at reading size)
// 46-118  the prompt is sent: the camera rises over the terminal and dives
//         down the trace behind the pulse, the screens powering on ahead of
//         it, the first ones sliding past large on both sides
// 92-184  it cranes up high and tilts down over the whole lit row (all eight
//         playing, the frame filled), then a slow orbit around the row's middle
//         is all that moves; still turning on the last frame
// Each pose is a full (camera, look-at) pair; the moves are overlapping eased
// segments, so the camera never stops between them.
export type CamParams = { C: V3; T: V3 };
type Pose = { C: V3; T: V3 };
const POSE_START: Pose = { C: { x: -85, y: -740, z: 735 }, T: { x: 180, y: 190, z: -2000 } };
const POSE_CREEP: Pose = { C: { x: 65, y: -728, z: 708 }, T: { x: -140, y: 190, z: -2000 } };
const POSE_RIDE: Pose = { C: { x: 0, y: -880, z: -1050 }, T: { x: 0, y: -470, z: -3800 } };
const POSE_END: Pose = { C: { x: 0, y: -1800, z: -1000 }, T: { x: 0, y: 200, z: -3300 } };

type Win3 = { x: [number, number]; y: [number, number]; z: [number, number] };
type Move = { to: Pose; from: Pose; C: Win3; T: [number, number] };
const MOVES: Move[] = [
  { from: POSE_START, to: POSE_CREEP, C: { x: [-40, 110], y: [-40, 100], z: [-40, 100] }, T: [-40, 110] },
  { from: POSE_CREEP, to: POSE_RIDE, C: { x: [46, 118], y: [44, 120], z: [42, 116] }, T: [44, 112] },
  { from: POSE_RIDE, to: POSE_END, C: { x: [96, 180], y: [92, 176], z: [96, 184] }, T: [94, 178] },
];
const AXES = ["x", "y", "z"] as const;

const track = (f: number, key: "C" | "T"): V3 => {
  const out = { ...POSE_START[key] };
  for (const m of MOVES) {
    for (const a of AXES) {
      const w = key === "C" ? m.C[a] : m.T;
      out[a] += (m.to[key][a] - m.from[key][a]) * seg(f, w[0], w[1]);
    }
  }
  return out;
};

// the end orbit: the camera swings around its look-at point while it cranes, so
// the row turns under it (visible parallax on every frame, through the last one)
const ORBIT_RAD = 0.12;
const ORBIT_T: [number, number] = [110, 330];

export const camParams = (f: number): CamParams => {
  const C = track(f, "C");
  const T = track(f, "T");
  const orbit = ORBIT_RAD * toEnd(f, ORBIT_T[0], ORBIT_T[1]);
  if (orbit !== 0) {
    const dx = C.x - T.x;
    const dz = C.z - T.z;
    C.x = T.x + dx * Math.cos(orbit) - dz * Math.sin(orbit);
    C.z = T.z + dx * Math.sin(orbit) + dz * Math.cos(orbit);
  }
  // ambient drift so no frame is ever frozen
  C.x += 5 * Math.sin(f / 37);
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

// focus: the terminal while the prompt arrives, then the screen that is powering
// on (rides the pulse), then settles on the orbit's hero pair
const lerp3 = (a: V3, b: V3, t: number): V3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
const HERO: V3 = lerp3(SCREENS[2].c, SCREENS[3].c, 0.5);
const focusPoint = (f: number): V3 => {
  const s = Math.min(4, Math.max(1, pulseS(f + 3)));
  const i0 = Math.min(3, Math.floor(s) - 1);
  const i1 = Math.min(3, i0 + 1);
  const ride = lerp3(SCREENS[i0].c, SCREENS[i1].c, s - 1 - i0);
  const a = lerp3(TERM_C, ride, seg(f, ENTER_KEY - 2, ENTER_KEY + 18));
  return lerp3(a, HERO, seg(f, 100, 160));
};

export const camAt = (f: number): Cam => {
  const cam = orient(camParams(f));
  cam.focus = toCam(cam, focusPoint(f)).d;
  return cam;
};

// depth of field: screen-space blur from relative defocus
export const DOF_K = 6;
export const DOF_BAND = 0.15;
export const DOF_MAX = 7;
export const dofPx = (cam: Cam, d: number) => {
  const b = Math.min(DOF_MAX, DOF_K * Math.max(0, Math.abs(cam.focus / Math.max(1, d) - 1) - DOF_BAND));
  return b < 0.5 ? 0 : Math.round(b * 4) / 4;
};

// ---------------------------------------------------------------- render windows
/** 8-sample camera blur only on the two fast travels (the dive, the crane); kept short (OffthreadVideo x 8) */
// orchestrator: 8-sample CameraMotionBlur renders dark/flickering frames in this series' MP4s; 1 sample throughout
export const BLUR_WIN: [number, number][] = [];
/** soft tracking wobble on two real beats: the first screen powers on, the row finishes lighting */
export const GLITCH = [Math.round(ARRIVE[0]), Math.round(ARRIVE[SCREENS.length - 1])];
