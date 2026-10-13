import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { CRT, PARTS } from "./theme";
import { outerCam } from "./t4/plan";
import { Editor } from "./t4/Editor";
import { Sample } from "./t4/Sample";

// ===========================================================================
// MtP4Skill: 1080x1920 (9:16) @ 30fps, 240 frames (8.0s).
// VO (Victor's, never on screen): "A skill is simply a template instruction
// sheet you give the AI that lists things like the font choice, colors,
// background, and style that you want for each video."
//
// CRT Scope style. Top half: the real CRT Scope STYLE.md, big, in a dark
// editor. Bottom half: a 9:8 sample screen (the Claude mark and the PhotoCraft
// icon on a wire over the real storytold/photocraft repo row) that starts raw.
// One rule is selected every 36 frames and becomes part of the sample as the
// selection lands (t4/plan.ts):
//   0-36     1 Black screen:       the gray ground crushes to black
//   36-70    2 Phosphor halation:  the tube glow comes on (camera in on the marks)
//   70-104   3 Tube surface:       grille + scanlines + refresh band (close on the icon)
//   104-138  4 Convergence error:  red/blue split (pushing on into the icon's white engraving)
//   138-174  7 Oscilloscope trace: the camera pulls back wide as the beam sweeps the whole line
//   174-240  8 Dark UI panels:     the white repo row turns dark; the file drifts on
//            to the motion rules while the finished look plays and the camera eases out.
// The whole frame pushes in slowly the whole time; the sample's own camera
// travels between the beats. The sample (it carries the trace) is drawn
// outside the motion blur; the series CRT wraps everything.
// ===========================================================================

export const MT_P4_DURATION = PARTS.t4.frames; // 240

const { fontFamily: UI_FONT } = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const { fontFamily: MONO_FONT } = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] });

const BG = "#050608";

const World: React.FC<{ f: number; children: React.ReactNode }> = ({ f, children }) => {
  const { width, height } = useVideoConfig();
  const cam = outerCam(f);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1080,
        height: 1920,
        transform: `translate(${width / 2 - cam.x}px, ${height / 2 - cam.y}px) scale(${cam.z})`,
        transformOrigin: `${cam.x}px ${cam.y}px`,
      }}
    >
      {children}
    </div>
  );
};

const EditorLayer: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <World f={f}>
        <Editor f={f} ui={UI_FONT} mono={MONO_FONT} />
      </World>
    </AbsoluteFill>
  );
};

export const MtP4Skill: React.FC<{ samples?: number }> = ({ samples }) => {
  const f = useCurrentFrame();
  return (
    <CRT>
      <AbsoluteFill style={{ backgroundColor: BG }}>
        <CameraMotionBlur shutterAngle={180} samples={samples ?? 1}>
          <EditorLayer />
        </CameraMotionBlur>
        <World f={f}>
          <Sample f={f} ui={UI_FONT} />
        </World>
      </AbsoluteFill>
    </CRT>
  );
};
