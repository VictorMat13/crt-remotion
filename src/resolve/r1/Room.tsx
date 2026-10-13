import React from "react";
import { W, H, c01, project, toCam, type Cam, type V3 } from "./rig";

// ===========================================================================
// The room inside the tube: the scope's graticule on the floor and overhead,
// drawn in screen space from the rig's own projection (same math as the CSS
// camera, so it lines up with the 3D planes). It sits under the planes (the
// camera is always between floor and ceiling), fading with depth.
// ===========================================================================

const NEAR = 40;
const G = 480;
const X0 = -5280;
const X1 = 10080;
const Z_FRONT = 6240;
const Z_BACK = -72000;
const FLOOR_Y = 0;
export const CEIL_Y = -3900;

const lerp3 = (a: V3, b: V3, t: number): V3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
const clipped = (cam: Cam, a: V3, b: V3) => {
  const da = toCam(cam, a).d;
  const db = toCam(cam, b).d;
  if (da < NEAR && db < NEAR) return null;
  let p = a;
  let q = b;
  if (da < NEAR) p = lerp3(a, b, (NEAR - da) / (db - da));
  if (db < NEAR) q = lerp3(b, a, (NEAR - db) / (da - db));
  const P1 = project(cam, p);
  const P2 = project(cam, q);
  return { x1: P1.sx, y1: P1.sy, x2: P2.sx, y2: P2.sy, d: (P1.d + P2.d) / 2 };
};
const offscreen = (s: { x1: number; y1: number; x2: number; y2: number }) =>
  (s.x1 < -50 && s.x2 < -50) || (s.x1 > W + 50 && s.x2 > W + 50) || (s.y1 < -50 && s.y2 < -50) || (s.y1 > H + 50 && s.y2 > H + 50);

const floorAlpha = (d: number) => 0.28 * (1 - 0.85 * c01((d - 3000) / 30000)) * c01(d / 300);
const ceilAlpha = (d: number) => 0.22 * (1 - 0.85 * c01((d - 3000) / 30000)) * c01(d / 300);

export const Room: React.FC<{ cam: Cam }> = ({ cam }) => {
  const lines: React.ReactNode[] = [];
  const CH = 12; // lines along z are chunked so they fade with depth
  const zSpan = (Z_FRONT - Z_BACK) / CH;
  for (const [y, alpha] of [
    [FLOOR_Y, floorAlpha],
    [CEIL_Y, ceilAlpha],
  ] as const) {
    for (let x = X0; x <= X1; x += G) {
      for (let c = 0; c < CH; c++) {
        const s = clipped(cam, { x, y, z: Z_FRONT - c * zSpan }, { x, y, z: Z_FRONT - (c + 1) * zSpan });
        if (!s || offscreen(s)) continue;
        const a = alpha(s.d);
        if (a < 0.02) continue;
        lines.push(<line key={`l${y}-${x}-${c}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={`rgba(233,231,226,${a.toFixed(3)})`} strokeWidth={2} />);
      }
    }
    for (let z = Z_FRONT; z >= Z_BACK; z -= G) {
      const s = clipped(cam, { x: X0, y, z }, { x: X1, y, z });
      if (!s || offscreen(s)) continue;
      const a = alpha(toCam(cam, { x: 1600, y, z }).d);
      if (a < 0.02) continue;
      lines.push(<line key={`c${y}-${z}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={`rgba(233,231,226,${a.toFixed(3)})`} strokeWidth={2} />);
    }
  }
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {lines}
    </svg>
  );
};
