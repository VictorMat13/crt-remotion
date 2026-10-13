import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { CRT, PARTS } from "./theme";
import { BLUR_WIN, EDIT, GLITCH, H, W, appBright, camAt } from "./r3/plan";
import { EditApp } from "./r3/Timeline";
import { Flights, Strip } from "./r3/Strip";
import { ClaudeMark, Composer, Cursor } from "./r3/Front";
import { Overlay } from "./r3/Overlay";

// ===========================================================================
// DrP3Highlight: 1080x960 (9:8) @ 30fps, 285 frames (9.5s).
// VO (Victor's, never on screen): "So if you prompt something like 'Make a
// 60-second highlight from 2 hours of footage', the AI will pull the best
// moments and drop the cut onto your timeline while you can relax."
//
// CRT Scope style. One flat world: the real Resolve 21 Edit page (official
// press-kit screenshot, 5120x2880), one scope trace running through it.
//   0-63    mid-typing: the claude.ai composer floats over the media pool on
//           the trace and types HIGHLIGHT_PROMPT (18 characters already in on
//           f0), the person's voice green on the line. A plain arrow presses
//           send (54, soft glitch 57); the prompt runs into the Claude mark,
//           which wakes in coral and talks (and keeps talking to the end).
//   64-110  the composer closes; Claude's packet runs right along the trace
//           into the black band under the viewers, the camera following it and
//           tilting down onto the timeline. The source strip (2 hours of
//           footage: real frames of the same project cropped from the Edit and
//           Color shots, in Resolve's clip style) sits on the trace there.
//   100-228 the strip scrubs fast under Claude's head, slowing on each best
//           moment: a Resolve marker drops on it (blue, cyan, green, yellow,
//           pink, purple, blue), a copy pops out and flies down into the
//           "Video 4" drop zone. The drop creates track V4 (rows below slide
//           down, badge V4); the moments pack onto it from 01:00:00:00, the
//           playhead rides the packing edge and the real readout rolls up to
//           01:01:00:00, the cut's end sitting under the ruler's 01:01:00:00.
//           Slow push in. Soft glitch as the last clip lands (218).
//   222-285 the scrub settles, the head lifts off; the camera eases out and up
//           to the record viewer, which plays the cut (12x from the top: the
//           fence shot, the truck, the cowboy), its jog playhead running.
//           Still moving on the last frame.
// ===========================================================================

export const DR_P3_DURATION = PARTS.r3.frames; // 285

const { fontFamily: ui } = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

const BG = "#050608";

/** one camera for both planes: world px -> screen */
const World: React.FC<{ frame: number; children: React.ReactNode }> = ({ frame: f, children }) => {
  const c = camAt(f);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: EDIT.w,
        height: EDIT.h,
        transformOrigin: "0 0",
        transform: `translate(${(W / 2 - c.x * c.s).toFixed(2)}px, ${(H / 2 - c.y * c.s).toFixed(2)}px) scale(${c.s.toFixed(5)})`,
      }}
    >
      {children}
    </div>
  );
};

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {/* the app, dimmed (bright UI blooms in the tube): screenshot + its live changes + the source strip */}
      <AbsoluteFill style={{ filter: `brightness(${appBright(f).toFixed(3)})` }}>
        <World frame={f}>
          <EditApp frame={f} font={ui}>
            <Strip frame={f} />
            <Flights frame={f} font={ui} />
          </EditApp>
        </World>
      </AbsoluteFill>
      {/* Claude's side, undimmed: the composer and the mark on the trace, the person's arrow */}
      <AbsoluteFill>
        <World frame={f}>
          <Composer frame={f} font={ui} />
          <ClaudeMark frame={f} />
          <Cursor frame={f} />
        </World>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const DrP3Highlight: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={GLITCH}>
        <AbsoluteFill style={{ backgroundColor: BG }}>
          <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
            <Scene />
          </CameraMotionBlur>
          {/* the trace, Claude's scan head and Resolve's playhead stay out of the camera blur */}
          <Overlay frame={frame} />
        </AbsoluteFill>
      </CRT>
    </AbsoluteFill>
  );
};
