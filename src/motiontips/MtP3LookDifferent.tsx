import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { CRT, PARTS, PH, Scope, type ScopeBump } from "./theme";
import {
  ARRIVE,
  BLUR_WINS,
  DECEL,
  GLITCH,
  LAND,
  SCREENS,
  SCX,
  SCY,
  TRICKLE,
  c01,
  camAt,
  pulseAmp,
  pulseX,
  screenX,
  seg,
  trickleX,
  type Cam,
} from "./t3/plan";
import { Screen } from "./t3/Screen";
import { SkillCard } from "./t3/SkillCard";

// ===========================================================================
// MtP3LookDifferent: 1080x960 (9:8) @ 30fps, 180 frames (6.0s).
// VO (Victor's, never on screen): "Thing is, every video edited this way can
// look different, and if you want consistent results, you have to have a skill."
//
// CRT Scope. One continuous shot over a wall of screens on the scope trace:
//   0-62    four real past deliverables, each in a different look (Liam white,
//           Bennett's crimson grid, the fish 8 clean take, the invideo 3 Vox
//           collage), loose and mismatched; the camera is already rising out
//           of the bottom-left screen and pulls back over the whole wall
//   62-98   the top row parts and the real STYLE.md file card drops into the
//           slot onto the trace (soft wobble as it lands)
//   98-130  a coral pulse leaves the card both ways; each screen it passes
//           powers off to a line and opens as a delivered CRT Scope graphic
//           (ArtCraft), squaring up with the row
//   130-180 the whole wall plays in one look; packets keep leaving the skill;
//           the camera is still pushing up toward the card on the last frame
// ===========================================================================

export const MT_P3_DURATION = PARTS.t3.frames; // 180

const { fontFamily: UI } = loadInter("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["400", "700"], subsets: ["latin"] });

const NEUTRAL = "233,231,226";
const gauss = (x: number, c: number, s: number) => Math.exp(-((x - c) ** 2) / (2 * s * s));

const worldTf = (cam: Cam) => `translate(${(SCX - cam.x * cam.z).toFixed(2)}px, ${(SCY - cam.y * cam.z).toFixed(2)}px) scale(${cam.z.toFixed(5)})`;

// ---------------------------------------------------------------- trace
const traceBumps = (f: number): ScopeBump[] => {
  const out: ScopeBump[] = [];
  // the skill: lands with a ring, then keeps talking softly while it feeds the row
  if (f >= LAND - 1) {
    const ring = c01((f - LAND + 1) / 3) * (1 - seg(f, LAND + 2, LAND + 26, DECEL));
    const voice = c01((f - LAND - 6) / 10) * (0.75 + 0.25 * Math.sin(f * 0.19));
    out.push({ x: 0, amp: 22 * ring + 8 * voice, sigma: 95, rgb: PH.claudeRgb });
  }
  // the pulse, both ways
  const pa = pulseAmp(f);
  if (pa > 0.01) {
    const px = pulseX(f);
    const v = Math.abs(pulseX(f + 0.5) - pulseX(f - 0.5));
    for (const side of [-1, 1]) out.push({ x: side * px, amp: 19 * pa, sigma: 46 + 0.6 * v, rgb: PH.claudeRgb });
  }
  // trickling packets from the skill
  for (const p of TRICKLE) {
    if (f < p.t0 - 1 || f > p.t1 + 2) continue;
    const a = c01((f - p.t0 + 1) / 4) * (1 - seg(f, p.t1 - 14, p.t1, DECEL));
    for (const side of [-1, 1]) if (a > 0.01) out.push({ x: side * trickleX(p, f), amp: 11 * a, sigma: 40, rgb: PH.claudeRgb });
  }
  // each screen hums on its station: neutral while it plays its own look, coral once it switched
  SCREENS.forEach((s, i) => {
    const x = screenX(s, f);
    const a = ARRIVE[s.id];
    const before = 1 - c01((f - a + 2) / 4);
    if (before > 0.01) out.push({ x, amp: 5 * before * (0.8 + 0.2 * Math.sin(f * 0.15 + i * 1.3)), sigma: 80, rgb: NEUTRAL });
    if (f >= a - 2) {
      const hit = c01((f - a + 2) / 4) * (1 - 0.55 * seg(f, a + 4, a + 30, DECEL));
      let blip = 0;
      for (const p of TRICKLE) if (f >= p.t0) blip += gauss(trickleX(p, f), Math.abs(x), 70) * (1 - seg(f, p.t1 - 14, p.t1, DECEL));
      const amp = 15 * hit * (0.85 + 0.15 * Math.sin(f * 0.17 + i)) + 7 * Math.min(1, blip);
      if (amp > 0.5) out.push({ x, amp, sigma: 85, rgb: PH.claudeRgb });
    }
  });
  return out;
};

/** the scope line, drawn sharp on top of the blurred scene (blur smears thin lines) */
const Trace: React.FC<{ f: number }> = ({ f }) => {
  const cam = camAt(f);
  return (
    <svg width={1080} height={960} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform={`translate(${(SCX - cam.x * cam.z).toFixed(2)} ${(SCY - cam.y * cam.z).toFixed(2)}) scale(${cam.z.toFixed(5)})`}>
        <Scope frame={f} x0={-1700} x1={1700} y={0} bumps={traceBumps(f)} stroke={2.6} hum={1.4} />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------- scene
const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: worldTf(cam) }}>
        {SCREENS.map((s, i) => (
          <Screen key={s.id} s={s} i={i} f={f} />
        ))}
        <SkillCard f={f} ui={UI} mono={MONO} />
      </div>
    </AbsoluteFill>
  );
};

export const MtP3LookDifferent: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WINS.some(([a, b]) => frame >= a && frame <= b);
  const n = samples ?? (big ? 8 : 1);
  // CameraMotionBlur renders its samples at frame + 0.5 .. + 1 (mean ~ +0.5 for 1 sample,
  // ~ +0.72 for 8); the sharp trace follows the same instant so it stays glued to the row
  const traceF = frame + (n > 1 ? 0.72 : 0.5);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={GLITCH}>
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
          <CameraMotionBlur shutterAngle={180} samples={n}>
            <Scene />
          </CameraMotionBlur>
          <Trace f={traceF} />
        </AbsoluteFill>
      </CRT>
    </AbsoluteFill>
  );
};
