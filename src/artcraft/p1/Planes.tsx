import React from "react";
import { Img, staticFile } from "remotion";
import { appIcon, appShot, LOGOS } from "../theme";
import { CLAUDE, CX, CY, ICON, P, WIN, c01, dofPx, powerOf, project, type Cam, type V3, type Win } from "./rig";

// ===========================================================================
// The 3D planes of the hook: one CSS-3D stage on the rig's lens; every plane
// (window, icon, the Claude mark) carries its own depth-of-field blur, because
// a filter flattens anything 3D inside it. Planes that come within a hair of
// the lens fade out so the compositor never sees one crossing the camera.
// ===========================================================================

export const Stage: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => {
  const tf = `translateZ(${P}px) rotateX(${cam.ph}rad) rotateY(${cam.th}rad) translate3d(${-cam.C.x}px, ${-cam.C.y}px, ${-cam.C.z}px)`;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: `${P}px`, perspectiveOrigin: `${CX}px ${CY}px` }}>
      <div style={{ position: "absolute", left: CX, top: CY, width: 0, height: 0, transformStyle: "preserve-3d", transformOrigin: "0 0", transform: tf }}>
        {children}
      </div>
    </div>
  );
};

/** opacity that fades a plane out before any corner reaches the lens */
const nearFade = (cam: Cam, pts: V3[]) => {
  const d = Math.min(...pts.map((p) => project(cam, p).d));
  return c01((d - 60) / 110);
};

/** depth haze: far planes sink a little toward black */
const haze = (cam: Cam, d: number) => 1 - 0.38 * c01((d - Math.max(1400, cam.focus)) / 5200);

const filterOf = (blurLocal: number, bright: number) =>
  [blurLocal >= 0.35 ? `blur(${blurLocal.toFixed(2)}px)` : "", Math.abs(bright - 1) > 0.004 ? `brightness(${bright.toFixed(3)})` : ""].join(" ").trim() || undefined;

// ------------------------------------------------------------- windows
const D_MIN = 70; // nearest depth any part of a window plane may reach
const SIDES = [-WIN.h / 2, WIN.h / 2];

/** local x span [lx0, lx1] of the window that stays at least D_MIN in front of the lens.
 *  As the camera passes a window, its near side (already far off the frame edge) is
 *  trimmed away instead of fading the whole set, so the window slides out of frame. */
const visibleSpan = (w: Win, cam: Cam): [number, number] | null => {
  const r = (w.rot * Math.PI) / 180;
  const dAt = (lx: number) =>
    Math.min(...SIDES.map((ly) => project(cam, { x: w.c.x + Math.cos(r) * lx, y: w.c.y + ly, z: w.c.z - Math.sin(r) * lx }).d));
  const a = -WIN.w / 2;
  const b = WIN.w / 2;
  const da = dAt(a);
  const db = dAt(b);
  if (da < D_MIN && db < D_MIN) return null;
  if (da >= D_MIN && db >= D_MIN) return [a, b];
  // depth is affine along the plane: solve for the cut
  const t = (D_MIN - da) / (db - da);
  const cut = a + (b - a) * t;
  return da < D_MIN ? [cut, b] : [a, cut];
};

export const WindowPlane: React.FC<{ w: Win; cam: Cam; frame: number }> = ({ w, cam, frame }) => {
  const span = visibleSpan(w, cam);
  if (!span) return null;
  const [lx0, lx1] = span;
  const width = lx1 - lx0;
  if (width < 24) return null;
  const r = (w.rot * Math.PI) / 180;
  const mid = (lx0 + lx1) / 2;
  const c = project(cam, { x: w.c.x + Math.cos(r) * mid, y: w.c.y, z: w.c.z - Math.sin(r) * mid });
  // the last sliver fades as it leaves (it is far off the frame edge by then)
  const fade = c01((width - 24) / 120);
  const blur = dofPx(cam, c.d) / c.s;
  const pw = powerOf(w.i, frame);

  // the screen is alive: a slow drift inside the picture
  const dx = 16 * Math.sin(frame / 63 + w.i * 1.7);
  const dy = 9 * Math.cos(frame / 77 + w.i * 0.9);
  const zoom = 1.07 + 0.015 * Math.sin(frame / 91 + w.i);
  const over = 1 + 1.3 * pw.over;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height: WIN.h,
        overflow: "hidden",
        transformOrigin: "0 0",
        transform: `translate3d(${w.c.x}px, ${w.c.y}px, ${w.c.z}px) rotateY(${w.rot}deg) translate(${lx0.toFixed(2)}px, ${-WIN.h / 2}px)`,
        filter: filterOf(blur, haze(cam, c.d)),
        opacity: fade < 0.999 ? fade : undefined,
        backfaceVisibility: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: -(lx0 + WIN.w / 2), top: 0, width: WIN.w, height: WIN.h }}>
      {/* the set: grey glass in a light bezel, so an off screen still reads as a screen inside the tube */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 14,
          overflow: "hidden",
          background: "linear-gradient(172deg, #555A63 0%, #3C4048 46%, #2C2F35 100%)",
          border: "4px solid rgba(233,231,226,0.78)",
          boxSizing: "border-box",
        }}
      >
        {pw.open > 0.001 ? (
          <div style={{ position: "absolute", inset: 0, transform: `scaleY(${Math.max(0.006, pw.open).toFixed(4)})`, transformOrigin: "50% 50%" }}>
            <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
              <Img
                src={staticFile(appShot(w.id))}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${zoom.toFixed(4)})`,
                  filter: `${w.grade} brightness(${(w.bright * over).toFixed(3)})`,
                }}
              />
            </div>
            {/* the picture comes up out of a white raster */}
            {pw.open < 0.999 ? <div style={{ position: "absolute", inset: 0, background: "#F3F1EC", opacity: 0.9 * (1 - pw.open) }} /> : null}
          </div>
        ) : null}
        {/* the beam: a bright line snaps across before the picture opens */}
        {pw.beam > 0.004 ? (
          <div
            style={{
              position: "absolute",
              left: `${(50 - 50 * pw.line).toFixed(2)}%`,
              width: `${(100 * pw.line).toFixed(2)}%`,
              top: WIN.h / 2 - 4,
              height: 8,
              borderRadius: 4,
              background: "#FFFFFF",
              opacity: pw.beam,
            }}
          />
        ) : null}
      </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------- icons on the rail
const Upright: React.FC<{ cam: Cam; at: V3; size: number; children: React.ReactNode; bright?: number; extra?: string; radius?: number }> = ({
  cam,
  at,
  size,
  children,
  bright = 1,
  extra = "",
  radius = 0,
}) => {
  const half = size / 2;
  const fade = nearFade(cam, [
    { x: at.x - half, y: at.y - half, z: at.z },
    { x: at.x + half, y: at.y + half, z: at.z },
  ]);
  if (fade <= 0.002) return null;
  const c = project(cam, at);
  if (c.d < 20) return null;
  const blur = dofPx(cam, c.d) / c.s;
  const f = [filterOf(blur, bright * haze(cam, c.d)) ?? "", extra].join(" ").trim();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: size,
        height: size,
        transformOrigin: "0 0",
        // stands upright, turned to the lens in yaw only (it still foreshortens from above)
        transform: `translate3d(${at.x}px, ${at.y}px, ${at.z}px) rotateY(${-cam.th}rad) translate(${-half}px, ${-half}px)`,
        filter: f || undefined,
        opacity: fade < 0.999 ? fade : undefined,
        borderRadius: radius,
        overflow: radius ? "hidden" : undefined,
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </div>
  );
};

export const IconPlane: React.FC<{ w: Win; cam: Cam; frame: number }> = ({ w, cam, frame }) => {
  const wake = powerOf(w.i, frame).wake;
  // asleep: greyed and dimmed (still readable through the tube), awake: the real icon
  const extra = wake < 0.995 ? `grayscale(${(0.75 * (1 - wake)).toFixed(3)})` : "";
  return (
    <Upright cam={cam} at={{ x: 0, y: -ICON / 2, z: w.z }} size={ICON} bright={0.72 + 0.28 * wake} extra={extra} radius={ICON * 0.22}>
      <Img src={staticFile(appIcon(w.id))} style={{ width: ICON, height: ICON, display: "block" }} />
    </Upright>
  );
};

export const ClaudePlane: React.FC<{ cam: Cam }> = ({ cam }) => (
  <Upright cam={cam} at={{ x: 0, y: -CLAUDE.size / 2, z: CLAUDE.z }} size={CLAUDE.size}>
    <Img src={staticFile(LOGOS.claude)} style={{ width: CLAUDE.size, height: CLAUDE.size, display: "block" }} />
  </Upright>
);

