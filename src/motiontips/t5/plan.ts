// ===========================================================================
// MtP5Movement plan: world layout, slideshow timeline, the monitor sweep model
// and the camera. Pure math (Easing + EASE only) so framing can be checked
// numerically.
//
// World units, origin on the scope trace (y = 0, y down), x = 0 at the middle
// of the slideshow. The slideshow is a mosaic of five slots: two wide-ish cards
// stand on the monitor strip, three tall ones hang under it. Real UI cards
// (crops of real app screenshots in public/motiontips/t5) fade in one after
// another and sit there; once every slot is full the "slideshow" keeps going by
// fading the next card in over the oldest one. Nothing in the content moves.
//
// The trace is a heart monitor. A sweep head runs right along the line at a
// constant V px/frame and records what the heart does at that instant; the
// next head (L px behind) overwrites it, with a short erase gap ahead of it,
// exactly like a bedside monitor. The heart beats at the start (weakening),
// then stops: the following sweeps paint flat line over the old beats. Near the
// end one green beat kicks the trace back to life.
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
/** eased 0 -> 1 that reaches 1 on the last frame while still moving there */
const toEnd = (f: number, a: number, b: number) => seg(f, a, b) / seg(DUR - 1, a, b);

// ---------------------------------------------------------------- lens
// principal point = centre of the 9:8 safe area (y 77..922)
export const SCX = 540;
export const SCY = 500;

// ---------------------------------------------------------------- slideshow
export const STRIP = 70; // half height of the monitor strip around the trace
export const CH = 352; // card height
export type SlotId = "A" | "B" | "C" | "D" | "E";
export type Slot = { x: number; y: number; w: number; h: number };
// mosaic 908 x 844 world px (= the safe area at zoom 1)
export const SLOTS: Record<SlotId, Slot> = {
  A: { x: -454, y: -STRIP - CH, w: 520, h: CH },
  B: { x: 90, y: -STRIP - CH, w: 364, h: CH },
  C: { x: -454, y: STRIP, w: 300, h: CH },
  D: { x: -130, y: STRIP, w: 300, h: CH },
  E: { x: 194, y: STRIP, w: 260, h: CH },
};

/** a card: crop of a real app screenshot, dimmed so it does not bloom out in the tube */
export type CardDef = { slot: SlotId; src: string; dim: number; t: number };
export const FADE = 12; // a plain opacity fade, nothing else
const T5 = "motiontips/t5/";
export const CARDS: CardDef[] = [
  // already up when the part opens
  { slot: "A", src: `${T5}a-resolve-edit.jpg`, dim: 0.84, t: -60 },
  { slot: "B", src: `${T5}b-cadcraft.jpg`, dim: 0.92, t: -44 },
  { slot: "C", src: `${T5}c-vectorcraft.jpg`, dim: 0.7, t: -28 },
  // nearly in on frame 0, then the last empty slot
  { slot: "D", src: `${T5}d-lightcraft.jpg`, dim: 0.74, t: -10 },
  { slot: "E", src: `${T5}e-soundcraft.jpg`, dim: 0.8, t: 6 },
  // the slideshow keeps going: every 24 frames the next card fades in over the oldest
  { slot: "A", src: `${T5}a2-filmcolor.jpg`, dim: 0.82, t: 30 },
  { slot: "B", src: `${T5}b2-resolve-color.jpg`, dim: 0.88, t: 54 },
  { slot: "C", src: `${T5}c2-photocraft.jpg`, dim: 0.52, t: 78 },
  { slot: "D", src: `${T5}d2-filmcraft.jpg`, dim: 0.78, t: 102 },
  { slot: "E", src: `${T5}e2-resolve-cut.jpg`, dim: 0.7, t: 126 },
];
export const cardAlpha = (c: CardDef, f: number) => seg(f, c.t, c.t + FADE, TRAVEL);
/** a card is drawn until a later card in its slot is fully opaque */
export const cardVisible = (i: number, f: number) => {
  const c = CARDS[i];
  if (f < c.t) return false;
  for (let j = i + 1; j < CARDS.length; j++) if (CARDS[j].slot === c.slot && f >= CARDS[j].t + FADE) return false;
  return true;
};

// ---------------------------------------------------------------- monitor sweep
export const V = 18; // sweep speed, world px per frame
export const L = 1200; // distance between successive sweep heads
export const X0 = -188; // head k = 0 on frame 0
export const GAP = 40; // erase bar ahead of each head
export const headX = (k: number, f: number) => X0 + V * f - k * L;
/** the head that last passed x (its recording is what shows at x) */
export const ownerK = (x: number, f: number) => Math.floor((X0 + V * f - x) / L);

export const KICK = 146; // one green beat kicks the trace back to life
export const GLITCH = [KICK];
export const KICK_HEAD = 2; // the head that draws the kick
export const KICK_X = headX(KICK_HEAD, KICK); // 40

/** heart events. live = green (after the kick); the rest are the old rhythm dying out */
export type Beat = { t: number; a: number; live?: boolean };
export const BEATS: Beat[] = [
  { t: -116, a: 1 },
  { t: -94, a: 1 },
  { t: -72, a: 1 },
  { t: -50, a: 1 },
  { t: -28, a: 0.95 },
  { t: -6, a: 0.8 },
  { t: 16, a: 0.58 },
  { t: 38, a: 0.36 },
  { t: 62, a: 0.15 },
  // flatline from here until the kick
  { t: KICK, a: 1.3, live: true },
  { t: KICK + 20, a: 0.95, live: true },
  { t: KICK + 40, a: 0.95, live: true },
];
export const BLIP_H = 150; // R wave height at a = 1, world px

const gauss = (u: number, s: number) => Math.exp(-(u * u) / (2 * s * s));
/** ECG complex (P, Q, R, S, T) at distance u from the R peak; negative = up (AcP5 grammar) */
export const ecg = (u: number) =>
  -BLIP_H * (0.07 * gauss(u + 30, 7) - 0.09 * gauss(u + 8, 2.8) + gauss(u, 3.9) - 0.26 * gauss(u - 8, 3.4) + 0.12 * gauss(u - 31, 8.5));
export const ECG_L = -58;
export const ECG_R = 58;

/** after the kick the line comes alive outward from the kick point (fish8 carrier, slow sines) */
const LIFE_SPEED = 44; // px per frame, both ways
const LIFE_SOFT = 140;
const LIFE_AMP = 9;
export const lifeFront = (f: number) => LIFE_SPEED * Math.max(0, f - KICK - 1);
export const lifeEnv = (f: number) => seg(f, KICK + 1, KICK + 12, ENTER);
export const lifeAt = (x: number, f: number) => {
  const env = lifeEnv(f);
  if (env <= 0) return 0;
  const d = Math.abs(x - KICK_X);
  return env * c01((lifeFront(f) + LIFE_SOFT - d) / LIFE_SOFT);
};
export const LIFE = { soft: LIFE_SOFT, amp: LIFE_AMP } as const;
const carrier = (x: number, f: number) => 0.62 * Math.sin(x * 0.085 - f * 0.42) + 0.38 * Math.sin(x * 0.21 + f * 0.31);

/** trace height at world x on frame f (y down, 0 = baseline) */
export const yAt = (x: number, f: number) => {
  const k = ownerK(x, f);
  let y = 0;
  for (const b of BEATS) {
    const u = x - headX(k, b.t);
    if (u > ECG_L && u < ECG_R) y += b.a * ecg(u);
  }
  const l = lifeAt(x, f);
  if (l > 0) y += LIFE_AMP * l * carrier(x, f);
  return y;
};
/** true inside the erase bar just ahead of a head */
export const blankAt = (x: number, f: number) => x - headX(ownerK(x, f) + 1, f) < GAP;
/** frames since the owning head drew x */
export const ageAt = (x: number, f: number) => (headX(ownerK(x, f), f) - x) / V;

// ---------------------------------------------------------------- camera
// Never at rest: a slow creep in and across the slideshow the whole time
// (the stillness is in the content, never in the shot), a faint drift on top;
// after the kick it eases into a push toward the beat as the cut approaches.
export type Cam = { x: number; y: number; z: number };
/** an even creep from a to b: the mean of n staggered, overlapping TRAVEL moves (eased only at its far ends) */
const steady = (f: number, a: number, b: number, n = 6) => {
  const len = (b - a) / (1 + (n - 1) / 3);
  const step = len / 3;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += seg(f, a + i * step, a + i * step + len);
  return sum / n;
};
export const camAt = (f: number): Cam => ({
  x: -20 + 60 * steady(f, -120, 260) + 3 * Math.sin(f / 31 + 0.4) + 80 * toEnd(f, 140, 200),
  y: -16 + 30 * steady(f, -120, 260) + 4 * Math.sin(f / 47 + 1.3) - 10 * toEnd(f, 140, 200),
  z: 0.856 + 0.25 * steady(f, -120, 260) + 0.06 * toEnd(f, 140, 196),
});
/** world -> screen */
export const toScreen = (wx: number, wy: number, c: Cam) => ({ x: SCX + (wx - c.x) * c.z, y: SCY + (wy - c.y) * c.z });
export const worldTf = (c: Cam) =>
  `translate(${(SCX - c.x * c.z).toFixed(2)}px, ${(SCY - c.y * c.z).toFixed(2)}px) scale(${c.z.toFixed(5)})`;

/** 8-sample camera blur only on the push after the kick; the trace and grid stay sharp outside it */
export const BLUR_WIN: [number, number] = [KICK, DUR];

// ---------------------------------------------------------------- ECG grid (background plane)
export const GRID = { minor: 16, major: 80, parallax: 0.8, scroll: 0.9 } as const;
