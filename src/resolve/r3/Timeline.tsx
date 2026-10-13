import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { MOMENTS, MOMENT_NAME, Patch, REC_VIEW, Sprite, type Crop } from "./footage";
import {
  BAKED_PH,
  COUNTER,
  EDIT,
  HEADER,
  LAND,
  LANE_H,
  LANE_X1,
  MARKER_RGB,
  MOMENT_W,
  MOMENT_X,
  PANEL_BOTTOM,
  PB0,
  RULER,
  S_END,
  T0_X,
  ZONE,
  ZPS,
  clamp,
  ENTER,
  momentAtSec,
  playAt,
  scrollAt,
  tc,
  v4Grow,
} from "./plan";

// ===========================================================================
// The real Resolve 21 Edit page (5120x2880 press-kit screenshot) and the
// in-world changes made on it, all in the screenshot's own pixels:
//   - the ruler re-drawn at zoom-to-fit (the 4:53 timeline across the lanes)
//     from 01:00:00:00, in Resolve's tick/label style;
//   - the timecode readout (the real one is patched over) showing our playhead;
//   - track V4 created in Resolve's "Video 4" drop zone: the rows below slide
//     down by one track height, the new header copies V3's controls (badge V4);
//   - the baked playhead line healed (the playhead is drawn live, see Overlay);
//   - both jog-bar playheads live: the source one races with the scrub, the
//     record one follows playback; the record viewer plays the cut.
// Colours sampled from the screenshot.
// ===========================================================================

const HDR_BG = "rgb(33,33,38)";
const LANE_BG = "rgb(40,40,46)";
const SEP = "rgb(9,9,9)";
const CLIP_BLUE = "67,118,161";

/** Resolve's marker: a rounded tab with a pointed foot */
export const Marker: React.FC<{ x: number; y: number; rgb: string; size?: number; opacity?: number }> = ({ x, y, rgb, size = 30, opacity = 1 }) => {
  const w = size;
  const h = size * 1.15;
  return (
    <svg width={w} height={h} viewBox="0 0 28 32" style={{ position: "absolute", left: x - w / 2, top: y - h, overflow: "visible", opacity }}>
      <path d="M4 0 H24 Q28 0 28 4 V19 L14 31 L0 19 V4 Q0 0 4 0 Z" fill={`rgb(${rgb})`} stroke="rgba(0,0,0,0.55)" strokeWidth={1.4} />
    </svg>
  );
};

/**
 * A clip as Resolve draws it on a video track (blue body, thumbnail band on
 * top, truncated name below). `m` morphs from a bare thumbnail (0) to the clip (1).
 */
export const ClipCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  crop: Crop;
  m: number;
  name: string;
  font: string;
  marker?: string;
  markerK?: number;
  shadow?: number;
}> = ({ x, y, w, h, crop, m, name, font, marker, markerK = 1, shadow = 0 }) => {
  const pad = 3 + 1.5 * m;
  const band = interpolate(m, [0, 1], [h - 2 * pad, 60]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: "border-box",
        borderRadius: 6,
        background: `rgb(${CLIP_BLUE})`,
        border: "1.5px solid rgb(14,16,20)",
        boxShadow: shadow > 0.01 ? `0 ${18 * shadow}px ${40 * shadow}px rgba(0,0,0,${(0.6 * shadow).toFixed(3)})` : undefined,
      }}
    >
      <Sprite crop={crop} width={Math.max(1, w - 2 * pad - 3)} height={Math.max(1, band)} style={{ left: pad, top: pad, borderRadius: 3 }} />
      {m > 0.3 ? (
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
            opacity: interpolate(m, [0.3, 0.8], [0, 1], clamp),
          }}
        >
          {name}
        </div>
      ) : null}
      {marker ? <Marker x={w / 2} y={12} rgb={marker} opacity={markerK} /> : null}
    </div>
  );
};

/** ruler from 01:00:00:00 at zoom-to-fit: a tick a second, a major every 10 s, a label every 20 s */
const Ruler: React.FC<{ font: string }> = ({ font }) => {
  const w = LANE_X1 - RULER.x0;
  const h = RULER.y1 - RULER.y0;
  const ticks: React.ReactNode[] = [];
  for (let s = 0; T0_X + s * ZPS < LANE_X1 - 2; s++) {
    const x = T0_X + s * ZPS - RULER.x0;
    const major = s % 10 === 0;
    ticks.push(
      major ? (
        <rect key={s} x={x - 1} y={4} width={2.2} height={h - 4} fill="url(#r3-major)" />
      ) : (
        <rect key={s} x={x - 1} y={4} width={2} height={19} fill="rgb(67,71,77)" />
      ),
    );
    if (s % 20 === 0)
      ticks.push(
        <text key={`l${s}`} x={x + 12} y={51} fontFamily={font} fontSize={24} fill="rgb(146,146,146)">
          {tc(s)}
        </text>,
      );
  }
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: RULER.x0, top: RULER.y0 }}>
      <defs>
        <linearGradient id="r3-major" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(152,152,152)" />
          <stop offset="0.55" stopColor="rgb(60,60,64)" />
          <stop offset="1" stopColor="rgb(46,46,51)" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={w} height={h} fill={LANE_BG} />
      <rect x={0} y={2} width={w} height={2} fill={SEP} />
      {ticks}
    </svg>
  );
};

/** the rows below the drop zone, slid down by the new track */
const LowerRows: React.FC<{ grow: number }> = ({ grow }) => {
  const top = ZONE.y1 + grow;
  const w = LANE_X1 - HEADER.x0;
  return (
    <div style={{ position: "absolute", left: HEADER.x0, top, width: w, height: PANEL_BOTTOM - top, overflow: "hidden" }}>
      <Img src={staticFile(EDIT.src)} style={{ position: "absolute", left: -HEADER.x0, top: -ZONE.y1, width: EDIT.w, height: EDIT.h, maxWidth: "none" }} />
      {/* heal the baked playhead line with the columns just left of it */}
      <div style={{ position: "absolute", left: BAKED_PH.x0 - HEADER.x0, top: 0, width: BAKED_PH.x1 - BAKED_PH.x0, height: PANEL_BOTTOM, overflow: "hidden" }}>
        <Img
          src={staticFile(EDIT.src)}
          style={{ position: "absolute", left: -(BAKED_PH.x0 - 13), top: -ZONE.y1, width: EDIT.w, height: EDIT.h, maxWidth: "none" }}
        />
      </div>
    </div>
  );
};

/** track V4, created in the drop zone: header (V3's controls, badge V4) + lane with the cut */
const TrackV4: React.FC<{ frame: number; grow: number; font: string }> = ({ frame: f, grow, font }) => {
  const h = ZONE.y1 - ZONE.y0 + grow;
  const p = grow / (LANE_H - (ZONE.y1 - ZONE.y0));
  return (
    <div style={{ position: "absolute", left: HEADER.x0, top: ZONE.y0, width: LANE_X1 - HEADER.x0, height: h, overflow: "hidden" }}>
      {/* header column: the zone's own frame (blue bar, rules), V3's controls fading in */}
      <div style={{ position: "absolute", left: 0, top: 0, width: HEADER.x1 - HEADER.x0 + 2, height: h, background: HDR_BG }}>
        <div style={{ position: "absolute", left: -2, top: 0, width: 6, height: h, background: `rgb(${CLIP_BLUE})` }} />
        <div style={{ position: "absolute", left: 4, top: 0, width: 2, height: h, background: SEP }} />
        <div style={{ position: "absolute", left: 20, top: 0, width: 2, height: h, background: SEP }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: HEADER.x1 - HEADER.x0, height: 54, opacity: p }}>
          <Patch sx={HEADER.x0 + 22} sy={1849} w={HEADER.x1 - HEADER.x0 - 22} h={52} x={22} y={2} />
          {/* badge V3 -> V4 */}
          <div style={{ position: "absolute", left: 1350 - HEADER.x0, top: 1862 - 1847, width: 42, height: 25, background: "rgb(71,41,43)" }} />
          <div
            style={{
              position: "absolute",
              left: 1338 - HEADER.x0,
              top: 1855 - 1847,
              width: 63,
              height: 38,
              display: "grid",
              placeItems: "center",
              fontFamily: font,
              fontSize: 23,
              fontWeight: 500,
              color: "#FFFFFF",
            }}
          >
            V4
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 1266 - HEADER.x0,
            top: h - 35 - 24,
            fontFamily: font,
            fontSize: 26,
            fontWeight: 500,
            lineHeight: "30px",
            color: "#FFFFFF",
            whiteSpace: "nowrap",
          }}
        >
          Video 4
        </div>
        <div style={{ position: "absolute", left: 0, top: h - 2, width: "100%", height: 2, background: SEP }} />
      </div>
      {/* lane */}
      <div style={{ position: "absolute", left: HEADER.x1 - HEADER.x0 + 2, top: 0, right: 0, height: h, background: LANE_BG }}>
        <div style={{ position: "absolute", left: 0, top: h - 4, right: 0, height: 2, background: "rgb(35,35,40)" }} />
        <div style={{ position: "absolute", left: 0, top: h - 2, right: 0, height: 2, background: "rgb(46,46,51)" }} />
      </div>
      {/* the cut: each moment sits on V4 once it has landed */}
      {LAND.map((l, k) =>
        f >= l ? (
          <ClipCard
            key={k}
            x={MOMENT_X[k] + 1 - HEADER.x0}
            y={4}
            w={MOMENT_W[k] - 2}
            h={LANE_H - 8}
            crop={MOMENTS[k]}
            m={1}
            name={MOMENT_NAME[k]}
            font={font}
            marker={MARKER_RGB[k]}
          />
        ) : null,
      )}
    </div>
  );
};

/** the readout over the real one, same place, same size */
const Readout: React.FC<{ frame: number; font: string }> = ({ frame: f, font }) => (
  <div
    style={{
      position: "absolute",
      left: COUNTER.x0,
      top: COUNTER.y0,
      width: COUNTER.x1 - COUNTER.x0,
      height: COUNTER.y1 - COUNTER.y0,
      background: HDR_BG,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: COUNTER.base - COUNTER.y0 - COUNTER.font * 0.94,
        textAlign: "center",
        fontFamily: font,
        fontSize: COUNTER.font,
        lineHeight: `${COUNTER.font * 1.2}px`,
        fontWeight: 500,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: -1.4,
        color: "rgb(208,208,208)",
        // centred on the real readout's centre
        transform: `translateX(${COUNTER.cx - (COUNTER.x0 + COUNTER.x1) / 2}px)`,
      }}
    >
      {tc(playAt(f))}
    </div>
  </div>
);

/** jog bars: heal the baked playheads, then draw them live (copied 1:1 from the screenshot) */
const Jogs: React.FC<{ frame: number }> = ({ frame: f }) => {
  const srcX = 1890 + (2700 - 1890) * (scrollAt(f) / S_END);
  const recX = 2797 + (playAt(f) / 293.4) * (4239 - 2797);
  return (
    <>
      <Patch sx={1800} sy={1486} w={72} h={40} x={1866} y={1486} />
      <Patch sx={3200} sy={1486} w={72} h={40} x={3270} y={1486} />
      <Patch sx={1878} sy={1488} w={26} h={36} x={srcX - 13} y={1488} />
      <Patch sx={3294} sy={1488} w={26} h={36} x={recX - 13} y={1488} />
    </>
  );
};

/** the record viewer plays the cut (12x shuttle) from PB0 */
const Playback: React.FC<{ frame: number }> = ({ frame: f }) => {
  if (f < PB0) return null;
  const k = momentAtSec(playAt(f));
  const fade = interpolate(f, [PB0, PB0 + 2], [0, 1], { ...clamp, easing: ENTER });
  return <Sprite crop={MOMENTS[k]} width={REC_VIEW.w} height={REC_VIEW.h} style={{ left: REC_VIEW.x, top: REC_VIEW.y, opacity: fade }} />;
};

export const EditApp: React.FC<{ frame: number; font: string; children?: React.ReactNode }> = ({ frame: f, font, children }) => {
  const grow = v4Grow(f);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: EDIT.w, height: EDIT.h }}>
      <Img src={staticFile(EDIT.src)} style={{ position: "absolute", left: 0, top: 0, width: EDIT.w, height: EDIT.h, maxWidth: "none" }} />
      <LowerRows grow={grow} />
      <TrackV4 frame={f} grow={grow} font={font} />
      <Ruler font={font} />
      <Readout frame={f} font={font} />
      <Jogs frame={f} />
      <Playback frame={f} />
      {children}
    </div>
  );
};
