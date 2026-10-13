import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { CRT, LOGOS, PARTS, PH } from "./theme";
import {
  BEAT,
  BLUR_SAMPLES,
  COMP,
  DECEL,
  EMIT0,
  ENTER,
  GLITCH,
  H,
  MARK,
  PS,
  SEND,
  TRAVEL,
  TY,
  W,
  WAKE,
  camAt,
  clamp,
  cursorAt,
} from "./p5/plan";
import { HeartTrace, MonthAxis, PS_RGB, Ripple } from "./p5/Heart";
import { Composer } from "./p5/Composer";
import { MacCursor, PsIcon } from "./p5/glyphs";

// ===========================================================================
// AcP5PayMonthly: 1080x960 (9:8) @ 30fps, 150 frames (5.0s).
// VO (Victor's, never on screen): "So if there's an app you pay for every
// month, you can just ask Claude to build your own."
//
// CRT Scope style. One continuous shot along one scope trace.
//   0-55    every month: the official Photoshop icon sits on the trace and it
//           beats like a heart monitor. A sharp blip (Photoshop blue) leaves
//           the icon every 12 frames and runs right at one month per beat, so
//           the blips sit exactly on the month ticks (Jan .. Dec) on every
//           beat. The camera opens tight on the icon and trucks right with the
//           beats through the year while pulling back. Steady, relentless.
//   55-150  ask Claude: the trace runs into the claude.ai composer (right two
//           thirds), the Claude mark asleep on the line at its doorstep.
//           "How can I help you today?" gives way to the build prompt typing
//           out (real cadence, pauses at the comma and full stop); the coral
//           send button arms; the blips keep arriving. A plain arrow presses
//           send (128): one soft glitch, the caret goes, a flatline runs back
//           up the line from the mark and the blips die where it passes; the
//           Claude mark wakes in coral and talks on the trace. Slow push out.
// ===========================================================================

export const AC_P5_DURATION = PARTS.p5.frames; // 150

const { fontFamily: ui } = loadInter("normal", { weights: ["400", "500"], subsets: ["latin"] });
const { fontFamily: mono } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const BG = "#050506";

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const reach = (W / 2 + 60) / cam.z;
  const x0 = Math.floor(cam.x - reach);
  const x1 = Math.ceil(cam.x + reach);
  const near = (a: number, b: number) => b > x0 && a < x1;

  // Ps: a soft ring each time a blip leaves it
  const lastEmit = EMIT0 + Math.floor((Math.min(f, SEND) - EMIT0) / BEAT) * BEAT;
  const psH = (PS.size * 234) / 240;
  const psRip = (f - lastEmit) / 16;

  // Claude mark: asleep (grey, dim) until sent, then wakes in coral and keeps talking
  const wake = interpolate(f, [WAKE, WAKE + 8], [0, 1], { ...clamp, easing: ENTER });
  const spin = 40 * interpolate(f, [WAKE, WAKE + 36], [0, 1], { ...clamp, easing: TRAVEL }); // the app's mark turns while Claude works
  const talk = wake * (0.5 + 0.5 * Math.sin(f * 0.23));

  const cur = cursorAt(f);

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transform: `translate(${W / 2 - cam.x}px, ${H / 2 - cam.y}px) scale(${cam.z})`,
          transformOrigin: `${cam.x}px ${cam.y}px`,
        }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <MonthAxis frame={f} cam={cam} font={mono} x0={x0} x1={x1} />
          <HeartTrace frame={f} x0={x0} x1={x1} />
          <Ripple x={MARK.x} y={TY} r0={MARK.size * 0.5} at={WAKE} frame={f} rgb={PH.claudeRgb} len={26} a={0.6} />
        </svg>

        {/* the official Photoshop icon on the trace, a soft ring per beat */}
        {near(PS.x - PS.size, PS.x + PS.size) ? (
          <>
            {psRip >= 0 && psRip < 1 ? (
              <div
                style={{
                  position: "absolute",
                  left: PS.x - PS.size / 2 - 22 * DECEL(psRip),
                  top: TY - psH / 2 - 22 * DECEL(psRip),
                  width: PS.size + 44 * DECEL(psRip),
                  height: psH + 44 * DECEL(psRip),
                  boxSizing: "border-box",
                  borderRadius: 30 + 8 * DECEL(psRip),
                  border: `2.5px solid rgba(${PS_RGB},${(0.55 * (1 - psRip)).toFixed(3)})`,
                }}
              />
            ) : null}
            <PsIcon width={PS.size} style={{ position: "absolute", left: PS.x - PS.size / 2, top: TY - psH / 2 }} />
          </>
        ) : null}

        {/* the Claude mark on the line at the composer's doorstep */}
        {near(MARK.x - MARK.size, MARK.x + MARK.size) ? (
          <div
            style={{
              position: "absolute",
              left: MARK.x - MARK.size / 2,
              top: TY - MARK.size / 2,
              width: MARK.size,
              height: MARK.size,
              borderRadius: "50%",
              background: "#000",
              transform: `scale(${(0.9 + 0.1 * wake + 0.025 * talk).toFixed(4)})`,
            }}
          >
            <Img
              src={staticFile(LOGOS.claude)}
              style={{
                position: "absolute",
                inset: MARK.size * 0.07,
                width: MARK.size * 0.86,
                height: MARK.size * 0.86,
                filter: "grayscale(1) brightness(0.92)",
                opacity: 0.85 * (1 - wake),
                transform: `rotate(${spin}deg)`,
              }}
            />
            <Img
              src={staticFile(LOGOS.claude)}
              style={{
                position: "absolute",
                inset: MARK.size * 0.07,
                width: MARK.size * 0.86,
                height: MARK.size * 0.86,
                opacity: wake,
                transform: `rotate(${spin}deg)`,
              }}
            />
          </div>
        ) : null}

        {near(COMP.left, COMP.left + COMP.w) ? <Composer frame={f} font={ui} /> : null}

        <MacCursor x={cur.x} y={cur.y} size={50} press={cur.press} opacity={cur.opacity} />
      </div>
    </AbsoluteFill>
  );
};

export const AcP5PayMonthly: React.FC<{ samples?: number }> = ({ samples }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={GLITCH}>
        <AbsoluteFill style={{ backgroundColor: BG }}>
          <CameraMotionBlur shutterAngle={180} samples={samples ?? BLUR_SAMPLES}>
            <Scene />
          </CameraMotionBlur>
        </AbsoluteFill>
      </CRT>
    </AbsoluteFill>
  );
};
