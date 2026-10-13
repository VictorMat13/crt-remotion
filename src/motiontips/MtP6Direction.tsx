import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, PARTS } from "./theme";
import { BLUR_WIN, GLITCH, OUT_C, VP, innerCam, outerCam } from "./t6/plan";
import { Terminal } from "./t6/Terminal";
import { StageBack, StageFront } from "./t6/Stage";

// ===========================================================================
// MtP6Direction: 1080x1920 (9:16) @ 30fps, 240 frames (8.0s).
// VO (Victor's, never on screen): "Rather than going 'Make me a well-edited
// video', you want real direction. Give it specific prompts like 'track this
// object as it moves' or 'cut out the awkward pauses in this segment'."
//
// CRT Scope. Victor's Claude Code terminal on top (the T2 look); below it, a
// framed viewport, the video Claude is making, with its own camera.
//   0-62    "Make me a well-edited video" is typed, sits, and is deleted word
//           by word. Below, T5's problem: real UI cards sitting still on the
//           trace, the camera only creeping.
//   67-98   "track this object as it moves" is typed and sent.
//   99-178  Claude's coral packet runs to the Great Wave card and selects it;
//           the card glides along the trace and the camera tracks it while
//           the mosaic of real cards streams past (soft glitch on Enter).
//   124-166 "cut out the awkward pauses in this segment" is typed and sent.
//   164-240 the camera travels on to a real audio clip (worried-finance.mp3,
//           its real RMS + peak envelope) sitting on the trace; Claude's coral
//           blades land on the edges of its three real pauses (soft glitch),
//           the pauses drop out and the speech ripples left until it butts;
//           the camera follows the shrinking clip and pushes in to the end.
// The trace, the card, the clip and the waveform are drawn outside the motion
// blur (thin lines smear); only the mosaic behind them is blurred.
// ===========================================================================

export const MT_P6_DURATION = PARTS.t6.frames; // 240

const BG = "#050608";

/** the outer camera: a slow push on the pair (terminal + viewport) */
const Outer: React.FC<{ f: number; children: React.ReactNode }> = ({ f, children }) => {
  const c = outerCam(f);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transformOrigin: "0 0",
          transform: `translate(${OUT_C.x}px, ${OUT_C.y}px) scale(${c.z.toFixed(5)}) translate(${(-c.x).toFixed(2)}px, ${(-c.y).toFixed(2)}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

const Back: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Outer f={f}>
        <StageBack cam={innerCam(f)} frame={f} />
      </Outer>
    </AbsoluteFill>
  );
};

const Front: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Outer f={f}>
      <StageFront cam={innerCam(f)} frame={f} />
      {/* the viewport's frame */}
      <div style={{ position: "absolute", left: VP.left, top: VP.top, width: VP.w, height: VP.h, borderRadius: 16, border: "2px solid rgba(233,231,226,0.5)", boxSizing: "border-box" }} />
      <Terminal frame={f} />
    </Outer>
  );
};

export const MtP6Direction: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  return (
    <CRT glitchAt={GLITCH}>
      <AbsoluteFill style={{ backgroundColor: BG }}>
        <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
          <Back />
        </CameraMotionBlur>
        <Front />
      </AbsoluteFill>
    </CRT>
  );
};
