// ===========================================================================
// AcP4OpenSource: world layout + timeline (helpers for P4 only).
// One continuous shot down a tall world (1080 wide, world px == screen px at
// zoom 1). A vertical scope trace runs down the left gutter at TRACE_X; every
// subject sits to its right with its icon ON the trace:
//   the 12 Craft repos as GitHub list rows (newest created first, so
//   photocraft, created first, is the last row) -> photocraft's row opens into
//   its repo page -> the terminal under it -> the PhotoCraft icon at the
//   bottom of the trace.
// Readable on a phone (Victor, Oct 13): everything is drawn at reading size
// (rows 34-40px, the page 34px, the clone URL 31px mono, the terminal 34px) and
// the camera stays at ~1x so the trace and its icons never leave the safe area.
// ===========================================================================
import { Easing, interpolate } from "remotion";
import { APPS, EASE, REPOS, appIcon, type AppId } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);

const hexRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

/** idle trace ink, a bit brighter than PH.trace so it survives the CRT grade */
export const TRACE_INK = "rgba(243,241,236,0.5)";
export const WHITE_RGB = "243,241,236";

// ---------------------------------------------------------------- world
export const TRACE_X = 150;
export const ICON = 104;
export const ROW = { left: 214, right: 994, h: 176, pitch: 200 } as const;
export const ROW_W = ROW.right - ROW.left; // 780

// Real list order: storytold's Craft repos sorted by created_at, newest first
// (gh api users/storytold/repos, Oct 13). All twelve are Rust + Apache-2.0.
const ORDER: AppId[] = [
  "wordcraft", // 2026-10-07 08:34
  "soundcraft", // 2026-10-07 08:31
  "deckcraft", // 2026-10-07 05:27
  "cadcraft", // 2026-10-07 05:22
  "gridcraft", // 2026-10-07 05:18
  "effectcraft", // 2026-10-01 14:24
  "designcraft", // 2026-10-01 13:13
  "lightcraft", // 2026-09-30 14:09
  "vectorcraft", // 2026-09-30 13:43
  "filmcraft", // 2026-09-30 13:41
  "pdfcraft", // 2026-09-30 13:39
  "photocraft", // 2026-09-30 13:37 (the first one)
];

export type ListRow = { id: AppId; i: number; stars: string; top: number; cy: number; rgb: string; icon: string };
export const LIST: ListRow[] = ORDER.map((id, i) => ({
  id,
  i,
  stars: REPOS.find((r) => r.name === id)!.stars,
  top: i * ROW.pitch,
  cy: i * ROW.pitch + 88,
  rgb: hexRgb(APPS.find((a) => a.id === id)!.accent),
  icon: appIcon(id),
}));
export const PC = LIST[LIST.length - 1]; // photocraft

// ---------------------------------------------------------------- repo page (photocraft's row, opened)
// Drawn at 34px (body) so it reads at camera zoom ~1 with the trace still in frame.
export const PAGE = { top: PC.top, h: 1940 } as const; // RepoPage content runs to 1906
export const PAGE_BOTTOM = PAGE.top + PAGE.h;
/** GitHub's Code dropdown, full safe width as on mobile (world px, overlays the page and the trace) */
export const DROP = { left: 86, right: 994, top: PAGE.top + 366 } as const;

// ---------------------------------------------------------------- terminal
// A window bigger than the frame (the longest line, "remote: Total ...", is 86
// cols); 34px type shows 43 columns inside the safe width. The trace runs in
// under its top edge and out of its bottom edge to the PhotoCraft icon.
export const TERM = { left: 86, right: 86 + 1640, top: PAGE_BOTTOM + 70, h: 560, pad: 26, title: 52, font: 34, line: 50 } as const;
export const TERM_BOTTOM = TERM.top + TERM.h;
export const ADV = 0.6 * TERM.font; // JetBrains Mono advance (20.4)
export const COL0 = TERM.left + TERM.pad; // world x of column 0
export const TEXT_TOP = TERM.top + TERM.title + 18;
export const END_ICON = { y: TERM_BOTTOM + 92, size: 104 } as const;

// ---------------------------------------------------------------- timeline
/** phase A packet: runs down the trace waking each row, slows onto photocraft */
export const PKT_A = { t: [-24, 108], y: [468, PC.cy] };
export const packetAY = (f: number) => interpolate(f, PKT_A.t, PKT_A.y, { ...clamp, easing: TRAVEL });

/** the page opens */
export const OPEN: [number, number] = [108, 136];
export const GLITCH = [113];

/** cursor beats */
export const CURSOR_IN = 116;
export const CLICK_CODE = 128;
export const POP_IN = 130;
export const CLICK_COPY = 144;

/** phase C: the copied URL rides the trace down into the terminal */
export const PKT_C: [number, number] = [147, 166];
export const TYPE: [number, number] = [157, 164]; // "git clone "
export const PASTE = 166;
export const ENTER_KEY = 170;
export const OUT = {
  cloning: 172,
  enumerating: 174,
  counting: [175, 177] as [number, number],
  compressing: [178, 180] as [number, number],
  receiving: [181, 193] as [number, number],
  total: 194,
  recvDone: 195,
  resolving: [196, 198] as [number, number],
  prompt: 199,
};
export const END_PKT: [number, number] = [197, 201]; // out of the terminal's bottom edge -> PhotoCraft icon
export const END_WAKE = 201;

// ---------------------------------------------------------------- camera
// One keyframe set (travel easing per segment). Keys run past both ends so the
// camera is already moving on frame 0 and still moving on the last frame.
// Zoom stays ~1: everything is drawn at reading size, and the trace gutter
// (icons from x 98) stays inside the safe area.
const FX = 546; // content (icons 98 .. panels 994) centred
const pageFY = PAGE.top + (960 - 172); // page top lands at screen y 172
const termFY = END_ICON.y - (1625 - 960); // PhotoCraft icon lands at screen y 1625
// after arriving, the camera keeps sinking slowly with the output (zoom capped at 1.01 so the icons stay in the safe area)
export const CAM_T = [-24, 106, 138, 147, 166, 206, 236];
export const CAM_X = [FX, FX, FX, FX, FX, FX, FX];
export const CAM_Y = [760, PC.cy - 420, pageFY, pageFY + 8, termFY, termFY + 22, termFY + 30];
export const CAM_Z = [1, 1, 1, 1.006, 1, 1.008, 1.01];
// orchestrator: the 8-sample whips rendered murky/dark in the MP4; 1 sample throughout
export const BLUR_WIN: [number, number][] = [];

export const camAt = (f: number) => {
  const o = { ...clamp, easing: TRAVEL };
  return { x: interpolate(f, CAM_T, CAM_X, o), y: interpolate(f, CAM_T, CAM_Y, o), z: interpolate(f, CAM_T, CAM_Z, o) };
};

// ---------------------------------------------------------------- precomputed beats
const scan = (pred: (f: number) => boolean, from = -80, to = 220) => {
  for (let f = from; f <= to; f += 0.25) if (pred(f)) return f;
  return Infinity;
};
/** frame the phase-A packet reaches each row's icon */
export const WAKE = LIST.map((r) => scan((f) => packetAY(f) >= r.cy - 0.5));
/** frame each row starts rising into place: its top reaches screen y 1720 (just under the safe bottom) */
export const ENTRY = LIST.map((r) => {
  const f = scan((t) => {
    const c = camAt(t);
    return 960 + (r.top - c.y) * c.z <= 1720;
  });
  return f <= -24 ? -Infinity : f;
});
