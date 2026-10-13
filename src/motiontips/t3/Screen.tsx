import React from "react";
import { OffthreadVideo, Sequence, staticFile } from "remotion";
import { ARRIVE, ROW_Y, SCR, screenX, switchOf, type ScreenDef } from "./plan";

// ===========================================================================
// One screen on the trace. Plays a real past deliverable in its own look until
// the pulse arrives, then switches like a CRT: the picture collapses to a
// bright line, the beam holds, and a delivered CRT Scope graphic opens out of
// it. While it switches, the screen squares up with the rest of the row.
// ===========================================================================

const Clip: React.FC<{ src: string; grade: string }> = ({ src, grade }) => (
  <div style={{ position: "absolute", inset: 0, filter: grade }}>
    <OffthreadVideo muted src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
  </div>
);

export const Screen: React.FC<{ s: ScreenDef; i: number; f: number }> = ({ s, i, f }) => {
  const a = ARRIVE[s.id];
  const sw = switchOf(a, f);
  const loose = 1 - sw.tidy;

  // pose: mismatched before the pulse, square after; a faint float never stops
  const x = screenX(s, f) + s.mess.dx * loose;
  const cy = ROW_Y[s.row] + s.mess.dy * loose + (2 + 2 * loose) * Math.sin(f / 31 + i * 1.9);
  const rot = s.mess.rot * loose + 0.35 * loose * Math.sin(f / 43 + i);
  const scale = 1 + (s.mess.s - 1) * loose;
  const top = s.row === "top";

  const oldOn = sw.off < 0.999;
  const newOn = sw.open > 0.001;
  const newFrom = Math.round(a + 4);

  return (
    <div
      style={{
        position: "absolute",
        left: x - SCR.w / 2,
        top: cy - SCR.h / 2,
        width: SCR.w,
        height: SCR.h,
        transform: `rotate(${rot.toFixed(3)}deg) scale(${scale.toFixed(4)})`,
        // the top row stands on the trace, the bottom row hangs from it
        transformOrigin: top ? "50% 100%" : "50% 0%",
        borderRadius: 16,
        overflow: "hidden",
        background: "#08090C",
        border: "3px solid rgba(233,231,226,0.72)",
        boxSizing: "border-box",
      }}
    >
      {oldOn ? (
        <Sequence layout="none" durationInFrames={Math.ceil(a + 7)}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scaleY(${Math.max(0.006, 1 - sw.off).toFixed(4)})`,
              transformOrigin: "50% 50%",
              filter: sw.off > 0.001 ? `brightness(${(1 + 1.5 * sw.off).toFixed(3)})` : undefined,
            }}
          >
            <Clip src={s.old.src} grade={s.old.grade} />
          </div>
        </Sequence>
      ) : null}

      {newOn ? (
        <Sequence layout="none" from={newFrom}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scaleY(${Math.max(0.006, sw.open).toFixed(4)})`,
              transformOrigin: "50% 50%",
              filter: sw.over > 0.004 ? `brightness(${(1 + 1.1 * sw.over).toFixed(3)})` : undefined,
            }}
          >
            <Clip src={s.crt.src} grade={s.crt.grade} />
            {/* the picture comes up out of a white raster */}
            {sw.open < 0.999 ? <div style={{ position: "absolute", inset: 0, background: "#F3F1EC", opacity: 0.85 * (1 - sw.open) }} /> : null}
          </div>
        </Sequence>
      ) : null}

      {/* the beam: the collapsed picture as one bright line, before the new one opens */}
      {sw.beam > 0.004 ? (
        <div
          style={{
            position: "absolute",
            left: "4%",
            width: "92%",
            top: SCR.h / 2 - 4,
            height: 8,
            borderRadius: 4,
            background: "#FFFFFF",
            opacity: sw.beam,
          }}
        />
      ) : null}
    </div>
  );
};
