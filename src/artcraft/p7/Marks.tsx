import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { LOGOS, PH } from "../theme";
import { VoiceRing } from "../../fish7/voice";
import { CLAUDE, CLAUDE_IN, ENTER, MIC, MIC_IN, TRAVEL, WAKE, clamp, seg, speech } from "./rig";
import { claudeTalk } from "./Trace";

// ===========================================================================
// The two speakers on the trace. The person: the fish8 green mic ring
// (VoiceRing, fish8/mic.svg), idle until they talk, then its bars move with
// the voice. Claude: the official mark on a black disc, asleep (grey) at its
// spot on the line until the request reaches it, then it wakes in coral and
// keeps working (the mark turns slowly while Claude builds).
// ===========================================================================

const N = 40;
const ringBars = (f: number, level: number) =>
  Array.from({ length: N }).map((_, i) => {
    const s = 0.5 * (1 + Math.sin(i * 0.55 + f * 0.16 + 3)) * (0.55 + 0.45 * Math.sin(f * 0.09 + i * 0.23 + 6));
    const idle = 0.55 + 0.3 * Math.abs(Math.sin(i * 0.7 + f * 0.11 + 3)) + 0.15 * Math.abs(Math.sin(i * 1.9 - f * 0.07));
    return Math.min(1, 0.13 * idle + level * (0.3 + 0.8 * s));
  });

export const MicMark: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [MIC_IN, MIC_IN + 14], [0, 1], { ...clamp, easing: ENTER });
  if (k <= 0) return null;
  const v = speech(f);
  return (
    <VoiceRing
      logo="fish8/mic.svg"
      color={PH.user}
      colorRgb={PH.userRgb}
      bars={ringBars(f, 0.85 * v)}
      size={MIC.size}
      scaleIn={0.9 + 0.1 * k}
      energy={0.04 + 0.2 * v}
      logoFrac={0.3}
      disc="#16191F"
      style={{ left: MIC.x - MIC.size / 2, top: -MIC.size / 2, opacity: k }}
    />
  );
};

export const ClaudeMark: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [CLAUDE_IN, CLAUDE_IN + 14], [0, 1], { ...clamp, easing: ENTER });
  if (k <= 0) return null;
  const wake = interpolate(f, [WAKE, WAKE + 8], [0, 1], { ...clamp, easing: ENTER });
  const spin = 60 * seg(f, WAKE, WAKE + 110, TRAVEL) + 10 * seg(f, WAKE + 100, 330, TRAVEL);
  const talk = claudeTalk(f);
  const s = CLAUDE.size;
  const logo: React.CSSProperties = { position: "absolute", inset: s * 0.07, width: s * 0.86, height: s * 0.86, transform: `rotate(${spin.toFixed(2)}deg)` };
  return (
    <div
      style={{
        position: "absolute",
        left: CLAUDE.x - s / 2,
        top: -s / 2,
        width: s,
        height: s,
        borderRadius: "50%",
        background: "#000",
        opacity: k,
        transform: `scale(${(0.88 + 0.06 * k + 0.06 * wake + 0.03 * talk).toFixed(4)})`,
      }}
    >
      <Img src={staticFile(LOGOS.claude)} style={{ ...logo, filter: "grayscale(1) brightness(0.92)", opacity: 0.85 * (1 - wake) }} />
      <Img src={staticFile(LOGOS.claude)} style={{ ...logo, opacity: wake }} />
    </div>
  );
};
