// ===========================================================================
// MtP4Skill plan: world layout, timeline, cameras and the STYLE.md text.
// Pure math (Easing + EASE only).
//
// Outer world = 1080x1920 (world px == screen px at zoom 1). Top half: the
// real STYLE.md open in a dark editor (the T3 SkillCard language, now big).
// Bottom half: a 9:8 sample screen. Its scene is built from real ArtCraft
// material (the Claude mark and the PhotoCraft icon on one wire, the real
// storytold/photocraft repo row under them) and starts raw: gray ground,
// white card, plain hairline, no tube. Each STYLE.md line is selected in
// turn and, as the selection lands, that line becomes part of the sample:
//   1 Black screen       the gray ground crushes to black
//   2 Phosphor halation  the tube glow comes on
//   3 Tube surface       grille, interlaced scanlines, grain, refresh band
//   4 Convergence error  the red and blue channels split
//   7 Oscilloscope trace the hairline comes alive as the scope trace
//   8 Dark UI panels     the white card turns dark and its text reads
// The sample's own camera films the tube, so pushing in shows the scanlines
// and the channel split up close.
// ===========================================================================
import { Easing } from "remotion";
import { EASE, SKILL_LINES } from "../theme";

export const DUR = 240;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
/** eased 0 -> 1 between frames a and b */
export const seg = (f: number, a: number, b: number, ease: (n: number) => number = TRAVEL) => ease(c01((f - a) / (b - a)));

// ---------------------------------------------------------------- outer world
// Safe rect (9:16): x 86..994, y 154..1690. The pair spans y 176..1655 and
// x 104..976 at zoom 1; the camera pushes 0.985 -> 1.03 and stays inside it.
export const ED = { left: 104, top: 176, w: 872, h: 676, header: 76 } as const;
export const SAMPLE = { left: 104, top: 880, w: 872, h: 775 } as const; // 9:8
export const S = SAMPLE.w / 1080; // sample world -> outer px at sample zoom 1

// ---------------------------------------------------------------- editor text
// Body: JetBrains Mono 36px (one size, like a real editor), soft wrap at 39
// columns. Each rule is its title plus its first sentence (2-3 rows, item 3
// keeps its full first sentence: 4 rows).
export const BODY = { font: 36, line: 50, track: -0.6, padX: 30, padTop: 14, cols: 39 } as const;
export const ADV = 0.6 * BODY.font + BODY.track; // 21.0

const firstSentence = (line: string) => {
  const m = line.match(/^(\d+\. \*\*[^*]+\*\* )(.*)$/);
  if (!m) return line;
  const end = m[2].search(/\.(\s|$)/);
  return m[1] + (end >= 0 ? m[2].slice(0, end + 1) : m[2]);
};

/** greedy word wrap at `cols` monospace columns (non-breaking spaces hold a unit together) */
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
  return out.map((r) => r.replace(/\u00a0/g, " "));
};

// the radii stay on one row
const keepUnits = (s: string) => s.replace("(3 / 14 / 42 px),", "(3\u00a0/\u00a014\u00a0/\u00a042\u00a0px),");

export type Kind = "head" | "rule" | "bullet" | "blank";
export type DocLine = { kind: Kind; rows: string[]; item?: number };

// SKILL_LINES: 0 "# CRT Scope style", 1 "## The look", 2..7 rules 1,2,3,4,7,8,
// 8 "## Motion rules ...", 9.. bullets.
export const RULES = [2, 3, 4, 5, 6, 7].map((i) => keepUnits(firstSentence(SKILL_LINES[i])));
export const DOC: DocLine[] = [
  { kind: "head", rows: [SKILL_LINES[0]] },
  { kind: "blank", rows: [""] },
  { kind: "head", rows: [SKILL_LINES[1]] },
  { kind: "blank", rows: [""] },
  ...RULES.map((r, k) => ({ kind: "rule" as const, rows: wrap(r, BODY.cols), item: k })),
  { kind: "blank", rows: [""] },
  { kind: "head", rows: wrap(SKILL_LINES[8], BODY.cols) },
  { kind: "blank", rows: [""] },
  ...SKILL_LINES.slice(9).map((l) => ({ kind: "bullet" as const, rows: wrap(l, BODY.cols) })),
];
/** first row index of every doc line */
export const ROW0: number[] = (() => {
  const out: number[] = [];
  let r = 0;
  for (const d of DOC) {
    out.push(r);
    r += d.rows.length;
  }
  return out;
})();
export const TOTAL_ROWS = DOC.reduce((a, d) => a + d.rows.length, 0);
export const itemRow0 = (k: number) => ROW0[DOC.findIndex((d) => d.item === k)];
export const itemRows = (k: number) => DOC.find((d) => d.item === k)!.rows;

// ---------------------------------------------------------------- timeline
// VO: "A skill is simply a template instruction sheet you give the AI that lists
// things like the font choice, colors, background, and style that you want for
// each video." One rule every 36 frames; the part opens mid-selection.
export const ITEM_AT = [0, 36, 70, 104, 138, 174];
export const SEL_ROW = 9; // frames to sweep one row
export const SEL_STAGGER = 3;
/** the rule lands in the sample: [start, end] */
export const APPLY: [number, number][] = ITEM_AT.map((t) => [t + 11, t + 31]);
APPLY[3] = [113, 133]; // convergence: lands while the camera pushes into the icon
APPLY[4] = [148, 174]; // trace: the beam sweeps across (camera pulls back wide)
APPLY[5] = [185, 205]; // dark panel: wipes down the card

export const activeAt = (f: number) => {
  let k = 0;
  ITEM_AT.forEach((t, i) => {
    if (f >= t) k = i;
  });
  return k;
};

/** the editor keeps the active rule's first row on body row FOCUS */
export const FOCUS = 4;
export const scrollAt = (f: number) => {
  let s = 0;
  for (let k = 1; k < ITEM_AT.length; k++) {
    const d = itemRow0(k) - itemRow0(k - 1);
    s += d * seg(f, ITEM_AT[k] - 8, ITEM_AT[k] + 12, TRAVEL);
  }
  s += itemRow0(0) - FOCUS;
  // after the last rule the file keeps drifting down to the motion rules
  s += 1.4 * seg(f, 196, 300, TRAVEL);
  return s;
};

// ---------------------------------------------------------------- outer camera
// A slow continuous push (keys outside the part, so it never stops) + sway.
const OZ: [number, number] = [0.9807, 1.0322];
const OT: [number, number] = [-120, 330];
export const outerCam = (f: number) => {
  const z = OZ[0] + (OZ[1] - OZ[0]) * seg(f, OT[0], OT[1], TRAVEL);
  // keep the pair centred in the safe area (y 154..1690, centre 922)
  const mid = (ED.top + SAMPLE.top + SAMPLE.h) / 2;
  return {
    x: 540 + 3 * Math.sin(f / 40),
    y: mid + (960 - 922) / z + 2 * Math.sin(f / 53),
    z,
  };
};

// ---------------------------------------------------------------- sample world (1080x960)
export const WIRE_Y = 250;
export const MARK = { x: 236, size: 180 } as const; // Claude mark on the wire
export const ICON = { x: 838, size: 230 } as const; // PhotoCraft icon on the wire
export const CARD = { left: 100, top: 452, w: 880, h: 384 } as const; // storytold/photocraft row
export const PULSE = { from: MARK.x + 112, to: ICON.x - 128, len: 22, every: 30, first: -18 } as const;
export const pulseStarts = () => {
  const out: number[] = [];
  for (let t = PULSE.first; t < DUR + 30; t += PULSE.every) out.push(t);
  return out;
};

// sample camera: overlapping eased moves (never at rest), world centre + zoom
type Move = { t: [number, number]; x: number; y: number; z: number };
const CAM0 = { x: 540, y: 500, z: 1.04 };
const MOVES: Move[] = [
  { t: [-30, 36], x: 548, y: 452, z: 1.12 }, // 1 black screen: settle on the whole scene
  { t: [26, 70], x: 538, y: 318, z: 1.24 }, // 2 halation: in on the two marks on the wire (both whole)
  { t: [62, 104], x: 806, y: 290, z: 1.95 }, // 3 tube surface: close on the PhotoCraft icon
  { t: [96, 138], x: 812, y: 258, z: 2.3 }, // 4 convergence: keep pushing into its white engraving
  { t: [126, 178], x: 540, y: 300, z: 1.12 }, // 7 trace: pull back wide as the beam sweeps the whole line
  { t: [164, 198], x: 540, y: 545, z: 1.16 }, // 8 dark panels: down to the card, the whole scene in frame
  { t: [198, 262], x: 540, y: 470, z: 1.07 }, // the finished look, drifting out
];
export const sampleCam = (f: number) => {
  // zoom moves in log space, so a big pull-back reads at an even rate
  let x = CAM0.x;
  let y = CAM0.y;
  let lz = Math.log(CAM0.z);
  let px = CAM0.x;
  let py = CAM0.y;
  let plz = Math.log(CAM0.z);
  for (const m of MOVES) {
    const k = seg(f, m.t[0], m.t[1], TRAVEL);
    x += (m.x - px) * k;
    y += (m.y - py) * k;
    lz += (Math.log(m.z) - plz) * k;
    px = m.x;
    py = m.y;
    plz = Math.log(m.z);
  }
  return { x: x + 4 * Math.sin(f / 37), y: y + 3 * Math.sin(f / 47 + 1), z: Math.exp(lz) };
};

// the tube in the sample is a magnified CRT: its surface, split and glow are
// drawn at 1.5x the STYLE.md numbers in sample-world px
export const TUBE = { scale: 1.5, pitch: 7, halation: [3, 14, 42], convergence: 1.6 } as const;
