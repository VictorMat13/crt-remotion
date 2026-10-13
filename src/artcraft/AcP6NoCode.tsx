import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { BUILD_PROMPT, CRT, LOGOS, PARTS, PH } from "./theme";
import { Scope, type ScopeBump } from "./kit/Scope";
import {
  BLUR_WIN,
  BUBBLE,
  BURSTS,
  CLICK_EXPORT,
  CLICK_W,
  CURSOR_IN,
  DECEL,
  DRAG,
  ENTER,
  EXPORT,
  GLITCH,
  KEYS,
  MARK,
  PKT_OUT,
  PRESS,
  RELEASE,
  SELECT,
  STAGE,
  STAGE_H0,
  STREAM,
  TRACE_INK,
  TRACE_Y,
  TRAVEL,
  WHITE_RGB,
  W_IN,
  CTRL,
  burst,
  camAt,
  clamp,
} from "./p6/plan";
import { ArtifactPanel, handleBR } from "./p6/Artifact";
import { MacCursor } from "./p6/glyphs";
import { C, UI_FONT } from "./p6/ui";

// ===========================================================================
// AcP6NoCode: 1080x1920 (9:16) @ 30fps, 240 frames (8.0s).
// VO (Victor's, never on screen): "And you can do this even if you've never
// written a line of code. If you can describe what you want, Claude can make
// a simple version of it."
//
// CRT Scope style, claude.ai dark. Continues P5: the prompt has been sent.
// Top: BUILD_PROMPT in the user bubble; under it the scope trace with the
// Claude mark on it, talking in coral while it works. Below: the artifact
// panel, big. One continuous shot, the camera always pushing:
//   0-88     the code writes itself: the real single-file HTML/JS crop and
//            resize editor streams into the Code view in bursts, far too fast
//            to read and dimmed; each burst is a coral pulse on the trace.
//   88-150   described, so built: the toggle flips Code -> Preview (one soft
//            glitch) with an eased push; the app rises in: great-wave.jpg on
//            the stage with the crop box, Width / lock / Height, Export PNG.
//   150-240  it works: a plain arrow drags the bottom-right crop handle (the
//            box eases, the fields tick to 2700 x 1800), release applies the
//            crop; it double-clicks Width and types 1080 (Height follows by
//            ratio to 720); it clicks Export PNG and the download chip lands.
//            The trace turns green while the person uses the app. Slow push.
// ===========================================================================

export const AC_P6_DURATION = PARTS.p6.frames; // 240

const CORAL = PH.claudeRgb;
const GREEN = PH.userRgb;

// ---------------------------------------------------------------- cursor (world px, tip)
const W_TARGET = { x: W_IN.left + 190, y: CTRL.top + 62 };
const EXP_TARGET = { x: EXPORT.left + EXPORT.w - 18, y: EXPORT.top + 64 };
const START = { x: 1010, y: 1600 };
const REST = { x: 312, y: 1606 };

type P = { x: number; y: number };
const leg = (f: number, a: number, b: number, from: P, to: P, bow: number): P | null => {
  const k = interpolate(f, [a, b], [0, 1], { ...clamp, easing: TRAVEL });
  if (f < a) return null;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const arc = bow * Math.sin(Math.PI * k); // a hand moves a mouse in a slight arc
  return { x: from.x + dx * k - (dy / len) * arc, y: from.y + dy * k + (dx / len) * arc };
};

const cursorAt = (f: number) => {
  const h0 = { x: STAGE.left + STAGE.w, y: STAGE.top + STAGE_H0 };
  const hEnd = handleBR(RELEASE);
  let p: P = START;
  const l1 = leg(f, CURSOR_IN, PRESS - 1, START, h0, 46);
  if (l1) p = l1;
  if (f >= DRAG[0]) p = f <= RELEASE ? handleBR(f) : hEnd;
  const l3 = leg(f, RELEASE + 4, CLICK_W - 1, hEnd, W_TARGET, -34);
  if (l3) p = l3;
  const l4 = leg(f, KEYS[3] + 2, CLICK_EXPORT - 1, W_TARGET, EXP_TARGET, 18);
  if (l4) p = l4;
  const l5 = leg(f, CLICK_EXPORT + 5, CLICK_EXPORT + 34, EXP_TARGET, REST, -16);
  if (l5) p = l5;
  const click = (at: number) => interpolate(f, [at, at + 2, at + 5], [0, 1, 0], clamp);
  const held = interpolate(f, [PRESS, PRESS + 2, RELEASE, RELEASE + 3], [0, 0.7, 0.7, 0], clamp);
  const press = Math.max(held, click(CLICK_W), click(SELECT), click(CLICK_EXPORT));
  return { ...p, press, opacity: interpolate(f, [CURSOR_IN, CURSOR_IN + 6], [0, 1], clamp) };
};

// ---------------------------------------------------------------- the Claude mark's spin while it writes
const SPIN = (() => {
  const out: number[] = [];
  let a = 0;
  for (let i = 0; i <= 280 * 4; i++) {
    const f = -20 + i / 4;
    const active = interpolate(f, [STREAM[1] - 4, STREAM[1] + 26], [1, 0], { ...clamp, easing: DECEL });
    a += ((1.0 + 2.6 * burst(f)) * active) / 4;
    out.push(a);
  }
  return out;
})();
const spinAt = (f: number) => {
  const x = Math.max(0, Math.min(SPIN.length - 1, (f + 20) * 4));
  const i = Math.floor(x);
  return SPIN[i] + (SPIN[Math.min(i + 1, SPIN.length - 1)] - SPIN[i]) * (x - i);
};

// ---------------------------------------------------------------- trace
const traceBumps = (f: number, curX: number): ScopeBump[] => {
  const b: ScopeBump[] = [];
  // Claude talks while it writes, harder on each burst; then settles to a live hum
  const work = interpolate(f, [STREAM[1] - 2, STREAM[1] + 34], [1, 0], { ...clamp, easing: DECEL });
  const mod = 0.8 + 0.2 * Math.sin(f * 0.17);
  const voice = (12 + 15 * burst(f)) * work + 4.5 * mod * (1 - work);
  b.push({ x: MARK.x, amp: voice, sigma: 74, rgb: CORAL });
  // each burst leaves the mark as a packet along the line
  for (const s of BURSTS) {
    const u = interpolate(f, [s, s + 22], [0, 1], { ...clamp, easing: TRAVEL });
    const env = interpolate(f, [s, s + 3, s + 17, s + 22], [0, 1, 1, 0], clamp);
    if (env > 0.01) b.push({ x: MARK.x + 70 + (1240 - MARK.x - 70) * u, amp: 17 * env, sigma: 48, rgb: CORAL });
  }
  // the person: green where the hand is
  const hover = interpolate(f, [PRESS - 8, PRESS], [0, 1], clamp) * 6;
  const drag = interpolate(f, [PRESS, PRESS + 4, RELEASE, RELEASE + 10], [0, 1, 1, 0], clamp) * 17 * (0.8 + 0.2 * Math.sin(f * 0.21));
  const blip = (at: number, a: number, len = 12) => interpolate(f, [at, at + 2, at + len], [0, a, 0], clamp);
  const keys = Math.max(blip(CLICK_W, 15), blip(SELECT, 15), ...KEYS.map((k) => blip(k, 14, 9)), blip(CLICK_EXPORT, 22, 16));
  const tail = interpolate(f, [RELEASE, RELEASE + 10], [0, 1], clamp) * 5 * (0.8 + 0.2 * Math.sin(f * 0.19 + 1));
  const g = hover + drag + keys + tail;
  if (g > 0.3) b.push({ x: curX, amp: g, sigma: 66, rgb: GREEN });
  // the download leaves along the line
  const u = interpolate(f, PKT_OUT, [0, 1], { ...clamp, easing: TRAVEL });
  const env = interpolate(f, [PKT_OUT[0], PKT_OUT[0] + 3, PKT_OUT[1] - 4, PKT_OUT[1]], [0, 1, 1, 0], clamp);
  if (env > 0.01) b.push({ x: EXP_TARGET.x + (1300 - EXP_TARGET.x) * u, amp: 18 * env, sigma: 46, rgb: GREEN });
  return b;
};

const mixInk = (t: number) => {
  const w = WHITE_RGB.split(",").map(Number);
  const g = GREEN.split(",").map(Number);
  const c = w.map((v, i) => Math.round(v + (g[i] - v) * t));
  return `rgba(${c.join(",")},${(0.5 + 0.12 * t).toFixed(3)})`;
};

// ---------------------------------------------------------------- scene
const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cam = camAt(f);
  const fx = cam.x + 3 * Math.sin(f / 40);
  const fy = cam.y + 2.5 * Math.sin(f / 53);
  const z = cam.z;
  const cur = cursorAt(f);
  const green = interpolate(f, [PRESS - 6, PRESS + 8], [0, 1], { ...clamp, easing: ENTER });

  // the bubble falls out of focus as the camera pushes into the app
  const dof = interpolate(f, [GLITCH[0], 132], [0, 1], { ...clamp, easing: TRAVEL });

  return (
    <AbsoluteFill style={{ backgroundColor: C.page }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
          fontFamily: UI_FONT,
        }}
      >
        {/* the sent message */}
        <div
          style={{
            position: "absolute",
            left: BUBBLE.right - BUBBLE.w,
            top: BUBBLE.top,
            width: BUBBLE.w,
            boxSizing: "border-box",
            padding: `${BUBBLE.padY}px ${BUBBLE.padX}px`,
            borderRadius: 22,
            background: C.bubble,
            border: `2px solid ${C.edgeSoft}`,
            fontSize: BUBBLE.font,
            lineHeight: `${BUBBLE.line}px`,
            color: C.ink,
            opacity: 1 - 0.55 * dof,
            filter: dof > 0.01 ? `blur(${(6 * dof).toFixed(2)}px)` : undefined,
          }}
        >
          {BUILD_PROMPT}
        </div>

        {/* the scope trace */}
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", zIndex: 1 }}>
          <Scope frame={f} x0={-320} x1={1400} y={TRACE_Y} bumps={traceBumps(f, cur.x)} hum={1.6} stroke={2.8} color={green > 0.001 ? mixInk(green) : TRACE_INK} />
        </svg>

        {/* the Claude mark, on the line */}
        <div
          style={{
            position: "absolute",
            left: MARK.x - 52,
            top: TRACE_Y - 52,
            width: 104,
            height: 104,
            borderRadius: "50%",
            background: C.page,
            zIndex: 3,
          }}
        />
        <Img
          src={staticFile(LOGOS.claude)}
          style={{
            position: "absolute",
            left: MARK.x - MARK.size / 2,
            top: TRACE_Y - MARK.size / 2,
            width: MARK.size,
            height: MARK.size,
            transform: `rotate(${spinAt(f).toFixed(2)}deg)`,
            zIndex: 4,
          }}
        />

        <ArtifactPanel frame={f} />

        <MacCursor x={cur.x} y={cur.y} size={50} press={cur.press} opacity={cur.opacity} />
      </div>
    </AbsoluteFill>
  );
};

export const AcP6NoCode: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  return (
    <CRT glitchAt={GLITCH}>
      <AbsoluteFill style={{ backgroundColor: C.page }}>
        <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
          <Scene />
        </CameraMotionBlur>
      </AbsoluteFill>
    </CRT>
  );
};
