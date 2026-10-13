// ===========================================================================
// AcP2SameShortcuts: world layout + timeline (helpers for P2 only).
// One continuous shot down a tall world (1080 wide, world px == screen px at
// zoom 1). Top: three Adobe -> Craft twin traces. Middle: the three real
// screenshots as a stack of dark windows. Bottom: the keycap row on its trace.
// ===========================================================================
import { Easing } from "remotion";
import { ADOBE_FIRST, APPS, EASE, appIcon, appShot, type AppId } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);

const hexRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

// ---------------------------------------------------------------- twin rows
export const ICON = 210;
export const ADOBE_X = 205;
export const TWIN_X = 875;
export const ROW_Y = [265, 515, 765];
/** packet runs between the icon edges */
export const PKT_X0 = ADOBE_X + ICON / 2 + 8;
export const PKT_X1 = TWIN_X - ICON / 2 - 8;

/** packet travel window per row; it lands on the twin at [1]. Opens mid-action:
 *  PhotoCraft has just woken on frame 0 and its window is already sliding out,
 *  Premiere's packet is leaving, After Effects waits its turn. */
export const PKT: [number, number][] = [
  [-32, -10],
  [-6, 16],
  [8, 30],
];
export const WIN_DUR = 28; // window slides out of the twin

// ---------------------------------------------------------------- windows
export const WIN_W = 760;
export const WIN_S = WIN_W / 1600;
/** EffectCraft's real 1600x972 shot is shown from y=62 (its panels row) down */
export const FX_CROP_TOP = 62;

export type Twin = {
  row: number;
  id: AppId;
  adobeLogo: string;
  icon: string;
  shot: string;
  rgb: string;
  nativeH: number;
  cropTop: number;
  /** twin framing (the fan) */
  fan: { left: number; top: number; rot: number };
  /** key framing (the deck behind PhotoCraft) */
  deck: { left: number; top: number; scale: number; blur: number; bright: number };
  z: number;
};

const accent = (id: AppId) => hexRgb(APPS.find((a) => a.id === id)!.accent);

export const TWINS: Twin[] = ADOBE_FIRST.map((a, i) => {
  const id = a.twin;
  const isFx = id === "effectcraft";
  const nativeH = isFx ? 972 - FX_CROP_TOP : 1000;
  const fan = [
    { left: 160, top: 1215, rot: 0 },
    { left: 168, top: 1058, rot: 1.4 },
    { left: 128, top: 900, rot: -2.2 },
  ][i];
  const deck = [
    { left: 160, top: 1215, scale: 1, blur: 0, bright: 1 },
    // FilmCraft rises fully above PhotoCraft (out of focus), EffectCraft peeks over it
    { left: 160, top: 668, scale: 0.94, blur: 1.2, bright: 1 },
    { left: 160, top: 600, scale: 0.9, blur: 2.2, bright: 0.85 },
  ][i];
  return {
    row: i,
    id,
    adobeLogo: a.logo,
    icon: appIcon(id),
    shot: appShot(id),
    rgb: accent(id),
    nativeH,
    cropTop: isFx ? FX_CROP_TOP : 0,
    fan,
    deck,
    z: 3 - i, // PhotoCraft in front
  };
});

// ---------------------------------------------------------------- camera
// Keys run past both ends so the camera is already moving on frame 0 and still
// moving on the last frame.
// Keys beat (Victor, Oct 13: "hard to read"): the camera pushes in close (1.55x) on the part of
// PhotoCraft each key changes: the Layers panel for ⌘J, the toolbar + canvas for B/T/V and ⇧⌘D.
export const CAM_T = [-12, 44, 72, 98, 124, 140, 158, 172, 200, 214, 256];
export const CAM_X = [540, 540, 540, 540, 640, 636, 460, 462, 468, 470, 540];
export const CAM_Y = [944, 952, 960, 966, 1400, 1398, 1404, 1406, 1410, 1406, 1330];
export const CAM_Z = [0.996, 0.988, 0.978, 0.975, 1.55, 1.56, 1.55, 1.565, 1.58, 1.56, 1.25];
export const TRAVEL_WIN: [number, number] = [98, 124];
export const BLUR_WINS: [number, number][] = [
  [96, 128],
  [140, 160],
];
/** the keycap row + its trace are screen-fixed (outside the camera) so every cap stays on screen during the pans */
export const KEYS_SCREEN_DY = -232;
export const ROWS_OUT: [number, number] = [106, 124];
export const GLITCH = [116, 134];
/** idle trace ink: a bit brighter than PH.trace so it survives the CRT black crush on pure black */
export const TRACE_INK = "rgba(243,241,236,0.5)";

// ---------------------------------------------------------------- keys
export const KEY = { x0: 160, x1: 920, top: 1750, size: 80, gap: 7, traceY: 1858 };
export const KEYS_IN = 100;

export type KeyCap = { glyph: string; group: number; down: number; up: number };
// Left to right = press order. B, T, V (not V first): Move is already the
// selected tool in the real screenshot, so V lands last and brings it back.
export const KEYCAPS: KeyCap[] = [
  { glyph: "⌘", group: 0, down: 132, up: 143 },
  { glyph: "J", group: 0, down: 134, up: 144 },
  { glyph: "B", group: 1, down: 152, up: 159 },
  { glyph: "T", group: 2, down: 175, up: 182 },
  { glyph: "V", group: 3, down: 190, up: 197 },
  { glyph: "⇧", group: 4, down: 204, up: 214 },
  { glyph: "⌘", group: 4, down: 205, up: 215 },
  { glyph: "D", group: 4, down: 207, up: 216 },
];

/** x of each cap's left edge (world) */
export const capLefts = (() => {
  const groups = Math.max(...KEYCAPS.map((k) => k.group)) + 1;
  const inner = KEYCAPS.reduce((n, k, i) => n + (i > 0 && KEYCAPS[i - 1].group === k.group ? 1 : 0), 0);
  const ggap = (KEY.x1 - KEY.x0 - KEYCAPS.length * KEY.size - inner * KEY.gap) / (groups - 1);
  const out: number[] = [];
  let x = KEY.x0;
  KEYCAPS.forEach((k, i) => {
    if (i > 0) x += KEYCAPS[i - 1].group === k.group ? KEY.gap : ggap;
    out.push(x);
    x += KEY.size;
  });
  return out;
})();

// ---------------------------------------------------------------- PhotoCraft UI events (native 1600x1000 px)
export const DUP = { at: 134, dur: 13 }; // ⌘J: Layer via Copy
/** selected-tool box (measured on the real shot): Move, Brush, Type */
export const TOOL = {
  move: { x: 19.75, y: 115.25 },
  brush: { x: 52.25, y: 270.75 },
  type: { x: 51.75, y: 415.25 },
  size: { w: 31, h: 32 },
};
export const TOOL_MOVES: { at: number; dur: number; to: keyof Omit<typeof TOOL, "size"> }[] = [
  { at: 153, dur: 7, to: "brush" },
  { at: 176, dur: 7, to: "type" },
  { at: 191, dur: 8, to: "move" },
];
export const STROKE = { at: 157, dur: 16, d: "M 872 344 C 948 262, 1060 246, 1176 300" };
export const ANTS = { at: 207, rect: { x: 300, y: 190, w: 520, h: 400 } };
