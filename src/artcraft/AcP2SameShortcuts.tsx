import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, PARTS, PH } from "./theme";
import { Scope, type ScopeBump } from "./kit/Scope";
import {
  BLUR_WINS,
  CAM_T,
  CAM_X,
  CAM_Y,
  CAM_Z,
  DECEL,
  ENTER,
  GLITCH,
  ICON,
  ADOBE_X,
  KEY,
  KEYS_IN,
  KEYS_SCREEN_DY,
  PKT,
  PKT_X0,
  PKT_X1,
  ROWS_OUT,
  ROW_Y,
  TRAVEL,
  TRACE_INK,
  TRAVEL_WIN,
  TWINS,
  TWIN_X,
  WIN_DUR,
  WIN_S,
  WIN_W,
  clamp,
  type Twin,
} from "./p2/plan";
import { PhotoCraftFilters, PhotoCraftLive } from "./p2/PhotoCraftLive";
import { FilmCraftLive } from "./p2/FilmCraftLive";
import { Keycaps, keyBumps } from "./p2/Keycaps";

// ===========================================================================
// AcP2SameShortcuts: 1080x1920 (9:16) @ 30fps, 240 frames (8.0s).
// VO (Victor's, never on screen): "These are apps people pay Adobe hundreds
// of dollars a year for, and the free copies have almost every feature, right
// down to the same keyboard shortcuts. If you know Photoshop, you already know
// how to use this." (this graphic covers the first 8s of it)
//
// CRT Scope style. One continuous shot, the camera travels down a tall world:
//   0-64     twins on the wire: Photoshop / Premiere Pro / After Effects (the
//            official icons) each on a scope trace with their free Craft twin
//            asleep at the other end. A packet runs down each trace, staggered
//            (opens mid-action: PhotoCraft has just woken and its window is
//            landing, Premiere's packet is on the wire); each twin wakes and its
//            real screenshot slides out of it as a dark window into a fan.
//   64-98    the fan squares up and floats while the twins keep talking
//   98-124   the camera travels down onto PhotoCraft (the back windows rise
//            into a deck and fall out of focus), soft wobble on arrival
//   124-215  same keys: ⌘J duplicates the real Curves 1 row, B/T/V move the
//            real selected-tool box (B also paints one stroke), ⇧⌘D brings the
//            marching ants back; each press blips the trace under its cap
//   215-240  slow pull-back, caps settling, ants crawling, scope running
// ===========================================================================

export const AC_P2_DURATION = PARTS.p2.frames;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------- windows
const winPose = (t: Twin, frame: number) => {
  const land = PKT[t.row][1];
  const e = interpolate(frame, [land, land + WIN_DUR], [0, 1], { ...clamp, easing: ENTER });
  const spread = interpolate(frame, TRAVEL_WIN, [0, 1], { ...clamp, easing: TRAVEL });
  const h = t.nativeH * WIN_S;
  const left = lerp(t.fan.left, t.deck.left, spread);
  const top = lerp(t.fan.top, t.deck.top, spread);
  const slotX = left + WIN_W / 2;
  const slotY = top + h / 2;
  const float = 6 * Math.sin(frame / 23 + t.row * 2.1) * e * (1 - 0.5 * spread);
  const fanBright = t.row === 0 ? 1 : t.row === 1 ? 0.88 : 0.8;
  return {
    on: frame >= land,
    cx: lerp(TWIN_X, slotX, e),
    cy: lerp(ROW_Y[t.row], slotY, e) + float,
    h,
    // the fan slowly squares up while the stack holds (40-98), then straightens into the deck
    rot: lerp(0, t.fan.rot, e) * lerp(1, 0.5, interpolate(frame, [40, 98], [0, 1], { ...clamp, easing: TRAVEL })) * (1 - spread),
    scale: lerp(ICON / WIN_W, 1, e) * lerp(1, t.deck.scale, spread),
    opacity: interpolate(frame, [land, land + 4], [0, 1], clamp),
    blur: t.deck.blur * spread,
    bright: lerp(fanBright, t.deck.bright, spread),
  };
};

const Window: React.FC<{ t: Twin; frame: number }> = ({ t, frame }) => {
  const p = winPose(t, frame);
  if (!p.on) return null;
  const filter = [p.blur > 0.2 ? `blur(${p.blur.toFixed(2)}px)` : "", p.bright < 0.995 ? `brightness(${p.bright.toFixed(3)})` : ""].join(" ").trim();
  return (
    <div
      style={{
        position: "absolute",
        left: p.cx - WIN_W / 2,
        top: p.cy - p.h / 2,
        width: WIN_W,
        height: p.h,
        zIndex: t.z,
        opacity: p.opacity,
        transform: `rotate(${p.rot.toFixed(3)}deg) scale(${p.scale.toFixed(4)})`,
        transformOrigin: "50% 50%",
        filter: filter || undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 12,
          overflow: "hidden",
          background: PH.panel,
          border: "1.5px solid rgba(233,231,226,0.42)",
          boxShadow: "0 26px 60px rgba(0,0,0,0.65)",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: 1600, height: t.nativeH, transform: `scale(${WIN_S})`, transformOrigin: "0 0", overflow: "hidden" }}>
          {t.id === "photocraft" ? (
            <PhotoCraftLive frame={frame} />
          ) : t.id === "filmcraft" ? (
            <FilmCraftLive frame={frame} />
          ) : (
            <Img src={staticFile(t.shot)} style={{ position: "absolute", left: 0, top: -t.cropTop, width: 1600, maxWidth: "none" }} />
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- twin rows
const landOf = (row: number) => PKT[row][1];

const rowBumps = (t: Twin, frame: number): ScopeBump[] => {
  const [p0, land] = PKT[t.row];
  const u = interpolate(frame, [p0, land], [0, 1], { ...clamp, easing: TRAVEL });
  const env = interpolate(frame, [p0, p0 + 4, land - 2, land + 4], [0, 1, 1, 0], clamp);
  const voice =
    interpolate(frame, [land, land + 6, land + 28, 100], [0, 1, 0.6, 0.45], clamp) * (0.72 + 0.28 * Math.sin(frame * 0.13 + t.row * 1.7));
  // after the first packet lands, the Adobe icon keeps feeding its twin: one packet every 26f, rows staggered
  const repeats: ScopeBump[] = [];
  for (let k = 0; k < 4; k++) {
    const s0 = land + 18 + k * 26 + t.row * 7;
    if (frame < s0 || frame > s0 + 22) continue;
    const ru = interpolate(frame, [s0, s0 + 20], [0, 1], { ...clamp, easing: TRAVEL });
    const renv = interpolate(frame, [s0, s0 + 3, s0 + 17, s0 + 22], [0, 1, 1, 0], clamp);
    repeats.push({ x: PKT_X0 + (PKT_X1 - PKT_X0) * ru, amp: 18 * renv, sigma: 40, rgb: t.rgb });
  }
  return [
    { x: PKT_X0 + (PKT_X1 - PKT_X0) * u, amp: 24 * env, sigma: 46, rgb: t.rgb },
    { x: TWIN_X, amp: 17 * voice, sigma: 105, rgb: t.rgb },
    ...repeats,
  ];
};

const Twins: React.FC<{ frame: number; opacity: number }> = ({ frame, opacity }) => {
  if (opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity, zIndex: 10 }}>
      {TWINS.map((t) => {
        const y = ROW_Y[t.row];
        const land = landOf(t.row);
        const wake = interpolate(frame, [land - 2, land + 8], [0, 1], { ...clamp, easing: ENTER });
        const rip = (frame - land) / 26;
        const ah = (ICON * 234) / 240;
        return (
          <React.Fragment key={t.id}>
            <Img
              src={staticFile(t.adobeLogo)}
              style={{ position: "absolute", left: ADOBE_X - ICON / 2, top: y - ah / 2, width: ICON, height: ah }}
            />
            {rip > 0 && rip < 1 ? (
              <div
                style={{
                  position: "absolute",
                  left: TWIN_X - ICON / 2 - 24 * DECEL(rip),
                  top: y - ICON / 2 - 24 * DECEL(rip),
                  width: ICON + 48 * DECEL(rip),
                  height: ICON + 48 * DECEL(rip),
                  boxSizing: "border-box",
                  borderRadius: ICON * 0.24,
                  border: `1.5px solid rgba(${t.rgb},${(0.55 * (1 - rip)).toFixed(3)})`,
                }}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                left: TWIN_X - ICON / 2,
                top: y - ICON / 2,
                width: ICON,
                height: ICON,
                borderRadius: ICON * 0.21,
                overflow: "hidden",
                opacity: 0.62 + 0.38 * wake,
                filter: wake < 0.995 ? `grayscale(${(0.85 * (1 - wake)).toFixed(3)}) brightness(${(0.78 + 0.22 * wake).toFixed(3)})` : undefined,
              }}
            >
              <Img src={staticFile(t.icon)} style={{ width: ICON, height: ICON, display: "block" }} />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- scene
const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const cam = (v: number[]) => interpolate(frame, CAM_T, v, { ...clamp, easing: TRAVEL });
  const fx = cam(CAM_X) + 3 * Math.sin(frame / 40);
  const fy = cam(CAM_Y) + 2 * Math.sin(frame / 53);
  const zoom = cam(CAM_Z);

  const rowsO = interpolate(frame, ROWS_OUT, [1, 0], { ...clamp, easing: DECEL });
  const keysO = interpolate(frame, [KEYS_IN, KEYS_IN + 16], [0, 1], { ...clamp, easing: ENTER });

  return (
    <AbsoluteFill style={{ backgroundColor: "#050608" }}>
      <PhotoCraftFilters />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 2400,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${zoom})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* every scope trace lives in one world svg, under the windows */}
        <svg width={1080} height={2400} viewBox="0 0 1080 2400" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", zIndex: 0 }}>
          {rowsO > 0.001
            ? TWINS.map((t) => (
                <g key={t.id} opacity={rowsO}>
                  <Scope frame={frame + t.row * 17} x0={-320} x1={1400} y={ROW_Y[t.row]} bumps={rowBumps(t, frame)} color={TRACE_INK} />
                </g>
              ))
            : null}
        </svg>

        {TWINS.map((t) => (
          <Window key={t.id} t={t} frame={frame} />
        ))}

        <Twins frame={frame} opacity={rowsO} />

      </div>

      {/* keycap row + trace: screen-fixed, rides a slow drift so it never sits dead still */}
      {keysO > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 2400,
            opacity: keysO,
            transform: `translate(${(2 * Math.sin(frame / 37)).toFixed(2)}px, ${(KEYS_SCREEN_DY + 24 * (1 - keysO) + 2 * Math.sin(frame / 29)).toFixed(2)}px)`,
          }}
        >
          <svg width={1080} height={2400} viewBox="0 0 1080 2400" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <Scope frame={frame} x0={-320} x1={1400} y={KEY.traceY} bumps={keyBumps(frame)} color={TRACE_INK} />
          </svg>
          <Keycaps frame={frame} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const AcP2SameShortcuts: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WINS.some(([a, b]) => frame >= a && frame <= b);
  return (
    <CRT glitchAt={GLITCH}>
      <AbsoluteFill style={{ backgroundColor: "#050608" }}>
        <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
          <Scene />
        </CameraMotionBlur>
      </AbsoluteFill>
    </CRT>
  );
};
