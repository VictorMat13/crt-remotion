import React from "react";
import { interpolate } from "remotion";
import { PH } from "../theme";
import {
  COMP,
  COMP_CLOSE,
  DECEL,
  H,
  HEAD_X,
  MARK,
  PANEL_BOTTOM,
  PICK,
  HEAD_OFF,
  RULER,
  RUN,
  SCRUB_OFF,
  SEND,
  STRIP,
  STRIP_H,
  T0_X,
  TRACE_INK,
  TRAVEL,
  TY,
  TYPE,
  W,
  WAKE,
  ZPS,
  appBright,
  camAt,
  clamp,
  playAt,
  toScreen,
} from "./plan";

// ===========================================================================
// Screen-space layer, outside the camera blur (thin lines smear dark under an
// 8-sample blur): the scope trace with its voices and packets, Claude's scan
// head on the strip, and Resolve's playhead on the timeline. Positions come
// from the same camera as the world, at the integer frame.
//   green  = the person (typing, then the prompt packet into Claude's mark)
//   coral  = Claude (wakes, talks, runs into the app, scans the source)
// ===========================================================================

type Bump = { x: number; amp: number; sigma: number; rgb: string };
const gauss = (x: number, c: number, s: number) => Math.exp(-((x - c) ** 2) / (2 * s * s));
const coral = PH.claudeRgb;
const green = PH.userRgb;

const bumpsAt = (f: number): Bump[] => {
  const b: Bump[] = [];
  // the person types: a small green voice at the composer's exit
  const typing = interpolate(f, [TYPE[1] - 2, TYPE[1] + 10], [1, 0.45], clamp) * interpolate(f, [SEND, SEND + 10], [1, 0], clamp);
  if (typing > 0.01) b.push({ x: COMP.left + COMP.w + 34, amp: typing * (11 + 5 * Math.sin(f * 0.61) + 3 * Math.sin(f * 1.37)), sigma: 20, rgb: green });
  // send: the prompt runs into Claude's mark
  if (f >= SEND - 1 && f <= WAKE + 2) {
    const u = interpolate(f, [SEND, WAKE], [0, 1], { ...clamp, easing: TRAVEL });
    const env = interpolate(f, [SEND - 1, SEND + 1, WAKE - 1, WAKE + 2], [0, 1, 1, 0], clamp);
    b.push({ x: COMP.left + COMP.w + 10 + (MARK.x - MARK.size / 2 - COMP.left - COMP.w - 4) * u, amp: 20 * env, sigma: 18, rgb: green });
  }
  // Claude talks at its mark from the moment it wakes
  const wake = interpolate(f, [WAKE, WAKE + 6], [0, 1], clamp);
  if (wake > 0.01) {
    const speak = 1 + 0.9 * interpolate(f, [WAKE, WAKE + 4, WAKE + 26], [0, 1, 0], clamp);
    b.push({ x: MARK.x, amp: wake * speak * (12 + 5 * Math.sin(f * 0.23) + 3 * Math.sin(f * 0.53)), sigma: 70, rgb: coral });
  }
  // Claude's packets run the trace into the app
  const packets: [number, number, number][] = [
    [RUN[0], RUN[1], 28],
    [RUN[0] + 9, RUN[1] + 6, 18],
  ];
  for (const [t0, t1, a] of packets) {
    if (f < t0 || f > t1 + 3) continue;
    const u = interpolate(f, [t0, t1], [0, 1], { ...clamp, easing: TRAVEL });
    const env = interpolate(f, [t0, t0 + 4, t1 - 2, t1 + 3], [0, 1, 1, 0], clamp);
    b.push({ x: MARK.x + MARK.size / 2 + (HEAD_X - MARK.x - MARK.size / 2) * u, amp: a * env, sigma: 46, rgb: coral });
  }
  // the scan head: Claude keeps talking while it scrubs, speaks up on every best moment
  const on = interpolate(f, [RUN[1] - 4, RUN[1] + 2], [0, 1], clamp);
  if (on > 0.01) {
    let a = 15 + 6 * Math.sin(f * 0.37) + 3 * Math.sin(f * 0.91);
    for (const p of PICK) a += 16 * interpolate(f, [p - 3, p, p + 9], [0, 1, 0], clamp);
    const calm = interpolate(f, [SCRUB_OFF[0], SCRUB_OFF[1] + 10], [1, 0.4], { ...clamp, easing: DECEL });
    b.push({ x: HEAD_X, amp: on * calm * a, sigma: 54, rgb: coral });
  }
  return b;
};

export const Overlay: React.FC<{ frame: number }> = ({ frame: f }) => {
  const c = camAt(f);
  const bumps = bumpsAt(f);
  const s = c.s;
  const ys = toScreen({ x: 0, y: TY }, c).y;

  // world x range on screen, minus what the composer and the mark cover
  const wx0 = c.x - (W / 2 + 40) / s;
  const wx1 = c.x + (W / 2 + 40) / s;
  // the trace runs behind the composer until it closes
  const gaps: [number, number][] = [
    ...(f < (COMP_CLOSE[0] + COMP_CLOSE[1]) / 2 ? ([[COMP.left + 6, COMP.left + COMP.w - 6]] as [number, number][]) : []),
    [MARK.x - (MARK.size / 2) * 0.96, MARK.x + (MARK.size / 2) * 0.96],
  ];
  const segs: [number, number][] = [];
  let a = wx0;
  for (const [g0, g1] of gaps) {
    if (g1 < a || g0 > wx1) continue;
    if (g0 > a) segs.push([a, g0]);
    a = Math.max(a, g1);
  }
  if (a < wx1) segs.push([a, wx1]);

  const yAt = (x: number) => {
    const carrier = 0.62 * Math.sin(x * 0.085 - f * 0.42) + 0.38 * Math.sin(x * 0.21 + f * 0.31);
    const amp = bumps.reduce((acc, bb) => acc + bb.amp * gauss(x, bb.x, bb.sigma), 0);
    return carrier * amp + 1.4 * Math.sin(x * 0.05 + f * 0.07);
  };
  const line = (x0: number, x1: number) => {
    const pts: string[] = [];
    const step = 3 / s;
    for (let x = x0; x < x1; x += step) pts.push(`${(W / 2 + (x - c.x) * s).toFixed(1)},${(ys + yAt(x) * s).toFixed(1)}`);
    pts.push(`${(W / 2 + (x1 - c.x) * s).toFixed(1)},${(ys + yAt(x1) * s).toFixed(1)}`);
    return pts.join(" ");
  };
  const sw = Math.max(2.2, 2.9 * s);

  // the scan head: a coral line from the trace down through the strip
  const headK =
    interpolate(f, [RUN[1] - 3, RUN[1] + 3], [0, 1], clamp) * interpolate(f, HEAD_OFF, [1, 0], { ...clamp, easing: TRAVEL });
  const hx = toScreen({ x: HEAD_X, y: 0 }, c).x;
  const hy0 = toScreen({ x: 0, y: TY + 8 }, c).y;
  const hy1 = toScreen({ x: 0, y: STRIP.top + STRIP_H + 6 }, c).y;

  // Resolve's playhead (dimmed with the app)
  const b = appBright(f) / 0.8;
  const red = `rgb(${Math.round(230 * b)},${Math.round(75 * b)},${Math.round(61 * b)})`;
  const px = toScreen({ x: T0_X + playAt(f) * ZPS, y: 0 }, c).x;
  const pTop = toScreen({ x: 0, y: RULER.y0 + 4 }, c).y;
  const pLine0 = toScreen({ x: 0, y: RULER.y0 + 26 }, c).y;
  const pBot = toScreen({ x: 0, y: PANEL_BOTTOM - 2 }, c).y;
  const fw = 15 * s; // flag half width
  const fh = 18 * s;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      {px > -30 && px < W + 30 && pBot > 0 && pTop < H ? (
        <g>
          <line x1={px} y1={pLine0} x2={px} y2={pBot} stroke="rgba(0,0,0,0.6)" strokeWidth={Math.max(2.5, 6.5 * s)} />
          <line x1={px} y1={pLine0} x2={px} y2={pBot} stroke={red} strokeWidth={Math.max(1.6, 3.6 * s)} />
          <path
            d={`M${px - fw},${pTop} H${px + fw} V${pTop + fh * 0.62} L${px},${pTop + fh * 1.25} L${px - fw},${pTop + fh * 0.62} Z`}
            fill={red}
            stroke="rgba(0,0,0,0.6)"
            strokeWidth={1.2}
          />
        </g>
      ) : null}
      {segs.map(([x0, x1], i) => (
        <polyline key={i} points={line(x0, x1)} fill="none" stroke={TRACE_INK} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {bumps.map((bb, i) => {
        if (bb.amp < 0.5) return null;
        const x0 = bb.x - 2.6 * bb.sigma;
        const x1 = bb.x + 2.6 * bb.sigma;
        return segs.map(([s0, s1], j) => {
          const u0 = Math.max(x0, s0);
          const u1 = Math.min(x1, s1);
          if (u1 - u0 < 2) return null;
          return (
            <polyline
              key={`${i}-${j}`}
              points={line(u0, u1)}
              fill="none"
              stroke={`rgba(${bb.rgb},${Math.min(1, 0.45 + bb.amp / 26).toFixed(3)})`}
              strokeWidth={sw + 0.6}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        });
      })}
      {headK > 0.01 ? (
        <line x1={hx} y1={hy0} x2={hx} y2={hy1} stroke={`rgba(${coral},${(0.95 * headK).toFixed(3)})`} strokeWidth={Math.max(2.4, 3.4 * s)} strokeLinecap="round" />
      ) : null}
    </svg>
  );
};

