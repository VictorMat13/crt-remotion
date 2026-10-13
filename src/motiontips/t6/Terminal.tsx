import React from "react";
import { interpolate } from "remotion";
import { MONO, UI } from "../t2/ui";
import { ADV, BODY, COLS, ENTER, ENTER1, ENTER2, P2, T_P2, TERM, VIEW_H, clamp, input0, inputB, sinceKey } from "./plan";

// ===========================================================================
// Victor's Claude Code session (Ghostty, dark), the T2 look at 38px, one size
// like a real terminal. Fresh session: the zsh line, the compact header, the
// input box. He types "Make me a well-edited video", deletes it word by word,
// types "track this object as it moves" and sends it: it stays in place as the
// sent message, the spinner status line and a new input box open under it.
// While Claude works he types "cut out the awkward pauses in this segment"
// (queued) and sends it: it becomes the next sent message, the status line
// moves under it, and a fresh input box opens. Taller than the window, the
// scrollback scrolls, smoothly.
// ===========================================================================

const L = TERM.line;
const PCOLS = COLS - 2; // "> " prefix
const HEADER_TEXT = ["Claude Code v2.1.296", "Opus 5.5", "~/Work files/promptible/", "remotion-liam"];
const MASCOT = [" ▐▛███▜▌", "▝▜█████▛▘", "  ▘▘ ▝▝"];
const Q: Record<string, number> = { " ": 0, "▐": 10, "▌": 5, "▛": 7, "▜": 11, "█": 15, "▝": 2, "▘": 1 };
const Mascot: React.FC<{ y: number }> = ({ y }) => {
  const w = ADV / 2;
  const h = L / 2;
  const rects: React.ReactNode[] = [];
  MASCOT.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      const q = Q[ch] ?? 0;
      [1, 2, 4, 8].forEach((bit, k) => {
        if (!(q & bit)) return;
        rects.push(<rect key={`${r}-${c}-${k}`} x={c * ADV + (k % 2) * w} y={r * L + Math.floor(k / 2) * h} width={w + 0.6} height={h + 0.6} fill={UI.coral} />);
      });
    }),
  );
  return (
    <svg width={9 * ADV} height={3 * L} style={{ position: "absolute", left: 0, top: y + 4, overflow: "visible" }}>
      {rects}
    </svg>
  );
};
const SPIN = ["·", "✢", "✶", "✻", "✽", "✻", "✶", "✢"];

/** greedy word wrap at `cols` monospace columns */
const wrap = (text: string, cols: number): string[] => {
  if (!text) return [""];
  const out: string[] = [];
  let cur = "";
  for (const w of text.split(" ")) {
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= cols) cur += " " + w;
    else {
      out.push(cur);
      cur = w;
    }
  }
  out.push(cur);
  return out;
};

// frame each row of the second prompt first appears
const ROW_AT_B = (() => {
  const at: number[] = [];
  for (let n = 1; n <= P2.length; n++) {
    const rows = wrap(P2.slice(0, n).trimEnd(), PCOLS).length;
    while (at.length < rows) at.push(T_P2[n - 1]);
  }
  return at;
})();

const open = (f: number, at: number, len = 7) => interpolate(f, [at, at + len], [0, 1], { ...clamp, easing: ENTER });

const Caret: React.FC<{ on: boolean }> = ({ on }) => (
  <span style={{ display: "inline-block", width: Math.round(ADV) - 2, marginLeft: 3, height: L - 12, verticalAlign: -9, background: UI.ink, opacity: on ? 0.92 : 0 }} />
);

const Row: React.FC<{ y: number; opacity?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ y, opacity = 1, children, style }) =>
  opacity <= 0.001 ? null : (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, height: L, lineHeight: `${L}px`, whiteSpace: "pre", opacity, ...style }}>{children}</div>
  );

/** an input box that becomes a sent message on Enter (its rules go, the grey message ground comes up) */
const PromptBox: React.FC<{ y: number; rows: string[]; rowsSmooth: number; kOpen: number; kSent: number; caret: boolean; caretOn: boolean; rowOpen?: (i: number) => number }> = ({
  y,
  rows,
  rowsSmooth,
  kOpen,
  kSent,
  caret,
  caretOn,
  rowOpen,
}) => {
  const h = 24 + rowsSmooth * L;
  const ruleO = kOpen * (1 - kSent);
  const rule = (yy: number) => (ruleO <= 0.001 ? null : <div style={{ position: "absolute", left: 0, right: 0, top: yy, height: 2, background: UI.hair, opacity: ruleO }} />);
  return (
    <>
      {rule(y)}
      {kSent > 0.001 ? <div style={{ position: "absolute", left: -14, right: 22, top: y + 6, height: h - 12, borderRadius: 8, background: UI.userBg, opacity: kSent }} /> : null}
      {rows.map((r, i) => (
        <Row key={i} y={y + 12 + i * L} opacity={kOpen * (rowOpen ? rowOpen(i) : 1)}>
          <span style={{ color: kSent > 0.5 ? UI.muted : UI.ink }}>{i === 0 ? "> " : "  "}</span>
          <span>{r}</span>
          {caret && i === rows.length - 1 ? <Caret on={caretOn} /> : null}
        </Row>
      ))}
      {rule(y + h - 2)}
    </>
  );
};

export const Terminal: React.FC<{ frame: number }> = ({ frame: f }) => {
  const blinkOn = Math.floor(f / 9) % 2 === 0;
  const typingOn = sinceKey(f) < 6 || blinkOn;

  // ------------------------------------------------ layout (body-local y)
  let y = 0;
  const SHELL_Y = y;
  y += L + 14;
  const HEADER_Y = y;
  y += 4 * L + 24;
  // box A: the bad prompt, deleted, then "track this object as it moves"
  const A_Y = y;
  const textA = input0(f);
  const kSentA = open(f, ENTER1, 8);
  y += 24 + L;
  y += 20 * kSentA;
  // status line under A (until the second prompt is sent, then it moves under B)
  const kStA = open(f, ENTER1 + 2, 8) * (1 - open(f, ENTER2, 8));
  const STA_Y = y + 18 * kStA;
  y += (18 + L) * kStA;
  // box B: "cut out the awkward pauses in this segment", typed while Claude works
  const kOpenB = open(f, ENTER1 + 3, 8);
  y += 12 * kOpenB;
  const B_Y = y;
  const textB = inputB(f);
  const rowsB = wrap(textB, PCOLS);
  const rowsSmoothB = 1 + ROW_AT_B.slice(1).reduce((a, t) => a + open(f, t, 5), 0);
  const kSentB = open(f, ENTER2, 8);
  y += (24 + rowsSmoothB * L) * kOpenB;
  y += 20 * kSentB;
  const kStB = open(f, ENTER2 + 2, 8);
  const STB_Y = y + 18 * kStB;
  y += (18 + L) * kStB;
  // box C: the fresh input box
  const kOpenC = open(f, ENTER2 + 3, 8);
  y += 12 * kOpenC;
  const C_Y = y;
  y += 76 * kOpenC;
  y += 6;
  const FOOT_Y = y;
  y += L;
  const scroll = Math.max(0, y - VIEW_H);

  // ------------------------------------------------ live status values
  const spin = SPIN[Math.floor(Math.max(0, f - ENTER1) / 3) % SPIN.length];
  const secs = Math.max(1, Math.floor((f - ENTER1) / 30) + 1);
  const tok = 0.3 + 0.011 * Math.max(0, f - ENTER1);
  const status = (yy: number, o: number) => (
    <Row y={yy} opacity={o}>
      <span style={{ color: UI.coral }}>{`${spin} Percolating… `}</span>
      <span style={{ color: UI.muted }}>{`(${secs}s · ↓ ${tok.toFixed(1)}k tokens)`}</span>
    </Row>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: TERM.left,
        top: TERM.top,
        width: TERM.right - TERM.left,
        height: TERM.bottom - TERM.top,
        boxSizing: "border-box",
        borderRadius: 18,
        background: UI.body,
        border: `2px solid ${UI.edge}`,
        boxShadow: "0 26px 60px rgba(0,0,0,0.7)",
        overflow: "hidden",
        fontFamily: MONO,
        fontSize: TERM.font,
        fontWeight: 500,
        color: UI.ink,
        fontVariantLigatures: "none",
      }}
    >
      {/* title bar: traffic lights + Ghostty tab */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: TERM.tab, background: UI.chrome }} />
      {[UI.red, UI.amber, UI.lime].map((c, i) => (
        <div key={c} style={{ position: "absolute", left: 24 + i * 32, top: TERM.tab / 2 - 10, width: 20, height: 20, borderRadius: "50%", background: c }} />
      ))}
      <div
        style={{
          position: "absolute",
          left: 136,
          top: 9,
          height: TERM.tab - 18,
          padding: "0 22px",
          borderRadius: 999,
          background: UI.tabActive,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 30,
          whiteSpace: "pre",
        }}
      >
        <span style={{ color: UI.coral }}>{"✻"}</span>
        <span style={{ color: UI.ink }}>remotion-liam</span>
        <span style={{ color: UI.faint }}>{"⌘1"}</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: TERM.tab, height: 2, background: UI.hair, opacity: 0.6 }} />

      {/* scrollback */}
      <div
        style={{
          position: "absolute",
          left: TERM.padX,
          right: 0,
          top: BODY.top - TERM.top,
          height: VIEW_H,
          overflow: "hidden",
          // rows scrolling out under the tab bar fade instead of showing as cut glyphs
          WebkitMaskImage: scroll > 0 ? "linear-gradient(to bottom, transparent 0px, black 46px)" : undefined,
          maskImage: scroll > 0 ? "linear-gradient(to bottom, transparent 0px, black 46px)" : undefined,
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: -scroll }}>
          <Row y={SHELL_Y}>
            <span style={{ color: UI.muted }}>{"remotion-liam % "}</span>
            <span>claude</span>
          </Row>
          <Mascot y={HEADER_Y} />
          {HEADER_TEXT.map((t, i) => (
            <Row key={`h${i}`} y={HEADER_Y + i * L} style={{ left: 11 * ADV }}>
              {i === 0 ? (
                <>
                  <span style={{ fontWeight: 700 }}>Claude Code</span>
                  <span style={{ color: UI.muted }}>{t.slice("Claude Code".length)}</span>
                </>
              ) : (
                <span style={{ color: UI.muted }}>{t}</span>
              )}
            </Row>
          ))}

          <PromptBox y={A_Y} rows={[textA]} rowsSmooth={1} kOpen={1} kSent={kSentA} caret={f < ENTER1} caretOn={typingOn} />
          {status(STA_Y, kStA)}
          <PromptBox
            y={B_Y}
            rows={rowsB}
            rowsSmooth={rowsSmoothB}
            kOpen={kOpenB}
            kSent={kSentB}
            caret={f < ENTER2}
            caretOn={typingOn}
            rowOpen={(i) => (i === 0 ? 1 : open(f, ROW_AT_B[i] ?? -99, 5))}
          />
          {status(STB_Y, kStB)}
          <PromptBox y={C_Y} rows={[""]} rowsSmooth={1} kOpen={kOpenC} kSent={0} caret caretOn={blinkOn} />

          <Row y={FOOT_Y}>
            <span style={{ color: UI.crimson }}>{"  ▶▶ bypass permissions on"}</span>
          </Row>
        </div>
      </div>
    </div>
  );
};
