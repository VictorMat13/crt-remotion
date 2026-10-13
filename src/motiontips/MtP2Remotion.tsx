import React from "react";
import { AbsoluteFill, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, LOGOS, PARTS, PH, Scope, type ScopeBump } from "./theme";
import {
  BLUR_WIN,
  BURSTS,
  CLAUDE,
  CLAUDE_WAKE,
  CLIP,
  CLIP_FROM,
  DECEL,
  ENTER,
  ENTER_KEY,
  FLOW,
  FRAME,
  F_WAKE,
  GLITCH,
  LAST_PKT,
  PKT_IN,
  PKT_LEN,
  PKT_OUT,
  REM,
  REM_MARK,
  REM_RGB,
  REM_S,
  REM_WAKE,
  REM_W,
  STREAM,
  TERM,
  TRACE_INK,
  TRACE_X,
  TRAVEL,
  WORD_AT,
  burst,
  camAt,
  clamp,
} from "./t2/plan";
import { Terminal } from "./t2/Terminal";

// ===========================================================================
// MtP2Remotion: 1080x1920 (9:16) @ 30fps, 195 frames (6.5s).
// VO (Victor's, never on screen): "Motion graphics used to take me hours to do
// until I discovered Remotion, a free tool that turns simple prompts into
// motion graphics."
//
// CRT Scope style. One continuous camera travel down one scope trace:
//   0-44     the prompt: Victor's Claude Code session, his real prompt arriving
//            word by word in the input box (dictated); his voice is green on
//            the trace where it leaves the terminal. Camera close (z 1.10),
//            drifting down.
//   44-100   Claude writes it: Enter, the sent prompt rides the trace into the
//            Claude mark (wakes coral). Claude writes the real
//            src/artcraft/kit/Scope.tsx into the Write preview (dimmed code
//            texture, bursts); every burst is a coral packet down the line to
//            the Remotion mark, asleep below. Then it runs the real render
//            (npx remotion render AcP3ThirtyYears). The last packet wakes the
//            official Remotion lockup (one soft glitch) on "Remotion".
//   100-195  into motion graphics: Remotion speaks blue, a blue packet carries
//            down into the frame and the camera travels with it; the frame
//            wakes (soft glitch) and plays the delivered ArtCraft graphic
//            ("But here's where it (9x8).mp4"), big, while Remotion keeps
//            feeding it packets. Slow push to the end.
// The trace + marks are drawn outside the motion blur (blur smears thin lines).
// ===========================================================================

export const MT_P2_DURATION = PARTS.t2.frames; // 195

const BG = "#050608";
const CORAL = PH.claudeRgb;
const GREEN = PH.userRgb;

// ---------------------------------------------------------------- camera wrapper
const World: React.FC<{ f: number; children: React.ReactNode }> = ({ f, children }) => {
  const { width, height } = useVideoConfig();
  const cam = camAt(f);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1080,
        height: 2400,
        transform: `translate(${width / 2 - cam.x}px, ${height / 2 - cam.y}px) scale(${cam.z})`,
        transformOrigin: `${cam.x}px ${cam.y}px`,
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------- the frame (delivered graphic)
const PlayerFrame: React.FC<{ f: number }> = ({ f }) => {
  const wake = interpolate(f, [F_WAKE - 1, F_WAKE + 9], [0, 1], { ...clamp, easing: ENTER });
  // asleep: a dim standby still; awake: plays, dimmed 20% (bright content blows out in the tube)
  const bright = 0.42 + 0.38 * wake;
  const gray = 0.7 * (1 - wake);
  return (
    <div style={{ position: "absolute", left: FRAME.left, top: FRAME.top, width: FRAME.w, height: FRAME.h, borderRadius: 16, overflow: "hidden", background: "#000" }}>
      <Freeze frame={F_WAKE} active={f < F_WAKE}>
        <Sequence from={F_WAKE} layout="none">
          <OffthreadVideo
            src={staticFile(CLIP)}
            trimBefore={CLIP_FROM}
            muted
            style={{ width: FRAME.w, height: FRAME.h, objectFit: "cover", display: "block", filter: `brightness(${bright.toFixed(3)}) grayscale(${gray.toFixed(3)})` }}
          />
        </Sequence>
      </Freeze>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          border: `2px solid rgba(233,231,226,${(0.3 + 0.32 * wake).toFixed(3)})`,
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------- scene (blurred layer)
const Scene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <World f={f}>
        <Terminal frame={f} />
        <PlayerFrame f={f} />
      </World>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- trace
const SEG = {
  c0: CLAUDE.y + CLAUDE.size / 2 + 4, // below the Claude mark
  r0: REM.y - REM_MARK.r, // above the Remotion mark
  r1: REM.y + REM_MARK.r, // below it
};
const wordPulse = (f: number) => WORD_AT.reduce((a, t) => a + Math.exp(-((f - t) ** 2) / (2 * 2.2 * 2.2)), 0);

const packet = (f: number, at: number, len: number, from: number, to: number, amp: number, rgb: string, sigma = 34): ScopeBump | null => {
  const u = interpolate(f, [at, at + len], [0, 1], { ...clamp, easing: TRAVEL });
  const env = interpolate(f, [at, at + 2, at + len - 2, at + len], [0, 1, 1, 0], clamp);
  return env > 0.01 ? { x: from + (to - from) * u, amp: amp * env, sigma, rgb } : null;
};

const traceBumps = (f: number): ScopeBump[] => {
  const b: (ScopeBump | null)[] = [];
  const mod = (k: number) => 0.78 + 0.22 * Math.sin(f * 0.17 + k);
  // Victor dictating: green where the line leaves the terminal
  const dict = interpolate(f, [-30, -20, ENTER_KEY - 2, ENTER_KEY + 3], [0, 1, 1, 0], clamp);
  if (dict > 0.01) b.push({ x: TERM.bottom + 22, amp: (9 + 16 * Math.min(1.3, wordPulse(f))) * dict * mod(0), sigma: 16, rgb: GREEN });
  // Enter: the sent prompt rides into the Claude mark
  b.push(packet(f, PKT_IN[0], PKT_IN[1] - PKT_IN[0], TERM.bottom + 24, CLAUDE.y, 18, GREEN, 24));
  // Claude talks while it writes (harder on each burst), then settles to a hum
  const cw = interpolate(f, [CLAUDE_WAKE - 2, CLAUDE_WAKE + 6], [0, 1], { ...clamp, easing: ENTER });
  const work = interpolate(f, [STREAM[1] - 2, STREAM[1] + 34], [1, 0], { ...clamp, easing: DECEL });
  const cv = cw * ((9 + 15 * burst(f)) * work + 4.5 * mod(1) * (1 - work));
  if (cv > 0.3) b.push({ x: CLAUDE.y, amp: cv, sigma: 44, rgb: CORAL });
  // every burst leaves as a packet down the line to the Remotion mark
  for (const s of [...BURSTS, LAST_PKT]) b.push(packet(f, s, PKT_LEN, SEG.c0, SEG.r0, s === LAST_PKT ? 20 : 15, CORAL, 30));
  // Remotion wakes and speaks blue
  const peak = interpolate(f, [REM_WAKE, REM_WAKE + 3, REM_WAKE + 30], [0, 1, 0], clamp);
  const alive = interpolate(f, [REM_WAKE, REM_WAKE + 8], [0, 1], clamp);
  const rv = (17 * peak + 5 * alive) * mod(2);
  if (rv > 0.3) b.push({ x: REM.y, amp: rv, sigma: 52, rgb: REM_RGB });
  // the blue packet carries it down into the frame
  b.push(packet(f, PKT_OUT[0], PKT_OUT[1] - PKT_OUT[0], SEG.r1, FRAME.top, 21, REM_RGB, 30));
  // then Remotion keeps feeding the frame while it plays
  for (let s = FLOW.from; s < 240; s += FLOW.every) b.push(packet(f, s, FLOW.len, SEG.r1, FRAME.top, 11, REM_RGB, 26));
  return b.filter((x): x is ScopeBump => x !== null);
};

// ---------------------------------------------------------------- Claude mark spin (accumulated, faster on bursts)
const SPIN = (() => {
  const out: number[] = [];
  let a = 0;
  for (let i = 0; i <= 300 * 4; i++) {
    const f = -40 + i / 4;
    const on = interpolate(f, [CLAUDE_WAKE, CLAUDE_WAKE + 8], [0, 1], clamp);
    const work = interpolate(f, [STREAM[1] - 4, STREAM[1] + 30], [1, 0.25], { ...clamp, easing: DECEL });
    a += (on * (1.1 + 2.6 * burst(f)) * work) / 4;
    out.push(a);
  }
  return out;
})();
const spinAt = (f: number) => {
  const x = Math.max(0, Math.min(SPIN.length - 1, (f + 40) * 4));
  const i = Math.floor(x);
  return SPIN[i] + (SPIN[Math.min(i + 1, SPIN.length - 1)] - SPIN[i]) * (x - i);
};

const Ripple: React.FC<{ f: number; at: number; cx: number; cy: number; r0: number; rgb: string; len?: number }> = ({ f, at, cx, cy, r0, rgb, len = 26 }) => {
  const k = (f - at) / len;
  if (k <= 0 || k >= 1) return null;
  const e = DECEL(k);
  return <circle cx={cx} cy={cy} r={r0 + 30 * e} fill="none" stroke={`rgba(${rgb},${(0.6 * (1 - k)).toFixed(3)})`} strokeWidth={2.5} />;
};

// ---------------------------------------------------------------- overlay (sharp layer: trace + marks)
const Overlay: React.FC = () => {
  const f = useCurrentFrame();
  const cw = interpolate(f, [CLAUDE_WAKE - 1, CLAUDE_WAKE + 8], [0, 1], { ...clamp, easing: ENTER });
  const rw = interpolate(f, [REM_WAKE - 1, REM_WAKE + 8], [0, 1], { ...clamp, easing: ENTER });
  const talkC = cw * (0.5 + 0.5 * Math.sin(f * 0.23));
  const talkR = rw * (0.5 + 0.5 * Math.sin(f * 0.19 + 1));
  const H = FRAME.top + 40;
  return (
    <AbsoluteFill>
      <World f={f}>
        <svg width={1080} height={H} viewBox={`0 0 1080 ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {/* the scope trace, vertical: Scope's x axis runs down world y */}
          <g transform={`translate(${TRACE_X} 0) rotate(90)`}>
            <Scope frame={f} x0={TERM.bottom} x1={FRAME.top} y={0} bumps={traceBumps(f)} hum={1.6} stroke={2.8} color={TRACE_INK} />
          </g>
          <Ripple f={f} at={CLAUDE_WAKE} cx={TRACE_X} cy={CLAUDE.y} r0={CLAUDE.size / 2 + 6} rgb={CORAL} />
          <Ripple f={f} at={REM_WAKE} cx={TRACE_X} cy={REM.y} r0={REM_MARK.r} rgb={REM_RGB} len={30} />
          <Ripple f={f} at={F_WAKE} cx={TRACE_X} cy={FRAME.top} r0={10} rgb={REM_RGB} len={24} />
        </svg>

        {/* the Claude mark on the line: asleep until the prompt arrives, then coral and turning while it writes */}
        <div
          style={{
            position: "absolute",
            left: TRACE_X - CLAUDE.size / 2 - 10,
            top: CLAUDE.y - CLAUDE.size / 2 - 10,
            width: CLAUDE.size + 20,
            height: CLAUDE.size + 20,
            borderRadius: "50%",
            background: BG,
            transform: `scale(${(0.94 + 0.06 * cw + 0.02 * talkC).toFixed(4)})`,
          }}
        >
          <Img
            src={staticFile(LOGOS.claude)}
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              width: CLAUDE.size,
              height: CLAUDE.size,
              transform: `rotate(${spinAt(f).toFixed(2)}deg)`,
              filter: cw < 0.995 ? `grayscale(${(1 - cw).toFixed(3)}) brightness(${(0.72 + 0.28 * cw).toFixed(3)})` : undefined,
              opacity: 0.8 + 0.2 * cw,
            }}
          />
        </div>

        {/* the official Remotion lockup: its mark on the line, the wordmark to the right */}
        <div
          style={{
            position: "absolute",
            left: TRACE_X - REM_MARK.r,
            top: REM.y - REM_MARK.r,
            width: REM_MARK.r * 2,
            height: REM_MARK.r * 2,
            borderRadius: "50%",
            background: BG,
          }}
        />
        <Img
          src={staticFile(LOGOS.remotionDark)}
          style={{
            position: "absolute",
            left: TRACE_X - REM_MARK.cx,
            top: REM.y - REM_MARK.cy,
            width: REM_W,
            height: 213 * REM_S,
            transformOrigin: `${REM_MARK.cx}px ${REM_MARK.cy}px`,
            transform: `scale(${(0.95 + 0.05 * rw + 0.015 * talkR).toFixed(4)})`,
            filter: `grayscale(${(1 - rw).toFixed(3)}) brightness(${(0.68 + 0.17 * rw).toFixed(3)})`,
            opacity: 0.75 + 0.25 * rw,
          }}
        />
      </World>
    </AbsoluteFill>
  );
};

export const MtP2Remotion: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  return (
    <CRT glitchAt={GLITCH}>
      <AbsoluteFill style={{ backgroundColor: BG }}>
        <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
          <Scene />
        </CameraMotionBlur>
        <Overlay />
      </AbsoluteFill>
    </CRT>
  );
};
