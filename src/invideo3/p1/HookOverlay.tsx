import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { EASE } from "../theme";

const { fontFamily: INTER } = loadInter("normal", { weights: ["800"], subsets: ["latin"] });

// ===========================================================================
// The hook overlay (Victor: "text over the motion graphic, right in the
// middle, for the first two seconds"). Screen space, dead centre of the
// 1080x960 frame, in front of the 3D world. White Inter 800 text with no box
// (Victor, Oct 13: no background, white, 40% smaller), a soft dark shadow only
// for legibility over the collage. No effects on the words.
// Fully visible on frame 0, holds through 54, eases out 54-64, gone after.
// ===========================================================================

export const OVERLAY_HOLD = 54;
export const OVERLAY_OUT = 64;
const DECEL = Easing.bezier(...EASE.decel);

/** two lines max: break after the first comma */
const linesOf = (text: string) => {
  const i = text.indexOf(",");
  return i >= 0 && i < text.length - 1 ? [text.slice(0, i + 1), text.slice(i + 1).trim()] : [text];
};

export const HookOverlay: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  if (frame >= OVERLAY_OUT) return null;
  const out = interpolate(frame, [OVERLAY_HOLD, OVERLAY_OUT], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: DECEL });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          maxWidth: 864,
          fontFamily: INTER,
          fontWeight: 800,
          fontSize: 38,
          lineHeight: 1.1,
          letterSpacing: -0.4,
          color: "#FFFFFF",
          textShadow: "0 2px 10px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.6)",
          textAlign: "center",
          opacity: 1 - out,
          transform: `scale(${(1 - 0.03 * out).toFixed(4)})`,
        }}
      >
        {linesOf(text).map((l, k) => (
          <div key={k}>{l}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
