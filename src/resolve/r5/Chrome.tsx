import React from "react";
import { Img, staticFile } from "remotion";
import { PH, Scope, type ScopeBump } from "../theme";
import { BAR_BOTTOM, BAR_CENTER_SRC, BAR_S, BAR_SRC, BAR_TOP, H, LINE_Y, W, activeOf, barX, camAt, cellX4k, packetX4k, talkAmp } from "./rig";

// ===========================================================================
// Screen-space chrome, never blurred: Resolve's real page bar at the foot of
// the frame (as in the app, the page stands on it), at 1.15x so its labels
// read on a phone, showing Edit, Fusion, Color, Fairlight. The strip is the
// Color shot's own bar (Color active); each other state is the real cell
// cropped from that page's own press shot and laid exactly over it (the bars
// are pixel-identical apart from the active cell). Under it, the scope trace
// with Claude's coral packet doing the work.
// ===========================================================================

const SHOT4K = (n: string) => `resolve/shots/bmd-resolve21-${n}-hires.png`;
const SHOT5K = "resolve/shots/bmd-resolve21-Edit-hires.png";

/** a crop of a press shot's bar, placed at its 4K bar position on screen */
const BarCrop: React.FC<{ src: string; k5: boolean; x4k: number; w4k: number; opacity?: number }> = ({ src, k5, x4k, w4k, opacity = 1 }) => {
  if (opacity <= 0.002) return null;
  const sx = k5 ? x4k + BAR_SRC.dx5k : x4k;
  const sy = k5 ? BAR_SRC.y5k : BAR_SRC.y4k;
  const iw = k5 ? 5120 : 3840;
  const ih = k5 ? 2880 : 2160;
  return (
    <div
      style={{
        position: "absolute",
        left: barX(x4k),
        top: BAR_TOP,
        width: w4k * BAR_S,
        height: BAR_SRC.h * BAR_S,
        overflow: "hidden",
        opacity: opacity < 0.998 ? opacity : undefined,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{ position: "absolute", left: -sx * BAR_S, top: -sy * BAR_S, width: iw * BAR_S, height: ih * BAR_S, display: "block", maxWidth: "none" }}
      />
    </div>
  );
};

const PageBar: React.FC<{ frame: number }> = ({ frame: f }) => {
  const x0 = Math.floor(-W / 2 / BAR_S + BAR_CENTER_SRC) - 8;
  const x1 = Math.ceil(W / 2 / BAR_S + BAR_CENTER_SRC) + 8;
  const cell = BAR_SRC.cell;
  return (
    // the bar's dark grey labels sink in the tube: lifted a touch (its near-black ground stays black)
    <div style={{ position: "absolute", inset: 0, filter: "brightness(1.32)" }}>
      <BarCrop src={SHOT4K("Color")} k5={false} x4k={x0} w4k={x1 - x0} />
      {/* Color back to its normal look (the unlit cell from the Fusion shot) once another page is active */}
      <BarCrop src={SHOT4K("Fusion")} k5={false} x4k={cellX4k("color")} w4k={cell} opacity={1 - activeOf("color", f)} />
      <BarCrop src={SHOT5K} k5 x4k={cellX4k("edit")} w4k={cell} opacity={activeOf("edit", f)} />
      <BarCrop src={SHOT4K("Fusion")} k5={false} x4k={cellX4k("fusion")} w4k={cell} opacity={activeOf("fusion", f)} />
      <BarCrop src={SHOT4K("Fairlight")} k5={false} x4k={cellX4k("fairlight")} w4k={cell} opacity={activeOf("fairlight", f)} />
    </div>
  );
};

/** the scope's graticule in the band under the bar; it slides with the camera (parallax) */
const Graticule: React.FC<{ frame: number }> = ({ frame: f }) => {
  const step = 60;
  const off = -(((camAt(f).x * 0.05) % step) + step) % step;
  const ticks: React.ReactNode[] = [];
  for (let x = off - step; x < W + step; x += step) {
    ticks.push(<line key={x} x1={x} y1={LINE_Y - 14} x2={x} y2={LINE_Y + 14} stroke="rgba(233,231,226,0.22)" strokeWidth={2} />);
  }
  return <g>{ticks}</g>;
};

export const Chrome: React.FC<{ frame: number }> = ({ frame: f }) => {
  const px = barX(packetX4k(f));
  const bumps: ScopeBump[] = [{ x: px, amp: talkAmp(f), sigma: 58, rgb: PH.claudeRgb }];
  return (
    <>
      {/* under the bar: the scope's own black, the world never shows below the app's page bar */}
      <div style={{ position: "absolute", left: 0, top: BAR_BOTTOM - 1, width: W, height: H - BAR_BOTTOM + 1, backgroundColor: "#050608" }} />
      <PageBar frame={f} />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Graticule frame={f} />
        <Scope frame={f} x0={-20} x1={W + 20} y={LINE_Y} bumps={bumps} hum={1.6} stroke={3} color="rgba(243,241,236,0.62)" />
      </svg>
    </>
  );
};
