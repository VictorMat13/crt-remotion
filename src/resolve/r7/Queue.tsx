import React from "react";
import { Img, interpolate, interpolateColors, staticFile } from "remotion";
import { loadFont as loadOpenSans } from "@remotion/google-fonts/OpenSans";
import { PH } from "../theme";
import {
  COL,
  DECEL,
  EDIT,
  ENTER,
  HEAD_H,
  JOBS,
  PW,
  PX0,
  PY0,
  QE,
  ROW,
  V2,
  cardAt,
  clamp,
  panelHAt,
  progressAt,
  rowInAt,
  seg,
  type Job,
} from "./plan";

// ===========================================================================
// Claude's side: a floating Render Queue panel in the look of Resolve's
// Deliver page Render Settings panel (Reference Manual p.4104 figure: #222127
// title bar, #28283 0 body, raised dark rows, semibold Open Sans), each job a
// row with the real preset icon (cropped from the Quick Export figure, p.4095),
// the real preset name, a progress bar and its percentage. Jobs render one
// after another, as Resolve's queue does. Greys lifted a touch where the CRT
// grade would crush them (row ground, bar track, panel edge).
//
// And the jobs themselves: copies of B-roll clips that lift off V2 in Claude's
// coral, ride the scope trace and dock into their row as its thumbnail.
// ===========================================================================

export const { fontFamily: RESOLVE_FONT } = loadOpenSans("normal", { weights: ["400", "600"], subsets: ["latin"] });

const PANEL_BG = "rgb(42,42,50)";
const HEAD_BG = "rgb(34,33,39)";
const ROW_BG = "rgb(58,58,68)";
const ROW_ACTIVE = "rgb(72,72,84)";
const BAR_TRACK = "rgb(88,88,100)";
const INK = "#F2F2F4";
const DOTS = "rgb(196,196,204)";
const CLIP_H = V2.y1 - V2.y0;

/** a preset icon from the Quick Export figure, scaled to width w */
const PresetIcon: React.FC<{ job: Job; x: number; y: number; w: number }> = ({ job, x, y, w }) => {
  const k = w / job.icon.w;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: job.icon.h * k, overflow: "hidden", borderRadius: 6 }}>
      <Img
        src={staticFile(QE.src)}
        style={{ position: "absolute", left: -job.icon.x * k, top: -job.icon.y * k, width: QE.w * k, height: QE.h * k, maxWidth: "none" }}
      />
    </div>
  );
};

const JobRow: React.FC<{ job: Job; i: number; frame: number }> = ({ job, i, frame: f }) => {
  const k = rowInAt(job, f);
  if (k <= 0.001) return null;
  const p = progressAt(job, f);
  const started = job.render !== null && f >= job.render[0];
  // the row being rendered is lit, like the highlighted row in Resolve's lists
  const lit = job.render ? seg(f, job.render[0] - 3, job.render[0] + 3, DECEL) * (1 - seg(f, job.render[1], job.render[1] + 8, DECEL)) : 0;
  const rx = ROW.inset;
  const ry = ROW.top + i * (ROW.h + ROW.gap);
  const rw = PW - 2 * ROW.inset;
  const barX = COL.icon - PX0 - rx;
  const barW = COL.barX1 - COL.icon;
  const done = p >= 0.999;
  // the row unfolds as its card docks
  const enter = interpolate(k, [0, 1], [10, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: rx,
        top: ry,
        width: rw,
        height: ROW.h,
        borderRadius: 12,
        background: interpolateColors(lit, [0, 1], [ROW_BG, ROW_ACTIVE]),
        boxShadow: `inset 0 0 0 2px rgba(233,231,226,${(0.1 + 0.12 * lit).toFixed(3)})`,
        opacity: k,
        transform: `translateY(${enter.toFixed(2)}px)`,
      }}
    >
      <PresetIcon job={job} x={barX} y={16} w={COL.iconW} />
      <div
        style={{
          position: "absolute",
          left: COL.name - PX0 - rx,
          top: 12,
          fontSize: COL.nameFont,
          lineHeight: "58px",
          fontWeight: 600,
          color: INK,
          whiteSpace: "nowrap",
        }}
      >
        {job.preset}
      </div>
      {/* progress */}
      <div style={{ position: "absolute", left: barX, top: 96, width: barW, height: 16, borderRadius: 8, background: BAR_TRACK, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: barW * p, height: 16, borderRadius: 8, background: PH.claude, opacity: done ? 0.82 : 1 }} />
      </div>
      {started ? (
        <div
          style={{
            position: "absolute",
            right: 14,
            top: 104 - 29,
            fontSize: COL.pctFont,
            lineHeight: "58px",
            fontWeight: 600,
            color: INK,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {`${Math.floor(p * 100 + 1e-6)}%`}
        </div>
      ) : null}
    </div>
  );
};

export const QueuePanel: React.FC<{ frame: number }> = ({ frame: f }) => (
  <div
    style={{
      position: "absolute",
      left: PX0,
      top: PY0,
      width: PW,
      height: panelHAt(f),
      borderRadius: 14,
      background: PANEL_BG,
      boxShadow: "0 34px 90px rgba(0,0,0,0.78)",
      overflow: "hidden",
      fontFamily: RESOLVE_FONT,
    }}
  >
    {/* title bar */}
    <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: HEAD_H, background: HEAD_BG }}>
      <div style={{ position: "absolute", left: 30, top: 0, height: HEAD_H, lineHeight: `${HEAD_H}px`, fontSize: 50, fontWeight: 600, color: INK, whiteSpace: "nowrap" }}>
        Render Queue
      </div>
      {[0, 1, 2].map((d) => (
        <div key={d} style={{ position: "absolute", left: PW - 92 + d * 20, top: HEAD_H / 2 - 5, width: 10, height: 10, borderRadius: 5, background: DOTS }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: HEAD_H - 3, width: PW, height: 3, background: "rgb(13,12,18)" }} />
    </div>
    {JOBS.map((j, i) => (
      <JobRow key={i} job={j} i={i} frame={f} />
    ))}
    {/* the panel edge, lifted so the dark panel reads as a window in the tube */}
    <div style={{ position: "absolute", inset: 0, borderRadius: 14, boxShadow: "inset 0 0 0 3px rgba(233,231,226,0.42)" }} />
  </div>
);

/** the job cards: copies of the B-roll clips lifting off, riding the trace, docked in their rows */
export const JobCards: React.FC<{ frame: number }> = ({ frame: f }) => (
  <>
    {JOBS.map((j, i) => {
      if (f < j.lift) return null;
      const c = cardAt(j, i, f);
      const w0 = j.clip.x1 - j.clip.x0;
      // coral while Claude carries it, back to the plain clip once it sits in its row
      const coral = j.lift < -100 ? 0 : seg(f, j.lift - 1, j.lift + 3, ENTER) * (1 - seg(f, j.dock[1] - 3, j.dock[1] + 6, DECEL));
      const lift = j.lift < -100 ? 0 : interpolate(c.rise, [0, 1], [0, 1], clamp) * (1 - c.dock);
      const t = 6;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: c.cx - c.w / 2,
            top: c.cy - c.h / 2,
            width: c.w,
            height: c.h,
            filter: `brightness(${(0.8 + 0.14 * Math.max(lift, c.dock)).toFixed(3)})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 6,
              overflow: "hidden",
              boxShadow: lift > 0.01 ? `0 ${(22 * lift).toFixed(1)}px ${(46 * lift).toFixed(1)}px rgba(0,0,0,${(0.65 * lift).toFixed(3)})` : undefined,
            }}
          >
            <div style={{ position: "absolute", left: 0, top: 0, width: w0, height: CLIP_H, transform: `scale(${c.s.toFixed(5)})`, transformOrigin: "0 0" }}>
              <Img
                src={staticFile(EDIT.src)}
                style={{ position: "absolute", left: -j.clip.x0, top: -V2.y0, width: EDIT.w, height: EDIT.h, maxWidth: "none" }}
              />
            </div>
          </div>
          {coral > 0.01 ? (
            <div
              style={{
                position: "absolute",
                left: -t,
                top: -t,
                width: c.w + 2 * t,
                height: c.h + 2 * t,
                boxSizing: "border-box",
                border: `${t}px solid ${PH.claude}`,
                borderRadius: 10,
                opacity: coral,
              }}
            />
          ) : null}
        </div>
      );
    })}
  </>
);
