import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, PARTS } from "./theme";
import { useQuoteLayout, type QLayout } from "./r6/layout";
import { BLUR_WIN, GLITCH, H, QUOTE, QUOTE_TEXT, SEL_GREEN, TASKS, W, fgCam } from "./r6/plan";
import { Release } from "./r6/Release";
import { ColorPage } from "./r6/ColorPage";
import { Overlay } from "./r6/Overlay";

// ===========================================================================
// DrP6Ceo: 1080x1920 (9:16) @ 30fps, 240 frames (8.0s).
// VO (Victor's, never on screen): "And for the video editors watching this,
// I know it sounds intimidating, but their own CEO has stated the update was
// introduced to free editors from boring tasks so they can focus on the
// creative decisions that actually matter." (8s cap: covers the start.)
//
// CRT Scope style, 2.5D: Blackmagic's press release (FG plane) in front of
// the real Resolve 21 Color page (BG plane, soft by depth). One shot.
//   0-96    mid-typing: the release (official Blackmagic logo, the real
//           dateline "IBC 2026, Amsterdam, Netherlands - Tuesday, September
//           8, 2026") with Grant Petty's quote typing out BIG (exact text),
//           then his name. Claude's mark sits on its scope trace above the
//           release, idling. The camera pulls back and down as it fills.
//   86-128  a plain arrow drag-selects "repetitive tasks such as create
//           highlight edits, organizing media or batch rendering" (coral,
//           drawn like a text field's selection).
//   127-182 a coral trace draws out of the selection up into the mark; the
//           three task names lift off the page and ride it into Claude (one
//           soft glitch as the first lands); each leaves along Claude's line
//           as a packet. The camera tilts up with them.
//   158-188 the arrow selects "focus on creative decisions" (the person's
//           green; the coral selection clears, like any text field).
//   182-228 a green trace runs out of the release and down; the camera tilts
//           down through the front plane (the release flies up out of frame)
//           onto the Color page, which pulls into focus; the green packet
//           lands on the Global wheel (soft glitch, 216).
//   217-240 the same arrow grabs the wheel's puck and drags it warm; the
//           viewer's picture warms with it; the person's voice on the green
//           line. Still moving on the last frame.
// ===========================================================================

export const DR_P6_DURATION = PARTS.r6.frames; // 240

const BG = "#050608";
const KEEP: [number, number][] = [...TASKS, SEL_GREEN];

const Scene: React.FC<{ lay: QLayout }> = ({ lay }) => {
  const f = useCurrentFrame();
  const c = fgCam(f);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <ColorPage frame={f} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transform: `translate(${(W / 2 - c.x).toFixed(2)}px, ${(H / 2 - c.y).toFixed(2)}px) scale(${c.z.toFixed(5)})`,
          transformOrigin: `${c.x.toFixed(2)}px ${c.y.toFixed(2)}px`,
        }}
      >
        <Release frame={f} lay={lay} />
      </div>
    </AbsoluteFill>
  );
};

export const DrP6Ceo: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const lay = useQuoteLayout(QUOTE_TEXT, QUOTE.weight, QUOTE.font, QUOTE.w, KEEP);
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {lay ? (
        <CRT glitchAt={GLITCH}>
          <AbsoluteFill style={{ backgroundColor: BG }}>
            <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
              <Scene lay={lay} />
            </CameraMotionBlur>
            {/* traces, the lifted names, Claude's mark and the arrow stay out of the camera blur */}
            <Overlay frame={frame} lay={lay} />
          </AbsoluteFill>
        </CRT>
      ) : null}
    </AbsoluteFill>
  );
};
