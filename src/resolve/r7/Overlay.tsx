import React from "react";
import { MacCursor } from "../../artcraft/p5/glyphs";
import { PH } from "../theme";
import {
  H,
  JOBS,
  PW,
  PX0,
  PY0,
  RULER_TOP,
  TL_BOTTOM,
  TY,
  W,
  camAt,
  cardAt,
  cursorAt,
  panelHAt,
  playheadSpeed,
  playheadX,
  seg,
  toScreen,
} from "./plan";

// ===========================================================================
// Screen-space layer, outside the camera blur (thin lines smear dark under an
// 8-sample blur): the scope trace along the Video 4 drop zone, the editor's
// playhead (green, the person), and the editor's arrow. Same camera as the
// world, at the integer frame. The Render Queue panel and the riding job
// cards cover the trace and the playhead (mask).
//   green  = the person: their playhead's scrub shows on the trace where it crosses
//   coral  = Claude: a packet under every job card it carries, and the queue's hum
// ===========================================================================

type Bump = { x: number; amp: number; sigma: number; rgb: string };
const gauss = (x: number, c: number, s: number) => Math.exp(-((x - c) ** 2) / (2 * s * s));
const coral = PH.claudeRgb;
const green = PH.userRgb;
const TRACE_INK = "rgba(243,241,236,0.5)";

const hump = (f: number, a: number, b: number) => {
  const m = (a + b) / 2;
  return seg(f, a, m) - seg(f, m, b);
};

const bumpsAt = (f: number): Bump[] => {
  const b: Bump[] = [];
  // the person: their scrub, louder while the playhead runs fast
  const v = playheadSpeed(f);
  b.push({ x: playheadX(f), amp: (9 + Math.min(16, 0.55 * v)) * (0.86 + 0.14 * Math.sin(f * 0.5)), sigma: 34, rgb: green });
  // Claude carries each job along the trace
  JOBS.forEach((j, i) => {
    if (j.lift < -100) return;
    const env = seg(f, j.lift + 2, j.lift + 9) * (1 - seg(f, j.dock[0], j.dock[0] + 7));
    if (env < 0.01) return;
    const c = cardAt(j, i, f);
    b.push({ x: c.cx, amp: 24 * env * (0.9 + 0.1 * Math.sin(f * 0.7 + i)), sigma: 50, rgb: coral });
  });
  // the queue at work: a steady coral hum at its door, up on every arrival and every finished render
  let a = 9 + 3.5 * Math.sin(f * 0.37) + 2 * Math.sin(f * 0.91);
  JOBS.forEach((j) => {
    if (j.lift > -100) a += 15 * hump(f, j.dock[0] - 4, j.dock[0] + 12);
    if (j.render) a += 13 * hump(f, j.render[1] - 4, j.render[1] + 12);
  });
  b.push({ x: PX0 - 46, amp: a, sigma: 40, rgb: coral });
  return b;
};

export const Overlay: React.FC<{ frame: number }> = ({ frame: f }) => {
  const c = camAt(f);
  const s = c.z;
  const bumps = bumpsAt(f);
  const ys = toScreen(c, { x: 0, y: TY }).y;
  const wx0 = c.x - (W / 2 + 40) / s;
  const wx1 = c.x + (W / 2 + 40) / s;
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

  // occluders: the panel and the job cards in flight
  const pan0 = toScreen(c, { x: PX0, y: PY0 });
  const pan1 = toScreen(c, { x: PX0 + PW, y: PY0 + panelHAt(f) });
  const cards = JOBS.map((j, i) => {
    if (f < j.lift || j.lift < -100) return null;
    const k = cardAt(j, i, f);
    const a = toScreen(c, { x: k.cx - k.w / 2 - 6, y: k.cy - k.h / 2 - 6 });
    return { x: a.x, y: a.y, w: (k.w + 12) * s, h: (k.h + 12) * s };
  }).filter((r): r is { x: number; y: number; w: number; h: number } => r !== null);

  // the editor's playhead, Resolve's shape, in the person's green
  const px = toScreen(c, { x: playheadX(f), y: 0 }).x;
  const pTop = toScreen(c, { x: 0, y: RULER_TOP + 1 }).y;
  const pLine0 = toScreen(c, { x: 0, y: RULER_TOP + 22 }).y;
  const pBot = toScreen(c, { x: 0, y: TL_BOTTOM }).y;
  const fw = 15 * s;
  const fh = 19 * s;
  const ph = `rgb(${green})`;

  const cur = cursorAt(f);
  const cs = toScreen(c, cur);

  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <mask id="r7-occlude" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <rect x={0} y={0} width={W} height={H} fill="#fff" />
            <rect x={pan0.x} y={pan0.y} width={pan1.x - pan0.x} height={pan1.y - pan0.y} rx={14 * s} fill="#000" />
            {cards.map((r, i) => (
              <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={10 * s} fill="#000" />
            ))}
          </mask>
        </defs>
        <g mask="url(#r7-occlude)">
          {px > -30 && px < W + 30 ? (
            <g>
              <line x1={px} y1={pLine0} x2={px} y2={pBot} stroke="rgba(0,0,0,0.6)" strokeWidth={Math.max(3, 7 * s)} />
              <line x1={px} y1={pLine0} x2={px} y2={pBot} stroke={ph} strokeWidth={Math.max(2, 4 * s)} />
              <path
                d={`M${px - fw},${pTop} H${px + fw} V${pTop + fh * 0.55} L${px},${pTop + fh * 1.25} L${px - fw},${pTop + fh * 0.55} Z`}
                fill={ph}
                stroke="rgba(0,0,0,0.6)"
                strokeWidth={1.4}
              />
            </g>
          ) : null}
          <polyline points={line(wx0, wx1)} fill="none" stroke={TRACE_INK} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
          {bumps.map((bb, i) => {
            if (bb.amp < 0.5) return null;
            const x0 = Math.max(wx0, bb.x - 2.6 * bb.sigma);
            const x1 = Math.min(wx1, bb.x + 2.6 * bb.sigma);
            if (x1 - x0 < 2) return null;
            return (
              <polyline
                key={i}
                points={line(x0, x1)}
                fill="none"
                stroke={`rgba(${bb.rgb},${Math.min(1, 0.45 + bb.amp / 26).toFixed(3)})`}
                strokeWidth={sw + 0.6}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      </svg>
      <MacCursor x={cs.x} y={cs.y} size={60 * s} press={cur.press} />
    </>
  );
};
