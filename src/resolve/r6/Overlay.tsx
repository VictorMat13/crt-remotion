import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { MacCursor } from "../../artcraft/p5/glyphs";
import { PH } from "../theme";
import type { QLayout } from "./layout";
import { buildPath, Wire, type WireBump } from "./Wire";
import { ChipLayer, claudeVoice } from "./Chips";
import {
  ARRIVE,
  GLOBAL,
  GRADE,
  GREEN_RUN,
  H,
  LAND,
  MARK,
  PANEL_BOTTOM,
  SCOPE_Y,
  QUOTE_TEXT,
  TRAVEL,
  W,
  bgCam,
  bgToScreen,
  charPos,
  clamp,
  cursorAt,
  fgCam,
  fgToScreen,
  gradeK,
} from "./plan";

// ===========================================================================
// Screen-space layer, outside the camera blur (thin lines smear dark under
// it): Claude's scope trace with the mark sitting on it, the task names
// riding up into the mark (their coral trace runs under the release's words,
// see CoralTrace), the green trace from "focus on creative decisions" down
// to the Color page's Global wheel, and the plain arrow. Every point is
// placed through the same cameras as the planes it belongs to.
// ===========================================================================

const CORAL = PH.claudeRgb;
const GREEN = PH.userRgb;

/** the green trace: FG part (round the right of the name line, down past the release) + the run down to the wheel */
const greenPts = (lay: QLayout, f: number) => {
  const c = fgCam(f);
  // leaves the end of the quote's last line (right after "decisions.”"), runs down the release's
  // right margin (clear of every line), out past its foot and down to the wheel
  const e = charPos(lay, QUOTE_TEXT.length);
  const g0 = { x: e.x + 8, y: e.y + 4 };
  const down = { x: 968, y: PANEL_BOTTOM + 30 };
  const a0 = fgToScreen(g0, c);
  const a1 = fgToScreen({ x: down.x, y: g0.y }, c);
  const a2 = fgToScreen({ x: down.x, y: g0.y + 120 }, c);
  const a3 = fgToScreen(down, c);
  const wheelTop = bgToScreen({ x: GLOBAL.x, y: GLOBAL.y - GLOBAL.rOut - 2 }, bgCam(f));
  return buildPath([
    ["C", a0, a1, a2, a3],
    ["C", a3, { x: a3.x, y: a3.y + 300 }, { x: wheelTop.x + 0.25 * (a3.x - wheelTop.x), y: wheelTop.y - 420 }, wheelTop],
  ]);
};

export const Overlay: React.FC<{ frame: number; lay: QLayout }> = ({ frame: f, lay }) => {
  const c = fgCam(f);
  const z = c.z;

  // ---- Claude's scope line (FG world y = SCOPE_Y), the mark on it
  const l0 = fgToScreen({ x: -320, y: SCOPE_Y }, c);
  const l1 = fgToScreen({ x: W + 320, y: SCOPE_Y }, c);
  const scope = buildPath([["L", l0, l1]]);
  const markS = fgToScreen({ x: MARK.x, y: MARK.y }, c).x - l0.x;
  const scopeBumps: WireBump[] = [{ s: markS, amp: claudeVoice(f) * z, sigma: 80 * z, rgb: CORAL }];
  // each task Claude takes leaves along its line as a packet: Claude doing the work
  ARRIVE.forEach((t, i) => {
    const u = interpolate(f, [t + 2, t + 40], [0, 1], { ...clamp, easing: TRAVEL });
    if (u <= 0 || u >= 1) return;
    const env = interpolate(u, [0, 0.12, 0.85, 1], [0, 1, 1, 0], clamp);
    const dir = i === 1 ? 1 : -1;
    const s = markS + dir * u * (dir > 0 ? scope.L - markS : markS);
    scopeBumps.push({ s, amp: 20 * env * z, sigma: 44 * z, rgb: CORAL });
  });

  // ---- the green trace (focus on creative decisions -> the Global wheel)
  const showGreen = f >= GREEN_RUN[0];
  const green = showGreen ? greenPts(lay, f) : null;
  const head = interpolate(f, GREEN_RUN, [0, 1], { ...clamp, easing: TRAVEL });
  const greenBumps: WireBump[] = [];
  if (green) {
    const env = interpolate(f, [GREEN_RUN[0], GREEN_RUN[0] + 4, LAND - 1, LAND + 4], [0, 1, 1, 0], clamp);
    // while the trace is still short the packet is small too, and it calms as it reaches the bend into the wheel
    const grown = Math.min(1, (green.L * head) / 260);
    const calm = interpolate(head, [0.7, 1], [1, 0.45], clamp);
    if (env > 0.01) greenBumps.push({ s: green.L * head - 12, amp: 15 * env * grown * calm, sigma: 62, rgb: GREEN });
    // the person's voice on the line while they grade
    const talk = interpolate(f, [LAND + 2, GRADE[0], 240], [0, 0.7, 1], clamp) * (0.75 + 0.25 * Math.sin(f * 0.33));
    const g = gradeK(f);
    if (talk > 0.01) greenBumps.push({ s: green.L - 150, amp: (8 + 7 * g) * talk, sigma: 70, rgb: GREEN });
  }
  const greenEnd = green ? Math.min(green.L, green.L * head + 30) : 0;

  const cur = cursorAt(lay, f);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Wire path={scope} frame={f} bumps={scopeBumps} phase={-l0.x} stroke={2.6} />
        {green ? <Wire path={green} frame={f} s1={greenEnd} bumps={greenBumps} color={`rgba(${GREEN},0.55)`} phase={91} stroke={2.8} wave={0.55} /> : null}
      </svg>
      {/* the lifted task names and the Claude mark, on the FG plane, above the traces */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transform: `translate(${(W / 2 - c.x).toFixed(2)}px, ${(H / 2 - c.y).toFixed(2)}px) scale(${z.toFixed(5)})`,
          transformOrigin: `${c.x.toFixed(2)}px ${c.y.toFixed(2)}px`,
        }}
      >
        <ChipLayer frame={f} lay={lay} />
      </div>
      <MacCursor x={cur.x} y={cur.y} size={54} press={cur.press} opacity={cur.opacity} />
    </AbsoluteFill>
  );
};

