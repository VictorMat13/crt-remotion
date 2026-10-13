import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, PARTS } from "./theme";
import { BLUR_WIN, GLITCH, camAt } from "./r5/rig";
import { World } from "./r5/World";
import { Chrome } from "./r5/Chrome";

// ===========================================================================
// DrP5CanDo: 1080x960 (9:8) @ 30fps, 150 frames (5.0s).
// VO (Victor's, never on screen): "It can color grade your edits, trim your
// footage, add subtitles, organize assets, and a whole lot more."
// (Subtitles are not in any source: never shown. The camera is travelling
// between pages on those words.)
//
// CRT Scope. One continuous camera over a wall of six real Resolve 21 pages
// (official press-kit shots): Cut, Fusion, Fairlight above; Photo, Edit,
// Color below. Resolve's real page bar is the frame's chrome at the foot, the
// scope trace under it with Claude's coral packet doing the work; the cell of
// the page being worked on is lit (the real lit cell from that page's shot).
//   0-34    Color page, pushed in on the HDR Color Wheels, already trucking
//           left: the pucks drift into a warm/teal look (Global + Highlight
//           already moving on f0, then Light, then Shadow) and their X/Y
//           readouts tick. The packet talks under Color.
//   30-56   the camera whips left onto the Edit page's timeline; the packet
//           runs to Edit, which lights (47, soft glitch).
//   50-86   trim: Claude's coral bracket takes the tail of the A002 B-roll
//           pair (V2 + its linked A2), it trims in 6 s (144 px at 24 px/s),
//           the clips after it ripple left. The camera follows the edge.
//   78-106  long whip up the Edit page to the media pool (on "add subtitles").
//   97-123  organize: the eight B003 clips re-sort from shuffled into name
//           order C001..C008 (day to night), staggered 2f.
//   106-149 pull back: dolly out at the pool, then up into Fusion (lights 132,
//           soft glitch) and across to Fairlight (lights 146), the wall of
//           pages filling the frame; still travelling on the last frame.
// ===========================================================================

export const DR_P5_DURATION = PARTS.r5.frames; // 150

const BG = "#050608";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <World cam={camAt(frame)} frame={frame} />
    </AbsoluteFill>
  );
};

export const DrP5CanDo: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={GLITCH}>
        <AbsoluteFill style={{ backgroundColor: BG }}>
          <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
            <Scene />
          </CameraMotionBlur>
          {/* the page bar + trace are chrome: out of the camera blur (thin lines smear dark) */}
          <Chrome frame={frame} />
        </AbsoluteFill>
      </CRT>
    </AbsoluteFill>
  );
};
