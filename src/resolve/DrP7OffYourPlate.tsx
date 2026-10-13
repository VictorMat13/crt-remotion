import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, PARTS } from "./theme";
import { BLUR_WIN, EDIT, GLITCH, H, PAGE_BRIGHT, W, camAt } from "./r7/plan";
import { ClaudeSelections, EditPage } from "./r7/Page";
import { JobCards, QueuePanel } from "./r7/Queue";
import { Overlay } from "./r7/Overlay";

// ===========================================================================
// DrP7OffYourPlate: 1080x960 (9:8) @ 30fps, 135 frames (4.5s).
// VO (Victor's, never on screen): "Basically, it's there to take work off
// your plate, not take you out of the process."
//
// CRT Scope. One flat world: the real Resolve 21 Edit page (official
// press-kit screenshot, 5120x2880), the scope trace running along its empty
// "Video 4" drop zone, and a floating Render Queue panel (the Deliver page's
// Render Settings look, real preset icons and names) at the timeline's right.
//   0-46    pushed in on the timeline, mid-action: the editor drags their
//           selected B-roll clip a nudge right, their green playhead scrubs;
//           a coral copy of another B-roll clip is already lifting off V2
//           (H.265 Master). It rides the trace right, the camera following it
//           to the queue, where ProRes 422 HQ is rendering; it docks as job 2
//           (soft glitch on landing).
//   40-80   the queue, close: ProRes 422 HQ hits 100%, H.265 Master starts;
//           a third clip lifts off the timeline at the left and docks
//           (H.264 Master). The playhead runs in and out of frame on the left.
//   60-118  the camera pulls back to the two-shot: the editor's timeline on
//           the left, still theirs (their arrow comes back and fine-tunes the
//           clip back left, the playhead keeps scrubbing), the queue on the
//           right. H.265 Master finishes (soft glitch), H.264 Master starts.
//   100-134 a fourth job (YouTube 1080p) lifts off and rides in, docking on
//           the last frames; the camera is still dollying out, the playhead
//           and the arrow still moving, H.264 Master still filling.
// ===========================================================================

export const DR_P7_DURATION = PARTS.r7.frames; // 135

const BG = "#050608";

/** one camera for both planes: world px -> screen */
const World: React.FC<{ frame: number; children: React.ReactNode }> = ({ frame, children }) => {
  const c = camAt(frame);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: EDIT.w,
        height: EDIT.h,
        transformOrigin: "0 0",
        transform: `translate(${(W / 2 - c.x * c.z).toFixed(2)}px, ${(H / 2 - c.y * c.z).toFixed(2)}px) scale(${c.z.toFixed(5)})`,
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
      {/* the app, dimmed (bright UI blooms in the tube) */}
      <AbsoluteFill style={{ filter: `brightness(${PAGE_BRIGHT})` }}>
        <World frame={f}>
          <EditPage frame={f} />
        </World>
      </AbsoluteFill>
      {/* Claude's side, undimmed: its selections, the queue, the job cards */}
      <AbsoluteFill>
        <World frame={f}>
          <ClaudeSelections frame={f} />
          <QueuePanel frame={f} />
          <JobCards frame={f} />
        </World>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const DrP7OffYourPlate: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={GLITCH}>
        <AbsoluteFill style={{ backgroundColor: BG }}>
          <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
            <Scene />
          </CameraMotionBlur>
          {/* the trace, the editor's playhead and arrow stay out of the camera blur */}
          <Overlay frame={frame} />
        </AbsoluteFill>
      </CRT>
    </AbsoluteFill>
  );
};
