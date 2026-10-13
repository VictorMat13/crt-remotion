// ===========================================================================
// DrP5CanDo rig: world layout, the camera and the beat timeline. Pure math
// (Easing + EASE only) so the framing can be checked numerically.
//
// World = a wall of four real Resolve 21 pages (official press-kit shots,
// their own page bar cropped off), one world px = one 4K screenshot px:
//
//        row 0:   Cut     Fusion          Fairlight
//        row 1:   Photo   Edit (5K, 0.75) Color
//
// The camera tours it right to left, then up and back right:
//   Color   HDR Color Wheels: the pucks drift, the X/Y readouts tick
//   Edit    timeline: the tail of the A002 B-roll pair (V2 + linked A2)
//           trims in by 6 s and the clips after it ripple left
//   Edit    media pool: the eight B003 clips re-sort into name order
//   pull back up and right across Fusion and Fairlight ("a whole lot more")
//
// Resolve's real page bar is screen-space chrome at the foot of the frame
// (the page stands on it, as in the app); the scope trace runs under it and
// Claude's coral packet lights each page's cell as it gets there.
// ===========================================================================
import { Easing } from "remotion";
import { EASE } from "../theme";

export const W = 1080;
export const H = 960;
export const DUR = 150;

export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
/** eased 0 -> 1 between frames a and b */
export const seg = (f: number, a: number, b: number, ease: (n: number) => number = TRAVEL) => ease(c01((f - a) / (b - a)));
/** eased 0 -> 1 -> 0 between a and b (zero slope at both ends and at the peak) */
export const hump = (f: number, a: number, b: number) => {
  const m = (a + b) / 2;
  return seg(f, a, m) - seg(f, m, b);
};

// ---------------------------------------------------------------- chrome (screen space)
// Real bar geometry (measured, same as R4): in the 4K shots the bar is y 2066-2160 and
// cell i (0 = Media) spans x 1104 + 204 i; the 5K Edit shot has the same bar at +640 x,
// y 2786. Only the active cell differs between shots.
export const BAR_SRC = { y4k: 2066, y5k: 2786, h: 94, x0_4k: 1104, cell: 204, dx5k: 640 } as const;
export const CELLS = ["media", "photo", "cut", "edit", "fusion", "color", "fairlight", "deliver"] as const;
export type Cell = (typeof CELLS)[number];
export const cellX4k = (c: Cell) => BAR_SRC.x0_4k + BAR_SRC.cell * CELLS.indexOf(c);
export const cellMid4k = (c: Cell) => cellX4k(c) + BAR_SRC.cell / 2;
/** bar scale: its labels read ~31px on the 9:8 frame */
export const BAR_S = 1.15;
/** the window of the bar in frame: Edit, Fusion, Color, Fairlight (labels inside the 8% sides) */
export const BAR_CENTER_SRC = 2124;
export const BAR_TOP = 768;
export const BAR_BOTTOM = BAR_TOP + BAR_SRC.h * BAR_S; // 876.1
export const barX = (x4k: number) => W / 2 + (x4k - BAR_CENTER_SRC) * BAR_S;
/** the scope trace runs under the bar */
export const LINE_Y = 918;

// ---------------------------------------------------------------- the wall (world px)
export const GAP = 100;
export const COL = 3840 + GAP; // 3940
export const ROW = 2085 + GAP; // 2185 (the Edit page is the tallest: 2780 x 0.75)
export type PageId = "cut" | "photo" | "fusion" | "fairlight" | "edit" | "color";
export type Page = {
  id: PageId;
  src: string;
  /** shot px */
  sw: number;
  sh: number;
  /** content rows kept (the page bar is cropped off: it lives in the chrome) */
  rows: number;
  /** world px per shot px */
  k: number;
  /** world position of the top-left corner */
  x: number;
  y: number;
  /** grade: bright content dimmed so it never blows out, dark UIs lifted a touch */
  bright: number;
};
const SHOT = (n: string) => `resolve/shots/bmd-resolve21-${n}-hires.png`;
export const PAGES: Page[] = [
  { id: "cut", src: SHOT("Cut"), sw: 3840, sh: 2160, rows: 2064, k: 1, x: -COL, y: ROW - GAP - 2064, bright: 0.98 },
  { id: "photo", src: SHOT("Photo"), sw: 3840, sh: 2160, rows: 2064, k: 1, x: -COL, y: ROW, bright: 0.86 },
  { id: "fusion", src: SHOT("Fusion"), sw: 3840, sh: 2160, rows: 2064, k: 1, x: 0, y: ROW - GAP - 2064, bright: 1.12 },
  { id: "fairlight", src: SHOT("Fairlight"), sw: 3840, sh: 2160, rows: 2064, k: 1, x: COL, y: ROW - GAP - 2064, bright: 1.1 },
  { id: "edit", src: SHOT("Edit"), sw: 5120, sh: 2880, rows: 2780, k: 0.75, x: 0, y: ROW, bright: 0.86 },
  { id: "color", src: SHOT("Color"), sw: 3840, sh: 2160, rows: 2064, k: 1, x: COL, y: ROW, bright: 1.0 },
];
export const pageOf = (id: PageId) => PAGES.find((p) => p.id === id) as Page;
export const pageRect = (p: Page) => ({ x0: p.x, y0: p.y, x1: p.x + p.sw * p.k, y1: p.y + p.rows * p.k });
/** shot px on a page -> world px */
export const onPage = (id: PageId, u: number, v: number) => {
  const p = pageOf(id);
  return { x: p.x + u * p.k, y: p.y + v * p.k };
};

// ---------------------------------------------------------------- beat timeline
/** Color: each wheel's puck drifts (opening mid-action: Global + Highlight already moving on f0) */
export type Wheel = { name: "shadow" | "light" | "highlight" | "global"; cx: number; t: [number, number]; to: [number, number] };
export const WHEEL_Y = 1741;
export const WHEELS: Wheel[] = [
  // Resolve's wheel: red/magenta at the top, yellow left, green bottom, blue right.
  // A warm/teal look: highlights + lights to orange (up-left), shadows to teal (down-right).
  { name: "global", cx: 1251, t: [-12, 16], to: [-12, -9] },
  { name: "highlight", cx: 895, t: [-8, 20], to: [-31, -21] },
  { name: "light", cx: 539, t: [3, 25], to: [-17, -19] },
  { name: "shadow", cx: 183, t: [11, 31], to: [27, 23] },
];
/** the X/Y readout boxes under each wheel (4K Color px): x of the X box, Y box is +100 */
export const READOUT = { y0: 1930, y1: 1970, w: 76, font: 24, xBox: { shadow: 58, light: 414, highlight: 770, global: 1176 } } as const;
/** puck offset (Color px) and the readout value it gives */
export const puckAt = (wh: Wheel, f: number) => {
  const k = seg(f, wh.t[0], wh.t[1]);
  return { dx: wh.to[0] * k, dy: wh.to[1] * k };
};
export const READ_SCALE = 0.5 / 72; // wheel radius 72 px = 0.50

/** Edit timeline (5K Edit px): the A002 B-roll pair, video on V2, linked audio on A2 */
export const TRIM = {
  x0: 4195,
  end0: 4462,
  /** 6 s at the timeline's 24 px/s (01:01:52:00 -> 01:02:08:00 = 384 px) */
  cut: 144,
  /** the lanes (between Resolve's track separators): V2 video, A2 its linked audio */
  v2: [1972, 2088] as [number, number],
  a2: [2342, 2458] as [number, number],
  /** the clip's right end as a cap (blue edge + its dark border) that rides the trimmed edge */
  cap: 14,
  /** clips after it on V2/A2, up to where the lane fades into the scrollbar */
  after: [4532, 4686] as [number, number],
  select: 50,
  move: [55, 71] as [number, number],
  ripple: [60, 76] as [number, number],
  release: [84, 96] as [number, number],
};
export const trimEdge = (f: number) => TRIM.end0 - TRIM.cut * seg(f, TRIM.move[0], TRIM.move[1]);
export const rippleShift = (f: number) => TRIM.cut * seg(f, TRIM.ripple[0], TRIM.ripple[1]);

/** Edit media pool (5K Edit px): the B003 bin, 2 columns x 4 rows, sorted by name in the shot */
export const POOL = {
  colX: [460, 850],
  rowY: [218, 462, 706, 950],
  /** card crop round the thumbnail box (320 x 182) + its name */
  pad: 10,
  cw: 340,
  ch: 242,
  /** the grid area that gets covered (panel ground 40,40,46) */
  cover: { x0: 440, y0: 200, x1: 1204, y1: 1186 },
  /** start slot of clip C00k (index k-1): shuffled bright/dark, they sort to C001..C008 */
  start: [3, 6, 1, 4, 7, 0, 5, 2],
  t0: 97,
  stagger: 2,
  dur: 12,
} as const;
export const slotXY = (i: number) => ({ x: POOL.colX[i % 2] - POOL.pad, y: POOL.rowY[Math.floor(i / 2)] - POOL.pad });

// ---------------------------------------------------------------- camera
// Focal point (world px) lands on screen (CX, CY); zoom z = screen px per world px.
// CY sits in the middle of the picture above the bar.
export const CX = W / 2;
export const CY = 410;

type Ch = { base: number; moves: { d: number; t: [number, number]; hump?: boolean }[] };
/** a move that starts before f0 is renormalised so f0 is exactly the base value (already moving) */
const run = (c: Ch, f: number) =>
  c.moves.reduce((v, m) => {
    if (m.hump) return v + m.d * hump(f, m.t[0], m.t[1]);
    if (m.t[0] < 0) {
      const k0 = seg(0, m.t[0], m.t[1]);
      return v + m.d * ((seg(f, m.t[0], m.t[1]) - k0) / (1 - k0));
    }
    return v + m.d * seg(f, m.t[0], m.t[1]);
  }, c.base);

// Poses (world px). Color page bottom (4249) sits on the bar while the wheels play.
const P_COLOR0 = onPage("color", 1000, 0).x; // f0: Highlight + Global wheels
const P_COLOR1 = onPage("color", 440, 0).x; // Shadow + Light
const P_TRIM = onPage("edit", 4400, 2196); // the A002 pair's tail
const P_POOL = onPage("edit", 655, 600); // bins + the whole clip grid

/** the page's bottom tucks 7px under the bar while the wheels play */
const yOnBar = (z: number) => 4249 - (BAR_TOP - CY) / z - 6;
const Y0 = yOnBar(1.2);
const Y1 = yOnBar(1.24);
/** the end of the pull-back: the Fusion/Fairlight seam, the whole 2 x 2 of the wall filling the frame */
const PULL_END = { x: 3890, y: 2262 };

const X: Ch = {
  base: P_COLOR0,
  moves: [
    { d: P_COLOR1 - P_COLOR0, t: [-34, 44] },
    { d: P_TRIM.x - P_COLOR1, t: [30, 56] },
    { d: -110, t: [50, 86] }, // follows the trimmed edge left
    { d: P_POOL.x - (P_TRIM.x - 110), t: [78, 106] },
    { d: 24, t: [98, 126] },
    // pull back: dolly out at the pool, then up into Fusion and across to Fairlight (still travelling on the last frame)
    { d: PULL_END.x - (P_POOL.x + 24), t: [112, 170] },
  ],
};
const Y: Ch = {
  base: Y0,
  moves: [
    { d: Y1 - Y0, t: [-34, 44] },
    { d: P_TRIM.y - Y1, t: [30, 56] },
    { d: -50, t: [30, 56], hump: true }, // rises a touch while the zoom dips, so the bar never shows a gap
    { d: 10, t: [50, 86] },
    { d: P_POOL.y - (P_TRIM.y + 10), t: [78, 106] },
    { d: 80, t: [98, 126] },
    { d: PULL_END.y - (P_POOL.y + 80), t: [106, 142] },
  ],
};
const LZ: Ch = {
  base: Math.log(1.2),
  moves: [
    { d: Math.log(1.24 / 1.2), t: [-34, 44] },
    { d: Math.log(1.6 / 1.24), t: [30, 56] },
    { d: -0.22, t: [30, 56], hump: true },
    { d: Math.log(1.7 / 1.6), t: [50, 86] },
    { d: Math.log(1.28 / 1.7), t: [78, 106] },
    { d: -1.15, t: [78, 106], hump: true },
    { d: Math.log(1.33 / 1.28), t: [98, 126] },
    { d: Math.log(0.19 / 1.33), t: [104, 156] },
  ],
};

export type Cam = { x: number; y: number; z: number };
export const camAt = (f: number): Cam => {
  // ambient drift (zero on f0) so no stretch of the move is ever static
  const ax = 6 * Math.sin(f / 23);
  const ay = 4 * Math.sin(f / 31);
  return { x: run(X, f) + ax, y: run(Y, f) + ay, z: Math.exp(run(LZ, f)) };
};
/** world -> screen */
export const toScreen = (c: Cam, p: { x: number; y: number }) => ({ x: CX + (p.x - c.x) * c.z, y: CY + (p.y - c.y) * c.z });
/** the world rect visible above the bar */
export const viewRect = (c: Cam) => ({ x0: c.x - CX / c.z, x1: c.x + (W - CX) / c.z, y0: c.y - CY / c.z, y1: c.y + (BAR_TOP - CY) / c.z });

/** 8-sample camera blur only on the big moves */
export const BLUR_WIN: [number, number][] = [
  [33, 56],
  [82, 104],
  [116, 149],
];

// ---------------------------------------------------------------- the packet + the page bar
// The packet talks under Color, runs left to Edit (the camera's on its way there), works
// there through the trim and the sort, then runs right: Fusion, Fairlight, on.
const HOPS: [number, number, Cell, Cell][] = [
  [30, 48, "color", "edit"],
  [118, 134, "edit", "fusion"],
  [130, 147, "fusion", "fairlight"],
  [145, 195, "fairlight", "deliver"],
];
export const packetX4k = (f: number) =>
  HOPS.reduce((x, [a, b, from, to]) => x + (cellMid4k(to) - cellMid4k(from)) * seg(f, a, b), cellMid4k("color")) + 5 * Math.sin(f / 9);
/** frame the packet reaches a cell's centre (computed, so the lit cell and the packet never drift apart) */
const reach = (c: Cell, after: number) => {
  for (let k = Math.round(after * 4); k < 4 * 220; k++) {
    const f = k / 4;
    const x = packetX4k(f) - 5 * Math.sin(f / 9);
    if (Math.abs(x - cellMid4k(c)) < 2) return f;
  }
  return 9999;
};
export const SWITCH_AT = {
  edit: reach("edit", 30),
  fusion: reach("fusion", 118),
  fairlight: reach("fairlight", 130),
};
type Lit = "color" | "edit" | "fusion" | "fairlight";
const ORDER: Lit[] = ["color", "edit", "fusion", "fairlight"];
/** active-page weight per cell: a quick eased crossfade, like the page bar switching */
export const activeOf = (c: Lit, f: number) => {
  const i = ORDER.indexOf(c);
  const at = (l: Lit) => (l === "color" ? -99 : SWITCH_AT[l]);
  const up = i === 0 ? 1 : seg(f, at(c) - 1, at(c) + 3, DECEL);
  const nx = ORDER[i + 1];
  const down = nx ? seg(f, at(nx) - 1, at(nx) + 3, DECEL) : 0;
  return up * (1 - down);
};
/** the packet's voice: it talks while the work happens, runs flatter in between */
export const talkAmp = (f: number) => {
  const work = Math.max(1 - seg(f, 26, 36), seg(f, 50, 56) * (1 - seg(f, 76, 84)), seg(f, 96, 102) * (1 - seg(f, 122, 130)));
  const lean = Math.max(...Object.values(SWITCH_AT).map((a) => c01(1 - Math.abs(f - a) / 7)));
  return (15 + 15 * work + 8 * lean) * (0.84 + 0.16 * Math.sin(f * 0.43));
};

export const GLITCH = [Math.round(SWITCH_AT.edit), Math.round(SWITCH_AT.fusion)];
