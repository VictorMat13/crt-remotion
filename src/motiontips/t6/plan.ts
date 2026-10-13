// ===========================================================================
// MtP6Direction plan: layout, timeline and both cameras. Pure math (Easing +
// EASE only) so the framing can be checked numerically.
//
// Outer world = 1080x1920 (world px == screen px at zoom 1). Top: Victor's
// Claude Code terminal (the T2 look). Below it, a framed viewport: the video
// Claude is making, filmed by its own camera (the inner camera).
//
// Inner world, origin on the scope trace (y = 0, y down):
//   - the T5 mosaic of real UI cards (crops of real app screenshots) in two
//     rows above and below the trace, running the whole length of the world;
//   - the hero card ON the trace at x 0: the PhotoCraft "The Great Wave" card;
//   - further along the trace (x 2320..), a real audio clip on the line: the
//     RMS + peak envelope of public/motiontips/t6/worried-finance.mp3 (copied
//     from public/fishos/voice), with its three real pauses.
// Beats:
//   0-62    "Make me a well-edited video" is typed, sits, then is deleted word
//           by word (option+delete). The video below is the T5 problem: the
//           cards sit still, the camera only creeps.
//   67-98   "track this object as it moves" is typed; Enter.
//   99-178  Claude's coral packet runs to the card, selects it, and the card
//           glides 1600 px along the trace; the camera tracks it (a few frames
//           behind) while the mosaic streams past.
//   124-166 "cut out the awkward pauses in this segment" is typed (queued while
//           Claude works); Enter.
//   164-240 the camera leaves the card and travels on to the audio clip; coral
//           blades land on the edges of the three pauses (silence measured with
//           ffmpeg silencedetect at -40 dB, 30 ms handles kept), the pauses drop
//           out, and the speech pieces ripple left, gap by gap, until they butt.
//           The camera follows the shrinking clip and pushes in; still moving
//           on the last frame.
// ===========================================================================
import { Easing } from "remotion";
import { BAD_PROMPT, EASE, MOVE_PROMPTS } from "../theme";

export const DUR = 240;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
/** eased 0 -> 1 between frames a and b */
export const seg = (f: number, a: number, b: number, ease: (n: number) => number = TRAVEL) => ease(c01((f - a) / (b - a)));
/** eased 0 -> 1 -> 0 between a and b */
export const hump = (f: number, a: number, b: number) => {
  const m = (a + b) / 2;
  return seg(f, a, m) - seg(f, m, b);
};

// ---------------------------------------------------------------- prompts (in-world text Victor types)
export const P0 = BAD_PROMPT; // "Make me a well-edited video"
export const P1 = MOVE_PROMPTS[0]; // "track this object as it moves"
export const P2 = "cut out the awkward pauses in this segment"; // the script's second example

const rnd = (i: number, s: number) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
/** the frame each character lands, typed across [t0, t1] with an uneven human rhythm */
const typeSpan = (text: string, t0: number, t1: number, seed: number): number[] => {
  const inc = [...text].map((ch, i) => (0.55 + 0.9 * rnd(i, seed)) * (ch === " " ? 1.6 : 1));
  const tot = inc.slice(0, -1).reduce((a, b) => a + b, 0);
  let t = t0;
  return inc.map((d) => {
    const at = t;
    t += (d / tot) * (t1 - t0);
    return at;
  });
};
export const T_P0 = typeSpan(P0, -16, 20, 1); // opens mid-typing
/** option+delete, word by word: [frame, length left] */
export const DEL_P0: [number, number][] = [
  [50, 22], // "Make me a well-edited "
  [53, 15], // "Make me a well-"
  [56, 10], // "Make me a "
  [58, 8], // "Make me "
  [60, 5], // "Make "
  [62, 0],
];
export const T_P1 = typeSpan(P1, 67, 94, 2);
export const ENTER1 = 98;
export const T_P2 = typeSpan(P2, 124, 161, 3);
export const ENTER2 = 166;

const typed = (times: number[], f: number) => times.filter((t) => f >= t).length;
/** the first input box: the bad prompt, deleted, then the real direction */
export const input0 = (f: number) => {
  if (f < DEL_P0[0][0]) return P0.slice(0, typed(T_P0, f));
  if (f < T_P1[0]) {
    let n = P0.length;
    for (const [t, len] of DEL_P0) if (f >= t) n = len;
    return P0.slice(0, n);
  }
  return P1.slice(0, typed(T_P1, f));
};
export const inputB = (f: number) => P2.slice(0, typed(T_P2, f));
const KEYS = [...T_P0, ...DEL_P0.map(([t]) => t), ...T_P1, ENTER1, ...T_P2, ENTER2].sort((a, b) => a - b);
/** frames since the last keystroke (caret stays solid while typing) */
export const sinceKey = (f: number) => {
  let last = -999;
  for (const k of KEYS) if (k <= f) last = k;
  return f - last;
};

// ---------------------------------------------------------------- outer world
// Safe rect (9:16): x 86..994, y 154..1690. The pair spans x 104..976,
// y 176..1656 at zoom 1; the outer camera pushes 0.985 -> 1.02 and stays inside.
export const OUT_C = { x: 540, y: 916 } as const;
export const TERM = { left: 104, right: 976, top: 176, bottom: 740, tab: 62, padX: 32, padY: 16, font: 38, line: 52 } as const;
export const ADV = 0.6 * TERM.font; // JetBrains Mono advance (22.8)
export const COLS = 35; // 35 x 22.8 = 798 px of the 808 inner
export const BODY = { top: TERM.top + TERM.tab + TERM.padY, bottom: TERM.bottom - TERM.padY } as const;
export const VIEW_H = BODY.bottom - BODY.top; // 470
export const VP = { left: 104, top: 772, w: 872, h: 884 } as const;

export const outerCam = (f: number) => ({
  x: OUT_C.x + 2 * Math.sin(f / 41),
  y: OUT_C.y + 3 * Math.sin(f / 37),
  z: 0.985 + 0.035 * seg(f, -60, 300),
});

// ---------------------------------------------------------------- inner world
export const T6 = "motiontips/t6/";
export const HERO = { src: `${T6}c2-photocraft.jpg`, w: 358, h: 420, dist: 1600, t: [103, 172] as [number, number], dim: 0.58 } as const;
export const heroX = (f: number) => HERO.dist * seg(f, HERO.t[0], HERO.t[1]);
/** Claude's coral selection on the card while it moves it */
export const heroSel = (f: number) => seg(f, 105, 110, ENTER) * (1 - seg(f, 168, 178, DECEL));

/** T5's real UI cards (crops of real app screenshots, 704 px tall) */
const BG = [
  { id: "a-resolve-edit", w: 1040 },
  { id: "c-vectorcraft", w: 600 },
  { id: "b2-resolve-color", w: 728 },
  { id: "d2-filmcraft", w: 600 },
  { id: "e-soundcraft", w: 520 },
  { id: "a2-filmcolor", w: 1040 },
  { id: "b-cadcraft", w: 728 },
  { id: "d-lightcraft", w: 600 },
  { id: "e2-resolve-cut", w: 520 },
] as const;
export const ROW = { h: 352, gap: 26, inner: 272 } as const; // rows sit at y -624..-272 and 272..624
export type BgCard = { src: string; x: number; y: number; w: number; h: number };
const buildRow = (order: number[], x0: number, x1: number, y: number): BgCard[] => {
  const out: BgCard[] = [];
  let x = x0;
  for (let i = 0; x < x1; i++) {
    const im = BG[order[i % order.length]];
    const w = Math.round((im.w * ROW.h) / 704);
    out.push({ src: `${T6}${im.id}.jpg`, x, y, w, h: ROW.h });
    x += w + ROW.gap;
  }
  return out;
};
export const BG_CARDS: BgCard[] = [
  ...buildRow([0, 1, 2, 3, 4, 5, 6, 7, 8], -1500, 4300, -ROW.inner - ROW.h),
  ...buildRow([7, 8, 5, 6, 0, 3, 2, 1, 4], -1690, 4300, ROW.inner),
];
/** the mosaic sits back while the audio is cut */
export const bgDim = (f: number) => 0.52 - 0.14 * seg(f, 168, 200);

/** a deeper row behind the trace plane (parallax 0.8, smaller, dimmer): fills the band beside the card */
export const DEEP = { k: 0.8, s: 0.82, h: 440 } as const;
export const DEEP_CARDS: BgCard[] = buildRow([5, 2, 8, 0, 6, 1, 3, 7, 4], -1700, 3400, -DEEP.h / 2).map((c) => ({ ...c, h: DEEP.h, w: Math.round((c.w * DEEP.h) / ROW.h) }));
export const deepDim = (f: number) => 0.4 * (1 - seg(f, 166, 194));

// ---------------------------------------------------------------- the audio clip
// Real silences (ffmpeg silencedetect, -40 dB, d 0.15): 0.680-1.063, 2.050-2.755,
// 3.588-4.356, 5.727-end. The clip runs to 5.80 s; each pause is cut with 30 ms
// handles left on the speech either side.
export const CLIP = {
  src: `${T6}worried-finance.mp3`,
  name: "worried-finance.mp3",
  x0: 2320,
  pps: 210, // world px per second
  dur: 5.8,
  top: -252,
  header: 64,
  bottom: 188,
  wh: 172, // waveform half height (centred on the trace)
} as const;
export const CLIP_W = CLIP.dur * CLIP.pps; // 1218
export const CUTS: [number, number][] = [
  [0.71, 1.03],
  [2.08, 2.725],
  [3.62, 4.33],
];
export const PIECES: [number, number][] = [
  [0, CUTS[0][0]],
  [CUTS[0][1], CUTS[1][0]],
  [CUTS[1][1], CUTS[2][0]],
  [CUTS[2][1], CLIP.dur],
];
export const tx = (t: number) => CLIP.x0 + t * CLIP.pps;
export const gapW = (j: number) => (CUTS[j][1] - CUTS[j][0]) * CLIP.pps;
export const REMOVED = CUTS.reduce((a, _, j) => a + gapW(j), 0); // 351.75

/** blades land 2f apart, edge by edge, left to right */
export const BLADE_AT = 186;
export const bladeIn = (i: number, f: number) => seg(f, BLADE_AT + 2 * i, BLADE_AT + 2 * i + 6, ENTER);
/** the pause pieces drop out */
export const pauseOut = (j: number, f: number) => seg(f, 192 + 3 * j, 203 + 3 * j, DECEL);
/** ripple: gap j closes, everything after it moves left */
export const RIPPLE = { t0: 198, step: 6, len: 18 } as const;
export const closeK = (j: number, f: number) => seg(f, RIPPLE.t0 + j * RIPPLE.step, RIPPLE.t0 + j * RIPPLE.step + RIPPLE.len);
/** shift of speech piece k (pause piece j rides with speech piece j) */
export const pieceShift = (k: number, f: number) => {
  let s = 0;
  for (let j = 0; j < k; j++) s -= gapW(j) * closeK(j, f);
  return s;
};
export const clipRight = (f: number) => CLIP.x0 + CLIP_W + pieceShift(3, f);
/** the seams settle once their gap has closed */
export const seamFade = (j: number, f: number) => 1 - 0.55 * seg(f, RIPPLE.t0 + j * RIPPLE.step + RIPPLE.len - 2, RIPPLE.t0 + j * RIPPLE.step + RIPPLE.len + 10, DECEL);

// ---------------------------------------------------------------- inner camera
// Focal point (inner world px) lands on the viewport centre; z = screen px per world px.
const CLIP_C0 = CLIP.x0 + CLIP_W / 2; // 2929
export const innerCam = (f: number) => {
  const creepX = -130 + 260 * seg(f, -120, 160); // the camera only creeps (T5's problem), already moving on f0
  const track = HERO.dist * seg(f, 105, 175); // follows the card, a couple of frames behind it
  const toClip = (CLIP_C0 - (130 + HERO.dist)) * seg(f, 164, 202);
  const follow = -(REMOVED / 2) * seg(f, 198, 236); // the clip's centre moves left as it tightens
  const lz =
    Math.log(0.96) +
    Math.log(1.1 / 0.96) * seg(f, -120, 160) -
    0.18 * hump(f, 104, 182) +
    Math.log(0.66 / 1.1) * seg(f, 164, 202) +
    Math.log(1.06 / 0.66) * seg(f, 198, 270); // still pushing on the last frame
  return {
    x: creepX + track + toClip + follow + 5 * Math.sin(f / 23),
    y: -30 * seg(f, 164, 202) + 4 * Math.sin(f / 31),
    z: Math.exp(lz),
  };
};
export type Cam = ReturnType<typeof innerCam>;
/** the inner world rect the viewport shows */
export const viewRect = (c: Cam) => ({ x0: c.x - VP.w / 2 / c.z, x1: c.x + VP.w / 2 / c.z, y0: c.y - VP.h / 2 / c.z, y1: c.y + VP.h / 2 / c.z });

/** 8-sample camera blur only on the big moves (the track and the travel to the clip) */
export const BLUR_WIN: [number, number][] = [[102, 206]];
export const GLITCH = [ENTER1 + 1, BLADE_AT];
