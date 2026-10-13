import React from "react";
import { Img, staticFile } from "remotion";
import { appShot } from "../theme";

// ===========================================================================
// FilmCraft's real screenshot, kept alive (native 1600x1000 px): the Program
// monitor's frame pushes in slowly like playing footage, and the two audio
// meters (measured: x 1499-1534 / 1538-1574, green y 753-891 on black) bounce.
// ===========================================================================

const SHOT = appShot("filmcraft");
const MON = { x: 604, y: 68, w: 560, h: 422 };
const METERS = [
  { x: 1497, w: 39, seed: 0 },
  { x: 1536, w: 40, seed: 1.7 },
];
const GREEN_TOP = 753;

/** smooth pseudo-audio level 0..1 from layered sines (no jitter) */
const level = (frame: number, seed: number) =>
  0.5 + 0.28 * Math.sin(frame * 0.31 + seed) + 0.16 * Math.sin(frame * 0.83 + seed * 2.3) + 0.06 * Math.sin(frame * 1.9 + seed);

export const FilmCraftLive: React.FC<{ frame: number }> = ({ frame }) => {
  const push = 1 + 0.07 * Math.min(1, Math.max(0, (frame + 30) / 280));
  return (
    <>
      <Img src={staticFile(SHOT)} style={{ position: "absolute", left: 0, top: 0, width: 1600, maxWidth: "none" }} />
      <div style={{ position: "absolute", left: MON.x, top: MON.y, width: MON.w, height: MON.h, overflow: "hidden" }}>
        <Img
          src={staticFile(SHOT)}
          style={{
            position: "absolute",
            left: -MON.x,
            top: -MON.y,
            width: 1600,
            maxWidth: "none",
            transform: `scale(${push.toFixed(4)})`,
            transformOrigin: `${MON.x + MON.w * 0.55}px ${MON.y + MON.h * 0.45}px`,
          }}
        />
      </div>
      {METERS.map((m) => (
        <div
          key={m.x}
          style={{
            position: "absolute",
            left: m.x,
            top: GREEN_TOP - 2,
            width: m.w,
            height: 2 + 78 * (1 - level(frame, m.seed)),
            backgroundColor: "#000000",
          }}
        />
      ))}
    </>
  );
};
