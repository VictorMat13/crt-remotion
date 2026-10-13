import React from "react";
import { Img, staticFile } from "remotion";
import { LOGOS, PH, RESOLVE } from "../theme";
import { UI_FONT, type QLayout } from "./layout";
import { CoralTrace } from "./Chips";
import {
  ATTR,
  ATTR_TYPE,
  DATE,
  DATELINE,
  DRAG_C,
  LOGO,
  PANEL,
  panelBottomAt,
  QUOTE,
  RULE_Y,
  TYPE,
  attrTypedAt,
  selectionAt,
  typedAt,
} from "./plan";

// ===========================================================================
// Blackmagic Design's press release (Sept 8, 2026) as a dark panel in the FG
// world: the official logo (site header SVG, light wordmark made for a dark
// header), the real dateline, Grant Petty's quote EXACT (RESOLVE.quote,
// typographic quotes round it as printed) and his name (RESOLVE.quoteBy).
// The quote types out at phone size; selections are drawn the way a text
// field draws them (a tint behind the glyphs), in Claude coral or the
// person's green.
// ===========================================================================

const INK = PH.ink;
const DATE_INK = "#BFC3CB"; // lifted grey: survives the CRT grade at 36px
const ATTR_INK = "#D3D5DB";
const EDGE = "rgba(233,231,226,0.42)";
const CORAL_SEL = `rgba(${PH.claudeRgb},0.44)`;
const GREEN_SEL = `rgba(${PH.userRgb},0.36)`;

const Caret: React.FC<{ on: boolean; h: number }> = ({ on, h }) => (
  <span style={{ position: "relative", display: "inline-block", width: 0 }}>
    <span style={{ position: "absolute", left: 1, top: -h * 0.86, width: 3.5, height: h * 1.06, background: INK, opacity: on ? 0.95 : 0 }} />
  </span>
);

type Range = [number, number] | null;
const inR = (r: Range, i: number) => !!r && i >= r[0] && i < r[1];

/** one quote line: typed chars visible, the rest laid out but hidden; selections tint behind the glyphs */
const QuoteLine: React.FC<{ text: string; start: number; typed: number; coral: Range; green: Range; caretAt: number | null; caretOn: boolean }> = ({
  text,
  start,
  typed,
  coral,
  green,
  caretAt,
  caretOn,
}) => {
  const cuts = new Set<number>([0, text.length]);
  const add = (i: number) => {
    const k = i - start;
    if (k > 0 && k < text.length) cuts.add(k);
  };
  add(typed);
  if (coral) {
    add(coral[0]);
    add(coral[1]);
  }
  if (green) {
    add(green[0]);
    add(green[1]);
  }
  if (caretAt !== null) add(caretAt);
  const ks = [...cuts].sort((a, b) => a - b);
  const out: React.ReactNode[] = [];
  for (let j = 0; j < ks.length - 1; j++) {
    const a = ks[j];
    const b = ks[j + 1];
    const gi = start + a;
    if (caretAt !== null && caretAt === gi) out.push(<Caret key={`c${a}`} on={caretOn} h={QUOTE.font} />);
    const sel = inR(coral, gi) ? CORAL_SEL : inR(green, gi) ? GREEN_SEL : undefined;
    out.push(
      <span
        key={a}
        style={{
          visibility: gi < typed ? "visible" : "hidden",
          background: sel,
          // the tint covers the full line height, like a text field's selection
          padding: sel ? "5px 0" : undefined,
          borderRadius: sel ? 3 : undefined,
        }}
      >
        {text.slice(a, b)}
      </span>,
    );
  }
  if (caretAt !== null && caretAt === start + text.length) out.push(<Caret key="cend" on={caretOn} h={QUOTE.font} />);
  return <>{out}</>;
};

export const Release: React.FC<{ frame: number; lay: QLayout }> = ({ frame: f, lay }) => {
  const typed = typedAt(f);
  const typingQuote = f < TYPE[1] + 1;
  const attrN = attrTypedAt(f);
  const { coral, green } = selectionAt(lay, f);
  // the caret rides the typing, then waits at the end of the name until the arrow takes over
  const blink = Math.floor(f / 8) % 2 === 0;
  const caretVisible = f < DRAG_C[0];
  // which line holds the caret while the quote types
  const caretLine = typingQuote ? lay.lines.findIndex((l, i) => typed <= l.end || i === lay.lines.length - 1) : -1;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, fontFamily: UI_FONT }}>
      {/* the release */}
      <div
        style={{
          position: "absolute",
          left: PANEL.left,
          top: PANEL.top,
          width: PANEL.w,
          height: panelBottomAt(lay, f) - PANEL.top,
          boxSizing: "border-box",
          borderRadius: PANEL.r,
          background: PH.panel,
          border: `2px solid ${EDGE}`,
          boxShadow: "0 30px 90px rgba(0,0,0,0.78)",
        }}
      />
      {/* the coral trace runs on the release's surface: the words sit on top of it */}
      <CoralTrace frame={f} lay={lay} />
      <Img src={staticFile(LOGOS.blackmagic)} style={{ position: "absolute", left: LOGO.left, top: LOGO.top, width: LOGO.w, height: LOGO.h }} />
      <div style={{ position: "absolute", left: QUOTE.left, top: RULE_Y, width: QUOTE.w, height: 2, background: "rgba(233,231,226,0.22)" }} />
      {DATELINE.map((t, i) => (
        <div
          key={t}
          style={{
            position: "absolute",
            left: QUOTE.left,
            top: DATE.top + i * DATE.line,
            height: DATE.line,
            lineHeight: `${DATE.line}px`,
            fontSize: DATE.font,
            fontWeight: 500,
            color: DATE_INK,
            whiteSpace: "pre",
          }}
        >
          {t}
        </div>
      ))}

      {/* the quote, line by line at the measured breaks */}
      {lay.lines.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: QUOTE.left,
            top: QUOTE.top + i * QUOTE.line,
            height: QUOTE.line,
            lineHeight: `${QUOTE.line}px`,
            fontSize: QUOTE.font,
            fontWeight: QUOTE.weight,
            color: INK,
            whiteSpace: "pre",
            letterSpacing: 0,
          }}
        >
          <QuoteLine
            text={l.text}
            start={l.start}
            typed={typed}
            coral={coral}
            green={green}
            caretAt={i === caretLine ? Math.max(l.start, Math.min(l.end, typed)) : null}
            caretOn
          />
        </div>
      ))}

      {/* Grant Petty, Blackmagic Design CEO */}
      <div
        style={{
          position: "absolute",
          left: QUOTE.left,
          top: ATTR.top,
          height: ATTR.line,
          lineHeight: `${ATTR.line}px`,
          fontSize: ATTR.font,
          fontWeight: 500,
          color: ATTR_INK,
          whiteSpace: "pre",
        }}
      >
        <span>{RESOLVE.quoteBy.slice(0, attrN)}</span>
        {f >= ATTR_TYPE[0] && caretVisible ? <Caret on={f < ATTR_TYPE[1] + 2 || blink} h={ATTR.font} /> : null}
        <span style={{ visibility: "hidden" }}>{RESOLVE.quoteBy.slice(attrN)}</span>
      </div>
    </div>
  );
};
