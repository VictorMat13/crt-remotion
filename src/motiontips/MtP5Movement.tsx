import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, PARTS } from "./theme";
import { BLUR_WIN, GLITCH, camAt, worldTf } from "./t5/plan";
import { Grid, Trace } from "./t5/Monitor";
import { Slideshow } from "./t5/Slideshow";

// ===========================================================================
// MtP5Movement: 1080x960 (9:8) @ 30fps, 180 frames (6.0s).
// VO (Victor's, never on screen): "A huge mistake a lot of new users make is
// that they don't tell the AI what kind of movement they want."
//
// CRT Scope. The scene is the problem, the shot never is: a "slideshow" of
// real UI cards (Resolve, CADCraft, VectorCraft, LightCraft, SoundCraft, then
// FilmCraft, Resolve Color, PhotoCraft, FilmCraft) that only fade in and sit
// there, while the scope trace dies like a bedside monitor.
//   0-40    the last heartbeats: ink ECG complexes on the line, each one
//           smaller; the sweep head records them as it runs right; the fourth
//           card is mid-fade, the fifth fades into the last empty slot
//   40-146  flatline: the next sweeps paint flat line over the old beats
//           (erase bar ahead of the head); the slideshow keeps going, one card
//           fading in over another every 24 frames; nothing in it moves. The
//           camera creeps in and across the whole time, the ECG grid scrolls.
//   146-180 the kick: one green beat on the sweep (soft glitch), the line comes
//           alive outward from it in green, a second beat follows, and the
//           camera eases into a push toward it as the cut to T6 approaches.
// ===========================================================================

export const MT_P5_DURATION = PARTS.t5.frames; // 180

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: worldTf(camAt(f)) }}>
        <Slideshow f={f} />
      </div>
    </AbsoluteFill>
  );
};

export const MtP5Movement: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = frame >= BLUR_WIN[0] && frame <= BLUR_WIN[1];
  const n = samples ?? (big ? 8 : 1);
  // CameraMotionBlur renders its samples at frame + 0.5 .. + 1 (mean ~ +0.5 for 1 sample,
  // ~ +0.72 for 8); the sharp grid and trace follow the same instant so they stay glued to the cards
  const tf = frame + (n > 1 ? 0.72 : 0.5);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={GLITCH}>
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
          <Grid f={tf} />
          <CameraMotionBlur shutterAngle={180} samples={n}>
            <Scene />
          </CameraMotionBlur>
          <Trace f={tf} />
        </AbsoluteFill>
      </CRT>
    </AbsoluteFill>
  );
};
