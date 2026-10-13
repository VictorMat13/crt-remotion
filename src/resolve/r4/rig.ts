// ===========================================================================
// DrP4Hours rig: world layout, page-bar timeline and the keyed 3D camera.
// Pure math (Easing + EASE only) so framing can be checked numerically
// outside Remotion. Camera model = src/artcraft/p1/rig.ts (keyed position +
// look-at, CSS chain translateZ(P) rotateX rotateY translate3d(-C)), same
// world convention: x right, y DOWN (up is negative), z toward the camera.
// World units = px of the 5120-wide Edit press shot.
//
// The six real Resolve 21 pages (official press-kit shots, their own page bar
// cropped off) stand in depth one behind the other, each a step higher, in a
// zig-zag: Edit at the front, then Fusion, Color, Fairlight, Cut, Photo.
// Resolve's real page bar is the app's chrome: it stays at the foot of the
// frame (screen space, cropped from the Edit shot) while the camera pulls back
// off the Edit page, which stands on the bar (the real layout); the scope trace
// runs under the bar. A coral packet runs along the trace; each cell it
// reaches becomes the active page (the real lit cell, cropped from that page's own shot) and the
// matching page in the stack switches on and takes the focus.
// ===========================================================================
import { Easing } from "remotion";
import { EASE } from "../theme";

export type V3 = { x: number; y: number; z: number };

export const W = 1080;
export const H = 1920;
export const DUR = 135;

export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
/** eased 0 -> 1 between frames a and b */
export const seg = (f: number, a: number, b: number, ease: (n: number) => number = TRAVEL) => ease(c01((f - a) / (b - a)));

// ---------------------------------------------------------------- the page bar (screen space)
// Real bar geometry (measured): in the 4K shots the bar is y 2066-2160, cell i
// (0 = Media) spans x 1104 + 204 i .. +204; the 5K Edit shot has the same bar
// at +640 x, y 2786-2880. Only the active cell differs between shots.
export const BAR_SRC = { y4k: 2066, y5k: 2786, h: 94, x0_4k: 1104, cell: 204, dx5k: 640 } as const;
export const CELLS = ["media", "photo", "cut", "edit", "fusion", "color", "fairlight", "deliver"] as const;
export type Cell = (typeof CELLS)[number];
export const cellX5k = (c: Cell) => BAR_SRC.x0_4k + BAR_SRC.dx5k + BAR_SRC.cell * CELLS.indexOf(c);
/** bar scale: its labels (cap height 20px in the shot) read ~36px on screen */
export const BAR_S = 1.3;
/** the window of the bar in frame: Edit .. Fairlight, their icons + labels inside the 8% safe width */
export const BAR_CENTER_SRC = 2772; // 5K px
export const BAR_BOTTOM = 1690; // the safe bottom (12% on 9:16)
export const BAR_TOP = BAR_BOTTOM - BAR_SRC.h * BAR_S; // 1567.8
/** 5K source x -> screen x on the bar */
export const barX = (x5k: number) => W / 2 + (x5k - BAR_CENTER_SRC) * BAR_S;
/** the front page stands on the bar (the real layout); the scope trace runs under the bar */
export const FOOT_Y = BAR_TOP;
export const LINE_Y = BAR_BOTTOM + 46;

// ---------------------------------------------------------------- pages
export type PageId = "edit" | "fusion" | "color" | "fairlight" | "cut" | "photo";
export type Page = {
  id: PageId;
  src: string;
  /** source px of the shot */
  sw: number;
  /** content rows kept (the page bar is cropped off: it lives in the chrome) */
  sh: number;
  /** world size of the plane */
  w: number;
  h: number;
  /** centre of the plane */
  c: V3;
  /** rotateY, degrees */
  rot: number;
  /** grade: dark UIs lift a little, bright content is dimmed so it never blows out */
  bright: number;
};

const SHOT = (n: string) => `resolve/shots/bmd-resolve21-${n}-hires.png`;
const K4 = 5120 / 3840;
const PW = 5120;
const H5 = 2780; // Edit content rows (bar + separators from 2780 down)
const H4 = 2064 * K4; // 4K content rows (bar + separators from 2064 down), in world units

// depth spacing, rise (grows with depth so the far pages still clear the near ones), toe-in
export const STEP = { dz: 1500, rise: 1350, riseGrow: 125, rot: 7 } as const;
const riseAt = (i: number) => STEP.rise * i + STEP.riseGrow * i * (i - 1);
/** zig-zag x per page, set by eye for the whole move: the orbit carries the far pages right,
 *  so the left-hand pages sit wider than the right-hand ones */
const XS = [0, -1240, 1280, -2300, 1620, -3270];

const ORDER: { id: PageId; n: string; side: number; bright: number }[] = [
  { id: "edit", n: "Edit", side: 0, bright: 0.86 },
  { id: "fusion", n: "Fusion", side: -1, bright: 1.12 },
  { id: "color", n: "Color", side: 1, bright: 1.0 },
  { id: "fairlight", n: "Fairlight", side: -1, bright: 1.1 },
  { id: "cut", n: "Cut", side: 1, bright: 0.98 },
  { id: "photo", n: "Photo", side: -1, bright: 0.9 },
];

export const PAGES: Page[] = ORDER.map((o, i) => {
  const edit = i === 0;
  const h = edit ? H5 : H4;
  return {
    id: o.id,
    src: SHOT(o.n),
    sw: edit ? 5120 : 3840,
    sh: edit ? H5 : 2064,
    w: PW,
    h,
    // planes stand with their bottom edge at y = -riseAt(i) (the front one on the floor, y = 0)
    c: { x: XS[i], y: -riseAt(i) - h / 2, z: -i * STEP.dz },
    rot: -o.side * STEP.rot,
    bright: o.bright,
  };
});

// ---------------------------------------------------------------- the packet + page switches
// The packet sits on the Edit cell at f0 (talking), then runs right along the
// trace; each cell becomes the active page when the packet reaches its centre.
const cellMid = (c: Cell) => cellX5k(c) + BAR_SRC.cell / 2;
/** packet x in 5K bar px: hops Edit -> Fusion -> Color -> Fairlight, overlapping so it never stops, then on past Deliver */
const HOPS: [number, number, Cell, Cell][] = [
  [26, 54, "edit", "fusion"],
  [50, 78, "fusion", "color"],
  [74, 102, "color", "fairlight"],
  [104, 170, "fairlight", "deliver"],
];
export const packetX5k = (f: number) =>
  HOPS.reduce((x, [a, b, from, to]) => x + (cellMid(to) - cellMid(from)) * seg(f, a, b), cellMid("edit")) + 6 * Math.sin(f / 9);
/** frame the packet reaches each cell's centre (computed, so lighting and packet never drift apart) */
const reach = (c: Cell) => {
  for (let k = 0; k < 4 * 200; k++) {
    const f = k / 4;
    if (packetX5k(f) - 6 * Math.sin(f / 9) >= cellMid(c) - 1e-6) return f;
  }
  return 9999;
};
export const SWITCH_AT: Record<"fusion" | "color" | "fairlight", number> = {
  fusion: reach("fusion"),
  color: reach("color"),
  fairlight: reach("fairlight"),
};
/** active-page weight per cell: a quick eased crossfade, like the page bar switching */
export const activeOf = (c: "edit" | "fusion" | "color" | "fairlight", f: number) => {
  const nextCell = { edit: "fusion", fusion: "color", color: "fairlight", fairlight: null } as const;
  const nx = nextCell[c];
  const up = c === "edit" ? 1 : seg(f, SWITCH_AT[c] - 1, SWITCH_AT[c] + 3, DECEL);
  const down = nx ? seg(f, SWITCH_AT[nx] - 1, SWITCH_AT[nx] + 3, DECEL) : 0;
  return up * (1 - down);
};
/** a page switches on (lift + brief overexposure) 2 frames after its cell lights: cell, then page */
export const powerOf = (id: PageId, f: number) => {
  if (id === "edit") return { on: 1, over: 0 };
  if (id === "cut" || id === "photo") return { on: 0, over: 0 };
  const a = SWITCH_AT[id] + 2;
  return { on: seg(f, a, a + 8, ENTER), over: f < a ? 0 : 1 - seg(f, a + 1, a + 18, DECEL) };
};

// ---------------------------------------------------------------- camera
// Lens: principal point at the frame centre.
export const CX = W / 2;
export const CY = 900;
export const P = 1400;

export type CamParams = { C: V3; T: V3 };
type Pose = { C: V3; T: V3 };
const lerp3 = (a: V3, b: V3, k: number): V3 => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k });

// f0: straight on, pushed in on the Edit page so that 5K x BAR_CENTER_SRC sits at screen x 540
// and the page's bottom edge on the bar (y FOOT_Y), at the bar's own scale (1.3 screen px per
// source px): the page and its page bar line up exactly, then the page pulls away from the bar.
const S0 = BAR_S;
const D0 = P / S0;
const C0: V3 = { x: BAR_CENTER_SRC - 2560, y: -(FOOT_Y - CY) / S0, z: D0 };
export const POSE0: Pose = { C: C0, T: { x: C0.x, y: C0.y, z: 0 } };
// end of the pull-back: level, well back, looking at the middle of the stack. Its height/distance
// ratio equals POSE0's, so on the straight pull-back the Edit page's bottom edge stays on the bar.
const D1 = 7000;
export const POSE1: Pose = { C: { x: 0, y: -(FOOT_Y - CY) * (D1 / P), z: D1 }, T: { x: 0, y: -(FOOT_Y - CY) * (D1 / P), z: -2200 } };
/** the long pull-back (travel); already moving on f0 (renormalised so f0 is exactly POSE0) */
export const PULL: [number, number] = [-24, 126];
const k0 = seg(0, PULL[0], PULL[1]);
const pullK = (f: number) => (seg(f, PULL[0], PULL[1]) - k0) / (1 - k0);
/** after the pull-back eases out, a slow drift back + up keeps the frame travelling */
const DRIFT: { t: [number, number]; C: V3 } = { t: [92, 300], C: { x: 0, y: -500, z: 1800 } };
/** the orbit (yaw round the look-at point): the pages slide past each other */
export const ORBIT: { t: [number, number]; rad: number } = { t: [36, 250], rad: -0.6 };

export const camParams = (f: number): CamParams => {
  const k = pullK(f);
  const C = lerp3(POSE0.C, POSE1.C, k);
  const T = lerp3(POSE0.T, POSE1.T, k);
  const kd = seg(f, DRIFT.t[0], DRIFT.t[1]);
  C.x += DRIFT.C.x * kd;
  C.y += DRIFT.C.y * kd;
  C.z += DRIFT.C.z * kd;
  const a = ORBIT.rad * seg(f, ORBIT.t[0], ORBIT.t[1]);
  const dx = C.x - T.x;
  const dz = C.z - T.z;
  C.x = T.x + dx * Math.cos(a) - dz * Math.sin(a);
  C.z = T.z + dx * Math.sin(a) + dz * Math.cos(a);
  // ambient drift (zero on f0)
  C.x += 10 * Math.sin(f / 37);
  C.y += 8 * Math.sin(f / 51);
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

/** focus rides the active page: Edit, then racks back to Fusion, Color, Fairlight */
const focusPage = (f: number) => {
  // the focus follows the page that just switched on (cell, then page, then focus)
  const racks: [number, number][] = [
    [SWITCH_AT.fusion + 2, SWITCH_AT.fusion + 18],
    [SWITCH_AT.color + 2, SWITCH_AT.color + 18],
    [SWITCH_AT.fairlight + 2, SWITCH_AT.fairlight + 18],
  ];
  let i = 0;
  let u = 0;
  for (let k = 0; k < racks.length; k++) {
    const r = seg(f, racks[k][0], racks[k][1]);
    if (r > 0) {
      i = k;
      u = r;
    }
  }
  const a = PAGES[i].c;
  const b = PAGES[Math.min(PAGES.length - 1, i + 1)].c;
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u };
};

export const camAt = (f: number): Cam => {
  const cam = orient(camParams(f));
  cam.focus = toCam(cam, focusPage(f)).d;
  return cam;
};

// depth of field: screen-space blur from relative defocus
export const DOF_K = 5;
export const DOF_BAND = 0.08;
export const DOF_MAX = 3.5;
export const dofPx = (cam: Cam, d: number) => {
  const b = Math.min(DOF_MAX, DOF_K * Math.max(0, Math.abs(cam.focus / Math.max(1, d) - 1) - DOF_BAND));
  return b < 0.5 ? 0 : Math.round(b * 4) / 4;
};

/** projected corners of a page plane (screen px) */
export const corners = (cam: Cam, pg: Page) => {
  const r = (pg.rot * Math.PI) / 180;
  const pts = [
    [-pg.w / 2, -pg.h / 2],
    [pg.w / 2, -pg.h / 2],
    [pg.w / 2, pg.h / 2],
    [-pg.w / 2, pg.h / 2],
  ].map(([lx, ly]) => project(cam, { x: pg.c.x + Math.cos(r) * lx, y: pg.c.y + ly, z: pg.c.z - Math.sin(r) * lx }));
  return pts;
};
