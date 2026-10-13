import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { EDIT_SHEET, MOMENTS, MOMENT_NAME, Patch, Sprite } from "./footage";
import { ClipCard } from "./World";
import {
  BAKED_PH,
  COUNTER,
  ENTER,
  HEADER,
  LAND,
  LANE_H,
  LANE_X1,
  MARKER_RGB,
  PANEL_BOTTOM,
  PB0,
  REC_VIEW,
  RULER,
  RV,
  T0_X,
  TL,
  ZONE,
  ZPS,
  dofPx,
  haze,
  momentAtSec,
  shotProgress,
  panelAt,
  playAt,
  project,
  slotOf,
  tc,
  v4Grow,
  type Cam,
  type Panel,
} from "./rig";

// ===========================================================================
// The two real Resolve 21 panels (official 5120x2880 Edit page press shot),
// each a flat plane on the CSS-3D stage, drawn in the shot's own pixels with
// the in-world changes made on them (colours sampled from the shot):
//   timeline panel: the ruler re-drawn from 01:00:00:00 at ZPS px/s; track V4
//     created in Resolve's "Video 4" drop zone (rows below slide down, the new
//     header copies V3's controls, badge V4); the moments land on it as
//     clips; the readout (patched over the real one) rolls up to 01:01:00:00;
//     the baked playhead healed and drawn live, riding the packing edge, then
//     playing from the top.
//   record viewer panel: plays the cut from PB0 (8x shuttle), its jog-bar
//     playhead and header timecode live.
// ===========================================================================

const HDR_BG = "rgb(33,33,38)";
const LANE_BG = "rgb(40,40,46)";
const SEP = "rgb(9,9,9)";
const CLIP_BLUE = "67,118,161";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** Resolve's grey panels sink in the tube and its bright clips bloom: flattened and dimmed a little */
const PANEL_CONTRAST = 0.9;
const PANEL_BRIGHT = 0.82;

/** a panel plane: the shot, clipped to the panel rect, children in shot px */
const PanelPlane: React.FC<{ p: Panel; cam: Cam; bright?: number; contrast?: number; children?: React.ReactNode }> = ({
  p,
  cam,
  bright = PANEL_BRIGHT,
  contrast = PANEL_CONTRAST,
  children,
}) => {
  const w = p.u1 - p.u0;
  const h = p.v1 - p.v0;
  const c = project(cam, panelAt(p, (p.u0 + p.u1) / 2, (p.v0 + p.v1) / 2));
  if (c.d < 60) return null;
  const blur = dofPx(cam, c.d) / c.s;
  const b = bright * haze(cam, c.d);
  const at = panelAt(p, p.u0, p.v0);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: w,
        height: h,
        overflow: "hidden",
        transformOrigin: "0 0",
        transform: `translate3d(${at.x}px, ${at.y}px, ${at.z}px)`,
        filter: [blur >= 0.35 ? `blur(${blur.toFixed(2)}px)` : "", `contrast(${contrast})`, `brightness(${b.toFixed(3)})`].join(" ").trim(),
        backfaceVisibility: "hidden",
        background: "#16171A",
      }}
    >
      <div style={{ position: "absolute", left: -p.u0, top: -p.v0, width: EDIT_SHEET.w, height: EDIT_SHEET.h }}>
        <Img src={staticFile(EDIT_SHEET.src)} style={{ position: "absolute", left: 0, top: 0, width: EDIT_SHEET.w, height: EDIT_SHEET.h, maxWidth: "none" }} />
        {children}
      </div>
    </div>
  );
};

// ------------------------------------------------------------- timeline panel
/** ruler from 01:00:00:00: a tick a second, a major every 10 s, a label every 20 s */
const Ruler: React.FC<{ font: string }> = ({ font }) => {
  const w = LANE_X1 - RULER.x0;
  const h = RULER.y1 - RULER.y0;
  const ticks: React.ReactNode[] = [];
  for (let s = 0; T0_X + s * ZPS < LANE_X1 - 2; s++) {
    const x = T0_X + s * ZPS - RULER.x0;
    const major = s % 10 === 0;
    ticks.push(
      major ? (
        <rect key={s} x={x - 1} y={4} width={2.2} height={h - 4} fill="url(#r1-major)" />
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
        <linearGradient id="r1-major" x1="0" y1="0" x2="0" y2="1">
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

/** the rows below the drop zone, slid down by the new track; the baked playhead healed */
const LowerRows: React.FC<{ grow: number }> = ({ grow }) => {
  const top = ZONE.y1 + grow;
  const w = LANE_X1 - HEADER.x0;
  return (
    <div style={{ position: "absolute", left: HEADER.x0, top, width: w, height: PANEL_BOTTOM - top, overflow: "hidden" }}>
      <Img src={staticFile(EDIT_SHEET.src)} style={{ position: "absolute", left: -HEADER.x0, top: -ZONE.y1, width: EDIT_SHEET.w, height: EDIT_SHEET.h, maxWidth: "none" }} />
      <div style={{ position: "absolute", left: BAKED_PH.x0 - HEADER.x0, top: 0, width: BAKED_PH.x1 - BAKED_PH.x0, height: PANEL_BOTTOM, overflow: "hidden" }}>
        <Img
          src={staticFile(EDIT_SHEET.src)}
          style={{ position: "absolute", left: -(BAKED_PH.x0 - 13), top: -ZONE.y1, width: EDIT_SHEET.w, height: EDIT_SHEET.h, maxWidth: "none" }}
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
      <div style={{ position: "absolute", left: HEADER.x1 - HEADER.x0 + 2, top: 0, right: 0, height: h, background: LANE_BG }}>
        <div style={{ position: "absolute", left: 0, top: h - 4, right: 0, height: 2, background: "rgb(35,35,40)" }} />
        <div style={{ position: "absolute", left: 0, top: h - 2, right: 0, height: 2, background: "rgb(46,46,51)" }} />
      </div>
      {LAND.map((l, k) => {
        if (f < l) return null;
        const s = slotOf(k);
        return (
          <div key={k} style={{ position: "absolute", left: s.u - HEADER.x0, top: s.v - ZONE.y0, width: s.w, height: s.h }}>
            <ClipCard w={s.w} h={s.h} crop={MOMENTS[k]} m={1} name={MOMENT_NAME[k]} font={font} marker={MARKER_RGB[k]} />
          </div>
        );
      })}
    </div>
  );
};

/** the readout over the real one, same place, same size */
const Readout: React.FC<{ frame: number; font: string }> = ({ frame: f, font }) => (
  <div style={{ position: "absolute", left: COUNTER.x0, top: COUNTER.y0, width: COUNTER.x1 - COUNTER.x0, height: COUNTER.y1 - COUNTER.y0, background: HDR_BG }}>
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
        color: "rgb(222,222,222)",
        transform: `translateX(${COUNTER.cx - (COUNTER.x0 + COUNTER.x1) / 2}px)`,
      }}
    >
      {tc(playAt(f))}
    </div>
  </div>
);

/** Resolve's playhead: red line with a flag on the ruler (drawn in the panel, it moves with the cut) */
const Playhead: React.FC<{ frame: number }> = ({ frame: f }) => {
  const x = T0_X + playAt(f) * ZPS;
  const top = RULER.y0 + 4;
  const fw = 15;
  const fh = 18;
  return (
    <svg width={60} height={PANEL_BOTTOM - top} style={{ position: "absolute", left: x - 30, top, overflow: "visible" }}>
      <line x1={30} y1={22} x2={30} y2={PANEL_BOTTOM - top} stroke="rgba(0,0,0,0.6)" strokeWidth={8} />
      <line x1={30} y1={22} x2={30} y2={PANEL_BOTTOM - top} stroke="rgb(230,75,61)" strokeWidth={4} />
      <path d={`M${30 - fw},0 H${30 + fw} V${fh * 0.62} L30,${fh * 1.25} L${30 - fw},${fh * 0.62} Z`} fill="rgb(230,75,61)" stroke="rgba(0,0,0,0.6)" strokeWidth={1.2} />
    </svg>
  );
};

export const TimelinePanel: React.FC<{ cam: Cam; frame: number; font: string }> = ({ cam, frame: f, font }) => {
  const grow = v4Grow(f);
  return (
    <PanelPlane p={TL} cam={cam}>
      <LowerRows grow={grow} />
      <TrackV4 frame={f} grow={grow} font={font} />
      <Ruler font={font} />
      <Readout frame={f} font={font} />
      <Playhead frame={f} />
    </PanelPlane>
  );
};

// ------------------------------------------------------------- record viewer panel
/** jog bar: heal the baked playhead, then draw it live (copied 1:1 from the shot) */
const Jog: React.FC<{ frame: number }> = ({ frame: f }) => {
  const recX = 2797 + (playAt(f) / 293.4) * (4239 - 2797);
  return (
    <>
      <Patch sx={3200} sy={1486} w={72} h={40} x={3270} y={1486} />
      <Patch sx={3294} sy={1488} w={26} h={36} x={recX - 13} y={1488} />
    </>
  );
};

/** the header's timecode (top right of the viewer) follows the playhead */
const HeaderTc: React.FC<{ frame: number; font: string }> = ({ frame: f, font }) => (
  <>
    {/* blank header background (right of the clip name) over the baked timecode */}
    <Patch sx={3800} sy={136} w={170} h={56} x={4094} y={136} />
    <div
      style={{
        position: "absolute",
        left: 3980,
        top: 136,
        width: 4253 - 3980,
        height: 56,
        textAlign: "right",
        fontFamily: font,
        fontSize: 27,
        lineHeight: "56px",
        fontWeight: 500,
        fontVariantNumeric: "tabular-nums",
        color: "rgb(226,226,226)",
      }}
    >
      {tc(playAt(f))}
    </div>
  </>
);

/** the record viewer plays the cut (8x shuttle) from PB0; each shot drifts as it plays */
const Playback: React.FC<{ frame: number }> = ({ frame: f }) => {
  if (f < PB0) return null;
  const sec = playAt(f);
  const k = momentAtSec(sec);
  const fade = interpolate(f, [PB0, PB0 + 2], [0, 1], { ...clamp, easing: ENTER });
  const zoom = 1 + 0.035 * shotProgress(sec);
  return (
    <div style={{ position: "absolute", left: REC_VIEW.x, top: REC_VIEW.y, width: REC_VIEW.w, height: REC_VIEW.h, overflow: "hidden", opacity: fade, background: "#000" }}>
      <Sprite crop={MOMENTS[k]} width={REC_VIEW.w} height={REC_VIEW.h} style={{ left: 0, top: 0, transform: `scale(${zoom.toFixed(4)})` }} />
    </div>
  );
};

export const ViewerPanel: React.FC<{ cam: Cam; frame: number; font: string }> = ({ cam, frame: f, font }) => (
  // the viewer is mostly picture: full contrast, dimmed so the desert sky never blooms
  <PanelPlane p={RV} cam={cam} bright={0.7} contrast={1.04}>
    <Playback frame={f} />
    <Jog frame={f} />
    <HeaderTc frame={f} font={font} />
  </PanelPlane>
);
