// ===========================================================================
// DrP7OffYourPlate: world layout, beat timeline and camera (helpers for R7 only).
// Pure math (Easing + EASE + interpolate) so the framing can be checked numerically.
//
// One flat world in the pixels of the official Resolve 21 Edit page screenshot
// (5120x2880). Everything else sits on it:
//   - the scope trace runs along Resolve's empty "Video 4" drop zone, the band
//     between the ruler and track V3;
//   - the editor's side (the person, green): their playhead scrubs the timeline
//     and their arrow nudges the clip they have selected on V2 (B ROLL, the red
//     outline is the shot's own selection);
//   - Claude's side (coral): render jobs lift off the B-roll track as copies of
//     clips, ride the trace into a floating Render Queue panel (the Deliver
//     page's Render Settings look, from the Reference Manual figures) at the
//     right of the timeline, and render one after another with progress bars.
// ===========================================================================
import { Easing, interpolate } from "remotion";
import { EASE, SHOTS } from "../theme";

export const W = 1080;
export const H = 960;
export const DUR = 135;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
/** eased 0 -> 1 between frames a and b */
export const seg = (f: number, a: number, b: number, ease: (n: number) => number = TRAVEL) => ease(c01((f - a) / (b - a)));

export const EDIT = SHOTS.edit; // 5120x2880
export const QE = SHOTS.quickExport; // 951x572, the Quick Export dialog (preset icons)

// ---------------------------------------------------------------- timeline (Edit shot px, measured)
export const LANE_BG = "rgb(40,40,46)";
/** the scope trace: centre of Resolve's empty "Video 4" drop zone (1790..1847) */
export const TY = 1819;
export const RULER_TOP = 1709;
export const TL_BOTTOM = 2772; // timeline panel bottom (the playhead line ends here)
/** V2 (B ROLL) clip rows, border included */
export const V2 = { y0: 1970, y1: 2089 } as const;

/**
 * The shot's baked red playhead (line x 3941-3944 from the flag down, flag 3928-3957 x 1712-1736)
 * healed with copies of nearby columns (dx). The blue markers under it (ruler, V3 title) are
 * replaced by clean ground. Order matters: the line first, the patches over it.
 */
export const HEALS = [
  { x: 3937, y: 1736, w: 12, h: TL_BOTTOM - 1736, dx: -14 },
  { x: 3924, y: 1708, w: 38, h: 30, dx: -48 }, // the flag (ticks repeat every 24 px)
  { x: 3924, y: 1748, w: 38, h: 41, dx: -36 }, // the blue ruler marker
  { x: 3924, y: 1884, w: 38, h: 34, dx: -48 }, // the blue marker on the V3 title
] as const;

/** the clip the editor has selected (red outline in the shot), and their nudges */
export const SEL = { x0: 3713, x1: 3783 } as const;
export const NUDGE1: [number, number] = [-8, 14]; // already dragging right on f0
export const NUDGE1_D = 46;
export const NUDGE2: [number, number] = [96, 112]; // fine-tunes it back left
export const NUDGE2_D = -26;
export const nudgeAt = (f: number) => NUDGE1_D * seg(f, NUDGE1[0], NUDGE1[1]) + NUDGE2_D * seg(f, NUDGE2[0], NUDGE2[1]);

// ---------------------------------------------------------------- the Render Queue panel (world px)
export const PX0 = 4240;
export const PW = 620;
export const PX1 = PX0 + PW;
export const PY0 = 1600;
export const PH_ = 708;
export const PY1 = PY0 + PH_;
export const HEAD_H = 96;
export const ROW = { top: 110, h: 138, gap: 8, inset: 16 } as const;
export const rowTop = (i: number) => PY0 + ROW.top + i * (ROW.h + ROW.gap);
/** the docked clip slot: left in the row, clips scale to this height */
export const SLOT = { pad: 14, w: 120, h: 104 } as const;
export const slotCenter = (i: number) => ({ x: PX0 + ROW.inset + SLOT.pad + SLOT.w / 2, y: rowTop(i) + ROW.h / 2 });
/** preset icon + name + bar + percent columns */
export const COL = {
  icon: PX0 + ROW.inset + SLOT.pad + SLOT.w + 14, // 4404
  iconW: 64,
  name: PX0 + ROW.inset + SLOT.pad + SLOT.w + 14 + 64 + 12, // 4480
  barX1: PX1 - ROW.inset - 186,
  pctRight: PX1 - ROW.inset - 14,
  nameFont: 46,
  pctFont: 46,
} as const;

// ---------------------------------------------------------------- the jobs
// Real presets only (the Quick Export / Render Settings figures). The manual's own example
// prompt renders a timeline "as ProRes 422 HQ + H.265 4K + 1080p H.264 proxy".
export type Rect = { x: number; y: number; w: number; h: number };
export type Job = {
  preset: string;
  /** the preset's icon in the Quick Export figure (951x572) */
  icon: Rect;
  /** the V2 clip it lifts off (x span, border included) */
  clip: { x0: number; x1: number };
  /** frames: lift (Claude's selection + rise), ride the trace, dock into the row, render */
  lift: number;
  ride: [number, number];
  dock: [number, number];
  render: [number, number] | null;
};
export const JOBS: Job[] = [
  // already in the queue on f0, rendering
  { preset: "ProRes 422 HQ", icon: { x: 75, y: 221, w: 70, h: 52 }, clip: { x0: 3271, x1: 3343 }, lift: -999, ride: [-999, -998], dock: [-997, -996], render: [-52, 56] },
  { preset: "H.265 Master", icon: { x: 409, y: 105, w: 68, h: 53 }, clip: { x0: 3539, x1: 3591 }, lift: -4, ride: [1, 37], dock: [33, 46], render: [58, 110] },
  { preset: "H.264 Master", icon: { x: 74, y: 105, w: 68, h: 53 }, clip: { x0: 4085, x1: 4193 }, lift: 46, ride: [54, 70], dock: [66, 80], render: [112, 166] },
  { preset: "YouTube 1080p", icon: { x: 243, y: 222, w: 66, h: 52 }, clip: { x0: 3849, x1: 3911 }, lift: 100, ride: [109, 128], dock: [120, 138], render: null },
];
export const RISE = 12; // frames from the clip up onto the trace
export const RIDE_S = 1.1; // scale while riding
/** riding: the card sits on the trace (its bottom just above the line) */
export const RIDE_GAP = 10;

const clipW = (j: Job) => j.clip.x1 - j.clip.x0;
const clipH = V2.y1 - V2.y0;

/** the card's world rect (centre x/y, scale) at frame f, or null before it exists */
export const cardAt = (j: Job, i: number, f: number) => {
  const w = clipW(j);
  const rideCy = TY - RIDE_GAP - (clipH * RIDE_S) / 2;
  const startCx = (j.clip.x0 + j.clip.x1) / 2;
  const startCy = (V2.y0 + V2.y1) / 2;
  const rideEndCx = PX0 - 4 - (w * RIDE_S) / 2;
  const slot = slotCenter(i);
  const slotS = SLOT.h / clipH;
  const rise = seg(f, j.lift, j.lift + RISE, ENTER);
  const ride = seg(f, j.ride[0], j.ride[1]);
  const dock = seg(f, j.dock[0], j.dock[1]);
  const cx = startCx + (rideEndCx - startCx) * ride + (slot.x - rideEndCx) * dock;
  const cy = startCy + (rideCy - startCy) * rise + (slot.y - rideCy) * dock;
  const s = 1 + (RIDE_S - 1) * rise + (slotS - RIDE_S) * dock;
  return { cx, cy, s, w: w * s, h: clipH * s, rise, ride, dock, flying: f >= j.lift && dock < 1 };
};

/** render progress 0..1 (jobs render one after another, as Resolve's queue does) */
export const progressAt = (j: Job, f: number) => (j.render ? interpolate(f, j.render, [0, 1], { ...clamp, easing: TRAVEL }) : 0);
/** the row exists once its card has docked */
export const rowInAt = (j: Job, f: number) => (j.lift < -100 ? 1 : seg(f, j.dock[1] - 7, j.dock[1] + 2, ENTER));
/** the panel grows by a row as each card docks (a list window sized to its jobs) */
export const panelHAt = (f: number) => {
  let n = 0;
  JOBS.forEach((j) => {
    n += j.lift < -100 ? 1 : seg(f, j.dock[0] + 2, j.dock[1], ENTER);
  });
  return ROW.top + n * (ROW.h + ROW.gap) - ROW.gap + 22;
};
/** Claude's coral selection on the source clip, just before it lifts */
export const selAt = (j: Job, f: number) => (j.lift < -100 ? 0 : seg(f, j.lift - 6, j.lift - 1, ENTER) * (1 - seg(f, j.lift + 6, j.lift + 16, DECEL)));

// ---------------------------------------------------------------- the editor's playhead (green)
// It scrubs back and forth the whole time (reversals only, so it never stalls mid-run).
const SCRUB: [number, number][] = [
  [-10, 3800],
  [18, 4110],
  [34, 4000],
  [56, 4150],
  [74, 3980],
  [98, 4150],
  [118, 3700],
  [152, 3920],
];
export const playheadX = (f: number) => {
  for (let k = 0; k < SCRUB.length - 1; k++) {
    const [t0, x0] = SCRUB[k];
    const [t1, x1] = SCRUB[k + 1];
    if (f <= t1 || k === SCRUB.length - 2) return x0 + (x1 - x0) * seg(f, t0, t1);
  }
  return SCRUB[SCRUB.length - 1][1];
};
export const playheadSpeed = (f: number) => Math.abs(playheadX(f + 0.5) - playheadX(f - 0.5));

// ---------------------------------------------------------------- the editor's arrow (world px, tip)
const GRAB = { x: SEL.x0 + 38, y: V2.y0 + 46 };
export const cursorAt = (f: number) => {
  const held1 = { x: GRAB.x + nudgeAt(f), y: GRAB.y };
  const rest = { x: GRAB.x + 120, y: V2.y1 + 150 };
  const back = { x: GRAB.x + NUDGE1_D, y: GRAB.y };
  const end = { x: GRAB.x + NUDGE1_D + NUDGE2_D + 96, y: GRAB.y - 112 };
  type P = { x: number; y: number };
  const legs: [number, number, P, P, number][] = [
    [18, 46, back, rest, 18],
    [76, 94, rest, back, -22],
    [114, 156, { x: back.x + NUDGE2_D, y: back.y }, end, 14],
  ];
  let p: P = held1;
  if (f > 16) p = { x: back.x, y: back.y };
  for (const [a, b, from, to, bow] of legs) {
    const k = seg(f, a, b);
    if (f < a) break;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const arc = bow * Math.sin(Math.PI * k);
    p = { x: from.x + dx * k - (dy / len) * arc, y: from.y + dy * k + (dx / len) * arc };
  }
  // while the second nudge drags, the arrow rides the clip
  if (f >= 94 && f <= 114) p = { x: back.x + NUDGE2_D * seg(f, NUDGE2[0], NUDGE2[1]), y: back.y };
  const press = Math.max(1 - seg(f, 14, 19, DECEL), seg(f, 93, 96, ENTER) * (1 - seg(f, 111, 115, DECEL)));
  return { ...p, press };
};

// ---------------------------------------------------------------- camera
// Focal point (world px) lands on screen centre; zoom z = screen px per world px.
// Sums of overlapping travel-eased moves (zoom in log space): already moving on f0,
// never parked on a keyframe, still travelling on the last frame.
type Ch = { base: number; moves: { d: number; t: [number, number] }[] };
const run = (c: Ch, f: number) =>
  c.moves.reduce((v, m) => {
    if (m.t[0] < 0) {
      const k0 = seg(0, m.t[0], m.t[1]);
      return v + m.d * ((seg(f, m.t[0], m.t[1]) - k0) / (1 - k0));
    }
    return v + m.d * seg(f, m.t[0], m.t[1]);
  }, c.base);

// poses
const P0 = { x: 3800, y: 1990, z: 1.18 }; // pushed in on the timeline: the nudge + the first job lifting
const P1 = { x: 4520, y: 1955, z: 1.0 }; // the queue, close
const P1b = { x: P1.x - 50, y: P1.y + 20, z: P1.z * 0.96 }; // slow drift while job 1 completes
const P2 = { x: 4239, y: 2072, z: 0.725 }; // the two-shot: the editor's timeline left, the queue right
const PULL: [number, number] = [60, 118];
/** then a slow dolly out that is still travelling on the last frame */
const OUT = { t: [92, 168] as [number, number], x: -40, y: 12, z: 0.9 };

const X: Ch = {
  base: P0.x,
  moves: [{ d: P1.x - P0.x, t: [-8, 44] }, { d: P1b.x - P1.x, t: [36, 70] }, { d: P2.x - P1b.x, t: PULL }, { d: OUT.x, t: OUT.t }],
};
const Y: Ch = {
  base: P0.y,
  moves: [{ d: P1.y - P0.y, t: [-8, 44] }, { d: P1b.y - P1.y, t: [36, 70] }, { d: P2.y - P1b.y, t: PULL }, { d: OUT.y, t: OUT.t }],
};
const LZ: Ch = {
  base: Math.log(P0.z),
  moves: [
    { d: Math.log(P1.z / P0.z), t: [-8, 44] },
    { d: Math.log(P1b.z / P1.z), t: [36, 70] },
    { d: Math.log(P2.z / P1b.z), t: PULL },
    { d: Math.log(OUT.z), t: OUT.t },
  ],
};

export type Cam = { x: number; y: number; z: number };
export const camAt = (f: number): Cam => {
  const ax = 4 * Math.sin(f / 23);
  const ay = 3 * Math.sin(f / 31);
  return { x: run(X, f) + ax, y: run(Y, f) + ay, z: Math.exp(run(LZ, f)) };
};
export const toScreen = (c: Cam, p: { x: number; y: number }) => ({ x: W / 2 + (p.x - c.x) * c.z, y: H / 2 + (p.y - c.y) * c.z });

/** 8-sample camera blur on the two big moves */
export const BLUR_WIN: [number, number][] = [
  [0, 40],
  [64, 116],
];

/** soft glitches on the two story beats: the first job lands in the queue, then it finishes */
export const GLITCH = [JOBS[1].dock[1] - 2, JOBS[1].render ? JOBS[1].render[1] : 110];

/** screenshot brightness (bright UI blooms in the tube) */
export const PAGE_BRIGHT = 0.8;
