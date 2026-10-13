import React from "react";
import { Easing, interpolate } from "remotion";
import { FILLER, MOMENTS, MOMENT_NAME, Sprite, type Crop } from "./footage";
import { ClipCard, Marker } from "./Timeline";
import {
  ENTER,
  FLY,
  HEAD_X,
  LAND,
  LANE_H,
  LIFT,
  MARKER_RGB,
  MOMENT_W,
  MOMENT_X,
  PICK,
  STRIP,
  STRIP_H,
  TRAVEL,
  ZONE,
  clamp,
  scrollAt,
} from "./plan";

// ===========================================================================
// The source: two hours of footage as a strip of clips on Claude's trace
// (Resolve clip style: blue frame, filmstrip of real frames inside). It
// scrubs left under Claude's head, slowing on each best moment: a Resolve
// marker drops on the frame, a copy pops out and flies down onto track V4,
// turning into a clip as it lands. The source keeps its marker.
// ===========================================================================

const T = STRIP.thumbW;
const B = STRIP.border;

// clip lengths in frames-per-clip (deterministic), laid out end to end
const hash = (i: number) => Math.abs(Math.sin(i * 91.345 + 3.17) * 24634.6345) % 1;
type Thumb = { x: number; clip: number };
type Clip = { x: number; n: number; first: number };
export const LAYOUT = (() => {
  const thumbs: Thumb[] = [];
  const clips: Clip[] = [];
  let x = 0;
  let c = 0;
  while (x < 20000) {
    const n = 2 + Math.floor(hash(c) * 4); // 2..5 frames per clip
    clips.push({ x, n, first: thumbs.length });
    for (let j = 0; j < n; j++) thumbs.push({ x: x + B + j * T, clip: c });
    x += n * T + 2 * B + STRIP.gap;
    c++;
  }
  return { thumbs, clips };
})();

/** the frame under the head when each marker drops */
export const PICK_IDX = (() => {
  const out: number[] = [];
  PICK.forEach((t) => {
    const target = HEAD_X - STRIP.x0 + scrollAt(t);
    let best = 0;
    LAYOUT.thumbs.forEach((th, i) => {
      if (Math.abs(th.x + T / 2 - target) < Math.abs(LAYOUT.thumbs[best].x + T / 2 - target)) best = i;
    });
    while (out.includes(best)) best++;
    out.push(best);
  });
  return out;
})();

const IMG: Crop[] = LAYOUT.thumbs.map((_, i) => {
  const k = PICK_IDX.indexOf(i);
  if (k >= 0) return MOMENTS[k];
  let j = Math.floor(hash(i + 400) * FILLER.length);
  // no frame twice in a row
  if (i > 0 && j === Math.floor(hash(i + 399) * FILLER.length)) j = (j + 7) % FILLER.length;
  return FILLER[j];
});

const MARK_LEAD = 46; // room above the strip for the markers

export const Strip: React.FC<{ frame: number }> = ({ frame: f }) => {
  const S = scrollAt(f);
  const winW = STRIP.x1 - STRIP.x0;
  const visible = (x: number, w: number) => x - S + w > -40 && x - S < winW + 40;
  return (
    <div
      style={{
        position: "absolute",
        left: STRIP.x0,
        top: STRIP.top - MARK_LEAD,
        width: winW,
        height: STRIP_H + MARK_LEAD,
        overflow: "hidden",
      }}
    >
      {LAYOUT.clips.map((c, ci) => {
        const w = c.n * T + 2 * B;
        if (!visible(c.x, w)) return null;
        return (
          <div
            key={ci}
            style={{
              position: "absolute",
              left: c.x - S,
              top: MARK_LEAD,
              width: w,
              height: STRIP_H,
              boxSizing: "border-box",
              borderRadius: 6,
              border: `${B}px solid rgb(67,118,161)`,
              background: "#000",
              overflow: "hidden",
            }}
          >
            {Array.from({ length: c.n }, (_, j) => {
              const i = c.first + j;
              return (
                <Sprite
                  key={j}
                  crop={IMG[i]}
                  width={T - 2}
                  height={STRIP.thumbH}
                  style={{ left: j * T + 1, top: 0 }}
                />
              );
            })}
          </div>
        );
      })}
      {/* best moments: a marker drops onto the frame under the head; the frame keeps an outline in its colour */}
      {PICK_IDX.map((i, k) => {
        const t = PICK[k];
        if (f < t - 4) return null;
        const th = LAYOUT.thumbs[i];
        if (!visible(th.x, T)) return null;
        const drop = interpolate(f, [t - 4, t + 1], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 0, 0, 1) });
        const ring = interpolate(f, [t - 1, t + 3], [0, 1], { ...clamp, easing: ENTER });
        const x = th.x - S;
        return (
          <React.Fragment key={k}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: MARK_LEAD + B,
                width: T,
                height: STRIP.thumbH,
                boxSizing: "border-box",
                border: `4px solid rgba(${MARKER_RGB[k]},${(0.95 * ring).toFixed(3)})`,
                background: `rgba(${MARKER_RGB[k]},${(0.12 * ring).toFixed(3)})`,
              }}
            />
            <Marker x={x + T / 2} y={MARK_LEAD + 14 - 34 * (1 - drop)} rgb={MARKER_RGB[k]} size={30} opacity={drop} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- flights
const FLY_X = Easing.bezier(0.45, 0, 0.25, 1);

export const Flights: React.FC<{ frame: number; font: string }> = ({ frame: f, font }) => (
  <>
    {PICK.map((t, k) => {
      if (f < t || f >= LAND[k]) return null;
      const th = LAYOUT.thumbs[PICK_IDX[k]];
      const s0 = scrollAt(t);
      const a = { x: STRIP.x0 + th.x - s0, y: STRIP.top + B, w: T, h: STRIP.thumbH };
      const b = { x: MOMENT_X[k] + 1, y: ZONE.y0 + 4, w: MOMENT_W[k] - 2, h: LANE_H - 8 };
      const lift = interpolate(f, [t, t + LIFT], [0, 1], { ...clamp, easing: ENTER });
      const p = interpolate(f, [t + LIFT, t + LIFT + FLY], [0, 1], clamp);
      const px = FLY_X(p);
      const py = TRAVEL(p);
      const pz = TRAVEL(p);
      const pop = 1 + 0.08 * lift * (1 - pz);
      const w = (a.w + (b.w - a.w) * pz) * pop;
      const h = (a.h + (b.h - a.h) * pz) * pop;
      const cx = a.x + a.w / 2 + (b.x + b.w / 2 - (a.x + a.w / 2)) * px;
      const cy = a.y + a.h / 2 + (b.y + b.h / 2 - (a.y + a.h / 2)) * py;
      return (
        <ClipCard
          key={k}
          x={cx - w / 2}
          y={cy - h / 2}
          w={w}
          h={h}
          crop={MOMENTS[k]}
          m={pz}
          name={MOMENT_NAME[k]}
          font={font}
          marker={MARKER_RGB[k]}
          shadow={lift * (1 - pz * 0.8)}
        />
      );
    })}
  </>
);
