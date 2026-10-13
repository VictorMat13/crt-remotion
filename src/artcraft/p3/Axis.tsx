import React from "react";
import { COMMITS_PER_DAY } from "../theme";
import { clamp, D0, DAY, kAt, LAYOUT, NDAYS, SR, sw, X } from "./timebase";
import { interpolate } from "remotion";

// ===========================================================================
// In-world axis under the scope: year ticks 1990..2026 (labels thin out as the
// timebase pulls back: every year, every 2, every 4), then day ticks with the
// real day names from COMMITS_PER_DAY once the last two weeks fill the frame.
// Mono, small, light ink (the CRT grade crushes anything dim to black).
// ===========================================================================

const ok = (x: number) => x > -40 && x < 1120;
// labels are content: fade them out before they cross the 8% safe edges
const inSafe = (x: number, w: number) =>
  interpolate(x - w / 2, [SR.left - 2, SR.left + 18], [0, 1], clamp) * interpolate(x + w / 2, [SR.right - 18, SR.right + 2], [1, 0], clamp);

export const Axis: React.FC<{ frame: number; font: string }> = ({ frame, font }) => {
  const f = frame;
  const k = kAt(f);
  const s = sw(f);
  const y = LAYOUT.axisY(f);
  const fs = LAYOUT.labelSize(f);
  const ly = y + LAYOUT.labelGap(f) + fs * 0.8;
  const charW = fs * 0.6;

  // decimation: every year when roomy, then every 2, then every 4 (all include 1990 and 2026)
  const opOdd = interpolate(k, [84, 100], [0, 1], clamp);
  const op2 = interpolate(k, [42, 50], [0, 1], clamp);
  const yearLabelsOut = 1 - interpolate(s, [0, 0.35], [0, 1], clamp);
  const minorOut = 1 - interpolate(s, [0, 0.5], [0, 1], clamp);
  const monthOp = interpolate(k, [55, 85], [0, 1], clamp) * minorOut;
  // day ticks exist from the first frame of the zoom and spread out from the right edge;
  // their names fade in once a day is wide enough to hold one
  const dayW = X(D0 + DAY, f) - X(D0, f);
  const dayOp = interpolate(dayW, [46, 56], [0, 1], clamp);
  const dayMinorOp = interpolate(s, [0, 0.12], [0, 1], clamp);

  const ticks: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];

  for (let yr = 1990; yr <= 2026; yr++) {
    const x = X(yr, f);
    const decade = yr % 10 === 0;
    const rel = yr - 1990;
    const lvl = rel % 4 === 0 ? 1 : rel % 2 === 0 ? op2 : opOdd;
    if (ok(x)) {
      const h = (decade ? 19 : 13) * (1 - 0.15 * s);
      ticks.push(<line key={`y${yr}`} x1={x} y1={y} x2={x} y2={y + h} stroke={`rgba(243,241,236,${0.78})`} strokeWidth={s > 0.6 ? 1 : 1.6} />);
    }
    // labels: 1990 stays (left-aligned once squeezed so it keeps inside the safe area)
    if (yr === 1990) {
      const w = 4 * charW;
      labels.push(
        <text key="l1990" x={x - (w / 2) * (1 - s)} y={ly} fontSize={fs} fill={`rgba(243,241,236,${(0.86 * (1 - interpolate(s, [0.3, 0.55], [0, 1], clamp))).toFixed(3)})`} fontFamily={font} textAnchor="start">1990</text>,
      );
    } else {
      const o = lvl * yearLabelsOut * inSafe(x, 4 * charW);
      if (o > 0.01 && ok(x)) {
        labels.push(
          <text key={`l${yr}`} x={x} y={ly} fontSize={fs} fill={`rgba(243,241,236,${0.86 * o})`} fontFamily={font} textAnchor="middle">{yr}</text>,
        );
      }
    }
    if (yr === 2026) continue;
    for (let m = 1; m < 12; m++) {
      const t = yr + m / 12;
      const q = m % 3 === 0;
      const o = q ? minorOut : monthOp;
      if (o < 0.01) continue;
      const xm = X(t, f);
      if (!ok(xm)) continue;
      ticks.push(<line key={`m${yr}-${m}`} x1={xm} y1={y} x2={xm} y2={y + (q ? 8 : 4.5)} stroke={`rgba(243,241,236,${(q ? 0.6 : 0.46) * o})`} strokeWidth={1.2} />);
    }
  }
  // the months of 2026 up to Sep 30
  for (let m = 1; m <= 8; m++) {
    const xm = X(2026 + m / 12, f);
    const q = m % 3 === 0;
    const o = q ? minorOut : monthOp;
    if (o > 0.01 && ok(xm)) ticks.push(<line key={`m26-${m}`} x1={xm} y1={y} x2={xm} y2={y + (q ? 8 : 4.5)} stroke={`rgba(243,241,236,${(q ? 0.6 : 0.46) * o})`} strokeWidth={1.2} />);
  }

  // days (Sep 30 .. Oct 13): tick at each day's center with its real name, 6h minor ticks
  if (dayMinorOp > 0.01) {
    for (let d = 0; d < NDAYS; d++) {
      for (const q of [0, 1, 3]) {
        const xm = X(D0 + (d + q / 4) * DAY, f);
        ticks.push(<line key={`h${d}-${q}`} x1={xm} y1={y} x2={xm} y2={y + 6} stroke={`rgba(243,241,236,${0.55 * dayMinorOp})`} strokeWidth={1.2} />);
      }
      const xc = X(D0 + (d + 0.5) * DAY, f);
      ticks.push(<line key={`d${d}`} x1={xc} y1={y} x2={xc} y2={y + 13} stroke={`rgba(243,241,236,${0.8 * dayMinorOp})`} strokeWidth={1.6} />);
      // every other day carries a name (Sep 30, Oct 2 ... Oct 12) so the names can be phone-sized
      if (dayOp > 0.01 && d % 2 === 0) {
        labels.push(
          <text key={`dl${d}`} x={xc} y={ly} fontSize={fs} fill={`rgba(243,241,236,${0.86 * dayOp})`} fontFamily={font} textAnchor="middle" letterSpacing={-0.4}>{COMMITS_PER_DAY[d].day}</text>,
        );
      }
    }
  }

  return (
    <g>
      {ticks}
      <g style={{ fontVariantNumeric: "tabular-nums" }}>{labels}</g>
    </g>
  );
};
