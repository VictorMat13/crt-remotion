import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, PARTS } from "./theme";
import { SWITCH_AT, camAt } from "./r4/rig";
import { Floor, Stack } from "./r4/Stack";
import { PageBar, Trace } from "./r4/PageBar";

// ===========================================================================
// DrP4Hours: 1080x1920 (9:16) @ 30fps, 135 frames (4.5s).
// VO (Victor's, never on screen): "This same task would've taken hours
// before, and we're barely scratching the surface here."
//
// CRT Scope, 2.5D. One continuous shot inside the tube:
//   0-30    pushed in on the real Edit page's timeline (official Resolve 21
//           press shot, 1.3x) with Resolve's real page bar under it (Edit
//           active), lined up exactly as in the app; the scope trace runs
//           under the bar and the coral packet talks on it under the Edit
//           cell. The camera is already pulling back on f0.
//   0-126   the long eased pull-back: the page shrinks off its page bar (the
//           bar stays as the frame's chrome) into a stack of the
//           six real pages standing in depth, each a step higher, zig-zag:
//           Edit, Fusion, Color, Fairlight, Cut, Photo (depth of field by
//           distance). From ~36 the camera also orbits, so the pages slide
//           past each other.
//   26-134  the packet runs right along the trace; each cell it reaches
//           becomes the active page (the real lit cell from that page's own
//           shot): Fusion ~52 (one soft glitch), Color ~76, Fairlight ~102.
//           The matching page in the stack switches on and the focus racks
//           back to it, deeper each time. Cut and Photo stay dim at the back.
//   126-134 orbit + drift still travelling, the packet leaving on the right.
// ===========================================================================

export const DR_P4_DURATION = PARTS.r4.frames; // 135

const BG = "#050608";
const GLITCH = [SWITCH_AT.fusion];
/** 8-sample camera blur only while the pull-back is fast; the trace + bar stay out of it */
const BLUR_WIN: [number, number][] = []; // orchestrator: 8-sample blur flickered dark on alternate frames in the MP4; 1 sample throughout

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Floor cam={cam} />
      <Stack cam={cam} frame={frame} />
    </AbsoluteFill>
  );
};

export const DrP4Hours: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={GLITCH}>
        <AbsoluteFill style={{ backgroundColor: BG }}>
          <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
            <Scene />
          </CameraMotionBlur>
          <PageBar frame={frame} />
          <Trace frame={frame} />
        </AbsoluteFill>
      </CRT>
    </AbsoluteFill>
  );
};
