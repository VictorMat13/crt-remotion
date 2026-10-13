import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { PH } from "../theme";
import { buildPath, Wire, type WireBump } from "./Wire";
import {
  A2_Y,
  CLIPS,
  DECEL,
  DROP,
  EDIT,
  ENTER,
  H,
  ICON,
  ICON_C,
  LAND,
  LAND_AT,
  SELECT_AT,
  TRAVEL,
  V2_Y,
  W,
  bgBlur,
  bgBright,
  bgCam,
  bgToScreen,
  clamp,
  fgCam,
  fgToScreen,
  sweepX,
} from "./plan";

// ===========================================================================
// BG plane: the real Resolve 21 Edit page (official press-kit screenshot,
// 5120x2880) standing behind the dialog, soft by depth, then pulled into
// focus as the camera dollies in on the timeline.
// Screen-space overlay on top of it: the coral packet dropping out of the
// Resolve icon down its own trace onto the timeline, then running right along a trace
// laid along the seam under the B-roll audio (A2); every B-roll clip it
// reaches is selected the way Resolve shows a selection (an outline round the
// clip's video on V2 and its linked audio on A2), in Claude's coral.
// ===========================================================================

export const EditPage: React.FC<{ frame: number }> = ({ frame: f }) => {
  const c = bgCam(f);
  const blur = bgBlur(f);
  return (
    <AbsoluteFill style={{ filter: `${blur > 0.05 ? `blur(${blur.toFixed(2)}px) ` : ""}brightness(${bgBright(f).toFixed(3)})` }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: EDIT.w,
          height: EDIT.h,
          transformOrigin: "0 0",
          transform: `translate(${(W / 2 - c.x * c.s).toFixed(2)}px, ${(H / 2 - c.y * c.s).toFixed(2)}px) scale(${c.s.toFixed(5)})`,
        }}
      >
        <Img src={staticFile(EDIT.src)} style={{ width: EDIT.w, height: EDIT.h, display: "block" }} />
      </div>
    </AbsoluteFill>
  );
};

const cubic = (p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }, u: number) => {
  const a = (1 - u) ** 3;
  const b = 3 * (1 - u) ** 2 * u;
  const cc = 3 * (1 - u) * u * u;
  const d = u ** 3;
  return { x: a * p0.x + b * p1.x + cc * p2.x + d * p3.x, y: a * p0.y + b * p1.y + cc * p2.y + d * p3.y };
};

const ICON_FOOT = { x: ICON_C.x, y: ICON.top + ICON.size };

/** the dropping packet's head (screen px): leaves the icon's foot (pinned where it was at DROP[0]) and lands on the A2/A3 seam */
const headAt = (f: number) => {
  const p0 = fgToScreen(ICON_FOOT, fgCam(DROP[0]));
  const v = bgToScreen(LAND_AT, bgCam(f));
  const u = interpolate(f, DROP, [0, 1], { ...clamp, easing: TRAVEL });
  return cubic(p0, { x: p0.x, y: p0.y + 240 }, { x: v.x, y: v.y - 260 }, v, u);
};

export const Landing: React.FC<{ frame: number }> = ({ frame: f }) => {
  if (f < DROP[0]) return null;
  const c = bgCam(f);
  const coral = PH.claudeRgb;

  // ---- the drop: a trace from the (receding) icon's foot to the head
  const a = fgToScreen(ICON_FOOT, fgCam(f));
  const head = headAt(f);
  const dz = fgCam(f).z;
  const drop = buildPath([["C", a, { x: a.x, y: a.y + 220 * dz }, { x: head.x, y: head.y - 240 }, head]]);
  const dropEnv = interpolate(f, [DROP[0], DROP[0] + 3, LAND - 1, LAND + 2], [0, 1, 1, 0], clamp);
  const dropFade = interpolate(f, [LAND + 2, LAND + 18], [1, 0], { ...clamp, easing: TRAVEL });
  // while the trace is still short (leaving the icon), the packet is small too, so it never curls into a knot
  const grown = Math.min(1, drop.L / 260);
  const dropBumps: WireBump[] =
    dropEnv > 0.01 ? [{ s: drop.L - 10 * grown, amp: 26 * dropEnv * grown, sigma: Math.max(12, 40 * grown), rgb: coral }] : [];

  // ---- the sweep: a trace laid along the A2/A3 seam, drawn out from the landing point
  const grow = interpolate(f, [LAND, LAND + 16], [0, 1], { ...clamp, easing: DECEL });
  const hx = sweepX(f);
  const yLine = bgToScreen({ x: 0, y: LAND_AT.y }, c).y;
  const xl = bgToScreen({ x: LAND_AT.x - 190 * grow, y: 0 }, c).x;
  const xr = bgToScreen({ x: hx + 26 + 40 * grow, y: 0 }, c).x;
  const sweep = f >= LAND ? buildPath([["L", { x: xl, y: yLine }, { x: xr, y: yLine }]]) : null;
  const sweepEnv = interpolate(f, [LAND - 1, LAND + 3], [0, 1], clamp);
  const hs = bgToScreen({ x: hx, y: 0 }, c).x - xl;
  // the packet keeps talking as it works along the track
  const talk = 0.82 + 0.18 * Math.sin(f * 0.37);
  const sweepBumps: WireBump[] = sweep ? [{ s: hs, amp: 30 * sweepEnv * talk, sigma: 50, rgb: coral }] : [];

  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* selection outlines: B-roll video on V2 + its linked audio on A2, Resolve-style, in coral */}
        {CLIPS.map((clip, i) => {
          const at = SELECT_AT[i];
          if (!(f >= at)) return null;
          const k = interpolate(f, [at, at + 4], [0, 1], { ...clamp, easing: ENTER });
          const flash = interpolate(f, [at, at + 2, at + 18], [0, 0.3, 0.1], clamp);
          return (clip.a2 ? [V2_Y, A2_Y] : [V2_Y]).map(([y0, y1], j) => {
            const p = bgToScreen({ x: clip.x0, y: y0 }, c);
            const q = bgToScreen({ x: clip.x1, y: y1 }, c);
            if (q.x < -20 || p.x > W + 20) return null;
            return (
              <rect
                key={`${i}-${j}`}
                x={p.x + 2}
                y={p.y + 2}
                width={Math.max(0, q.x - p.x - 4)}
                height={Math.max(0, q.y - p.y - 4)}
                rx={6}
                fill={`rgba(${coral},${(flash * k).toFixed(3)})`}
                stroke={`rgba(${coral},${k.toFixed(3)})`}
                strokeWidth={5}
              />
            );
          });
        })}
        {sweep ? <Wire path={sweep} frame={f} bumps={sweepBumps} phase={(LAND_AT.x - 190 * grow) * c.s} stroke={2.8} /> : null}
        {/* the drop trace has delivered its packet: it fades, the seam trace carries on */}
        {dropFade > 0.01 ? (
          <g opacity={dropFade}>
            <Wire path={drop} frame={f} bumps={dropBumps} stroke={2.8} />
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
