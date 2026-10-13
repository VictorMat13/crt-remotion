import React from "react";
import { Img, staticFile } from "remotion";
import { PH, Scope, type ScopeBump } from "../theme";
import { BAR_CENTER_SRC, BAR_S, BAR_SRC, BAR_TOP, LINE_Y, W, activeOf, barX, c01, cellX5k, packetX5k, seg, DECEL, SWITCH_AT, type Cell } from "./rig";

// ===========================================================================
// Resolve's real page bar, as the frame's chrome (screen space, never blurred):
// the strip is cropped from the Edit press shot (Edit is the active page), at
// 1.3x so its labels read on a phone. A page becomes active the way Resolve
// shows it (black cell, white label, colored icon, red underline): that cell
// is the real one, cropped from the page's own press shot, laid exactly over
// the bar (the bars are pixel-identical apart from the active cell). The Edit
// cell goes back to its normal look with the real unlit cell (from the Fusion
// shot). Under it runs the scope trace with the coral packet.
// ===========================================================================

const SHOT5K = "resolve/shots/bmd-resolve21-Edit-hires.png";
const SHOT4K = (n: string) => `resolve/shots/bmd-resolve21-${n}-hires.png`;

/** a crop of a press shot's bar, placed at its 5K bar position on screen */
const BarCrop: React.FC<{ src: string; k4: boolean; x5k: number; w5k: number; opacity?: number }> = ({ src, k4, x5k, w5k, opacity = 1 }) => {
  if (opacity <= 0.002) return null;
  const sx = k4 ? x5k - BAR_SRC.dx5k : x5k; // x in the shot's own px
  const sy = k4 ? BAR_SRC.y4k : BAR_SRC.y5k;
  const iw = k4 ? 3840 : 5120;
  const ih = k4 ? 2160 : 2880;
  return (
    <div
      style={{
        position: "absolute",
        left: barX(x5k),
        top: BAR_TOP,
        width: w5k * BAR_S,
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

const LIT: { cell: Cell & ("fusion" | "color" | "fairlight"); n: string }[] = [
  { cell: "fusion", n: "Fusion" },
  { cell: "color", n: "Color" },
  { cell: "fairlight", n: "Fairlight" },
];

export const PageBar: React.FC<{ frame: number }> = ({ frame: f }) => {
  // only the part of the strip that can be on screen (5K x for screen 0..W)
  const x0 = Math.floor(-W / 2 / BAR_S + BAR_CENTER_SRC) - 8;
  const x1 = Math.ceil(W / 2 / BAR_S + BAR_CENTER_SRC) + 8;
  return (
    // the bar's dark grey labels sink in the tube: lifted a touch (its near-black ground stays black)
    <div style={{ position: "absolute", inset: 0, filter: "brightness(1.32)" }}>
      <BarCrop src={SHOT5K} k4={false} x5k={x0} w5k={x1 - x0} />
      {/* Edit returns to its normal look once another page is active */}
      <BarCrop src={SHOT4K("Fusion")} k4 x5k={cellX5k("edit")} w5k={BAR_SRC.cell} opacity={1 - activeOf("edit", f)} />
      {LIT.map(({ cell, n }) => (
        <BarCrop key={cell} src={SHOT4K(n)} k4 x5k={cellX5k(cell)} w5k={BAR_SRC.cell} opacity={activeOf(cell, f)} />
      ))}
    </div>
  );
};

/** the packet: Claude's coral, talking on the Edit cell at the open, then running along the bar */
export const Trace: React.FC<{ frame: number }> = ({ frame: f }) => {
  const px = barX(packetX5k(f));
  // talks on Edit (amplitude breathing), runs flatter, leans into each cell it switches
  const talk = 1 - 0.35 * seg(f, 18, 34, DECEL);
  const lean = Math.max(...Object.values(SWITCH_AT).map((a) => c01(1 - Math.abs(f - a) / 8)));
  const amp = (30 * talk + 10 * lean) * (0.84 + 0.16 * Math.sin(f * 0.43));
  const bumps: ScopeBump[] = [{ x: px, amp, sigma: 58, rgb: PH.claudeRgb }];
  return (
    <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <Scope frame={f} x0={-20} x1={W + 20} y={LINE_Y} bumps={bumps} hum={1.6} stroke={3} color="rgba(243,241,236,0.62)" />
    </svg>
  );
};
