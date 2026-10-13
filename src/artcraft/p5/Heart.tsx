import React from "react";
import { interpolate } from "remotion";
import { PH } from "../theme";
import {
  BEAT,
  BLIP_H,
  COMP,
  DECEL,
  EMIT0,
  ENTER,
  KILL_SPEED,
  MARK,
  MONTHS,
  PS,
  SEND,
  SPEED,
  SR,
  TY,
  WAKE,
  clamp,
  monthX,
  toScreen,
  type Cam,
} from "./plan";

// ===========================================================================
// The scope trace as a heart monitor. Each blip is a sharp ECG complex in the
// Photoshop icon's own blue (#31A8FF) that leaves the icon every BEAT frames
// and runs right at one month per beat. On send, a flatline runs back up the
// line from the Claude mark and the blips die out where it passes (no more
// leave the icon); Claude's voice then lights the line in coral around its
// mark (fish8 carrier, slow sines, no jitter). World coordinates, inside the
// camera. Phosphor persistence: the blips leave a short fading afterimage.
// ===========================================================================

export const PS_RGB = "49,168,255";
const INK_RGB = "243,241,236";
const TRACE_INK = `rgba(${INK_RGB},0.5)`;

const gauss = (u: number, s: number) => Math.exp(-(u * u) / (2 * s * s));
/** ECG complex (P, Q, R, S, T), y offset in px (negative = up) at distance u from the R peak */
const ecg = (u: number) =>
  -BLIP_H * (0.07 * gauss(u + 30, 7) - 0.09 * gauss(u + 8, 2.8) + gauss(u, 3.9) - 0.26 * gauss(u - 8, 3.4) + 0.12 * gauss(u - 31, 8.5));
const ECG_L = -56;
const ECG_R = 56;

type Blip = { c: number; a: number };

/** live blips at frame f (centre x, amplitude 0..1) */
export const blipsAt = (f: number, x0: number, x1: number): Blip[] => {
  const out: Blip[] = [];
  const kMax = Math.floor((Math.min(f, SEND) - EMIT0) / BEAT);
  for (let k = kMax; ; k--) {
    const born = EMIT0 + k * BEAT;
    const c = PS.x + SPEED * (f - born);
    if (c + ECG_L > x1 || c + ECG_L > COMP.left) break;
    if (c + ECG_R < x0) continue;
    let a = 1;
    if (f > SEND) {
      // the flatline front leaves the Claude mark at SEND and runs left
      const front = MARK.x - KILL_SPEED * (f - SEND);
      const since = (c - front) / KILL_SPEED;
      a = 1 - DECEL(Math.min(1, Math.max(0, since / 7)));
    }
    if (a > 0.01) out.push({ c, a });
  }
  return out;
};

/** Claude's voice on the line: amplitude envelope + width */
const voiceAt = (f: number) => {
  const env = interpolate(f, [WAKE, WAKE + 10], [0, 1], { ...clamp, easing: ENTER });
  const talk = 0.72 + 0.2 * Math.sin(f * 0.23) + 0.08 * Math.sin(f * 0.61 + 1.3);
  const sigma = interpolate(f, [WAKE, WAKE + 16], [50, 124], { ...clamp, easing: DECEL });
  return { amp: 64 * env * talk, sigma, cx: MARK.x - 40 };
};

const carrier = (x: number, f: number) => 0.62 * Math.sin(x * 0.085 - f * 0.42) + 0.38 * Math.sin(x * 0.21 + f * 0.31);

const yAt = (x: number, f: number, blips: Blip[], v: ReturnType<typeof voiceAt>) => {
  let y = TY + 1.4 * Math.sin(x * 0.05 + f * 0.07);
  for (const b of blips) {
    const u = x - b.c;
    if (u > ECG_L && u < ECG_R) y += ecg(u) * b.a;
  }
  if (v.amp > 0.2) y += carrier(x, f) * v.amp * gauss(x - v.cx, v.sigma);
  return y;
};

/** sample xs: a coarse grid plus dense samples around each R peak so the spike never aliases */
const samples = (x0: number, x1: number, blips: Blip[]) => {
  const xs: number[] = [];
  for (let x = x0; x <= x1; x += 3) xs.push(x);
  for (const b of blips) {
    for (let u = -60; u <= 60; u += 1.5) xs.push(b.c + u);
    for (let u = -14; u <= 14; u += 0.5) xs.push(b.c + u);
  }
  return xs.filter((x) => x >= x0 && x <= x1).sort((a, b) => a - b);
};

const pts = (xs: number[], f: number, blips: Blip[], v: ReturnType<typeof voiceAt>) =>
  xs.map((x) => `${x.toFixed(1)},${yAt(x, f, blips, v).toFixed(1)}`).join(" ");

export const HeartTrace: React.FC<{ frame: number; x0: number; x1: number }> = ({ frame: f, x0, x1 }) => {
  const right = Math.min(x1, COMP.left + 2);
  const blips = blipsAt(f, x0 - 100, right);
  const v = voiceAt(f);
  const xs = samples(x0, right, blips);

  // phosphor afterimage: the blip segments one and two frames ago
  const ghosts = [2, 1].map((j) => {
    const fb = f - j;
    const bb = blipsAt(fb, x0 - 100, right);
    const vb = voiceAt(fb);
    return { j, segs: bb.map((b) => ({ b, xs: samples(Math.max(x0, b.c - 62), Math.min(right, b.c + 62), [b]) })), vb, bb };
  });

  return (
    <g>
      <polyline points={pts(xs, f, blips, v)} fill="none" stroke={TRACE_INK} strokeWidth={2.6} strokeLinejoin="round" />
      {ghosts.map(({ j, segs, vb, bb }) =>
        segs.map(({ b, xs: s }, i) =>
          s.length > 1 ? (
            <polyline
              key={`g${j}-${i}`}
              points={pts(s, f - j, bb, vb)}
              fill="none"
              stroke={`rgba(${PS_RGB},${((j === 1 ? 0.34 : 0.16) * b.a).toFixed(3)})`}
              strokeWidth={3}
              strokeLinejoin="round"
            />
          ) : null,
        ),
      )}
      {blips.map((b, i) => {
        const s = samples(Math.max(x0, b.c - 62), Math.min(right, b.c + 62), [b]);
        if (s.length < 2) return null;
        return (
          <polyline
            key={`b${i}`}
            points={pts(s, f, blips, v)}
            fill="none"
            stroke={`rgba(${PS_RGB},${Math.min(1, 0.15 + b.a).toFixed(3)})`}
            strokeWidth={3.4}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={b.a}
          />
        );
      })}
      {/* Claude's voice, with the same phosphor afterimage (the carrier two and four frames ago) */}
      {[4, 2, 0].map((j) => {
        const vj = voiceAt(f - j);
        if (vj.amp <= 0.3) return null;
        const s = samples(Math.max(x0, vj.cx - 2.8 * vj.sigma), Math.min(right, vj.cx + 2.8 * vj.sigma), []);
        return (
          <polyline
            key={`v${j}`}
            points={pts(s, f - j, j === 0 ? blips : blipsAt(f - j, x0 - 100, right), vj)}
            fill="none"
            stroke={`rgba(${PH.claudeRgb},${(Math.min(1, 0.35 + vj.amp / 30) * (j === 0 ? 1 : j === 2 ? 0.32 : 0.14)).toFixed(3)})`}
            strokeWidth={j === 0 ? 3.4 : 3}
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
};

/** month ticks under the line; each tick brightens as a blip crosses it. Labels are content: they fade at the safe edges. */
export const MonthAxis: React.FC<{ frame: number; cam: Cam; font: string; x0: number; x1: number }> = ({ frame: f, cam, font, x0, x1 }) => {
  const blips = blipsAt(f, x0 - 100, x1 + 100);
  const FS = 30;
  const halfW = (FS * 0.6 * 3) / 2;
  return (
    <g>
      {MONTHS.map((m, i) => {
        const x = monthX(i);
        if (x < x0 - 60 || x > x1 + 60) return null;
        const hit = blips.reduce((a, b) => Math.max(a, b.a * gauss(x - b.c, 14)), 0);
        const sx = toScreen(x, TY, cam).x;
        const hw = halfW * cam.z;
        const inSafe =
          interpolate(sx - hw, [SR.left - 2, SR.left + 16], [0, 1], clamp) * interpolate(sx + hw, [SR.right - 16, SR.right + 2], [1, 0], clamp);
        return (
          <g key={m}>
            <line x1={x} y1={TY + 10} x2={x} y2={TY + 34} stroke={`rgba(${INK_RGB},${(0.62 + 0.38 * hit).toFixed(3)})`} strokeWidth={3.2} strokeLinecap="round" />
            {inSafe > 0.01 ? (
              <text x={x} y={TY + 86} fontSize={FS} fontFamily={font} fontWeight={500} fill={`rgba(${INK_RGB},${(0.9 * inSafe).toFixed(3)})`} textAnchor="middle">
                {m}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

/** one soft ring when something speaks on the line (fish8 Ripple) */
export const Ripple: React.FC<{ x: number; y: number; r0: number; at: number; frame: number; rgb: string; len?: number; a?: number }> = ({
  x,
  y,
  r0,
  at,
  frame,
  rgb,
  len = 24,
  a = 0.5,
}) => {
  const t = (frame - at) / len;
  if (t < 0 || t > 1) return null;
  return <circle cx={x} cy={y} r={r0 + 44 * DECEL(t)} fill="none" stroke={`rgba(${rgb},1)`} strokeWidth={2.4} opacity={a * (1 - t)} />;
};
