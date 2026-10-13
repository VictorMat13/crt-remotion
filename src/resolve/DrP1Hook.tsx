import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { CRT, HOOK_OVERLAY, PARTS } from "./theme";
import { HookOverlay } from "../invideo3/p1/HookOverlay";
import { GLITCH, camAt, sampleTime } from "./r1/rig";
import { Room } from "./r1/Room";
import { ClaudePlane, Flights, Stage, StripPlanes } from "./r1/World";
import { TimelinePanel, ViewerPanel } from "./r1/Panels";
import { Trace } from "./r1/Trace";

// ===========================================================================
// DrP1Hook: 1080x960 (9:8) @ 30fps, 240 frames (8.0s). HOOK of the DaVinci
// Resolve reel. VO (Victor's, never on screen): "I just watched someone turn
// hours of footage into a YouTube video by typing one sentence into DaVinci
// Resolve. But video editors don't have to worry about it yet."
//
// CRT Scope, 2.5D: Resolve's Edit page opened up in depth. The real timeline
// panel stands in front, the real record viewer panel behind it at the right,
// and where the source viewer would be, the source itself: two hours of the
// project's footage as one long strip of clips (real frames, Resolve clip
// style) receding to the horizon of the tube, the scope trace running along
// its top edge like a rail, the Claude mark on it.
//   0-60    beside the strip, looking down it (already moving on f0). The
//           coral pulse leaves the Claude mark and races down the rail; at
//           each best moment a Resolve marker drops, the frame flashes, and a
//           copy lifts off the strip, races out of the deep into the room and
//           drops onto the timeline (picks 8..56, deeper and deeper).
//   24-150  the camera follows the moments down onto the timeline panel: the
//           first drop creates track V4, the moments land on it one by one
//           (56..116), packing the cut from 01:00:00:00, the playhead riding
//           the packing edge, the readout rolling up to 01:01:00:00 (124).
//           Slow push in. Soft glitch as the cut completes (117).
//   120-240 crane up and back to the record viewer, which plays the cut from
//           the top (8x shuttle from 140: the fence, the truck, the cowboy)
//           while the camera orbits slowly, the strip still receding at the
//           left. Still moving on the last frame.
// The hook overlay (HOOK_OVERLAY) sits on top in screen space, outside the
// tube, so it stays crisp: frames 0-64. The graticule and the scope trace are
// thin lines, drawn outside the camera blur at the blur samples' mean time.
// ===========================================================================

export const DR_P1_DURATION = PARTS.r1.frames; // 240

const { fontFamily: ui } = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

const BG = "#040506";
/** 8-sample camera blur only on the big move down onto the timeline */
const BLUR_WIN: [number, number][] = []; // orchestrator: 8-sample blur rendered the fast crane dark (samples failing to paint); 1 sample throughout, like AcP5/AcP7

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <ViewerPanel cam={cam} frame={frame} font={ui} />
        <TimelinePanel cam={cam} frame={frame} font={ui} />
        <StripPlanes cam={cam} frame={frame} />
        <Flights cam={cam} frame={frame} font={ui} />
        <ClaudePlane cam={cam} />
      </Stage>
    </AbsoluteFill>
  );
};

export const DrP1Hook: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  const n = samples ?? (big ? 8 : 1);
  // the graticule and the trace are thin lines: drawn outside the blur, at the samples' mean time
  const t = sampleTime(frame, n);
  const cam = camAt(t);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={GLITCH}>
        <AbsoluteFill style={{ backgroundColor: BG }}>
          <Room cam={cam} />
          {/* the planes, on a transparent ground (the blur sums its samples, so the graticule shows through) */}
          <CameraMotionBlur shutterAngle={180} samples={n}>
            <Scene />
          </CameraMotionBlur>
          <Trace cam={cam} frame={t} />
        </AbsoluteFill>
      </CRT>
      <HookOverlay text={HOOK_OVERLAY} />
    </AbsoluteFill>
  );
};
