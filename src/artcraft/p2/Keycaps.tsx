import React from "react";
import { interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { PH } from "../theme";
import { DECEL, ENTER, KEY, KEYCAPS, KEYS_IN, capLefts, clamp } from "./plan";

// ===========================================================================
// The keycap row (dark PH.panel caps, light ink, mono glyphs). Caps rest just
// above their scope trace; each press dips the cap and sends a blip down the
// trace under it (green, the person at the keyboard). Pressed caps stay lit.
// The trace itself is drawn by the scene (one svg for all traces).
// ===========================================================================

const { fontFamily: mono } = loadFont("normal", { weights: ["500"], subsets: ["latin"] });
const SYMBOL_FALLBACK = `${mono}, "SF Mono", Menlo, "Apple Symbols", monospace`;

export const pressOf = (frame: number, down: number, up: number) =>
  interpolate(frame, [down, down + 2, up, up + 6], [0, 1, 1, 0], { ...clamp, easing: DECEL });

/** blip envelope for the trace under a cap */
export const blipOf = (frame: number, down: number) =>
  interpolate(frame, [down, down + 3, down + 22], [0, 1, 0], { ...clamp, easing: DECEL });

export const keyBumps = (frame: number) =>
  KEYCAPS.map((k, i) => ({
    x: capLefts[i] + KEY.size / 2,
    amp: 17 * blipOf(frame, k.down),
    sigma: 44,
    rgb: PH.userRgb,
  }));

export const Keycaps: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {KEYCAPS.map((k, i) => {
      const enter = interpolate(frame, [KEYS_IN + i * 2.5, KEYS_IN + i * 2.5 + 16], [0, 1], { ...clamp, easing: ENTER });
      const press = pressOf(frame, k.down, k.up);
      const done = interpolate(frame, [k.down, k.down + 3], [0, 1], clamp);
      const depth = 7 - 5.5 * press;
      const symbol = k.glyph === "⌘" || k.glyph === "⇧";
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: capLefts[i],
            top: KEY.top + (1 - enter) * 30 + 5.5 * press,
            width: KEY.size,
            height: KEY.size,
            boxSizing: "border-box",
            borderRadius: 13,
            background: PH.panel,
            // the tube crushes dark grays to black, so the cap edge and side are lifted enough to survive it
            border: `1.5px solid rgba(233,231,226,${(0.44 + 0.22 * press).toFixed(3)})`,
            boxShadow: `0 ${depth.toFixed(2)}px 0 #6E737E`,
            opacity: enter,
            display: "grid",
            placeItems: "center",
            fontFamily: symbol ? SYMBOL_FALLBACK : mono,
            fontWeight: 500,
            fontSize: symbol ? 38 : 36,
            lineHeight: 1,
            color: PH.ink,
          }}
        >
          <span style={{ opacity: 0.5 + 0.32 * done + 0.18 * press }}>{k.glyph}</span>
        </div>
      );
    })}
  </>
);
