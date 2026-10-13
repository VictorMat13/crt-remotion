import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { LOGOS } from "../theme";
import { FILLER, MOMENTS, MOMENT_NAME, NEAR, Sprite, type Crop } from "./footage";
import {
  CLAUDE,
  CX,
  CY,
  H,
  W,
  DECEL,
  ENTER,
  LAND,
  LIFT,
  MARKER_RGB,
  MOMENT_IDX,
  P,
  PICK,
  STRIP,
  STRIP_H,
  THUMBS,
  TL,
  TRACE_Y,
  TRAVEL,
  c01,
  dofPx,
  haze,
  lerp,
  panelAt,
  project,
  seg,
  slotOf,
  stripAt,
  thumbMid,
  type Cam,
  type V3,
} from "./rig";

// ===========================================================================
// The 3D planes of the hook on one CSS-3D stage (the rig's lens). Every plane
// carries its own depth-of-field blur, because a filter flattens anything 3D
// inside it. Planes that come within a hair of the lens are trimmed / faded so
// the compositor never sees one crossing the camera.
//  - the source strip: one plane per frame, Resolve clip style (blue clip
//    body, the frame inset, rounded clip ends), on the wall x = STRIP.x
//  - the moments: a marker drops on the frame, a copy lifts off and flies
//    across the room onto its slot on V4, morphing into a timeline clip
//  - the Claude mark on the trace at the strip's near end
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

const filterOf = (blurLocal: number, bright: number, extra = "") =>
  [blurLocal >= 0.35 ? `blur(${blurLocal.toFixed(2)}px)` : "", Math.abs(bright - 1) > 0.004 ? `brightness(${bright.toFixed(3)})` : "", extra]
    .join(" ")
    .trim() || undefined;

const CLIP_BLUE = "67,118,161"; // Resolve's video clip colour (V2 B ROLL)
/** bright footage blooms in the tube: graded down a little */
const STRIP_BRIGHT = 0.74;

// ------------------------------------------------------------- the source strip
const N_FRAMES = 64; // ~76k px of source, the rest sinks into the horizon
const D_MIN = 90; // nearest depth any part of a plane may reach
const MARK = 150; // marker size on the strip (world px)
const LEAD = 190; // room above a moment's frame for its marker

const hash = (i: number) => Math.abs(Math.sin(i * 12.9898 + 4.1) * 43758.5453) % 1;
/** the picture in strip frame i */
export const frameCrop = (i: number): Crop => {
  const k = (MOMENT_IDX as readonly number[]).indexOf(i);
  if (k >= 0) return MOMENTS[k];
  const near = [0, 3, 5, 7, 8];
  const n = near.indexOf(i);
  if (n >= 0) return NEAR[n];
  let j = Math.floor(hash(i) * FILLER.length);
  if (j === Math.floor(hash(i - 1) * FILLER.length)) j = (j + 7) % FILLER.length;
  return FILLER[j];
};

/** sx span [a, b] of a strip plane that stays at least D_MIN in front of the lens (depth is affine in sx) */
const inFront = (cam: Cam, a: number, b: number, y0: number, y1: number): [number, number] | null => {
  const dAt = (sx: number) => Math.min(project(cam, stripAt(sx, y0)).d, project(cam, stripAt(sx, y1)).d);
  const da = dAt(a);
  const db = dAt(b);
  if (da < D_MIN && db < D_MIN) return null;
  if (da >= D_MIN && db >= D_MIN) return [a, b];
  const t = (D_MIN - da) / (db - da);
  const cut = a + (b - a) * t;
  return da < D_MIN ? [cut, b] : [a, cut];
};

// Planes are also trimmed to a box around the frame: a plane that runs past the lens projects
// tens of thousands of px wide, and with its blur filter that exceeds the GPU's texture size
// (the page then fails to paint). The strip's edge is a straight line, so the part inside the
// box is one interval of sx: each end outside it is pulled in by bisection.
const BOX = 700;
const inBox = (cam: Cam, sx: number, y0: number, y1: number) => {
  const p0 = project(cam, stripAt(sx, y0));
  const p1 = project(cam, stripAt(sx, y1));
  const xIn = Math.max(p0.sx, p1.sx) > -BOX && Math.min(p0.sx, p1.sx) < W + BOX;
  const yIn = Math.max(p0.sy, p1.sy) > -BOX && Math.min(p0.sy, p1.sy) < H + BOX;
  return xIn && yIn && p1.sy - p0.sy < 2.6 * H;
};
const pullIn = (cam: Cam, out: number, inside: number, y0: number, y1: number) => {
  let lo = out;
  let hi = inside;
  for (let k = 0; k < 18; k++) {
    const mid = (lo + hi) / 2;
    if (inBox(cam, mid, y0, y1)) hi = mid;
    else lo = mid;
  }
  return hi;
};
export const visibleSx = (cam: Cam, a: number, b: number, y0: number, y1: number): [number, number] | null => {
  const span = inFront(cam, a, b, y0, y1);
  if (!span) return null;
  let [s0, s1] = span;
  const in0 = inBox(cam, s0, y0, y1);
  const in1 = inBox(cam, s1, y0, y1);
  if (!in0 && !in1) {
    // both ends outside: on screen only if the middle is (a plane spanning the frame)
    const mid = (s0 + s1) / 2;
    if (!inBox(cam, mid, y0, y1)) return null;
    s0 = pullIn(cam, s0, mid, y0, y1);
    s1 = pullIn(cam, s1, mid, y0, y1);
  } else if (!in0) s0 = pullIn(cam, s0, s1, y0, y1);
  else if (!in1) s1 = pullIn(cam, s1, s0, y0, y1);
  return [s0, s1];
};

const StripFrame: React.FC<{ i: number; cam: Cam; frame: number }> = ({ i, cam, frame: f }) => {
  const th = THUMBS[i];
  const B = STRIP.border;
  const k = (MOMENT_IDX as readonly number[]).indexOf(i);
  const lead = k >= 0 ? LEAD : 0;
  // the plane: the frame plus its share of the clip body
  const a = th.sx - (th.first ? B : 0);
  const b = th.sx + STRIP.fw + (th.last ? B : 0);
  const span = visibleSx(cam, a, b, -lead, STRIP_H);
  if (!span) return null;
  const [s0, s1] = span;
  const width = s1 - s0;
  if (width < 4) return null;
  const c = project(cam, stripAt((s0 + s1) / 2, STRIP_H / 2));
  if (c.d < D_MIN) return null;
  const blur = dofPx(cam, c.d) / c.s;
  const ring = k >= 0 ? seg(f, PICK[k] - 1, PICK[k] + 4, ENTER) : 0;
  const drop = k >= 0 ? seg(f, PICK[k] - 5, PICK[k] + 1, DECEL) : 0;
  const flash = k >= 0 ? ring * (1 - seg(f, PICK[k] + 2, PICK[k] + 20, DECEL)) : 0;
  // frames right by the lens are out of focus and huge: kept a little darker so they never bloom
  const bright = STRIP_BRIGHT * haze(cam, c.d) * (0.8 + 0.2 * c01((c.d - 900) / 1600)) * (1 + 0.35 * flash);
  const rx = th.first ? 22 : 0;
  const rr = th.last ? 22 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height: STRIP_H + lead,
        overflow: "hidden",
        transformOrigin: "0 0",
        transform: `translate3d(${STRIP.x}px, ${STRIP.top - lead}px, ${STRIP.z0 - s0}px) rotateY(90deg)`,
        filter: filterOf(blur, bright),
        backfaceVisibility: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: a - s0, top: lead, width: b - a, height: STRIP_H }}>
        {/* the clip body */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `rgb(${CLIP_BLUE})`,
            borderTopLeftRadius: rx,
            borderBottomLeftRadius: rx,
            borderTopRightRadius: rr,
            borderBottomRightRadius: rr,
          }}
        />
        {/* the frame, a hairline of black between frames */}
        <Sprite
          crop={frameCrop(i)}
          width={STRIP.fw - 6}
          height={STRIP.fh}
          style={{ left: (th.first ? B : 0) + 3, top: B, background: "#000", borderRadius: 4 }}
        />
        {k >= 0 && ring > 0.001 ? (
          <div
            style={{
              position: "absolute",
              left: (th.first ? B : 0) + 3,
              top: B,
              width: STRIP.fw - 6,
              height: STRIP.fh,
              boxSizing: "border-box",
              border: `22px solid rgba(${MARKER_RGB[k]},${(0.95 * ring).toFixed(3)})`,
              background: `rgba(${MARKER_RGB[k]},${(0.1 * ring).toFixed(3)})`,
            }}
          />
        ) : null}
      </div>
      {k >= 0 && drop > 0.001 ? (
        <Marker x={a - s0 + (b - a) / 2} y={lead + B + 40 - 130 * (1 - drop)} rgb={MARKER_RGB[k]} size={MARK} opacity={drop} />
      ) : null}
    </div>
  );
};

/** Resolve's marker: a rounded tab with a pointed foot (tip at x, y) */
export const Marker: React.FC<{ x: number; y: number; rgb: string; size?: number; opacity?: number }> = ({ x, y, rgb, size = 30, opacity = 1 }) => {
  const w = size;
  const h = size * 1.15;
  return (
    <svg width={w} height={h} viewBox="0 0 28 32" style={{ position: "absolute", left: x - w / 2, top: y - h, overflow: "visible", opacity }}>
      <path d="M4 0 H24 Q28 0 28 4 V19 L14 31 L0 19 V4 Q0 0 4 0 Z" fill={`rgb(${rgb})`} stroke="rgba(0,0,0,0.55)" strokeWidth={1.4} />
    </svg>
  );
};

export const StripPlanes: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => (
  <>
    {Array.from({ length: N_FRAMES }, (_, i) => (
      <StripFrame key={i} i={i} cam={cam} frame={frame} />
    ))}
  </>
);

// ------------------------------------------------------------- the moments in flight
/**
 * A clip as Resolve draws it on a video track (blue body, thumbnail band on
 * top, truncated name below). `m` morphs from the strip's frame (0) to the
 * timeline clip (1). Sizes in the plane's own px.
 */
export const ClipCard: React.FC<{ w: number; h: number; crop: Crop; m: number; name: string; font: string; marker?: string }> = ({
  w,
  h,
  crop,
  m,
  name,
  font,
  marker,
}) => {
  const pad = lerp(STRIP.border, 4.5, m);
  const band = lerp(h - 2 * pad, 60, m);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxSizing: "border-box",
        borderRadius: lerp(22, 6, m),
        background: `rgb(${CLIP_BLUE})`,
        border: m > 0.5 ? "1.5px solid rgb(14,16,20)" : undefined,
      }}
    >
      <Sprite crop={crop} width={Math.max(1, w - 2 * pad - (m > 0.5 ? 3 : 0))} height={Math.max(1, band)} style={{ left: pad, top: pad, borderRadius: lerp(4, 3, m) }} />
      {m > 0.4 ? (
        <div
          style={{
            position: "absolute",
            left: 9,
            top: pad + band + 8,
            fontFamily: font,
            fontSize: 25,
            fontWeight: 500,
            color: "#FFFFFF",
            whiteSpace: "nowrap",
            opacity: interpolate(m, [0.4, 0.85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          {name}
        </div>
      ) : null}
      {marker ? <Marker x={w / 2} y={lerp(26, 12, m)} rgb={marker} size={lerp(MARK, 30, m)} /> : null}
    </div>
  );
};


/** the flying copy of moment k at frame f: world centre, yaw (deg), plane size, morph */
export const flightOf = (k: number, f: number) => {
  const i = MOMENT_IDX[k];
  const t = PICK[k];
  if (f < t || f >= LAND[k]) return null;
  const slot = slotOf(k);
  const A: V3 = stripAt(thumbMid(i), STRIP_H / 2, 4);
  const lift = seg(f, t, t + LIFT, ENTER);
  const A1: V3 = { ...A, x: A.x + 260 * lift };
  const Bc: V3 = panelAt(TL, slot.u + slot.w / 2, slot.v + slot.h / 2, 3);
  const p = c01((f - t - LIFT) / (LAND[k] - t - LIFT));
  const kp = TRAVEL(p);
  // it peels off the wall into the room and races out of the deep (depth and sideways close
  // early, decel), staying above the timeline panel; then it drops into its slot (travel, late)
  const kz = DECEL(seg(p, 0, 0.8, (n) => n));
  const ky = seg(p, 0.35, 1);
  const arc = Math.sin(Math.PI * kz);
  const pos: V3 = {
    x: lerp(A1.x, Bc.x, kz) + 420 * arc,
    y: lerp(A1.y, Bc.y, ky),
    z: lerp(A1.z, Bc.z, kz) + 260 * Math.sin(Math.PI * kp),
  };
  const rot = 90 * (1 - seg(p, 0.05, 0.7));
  const ks = seg(p, 0.25, 1); // a full frame as it leaves, settling into the clip as it lands
  const pop = 1 + 0.06 * lift * (1 - ks);
  const w = lerp(STRIP.fw + 2 * STRIP.border, slot.w, ks) * pop;
  const h = lerp(STRIP_H, slot.h, ks) * pop;
  const m = seg(p, 0.62, 1);
  return { pos, rot, w, h, m };
};

export const Flights: React.FC<{ cam: Cam; frame: number; font: string }> = ({ cam, frame: f, font }) => (
  <>
    {PICK.map((_, k) => {
      const fl = flightOf(k, f);
      if (!fl) return null;
      const c = project(cam, fl.pos);
      if (c.d < D_MIN + fl.w * 0.5) return null;
      const blur = dofPx(cam, c.d) / c.s;
      const bright = STRIP_BRIGHT * haze(cam, c.d) * lerp(1, 1.08, fl.m);
      return (
        <div
          key={k}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: fl.w,
            height: fl.h,
            transformOrigin: "0 0",
            transform: `translate3d(${fl.pos.x}px, ${fl.pos.y}px, ${fl.pos.z}px) rotateY(${fl.rot}deg) translate(${-fl.w / 2}px, ${-fl.h / 2}px)`,
            filter: filterOf(blur, bright),
            backfaceVisibility: "hidden",
          }}
        >
          <ClipCard w={fl.w} h={fl.h} crop={MOMENTS[k]} m={fl.m} name={MOMENT_NAME[k]} font={font} marker={MARKER_RGB[k]} />
        </div>
      );
    })}
  </>
);

// ------------------------------------------------------------- the Claude mark on the trace
export const CLAUDE_AT: V3 = { x: STRIP.x, y: TRACE_Y, z: CLAUDE.z };

export const ClaudePlane: React.FC<{ cam: Cam }> = ({ cam }) => {
  const size = CLAUDE.size;
  const c = project(cam, CLAUDE_AT);
  // fades out well before the lens reaches it
  const fade = c01((c.d - 160) / 220);
  if (fade <= 0.002) return null;
  const blur = dofPx(cam, c.d) / c.s;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: size,
        height: size,
        transformOrigin: "0 0",
        // stands upright on the trace, turned to the lens in yaw only
        transform: `translate3d(${CLAUDE_AT.x}px, ${CLAUDE_AT.y}px, ${CLAUDE_AT.z}px) rotateY(${-cam.th}rad) translate(${-size / 2}px, ${-size / 2}px)`,
        filter: filterOf(blur, 1),
        opacity: fade < 0.999 ? fade : undefined,
        backfaceVisibility: "hidden",
      }}
    >
      <Img src={staticFile(LOGOS.claude)} style={{ width: size, height: size, display: "block" }} />
    </div>
  );
};

/** world quads that hide the screen-space trace (ray tests in Trace.tsx) */
export type Quad = { c: V3; u: V3; hw: number; hh: number };
export const occluders = (cam: Cam, f: number): Quad[] => {
  const out: Quad[] = [];
  // the Claude mark (faces the camera in yaw)
  out.push({ c: CLAUDE_AT, u: { x: Math.cos(-cam.th), y: 0, z: -Math.sin(-cam.th) }, hw: CLAUDE.size * 0.42, hh: CLAUDE.size * 0.42 });
  // the moments in flight
  PICK.forEach((_, k) => {
    const fl = flightOf(k, f);
    if (!fl) return;
    const r = (fl.rot * Math.PI) / 180;
    out.push({ c: fl.pos, u: { x: Math.cos(r), y: 0, z: -Math.sin(r) }, hw: fl.w / 2, hh: fl.h / 2 });
  });
  return out;
};
