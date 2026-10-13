import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, HOOK_OVERLAY, PARTS } from "./theme";
import { HookOverlay } from "../invideo3/p1/HookOverlay";
import { BLUR_WIN, GLITCH, SCREENS, TERM_C, camAt, project } from "./t1/rig";
import { Floor } from "./t1/Floor";
import { ScreenPlane, Stage, TerminalPlane } from "./t1/Planes";

// ===========================================================================
// MtP1Hook: 1080x960 (9:8) @ 30fps, 190 frames (6.3s). HOOK of the "3 Tips
// for Better Motion Graphics with AI" reel. VO (Victor's, never on screen):
// "I made every graphic in this video by typing to an AI. These three tips
// are why they don't look like AI made them."
//
// CRT Scope, "this reel's own graphics". One continuous CSS-3D shot inside the
// tube. In front, Victor's Claude Code terminal (T2's look) hangs from the
// near end of the scope trace, leaning back to face the lens; behind it,
// eight screens stand on the trace in real depth (perspective, per-plane
// depth of field, parallax), each holding one of his REAL delivered graphics
// from the ArtCraft, DaVinci Resolve and Remotion Tips reels (trimmed copies
// in public/motiontips/t1/), dark (a dim afterimage) until the pulse reaches
// them.
//   0-50    the prompt arrives word by word (his voice green on the trace);
//           the camera arcs slowly around the terminal (parallax against the
//           dark row), the prompt at reading size in the lower half
//   50-118  Enter: a coral pulse leaves the terminal's top edge and races down
//           the trace; the camera rises over the terminal and dives after it;
//           each screen powers on like an old CRT as the pulse arrives (a
//           bright line, then the picture opens) and plays
//   92-190  the last four light in a fast run; the camera cranes up high over
//           the whole lit row and settles into a slow orbit around its middle,
//           still turning on the last frame, packets trickling down the line
// The rail and graticule are drawn sharp outside the motion blur, at the
// blur's mean sample time so they stay registered with the planes. The hook
// overlay (HOOK_OVERLAY) sits on top in screen space, outside the tube:
// frames 0-64.
// ===========================================================================

export const MT_P1_DURATION = PARTS.t1.frames; // 190

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  // painter order inside the 3D context is resolved by the compositor; feed it far to near anyway
  const planes = [
    ...SCREENS.map((s) => ({ d: project(cam, s.c).d, el: <ScreenPlane key={`s${s.i}`} s={s} cam={cam} frame={frame} /> })),
    { d: project(cam, TERM_C).d, el: <TerminalPlane key="term" cam={cam} frame={frame} /> },
  ].sort((a, b) => b.d - a.d);
  return (
    <AbsoluteFill>
      <Stage cam={cam}>{planes.map((p) => p.el)}</Stage>
    </AbsoluteFill>
  );
};

export const MtP1Hook: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  const n = samples ?? (big ? 8 : 1);
  // CameraMotionBlur renders its children at f + 1 - 0.5 * k / n (k = 1..n): match the mean
  const tSharp = frame + 1 - (n + 1) / (4 * n);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={GLITCH}>
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
          <Floor cam={camAt(tSharp)} frame={tSharp} />
          <CameraMotionBlur shutterAngle={180} samples={n}>
            <Scene />
          </CameraMotionBlur>
        </AbsoluteFill>
      </CRT>
      <HookOverlay text={HOOK_OVERLAY} />
    </AbsoluteFill>
  );
};
