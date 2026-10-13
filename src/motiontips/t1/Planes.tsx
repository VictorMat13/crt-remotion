import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile } from "remotion";
import { HookTerminal } from "./Terminal";
import { CX, CY, P, SCR, TERM, c01, dofPx, playFrom, powerOf, project, termPoint, type Cam, type Scr, type V3 } from "./rig";

// ===========================================================================
// The 3D planes of the hook: one CSS-3D stage on the rig's lens (model:
// src/artcraft/p1/Planes.tsx). Every plane carries its own depth-of-field blur,
// because a filter flattens anything 3D inside it. Planes that leave the frame
// are not mounted (no video decode for screens nobody sees); planes that come
// within a hair of the lens are trimmed / faded so the compositor never sees
// one crossing the camera.
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

/** depth haze: far planes sink a little toward black */
const haze = (cam: Cam, d: number) => 1 - 0.36 * c01((d - Math.max(1600, cam.focus)) / 5200);

const filterOf = (blurLocal: number, bright: number, extra = "") =>
  [blurLocal >= 0.35 ? `blur(${blurLocal.toFixed(2)}px)` : "", Math.abs(bright - 1) > 0.004 ? `brightness(${bright.toFixed(3)})` : "", extra]
    .join(" ")
    .trim() || undefined;

/** true when the projected quad lies completely outside the frame (all corners in front of the lens) */
const offFrame = (cam: Cam, pts: V3[], margin = 60) => {
  const q = pts.map((p) => project(cam, p));
  if (q.some((p) => p.d < 40)) return false;
  const xs = q.map((p) => p.sx);
  const ys = q.map((p) => p.sy);
  return Math.max(...xs) < -margin || Math.min(...xs) > 1080 + margin || Math.max(...ys) < -margin || Math.min(...ys) > 960 + margin;
};

// ------------------------------------------------------------- the terminal
export const TerminalPlane: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const corners = [termPoint(0, 0), termPoint(TERM.w, 0), termPoint(0, TERM.h), termPoint(TERM.w, TERM.h)];
  const dmin = Math.min(...corners.map((p) => project(cam, p).d));
  const fade = c01((dmin - 70) / 110);
  if (fade <= 0.002 || offFrame(cam, corners)) return null;
  const c = project(cam, termPoint(TERM.w / 2, TERM.h / 2));
  const blur = dofPx(cam, c.d) / c.s;
  const cos = Math.cos(TERM.lean);
  const sin = Math.sin(TERM.lean);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: TERM.w,
        height: TERM.h,
        transformOrigin: "0 0",
        // local (u, v) -> termPoint(u, v): stands on the floor at TERM.z, leaning back by TERM.lean
        transform: `translate3d(${-TERM.w / 2}px, ${(-TERM.h * cos).toFixed(2)}px, ${(TERM.z - TERM.h * sin).toFixed(2)}px) rotateX(${TERM.lean}rad)`,
        filter: filterOf(blur, 1),
        opacity: fade < 0.999 ? fade : undefined,
        backfaceVisibility: "hidden",
        boxShadow: "0 30px 70px rgba(0,0,0,0.75)",
        borderRadius: 18,
      }}
    >
      <HookTerminal frame={frame} />
    </div>
  );
};

// ------------------------------------------------------------- the screens
const D_MIN = 70; // nearest depth any part of a screen plane may reach
const SIDES = [-SCR.h / 2, SCR.h / 2];

/** local x span [lx0, lx1] of the screen that stays at least D_MIN in front of the lens.
 *  As the camera passes a screen, its near side (already far off the frame edge) is
 *  trimmed away instead of fading the whole set, so the screen slides out of frame. */
const visibleSpan = (s: Scr, cam: Cam): [number, number] | null => {
  const r = (s.rot * Math.PI) / 180;
  const dAt = (lx: number) =>
    Math.min(...SIDES.map((ly) => project(cam, { x: s.c.x + Math.cos(r) * lx, y: s.c.y + ly, z: s.c.z - Math.sin(r) * lx }).d));
  const a = -SCR.w / 2;
  const b = SCR.w / 2;
  const da = dAt(a);
  const db = dAt(b);
  if (da < D_MIN && db < D_MIN) return null;
  if (da >= D_MIN && db >= D_MIN) return [a, b];
  const t = (D_MIN - da) / (db - da);
  const cut = a + (b - a) * t;
  return da < D_MIN ? [cut, b] : [a, cut];
};

const screenCorners = (s: Scr, lx0: number, lx1: number): V3[] => {
  const r = (s.rot * Math.PI) / 180;
  return [lx0, lx1].flatMap((lx) => SIDES.map((ly) => ({ x: s.c.x + Math.cos(r) * lx, y: s.c.y + ly, z: s.c.z - Math.sin(r) * lx })));
};

/** The clips are CRT Scope renders already; through a second tube pass their dark
 *  ground sinks and their highlights bloom. Compress the range before the tube. */
const CRT_IN_CRT = "contrast(0.84) brightness(1.04)";

export const ScreenPlane: React.FC<{ s: Scr; cam: Cam; frame: number }> = ({ s, cam, frame }) => {
  const span = visibleSpan(s, cam);
  if (!span) return null;
  const [lx0, lx1] = span;
  const width = lx1 - lx0;
  if (width < 24) return null;
  if (offFrame(cam, screenCorners(s, lx0, lx1))) return null;
  const r = (s.rot * Math.PI) / 180;
  const mid = (lx0 + lx1) / 2;
  const c = project(cam, { x: s.c.x + Math.cos(r) * mid, y: s.c.y, z: s.c.z - Math.sin(r) * mid });
  const fade = c01((width - 24) / 120);
  const blur = dofPx(cam, c.d) / c.s;
  const pw = powerOf(s.i, frame);
  const over = 1 + 0.7 * pw.over;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height: SCR.h,
        overflow: "hidden",
        transformOrigin: "0 0",
        transform: `translate3d(${s.c.x}px, ${s.c.y}px, ${s.c.z}px) rotateY(${s.rot}deg) translate(${lx0.toFixed(2)}px, ${-SCR.h / 2}px)`,
        filter: filterOf(blur, haze(cam, c.d)),
        opacity: fade < 0.999 ? fade : undefined,
        backfaceVisibility: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: -(lx0 + SCR.w / 2), top: 0, width: SCR.w, height: SCR.h }}>
        {/* the set: grey glass in a light bezel, so an off screen still reads as a screen inside the tube */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            overflow: "hidden",
            background: "linear-gradient(172deg, #3A3E46 0%, #2A2D33 46%, #1E2025 100%)",
            border: "4px solid rgba(233,231,226,0.78)",
            boxSizing: "border-box",
          }}
        >
          {/* standby: the screen is dark, its picture a dim grey afterimage (the clip's first frame) */}
          {pw.open < 0.999 ? (
            <Img
              src={staticFile(s.clip.src.replace(".mp4", "-still.jpg"))}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.85) brightness(0.62) contrast(0.9)", opacity: 0.85 }}
            />
          ) : null}
          {pw.open > 0.001 ? (
            <div style={{ position: "absolute", inset: 0, transform: `scaleY(${Math.max(0.006, pw.open).toFixed(4)})`, transformOrigin: "50% 50%", background: "#000" }}>
              <Sequence from={playFrom(s.i)} layout="none">
                <OffthreadVideo
                  src={staticFile(s.clip.src)}
                  muted
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: `${CRT_IN_CRT} brightness(${over.toFixed(3)})`,
                  }}
                />
              </Sequence>
              {/* the picture comes up out of a white raster */}
              {pw.open < 0.999 ? <div style={{ position: "absolute", inset: 0, background: "#D8D6D0", opacity: 0.6 * (1 - pw.open) }} /> : null}
            </div>
          ) : null}
          {/* the beam: a bright line snaps across before the picture opens */}
          {pw.beam > 0.004 ? (
            <div
              style={{
                position: "absolute",
                left: `${(50 - 50 * pw.line).toFixed(2)}%`,
                width: `${(100 * pw.line).toFixed(2)}%`,
                top: SCR.h / 2 - 5,
                height: 10,
                borderRadius: 5,
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
