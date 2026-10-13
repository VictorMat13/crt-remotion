import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, PARTS } from "./theme";
import { BLUR_WIN, FG_FADE, GLITCH, TRAVEL, W, H, clamp, cursorAt, fgCam } from "./r2/plan";
import { Dialog } from "./r2/Dialog";
import { Marks, ResolveIcon, Traces } from "./r2/Marks";
import { EditPage, Landing } from "./r2/EditPage";
import { MacCursor } from "./r2/glyphs";

// ===========================================================================
// DrP2Connect: 1080x1920 (9:16) @ 30fps, 180 frames (6.0s).
// VO (Victor's, never on screen): "Resolve's new 21.1 update lets you connect
// Claude or ChatGPT straight into the app to do the boring editing for you."
//
// CRT Scope style, 2.5D: a front plane (the marks, their traces, the dialog)
// in front of the real Resolve 21 Edit page, which stands behind it soft by
// depth. One continuous shot.
//   0-32    mid-action: packets already running down the Claude trace and the
//           ChatGPT trace; the traces converge into the Resolve icon, which
//           wakes on the first packet (8) and the real "AI Assistants
//           Configured" dialog opens out of it (exact strings, phone size).
//           The camera eases back from slightly close to frame it all.
//   30-103  the list rows light one by one as packets arrive: Claude Desktop
//           (61) and Claude Code (73) in coral, Codex in ChatGPT (87) in
//           white. Slow push in on the list. A plain arrow comes in and
//           presses OK (103, one soft glitch).
//   106-146 the dialog folds back into the icon; a coral packet drops out of
//           the icon and the camera dollies through the front plane into the
//           Edit page: the front plane zooms past and blurs away, the page
//           pulls into focus and the camera pushes in on the timeline.
//   146-180 the packet lands on the seam under SOUNDTRACK 1 (soft glitch)
//           and runs right along it; each B-roll clip it reaches is selected
//           (Resolve's outline round the V2 video and its linked A2 audio, in
//           coral). The camera trucks right with it, still moving on the last
//           frame. (Coral is lost on Resolve's orange V1/A1 clips, so the
//           action runs on the blue/green B-roll pairs.)
// ===========================================================================

export const DR_P2_DURATION = PARTS.r2.frames; // 180

const BG = "#050608";

const Front: React.FC<{ frame: number }> = ({ frame: f }) => {
  const cam = fgCam(f);
  const fx = cam.x;
  const fy = cam.y;
  const fade = interpolate(f, FG_FADE, [1, 0], { ...clamp, easing: TRAVEL });
  const blur = interpolate(f, [FG_FADE[0] - 6, FG_FADE[1]], [0, 14], clamp);
  if (fade <= 0.001) return null;
  const cur = cursorAt(f);
  return (
    <AbsoluteFill style={{ opacity: fade, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transform: `translate(${(W / 2 - fx).toFixed(2)}px, ${(H / 2 - fy).toFixed(2)}px) scale(${cam.z.toFixed(5)})`,
          transformOrigin: `${fx.toFixed(2)}px ${fy.toFixed(2)}px`,
        }}
      >
        <Dialog frame={f} />
        <Traces frame={f} />
        <ResolveIcon frame={f} />
        <Marks frame={f} />
        <MacCursor x={cur.x} y={cur.y} size={54} press={cur.press} opacity={cur.opacity} />
      </div>
    </AbsoluteFill>
  );
};

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <EditPage frame={f} />
      <Front frame={f} />
    </AbsoluteFill>
  );
};

export const DrP2Connect: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={GLITCH}>
        <AbsoluteFill style={{ backgroundColor: BG }}>
          <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
            <Scene />
          </CameraMotionBlur>
          {/* the packet's own traces stay out of the camera blur: thin lines smear dark */}
          <Landing frame={frame} />
        </AbsoluteFill>
      </CRT>
    </AbsoluteFill>
  );
};
