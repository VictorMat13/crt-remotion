import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { CRT, PARTS } from "./theme";
import { CURSOR_IN, CX, CY, GLITCH, P, PRESS, TRAVEL, WIN, camAt, clamp, type Cam } from "./p7/rig";
import { Graticule, Trace } from "./p7/Trace";
import { Row } from "./p7/Row";
import { ClaudeMark, MicMark } from "./p7/Marks";
import { Composer } from "./p7/Composer";
import { AppWindow, EXPORT_BTN } from "./p7/AppWindow";
import { MacCursor } from "./p7/glyphs";

// ===========================================================================
// AcP7WhereHeading: 1080x960 (9:8) @ 30fps, 300 frames (10.0s).
// VO (Victor's, never on screen): "And this is where everything's heading.
// You won't need to download and pay for apps anymore. You'll just tell AI
// what you need, and it'll build it for you, fully custom, with exactly the
// features you want."
//
// CRT Scope style, one continuous 2.5D shot (CSS perspective camera, depth of
// field per plane, no three.js). One scope trace runs through the front plane.
//   0-110    the downloads fall away: the twelve real Craft icons sit on the
//            trace, each with a download bar filling under it and its own wave
//            on the line. The camera opens close and oblique, already pulling
//            back and swinging round to face the line, while the row swings
//            back off the trace into depth (rising away, blur and haze by
//            distance); the bars stall and dim, the waves die, the line calms.
//            One soft glitch as the row lets go (60).
//   110-160  tell it: the green mic ring on the trace at the left; the
//            person's voice lights the line and every word leaves as a green
//            packet running right to the sleeping Claude mark, while the
//            claude.ai composer below transcribes it word by word.
//   160-300  built, exactly that: the last word lands, Claude wakes in coral
//            (glitch 161) and sends a packet; the camera trucks right with it
//            to where it turns down a hairline into a custom app window that
//            assembles panel by panel (great-wave.jpg from the real PhotoCraft
//            screenshot). Its feature list ticks on one by one, each fed by a
//            packet down the drop: Crop (the 16:9 box eases in, the crop
//            applies), Resize (3200 x 1800 ticks to 1920 x 1080, the picture
//            shrinks), Watermark ("© 2026" typed into the corner). Then the
//            person's own ask rides the line in green and Export PNG adds
//            itself; the arrow clicks it. The camera keeps pushing and
//            orbiting the window to the last frame.
// ===========================================================================

export const AC_P7_DURATION = PARTS.p7.frames; // 300

const { fontFamily: ui } = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const { fontFamily: mono } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const BG = "#050506";

/**
 * CameraMotionBlur stays at 1 sample (the P2-P5 lesson): the thin scope line
 * and the UI text smear into dim bands under an 8-sample 180deg shutter and the
 * CRT grade then crushes them to black. The truck is spread over 68 frames so
 * the pan stays under ~36px/frame. Pass `samples` to override for a test.
 */
const BLUR_SAMPLES = 1;

const Stage: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => {
  const tf = `translateZ(${P}px) rotateX(${cam.ph}rad) rotateY(${cam.th}rad) translate3d(${-cam.C.x}px, ${-cam.C.y}px, ${-cam.C.z}px)`;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: `${P}px`, perspectiveOrigin: `${CX}px ${CY}px` }}>
      <div style={{ position: "absolute", left: CX, top: CY, width: 0, height: 0, transformStyle: "preserve-3d", transformOrigin: "0 0", transform: tf }}>
        {children}
      </div>
    </div>
  );
};

/** the arrow, world px (tip): comes in from below right, clicks Export PNG, eases off */
const cursorAt = (f: number) => {
  // tip on the button's right end, clear of its label
  const target = { x: EXPORT_BTN.x + 104, y: EXPORT_BTN.y + 4 };
  const start = { x: WIN.left + WIN.w + 80, y: WIN.top + WIN.h + 150 };
  const rest = { x: target.x - 20, y: target.y + 60 };
  const legs: [number, number, { x: number; y: number }, { x: number; y: number }, number][] = [
    [CURSOR_IN, PRESS - 1, start, target, -36],
    [PRESS + 4, PRESS + 40, target, rest, 12],
  ];
  let p = start;
  for (const [a, b, from, to, bow] of legs) {
    const k = interpolate(f, [a, b], [0, 1], { ...clamp, easing: TRAVEL });
    if (k <= 0) break;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const arc = bow * Math.sin(Math.PI * k);
    p = { x: from.x + dx * k - (dy / len) * arc, y: from.y + dy * k + (dx / len) * arc };
  }
  const press = interpolate(f, [PRESS, PRESS + 2, PRESS + 5], [0, 1, 0], clamp);
  return { ...p, press, opacity: interpolate(f, [CURSOR_IN, CURSOR_IN + 5], [0, 1], clamp) };
};

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const cur = cursorAt(f);
  // cull the front plane to what the camera can reach
  const xa = Math.floor(cam.T.x - 1400);
  const xb = Math.ceil(cam.T.x + 1600);
  const showComposer = f < 230;
  const showWin = f >= 150;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Stage cam={cam}>
        {/* the front plane: the trace and everything that sits on it (flat, z = 0) */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, fontFamily: ui }}>
          <Graticule />
          <Trace f={f} x0={xa} x1={xb} />
          <MicMark f={f} />
          <ClaudeMark f={f} />
          {showComposer ? <Composer f={f} font={ui} /> : null}
          {showWin ? <AppWindow f={f} font={ui} mono={mono} /> : null}
          <MacCursor x={cur.x} y={cur.y} size={52} press={cur.press} opacity={cur.opacity} />
        </div>
        {/* the row of downloads, in depth */}
        <Row cam={cam} f={f} />
      </Stage>
    </AbsoluteFill>
  );
};

export const AcP7WhereHeading: React.FC<{ samples?: number }> = ({ samples }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <CRT glitchAt={GLITCH}>
      <AbsoluteFill style={{ backgroundColor: BG }}>
        <CameraMotionBlur shutterAngle={180} samples={samples ?? BLUR_SAMPLES}>
          <Scene />
        </CameraMotionBlur>
      </AbsoluteFill>
    </CRT>
  </AbsoluteFill>
);
