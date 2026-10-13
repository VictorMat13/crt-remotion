import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { LOGOS, PH } from "../theme";
import { UI_FONT, type QLayout } from "./layout";
import { buildPath, pathAt, Wire, type Path, type WireBump } from "./Wire";
import { ARRIVE, DECEL, ENTER, LIFT_AT, MARK, QUOTE, QUOTE_TEXT, RIDE, SEL_CORAL, TASKS, TRACE_C, TRAVEL, W, clamp, phraseBox } from "./plan";

// ===========================================================================
// FG world: the three task names lifting off the selected text (a copy of
// the selected words picked up off the page, on a dark chip with a coral
// edge, 2.5D lift with a shadow) and riding the coral trace up into the
// Claude mark, which takes each one with a ring and keeps talking.
// The words themselves never change: they only move with their chip.
// ===========================================================================

const LIFT_LEN = 10;
const LIFT_DY = 0; // lifts toward the camera (scale + shadow) right over its own words
const CHIP_PAD = 10;

/** each chip's own route: from where it lifted to the mark, joining the coral trace's tangent */
export const chipPath = (lay: QLayout, i: number): Path => {
  const b = phraseBox(lay, TASKS[i]);
  const c0 = { x: b.left + b.w / 2, y: b.top + QUOTE.line / 2 - LIFT_DY };
  const m = { x: MARK.x, y: MARK.y };
  return buildPath([["C", c0, { x: c0.x + (m.x - c0.x) * 0.15, y: c0.y - 150 }, { x: m.x, y: m.y + 330 }, m]]);
};

export const chipState = (lay: QLayout, f: number, i: number) => {
  const lift = interpolate(f, [LIFT_AT(i), LIFT_AT(i) + LIFT_LEN], [0, 1], { ...clamp, easing: ENTER });
  const [r0, r1] = RIDE(i);
  // leaves the page fast (little time over the lines above), slows into the mark
  const u = interpolate(f, [r0, r1], [0, 1], { ...clamp, easing: DECEL });
  return { lift, u, gone: f > r1 };
};

export const Chips: React.FC<{ frame: number; lay: QLayout }> = ({ frame: f, lay }) => (
  <>
    {TASKS.map((rng, i) => {
      const st = chipState(lay, f, i);
      if (st.lift <= 0.001 || st.gone) return null;
      const b = phraseBox(lay, rng);
      const path = chipPath(lay, i);
      const p = pathAt(path, st.u * path.L);
      // at rest over its own words (lift 0) -> lifted (lift 1) -> along the route
      const restC = { x: b.left + b.w / 2, y: b.top + QUOTE.line / 2 };
      // (the route starts at the fully lifted spot; a lift still finishing rides along as an offset)
      const cx = st.u > 0 ? p.x : restC.x;
      const cy = st.u > 0 ? p.y + LIFT_DY * (1 - st.lift) : restC.y - LIFT_DY * st.lift;
      // readable while it lifts, then it shrinks fast as it leaves the page (smaller footprint over the lines above)
      const scale = (1 + 0.05 * st.lift) * interpolate(st.u, [0, 0.5, 1], [1, 0.64, 0.28], clamp);
      const fade = interpolate(st.u, [0.78, 1], [1, 0], clamp);
      const w = b.w + 2 * CHIP_PAD;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: cx - w / 2,
            top: cy - QUOTE.line / 2,
            width: w,
            height: QUOTE.line,
            boxSizing: "border-box",
            borderRadius: 10,
            background: `rgba(28,31,38,${st.lift.toFixed(3)})`,
            border: `2.5px solid rgba(${PH.claudeRgb},${(0.95 * st.lift).toFixed(3)})`,
            boxShadow: `0 ${(18 * st.lift).toFixed(1)}px ${(40 * st.lift).toFixed(1)}px rgba(0,0,0,${(0.65 * st.lift).toFixed(3)})`,
            transform: `scale(${scale.toFixed(4)})`,
            opacity: fade,
            fontFamily: UI_FONT,
            fontSize: QUOTE.font,
            fontWeight: QUOTE.weight,
            lineHeight: `${QUOTE.line - 5}px`,
            color: PH.ink,
            whiteSpace: "pre",
            paddingLeft: CHIP_PAD - 2.5,
            zIndex: 5,
          }}
        >
          {QUOTE_TEXT.slice(rng[0], rng[1])}
        </div>
      );
    })}
  </>
);

// ---------------------------------------------------------------- the Claude mark on its scope trace

/** Claude's voice on its line: a quiet idle hum, speaking up as each task arrives */
export const claudeVoice = (f: number) => {
  let a = 7 + 3 * Math.sin(f * 0.21) + 1.5 * Math.sin(f * 0.53);
  for (const t of ARRIVE) a += 16 * interpolate(f, [t - 6, t, t + 16], [0, 1, 0.35], clamp);
  return a;
};

const Ring: React.FC<{ at: number; frame: number; r0: number; rgb: string; cx: number; cy: number }> = ({ at, frame, r0, rgb, cx, cy }) => {
  const t = (frame - at) / 24;
  if (t < 0 || t > 1) return null;
  const r = r0 + 34 * DECEL(t);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: 2 * r,
        height: 2 * r,
        boxSizing: "border-box",
        borderRadius: "50%",
        border: `2.5px solid rgba(${rgb},${(0.6 * (1 - t)).toFixed(3)})`,
      }}
    />
  );
};

export const ClaudeMark: React.FC<{ frame: number }> = ({ frame: f }) => {
  const s = MARK.size;
  const talk = (claudeVoice(f) - 7) / 20;
  // turns while it works (after the first task lands)
  const spin = 50 * interpolate(f, [ARRIVE[0] - 4, 300], [0, 1], { ...clamp, easing: TRAVEL });
  return (
    <>
      {ARRIVE.map((t, i) => (
        <Ring key={i} at={t} frame={f} r0={s / 2} rgb={PH.claudeRgb} cx={MARK.x} cy={MARK.y} />
      ))}
      <div
        style={{
          position: "absolute",
          left: MARK.x - s / 2,
          top: MARK.y - s / 2,
          width: s,
          height: s,
          boxSizing: "border-box",
          borderRadius: "50%",
          background: "#08090B",
          border: `2.5px solid rgba(${PH.claudeRgb},0.55)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${(1 + 0.035 * Math.max(0, talk)).toFixed(4)})`,
          zIndex: 6,
        }}
      >
        <Img src={staticFile(LOGOS.claude)} style={{ width: s * 0.64, height: s * 0.64, transform: `rotate(${spin.toFixed(2)}deg)` }} />
      </div>
    </>
  );
};

/** FG plane, above the traces: the lifted names, then the mark they disappear into */
export const ChipLayer: React.FC<{ frame: number; lay: QLayout }> = ({ frame, lay }) => (
  <>
    <Chips frame={frame} lay={lay} />
    <ClaudeMark frame={frame} />
  </>
);

// ---------------------------------------------------------------- the coral trace (FG world, under the words)
/** from the top of the selection up into the mark from below; drawn on the release's surface, under its text */
const coralRoute = (lay: QLayout) => {
  const b = phraseBox(lay, [SEL_CORAL[0], SEL_CORAL[0] + "repetitive tasks".length]);
  const s = { x: b.left + b.w / 2, y: b.top + 4 };
  const m = { x: MARK.x, y: MARK.y };
  return buildPath([["C", s, { x: s.x, y: s.y - 170 }, { x: m.x, y: m.y + 330 }, m]]);
};

export const CoralTrace: React.FC<{ frame: number; lay: QLayout }> = ({ frame: f, lay }) => {
  const grow = interpolate(f, TRACE_C, [0, 1], { ...clamp, easing: DECEL });
  const fade = interpolate(f, [176, 192], [1, 0], { ...clamp, easing: TRAVEL });
  if (grow <= 0 || fade <= 0.01) return null;
  const path = coralRoute(lay);
  const bumps: WireBump[] = [];
  // a coral packet runs up it with each task; the head talks while it draws out
  for (const t of ARRIVE) {
    const u = interpolate(f, [t - 26, t], [0, 1], { ...clamp, easing: TRAVEL });
    if (u > 0 && u < 1) bumps.push({ s: path.L * u, amp: 7 * interpolate(u, [0, 0.15, 0.85, 1], [0, 1, 1, 0], clamp), sigma: 64, rgb: PH.claudeRgb });
  }
  if (grow < 1) bumps.push({ s: path.L * grow, amp: 7, sigma: 56, rgb: PH.claudeRgb });
  return (
    <svg width={W} height={1600} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: fade }}>
      <Wire path={path} frame={f} s1={path.L * grow} bumps={bumps} color={`rgba(${PH.claudeRgb},0.62)`} phase={37} stroke={2.6} wave={0.7} />
    </svg>
  );
};
