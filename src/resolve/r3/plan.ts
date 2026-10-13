// ===========================================================================
// DrP3Highlight: world layout + timeline + camera (helpers for R3 only).
//
// One flat world in the pixels of the official Resolve 21 Edit page
// screenshot (5120x2880). Everything else sits on it:
//   - a floating Claude composer (claude.ai dark) over the media pool, on the
//     scope trace, with the Claude mark on the line at its right;
//   - the trace runs right through the black letterbox band under the two
//     viewers; the source strip (2 hours of footage, real clip frames cropped
//     from the Edit and Color screenshots of the same project) sits on it;
//   - the real timeline below: a new track V4 is created on drop (Resolve's
//     own "Video 4" drop zone), the picked moments pack onto it, the playhead
//     rides the packing edge and the real timecode readout ticks to 01:01:00:00;
//   - the record viewer then plays the cut.
// ===========================================================================
import { Easing, interpolate } from "remotion";
import { EASE, HIGHLIGHT_PROMPT, SHOTS, safeRect } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);

export const W = 1080;
export const H = 960;
export const SR = safeRect(W, H); // x 86-994, y 77-922

export const EDIT = SHOTS.edit; // 5120x2880
export const COLOR = SHOTS.color; // 3840x2160

/** idle trace ink, a bit brighter than PH.trace so it survives the CRT grade */
export const TRACE_INK = "rgba(243,241,236,0.5)";

// ---------------------------------------------------------------- world: the trace
export const TY = 1214; // the scope trace, through the black band under the viewers

// ---------------------------------------------------------------- composer + mark
export const COMP = { left: 600, top: TY - 135, w: 760, h: 270 } as const; // 600..1360, 1079..1349 (over the media pool / source viewer edge)
export const COMP_RIGHT = COMP.left + COMP.w;
export const COMP_BOTTOM = COMP.top + COMP.h;
export const CMP = {
  padX: 34,
  textTop: 26,
  font: 46,
  line: 60,
  rowCy: COMP.h - 50,
  send: { size: 66, right: 24 },
} as const;
export const SEND_C = { x: COMP_RIGHT - CMP.send.right - CMP.send.size / 2, y: COMP.top + CMP.rowCy } as const;
export const MARK = { x: 1480, size: 104 } as const;
/** the floating composer closes once the prompt is sent (Claude Desktop quick entry) */
export const COMP_CLOSE: [number, number] = [78, 98];

// ---------------------------------------------------------------- source strip
// Sits on the trace, under both viewers. Content scrolls left under the head.
export const STRIP = { x0: 1560, x1: 4244, top: TY + 32, thumbW: 288, thumbH: 133, border: 3, gap: 8 } as const;
export const STRIP_H = STRIP.thumbH + 2 * STRIP.border; // 139
export const HEAD_X = 2180; // Claude's scan head on the trace

// ---------------------------------------------------------------- timeline (screenshot px)
export const HEADER = { x0: 1232, x1: 1748 } as const; // track header column
export const LANE_X1 = 4712; // right end of the timeline lanes (mixer beyond)
export const RULER = { x0: 1750, y0: 1706, y1: 1789 } as const;
export const T0_X = 1756; // 01:00:00:00 on the ruler
/** px per second: the whole 4:53 timeline (record viewer duration 00:04:53:10) fits the lanes */
export const ZPS = (LANE_X1 - 6 - T0_X) / 293.4; // ~10.05
export const ZONE = { y0: 1790, y1: 1847 } as const; // Resolve's "Video 4" drop zone
export const LANE_H = 122; // a standard track row (V3 is 1847..1969)
export const GROW = LANE_H - (ZONE.y1 - ZONE.y0); // 65: rows below shift down when V4 is created
export const PANEL_BOTTOM = 2772; // timeline panel bottom (page bar below)
export const COUNTER = { cx: 1490, base: 1767, font: 42.5, x0: 1252, x1: 1740, y0: 1712, y1: 1786 } as const;
/** the baked playhead line through the tracks (healed: the playhead is ours) */
export const BAKED_PH = { x0: 3937, x1: 3950 } as const;

// ---------------------------------------------------------------- the moments (cut order)
// durations in seconds, sum 60; the cut packs from 01:00:00:00
export const MOMENT_DUR = [9, 8, 10, 7, 9, 8, 9] as const;
export const MOMENT_X = MOMENT_DUR.map((_, k) => T0_X + MOMENT_DUR.slice(0, k).reduce((a, b) => a + b, 0) * ZPS);
export const MOMENT_W = MOMENT_DUR.map((d) => d * ZPS);
/** Resolve marker colours: Blue, Cyan, Green, Yellow, Pink, Purple, Blue */
export const MARKER_RGB = ["58,141,230", "47,197,201", "62,174,62", "229,194,31", "232,124,184", "154,98,217", "58,141,230"] as const;
export const PICK = [118, 130, 142, 154, 166, 178, 190] as const; // marker drops on the frame under the head
export const LIFT = 5; // frames the copy pops out
export const FLY = 22; // frames to the V4 slot
export const LAND = PICK.map((t) => t + LIFT + FLY); // 145 .. 217
export const TICK = 8; // the readout rolls up over 8 frames per landing
export const V4_AT = LAND[0] - 9; // the drop creates V4 just before the first clip lands
export const V4_GROW: [number, number] = [V4_AT, V4_AT + 10];
export const v4Grow = (f: number) => GROW * interpolate(f, V4_GROW, [0, 1], { ...clamp, easing: TRAVEL });

// ---------------------------------------------------------------- story beats
export const TYPE: [number, number] = [-26, 46]; // ~18 characters ("Make a 60-second h") already typed on f0
export const CURSOR_IN = 32;
export const PRESS = 54;
export const SEND = 57;
export const WAKE = 63; // the person's green packet reaches Claude's mark
export const RUN: [number, number] = [66, 104]; // Claude's packet runs the trace to the head
export const SCRUB_ON = 100;
export const SCRUB_OFF: [number, number] = [194, 228];
export const HEAD_OFF: [number, number] = [224, 240]; // Claude's scan head lifts off the strip when the job is done
export const PB0 = 234; // playback from the top (12x shuttle) in the record viewer
export const PB_RATE = 12;
export const GLITCH = [SEND, LAND[6] + 1];

// ---------------------------------------------------------------- typing (real cadence, deterministic)
export const PROMPT = HIGHLIGHT_PROMPT;
const CHAR_AT: number[] = (() => {
  const w: number[] = [];
  for (let i = 0; i < PROMPT.length; i++) {
    const prev = i > 0 ? PROMPT[i - 1] : "";
    // pseudo-random per character without importing random(): a fixed hash
    const h = Math.abs(Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
    let k = 0.75 + 0.5 * h;
    if (prev === " ") k += 0.45;
    w.push(k);
  }
  const span = TYPE[1] - TYPE[0];
  const sum = w.reduce((a, b) => a + b, 0);
  const at: number[] = [];
  let t = TYPE[0];
  for (let i = 0; i < PROMPT.length; i++) {
    t += (w[i] * span) / sum;
    at.push(t);
  }
  return at;
})();
export const typedAt = (f: number) => {
  let n = 0;
  while (n < CHAR_AT.length && CHAR_AT[n] <= f + 1e-6) n++;
  return n;
};
export const typingAt = (f: number) => f <= TYPE[1] + 2;

// ---------------------------------------------------------------- scrub (strip content offset, world px)
const V_SCRUB = 88; // px per frame at full speed (fast scrub)
const vAt = (t: number) => {
  const on = interpolate(t, [SCRUB_ON, SCRUB_ON + 12], [0, 1], { ...clamp, easing: ENTER });
  const off = interpolate(t, SCRUB_OFF, [1, 0], { ...clamp, easing: DECEL });
  // the head slows on each best moment so the marker can drop on it
  let dip = 0;
  for (const p of PICK) dip += Math.exp(-(((t - p) / 2.6) ** 2));
  return V_SCRUB * on * off * (1 - 0.82 * Math.min(1, dip));
};
const DT = 0.25;
const S_TABLE: number[] = (() => {
  const out = [0];
  let s = 0;
  for (let t = 0; t < 320; t += DT) {
    s += vAt(t + DT / 2) * DT;
    out.push(s);
  }
  return out;
})();
export const scrollAt = (f: number) => {
  if (f <= 0) return 0;
  const i = Math.min(S_TABLE.length - 2, Math.floor(f / DT));
  const k = (f - i * DT) / DT;
  return S_TABLE[i] + (S_TABLE[i + 1] - S_TABLE[i]) * k;
};
export const S_END = scrollAt(300);

// ---------------------------------------------------------------- playhead + readout
/** seconds into the timeline at frame f: rides the packing edge, then plays from the top */
export const playAt = (f: number) => {
  if (f >= PB0) return ((f - PB0) * PB_RATE) / 30;
  let t = 0;
  LAND.forEach((l, k) => {
    t += MOMENT_DUR[k] * interpolate(f, [l, l + TICK], [0, 1], { ...clamp, easing: DECEL });
  });
  return t;
};
/** Resolve's record timecode (24 fps project), timeline starts at 01:00:00:00 */
export const tc = (sec: number, hourBase = 1) => {
  const fr = Math.max(0, Math.floor(sec * 24 + 1e-6));
  const ff = fr % 24;
  const s = Math.floor(fr / 24);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(hourBase + Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(ff)}`;
};
/** which moment the record viewer shows during playback */
export const momentAtSec = (sec: number) => {
  let acc = 0;
  for (let k = 0; k < MOMENT_DUR.length; k++) {
    acc += MOMENT_DUR[k];
    if (sec < acc) return k;
  }
  return MOMENT_DUR.length - 1;
};

// ---------------------------------------------------------------- camera
// Sums of overlapping travel-eased moves (z is log scale), so the camera is
// already moving on f0, never parks on a keyframe, and still moves on the last frame.
type Move = { t: [number, number]; x?: number; y?: number; z?: number };
const BASE = { x: 1066, y: TY, z: Math.log(0.93) };
const MOVES: Move[] = [
  // slow push on the composer while the prompt types
  { t: [-24, 66], y: 4, z: Math.log(0.955 / 0.93) },
  // follow Claude's packet along the trace into the app, tilting down to the timeline
  { t: [60, 112], x: 825, y: 382, z: Math.log(0.84 / 0.955) },
  // slow push while the moments pack (readout and the cut end stay in the safe area)
  { t: [96, 232], x: -32, y: 30, z: Math.log(0.9 / 0.84) },
  // ease out and up to the record viewer while the cut plays
  { t: [222, 296], x: 1690, y: -520, z: Math.log(0.575 / 0.9) },
];
export const camAt = (f: number) => {
  let { x, y, z } = BASE;
  for (const m of MOVES) {
    const k = interpolate(f, m.t, [0, 1], { ...clamp, easing: TRAVEL });
    x += (m.x ?? 0) * k;
    y += (m.y ?? 0) * k;
    z += (m.z ?? 0) * k;
  }
  // tiny ambient drift on top
  return { x: x + 3 * Math.sin(f / 41), y: y + 2.5 * Math.sin(f / 53 + 1), s: Math.exp(z) };
};
export type Cam = ReturnType<typeof camAt>;
export const toScreen = (p: { x: number; y: number }, c: Cam) => ({ x: W / 2 + (p.x - c.x) * c.s, y: H / 2 + (p.y - c.y) * c.s });
/** 8-sample camera blur only on the two big moves */
export const BLUR_WIN: [number, number][] = [
  [64, 108],
  [226, 284],
];
/** screenshot brightness: dim behind the composer, ~0.8 once we are in the app (bright UI blooms) */
export const appBright = (f: number) => interpolate(f, [62, 104], [0.62, 0.8], { ...clamp, easing: TRAVEL });

// ---------------------------------------------------------------- cursor (world px, tip)
export const cursorAt = (f: number) => {
  const target = { x: SEND_C.x + 10, y: SEND_C.y + 12 };
  const start = { x: COMP_RIGHT + 120, y: COMP_BOTTOM + 300 };
  const rest = { x: target.x + 40, y: target.y + 110 };
  const legs: [number, number, { x: number; y: number }, { x: number; y: number }, number][] = [
    [CURSOR_IN, PRESS - 1, start, target, -36],
    [SEND + 3, SEND + 40, target, rest, 12],
  ];
  let p = start;
  for (const [a, b, from, to, bow] of legs) {
    const k = interpolate(f, [a, b], [0, 1], { ...clamp, easing: TRAVEL });
    if (k <= 0) break;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const arc = bow * Math.sin(Math.PI * k);
    p = { x: from.x + dx * k - (dy / len) * arc, y: from.y + dy * k + (dx / len) * arc };
  }
  const press = interpolate(f, [PRESS, PRESS + 2, PRESS + 5], [0, 1, 0], clamp);
  return { ...p, press, opacity: interpolate(f, [CURSOR_IN, CURSOR_IN + 6], [0, 1], clamp) * interpolate(f, [SEND + 30, SEND + 44], [1, 0], clamp) };
};
