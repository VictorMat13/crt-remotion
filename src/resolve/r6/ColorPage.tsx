import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { PH } from "../theme";
import { loadFont as loadOpenSans } from "@remotion/google-fonts/OpenSans";
import { COLOR, DECEL, GLOBAL, H, LAND, VIEWER, W, XY_FIELDS, bgBlur, bgBright, bgCam, gradeK, puckAt, xyAt } from "./plan";

// ===========================================================================
// BG plane: the real Resolve 21 Color page (official press-kit screenshot,
// 3840x2160), far behind the release and soft by depth, then pulled into
// focus as the camera tilts down onto it. Live on it, in the shot's own px:
//  - the Global wheel's puck, which the editor's arrow drags toward the warm
//    side of the ring (the real puck is patched out under it: the wheel's own
//    centre grey + its crosshair, colours sampled from the shot);
//  - the viewer's picture warming as the puck moves (the same frame,
//    re-graded, eased in over the original);
//  - the wheel's X / Y readouts ticking with the puck (the shot's own fields,
//    values redrawn in Resolve's face);
//  - a ring on the wheel as the green packet lands.
// ===========================================================================

// Resolve's UI face (as in R2's dialog)
const { fontFamily: RESOLVE_FONT } = loadOpenSans("normal", { weights: ["400"], subsets: ["latin"] });
const FIELD_BG = "#1F1F1F"; // sampled from the field
const FIELD_INK = "#F0F0F0"; // sampled from its digits

const WHEEL_BG = "#3C3A3A";
const CROSS = "#6B6A68";

export const ColorPage: React.FC<{ frame: number }> = ({ frame: f }) => {
  const c = bgCam(f);
  const blur = bgBlur(f);
  const g = gradeK(f);
  const pk = puckAt(f);
  const moved = g > 0.001;
  const ring = (f - LAND) / 26;
  return (
    <AbsoluteFill style={{ filter: `${blur > 0.05 ? `blur(${blur.toFixed(2)}px) ` : ""}brightness(${bgBright(f).toFixed(3)})` }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: COLOR.w,
          height: COLOR.h,
          transformOrigin: "0 0",
          transform: `translate(${(W / 2 - c.x * c.s).toFixed(2)}px, ${(H / 2 - c.y * c.s).toFixed(2)}px) scale(${c.s.toFixed(5)})`,
        }}
      >
        <Img src={staticFile(COLOR.src)} style={{ width: COLOR.w, height: COLOR.h, display: "block" }} />

        {/* the viewer's picture, re-graded warm as the puck moves */}
        {moved ? (
          <div style={{ position: "absolute", left: VIEWER.x, top: VIEWER.y, width: VIEWER.w, height: VIEWER.h, overflow: "hidden", opacity: g }}>
            <Img
              src={staticFile(COLOR.src)}
              style={{
                position: "absolute",
                left: -VIEWER.x,
                top: -VIEWER.y,
                width: COLOR.w,
                height: COLOR.h,
                filter: "sepia(0.5) saturate(1.45) hue-rotate(-14deg) brightness(1.06)",
              }}
            />
          </div>
        ) : null}

        {/* the Global wheel's puck, dragged off centre */}
        {moved ? (
          <svg
            width={2 * GLOBAL.rOut}
            height={2 * GLOBAL.rOut}
            viewBox={`${GLOBAL.x - GLOBAL.rOut} ${GLOBAL.y - GLOBAL.rOut} ${2 * GLOBAL.rOut} ${2 * GLOBAL.rOut}`}
            style={{ position: "absolute", left: GLOBAL.x - GLOBAL.rOut, top: GLOBAL.y - GLOBAL.rOut, overflow: "visible" }}
          >
            <circle cx={GLOBAL.x} cy={GLOBAL.y} r={11} fill={WHEEL_BG} />
            <line x1={GLOBAL.x - 16} y1={GLOBAL.y} x2={GLOBAL.x + 16} y2={GLOBAL.y} stroke={CROSS} strokeWidth={2} />
            <line x1={GLOBAL.x} y1={GLOBAL.y - 16} x2={GLOBAL.x} y2={GLOBAL.y + 16} stroke={CROSS} strokeWidth={2} />
            <circle cx={pk.x} cy={pk.y} r={8.5} fill="#232425" />
            <circle cx={pk.x} cy={pk.y} r={6.5} fill="#DCDCDC" />
          </svg>
        ) : null}

        {/* the wheel's X / Y readouts tick with the puck (the shot's own fields, values redrawn) */}
        {moved
          ? (["x", "y"] as const).map((k) => {
              const v = xyAt(f)[k];
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: XY_FIELDS[k].left,
                    top: XY_FIELDS.top,
                    width: XY_FIELDS.w,
                    height: XY_FIELDS.h,
                    background: FIELD_BG,
                    color: FIELD_INK,
                    fontFamily: RESOLVE_FONT,
                    fontSize: XY_FIELDS.font,
                    lineHeight: `${XY_FIELDS.h}px`,
                    textAlign: "center",
                    letterSpacing: 0.4,
                  }}
                >
                  {(Math.abs(v) < 0.005 ? 0 : v).toFixed(2)}
                </div>
              );
            })
          : null}

        {/* the green packet's arrival: one soft ring round the wheel */}
        {ring >= 0 && ring <= 1 ? (
          <div
            style={{
              position: "absolute",
              left: GLOBAL.x - GLOBAL.rOut - 30 * DECEL(ring),
              top: GLOBAL.y - GLOBAL.rOut - 30 * DECEL(ring),
              width: 2 * (GLOBAL.rOut + 30 * DECEL(ring)),
              height: 2 * (GLOBAL.rOut + 30 * DECEL(ring)),
              boxSizing: "border-box",
              borderRadius: "50%",
              border: `3px solid rgba(${PH.userRgb},${(0.75 * (1 - ring)).toFixed(3)})`,
            }}
          />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
