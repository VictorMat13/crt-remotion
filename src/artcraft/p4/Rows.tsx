import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { ENTER, DECEL, ICON, ROW, ROW_W, TRACE_X, clamp, type ListRow } from "./plan";
import { Law, Star } from "./glyphs";
import { UI, UI_FONT, mix } from "./ui";

// ===========================================================================
// A GitHub repository list row (storytold's repositories tab, dark), scaled up
// for the phone: "storytold / name" + Public, then language, stars, license.
// The row's app icon sits on the scope trace in the gutter to its left.
// ===========================================================================

/** "54.5k" -> tenths of a thousand (545) */
const tenths = (s: string) => Math.round(parseFloat(s) * 10);
/** live star counter: starts 0.3k under the real count, ticks up to it after the row wakes */
export const starsAt = (stars: string, frame: number, wake: number) => {
  const v = tenths(stars);
  const k = interpolate(frame, [wake + 2, wake + 30], [0, 1], { ...clamp, easing: DECEL });
  const n = v - 3 + Math.floor(3 * k + 1e-6);
  return `${(n / 10).toFixed(1)}k`;
};

export const PublicPill: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 28, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      height: size * 1.55,
      padding: `0 ${Math.round(size * 0.62)}px`,
      boxSizing: "border-box",
      borderRadius: 999,
      border: `2px solid ${UI.edge}`,
      color: UI.meta,
      fontSize: size,
      fontWeight: 500,
      lineHeight: 1,
      flex: "none",
      ...style,
    }}
  >
    Public
  </span>
);

const rise = (frame: number, at: number, dy = 14) => {
  const k = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: ENTER });
  return { opacity: k, transform: `translateY(${((1 - k) * dy).toFixed(2)}px)` };
};

export const RepoRow: React.FC<{
  row: ListRow;
  frame: number;
  /** frame the row starts rising into place (-Infinity = already there) */
  entry: number;
  wake: number;
  /** panel height (photocraft grows into its repo page) */
  height?: number;
  /** 0 = list row (link blue name), 1 = repo page header (ink) */
  headerT?: number;
  metaOpacity?: number;
  children?: React.ReactNode;
}> = ({ row, frame, entry, wake, height = ROW.h, headerT = 0, metaOpacity = 1, children }) => {
  const enter = Number.isFinite(entry) ? interpolate(frame, [entry, entry + 18], [0, 1], { ...clamp, easing: ENTER }) : 1;
  if (enter <= 0) return null;
  const st = (d: number) => (Number.isFinite(entry) ? rise(frame, entry + d, 18) : {});
  const [owner, name] = ["storytold", row.id];
  const nameColor = headerT > 0 ? mix(UI.linkRgb, UI.inkRgb, headerT) : UI.link;
  return (
    <div
      style={{
        position: "absolute",
        left: ROW.left,
        top: row.top + (1 - enter) * 90,
        width: ROW_W,
        height,
        boxSizing: "border-box",
        borderRadius: 14,
        background: UI.panel,
        border: `2px solid ${UI.edge}`,
        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        opacity: Math.min(1, enter * 2.2),
        overflow: "hidden",
        fontFamily: UI_FONT,
        zIndex: row.i === 11 ? 6 : 4,
      }}
    >
      <div style={{ position: "absolute", left: 30, top: 26, height: 56, display: "flex", alignItems: "center", gap: 16, whiteSpace: "nowrap", ...st(0) }}>
        <span style={{ fontSize: 40, fontWeight: 600, color: nameColor, letterSpacing: -0.3 }}>
          <span style={{ fontWeight: headerT > 0.5 ? 400 : 600 }}>{owner}</span>
          <span style={{ margin: "0 10px" }}>/</span>
          {name}
        </span>
        <PublicPill style={st(2)} />
      </div>
      {metaOpacity > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: 30,
            top: 104,
            height: 44,
            display: "flex",
            alignItems: "center",
            gap: 36,
            fontSize: 34,
            color: UI.meta,
            whiteSpace: "nowrap",
            opacity: metaOpacity,
            ...st(4),
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: UI.rust }} />
            Rust
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 9, fontVariantNumeric: "tabular-nums" }}>
            <Star size={32} color={UI.meta} sw={1.4} />
            {starsAt(row.stars, frame, wake)}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Law size={32} color={UI.meta} sw={1.3} />
            Apache-2.0
          </span>
        </div>
      ) : null}
      {children}
    </div>
  );
};

/** an app icon on the trace: asleep (gray, dim) until `wake`, then lit with one soft ring */
export const TraceIcon: React.FC<{ src: string; y: number; frame: number; wake: number; rgb: string; size?: number; entry?: number }> = ({
  src,
  y,
  frame,
  wake,
  rgb,
  size = ICON,
  entry = -Infinity,
}) => {
  const enter = Number.isFinite(entry) ? interpolate(frame, [entry, entry + 18], [0, 1], { ...clamp, easing: ENTER }) : 1;
  if (enter <= 0) return null;
  const k = interpolate(frame, [wake - 2, wake + 8], [0, 1], { ...clamp, easing: ENTER });
  const rip = (frame - wake) / 26;
  const r = size * 0.22;
  return (
    <>
      {rip > 0 && rip < 1 ? (
        <div
          style={{
            position: "absolute",
            left: TRACE_X - size / 2 - 26 * DECEL(rip),
            top: y - size / 2 - 26 * DECEL(rip),
            width: size + 52 * DECEL(rip),
            height: size + 52 * DECEL(rip),
            boxSizing: "border-box",
            borderRadius: r + 10 * DECEL(rip),
            border: `2px solid rgba(${rgb},${(0.6 * (1 - rip)).toFixed(3)})`,
            zIndex: 7,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: TRACE_X - size / 2,
          top: y - size / 2 + (1 - enter) * 90,
          width: size,
          height: size,
          borderRadius: r,
          overflow: "hidden",
          opacity: Math.min(1, enter * 2.2) * (0.6 + 0.4 * k),
          transform: `scale(${(0.94 + 0.06 * k).toFixed(4)})`,
          filter: k < 0.995 ? `grayscale(${(0.9 * (1 - k)).toFixed(3)}) brightness(${(0.72 + 0.28 * k).toFixed(3)})` : undefined,
          zIndex: 8,
        }}
      >
        <Img src={staticFile(src)} style={{ width: size, height: size, display: "block" }} />
      </div>
    </>
  );
};
