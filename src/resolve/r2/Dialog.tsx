import React from "react";
import { interpolate } from "remotion";
import { loadFont as loadOpenSans } from "@remotion/google-fonts/OpenSans";
import { RESOLVE } from "../theme";
import {
  BODY,
  CLOSE,
  CONTENT_AT,
  DECEL,
  DLG,
  ENTER,
  GPT_RGB,
  ICON,
  LIST,
  LIST_H,
  LIST_ROWS,
  OK_BTN,
  OPEN,
  PRESS,
  ROW_LIT,
  TITLE,
  clamp,
} from "./plan";

// ===========================================================================
// DaVinci Resolve's "AI Assistants Configured" dialog (Reference Manual
// p.4318), rebuilt as a dark panel at phone size: icon top left, title and
// body to its right, the scrollable list box, the default OK button with
// Resolve's red outline. Strings are exact (RESOLVE.dialog). Colours sampled
// from the manual figure (#28282F panel, #24242C list) and lifted only where
// the CRT grade would erase them (edges, the unlit row grey).
// The panel opens out of the Resolve icon and folds back into it on OK.
// Rows light one by one as packets reach the icon: a tint sweeps in from the
// left in the packet's colour (Claude coral, ChatGPT phosphor white).
// World px (FG plane); the icon itself is drawn by the scene, on the traces.
// ===========================================================================

export const { fontFamily: RESOLVE_FONT } = loadOpenSans("normal", { weights: ["400", "600"], subsets: ["latin"] });

const PANEL = "#28282F";
const LISTBG = "#22222A";
const EDGE = "rgba(233,231,226,0.5)";
const INK = "#F2F2F4";
const BODY_INK = "#D2D3D8";
const ROW_OFF = "#8A8D96"; // unlit row (Resolve list grey, lifted so it survives the tube)
const OK_RED = "#D3544C"; // default-button outline, sampled #9C4647 and lifted
const OK_RGB = "211,84,76";
const ROW_RGB = ["217,119,87", "217,119,87", GPT_RGB];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** panel rect: icon -> full dialog on open, full -> icon on close */
export const panelAt = (f: number) => {
  const o = interpolate(f, OPEN, [0, 1], { ...clamp, easing: ENTER });
  const c = interpolate(f, CLOSE, [0, 1], { ...clamp, easing: DECEL });
  const k = o * (1 - c);
  return {
    k,
    left: lerp(ICON.left - 6, DLG.left, k),
    top: lerp(ICON.top - 6, DLG.top, k),
    w: lerp(ICON.size + 12, DLG.w, k),
    h: lerp(ICON.size + 12, DLG.h, k),
    r: lerp(30, DLG.r, k),
    opacity: interpolate(f, [OPEN[0], OPEN[0] + 3], [0, 1], clamp) * interpolate(f, [CLOSE[1] - 5, CLOSE[1]], [1, 0], clamp),
  };
};

const rise = (f: number, at: number) => {
  const k = interpolate(f, [at, at + 12], [0, 1], { ...clamp, easing: ENTER });
  const out = interpolate(f, [CLOSE[0], CLOSE[0] + 5], [1, 0], clamp);
  return { opacity: k * out, transform: `translateY(${((1 - k) * 16).toFixed(2)}px)` };
};

const Row: React.FC<{ i: number; text: string; frame: number }> = ({ i, text, frame: f }) => {
  const lit = ROW_LIT[i];
  const k = interpolate(f, [lit, lit + 6], [0, 1], { ...clamp, easing: ENTER });
  const sweep = interpolate(f, [lit, lit + 7], [0, 1], { ...clamp, easing: DECEL });
  const rgb = ROW_RGB[i];
  // white blooms harder than coral in the tube: its tint runs lighter
  const tw = rgb === GPT_RGB ? 0.62 : 1;
  const tint = tw * interpolate(f, [lit, lit + 2, lit + 26], [0, 0.34, 0.14], clamp);
  const top = LIST.top + 2 + i * LIST.rowH;
  // ink: unlit grey -> lit near-white
  const c0 = [138, 141, 150];
  const c1 = [242, 242, 244];
  const ink = `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(",")})`;
  return (
    <div style={{ position: "absolute", left: LIST.left + 2, top, width: LIST.w - 4 - 26, height: LIST.rowH, ...rise(f, CONTENT_AT.rows[i]) }}>
      {tint > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 4,
            bottom: 4,
            width: `${(sweep * 100).toFixed(2)}%`,
            background: `rgba(${rgb},${tint.toFixed(3)})`,
            borderRadius: 4,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 0,
          height: LIST.rowH,
          display: "flex",
          alignItems: "center",
          fontSize: LIST.font,
          color: f >= lit ? ink : ROW_OFF,
          whiteSpace: "nowrap",
          letterSpacing: -0.1,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Dialog: React.FC<{ frame: number }> = ({ frame: f }) => {
  const p = panelAt(f);
  if (p.opacity <= 0.001) return null;
  const press = interpolate(f, [PRESS, PRESS + 2, PRESS + 8], [0, 1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: p.left,
        top: p.top,
        width: p.w,
        height: p.h,
        boxSizing: "border-box",
        borderRadius: p.r,
        background: PANEL,
        border: `2px solid ${EDGE}`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.75)",
        overflow: "hidden",
        opacity: p.opacity,
        fontFamily: RESOLVE_FONT,
      }}
    >
      {/* content in world px: undo the panel's own offset */}
      <div style={{ position: "absolute", left: -p.left - 2, top: -p.top - 2, width: 2000, height: 2000 }}>
        <div style={{ position: "absolute", left: TITLE.left, top: TITLE.top, fontSize: TITLE.font, fontWeight: 600, color: INK, whiteSpace: "nowrap", letterSpacing: -0.3, lineHeight: 1.2, ...rise(f, CONTENT_AT.title) }}>
          {RESOLVE.dialog.title}
        </div>
        <div style={{ position: "absolute", left: BODY.left, top: BODY.top, width: BODY.w, fontSize: BODY.font, lineHeight: `${BODY.line}px`, color: BODY_INK, ...rise(f, CONTENT_AT.body) }}>
          {RESOLVE.dialog.body}
        </div>

        {/* the list box (scrollable: three of its rows in view) */}
        <div
          style={{
            position: "absolute",
            left: LIST.left,
            top: LIST.top,
            width: LIST.w,
            height: LIST_H,
            boxSizing: "border-box",
            borderRadius: 6,
            background: LISTBG,
            border: `2px solid ${EDGE}`,
            ...rise(f, CONTENT_AT.list),
          }}
        >
          <div style={{ position: "absolute", right: 8, top: 10, width: 10, height: (LIST_H - 24) * 0.6, borderRadius: 5, background: "rgba(200,206,214,0.55)" }} />
        </div>
        {LIST_ROWS.map((t, i) => (
          <Row key={t} i={i} text={t} frame={f} />
        ))}

        {/* OK: Resolve's default button, red outline */}
        <div
          style={{
            position: "absolute",
            left: OK_BTN.left,
            top: OK_BTN.top,
            width: OK_BTN.w,
            height: OK_BTN.h,
            boxSizing: "border-box",
            borderRadius: 30,
            border: `3px solid ${OK_RED}`,
            background: `rgba(${OK_RGB},${(0.38 * press).toFixed(3)})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: OK_BTN.font,
            color: INK,
            ...rise(f, CONTENT_AT.ok),
          }}
        >
          {RESOLVE.dialog.ok}
        </div>
      </div>
    </div>
  );
};
