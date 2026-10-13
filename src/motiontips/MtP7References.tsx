import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { CRT, PARTS } from "./theme";
import { FILES, GLITCH, H, W, camAt, tilesFast } from "./t7/plan";
import { Composer } from "./t7/Composer";
import { Badge, CardChrome, Thumb } from "./t7/Attachment";
import { Trace } from "./t7/Trace";

// ===========================================================================
// MtP7References: 1080x960 (9:8) @ 30fps, 185 frames (6.2s).
// VO (Victor's, never on screen): "This can already give you pretty good
// results, but if you want the video to be perfect, give your AI references
// to everything."
//
// CRT Scope style. One continuous shot over one scope trace and the claude.ai
// composer under it, the prompt already in the box ("make it the CRT scope
// style."). Six real files from this pipeline are dragged in one after
// another, each as its own thumbnail riding the trace in from the left on a
// green packet, curving down off the line into the next free slot, where the
// claude.ai attachment card builds around it (real file name, then the type
// badge): photocraft-hero.webp, claude.svg, contact-sheet.png,
// Adobe_Photoshop_CC_icon.svg, example - fish 8 hook.mp4 (plays),
// bmd-resolve21-Color-hires.png. They come a little faster each time; the
// sixth lands on "everything" (one soft glitch). The camera trucks right with
// the growing row and pushes in on it the whole way, still pushing at the end
// while the reference video plays in its card and packets keep running.
// Layers: composer + cards (1 sample), thumbnails (8 samples while a file is
// moving fast), type badges, and the trace on top, sharp.
// ===========================================================================

export const MT_P7_DURATION = PARTS.t7.frames; // 185

const { fontFamily: ui } = loadInter("normal", { weights: ["400", "500"], subsets: ["latin"] });

const BG = "#050506";

const World: React.FC<{ f: number; children: React.ReactNode }> = ({ f, children }) => {
  const cam = camAt(f);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: W,
        height: H,
        transform: `translate(${W / 2 - cam.x}px, ${H / 2 - cam.y}px) scale(${cam.z})`,
        transformOrigin: `${cam.x}px ${cam.y}px`,
      }}
    >
      {children}
    </div>
  );
};

const Base: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <World f={f}>
        <Composer frame={f} font={ui} />
        {FILES.map((_, i) => (
          <CardChrome key={i} i={i} f={f} font={ui} />
        ))}
      </World>
    </AbsoluteFill>
  );
};

const Tiles: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <World f={f}>
        {FILES.map((_, i) => (
          <Thumb key={i} i={i} f={f} />
        ))}
      </World>
    </AbsoluteFill>
  );
};

const Badges: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <World f={f}>
        {FILES.map((_, i) => (
          <Badge key={i} i={i} f={f} font={ui} />
        ))}
      </World>
    </AbsoluteFill>
  );
};

const Overlay: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <World f={f}>
        <Trace frame={f} />
      </World>
    </AbsoluteFill>
  );
};

export const MtP7References: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const tileSamples = samples ?? (tilesFast(frame) ? 8 : 1);
  // every layer goes through CameraMotionBlur so all of them sample the same sub-frame time
  return (
    <CRT glitchAt={GLITCH}>
      <AbsoluteFill style={{ backgroundColor: BG }}>
        <CameraMotionBlur shutterAngle={180} samples={1}>
          <Base />
        </CameraMotionBlur>
        <CameraMotionBlur shutterAngle={180} samples={tileSamples}>
          <Tiles />
        </CameraMotionBlur>
        <CameraMotionBlur shutterAngle={180} samples={1}>
          <Badges />
        </CameraMotionBlur>
        <CameraMotionBlur shutterAngle={180} samples={1}>
          <Overlay />
        </CameraMotionBlur>
      </AbsoluteFill>
    </CRT>
  );
};
