import React from "react";
import { interpolate } from "remotion";
import { PH, Scope, type ScopeBump } from "../theme";
import { DROP_LEN, FS, LAND, N, RIDE, THUMB, TRAVEL, TY, W, camAt, clamp, flightAt, tilesFast } from "./plan";

// ===========================================================================
// The scope trace across the top of the world (drawn sharp, outside the
// motion blur: blur smears thin lines). Every file rides it on a green packet
// (the person's side of the line), and the line passes BEHIND each riding
// thumbnail: a mask cuts the line where a thumbnail sits on it. When a file
// lifts off into its slot the packet gives a last kick and dies out there.
// After the row is full, small green packets keep running along the line.
// ===========================================================================

const GREEN = PH.userRgb;
const TRACE_INK = "rgba(243,241,236,0.5)";

const bumpsAt = (f: number): ScopeBump[] => {
  const out: ScopeBump[] = [];
  for (let i = 0; i < N; i++) {
    const R = RIDE[i];
    const L = LAND[i];
    if (f < R || f > L + 12) continue;
    const fl = flightAt(i, f);
    const lift = L - DROP_LEN;
    const env = interpolate(f, [R, R + 6, lift, lift + 5, L + 12], [0, 1, 1, 1.35, 0], clamp);
    const breathe = 0.85 + 0.15 * Math.sin(f * 0.21 + i);
    if (env > 0.01) out.push({ x: fl.x, amp: 17 * env * breathe, sigma: 92, rgb: GREEN });
  }
  // after the row is full: small packets keep running along the line
  for (let s = LAND[5] - 8; s < 240; s += 13) {
    const c = camAt(s);
    const a = c.x - W / 2 / c.z - 60;
    const b = c.x + W / 2 / c.z + 60;
    const u = interpolate(f, [s, s + 30], [0, 1], { ...clamp, easing: TRAVEL });
    const env = interpolate(f, [s, s + 3, s + 27, s + 30], [0, 1, 1, 0], clamp);
    if (env > 0.01) out.push({ x: a + (b - a) * u, amp: 11 * env, sigma: 48, rgb: GREEN });
  }
  return out;
};

/**
 * holes in the line where a thumbnail sits on it (world px). This layer renders
 * at the sub-frame f + 0.5 (one CameraMotionBlur sample); the thumbnails' blurred
 * image is centred about 0.22 frame later while they move fast, so the holes
 * follow that centre.
 */
const holesAt = (fr: number) => {
  const f = fr + (tilesFast(fr - 0.5) ? 0.22 : 0);
  const out: { x: number; y: number; w: number; h: number; r: number }[] = [];
  for (let i = 0; i < N; i++) {
    const fl = flightAt(i, f);
    if (!fl.started) continue;
    const th = THUMB.h * fl.s;
    if (fl.y - th / 2 > TY + 30) continue; // fully below the line
    const tw = THUMB.w * fl.s;
    // widened by the blur smear (the thumbnail layer is motion blurred)
    const vx = Math.abs(flightAt(i, f + 0.5).x - flightAt(i, f - 0.5).x);
    const pad = 6 + 0.35 * vx;
    out.push({ x: fl.x - tw / 2 - pad, y: fl.y - th / 2 - 6, w: tw + 2 * pad, h: th + 12, r: THUMB.r * FS + 6 });
  }
  return out;
};

export const Trace: React.FC<{ frame: number }> = ({ frame: f }) => {
  const c = camAt(f);
  const x0 = Math.floor(c.x - W / 2 / c.z - 80);
  const x1 = Math.ceil(c.x + W / 2 / c.z + 80);
  const y0 = TY - 260;
  const h = 520;
  const holes = holesAt(f);
  return (
    <svg
      width={x1 - x0}
      height={h}
      viewBox={`${x0} ${y0} ${x1 - x0} ${h}`}
      style={{ position: "absolute", left: x0, top: y0, overflow: "visible" }}
    >
      <defs>
        <mask id="mtp7-trace-holes" maskUnits="userSpaceOnUse" x={x0} y={y0} width={x1 - x0} height={h}>
          <rect x={x0} y={y0} width={x1 - x0} height={h} fill="#fff" />
          {holes.map((o, k) => (
            <rect key={k} x={o.x} y={o.y} width={o.w} height={o.h} rx={o.r} fill="#000" />
          ))}
        </mask>
      </defs>
      <g mask="url(#mtp7-trace-holes)">
        <Scope frame={f} x0={x0} x1={x1} y={TY} bumps={bumpsAt(f)} hum={1.5} stroke={2.6} color={TRACE_INK} />
      </g>
    </svg>
  );
};
