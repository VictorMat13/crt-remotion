// ===========================================================================
// MtP3LookDifferent plan: world layout, timeline, camera and pulse math.
// Pure math (Easing + EASE only) so framing can be checked numerically.
//
// World units, origin on the scope trace (y = 0, y down). One trace runs across
// the whole world; the top row of screens sits on it, the bottom row hangs
// from it. Phase 1 the four screens are a loose, mismatched 2x2 wall (each a
// real past deliverable in a different look). The top row then parts, the
// STYLE.md file card drops into the slot onto the trace, and a coral pulse
// leaves it both ways: each screen powers off and back on as a delivered
// CRT Scope (ArtCraft) graphic as the pulse passes, and squares up.
// ===========================================================================
import { Easing } from "remotion";
import { EASE } from "../theme";

export const DUR = 180;

export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
/** eased 0 -> 1 between frames a and b */
export const seg = (f: number, a: number, b: number, ease: (n: number) => number = TRAVEL) => ease(c01((f - a) / (b - a)));

// ---------------------------------------------------------------- lens
// principal point = centre of the 9:8 safe area (y 77..922)
export const SCX = 540;
export const SCY = 500;

// ---------------------------------------------------------------- world
export const SCR = { w: 560, h: 498 } as const; // 9:8, same as every source clip
export const HALF_GAP = 18; // rows sit just off the trace on either side
export const ROW_Y = { top: -HALF_GAP - SCR.h / 2, bottom: HALF_GAP + SCR.h / 2 } as const;
export const CARD = { w: 560, h: 420 } as const; // STYLE.md, sits on the trace in the top row

// the top row parts to open the card's slot
export const PART: [number, number] = [62, 94];
export const TOP_X0 = 300; // phase 1: tight 2x2 wall
export const TOP_X1 = 580; // after parting: slot of 600 for the card
export const BOT_X = 300;

// card drop: from above the frame onto the trace, lands soft on LAND
export const DROP: [number, number] = [66, 100];
export const DROP_H = 1180;
export const LAND = 98;
export const cardBottom = (f: number) => -HALF_GAP - DROP_H * (1 - seg(f, DROP[0], DROP[1], TRAVEL));

/** soft tracking wobble on the one story beat: the skill lands */
export const GLITCH = [LAND];

// ---------------------------------------------------------------- clips
// Real past deliverables (trimmed copies in public/motiontips/clips):
//  old = four earlier graphics, each in a different look
//  crt = four delivered ArtCraft graphics, all CRT Scope
// grade = CSS filter that keeps each look reading as itself through the tube's
// black-crush grade (bright white dimmed ~30%, dark grey worlds lifted).
export type ScreenDef = {
  id: string;
  row: "top" | "bottom";
  side: -1 | 1;
  old: { src: string; grade: string };
  crt: { src: string; grade: string };
  /** phase 1 mismatch: rotation (deg), scale, offset */
  mess: { rot: number; s: number; dx: number; dy: number };
};

const CRT_GRADE = "contrast(0.86) brightness(1.12)";
export const SCREENS: ScreenDef[] = [
  {
    id: "liam",
    row: "bottom",
    side: -1,
    old: { src: "motiontips/clips/t3-liam-white.mp4", grade: "brightness(0.7)" },
    crt: { src: "motiontips/clips/t3-crt-icons.mp4", grade: CRT_GRADE },
    mess: { rot: 1.7, s: 1.03, dx: -6, dy: 8 },
  },
  {
    id: "vox",
    row: "bottom",
    side: 1,
    old: { src: "motiontips/clips/t3-invideo3-vox.mp4", grade: "contrast(0.84) brightness(1.16)" },
    crt: { src: "motiontips/clips/t3-crt-prompt.mp4", grade: CRT_GRADE },
    mess: { rot: -1.4, s: 0.985, dx: 8, dy: 4 },
  },
  {
    id: "fish8",
    row: "top",
    side: -1,
    old: { src: "motiontips/clips/t3-fish8-clean.mp4", grade: "contrast(0.8) brightness(1.45)" },
    crt: { src: "motiontips/clips/t3-crt-rail.mp4", grade: CRT_GRADE },
    mess: { rot: -2.1, s: 1.01, dx: -4, dy: -6 },
  },
  {
    id: "bennett",
    row: "top",
    side: 1,
    old: { src: "motiontips/clips/t3-bennett-grid.mp4", grade: "contrast(0.84) brightness(1.32)" },
    crt: { src: "motiontips/clips/t3-crt-preview.mp4", grade: "contrast(0.88) brightness(0.86)" }, // cream Great Wave blooms out
    mess: { rot: 1.3, s: 0.975, dx: 6, dy: -3 },
  },
];

/** column x of a screen (the top row parts outward to open the card slot) */
export const screenX = (s: ScreenDef, f: number) =>
  s.side * (s.row === "bottom" ? BOT_X : TOP_X0 + (TOP_X1 - TOP_X0) * seg(f, PART[0], PART[1], TRAVEL));

// ---------------------------------------------------------------- the pulse
// Leaves the card both ways the moment it lands. Overlapping eased hops (the
// pulse never stops, it leans into each station): bottom row at 300, top row
// at 580, then away off the frame edge.
const HOPS: [number, number, number][] = [
  [LAND, LAND + 13, BOT_X],
  [LAND + 8, LAND + 25, TOP_X1 - BOT_X],
  [LAND + 20, LAND + 52, 820],
];
export const pulseX = (f: number) => HOPS.reduce((a, [t0, t1, d]) => a + d * seg(f, t0, t1), 0);
/** pulse envelope */
export const pulseAmp = (f: number) => c01((f - LAND + 1) / 4) * (1 - seg(f, LAND + 34, LAND + 54, DECEL));

/** frame the pulse reaches |x| (quarter-frame resolution) */
const arriveAt = (x: number) => {
  for (let k = LAND * 4; k < DUR * 4; k++) if (pulseX(k / 4) >= x - 1e-6) return k / 4;
  return 9999;
};
export const ARRIVE: Record<string, number> = Object.fromEntries(
  SCREENS.map((s) => [s.id, arriveAt(s.row === "bottom" ? BOT_X : TOP_X1)]),
);

// the skill keeps feeding the row: small packets leave the card both ways
export const TRICKLE = [130, 150, 168].map((t0) => ({ t0, t1: t0 + 40 }));
export const trickleX = (p: { t0: number; t1: number }, f: number) => 900 * seg(f, p.t0, p.t1, DECEL);

// switch envelope for one screen: old picture collapses to a line (CRT power
// off), the beam holds, the new picture opens out of it
export const switchOf = (a: number, f: number) => {
  const off = seg(f, a - 1, a + 5, DECEL); // old picture height 1 -> 0
  const open = seg(f, a + 6, a + 16, ENTER); // new picture height 0 -> 1
  const beamIn = seg(f, a + 1, a + 5, DECEL);
  const beamOut = seg(f, a + 7, a + 14, DECEL);
  const beam = beamIn * (1 - beamOut);
  const over = f < a + 6 ? 0 : 1 - seg(f, a + 6, a + 22, DECEL); // overexposure decays
  const tidy = seg(f, a - 3, a + 18, TRAVEL); // squares up with the row
  return { off, open, beam, over, tidy };
};

// ---------------------------------------------------------------- camera
// Already moving on f0: the camera rides up out of the bottom-left screen
// (close, the mismatched looks big) and pulls back over the whole wall; it
// eases into a slow push up toward the landed card that is still under way on
// the last frame. Axes are separate eased segments that overlap, so the
// camera never comes to rest.
// x and y are one long eased travel each (up and to the right, the whole
// shot); zoom pulls back over the wall, then pushes in again toward the card.
// Windows overlap and the long ones are normalised to land on the last frame
// while still moving. Checked numerically: the frame corners move >= 1.2 px/f
// on every frame; only the tube padding (<= 48px) ever shows black.
export type Cam = { x: number; y: number; z: number };
const X: [number, number, number, number] = [-140, 30, -40, 220]; // from, to, window
const Y: [number, number, number, number] = [110, -72, -40, 200];
const Z_OUT: [number, number, number, number] = [1.33, 0.97, -40, 96];
const Z_IN: [number, number, number, number] = [0.97, 1.08, 60, 250];
/** eased 0 -> 1 that reaches 1 on the last frame (still moving there) */
const toEnd = (f: number, a: number, b: number) => seg(f, a, b) / seg(DUR - 1, a, b);

export const camAt = (f: number): Cam => ({
  x: X[0] + (X[1] - X[0]) * toEnd(f, X[2], X[3]) + 9 * Math.sin(f / 41),
  y: Y[0] + (Y[1] - Y[0]) * toEnd(f, Y[2], Y[3]) + 6 * Math.sin(f / 53 + 1.3),
  z: Z_OUT[0] + (Z_OUT[1] - Z_OUT[0]) * seg(f, Z_OUT[2], Z_OUT[3]) + (Z_IN[1] - Z_IN[0]) * toEnd(f, Z_IN[2], Z_IN[3]),
});

/** 8-sample camera blur only on the fast moves: the pull-back and the card drop */
export const BLUR_WINS: [number, number][] = [
  [0, 70],
  [78, 97],
];
