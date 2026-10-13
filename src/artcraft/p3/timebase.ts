import { Easing, interpolate } from "remotion";
import { COMMITS_PER_DAY, EASE, safeRect } from "../theme";

// ===========================================================================
// P3 timebase: the scope's horizontal axis is time.
// Mapping A (0-104): years 1990-2026; the timebase pulls back while the camera
// follows the sweep from the early 90s to Sep 30 2026.
// Mapping B (130+): 1990 to Sep 30 2026 squeezed into a sliver at the left,
// Sep 30 to Oct 13 2026 (14 day slots) across the rest of the safe area.
// The switch lerps every point from A to B with one eased progress.
// ===========================================================================

export const W = 1080;
export const H = 960;
export const SR = safeRect(W, H); // x 86-994, y 77-922

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const travel = Easing.bezier(...EASE.travel);
export const enter = Easing.bezier(...EASE.enter);
export const decel = Easing.bezier(...EASE.decel);

export const DAY = 1 / 365;
export const D0 = 2026 + 272 / 365; // Sep 30 2026, 00:00 (day 273 of a non-leap year)
export const NDAYS = COMMITS_PER_DAY.length; // 14 (Sep 30 .. Oct 13)

// ---- beats ----------------------------------------------------------------
export const P1 = { from: -10, to: 104 }; // the sweep across thirty years (starts before f0: mid-action)
export const SWITCH = { from: 104, to: 130 }; // timebase zoom (one soft glitch at 104)
export const RELAYOUT = { from: 98, to: 122 }; // lanes compress up, axis rises (peaks before the zoom does)
export const SWEEP3 = { from: 118, to: 168, days: 13.6 }; // the sweep across two weeks
export const GLITCH_AT = 104;

// ---- mapping A (years) ----------------------------------------------------
// The camera follows the write head: 1990 stays pinned near the left, the beam
// rides at ~70-90% of the width, and the timebase pulls back as the years pass
// (px per year falls from ~340 to ~22), so the lit history always fills the
// frame and the decades pile in from the right.
export const X1990 = 180;
const XB0 = 720; // beam x at the start of the pass
const XB1 = 988; // beam x when it reaches Sep 30 2026
const T0 = 1992.2; // beam time at f0 (Photoshop and Premiere live, After Effects just ahead)
const K1 = (XB1 - X1990) / (D0 - 1990);
export const pr1 = (f: number) => interpolate(f, [P1.from, P1.to], [0, 1], { ...clamp, easing: travel });
const xbAt = (f: number) => XB0 + (XB1 - XB0) * pr1(f);
// k(f) = exp(lerp(lnKs, lnK1, p)); solve lnKs so the beam sits at T0 on frame 0
const lnK0 = (() => {
  const k0 = (xbAt(0) - X1990) / (T0 - 1990);
  const p0 = pr1(0);
  return (Math.log(k0) - p0 * Math.log(K1)) / (1 - p0);
})();
export const kAt = (f: number) => Math.exp(lnK0 + (Math.log(K1) - lnK0) * pr1(f));
const xA = (t: number, f: number) => X1990 + (t - 1990) * kAt(f);

// ---- mapping B (sliver + days) --------------------------------------------
export const SX0 = 108; // 1990
export const SX1 = 176; // Sep 30 2026 (end of the sliver)
export const DX0 = SX1;
export const DW = (SR.right - DX0) / NDAYS; // px per day
const xB = (t: number) => (t < D0 ? SX0 + ((t - 1990) * (SX1 - SX0)) / (D0 - 1990) : DX0 + ((t - D0) / DAY) * DW);

export const sw = (f: number) => interpolate(f, [SWITCH.from, SWITCH.to], [0, 1], { ...clamp, easing: travel });
/** screen x of time t (fractional year) at frame f */
export const X = (t: number, f: number) => {
  const s = sw(f);
  const a = xA(t, f);
  return s <= 0 ? a : a + (xB(t) - a) * s;
};

// ---- the sweep (beam) -----------------------------------------------------
const tb1 = (f: number) => 1990 + (xbAt(f) - X1990) / kAt(f);
/** days since Sep 30 00:00 covered by the phase-3 sweep */
export const u3 = (f: number) => SWEEP3.days * interpolate(f, [SWEEP3.from, SWEEP3.to], [0, 1], { ...clamp, easing: travel });
/** beam time (fractional year) */
export const beamT = (f: number) => (f < SWEEP3.from ? Math.min(D0, tb1(f)) : D0 + u3(f) * DAY);

/** first frame (to 0.25f) where the beam reaches time t */
export const frameAtBeam = (t: number) => {
  for (let f = P1.from; f <= 200; f += 0.25) if (beamT(f) >= t) return f;
  return 999;
};

// ---- vertical layout --------------------------------------------------------
export const rel = (f: number) => interpolate(f, [RELAYOUT.from, RELAYOUT.to], [0, 1], { ...clamp, easing: travel });
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const LAYOUT = {
  laneY: (i: number, f: number) => mix([168, 390, 612][i], [118, 226, 334][i], rel(f)),
  adobeSize: (f: number) => mix(150, 54, rel(f)),
  axisY: (f: number) => mix(806, 470, rel(f)),
  labelGap: (f: number) => mix(30, 24, rel(f)), // axis line -> label top
  labelSize: (f: number) => mix(30, 26, rel(f)), // phone-readable (Victor, Oct 13)
};
export const TWIN_SIZE = 66;
export const CLAUDE_SIZE = 58;
export const BAR = { maxH: 112, w: 30, max: Math.max(...COMMITS_PER_DAY.map((d) => d.n)) };

// bar growth for day d (0..13), driven by the beam crossing the slot
export const barGrow = (d: number, f: number) =>
  interpolate(u3(f), [d + 0.1, d + 0.6], [0, 1], { ...clamp, easing: decel });
// GitHub's own counter: the sum of the bars drawn so far (2,012 when complete)
export const commitsShown = (f: number) =>
  Math.round(COMMITS_PER_DAY.reduce((a, d, i) => a + d.n * barGrow(i, f), 0));
