// ===========================================================================
// MtP2Remotion: world layout + timeline + camera (helpers for T2 only).
// One tall world, 1080 wide (world px == screen px at zoom 1). Top to bottom:
//   the Claude Code terminal (full safe width) ->
//   the scope trace leaves its bottom edge at TRACE_X and runs straight down:
//   the Claude mark on it, then the official Remotion lockup on it (mark on
//   the line, wordmark to its right), then it plugs into the top edge of the
//   frame where the delivered ArtCraft graphic plays.
// The camera opens close on the terminal (z 1.10) and travels down the line
// to the frame (z 1.02), never stopping: a long eased drift plus one eased
// travel that follows the blue packet from Remotion into the frame.
// ===========================================================================
import { Easing, interpolate } from "remotion";
import { EASE } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);

// Victor's real prompt (his words, Oct 13 session).
export const PROMPT =
  "make it the CRT scope style. Just make sure that it's very visually stimulating and that there's always something going on.";
// The real render of the delivered graphic (ArtCraft P3 = "But here's where it (9x8).mp4").
export const RENDER_CMD = "npx remotion render AcP3ThirtyYears";
export const CLIP = "motiontips/clips/but-heres-where-it-9x8.mp4"; // 1080x960, 180f

export const TRACE_INK = "rgba(243,241,236,0.5)";
export const WHITE_RGB = "243,241,236";
export const REM_RGB = "70,156,252"; // Remotion blue #0B84F3, lifted for the tube

// ---------------------------------------------------------------- world
export const TERM = { left: 96, right: 984, top: 160, bottom: 860, tab: 62, padX: 36, padY: 18, font: 36, line: 50 } as const;
export const ADV = 0.6 * TERM.font; // JetBrains Mono advance (21.6)
export const COLS = 37; // wrap width (37 x 21.6 = 799 px of the 816 inner)
export const BODY = { top: TERM.top + TERM.tab + TERM.padY, bottom: TERM.bottom - TERM.padY } as const;
export const VIEW_H = BODY.bottom - BODY.top; // 602
export const CODE = { font: 26, line: 34 } as const;

export const TRACE_X = 264; // puts the Remotion lockup (mark on the line) centred on x 540
export const CLAUDE = { y: 960, size: 92 } as const;
// remotion-new-logo-dark.png is 895x213; the mark's box is x 0..204, y 0..210.
export const REM = { y: 1200, h: 170 } as const;
export const REM_S = REM.h / 213;
export const REM_W = 895 * REM_S; // 714
export const REM_MARK = { cx: 102 * REM_S, cy: 105 * REM_S, r: 90 } as const; // mark centre inside the lockup; r = the black disc behind it
export const FRAME = { left: 104, top: 1385, w: 872, h: 775 } as const; // 9:8, 907 px wide at z 1.04
export const FRAME_BOTTOM = FRAME.top + FRAME.h;

// ---------------------------------------------------------------- timeline
// VO: "Motion graphics used to take me hours to do" 0-72 | "until I discovered
// Remotion" 72-108 | "a free tool that turns simple prompts into motion graphics" 108-195.
/** dictation: Victor's words arrive in three spoken chunks (pauses at the full stops) */
const CHUNKS: [number, number, number][] = [
  // [first word frame, last word frame, word count]
  [-26, -4, 6], // make it the CRT scope style.
  [2, 22, 8], // Just make sure that it's very visually stimulating
  [27, 38, 7], // and that there's always something going on.
];
export const WORDS = PROMPT.split(" ");
export const WORD_AT: number[] = CHUNKS.flatMap(([a, b, n]) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1)));
export const ENTER_KEY = 44;
export const PKT_IN: [number, number] = [44, 50]; // the sent prompt rides into the Claude mark
export const CLAUDE_WAKE = 50;
export const WRITE_AT = 54;
export const STREAM: [number, number] = [56, 92];
export const BURSTS = [57, 63, 69, 75, 81, 87];
export const burst = (f: number) => BURSTS.reduce((a, b) => a + Math.exp(-((f - b) ** 2) / (2 * 1.8 * 1.8)), 0);
export const PKT_LEN = 10; // coral packet, Claude -> Remotion
export const LAST_PKT = 91; // the last one wakes Remotion
export const BASH_AT = 92;
export const RUNNING_AT = 95;
export const REM_WAKE = LAST_PKT + PKT_LEN - 1; // 100
export const PKT_OUT: [number, number] = [102, 116]; // Remotion -> the frame
export const F_WAKE = 116;
export const GLITCH = [REM_WAKE, F_WAKE];
export const CLIP_FROM = 101; // plays clip frames 101..179 over 116..194
export const FLOW = { from: 124, every: 14, len: 11 } as const; // Remotion keeps feeding the frame

// ---------------------------------------------------------------- camera
// fy = A (long eased drift whose keys lie outside the part, so it never stops)
//    + B (one eased travel following the blue packet down into the frame).
// Solved so the terminal top sits at screen y ~188 on frame 0 (z 1.10) and the
// frame's bottom edge lands on the safe bottom (1688) on frame 194 (z 1.00), with
// Claude Code's status line, input box and footer still inside the safe top.
const A_T: [number, number] = [-260, 420];
const A_Y: [number, number] = [730, 1330];
const B_T: [number, number] = [96, 130];
const B_Y = 192;
const Z: [number, number] = [1.1348, 0.9767];
export const BLUR_WIN: [number, number][] = [[96, 132]];

export const camAt = (f: number) => {
  const o = { ...clamp, easing: TRAVEL };
  return {
    x: 540 + 3 * Math.sin(f / 40),
    y: interpolate(f, A_T, A_Y, o) + interpolate(f, B_T, [0, B_Y], o) + 2.5 * Math.sin(f / 53),
    z: interpolate(f, A_T, Z, o),
  };
};

// ---------------------------------------------------------------- text helpers
/** greedy word wrap at `cols` monospace columns */
export const wrap = (text: string, cols: number): string[] => {
  const out: string[] = [];
  let cur = "";
  for (const w of text.split(" ")) {
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= cols) cur += " " + w;
    else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  return out;
};

/** words dictated by frame f */
export const wordsAt = (f: number) => WORD_AT.filter((t) => f >= t).length;
