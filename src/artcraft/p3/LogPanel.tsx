import React from "react";
import { interpolate } from "remotion";
import { PH, REPO } from "../theme";
import { LOG_ROWS } from "./log";
import { clamp, commitsShown, enter, LAYOUT, SR, travel } from "./timebase";

// ===========================================================================
// Dark panel under the scope: the real photocraft git log scrolling (oldest
// at top, "init repo" first), with GitHub's own counter wording in the
// header ("2,012 Commits"), ticking with the bars on the trace.
// ===========================================================================

export const PANEL = { top: 540, h: 376, header: 66, rowH: 42, rows: 7, padX: 26 };
const IN = { from: 106, to: 128 };
const SCROLL = { from: 124, span: 120, at179: 30 }; // still accelerating at the last frame
const SCROLL_L = SCROLL.at179 / travel((179 - SCROLL.from) / SCROLL.span);

// rises with the axis (never covers the lanes while they compress)
export const panelTop = (f: number) =>
  Math.max(interpolate(f, [IN.from, IN.to], [960 + 30, PANEL.top], { ...clamp, easing: enter }), LAYOUT.axisY(f) + (PANEL.top - LAYOUT.axisY(999)));

const History: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  // GitHub's "history" octicon shape (clock with a counter-clockwise arrow), drawn as strokes
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.2 6.2A6 6 0 1 1 2 8" />
    <path d="M1.4 3.4 2.2 6.2 5 5.4" />
    <path d="M8 4.8V8l2.3 1.4" />
  </svg>
);

const Branch: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round">
    <circle cx="4.5" cy="3.5" r="1.6" />
    <circle cx="4.5" cy="12.5" r="1.6" />
    <circle cx="11.5" cy="4.5" r="1.6" />
    <path d="M4.5 5.1v5.8M11.5 6.1c0 3-7 2.4-7 4.8" />
  </svg>
);

export const LogPanel: React.FC<{ frame: number; ui: string; mono: string }> = ({ frame, ui, mono }) => {
  const f = frame;
  const top = panelTop(f);
  if (top > 958) return null;
  const k = interpolate(f, [IN.from, IN.to], [0, 1], { ...clamp, easing: enter });
  const rise = (d: number) => {
    const r = interpolate(f, [IN.from + 4 + d, IN.from + 16 + d], [0, 1], { ...clamp, easing: enter });
    return { opacity: r, transform: `translateY(${(1 - r) * 10}px)` };
  };
  const scroll = f <= SCROLL.from ? 0 : SCROLL_L * travel(Math.min(1, (f - SCROLL.from) / SCROLL.span));
  const first = Math.max(0, Math.floor(scroll));
  const n = commitsShown(f);

  const rows: React.ReactNode[] = [];
  for (let i = first; i < Math.min(LOG_ROWS.length, first + PANEL.rows + 2); i++) {
    const r = LOG_ROWS[i];
    const yy = (i - scroll) * PANEL.rowH;
    rows.push(
      <div key={r.sha} style={{ position: "absolute", left: 0, right: 0, top: yy, height: PANEL.rowH, display: "flex", alignItems: "center", gap: 18, whiteSpace: "nowrap" }}>
        <span style={{ color: "#B9BEC8", flex: "none" }}>{r.sha}</span>
        <span style={{ color: PH.ink, overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{r.subject}</span>
      </div>,
    );
  }

  return (
    <div
      style={{
        position: "absolute", left: SR.left, top, width: SR.width, height: PANEL.h, boxSizing: "border-box",
        background: PH.panel, border: "1px solid rgba(255,255,255,0.30)", borderRadius: 14, overflow: "hidden",
        opacity: Math.min(1, k * 2.2),
      }}
    >
      {/* header: repo + branch, GitHub's commit counter */}
      <div style={{ position: "absolute", left: PANEL.padX, right: PANEL.padX, top: 0, height: PANEL.header, display: "flex", alignItems: "center", gap: 16, fontFamily: ui, fontSize: 29, color: PH.ink }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 9, background: PH.panel2, border: "1px solid rgba(255,255,255,0.22)", fontSize: 24, ...rise(0) }}>
          <Branch size={22} color="#C9CDD4" />
          <span style={{ fontFamily: mono }}>{REPO.branch}</span>
        </div>
        <div style={{ fontWeight: 500, ...rise(2) }}>
          {REPO.owner} / {REPO.name}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontVariantNumeric: "tabular-nums", ...rise(4) }}>
          <History size={26} color={PH.ink} />
          <span>{n.toLocaleString("en-US")} Commits</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: PANEL.header, height: 1, background: "rgba(255,255,255,0.26)" }} />
      {/* the log */}
      <div style={{ position: "absolute", left: PANEL.padX, right: PANEL.padX, top: PANEL.header + 8, height: PANEL.rowH * PANEL.rows, overflow: "hidden", fontFamily: mono, fontSize: 27 }}>
        {rows}
      </div>
    </div>
  );
};
