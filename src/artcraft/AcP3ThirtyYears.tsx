import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { ADOBE_FIRST, APPS, appIcon, COMMITS_PER_DAY, CRT, LOGOS, PARTS, PH, REPOS, type AppId } from "./theme";
import { Axis } from "./p3/Axis";
import { LogPanel } from "./p3/LogPanel";
import { BeamHead, Bump, Lit, Ripple, Trace } from "./p3/Trace";
import {
  BAR, barGrow, beamT, clamp, CLAUDE_SIZE, D0, DAY, decel, enter, frameAtBeam, GLITCH_AT, H, LAYOUT, rel, SR, SWEEP3, TWIN_SIZE, W, X,
} from "./p3/timebase";

// ===========================================================================
// P3 "But here's where it gets crazy. Adobe spent over thirty years building
// these apps, and Claude rebuilt them in a couple of weeks." (VO only)
//
// The oscilloscope timebase. Three lanes, one per Adobe app, the official
// icon on its trace at its real first-release year. The sweep runs 1990 ->
// Sep 30 2026 while the timebase slowly pulls back; passed traces stay lit.
// At 104 one soft glitch and the timebase zooms: 1990-2026 squeezes into a
// sliver at the left, the last two weeks fill the frame with day ticks. The
// Claude mark sits on the axis trace at Sep 30, the real commits per day ride
// it as bars, the Craft twins land on their lanes at their real repo dates,
// and the real git log scrolls underneath with GitHub's own counter.
// ===========================================================================

export const AC_P3_DURATION = PARTS.p3.frames; // 180

const { fontFamily: ui } = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const { fontFamily: mono } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const rgbOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");
const ADOBE_RGB = ["49,168,255", "153,153,255", "153,153,255"]; // the icons' own letter colors (Ps #31A8FF, Pr/Ae #9999FF)

const created = (id: AppId) => {
  const r = REPOS.find((x) => x.name === id)!;
  const [, mm, dd] = r.created.split("-").map(Number);
  // Sep 30 = day 0, Oct 1 = day 1 ...
  return mm === 9 ? dd - 30 : 1 + (dd - 1);
};

const LANES = ADOBE_FIRST.map((a, i) => {
  const twin = APPS.find((x) => x.id === a.twin)!;
  const day = created(a.twin);
  return {
    ...a,
    rgb: ADOBE_RGB[i],
    twinRgb: rgbOf(twin.accent),
    twinDay: day,
    twinT: D0 + day * DAY,
    lightAt: frameAtBeam(a.year), // the sweep reaches the release year
    landAt: frameAtBeam(D0 + (day + 0.3) * DAY), // the sweep reaches the repo's first day
  };
});
const CLAUDE_IN = { from: 107, to: 121 }; // appears at Sep 30 2026, the tip of the thirty years, and rides the zoom left

// Motion blur only on the timebase switch; single sample elsewhere.
const BLUR: [number, number] = [98, 134];

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const f = frame;
  const tb = beamT(f);
  const xBeam = X(tb, f);
  const axisY = LAYOUT.axisY(f);
  const phase3 = f >= SWEEP3.from;

  // ---- lanes --------------------------------------------------------------
  const lanes = LANES.map((L, i) => {
    const y = LAYOUT.laneY(i, f);
    const xYear = X(L.year, f);
    const lit: Lit[] = [];
    const bumps: Bump[] = [];
    if (tb > L.year) {
      const end = Math.min(tb, D0);
      lit.push({ a: xYear, b: X(end, f), rgb: L.rgb, amp: 17 - 10 * rel(f), ghosts: 3 });
    }
    if (tb > L.twinT) lit.push({ a: X(L.twinT, f), b: xBeam, rgb: L.twinRgb, amp: 7, ghosts: 3 });
    // the write head excites the line where the lane is live
    const liveAtBeam = tb > L.year && (tb <= D0 + 1e-9 || tb > L.twinT);
    if (liveAtBeam) bumps.push({ x: xBeam, amp: phase3 ? 14 : 24, sigma: 44 });
    // release / landing pulses
    const launch = interpolate(f, [L.lightAt, L.lightAt + 40], [1, 0], { ...clamp, easing: decel });
    if (f >= L.lightAt && launch > 0) bumps.push({ x: xYear, amp: 26 * launch, sigma: 64 });
    const xTwin = X(L.twinT + 0.5 * DAY, f);
    const land = interpolate(f, [L.landAt, L.landAt + 36], [1, 0], { ...clamp, easing: decel });
    if (f >= L.landAt) bumps.push({ x: xTwin, amp: 18 * land, sigma: 50 });
    return { L, y, xYear, xTwin, lit, bumps, liveAtBeam };
  });

  // ---- axis trace (the Claude line in the two-week view) ------------------
  const axisLit: Lit[] = phase3 ? [{ a: X(D0, f), b: xBeam, rgb: PH.claudeRgb, amp: 0, far: 0.7 }] : [];
  const claudeK = interpolate(f, [CLAUDE_IN.from, CLAUDE_IN.to], [0, 1], { ...clamp, easing: enter });
  const xClaude = Math.min(X(D0 + 0.5 * DAY, f), SR.right - CLAUDE_SIZE / 2); // held inside the safe edge until the zoom carries it in

  // ---- icons --------------------------------------------------------------
  const adobeSize = LAYOUT.adobeSize(f);

  return (
    <AbsoluteFill style={{ backgroundColor: "#050506" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* commit bars ride the axis trace (behind the line) */}
        {COMMITS_PER_DAY.map((d, i) => {
          const g = barGrow(i, f);
          if (g <= 0.001) return null;
          const h = Math.max(2, (BAR.maxH * d.n) / BAR.max) * g;
          const xc = X(D0 + (i + 0.5) * DAY, f);
          return <rect key={d.day} x={xc - BAR.w / 2} y={axisY - h} width={BAR.w} height={h + 1} rx={3} fill={`rgba(${PH.claudeRgb},0.9)`} />;
        })}
        <Axis frame={f} font={mono} />
        <Trace frame={f} y={axisY} lit={axisLit} hum={0.6} idle="rgba(243,241,236,0.5)" stroke={2} />
        {lanes.map(({ L, y, lit, bumps }) => (
          <Trace key={L.app} frame={f} y={y} lit={lit} bumps={bumps} idle="rgba(243,241,236,0.44)" />
        ))}
        {/* ripples where things arrive on the line */}
        {lanes.map(({ L, y, xYear, xTwin }) => (
          <g key={`r${L.app}`}>
            <Ripple x={xYear} y={y} r0={adobeSize * 0.42} at={L.lightAt} frame={f} rgb={L.rgb} />
            <Ripple x={xTwin} y={y} r0={TWIN_SIZE * 0.42} at={L.landAt} frame={f} rgb={L.twinRgb} />
          </g>
        ))}
        <Ripple x={xClaude} y={axisY} r0={CLAUDE_SIZE * 0.42} at={CLAUDE_IN.from + 4} frame={f} rgb={PH.claudeRgb} />
        {/* write heads */}
        {lanes.map(({ L, y, liveAtBeam }) => (
          <BeamHead key={`b${L.app}`} x={xBeam} y={y} rgb={phase3 ? L.twinRgb : L.rgb} o={liveAtBeam ? 1 : 0.35} />
        ))}
        <BeamHead x={xBeam} y={axisY} rgb={phase3 ? PH.claudeRgb : "243,241,236"} o={0.9} />
      </svg>

      {/* Adobe icons on their lanes at their release years (dim until the sweep reaches them) */}
      {lanes.map(({ L, y, xYear }) => {
        const lit = interpolate(f, [L.lightAt, L.lightAt + 10], [0.62, 1], { ...clamp, easing: enter });
        const x = Math.max(xYear, SR.left + adobeSize / 2);
        const h = (adobeSize * 234) / 240;
        return (
          <Img key={`i${L.app}`} src={staticFile(L.logo)} style={{ position: "absolute", left: x - adobeSize / 2, top: y - h / 2, width: adobeSize, height: h, opacity: lit }} />
        );
      })}

      {/* the Craft twins land on their lanes at their real repo creation dates */}
      {lanes.map(({ L, y, xTwin }) => {
        const k = interpolate(f, [L.landAt, L.landAt + 14], [0, 1], { ...clamp, easing: enter });
        if (k <= 0) return null;
        return (
          <Img
            key={`t${L.app}`}
            src={staticFile(appIcon(L.twin))}
            style={{
              position: "absolute", left: xTwin - TWIN_SIZE / 2, top: y - TWIN_SIZE / 2, width: TWIN_SIZE, height: TWIN_SIZE,
              opacity: Math.min(1, k * 1.8), transform: `translateY(${(1 - k) * -16}px) scale(${0.92 + 0.08 * k})`,
            }}
          />
        );
      })}

      {/* Claude on the axis trace at Sep 30 */}
      {claudeK > 0 ? (
        <div
          style={{
            position: "absolute", left: xClaude - CLAUDE_SIZE / 2, top: axisY - CLAUDE_SIZE / 2, width: CLAUDE_SIZE, height: CLAUDE_SIZE,
            borderRadius: "50%", background: "#000", display: "grid", placeItems: "center",
            opacity: Math.min(1, claudeK * 1.8), transform: `scale(${0.9 + 0.1 * claudeK})`,
          }}
        >
          <Img src={staticFile(LOGOS.claude)} style={{ width: CLAUDE_SIZE * 0.86, height: CLAUDE_SIZE * 0.86 }} />
        </div>
      ) : null}

      <LogPanel frame={f} ui={ui} mono={mono} />
    </AbsoluteFill>
  );
};

export const AcP3ThirtyYears: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = frame >= BLUR[0] && frame <= BLUR[1];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={[GLITCH_AT]}>
        <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
          <Scene />
        </CameraMotionBlur>
      </CRT>
    </AbsoluteFill>
  );
};
