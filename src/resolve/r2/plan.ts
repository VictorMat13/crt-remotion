// ===========================================================================
// DrP2Connect: world layout + timeline + cameras (helpers for R2 only).
//
// Two layers, composed in screen space (2.5D depth):
//   FG  (front plane, FG world px == screen px at FG zoom 1): the Claude mark
//       and the ChatGPT mark on their scope traces, the traces converging into
//       the Resolve icon, and the real "AI Assistants Configured" dialog that
//       opens out of that icon (rebuilt at phone size from
//       shots/manual-p4318-ai-assistant-config-dialog.png, exact strings).
//   BG  (back plane, in the Edit screenshot's own pixels, 5120x2880): the real
//       Resolve 21 Edit page standing behind the dialog, blurred by depth.
// After OK, the dialog folds back into the icon, a coral packet drops out of
// the icon and the camera dollies through the front plane into the Edit page
// (front plane zooms past and blurs out, the back plane pulls into focus) to
// the timeline, where the packet lands under the B-roll and runs along the
// clips, selecting each one it reaches (Resolve's selection outline round the
// V2 video and its linked A2 audio, in Claude's coral).
// ===========================================================================
import { Easing, interpolate } from "remotion";
import { EASE, RESOLVE, SHOTS, safeRect } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);

export const W = 1080;
export const H = 1920;
export const SR = safeRect(W, H); // x 86-994, y 154-1690

/** idle trace ink, a bit brighter than PH.trace so it survives the CRT grade */
export const TRACE_INK = "rgba(243,241,236,0.5)";
export const WHITE_RGB = "243,241,236";
/** ChatGPT's mark is monochrome: its packets run in phosphor white */
export const GPT_RGB = WHITE_RGB;

// ---------------------------------------------------------------- FG world
// The dialog, at phone size. Real layout: icon top left, title + body to its
// right, the list box full width under them, OK bottom right. Strings exact
// (RESOLVE.dialog). The list box is scrollable (it has a scrollbar in the
// real dialog); it shows its first three rows, the Claude and ChatGPT ones.
export const DLG = { left: 86, top: 640, w: 908, h: 774, pad: 40, r: 12 } as const;
export const DLG_RIGHT = DLG.left + DLG.w; // 994
export const DLG_BOTTOM = DLG.top + DLG.h; // 1414
export const ICON = { left: 126, top: 680, size: 136 } as const;
export const ICON_C = { x: ICON.left + ICON.size / 2, y: ICON.top + ICON.size / 2 }; // 194, 748
export const TITLE = { left: 292, top: 682, font: 48 } as const;
export const BODY = { left: 292, top: 754, w: 662, font: 35, line: 50 } as const;
export const LIST = { left: 126, top: 990, w: 828, rowH: 88, font: 35 } as const;
export const LIST_ROWS = RESOLVE.dialog.list.slice(0, 3); // Claude Desktop (...), Claude Code, Codex in ChatGPT
export const LIST_H = LIST_ROWS.length * LIST.rowH + 4;
export const OK_BTN = { left: 954 - 224, top: 1296, w: 224, h: 78, font: 37 } as const;

// The marks on their traces, above the dialog.
export const MARK_SIZE = 160;
export const CLAUDE_AT = { x: 330, y: 200 } as const;
export const GPT_AT = { x: 760, y: 200 } as const;
/** where each trace plugs into the icon's top edge */
export const PLUG_CLAUDE = { x: ICON_C.x - 14, y: ICON.top } as const;
export const PLUG_GPT = { x: ICON_C.x + 14, y: ICON.top } as const;

// ---------------------------------------------------------------- packets
// Each packet leaves its mark and runs down the trace into the Resolve icon
// (travel easing). `row` = the dialog row it lights on arrival.
export type Packet = { wire: "claude" | "gpt"; t0: number; t1: number; row?: number };
export const PACKETS: Packet[] = [
  { wire: "claude", t0: -22, t1: 8 }, // already running on f0: wakes the icon, the dialog opens out of it
  { wire: "gpt", t0: -26, t1: 14 },
  { wire: "claude", t0: 30, t1: 60, row: 0 }, // Claude Desktop (extension installer opened)
  { wire: "claude", t0: 40, t1: 72, row: 1 }, // Claude Code
  { wire: "gpt", t0: 44, t1: 86, row: 2 }, // Codex in ChatGPT
  { wire: "gpt", t0: 62, t1: 96 }, // keeps the line alive
  { wire: "claude", t0: 82, t1: 110 }, // the one that goes on into the app
];
export const ROW_LIT = [61, 73, 87];

// ---------------------------------------------------------------- dialog beats
export const ICON_WAKE = 8;
export const OPEN: [number, number] = [8, 32]; // the panel opens out of the icon
export const CONTENT_AT = { title: 16, body: 19, list: 22, rows: [24, 26, 28], ok: 30 } as const;
export const CURSOR_IN = 84;
export const PRESS = 103; // the plain arrow presses OK
export const CLOSE: [number, number] = [106, 119]; // folds back into the icon
export const GLITCH = [104, 147];

// ---------------------------------------------------------------- into the app
export const DROP: [number, number] = [110, 146]; // the coral packet drops out of the icon and lands on the timeline
export const LAND = 146;
export const FG_FADE: [number, number] = [118, 138];
/**
 * Landing point on the Edit page (screenshot px): the seam under SOUNDTRACK 1
 * (A2), at the B-roll clip whose video sits on V2. Claude's coral vanishes on
 * Resolve's orange V1/A1 clips, so the action runs on the B-roll pairs: blue
 * video on V2, green audio on A2 (and the dark gaps between them).
 */
export const LAND_AT = { x: 2895, y: 2462 } as const;
/** the trace laid along the A2/A3 seam; the packet runs right along it, selecting each B-roll clip it reaches */
export const SWEEP: { t: [number, number]; x: [number, number] } = { t: [146, 198], x: [LAND_AT.x, 3600] };
export const sweepX = (f: number) => interpolate(f, SWEEP.t, SWEEP.x, { ...clamp, easing: TRAVEL });

// Real B-roll clips (outer bounds, screenshot px, measured from
// shots/bmd-resolve21-Edit-hires.png): video on V2, linked audio on A2 where
// the clip has it. Selecting a linked clip in Resolve outlines both parts.
export const V2_Y: [number, number] = [1969, 2090];
export const A2_Y: [number, number] = [2339, 2460];
export const CLIPS: { x0: number; x1: number; a2: boolean }[] = [
  { x0: 2858, x1: 2929, a2: true },
  { x0: 2962, x1: 3007, a2: false },
  { x0: 3006, x1: 3059, a2: false },
  { x0: 3059, x1: 3104, a2: false },
  { x0: 3161, x1: 3223, a2: true },
  { x0: 3270, x1: 3343, a2: true },
  { x0: 3342, x1: 3391, a2: true },
  { x0: 3442, x1: 3461, a2: true },
  { x0: 3460, x1: 3505, a2: true },
  { x0: 3504, x1: 3539, a2: true },
  { x0: 3538, x1: 3591, a2: true },
  { x0: 3718, x1: 3777, a2: false },
];
/** frame each clip is selected: the landing clip on landing, the rest when the packet reaches them */
export const SELECT_AT = CLIPS.map((c) => {
  if (c.x0 <= LAND_AT.x) return LAND + 1;
  for (let f = SWEEP.t[0]; f <= 260; f += 0.25) if (sweepX(f) >= c.x0) return f;
  return Infinity;
});

// ---------------------------------------------------------------- cameras
// Sums of overlapping travel-eased moves, so the camera is already moving on
// frame 0, never stops at a keyframe, and is still moving on the last frame.
type Move = { t: [number, number]; x?: number; y?: number; z?: number };
const sumMoves = (f: number, base: { x: number; y: number; z: number }, moves: Move[]) => {
  let { x, y, z } = base;
  for (const m of moves) {
    const k = interpolate(f, m.t, [0, 1], { ...clamp, easing: TRAVEL });
    x += (m.x ?? 0) * k;
    y += (m.y ?? 0) * k;
    z += (m.z ?? 0) * k;
  }
  return { x, y, z };
};

// FG: opens on the marks + the dialog opening (zoom <= 1.09 so the dialog's
// text stays inside the safe width), pulls back a touch as it opens, pushes in
// slowly on the list while the rows light, then dollies through the plane
// toward the landing point (front plane zooms past, 112-150).
const FG_BASE = { x: 540, y: 800, z: 1.1 };
const FG_MOVES: Move[] = [
  { t: [-20, 50], x: 6, y: 78, z: -0.1 },
  { t: [38, 114], x: 4, y: 4, z: 0.06 },
  { t: [112, 150], y: 366, z: 2.2 },
];
export const fgCam = (f: number) => {
  const c = sumMoves(f, FG_BASE, FG_MOVES);
  // ambient drift on top of the planned moves so the frame never sits still
  return { x: c.x + 2.5 * Math.sin(f / 37), y: c.y + 2 * Math.sin(f / 51), z: c.z };
};
export type Cam = ReturnType<typeof fgCam>;
export const fgToScreen = (p: { x: number; y: number }, c: Cam) => ({ x: W / 2 + (p.x - c.x) * c.z, y: H / 2 + (p.y - c.y) * c.z });

// BG: the Edit page behind the dialog (far, blurred), drifting slowly with
// parallax, then the dolly: it pulls into focus and pushes in to ~1.7x on the
// timeline (clip names read ~36px), then trucks right with the packet.
// z here is log(scale) so the push reads as an even dolly.
const BG_BASE = { x: 2960, y: 1500, z: Math.log(0.76) };
const BG_MOVES: Move[] = [
  { t: [-20, 112], x: 50, y: 100, z: Math.log(0.8 / 0.76) },
  { t: [106, 150], x: 40, y: 590, z: Math.log(1.8 / 0.8) },
  { t: [138, 214], x: 420, y: 10, z: Math.log(1.88 / 1.8) },
];
export const bgCam = (f: number) => {
  const c = sumMoves(f, BG_BASE, BG_MOVES);
  return { x: c.x, y: c.y, s: Math.exp(c.z) };
};
export type BgCam = ReturnType<typeof bgCam>;
export const bgToScreen = (p: { x: number; y: number }, c: BgCam) => ({ x: W / 2 + (p.x - c.x) * c.s, y: H / 2 + (p.y - c.y) * c.s });
/** depth of field on the back plane: soft behind the dialog, sharp once we are in */
export const bgBlur = (f: number) => interpolate(f, [106, 146], [9, 0], { ...clamp, easing: TRAVEL });
/** bright screenshot content blooms white in the tube: dimmed ~20% when sharp, more when it sits behind */
export const bgBright = (f: number) => interpolate(f, [106, 146], [0.52, 0.8], { ...clamp, easing: TRAVEL });

export const EDIT = SHOTS.edit; // 5120x2880

// CameraMotionBlur: 8 samples only on the dolly, 1 elsewhere (thin traces smear dark).
export const BLUR_WIN: [number, number][] = [[116, 140]];

// ---------------------------------------------------------------- cursor (FG world, tip)
export const cursorAt = (f: number) => {
  // tip on the button's lower right so the arrow never covers the label
  const target = { x: OK_BTN.left + OK_BTN.w * 0.8, y: OK_BTN.top + OK_BTN.h * 0.7 };
  const start = { x: 1040, y: 1640 };
  const rest = { x: target.x + 40, y: target.y + 110 };
  const legs: [number, number, { x: number; y: number }, { x: number; y: number }, number][] = [
    [CURSOR_IN, PRESS - 1, start, target, -40],
    [PRESS + 5, PRESS + 40, target, rest, 14],
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
