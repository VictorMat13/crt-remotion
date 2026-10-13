import React from "react";
import { PH } from "../theme";
import { Scope, type ScopeBump } from "../kit/Scope";
import {
  BUILD,
  CLAUDE,
  DECEL,
  DROP_X,
  ENTER,
  FEATURE_RUNS,
  ICONS,
  MIC,
  MIC_IN,
  PRESS,
  ROW,
  TRAVEL,
  WAKE,
  WIN,
  WORD_AT,
  WORD_RUN,
  c01,
  dlSpeed,
  env,
  seg,
  speech,
  type Run,
} from "./rig";

// ===========================================================================
// The scope trace (front plane, world px) and everything that rides it:
//  - phase 1: each downloading app makes its own small wave in its accent in
//    the gap beside it; the waves die as the bars stall and the row leaves
//  - phase 2: the person's voice (green) around the mic, and each spoken word
//    leaving as a green packet that runs right to the Claude mark
//  - phase 3: Claude's voice (coral); the build packet and one packet per
//    feature run right and turn down the hairline drop into the app window;
//    the person's last ask (Export PNG) rides the same line in green
// ===========================================================================

export const TRACE_INK = "rgba(243,241,236,0.52)";
const WHITE = "243,241,236";

const rgbOf = (r: Run) => (r.rgb === "claude" ? PH.claudeRgb : PH.userRgb);

/** where a run's packet is at frame f: along the line (x), then down the drop (y) */
const runAt = (r: Run, f: number) => {
  const u = seg(f, r.run[0], r.run[1], r === BUILD ? TRAVEL : DECEL);
  const v = seg(f, r.down[0], r.down[1], DECEL);
  return {
    x: r.from + 60 + (DROP_X - r.from - 60) * u,
    onLine: env(f, r.run[0], r.run[1] + 1, 2, 3),
    y: WIN.top * v,
    onDrop: f >= r.down[0] - 1 && f <= r.down[1] + 2 ? env(f, r.down[0] - 1, r.down[1] + 2, 1, 3) : 0,
  };
};
const RUNS: Run[] = [BUILD, ...FEATURE_RUNS];

export const claudeTalk = (f: number) => {
  const wake = seg(f, WAKE, WAKE + 8, ENTER);
  const talk = 0.5 + 0.5 * Math.sin(f * 0.23);
  // talks hard while it starts the build, then keeps a working murmur; each feature it sends is a burst
  const burst = FEATURE_RUNS.filter((r) => r.rgb === "claude").reduce((a, r) => Math.max(a, env(f, r.run[0] - 4, r.run[0] + 6, 3, 6)), 0);
  const level = 1 - 0.6 * seg(f, 190, 214, DECEL);
  return wake * (level * (0.55 + 0.45 * talk) + 0.5 * burst);
};

export const traceBumps = (f: number): ScopeBump[] => {
  const b: ScopeBump[] = [];
  // phase 1: download activity in the gap to the right of each icon
  const leave = 1 - seg(f, 36, 74, DECEL);
  if (leave > 0.01) {
    for (const ic of ICONS) {
      const a = 30 * dlSpeed(ic.i, f) * leave * (0.7 + 0.3 * Math.sin(f * 0.21 + ic.i * 1.3));
      if (a > 0.4) b.push({ x: ic.home.x + ROW.sp / 2, amp: a, sigma: 26, rgb: ic.rgb });
    }
  }
  // phase 2: the person talking, and each word riding the line to Claude
  const micOn = c01((f - MIC_IN) / 10);
  if (micOn > 0) b.push({ x: MIC.x + 30, amp: 2 + 36 * speech(f), sigma: 80, rgb: PH.userRgb });
  WORD_AT.forEach((a) => {
    const k = env(f, a, a + WORD_RUN, 2, 3);
    if (k <= 0.01) return;
    const u = seg(f, a, a + WORD_RUN, DECEL);
    b.push({ x: MIC.x + 90 + (CLAUDE.x - 70 - MIC.x - 90) * u, amp: 22 * k, sigma: 34, rgb: PH.userRgb });
  });
  // phase 3: Claude's voice, then the packets
  const ct = claudeTalk(f);
  if (ct > 0.01) b.push({ x: CLAUDE.x, amp: 30 * ct, sigma: 92, rgb: PH.claudeRgb });
  for (const r of RUNS) {
    const p = runAt(r, f);
    if (p.onLine > 0.01) b.push({ x: p.x, amp: 24 * p.onLine, sigma: 40, rgb: rgbOf(r) });
    // the junction answers as the packet turns down into the window
    const j = env(f, r.down[0] - 2, r.down[0] + 10, 2, 8);
    if (j > 0.01) b.push({ x: DROP_X, amp: 14 * j, sigma: 46, rgb: rgbOf(r) });
  }
  // the person clicks Export PNG: a green blip where the app hangs off the line
  const click = env(f, PRESS, PRESS + 22, 2, 18);
  if (click > 0.01) b.push({ x: DROP_X, amp: 18 * click, sigma: 40, rgb: PH.userRgb });
  return b;
};

/** the scope's graticule: the grid on the tube face the trace is drawn on (front plane, behind everything) */
const GRID: { step: number; x0: number; x1: number; y0: number; y1: number } = { step: 120, x0: -1560, x1: 3360, y0: -960, y1: 1320 };
const GRID_D = (() => {
  const d: string[] = [];
  for (let x = GRID.x0; x <= GRID.x1; x += GRID.step) d.push(`M${x} ${GRID.y0}V${GRID.y1}`);
  for (let y = GRID.y0; y <= GRID.y1; y += GRID.step) if (y !== 0) d.push(`M${GRID.x0} ${y}H${GRID.x1}`);
  return d.join("");
})();
export const Graticule: React.FC = () => (
  <svg
    width={GRID.x1 - GRID.x0}
    height={GRID.y1 - GRID.y0}
    viewBox={`${GRID.x0} ${GRID.y0} ${GRID.x1 - GRID.x0} ${GRID.y1 - GRID.y0}`}
    style={{ position: "absolute", left: GRID.x0, top: GRID.y0 }}
  >
    <path d={GRID_D} stroke="rgba(233,231,226,0.26)" strokeWidth={2} fill="none" />
  </svg>
);

/** a soft ring that grows off a mark when it wakes */
const Ripple: React.FC<{ x: number; r0: number; at: number; f: number; rgb: string }> = ({ x, r0, at, f, rgb }) => {
  const t = (f - at) / 26;
  if (t < 0 || t > 1) return null;
  return <circle cx={x} cy={0} r={r0 + 64 * DECEL(t)} fill="none" stroke={`rgba(${rgb},${(0.55 * (1 - t)).toFixed(3)})`} strokeWidth={3} />;
};

export const Trace: React.FC<{ f: number; x0: number; x1: number }> = ({ f, x0, x1 }) => {
  // the hairline drop from the line into the window's sidebar
  const drop = seg(f, BUILD.down[0] - 7, BUILD.down[1] + 1, DECEL);
  const top = -260;
  const h = WIN.top + 360;
  return (
    <svg
      width={x1 - x0}
      height={h}
      viewBox={`${x0} ${top} ${x1 - x0} ${h}`}
      style={{ position: "absolute", left: x0, top, overflow: "visible" }}
    >
      <Scope frame={f} x0={x0} x1={x1} y={0} bumps={traceBumps(f)} hum={1.4} stroke={3} color={TRACE_INK} />
      <Ripple x={CLAUDE.x} r0={CLAUDE.size * 0.5} at={WAKE} f={f} rgb={PH.claudeRgb} />
      <Ripple x={MIC.x} r0={MIC.size * 0.36} at={WORD_AT[0] - 2} f={f} rgb={PH.userRgb} />
      {drop > 0.001 ? (
        <line x1={DROP_X} y1={0} x2={DROP_X} y2={WIN.top * drop} stroke={TRACE_INK} strokeWidth={3} strokeLinecap="round" />
      ) : null}
      {RUNS.map((r, i) => {
        const p = runAt(r, f);
        if (p.onDrop <= 0.01) return null;
        const rgb = rgbOf(r);
        const tail = Math.max(0, p.y - 70);
        return (
          <g key={i} opacity={p.onDrop}>
            <defs>
              <linearGradient id={`p7drop${i}`} gradientUnits="userSpaceOnUse" x1={DROP_X} y1={tail} x2={DROP_X} y2={p.y}>
                <stop offset="0%" stopColor={`rgba(${rgb},0)`} />
                <stop offset="100%" stopColor={`rgba(${rgb},1)`} />
              </linearGradient>
            </defs>
            <line x1={DROP_X} y1={tail} x2={DROP_X} y2={p.y} stroke={`url(#p7drop${i})`} strokeWidth={4} strokeLinecap="round" />
            <circle cx={DROP_X} cy={p.y} r={11} fill={`rgba(${rgb},0.18)`} />
            <circle cx={DROP_X} cy={p.y} r={5} fill={`rgb(${WHITE})`} />
          </g>
        );
      })}
    </svg>
  );
};

