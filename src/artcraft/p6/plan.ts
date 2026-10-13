// ===========================================================================
// AcP6NoCode: world layout + timeline (helpers for P6 only).
// World = the 1080x1920 frame at zoom 1 (world px == screen px). Top to bottom:
// the sent user message (BUILD_PROMPT) in its bubble, the scope trace with the
// Claude mark on it, the artifact panel (header with the Preview | Code toggle,
// then the Code view / the built app). Everything is drawn at reading size and
// centred on x 540 so the camera can push to ~1.17x and keep the trace (top)
// and the app (bottom) inside the safe area (x 86-994, y 154-1690).
// ===========================================================================
import { Easing, interpolate } from "remotion";
import { EASE } from "../theme";
import { PREFIX, TOTAL_CHARS } from "./code";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);

export const TRACE_INK = "rgba(243,241,236,0.5)";
export const WHITE_RGB = "243,241,236";

// ---------------------------------------------------------------- world
export const BUBBLE = { right: 960, top: 176, w: 796, padX: 28, padY: 22, font: 34, line: 48 } as const; // 3 lines
export const TRACE_Y = 432;
export const MARK = { x: 230, size: 84 } as const;
export const PANEL = { left: 120, right: 960, top: 504, bottom: 1574, header: 98 } as const;
export const PANEL_W = PANEL.right - PANEL.left; // 840
export const BODY = { top: PANEL.top + PANEL.header, bottom: PANEL.bottom } as const;

// code view
export const CODE = { font: 30, line: 44, padTop: 14, gutterR: 70, x: 88, visible: 21, keep: 20 } as const;

// the built app (world px). Content x 160..920 (760 wide).
export const APP = { left: 160, right: 920 } as const;
export const APP_HEAD = { top: 628, h: 76 } as const;
export const STAGE = { left: 160, top: 730, w: 760 } as const;
export const SRC = { w: 3859, h: 2594 } as const; // great-wave.jpg (PhotoCraft status bar: 3859 × 2594 px)
export const S0 = STAGE.w / SRC.w; // display px per source px
export const STAGE_H0 = SRC.h * S0; // 510.87
/** crop target, source px (exact so the fields land on round numbers) */
export const CROP_SRC = { w: 2700, h: 1800 } as const;
export const CROP_END = { w: CROP_SRC.w * S0, h: CROP_SRC.h * S0 }; // 531.7 x 354.5 (caption card starts at 370)
export const APPLY_K = STAGE.w / CROP_END.w; // 1.429
export const STAGE_H1 = STAGE.w / (CROP_SRC.w / CROP_SRC.h); // 506.67
export const TYPED = "1080";
export const OUT_H = Math.round(Number(TYPED) / (CROP_SRC.w / CROP_SRC.h)); // 720
export const FILE_OUT = `great-wave-${TYPED}x${OUT_H}.png`; // a.download = `${name}-${w}x${h}.png`

// Width / Height: label above its field (label { display: grid }), the lock between
export const LABEL_TOP = 1268;
export const CTRL = { top: 1318, h: 90 } as const;
export const W_IN = { left: 160, w: 310 } as const;
export const LOCK = { left: 504, w: 72 } as const;
export const H_IN = { left: 610, w: 310 } as const;
// Export PNG, and the browser's download chip landing beside it
export const EXPORT = { left: 160, top: 1442, w: 250, h: 92 } as const;
export const CHIP = { left: 430, right: 920, top: 1442, h: 92 } as const;

// ---------------------------------------------------------------- timeline
// VO: "even if you've never written a line of code" 0-90 | "If you can describe
// what you want" 90-150 | "Claude can make a simple version of it" 150-240.
export const STREAM: [number, number] = [0, 86];
export const START_LINE = 40; // opens mid-stream: the CSS is already written
/** bursts: Claude writes in chunks; the trace pulses with each one */
export const BURSTS = [2, 9, 16, 24, 31, 38, 46, 53, 60, 67, 74, 81];
export const burst = (f: number) => BURSTS.reduce((a, b) => a + Math.exp(-((f - b) ** 2) / (2 * 1.7 * 1.7)), 0);

export const TOGGLE: [number, number] = [88, 97]; // Code -> Preview
export const GLITCH = [92];
export const APP_IN = 93; // app elements rise from here, staggered 1-2f
export const CODE_OUT: [number, number] = [91, 102]; // the Code view dissolves under the rising app
export const CURSOR_IN = 114;
export const PRESS = 156; // on the bottom-right crop handle
export const DRAG: [number, number] = [158, 184];
export const RELEASE = 186;
export const APPLY: [number, number] = [187, 202];
export const CLICK_W = 201; // focus
export const SELECT = 204; // second click of the double-click selects the value
export const KEYS = [206, 208, 210, 212];
export const CLICK_EXPORT = 226;
export const CHIP_IN = 229;
export const PKT_OUT: [number, number] = [230, 254];

// ---------------------------------------------------------------- code stream
const START_C = PREFIX[START_LINE];
const STREAM_TABLE = (() => {
  // cumulative bursty rate, sampled every 1/4 frame
  const n = (STREAM[1] - STREAM[0]) * 4;
  const acc: number[] = [0];
  for (let i = 1; i <= n; i++) {
    const f = STREAM[0] + i / 4;
    acc.push(acc[i - 1] + 0.42 + burst(f));
  }
  const total = acc[n];
  return acc.map((a) => START_C + ((TOTAL_CHARS - START_C) * a) / total);
})();

/** chars streamed by frame f (continuous) */
export const charsAt = (f: number) => {
  if (f <= STREAM[0]) return START_C;
  if (f >= STREAM[1]) return TOTAL_CHARS;
  const x = (f - STREAM[0]) * 4;
  const i = Math.floor(x);
  const t = x - i;
  return STREAM_TABLE[i] + (STREAM_TABLE[Math.min(i + 1, STREAM_TABLE.length - 1)] - STREAM_TABLE[i]) * t;
};

/** current line index + how far into it (0..1) */
export const lineAt = (chars: number) => {
  let lo = 0;
  let hi = PREFIX.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (PREFIX[mid] <= chars) lo = mid;
    else hi = mid - 1;
  }
  const len = PREFIX[lo + 1] - PREFIX[lo];
  return { line: lo, col: Math.floor(chars - PREFIX[lo]), frac: Math.min(1, (chars - PREFIX[lo]) / len) };
};

// ---------------------------------------------------------------- camera
// One keyframe set, travel easing per segment; keys run past both ends so the
// camera is moving on frame 0 and still pushing on the last frame.
//   0-84    slow push into the streaming code (0.95 -> 1.04)
//   84-126  the eased push as the toggle flips to Preview (-> 1.13)
//   126-240 follows the hand: the handle drag, the Width field, Export, and a
//           slow push to the end (-> 1.17). The trace stays in frame at the top.
export const CAM_T = [-20, 84, 126, 156, 186, 204, 226, 272];
export const CAM_X = [546, 536, 542, 546, 545, 546, 547, 547];
export const CAM_Y = [905, 942, 990, 985, 978, 1000, 1012, 1018];
export const CAM_Z = [0.95, 1.04, 1.13, 1.14, 1.15, 1.155, 1.16, 1.175];
export const BLUR_WIN: [number, number][] = [[88, 122]];

export const camAt = (f: number) => {
  const o = { ...clamp, easing: TRAVEL };
  return { x: interpolate(f, CAM_T, CAM_X, o), y: interpolate(f, CAM_T, CAM_Y, o), z: interpolate(f, CAM_T, CAM_Z, o) };
};
