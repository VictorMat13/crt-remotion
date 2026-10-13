import React from "react";
import { LINES, tokenize } from "./code";
import { CODE, PANEL, charsAt, lineAt } from "./plan";
import { MONO_FONT, SYN } from "./ui";

// ===========================================================================
// The artifact's Code view (panel-local px, under the header). The real
// source streams in in bursts and auto-scrolls so the newest line stays three
// rows from the bottom: far too fast to read, and dimmed. Line numbers, a
// block caret at the write head, and a scrollbar thumb that shrinks as the
// file grows.
// ===========================================================================

const BODY_H = PANEL.bottom - PANEL.top - PANEL.header;
const ADV = 0.6 * CODE.font;

export const CodeView: React.FC<{ frame: number; opacity: number; dy?: number }> = ({ frame, opacity, dy = 0 }) => {
  if (opacity <= 0.001) return null;
  const chars = charsAt(frame);
  const { line, col, frac } = lineAt(chars);
  const streaming = line < LINES.length - 1 || frac < 1;
  const scroll = Math.max(0, line + frac - CODE.keep); // rows
  const first = Math.max(0, Math.floor(scroll));
  const last = Math.min(line, first + CODE.visible + 1);

  const rows: React.ReactNode[] = [];
  for (let i = first; i <= last; i++) {
    const y = CODE.padTop + (i - scroll) * CODE.line;
    const text = i < line ? LINES[i] : LINES[i].slice(0, col);
    rows.push(
      <div key={i} style={{ position: "absolute", left: 0, top: y, height: CODE.line, width: "100%", whiteSpace: "pre" }}>
        <span
          style={{
            position: "absolute",
            right: PANEL.right - PANEL.left - CODE.gutterR,
            top: 0,
            lineHeight: `${CODE.line}px`,
            fontSize: 26,
            color: SYN.gutter,
          }}
        >
          {i + 1}
        </span>
        <span style={{ position: "absolute", left: CODE.x, top: 0, lineHeight: `${CODE.line}px` }}>
          {tokenize(text).map((t, k) => (
            <span key={k} style={{ color: SYN[t.k] }}>
              {t.t}
            </span>
          ))}
          {i === line && streaming ? (
            <span
              style={{
                display: "inline-block",
                width: Math.round(ADV),
                height: CODE.line - 12,
                verticalAlign: -9,
                marginLeft: 1,
                background: SYN.id,
                opacity: 0.85,
              }}
            />
          ) : null}
        </span>
      </div>,
    );
  }

  // scrollbar
  const contentH = CODE.padTop + (line + 1) * CODE.line;
  const thumbH = contentH > BODY_H ? Math.max(70, (BODY_H * BODY_H) / contentH) : 0;
  const thumbTop = contentH > BODY_H ? ((scroll * CODE.line) / (contentH - BODY_H)) * (BODY_H - 16 - thumbH) + 8 : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: PANEL.header,
        height: BODY_H,
        overflow: "hidden",
        opacity,
        transform: `translateY(${dy.toFixed(2)}px)`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, fontFamily: MONO_FONT, fontSize: CODE.font, fontWeight: 500, fontVariantLigatures: "none", opacity: 0.56 }}>{rows}</div>
      {thumbH > 0 ? (
        <div
          style={{
            position: "absolute",
            right: 10,
            top: Math.min(thumbTop, BODY_H - 8 - thumbH),
            width: 9,
            height: thumbH,
            borderRadius: 5,
            background: "rgba(233,231,226,0.42)",
          }}
        />
      ) : null}
    </div>
  );
};
