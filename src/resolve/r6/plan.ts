// ===========================================================================
// DrP6Ceo: world layout + timeline + cameras (helpers for R6 only).
//
// Two planes, composed in screen space (2.5D depth):
//   FG  (front plane, world px == screen px at zoom 1): Blackmagic's press
//       release as a dark panel (official logo, the real dateline, Grant
//       Petty's quote EXACT, his name), and above it the Claude mark sitting
//       on its scope trace.
//   BG  (back plane, in the Color press shot's own px, 3840x2160): the real
//       Resolve 21 Color page standing behind the release, soft by depth.
// The quote types out; a plain arrow drags a selection (coral) over the
// repetitive tasks; the three task names lift off and ride a coral trace up
// into the Claude mark. Then the arrow selects "focus on creative decisions"
// (green, the person's colour), a green trace runs down out of the release
// to the Color page, the camera tilts down through the front plane onto the
// page (it pulls into focus), and the same arrow grabs the Global wheel's
// puck and grades the shot: the creative part stays with the editor.
// ===========================================================================
import { Easing, interpolate } from "remotion";
import { EASE, RESOLVE, SHOTS } from "../theme";
import type { QLayout } from "./layout";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);

export const W = 1080;
export const H = 1920;
// safe area (theme safeRect): x 86-994, y 154-1690

// ---------------------------------------------------------------- the quote (exact)
export const QUOTE_TEXT = `“${RESOLVE.quote}”`;
export const DATELINE = ["IBC 2026, Amsterdam, Netherlands -", "Tuesday, September 8, 2026"] as const; // real, plain hyphen
const at = (s: string) => {
  const i = QUOTE_TEXT.indexOf(s);
  if (i < 0) throw new Error(`r6: "${s}" not in the quote`);
  return [i, i + s.length] as [number, number];
};
/** the coral selection: Petty's repetitive tasks */
export const SEL_CORAL = at("repetitive tasks such as create highlight edits, organizing media or batch rendering");
/** the three task names that lift off to Claude */
export const TASKS = [at("create highlight edits"), at("organizing media"), at("batch rendering")];
/** the green selection: what the editor keeps */
export const SEL_GREEN = at("focus on creative decisions");

// ---------------------------------------------------------------- FG world layout
export const PANEL = { left: 86, top: 415, w: 908, r: 14 } as const;
export const PAD = 44;
export const LOGO = { left: PANEL.left + PAD, top: PANEL.top + 46, w: 420, h: (420 * 52) / 150 } as const; // svg 150x52
export const RULE_Y = LOGO.top + LOGO.h + 34;
export const DATE = { top: RULE_Y + 30, font: 36, line: 48 } as const;
export const QUOTE = { left: PANEL.left + PAD, top: DATE.top + 2 * DATE.line + 34, w: PANEL.w - 2 * PAD, font: 48, line: 66, weight: 500 } as const;
export const QUOTE_LINES = 7; // measured: 7 lines at 48px in 820px (task names kept whole)
export const ATTR = { top: QUOTE.top + QUOTE_LINES * QUOTE.line + 24, font: 38, line: 50 } as const;
export const PANEL_H = ATTR.top + ATTR.line + 46 - PANEL.top;
export const PANEL_BOTTOM = PANEL.top + PANEL_H;

/** the Claude mark on its scope trace, above the release, top right (the logo holds the top left) */
export const MARK = { x: 800, y: 262, size: 150 } as const;
export const SCOPE_Y = MARK.y;

// ---------------------------------------------------------------- timeline
export const TYPE: [number, number] = [-26, 84]; // the quote types (its first line already in on f0)
export const ATTR_TYPE: [number, number] = [84, 96];
export const CUR_IN: [number, number] = [86, 100]; // the arrow comes in to "repetitive"
export const DRAG_C: [number, number] = [101, 127]; // drag-select the repetitive tasks
export const REST_C: [number, number] = [129, 150]; // the hand eases off the text
export const LIFT_AT = (i: number) => 130 + 3 * i; // the three names lift off (10f each)
export const RIDE = (i: number): [number, number] => [136 + 5 * i, 164 + 5 * i]; // up the coral trace into Claude
export const ARRIVE = [0, 1, 2].map((i) => RIDE(i)[1]);
export const TRACE_C: [number, number] = [127, 140]; // the coral trace draws out from the selection to the mark
export const TO_GREEN: [number, number] = [158, 174];
export const DRAG_G: [number, number] = [175, 187];
export const GREEN_RUN: [number, number] = [186, 208]; // a green packet runs down to the Color page
export const LAND = GREEN_RUN[1];
export const TO_PUCK: [number, number] = [190, 212];
export const PRESS_PUCK = 213;
export const GRADE: [number, number] = [214, 252]; // drag the Global puck warm (still moving on the last frame)
export const GLITCH = [ARRIVE[0], LAND];

// ---------------------------------------------------------------- cameras
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

// FG: starts close on the letterhead and the first lines (zoom <= 1.09 keeps the
// quote inside the safe width), pulls back and down as the quote fills in,
// tilts up a touch as the names ride up into Claude, then the long tilt down
// through the front plane: the release flies up out of frame.
// x stays on the text column's centre (540): at 1.09 the 820px column spans 95-985, inside the safe width
const FG_BASE = { x: 540, y: 640, z: 1.09 };
const FG_MOVES: Move[] = [
  { t: [-24, 104], y: 175, z: -0.09 },
  { t: [98, 174], y: -60, z: 0.03 },
  { t: [182, 228], y: 1760, z: 0.05 },
];
export const fgCam = (f: number) => {
  const c = sumMoves(f, FG_BASE, FG_MOVES);
  return { x: c.x + 2 * Math.sin(f / 37), y: c.y + 2 * Math.sin(f / 51), z: c.z };
};
export type Cam = ReturnType<typeof fgCam>;
export const fgToScreen = (p: { x: number; y: number }, c: Cam) => ({ x: W / 2 + (p.x - c.x) * c.z, y: H / 2 + (p.y - c.y) * c.z });
export const screenToFg = (p: { x: number; y: number }, c: Cam) => ({ x: c.x + (p.x - W / 2) / c.z, y: c.y + (p.y - H / 2) / c.z });

// BG: the Color page, far behind the release and soft, drifting with slow
// parallax; on the tilt down it comes forward into focus and pushes in on the
// viewer and the Global wheel. z is log(scale) so the push reads as an even dolly.
// It always covers the frame (scale >= 1, centre inside the margins).
export const COLOR = SHOTS.color; // 3840x2160
const BG_BASE = { x: 1660, y: 990, z: Math.log(1.0) };
const BG_MOVES: Move[] = [
  { t: [-24, 190], x: -60, y: 30, z: Math.log(1.03) },
  { t: [178, 232], x: -168, y: 150, z: Math.log(1.08 / 1.03) },
  { t: [208, 290], x: -40, y: 60, z: Math.log(1.16 / 1.08) },
];
export const bgCam = (f: number) => {
  const c = sumMoves(f, BG_BASE, BG_MOVES);
  return { x: c.x + 3 * Math.sin(f / 43), y: c.y, s: Math.exp(c.z) };
};
export type BgCam = ReturnType<typeof bgCam>;
export const bgToScreen = (p: { x: number; y: number }, c: BgCam) => ({ x: W / 2 + (p.x - c.x) * c.s, y: H / 2 + (p.y - c.y) * c.s });
/** depth of field on the back plane: soft behind the release, sharp once we are down on it */
export const bgBlur = (f: number) => interpolate(f, [184, 224], [7, 0], { ...clamp, easing: TRAVEL });
/** bright screenshot content blooms in the tube: dimmed hard while it sits behind, ~0.8 when it is the subject */
export const bgBright = (f: number) => interpolate(f, [184, 224], [0.64, 0.8], { ...clamp, easing: TRAVEL });

// 8-sample camera blur only on the tilt down; thin traces + the arrow stay out of it
export const BLUR_WIN: [number, number][] = [[188, 224]];

// ---------------------------------------------------------------- the Color page (source px, measured)
/** the viewer's picture area (the cowboy shot) */
export const VIEWER = { x: 1126, y: 252, w: 1440, h: 660 } as const;
/** the HDR Global wheel: centre (the puck's rest) and the ring */
export const GLOBAL = { x: 1250, y: 1740, rIn: 74, rOut: 96 } as const;
/** where the arrow drags the puck (toward the warm side of the ring) */
export const PUCK_TO = { dx: -44, dy: -32 } as const;
export const gradeK = (f: number) => interpolate(f, GRADE, [0, 1], { ...clamp, easing: TRAVEL });
/** the wheel's own X / Y readouts follow the puck (plain counters) */
export const XY_FIELDS = { x: { left: 1178, cx: 1213 }, y: { left: 1278, cx: 1313 }, top: 1932, w: 71, h: 35, font: 22 } as const;
export const xyAt = (f: number) => {
  const k = gradeK(f);
  return { x: ((PUCK_TO.dx * k) / GLOBAL.rIn) * 0.2, y: ((-PUCK_TO.dy * k) / GLOBAL.rIn) * 0.2 };
};
export const puckAt = (f: number) => {
  const k = gradeK(f);
  return { x: GLOBAL.x + PUCK_TO.dx * k, y: GLOBAL.y + PUCK_TO.dy * k };
};

// ---------------------------------------------------------------- text geometry (needs the measured layout)
/** world point at char index i (left edge of the char), y = the line's middle */
export const charPos = (lay: QLayout, i: number) => {
  let li = lay.lines.findIndex((l) => i >= l.start && i <= l.end);
  if (li < 0) li = lay.lines.findIndex((l) => l.start > i); // a break space: the next line's start
  if (li < 0) li = lay.lines.length - 1;
  const l = lay.lines[li];
  const k = Math.max(0, Math.min(l.text.length, i - l.start));
  return { x: QUOTE.left + l.x[k], y: QUOTE.top + li * QUOTE.line + QUOTE.line / 2, li };
};
/** the char index nearest a world point (what a drag-select lands on) */
export const charAt = (lay: QLayout, p: { x: number; y: number }) => {
  const li = Math.max(0, Math.min(lay.lines.length - 1, Math.floor((p.y - QUOTE.top) / QUOTE.line)));
  const l = lay.lines[li];
  let best = 0;
  let bd = Infinity;
  for (let k = 0; k <= l.text.length; k++) {
    const d = Math.abs(QUOTE.left + l.x[k] - p.x);
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  return l.start + best;
};
/** a phrase's box on its (first) line: world left/top/width */
export const phraseBox = (lay: QLayout, [a, b]: [number, number]) => {
  const p = charPos(lay, a);
  const l = lay.lines[p.li];
  const kb = Math.min(l.text.length, b - l.start);
  const ka = a - l.start;
  return { left: QUOTE.left + l.x[ka], top: QUOTE.top + p.li * QUOTE.line, w: l.x[kb] - l.x[ka], li: p.li };
};

// ---------------------------------------------------------------- the arrow (screen px, tip) + the selections
const mix = (a: { x: number; y: number }, b: { x: number; y: number }, k: number) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
const tk = (f: number, t: [number, number]) => interpolate(f, t, [0, 1], { ...clamp, easing: TRAVEL });

/** the arrow's tip sits a hair left of the char and a little under the line's middle */
const TIP = { dx: -3, dy: 6 };
const tipOf = (lay: QLayout, i: number) => {
  const p = charPos(lay, i);
  return { x: p.x + TIP.dx, y: p.y + TIP.dy };
};

/** drag path in world px (start char -> end char, eased) */
const dragWorld = (lay: QLayout, f: number, sel: [number, number], t: [number, number]) => mix(tipOf(lay, sel[0]), tipOf(lay, sel[1]), tk(f, t));

const ENTRY = { x: 1010, y: 1780 };

export const cursorAt = (lay: QLayout, f: number) => {
  const c = fgCam(f);
  const fg = (p: { x: number; y: number }) => fgToScreen(p, c);
  const startC = tipOf(lay, SEL_CORAL[0]);
  const endC = tipOf(lay, SEL_CORAL[1]);
  // the hand eases off beside the CEO's name, clear of the words and the names lifting off
  const restC = { x: 900, y: ATTR.top + 18 };
  const startG = tipOf(lay, SEL_GREEN[0]);
  const endG = tipOf(lay, SEL_GREEN[1]);
  let p: { x: number; y: number };
  let press = 0;
  if (f < CUR_IN[1]) {
    p = mix(ENTRY, fg(startC), tk(f, CUR_IN));
  } else if (f < DRAG_C[1] + 1) {
    p = fg(dragWorld(lay, f, SEL_CORAL, DRAG_C));
    press = 1;
  } else if (f < TO_GREEN[0]) {
    p = fg(mix(endC, restC, tk(f, REST_C)));
  } else if (f < DRAG_G[0]) {
    p = fg(mix(restC, startG, tk(f, TO_GREEN)));
  } else if (f < DRAG_G[1] + 1) {
    p = fg(dragWorld(lay, f, SEL_GREEN, DRAG_G));
    press = 1;
  } else {
    // off the text: from where the hand let go (screen) to the Global wheel's puck (on the moving page)
    const from = fgToScreen(endG, fgCam(DRAG_G[1] + 1));
    const puck = bgToScreen(puckAt(f), bgCam(f));
    const k = tk(f, TO_PUCK);
    const lift = 70 * Math.sin(Math.PI * k); // a hand moves a mouse in a slight arc
    p = { x: from.x + (puck.x - from.x) * k + lift, y: from.y + (puck.y - from.y) * k };
    press = f >= PRESS_PUCK ? 1 : 0;
  }
  const click = (t: number) => interpolate(f, [t, t + 2, t + 5], [0, 1, 0], clamp);
  return {
    ...p,
    press: Math.max(click(DRAG_C[0]), click(DRAG_G[0]), click(PRESS_PUCK)) * 0.6 + press * 0.4,
    opacity: interpolate(f, [CUR_IN[0], CUR_IN[0] + 5], [0, 1], clamp),
  };
};

/** the live selections (full-string char ranges); a new press clears the old one, like any text field */
export const selectionAt = (lay: QLayout, f: number) => {
  let coral: [number, number] | null = null;
  let green: [number, number] | null = null;
  if (f >= DRAG_C[0] && f < DRAG_G[0]) {
    const e = f >= DRAG_C[1] ? SEL_CORAL[1] : charAt(lay, dragWorld(lay, f, SEL_CORAL, DRAG_C));
    coral = [SEL_CORAL[0], Math.max(SEL_CORAL[0], e)];
  }
  if (f >= DRAG_G[0]) {
    const e = f >= DRAG_G[1] ? SEL_GREEN[1] : charAt(lay, dragWorld(lay, f, SEL_GREEN, DRAG_G));
    green = [SEL_GREEN[0], Math.max(SEL_GREEN[0], e)];
  }
  return { coral, green };
};

/** chars of the quote typed by frame f (a steady stream of keystrokes) */
export const typedAt = (f: number) => Math.floor(QUOTE_TEXT.length * interpolate(f, TYPE, [0, 1], clamp));
export const attrTypedAt = (f: number) => Math.floor(RESOLVE.quoteBy.length * interpolate(f, ATTR_TYPE, [0, 1], clamp));

/** frame the typing reaches char i */
const typeFrame = (i: number) => TYPE[0] + (i / QUOTE_TEXT.length) * (TYPE[1] - TYPE[0]);
/** the release grows a line at a time as the quote types, then once more for the name */
export const panelBottomAt = (lay: QLayout, f: number) => {
  let h = 0;
  for (const l of lay.lines) h += QUOTE.line * interpolate(f, [typeFrame(l.start) - 1, typeFrame(l.start) + 5], [0, 1], { ...clamp, easing: ENTER });
  const name = interpolate(f, [ATTR_TYPE[0] - 1, ATTR_TYPE[0] + 5], [0, 1], { ...clamp, easing: ENTER });
  return QUOTE.top + h + 40 + name * (ATTR.top + ATTR.line + 46 - (QUOTE.top + QUOTE_LINES * QUOTE.line + 40));
};
