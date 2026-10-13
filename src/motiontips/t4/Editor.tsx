import React from "react";
import { PH, SKILL_FILE } from "../theme";
import { ADV, BODY, DECEL, DOC, ED, ENTER, ITEM_AT, ROW0, SEL_ROW, SEL_STAGGER, TOTAL_ROWS, scrollAt, seg } from "./plan";

// ===========================================================================
// The real STYLE.md open big in a dark editor (same card language as the T3
// SkillCard: doc glyph + file name header, raw markdown with the markers
// muted and bold runs bold). Soft-wrapped at 39 columns, one 36px size.
// The rule being applied is selected (an editor's blue selection sweeping
// its rows, caret at the head) and sits at full ink; the rest of the file
// stays dimmed around it. The file scrolls smoothly to keep the selected
// rule on the same row, so only one or two rules read at a time.
// ===========================================================================

const SEL = "#2E5E95"; // editor selection blue, lifted so it survives the grade
const BODY_TOP = ED.header + BODY.padTop;
const VIEW_ROWS = (ED.h - BODY_TOP - 8) / BODY.line;

type Tok = { t: string; k: "mark" | "strong" | "head" | "text" };

const tokenizeRow = (row: string, kind: string, first: boolean): Tok[] => {
  if (kind === "head") {
    const m = first ? row.match(/^(#+ )(.*)$/) : null;
    return m ? [{ t: m[1], k: "mark" }, { t: m[2], k: "head" }] : [{ t: row, k: "head" }];
  }
  const out: Tok[] = [];
  let rest = row;
  const lead = first ? rest.match(/^(\d+\. |- )/) : null;
  if (lead) {
    out.push({ t: lead[1], k: "mark" });
    rest = rest.slice(lead[1].length);
  }
  rest.split("**").forEach((p, i) => {
    if (i > 0) out.push({ t: "**", k: "mark" });
    if (p) out.push({ t: p, k: i % 2 === 1 ? "strong" : "text" });
  });
  return out;
};

const tokStyle = (k: Tok["k"]): React.CSSProperties =>
  k === "mark"
    ? { color: PH.muted }
    : k === "head" || k === "strong"
      ? { color: PH.ink, fontWeight: 700 }
      : { color: PH.ink };

const DocGlyph: React.FC = () => (
  <svg width={30} height={38} viewBox="0 0 30 38" style={{ display: "block" }}>
    <path d="M3 2.5 H19 L27.5 11 V35.5 H3 Z" fill="none" stroke={PH.ink} strokeWidth={2.6} strokeLinejoin="round" />
    <path d="M19 2.5 V11 H27.5" fill="none" stroke={PH.ink} strokeWidth={2.6} strokeLinejoin="round" />
  </svg>
);

/** 0..1: how much rule k is the one being applied */
const activeW = (f: number, k: number) =>
  seg(f, ITEM_AT[k] - 2, ITEM_AT[k] + 7, ENTER) - (k + 1 < ITEM_AT.length ? seg(f, ITEM_AT[k + 1] - 2, ITEM_AT[k + 1] + 7, DECEL) : 0);

export const Editor: React.FC<{ f: number; ui: string; mono: string }> = ({ f, ui, mono }) => {
  const scroll = scrollAt(f);
  const rowY = (r: number) => BODY_TOP + (r - scroll) * BODY.line;

  const rows: React.ReactNode[] = [];
  const sels: React.ReactNode[] = [];
  let caret: { x: number; y: number; solid: boolean } | null = null;

  DOC.forEach((d, i) => {
    const r0 = ROW0[i];
    const item = d.item;
    const w = item === undefined ? 0 : activeW(f, item);
    const base = d.kind === "head" ? 0.6 : 0.4;
    const opacity = base + (1 - base) * w;

    // selection sweep for a rule (rows staggered), fades when the next rule starts
    if (item !== undefined) {
      const at = ITEM_AT[item];
      const out = item + 1 < ITEM_AT.length ? 1 - seg(f, ITEM_AT[item + 1] - 1, ITEM_AT[item + 1] + 6, DECEL) : 1;
      if (f >= at && out > 0.001) {
        d.rows.forEach((row, j) => {
          const k = seg(f, at + j * SEL_STAGGER, at + j * SEL_STAGGER + SEL_ROW, ENTER);
          if (k <= 0.001) return;
          const full = row.length * ADV + 14;
          sels.push(
            <div
              key={`s${i}-${j}`}
              style={{ position: "absolute", left: BODY.padX - 7, top: rowY(r0 + j) + 2, width: full * k, height: BODY.line - 4, background: SEL, opacity: out, borderRadius: 3 }}
            />,
          );
          if (out > 0.5 && f >= at + j * SEL_STAGGER) caret = { x: BODY.padX - 7 + full * k, y: rowY(r0 + j), solid: k < 0.999 };
        });
      }
    }

    d.rows.forEach((row, j) => {
      const y = rowY(r0 + j);
      if (y < BODY_TOP - BODY.line || y > ED.h) return;
      rows.push(
        <div key={`r${i}-${j}`} style={{ position: "absolute", left: BODY.padX, top: y, height: BODY.line, lineHeight: `${BODY.line}px`, whiteSpace: "pre", opacity }}>
          {tokenizeRow(row, d.kind, j === 0).map((t, n) => (
            <span key={n} style={tokStyle(t.k)}>
              {t.t}
            </span>
          ))}
        </div>,
      );
    });
  });

  // caret blinks once the selection has landed
  const c = caret as { x: number; y: number; solid: boolean } | null;
  const caretOn = c ? c.solid || Math.floor((f + 400) / 16) % 2 === 0 : false;

  // scrollbar
  const trackH = ED.h - BODY_TOP - 16;
  const thumbH = (trackH * VIEW_ROWS) / TOTAL_ROWS;
  const thumbTop = BODY_TOP + 8 + ((trackH - thumbH) * scroll) / (TOTAL_ROWS - VIEW_ROWS);

  return (
    <div
      style={{
        position: "absolute",
        left: ED.left,
        top: ED.top,
        width: ED.w,
        height: ED.h,
        borderRadius: 16,
        overflow: "hidden",
        background: PH.panel,
        border: "3px solid rgba(233,231,226,0.72)",
        boxSizing: "border-box",
      }}
    >
      {/* body */}
      <div style={{ position: "absolute", inset: 0, fontFamily: mono, fontSize: BODY.font, fontWeight: 500, letterSpacing: BODY.track, fontVariantLigatures: "none" }}>
        {sels}
        {rows}
        {c && caretOn ? <div style={{ position: "absolute", left: c.x, top: c.y + 6, width: 3, height: BODY.line - 12, background: PH.ink }} /> : null}
      </div>
      {/* scrollbar */}
      <div style={{ position: "absolute", right: 7, top: thumbTop, width: 7, height: thumbH, borderRadius: 5, background: "rgba(233,231,226,0.42)" }} />
      {/* header: the file */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: ED.header,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 24px",
          borderBottom: `2px solid ${PH.hair}`,
          background: PH.panel2,
        }}
      >
        <DocGlyph />
        <div style={{ fontFamily: ui, fontSize: 44, fontWeight: 600, color: PH.ink, letterSpacing: -0.3 }}>{SKILL_FILE}</div>
      </div>
    </div>
  );
};
