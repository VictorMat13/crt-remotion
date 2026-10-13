import React from "react";
import { Img, staticFile } from "remotion";
import { PH } from "../theme";
import { EDIT, HEALS, JOBS, LANE_BG, SEL, V2, nudgeAt, selAt } from "./plan";

// ===========================================================================
// The real Resolve 21 Edit page (official 5120x2880 press-kit screenshot) and
// the editor's own changes on it, in the screenshot's pixels:
//   - the baked red playhead healed away (the editor's playhead is drawn live,
//     in green, by the overlay);
//   - the clip the editor has selected on V2 (the shot's own red selection)
//     slides with their drag: a nudge right, then a fine-tune back left;
//   - Claude's coral selection flashes on each B-roll clip a job is made from.
// ===========================================================================

/** a 1:1 copy of a screenshot region placed at (x, y) */
export const Patch: React.FC<{ sx: number; sy: number; w: number; h: number; x: number; y: number; style?: React.CSSProperties }> = ({
  sx,
  sy,
  w,
  h,
  x,
  y,
  style,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", ...style }}>
    <Img src={staticFile(EDIT.src)} style={{ position: "absolute", left: -sx, top: -sy, width: EDIT.w, height: EDIT.h, maxWidth: "none" }} />
  </div>
);

/** the page with its baked playhead healed */
export const EditPage: React.FC<{ frame: number }> = ({ frame: f }) => {
  const off = nudgeAt(f);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: EDIT.w, height: EDIT.h }}>
      <Img src={staticFile(EDIT.src)} style={{ position: "absolute", left: 0, top: 0, width: EDIT.w, height: EDIT.h, maxWidth: "none" }} />
      {HEALS.map((h, i) => (
        <Patch key={i} sx={h.x + h.dx} sy={h.y} w={h.w} h={h.h} x={h.x} y={h.y} />
      ))}
      {/* the editor's selected clip, dragged */}
      {Math.abs(off) > 0.05 ? (
        <>
          <div style={{ position: "absolute", left: SEL.x0, top: V2.y0, width: SEL.x1 - SEL.x0, height: V2.y1 - V2.y0, background: LANE_BG }} />
          <Patch sx={SEL.x0} sy={V2.y0} w={SEL.x1 - SEL.x0} h={V2.y1 - V2.y0} x={SEL.x0 + off} y={V2.y0} />
        </>
      ) : null}
    </div>
  );
};

/** Claude's coral selection on the source clip, just before the job lifts off it (undimmed layer) */
export const ClaudeSelections: React.FC<{ frame: number }> = ({ frame: f }) => (
  <>
    {JOBS.map((j, i) => {
      const k = selAt(j, f);
      if (k < 0.01) return null;
      const t = 7;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: j.clip.x0 - t,
            top: V2.y0 - t,
            width: j.clip.x1 - j.clip.x0 + 2 * t,
            height: V2.y1 - V2.y0 + 2 * t,
            boxSizing: "border-box",
            border: `${t}px solid ${PH.claude}`,
            borderRadius: 10,
            opacity: k,
          }}
        />
      );
    })}
  </>
);
