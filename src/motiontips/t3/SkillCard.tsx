import React from "react";
import { PH, SKILL_FILE, SKILL_LINES } from "../theme";
import { CARD, cardBottom } from "./plan";

// ===========================================================================
// The real skill file as a dark editor card: file name + its first real lines
// (raw markdown, editor-tinted: markers muted, bold runs bold). No wrap, the
// panel edge cuts long lines like a real editor. It drops onto the trace into
// the slot the top row opens for it.
// ===========================================================================

const BODY = 34; // world px, ~35px on screen at the end framing
const LINE = 47;

// "# CRT Scope style", "## The look", then the first four rules of "The look"
const SHOWN = [SKILL_LINES[0], SKILL_LINES[1], SKILL_LINES[2], SKILL_LINES[3], SKILL_LINES[4], SKILL_LINES[5]];

type Tok = { t: string; kind: "mark" | "strong" | "head" | "text" };

const tokenize = (line: string): Tok[] => {
  const head = line.match(/^(#+ )(.*)$/);
  if (head) return [{ t: head[1], kind: "mark" }, { t: head[2], kind: "head" }];
  const out: Tok[] = [];
  let rest = line;
  const num = rest.match(/^(\d+\. )/);
  if (num) {
    out.push({ t: num[1], kind: "mark" });
    rest = rest.slice(num[1].length);
  }
  const parts = rest.split("**");
  parts.forEach((p, k) => {
    if (k > 0) out.push({ t: "**", kind: "mark" });
    if (p) out.push({ t: p, kind: k % 2 === 1 ? "strong" : "text" });
  });
  return out;
};

const tokStyle = (k: Tok["kind"]): React.CSSProperties =>
  k === "mark"
    ? { color: PH.muted }
    : k === "head"
      ? { color: PH.ink, fontWeight: 700 }
      : k === "strong"
        ? { color: PH.ink, fontWeight: 700 }
        : { color: PH.ink, opacity: 0.86 };

const DocGlyph: React.FC = () => (
  <svg width={30} height={38} viewBox="0 0 30 38" style={{ display: "block" }}>
    <path d="M3 2.5 H19 L27.5 11 V35.5 H3 Z" fill="none" stroke={PH.ink} strokeWidth={2.6} strokeLinejoin="round" />
    <path d="M19 2.5 V11 H27.5" fill="none" stroke={PH.ink} strokeWidth={2.6} strokeLinejoin="round" />
  </svg>
);

export const SkillCard: React.FC<{ f: number; ui: string; mono: string }> = ({ f, ui, mono }) => {
  const bottom = cardBottom(f);
  if (bottom < -2600) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: -CARD.w / 2,
        top: bottom - CARD.h,
        width: CARD.w,
        height: CARD.h,
        borderRadius: 16,
        overflow: "hidden",
        background: PH.panel,
        border: "3px solid rgba(233,231,226,0.72)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          height: 76,
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
      <div style={{ padding: "16px 24px 0", fontFamily: mono, fontSize: BODY, lineHeight: `${LINE}px`, whiteSpace: "pre" }}>
        {SHOWN.map((line, k) => (
          <div key={k} style={{ height: LINE, marginBottom: k === 0 ? 8 : 0 }}>
            {tokenize(line).map((tk, j) => (
              <span key={j} style={tokStyle(tk.kind)}>
                {tk.t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
