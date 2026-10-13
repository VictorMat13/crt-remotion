// ===========================================================================
// MtP7References: world layout, files, timeline, camera and flight math
// (helpers for T7 only). Pure math, so framing can be checked numerically.
//
// One wide horizontal world (1080x960 viewport; world px == screen px at
// zoom 1). The scope trace runs across the top at TY. Under it sits the
// claude.ai composer (dark, laid out like the real capture
// public/claude-chat/shots/02-attached.png: attachment cards in a row at the
// top, the prompt under them, the control row at the bottom). It is a wide
// window, wide enough for six attachment cards in one row.
// Each file is dragged in as its own thumbnail: it rides the trace in from
// the left on a green packet (the person's side of the line), curves down off
// the line into the next free slot and the attachment card builds around it
// (name, then the type badge). The camera trucks right with the growing row
// and pushes in on it, never stopping.
// ===========================================================================
import { Easing, interpolate } from "remotion";
import { EASE, safeRect } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);

export const W = 1080;
export const H = 960;
export const DUR = 185;
export const SR = safeRect(W, H); // x 86-994, y 77-922

// ---------------------------------------------------------------- world
export const TY = 250; // the trace
export const N = 6;
/** attachment card (claude.ai file card: name top left, type badge bottom left), world px */
export const CARD = { w: 280, h: 330, gap: 18, r: 16 } as const;
// 26px world = 35-41px on screen over the push; the longest name (Adobe_Photoshop_CC_icon.svg)
// still wraps to two lines ("Adobe_Photoshop_" / "CC_icon.svg")
export const NAME = { x: 16, top: 14, font: 26, line: 32 } as const;
/** the file's own thumbnail inside the card */
export const THUMB = { x: 10, y: 90, w: 260, h: 230, r: 10 } as const;
export const BADGE = { font: 24, inset: 12 } as const;
/** the composer */
export const COMP = { left: 76, top: 340, pad: 28, rowTop: 24, r: 30 } as const;
export const ROW_TOP = COMP.top + COMP.rowTop; // 364
export const COMP_W = 2 * COMP.pad + N * CARD.w + (N - 1) * CARD.gap; // 1826
export const PROMPT_BOX = { top: ROW_TOP + CARD.h + 26, font: 44, line: 58 } as const; // 720
export const CTRL_CY = PROMPT_BOX.top + PROMPT_BOX.line + 56; // 834, control row centre
export const COMP_H = CTRL_CY + 50 - COMP.top; // 544 (bottom 884)
export const slotX = (i: number) => COMP.left + COMP.pad + i * (CARD.w + CARD.gap); // 104 + 298 i
/** thumbnail centre once landed in slot i */
export const thumbHome = (i: number) => ({ x: slotX(i) + THUMB.x + THUMB.w / 2, y: ROW_TOP + THUMB.y + THUMB.h / 2 });
/** thumbnail scale while it rides the trace */
export const FS = 0.72;

// ---------------------------------------------------------------- the files
// Real files from this pipeline, real names (copies in public/motiontips/t7;
// the two big ones are downscaled copies, their names on screen stay real).
export type RefFile = {
  name: string;
  type: string;
  kind: "img" | "video" | "claude" | "ps";
  src?: string;
  /** object-position of the cover crop */
  pos?: string;
  /** brightness: bright content blooms out in the tube (dimmed), very dark content sinks (lifted) */
  dim?: number;
};
export const FILES: RefFile[] = [
  // public/artcraft/site: the real PhotoCraft screenshot (getartcraft.com)
  { name: "photocraft-hero.webp", type: "WEBP", kind: "img", src: "motiontips/t7/photocraft-hero.webp", pos: "34% 50%", dim: 0.7 },
  // public/artcraft/logos: the official Claude mark
  { name: "claude.svg", type: "SVG", kind: "claude", src: "motiontips/t7/claude.svg" },
  // CREATORS/Styles/CRT Scope: the style's contact sheet
  { name: "contact-sheet.png", type: "PNG", kind: "img", src: "motiontips/t7/contact-sheet.png", pos: "100% 50%", dim: 1.15 },
  // public/artcraft/logos: the official Photoshop icon (drawn by PsIcon, tile lifted for the tube)
  { name: "Adobe_Photoshop_CC_icon.svg", type: "SVG", kind: "ps" },
  // CREATORS/Styles/CRT Scope: the style's example render (plays)
  // (mostly black with small bright marks: cropped in on the trace and the Claude mark, lifted)
  { name: "example - fish 8 hook.mp4", type: "MP4", kind: "video", src: "motiontips/t7/example-fish-8-hook-540.mp4", dim: 1.3 },
  // public/resolve/shots: Blackmagic's DaVinci Resolve 21 Color page press shot
  { name: "bmd-resolve21-Color-hires.png", type: "PNG", kind: "img", src: "motiontips/t7/bmd-resolve21-Color-1280.png", pos: "44% 50%", dim: 0.9 },
];
/** the file name as the card wraps it (long names break after "_" and "-", like the app's file cards) */
export const wrapName = (n: string) => n.replace(/([_-])/g, "$1\u200B");

// The prompt already in the box (Victor's real words from this session).
export const PROMPT = "make it the CRT scope style.";

// ---------------------------------------------------------------- timeline
// VO: "This can already give you pretty good results," 0-55 | "but if you want
// the video to be perfect," 55-105 | "give your AI references to everything." 105-185.
// Opens mid-action: the first file is finishing its drop and the second is
// already riding the line. The files keep coming, one after another, a new
// one setting off before the last has landed; the sixth lands on "everything".
export const LAND = [4, 22, 58, 90, 124, 158];
/** frames on the trace; the later ones come from further back, so they ride longer and overlap (a queue on the line) */
export const RIDE_LEN = [44, 58, 56, 62, 66, 70];
export const RIDE = LAND.map((l, i) => l - RIDE_LEN[i]); // -40, -36, 2, 28, 58, 88
export const ARRIVE = 6; // x arrives over the slot this many frames before landing
export const DROP_LEN = 20; // off the line and down into the slot
export const GLITCH = [LAND[5]]; // the row is complete

/** tiles layer: 8 blur samples while any file is moving fast, 1 otherwise */
export const tilesFast = (f: number) => LAND.some((l, i) => f >= RIDE[i] + 6 && f <= l);

// ---------------------------------------------------------------- camera
// Sums of overlapping TRAVEL legs (the AcP5 pattern), so the camera is already
// moving at frame 0, never stops, and is still moving on the last frame.
// Framed tight (z 1.36 -> 1.52) so the cards and their names read big and the
// frame is the trace band plus the row, with the prompt line under it at the
// start. x follows the files: at first it drifts right with the first
// arrivals, then trucks right so each new card lands on the right of frame
// with the landed ones filling the rest (the next slot is revealed only as
// its file arrives). z: one long push plus a second one that takes over at the
// end (the row is full, the camera keeps pushing in on it). y rises a little
// with the push so the trace stays in the top of frame.
type Leg = { t: [number, number]; d: number };
const legs = (f: number, base: number, ls: Leg[]) =>
  ls.reduce((a, l) => a + l.d * interpolate(f, l.t, [0, 1], { ...clamp, easing: TRAVEL }), base);

/** camera x when each card lands */
const XK = [396, 478, 700, 1004, 1302, 1598];
const X_LEGS: Leg[] = [
  { t: [-60, 30], d: 50 },
  // one leg per gap; the first starts early (already trucking at frame 0), the last
  // one arrives with the sixth card so it lands inside the frame
  ...XK.slice(1).map((x, k): Leg => ({ t: [LAND[k] - (k === 0 ? 28 : 14), LAND[k + 1] + (k === 4 ? 6 : 14)], d: x - XK[k] })),
  { t: [LAND[5] - 10, 230], d: 4 },
];
/** anchored on the last frame: the finished row's last two cards fill the frame */
const X_END = 1592;
const X_BASE = X_END - legs(DUR - 1, 0, X_LEGS);

const Z_LEGS: Leg[] = [
  { t: [-80, 170], d: 0.1 },
  { t: [104, 222], d: 0.17 },
];
const Z_BASE = 1.36 - legs(0, 0, Z_LEGS);

const Y_LEGS: Leg[] = [
  { t: [-90, 230], d: -26 },
  { t: [140, 220], d: 30 }, // the last push tilts down onto the finished row
];
const Y_BASE = 456 - legs(0, 0, Y_LEGS);

export const camAt = (f: number) => ({
  x: legs(f, X_BASE, X_LEGS) + 2.5 * Math.sin(f / 37),
  y: legs(f, Y_BASE, Y_LEGS) + 2 * Math.sin(f / 51 + 1),
  z: legs(f, Z_BASE, Z_LEGS),
});
export type Cam = ReturnType<typeof camAt>;
/** world -> screen */
export const toScreen = (wx: number, wy: number, c: Cam) => ({ x: W / 2 + (wx - c.x) * c.z, y: H / 2 + (wy - c.y) * c.z });

// ---------------------------------------------------------------- flights
/** where file i's thumbnail is at frame f (centre, world px) and its scale */
export const flightAt = (i: number, f: number) => {
  const L = LAND[i];
  const R = RIDE[i];
  const home = thumbHome(i);
  // it enters from just beyond the left edge of frame at the moment it sets off
  const c0 = camAt(R);
  const x0 = c0.x - W / 2 / c0.z - (THUMB.w * FS) / 2 - 24;
  const ux = interpolate(f, [R, L - ARRIVE], [0, 1], { ...clamp, easing: TRAVEL });
  const uy = interpolate(f, [L - DROP_LEN, L], [0, 1], { ...clamp, easing: TRAVEL });
  return {
    x: x0 + (home.x - x0) * ux,
    y: TY + (home.y - TY) * uy,
    s: FS + (1 - FS) * uy,
    /** 0 riding, 1 landed */
    uy,
    started: f >= R,
  };
};

/** the card builds around the landed thumbnail */
export const cardIn = (i: number, f: number) => interpolate(f, [LAND[i] - 6, LAND[i] + 6], [0, 1], { ...clamp, easing: ENTER });
export const nameIn = (i: number, f: number) => interpolate(f, [LAND[i] - 2, LAND[i] + 8], [0, 1], { ...clamp, easing: ENTER });
export const badgeIn = (i: number, f: number) => interpolate(f, [LAND[i] + 1, LAND[i] + 10], [0, 1], { ...clamp, easing: ENTER });
