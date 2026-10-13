import React from "react";
import { Img, staticFile } from "remotion";
import { FONT_UI, PH } from "../theme";
import {
  CX,
  CY,
  PAGES,
  POOL,
  READOUT,
  READ_SCALE,
  TRIM,
  WHEELS,
  WHEEL_Y,
  activeOf,
  hump,
  pageRect,
  puckAt,
  rippleShift,
  seg,
  slotXY,
  trimEdge,
  viewRect,
  DECEL,
  ENTER,
  type Cam,
  type Page,
  type PageId,
} from "./rig";

// ===========================================================================
// The wall of real Resolve 21 pages on one flat stage under the camera, and
// the work happening on them, built in each shot's own pixels so it lines up
// with the real UI underneath:
//   Color  the HDR wheels' pucks drift (the real centre puck is patched out,
//          crosshair redrawn) and their X/Y readouts tick;
//   Edit   the A002 pair's tail (V2 + linked A2) trims in, the clips after it
//          ripple left; Claude's coral bracket rides the edit point;
//   Edit   the eight B003 clips (real thumbnails + names, cropped from the
//          shot) re-sort from shuffled into name order, C001..C008.
// ===========================================================================

const CORAL = PH.claude;

/** a crop of the page's own shot, at its own pixel position (or moved by dx/dy) */
const Crop: React.FC<{ src: string; sw: number; sh: number; x: number; y: number; w: number; h: number; dx?: number; dy?: number; style?: React.CSSProperties }> = ({
  src,
  sw,
  sh,
  x,
  y,
  w,
  h,
  dx = 0,
  dy = 0,
  style,
}) => (
  <div style={{ position: "absolute", left: x + dx, top: y + dy, width: w, height: h, overflow: "hidden", ...style }}>
    <Img src={staticFile(src)} style={{ position: "absolute", left: -x, top: -y, width: sw, height: sh, maxWidth: "none", display: "block" }} />
  </div>
);

// ---------------------------------------------------------------- Color: the HDR wheels
const fmt = (v: number) => (Math.abs(v) < 0.005 ? "0.00" : v.toFixed(2));

const Readout: React.FC<{ x: number; value: number }> = ({ x, value }) => (
  <div style={{ position: "absolute", left: x, top: READOUT.y0, width: READOUT.w, height: READOUT.y1 - READOUT.y0 }}>
    <div style={{ position: "absolute", left: 4, top: 4, right: 4, bottom: 4, backgroundColor: "rgb(31,31,31)" }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        paddingRight: 5,
        textAlign: "center",
        lineHeight: `${READOUT.y1 - READOUT.y0}px`,
        fontFamily: FONT_UI,
        fontSize: READOUT.font,
        fontWeight: 400,
        color: "rgb(228,228,228)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {fmt(value)}
    </div>
  </div>
);

const ColorWork: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {WHEELS.map((wh) => {
      const { dx, dy } = puckAt(wh, frame);
      if (Math.hypot(dx, dy) < 0.25) return null;
      const R = 60;
      const line = "rgb(107,104,104)";
      const xb = READOUT.xBox[wh.name];
      return (
        <React.Fragment key={wh.name}>
          <svg width={2 * R} height={2 * R} style={{ position: "absolute", left: wh.cx - R, top: WHEEL_Y - R, overflow: "visible" }}>
            {/* the real centre puck patched out, its crosshair redrawn */}
            <circle cx={R} cy={R} r={11} fill="rgb(60,57,57)" />
            <rect x={R - 1} y={R - 12} width={2} height={24} fill={line} />
            <rect x={R - 12} y={R - 1} width={24} height={2} fill={line} />
            {/* the puck where the grade has pushed it */}
            <circle cx={R + dx} cy={R + dy + 1.8} r={8} fill="rgba(12,12,14,0.8)" />
            <circle cx={R + dx} cy={R + dy} r={6.6} fill="rgb(222,222,222)" />
          </svg>
          <Readout x={xb} value={dx * READ_SCALE} />
          <Readout x={xb + 100} value={-dy * READ_SCALE} />
        </React.Fragment>
      );
    })}
  </>
);

// ---------------------------------------------------------------- Edit: trim + ripple
const EDIT_SRC = "resolve/shots/bmd-resolve21-Edit-hires.png";
const LANE = "rgb(40,40,46)";

const Trim: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < TRIM.select - 1) return null;
  const e = trimEdge(frame);
  const sh = rippleShift(frame);
  const moved = TRIM.end0 - e > 0.2 || sh > 0.2;
  const sel = seg(frame, TRIM.select - 1, TRIM.select + 3, ENTER) * (1 - seg(frame, TRIM.release[0], TRIM.release[1], DECEL));
  const capX = TRIM.end0 + 2 - TRIM.cap;
  return (
    <>
      {moved
        ? [TRIM.v2, TRIM.a2].map(([y0, y1], i) => (
            <React.Fragment key={i}>
              {/* the lane behind the clip's old tail and the clips that ripple */}
              <div style={{ position: "absolute", left: e + 2, top: y0, width: TRIM.after[1] - e - 2, height: y1 - y0, backgroundColor: LANE }} />
              {/* the clip's real right end, riding the trimmed edge */}
              <Crop src={EDIT_SRC} sw={5120} sh={2880} x={capX} y={y0} w={TRIM.cap} h={y1 - y0} dx={e - TRIM.end0} />
              {/* the clips after it, rippled left (clipped at the lane's end) */}
              <div style={{ position: "absolute", left: 0, top: 0, width: TRIM.after[1], height: 2880, overflow: "hidden" }}>
                <Crop src={EDIT_SRC} sw={5120} sh={2880} x={TRIM.after[0]} y={y0} w={TRIM.after[1] - TRIM.after[0]} h={y1 - y0} dx={-sh} />
              </div>
            </React.Fragment>
          ))
        : null}
      {/* Claude's selection on the edit point (Resolve's trim bracket, in coral) */}
      {sel > 0.01 ? (
        <svg width={5120} height={2880} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {[TRIM.v2, TRIM.a2].map(([y0, y1], i) => (
            <path
              key={i}
              d={`M ${e - 34} ${y0 + 6} L ${e + 1} ${y0 + 6} L ${e + 1} ${y1 - 6} L ${e - 34} ${y1 - 6}`}
              fill="none"
              stroke={CORAL}
              strokeWidth={12}
              strokeLinejoin="round"
              opacity={sel}
            />
          ))}
        </svg>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- Edit: the media pool sort
const Pool: React.FC<{ frame: number }> = ({ frame }) => {
  const cards = POOL.start.map((from, k) => {
    const t = POOL.t0 + POOL.stagger * k;
    const p = seg(frame, t, t + POOL.dur);
    const a = slotXY(from);
    const b = slotXY(k);
    return { k, x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, lift: hump(frame, t, t + POOL.dur), moving: p > 0 && p < 1 };
  });
  // moving cards ride over the settled ones
  const order = [...cards].sort((u, v) => Number(u.moving) - Number(v.moving) || u.lift - v.lift);
  const c = POOL.cover;
  return (
    <>
      <div style={{ position: "absolute", left: c.x0, top: c.y0, width: c.x1 - c.x0, height: c.y1 - c.y0, backgroundColor: LANE }} />
      {order.map(({ k, x, y, lift }) => {
        const src = slotXY(k); // clip C00(k+1) sits in slot k in the real (name-sorted) bin
        const s = 1 + 0.06 * lift;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: POOL.cw,
              height: POOL.ch,
              transform: s > 1.0005 ? `scale(${s.toFixed(4)})` : undefined,
              transformOrigin: "50% 40%",
            }}
          >
            <Crop src={EDIT_SRC} sw={5120} sh={2880} x={src.x} y={src.y} w={POOL.cw} h={POOL.ch} dx={-src.x} dy={-src.y} />
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- pages
/** pages away from the action sit a little darker; the active page (its lit cell) is full */
const lightOf = (id: PageId, f: number) => {
  const w = id === "cut" || id === "photo" ? 0 : activeOf(id, f);
  return 0.74 + 0.26 * w;
};

const PageView: React.FC<{ pg: Page; frame: number; z: number }> = ({ pg, frame, z }) => {
  const r = pageRect(pg);
  const bright = pg.bright * lightOf(pg.id, frame);
  // the bezel stays ~2.5 screen px whatever the zoom: overlapping dark UIs read as separate screens
  const bz = 2.5 / z;
  return (
    <div style={{ position: "absolute", left: r.x0, top: r.y0, width: r.x1 - r.x0, height: r.y1 - r.y0 }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "#16171A", filter: `contrast(0.86) brightness(${bright.toFixed(3)})` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: pg.sw, height: pg.rows, transform: pg.k !== 1 ? `scale(${pg.k})` : undefined, transformOrigin: "0 0" }}>
          <Img src={staticFile(pg.src)} style={{ position: "absolute", left: 0, top: 0, width: pg.sw, height: pg.sh, maxWidth: "none", display: "block" }} />
          {pg.id === "color" ? <ColorWork frame={frame} /> : null}
          {pg.id === "edit" ? (
            <>
              <Trim frame={frame} />
              <Pool frame={frame} />
            </>
          ) : null}
        </div>
      </div>
      <div style={{ position: "absolute", inset: -bz, border: `${bz.toFixed(2)}px solid rgba(233,231,226,0.34)`, borderRadius: bz * 2 }} />
    </div>
  );
};

export const World: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const v = viewRect(cam);
  const m = 60 / cam.z;
  const seen = PAGES.filter((pg) => {
    const r = pageRect(pg);
    return r.x1 > v.x0 - m && r.x0 < v.x1 + m && r.y1 > v.y0 - m && r.y0 < v.y1 + m;
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        transformOrigin: "0 0",
        transform: `translate(${CX}px, ${CY}px) scale(${cam.z.toFixed(5)}) translate(${(-cam.x).toFixed(2)}px, ${(-cam.y).toFixed(2)}px)`,
      }}
    >
      {seen.map((pg) => (
        <PageView key={pg.id} pg={pg} frame={frame} z={cam.z} />
      ))}
    </div>
  );
};
