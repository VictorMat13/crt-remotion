import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, PARTS, PH, Scope, type ScopeBump } from "./theme";
import {
  ALL_PACKETS,
  BLUR_WINS,
  DECEL,
  GLITCH,
  LOGO_CX,
  LOGO_DROPS,
  MAIN,
  OUT,
  PORT_X,
  SHOT,
  SHOT_CX,
  SHOT_DROP,
  TY,
  VID,
  VID_CX,
  VID_DROP,
  c01,
  camAt,
  packetEnv,
  packetX,
  seg,
  worldTf,
} from "./t8/plan";
import { LogoRef, ShotRef, VidRef } from "./t8/Refs";
import { FinalPicture, Output } from "./t8/Output";

// ===========================================================================
// MtP8MoreRefs: 1080x1920 (9:16) @ 30fps, 240 frames (8.0s).
// VO (Victor's, never on screen): "Screenshots or demos of your product, and
// reference videos, and even PNGs of your logo. The more references it has,
// the more the end result will match what you actually want."
//
// CRT Scope. One rig on one scope trace: three references stand on the line,
// the output frame hangs from it. Each reference falls onto the line on its
// own words and sends a green packet (the person's material) along it into
// the output, which steps one real state closer to the finished graphic:
//   0-44    the real PhotoCraft screenshot lands (camera close, z 1.11);
//           its packet turns the output's plain gray ground into the rough
//           pass: the same screenshot on gray, unstyled
//   40-84   the CRT Scope example video falls in, playing; its packet brings
//           the right look: a real CRT check frame from the ArtCraft P2 build
//           (one soft glitch as the look lands)
//   76-130  the logo PNGs stack up (Claude, Remotion, DaVinci Resolve); their
//           packet lands the delivered P2 graphic, playing
//   130-240 all three keep feeding it; the camera, which has been pulling
//           back over the whole rig, tilts down and pushes into the finished
//           graphic until it fills the frame, the line and its packets across
//           the top. Still moving on the last frame.
// The trace and the port are drawn sharp outside the motion blur. The
// delivered graphic is laid over the tube (see t8/Output.tsx).
// ===========================================================================

export const MT_P8_DURATION = PARTS.t8.frames; // 240

const GREEN = PH.userRgb;
const INK = "243,241,236";

// ---------------------------------------------------------------- trace
const ring = (f: number, at: number, len = 24) => c01((f - at + 1) / 3) * (1 - seg(f, at + 2, at + len, DECEL));

const traceBumps = (f: number): ScopeBump[] => {
  const out: ScopeBump[] = [];
  const refs = [
    { x: SHOT_CX, land: SHOT_DROP[1], sigma: SHOT.w / 3.2, k: 0 },
    { x: VID_CX, land: VID_DROP[1], sigma: VID.w / 3.2, k: 1 },
    { x: LOGO_CX, land: LOGO_DROPS[0][1], sigma: 34, k: 2 },
  ];
  for (const r of refs) {
    if (f < r.land - 1) continue;
    // lands with a ring, then hums softly under itself (it is "talking" to the line)
    let hit = ring(f, r.land);
    if (r.k === 2) for (const w of LOGO_DROPS) hit = Math.max(hit, ring(f, w[1]));
    const hum = c01((f - r.land - 4) / 10) * (0.78 + 0.22 * Math.sin(f * 0.17 + r.k * 2.1));
    out.push({ x: r.x, amp: 15 * hit + 4.5 * hum, sigma: r.sigma, rgb: GREEN });
  }
  // packets along the line into the port
  for (const p of ALL_PACKETS) {
    const e = packetEnv(p, f);
    if (e > 0.01) out.push({ x: packetX(p, f), amp: p.amp * e, sigma: p.amp > 15 ? 30 : 24, rgb: GREEN });
  }
  // the port answers each arrival
  let port = 0;
  for (const p of ALL_PACKETS) port = Math.max(port, (p.amp > 15 ? 1 : 0.55) * ring(f, p.at + p.len, 20));
  if (port > 0.01) out.push({ x: PORT_X, amp: 13 * port, sigma: 40, rgb: INK });
  return out;
};

const Ripple: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const k = (f - at) / 24;
  if (k <= 0 || k >= 1) return null;
  const e = DECEL(k);
  return <circle cx={PORT_X} cy={TY + 12} r={10 + 34 * e} fill="none" stroke={`rgba(${GREEN},${(0.7 * (1 - k)).toFixed(3)})`} strokeWidth={2.6} />;
};

/** sharp layer: the scope line, the port into the output, arrival ripples */
const Trace: React.FC<{ f: number }> = ({ f }) => {
  const cam = camAt(f);
  const t = worldTf(cam).replace(/px/g, "");
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform={t}>
        <Scope frame={f} x0={-420} x1={1500} y={TY} bumps={traceBumps(f)} hum={1.5} stroke={2.8} color={`rgba(${INK},0.5)`} />
        <line x1={PORT_X} y1={TY + 3} x2={PORT_X} y2={OUT.top} stroke={`rgba(${INK},0.55)`} strokeWidth={2.6} />
        <circle cx={PORT_X} cy={TY} r={5} fill={`rgba(${INK},0.75)`} />
        {MAIN.map((p) => (
          <Ripple key={p.at} f={f} at={p.at + p.len} />
        ))}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------- scene
const Scene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: worldTf(camAt(f)) }}>
        <Output f={f} />
        <ShotRef f={f} cx={SHOT_CX} />
        <VidRef f={f} cx={VID_CX} />
        <LogoRef f={f} cx={LOGO_CX} />
      </div>
    </AbsoluteFill>
  );
};

export const MtP8MoreRefs: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WINS.some(([a, b]) => frame >= a && frame <= b);
  const n = samples ?? (big ? 8 : 1);
  // CameraMotionBlur renders its samples at frame + 0.5 .. + 1 (mean +0.5 for 1
  // sample, ~ +0.72 for 8); the sharp trace follows the same instant
  const traceF = frame + (n > 1 ? 0.72 : 0.5);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={GLITCH}>
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
          <CameraMotionBlur shutterAngle={180} samples={n}>
            <Scene />
          </CameraMotionBlur>
          <Trace f={traceF} />
        </AbsoluteFill>
      </CRT>
      {/* the delivered graphic is already a CRT Scope render: laid over the tube untouched */}
      <FinalPicture f={frame} cam={camAt(traceF)} />
    </AbsoluteFill>
  );
};

