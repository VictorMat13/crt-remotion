// ===========================================================================
// AcP5PayMonthly: world layout + timeline (helpers for P5 only).
// One continuous horizontal world (1080x960 viewport; world px == screen px at
// zoom 1). The scope trace runs along TY: the Photoshop icon sits on it at the
// left, the twelve months hang under it (Jan .. Dec), and it runs into the
// claude.ai composer at the right, with the Claude mark on the line at the
// composer's doorstep (the slot where the next Jan would be).
// The heartbeat: a sharp blip leaves the Photoshop icon every BEAT frames and
// runs right at one month per beat, so the blips are always one month apart
// and sit exactly on the month ticks on every beat.
// ===========================================================================
import { Easing, interpolate, random } from "remotion";
import { BUILD_PROMPT, EASE, safeRect } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);

export const W = 1080;
export const H = 960;
export const SR = safeRect(W, H); // x 86-994, y 77-922

// ---------------------------------------------------------------- world
export const TY = 480; // the trace
export const PS = { x: 220, size: 150 } as const; // official Ps icon (240x234 artboard)
export const MONTH = 90; // px per month
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const monthX = (m: number) => PS.x + MONTH * (m + 1); // Jan 310 .. Dec 1300
export const MARK = { x: PS.x + MONTH * 13, size: 104 } as const; // 1390: the 13th slot
export const COMP = { left: MARK.x + MARK.size / 2 + 24, top: TY - 245, w: 620, h: 490 } as const; // 1466..2086, 235..725
export const COMP_RIGHT = COMP.left + COMP.w;
export const COMP_BOTTOM = COMP.top + COMP.h;

// composer internals (composer-local px). The prompt reads at 44px world,
// ~44-50px on screen (Victor, Oct 13: readable on a phone).
export const CMP = {
  padX: 34,
  textTop: 30,
  font: 44,
  line: 60,
  rowCy: COMP.h - 24 - 34, // bottom control row centre
  send: { size: 68, right: 24 },
} as const;
/** send button centre, world */
export const SEND_C = { x: COMP_RIGHT - CMP.send.right - CMP.send.size / 2, y: COMP.top + CMP.rowCy } as const;

// ---------------------------------------------------------------- heartbeat
export const BEAT = 12; // frames per month
export const SPEED = MONTH / BEAT; // 7.5 px per frame
export const EMIT0 = -8; // a blip leaves the icon centre at EMIT0 + k*BEAT
export const BLIP_H = 230; // R-wave height, world px

// ---------------------------------------------------------------- story beats
export const TYPE: [number, number] = [53, 124]; // the prompt types out (placeholder before)
export const CURSOR_IN = 102;
export const PRESS = 128; // cursor presses send
export const SEND = 131; // sent: caret gone, glitch, Claude wakes, the heartbeat stops
export const GLITCH = [SEND];
export const KILL_SPEED = 70; // the flatline runs back up the line from Claude, px/frame
export const WAKE = SEND + 1;

// ---------------------------------------------------------------- typing
// Real cadence: per-character jitter, a hitch at each word boundary, a short
// pause after the comma and a longer one after the full stop. Deterministic.
export const PROMPT = BUILD_PROMPT;
const CHAR_AT: number[] = (() => {
  const w: number[] = [];
  let pauses = 0;
  for (let i = 0; i < PROMPT.length; i++) {
    const prev = i > 0 ? PROMPT[i - 1] : "";
    let k = 0.75 + 0.5 * random(`p5-type-${i}`);
    if (prev === " ") k += 0.45;
    w.push(k);
    if (prev === ",") pauses += 3;
    if (prev === "." && i < PROMPT.length - 1) pauses += 5;
  }
  const span = TYPE[1] - TYPE[0] - pauses;
  const sum = w.reduce((a, b) => a + b, 0);
  const at: number[] = [];
  let t = TYPE[0];
  for (let i = 0; i < PROMPT.length; i++) {
    const prev = i > 0 ? PROMPT[i - 1] : "";
    if (prev === ",") t += 3;
    if (prev === "." && i < PROMPT.length - 1) t += 5;
    t += (w[i] * span) / sum;
    at.push(t);
  }
  return at;
})();
/** characters typed by frame f */
export const typedAt = (f: number) => {
  let n = 0;
  while (n < CHAR_AT.length && CHAR_AT[n] <= f + 1e-6) n++;
  return n;
};
/** true while keys are going down (caret stays solid) */
export const typingAt = (f: number) => f >= TYPE[0] - 1 && f <= TYPE[1] + 2;

// ---------------------------------------------------------------- camera
// A sum of overlapping TRAVEL-eased moves, so the truck rides at a steady pace
// (no single whip) and the camera is already moving at frame 0 and still
// moving at the last frame. Opens tight on the Ps icon; trucks right with the
// beats through the year while pulling back; settles on the composer; then a
// slow continuous push (staggered small moves) through typing, send and out.
type Move = { t: [number, number]; x?: number; y?: number; z?: number };
const BASE = { x: 386, y: 417, z: 1.5 };
// the truck: seven staggered legs (start slow on the icon, ride ~35px/frame, ease onto the composer)
const TRUCK: [number, number][] = [[-4, 150], [4, 190], [12, 200], [20, 200], [28, 200], [36, 190], [44, 127]];
const MOVES: Move[] = [
  ...TRUCK.map(([t0, x]): Move => ({ t: [t0, t0 + 42], x })),
  { t: [0, 76], y: 16, z: -0.5 },
  ...Array.from({ length: 6 }, (_, i): Move => ({ t: [58 + 20 * i, 118 + 20 * i], x: 13, y: i < 2 ? 15 : 3, z: 0.036 })),
];
/**
 * CameraMotionBlur stays at 1 sample. The fast part of the truck carries the
 * thin ECG spikes and the month labels sideways; an 8-sample 180deg blur
 * smears them into dim bands that the CRT grade then crushes to black (the
 * P2-P4 lesson). The steady truck above keeps the pan under ~37px/frame.
 */
export const BLUR_SAMPLES = 1;

export const camAt = (f: number) => {
  let x = BASE.x;
  let y = BASE.y;
  let z = BASE.z;
  for (const m of MOVES) {
    const k = interpolate(f, m.t, [0, 1], { ...clamp, easing: TRAVEL });
    x += (m.x ?? 0) * k;
    y += (m.y ?? 0) * k;
    z += (m.z ?? 0) * k;
  }
  return { x, y, z };
};
export type Cam = ReturnType<typeof camAt>;
/** world -> screen */
export const toScreen = (wx: number, wy: number, c: Cam) => ({ x: W / 2 + (wx - c.x) * c.z, y: H / 2 + (wy - c.y) * c.z });

// ---------------------------------------------------------------- cursor (world px, tip)
export const cursorAt = (f: number) => {
  const target = { x: SEND_C.x + 10, y: SEND_C.y + 12 }; // tip on the button's lower right, arrow icon stays clear
  const start = { x: COMP_RIGHT + 40, y: COMP_BOTTOM + 190 };
  const rest = { x: target.x + 34, y: target.y + 96 };
  const legs: [number, number, { x: number; y: number }, { x: number; y: number }, number][] = [
    [CURSOR_IN, PRESS - 1, start, target, -38],
    [SEND + 3, SEND + 40, target, rest, 12],
  ];
  let p = start;
  for (const [a, b, from, to, bow] of legs) {
    const k = interpolate(f, [a, b], [0, 1], { ...clamp, easing: TRAVEL });
    if (k <= 0) break;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const arc = bow * Math.sin(Math.PI * k); // a hand moves a mouse in a slight arc
    p = { x: from.x + dx * k - (dy / len) * arc, y: from.y + dy * k + (dx / len) * arc };
  }
  const press = interpolate(f, [PRESS, PRESS + 2, PRESS + 5], [0, 1, 0], clamp);
  return { ...p, press, opacity: interpolate(f, [CURSOR_IN, CURSOR_IN + 6], [0, 1], clamp) };
};
