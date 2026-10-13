import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { getLength } from "@remotion/paths";
import { appShot } from "../theme";
import { ANTS, DECEL, DUP, ENTER, STROKE, TOOL, TOOL_MOVES, TRAVEL, clamp } from "./plan";

// ===========================================================================
// The real PhotoCraft screenshot (1600x1000, native px) with the shortcut
// results played on top of its own pixels. The panels are never redrawn: the
// layer and tool changes are the screenshot itself, cropped, moved, or re-lit;
// only the brush stroke and the marquee are drawn, on the document.
//   ⌘J      Layer via Copy: the selected "Curves 1" row is copied in place and
//           every row below eases down one row (36px), the list clips at its
//           real bottom edge, like the panel would scroll.
//   B/T/V   the selected-tool box (measured on the shot) moves to the Brush,
//           Type, then back to the Move button. The original selected state of
//           the Move button is re-lit to unselected with a tone curve so the
//           box can leave it; the box itself is lighten-blended so the icons
//           stay on top, exactly like the app draws it.
//   B       one soft stroke in the foreground color (black) on the canvas.
//   ⇧⌘D     Reselect: marching ants come back around the wave.
// ===========================================================================

const SRC = staticFile(appShot("photocraft"));

// tone curves (sRGB, per channel) built as 256-entry tables
const table = (fn: (v: number) => number) =>
  Array.from({ length: 256 }, (_, i) => (Math.min(255, Math.max(0, fn(i))) / 255).toFixed(4)).join(" ");
// selected Move button -> unselected: fill (77) and blue rim go to the toolbar gray (50), the icon stays
const TOOL_TABLE = table((v) => (v <= 125 ? 50 : 50 + ((v - 125) * 205) / 130));
// selected layer row -> unselected: highlight (82) goes to the panel gray (50), ink stays
const ROW_TABLE = table((v) => (v <= 40 ? v : v <= 82 ? 40 + ((v - 40) * 10) / 42 : 50 + ((v - 82) * 205) / 173));

export const PhotoCraftFilters: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id="p2-unsel-tool" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="table" tableValues={TOOL_TABLE} />
          <feFuncG type="table" tableValues={TOOL_TABLE} />
          <feFuncB type="table" tableValues={TOOL_TABLE} />
        </feComponentTransfer>
      </filter>
      <filter id="p2-unsel-row" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feComponentTransfer>
          <feFuncR type="table" tableValues={ROW_TABLE} />
          <feFuncG type="table" tableValues={ROW_TABLE} />
          <feFuncB type="table" tableValues={ROW_TABLE} />
        </feComponentTransfer>
      </filter>
    </defs>
  </svg>
);

/** a native-px crop of the shot placed at (x, y) */
const Crop: React.FC<{ sx: number; sy: number; w: number; h: number; x: number; y: number; filter?: string }> = ({ sx, sy, w, h, x, y, filter }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", filter }}>
    <Img src={SRC} style={{ position: "absolute", left: -sx, top: -sy, width: 1600, height: 1000, maxWidth: "none" }} />
  </div>
);

// Layers list, measured: rows are 36px, the selected "Curves 1" row is y 666-702,
// the list ends at y 927 (the panel footer starts below).
const LIST = { x: 1316, y: 666, w: 276, bottom: 927, row: 36 };
const STROKE_LEN = getLength(STROKE.d);

const toolAt = (frame: number) => {
  let p = TOOL.move;
  for (const m of TOOL_MOVES) {
    const t = interpolate(frame, [m.at, m.at + m.dur], [0, 1], { ...clamp, easing: TRAVEL });
    const q = TOOL[m.to];
    p = { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
  }
  return p;
};

export const PhotoCraftLive: React.FC<{ frame: number }> = ({ frame }) => {
  // ⌘J
  const dupOn = frame >= DUP.at;
  const shift = LIST.row * interpolate(frame, [DUP.at + 1, DUP.at + 1 + DUP.dur], [0, 1], { ...clamp, easing: DECEL });

  // tool box
  const tool = toolAt(frame);

  // B: stroke
  const strokeP = interpolate(frame, [STROKE.at, STROKE.at + STROKE.dur], [0, 1], { ...clamp, easing: DECEL });

  // ⇧⌘D: ants
  const antsIn = interpolate(frame, [ANTS.at, ANTS.at + 5], [0, 1], { ...clamp, easing: ENTER });
  const crawl = -frame * 1.6;
  const R = ANTS.rect;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1600, height: 1000, isolation: "isolate" }}>
      <Img src={SRC} style={{ position: "absolute", left: 0, top: 0, width: 1600, height: 1000, maxWidth: "none" }} />

      {/* canvas: stroke + reselected marquee, clipped to the document */}
      <svg width={1600} height={1000} viewBox="0 0 1600 1000" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="p2-doc">
            <rect x={92} y={148} width={1163} height={781} />
          </clipPath>
          <filter id="p2-soft" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
        </defs>
        <g clipPath="url(#p2-doc)">
          {/* the bright document is taken down 20% so the tube's halation doesn't blow it out to a white panel
              (and so a black stroke and the ants still read on it) */}
          <rect x={92} y={148} width={1163} height={781} fill="#000" opacity={0.2} />
          {strokeP > 0 ? (
            <path
              d={STROKE.d}
              fill="none"
              stroke="#060607"
              strokeWidth={76}
              strokeLinecap="round"
              strokeDasharray={STROKE_LEN}
              strokeDashoffset={STROKE_LEN * (1 - strokeP)}
              filter="url(#p2-soft)"
            />
          ) : null}
          {antsIn > 0 ? (
            <g opacity={antsIn}>
              {/* 1px ants vanish in the tube's halation and aperture grille at this scale, so they are drawn ~6px wide on screen */}
              <rect x={R.x} y={R.y} width={R.w} height={R.h} fill="none" stroke="#FFFFFF" strokeWidth={12} />
              <rect x={R.x} y={R.y} width={R.w} height={R.h} fill="none" stroke="#000000" strokeWidth={12} strokeDasharray="24 24" strokeDashoffset={crawl} />
            </g>
          ) : null}
        </g>
      </svg>

      {/* Move button re-lit to unselected; the moving box below supplies the selection */}
      <Crop sx={2} sy={96} w={37} h={39} x={2} y={96} filter="url(#p2-unsel-tool)" />
      <div
        style={{
          position: "absolute",
          left: tool.x - TOOL.size.w / 2,
          top: tool.y - TOOL.size.h / 2,
          width: TOOL.size.w,
          height: TOOL.size.h,
          boxSizing: "border-box",
          borderRadius: 5,
          // the app's own box (fill 77, rim 94/121/153) lifted a little so it survives the CRT black crush
          background: "rgb(96,96,96)",
          border: "2px solid rgb(96,150,235)",
          mixBlendMode: "lighten",
        }}
      />

      {/* selected-row highlight on the top slot (the app's 82 gray, lifted for the tube) */}
      <div style={{ position: "absolute", left: 1321, top: 666, width: 269, height: 35, background: "rgb(104,104,104)", mixBlendMode: "lighten", zIndex: 2 }} />

      {/* Layers list after ⌘J */}
      {dupOn ? (
        <div style={{ position: "absolute", left: LIST.x, top: LIST.y, width: LIST.w, height: LIST.bottom - LIST.y, overflow: "hidden", background: "rgb(50,50,50)" }}>
          <div style={{ position: "absolute", left: 0, top: shift, width: LIST.w, height: LIST.bottom - LIST.y }}>
            <Crop sx={LIST.x} sy={LIST.y} w={LIST.w} h={LIST.row} x={0} y={0} filter="url(#p2-unsel-row)" />
            <Crop sx={LIST.x} sy={LIST.y + LIST.row} w={LIST.w} h={LIST.bottom - LIST.y - LIST.row} x={0} y={LIST.row} />
          </div>
          {/* the copy, selected, takes the original's place */}
          <Crop sx={LIST.x} sy={LIST.y} w={LIST.w} h={LIST.row} x={0} y={0} />
        </div>
      ) : null}
    </div>
  );
};
