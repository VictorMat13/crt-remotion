import React from "react";
import { interpolate } from "remotion";
import { PROMPT, wrap } from "../t2/plan";
import { MONO, UI } from "../t2/ui";
import { ENTER, ENTER_KEY, TERM } from "./rig";

// ===========================================================================
// Victor's Claude Code session for the hook: T2's terminal (Ghostty, dark,
// same tokens and grammar: traffic lights + tab, the coral mascot header, the
// "> " input box between rules, the crimson "bypass permissions" footer, the
// coral spinner status line), laid out compact so it fits the lower half of
// the hook's frame at reading size (38px). His real prompt arrives word by
// word (dictated, three spoken chunks). Enter sends it: it stays as the sent
// message, the spinner line and a fresh input box open under it. The content
// is bottom-anchored like a real terminal: once it is taller than the window
// it scrolls up, smoothly.
// Drawn in its own px (TERM.w x TERM.h); Planes.tsx stands it in the world.
// ===========================================================================

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const FONT = 38;
const L = 52;
const ADV = 0.6 * FONT; // JetBrains Mono advance (22.8)
const TAB = 58;
const PAD_X = 30;
// Rows start at 12 (mod L) and the content ends at 10 (mod L) at rest, so VIEW_H = 6L + 50 makes the
// scroll land exactly on a row's top edge: no sliver of a scrolled-off row at the top of the window
const VIEW_H = 6 * L + 50;
const BODY_TOP = TERM.h - VIEW_H - 2;
const PROMPT_COLS = Math.floor((TERM.w - 2 * PAD_X - 20) / ADV) - 2; // "> " prefix

const WORDS = PROMPT.split(" ");
/** dictation: [first word frame, last word frame, word count] (pauses at the full stops) */
const CHUNKS: [number, number, number][] = [
  [-4, 13, 6], // make it the CRT scope style.
  [18, 33, 8], // Just make sure that it's very visually stimulating
  [37, 45, 7], // and that there's always something going on.
];
export const WORD_AT: number[] = CHUNKS.flatMap(([a, b, n]) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1)));
const wordsAt = (f: number) => WORD_AT.filter((t) => f >= t).length;
const FULL_ROWS = wrap(PROMPT, PROMPT_COLS);
const ROW_AT = (() => {
  const at: number[] = [];
  for (let n = 1; n <= WORDS.length; n++) {
    const rows = wrap(WORDS.slice(0, n).join(" "), PROMPT_COLS).length;
    while (at.length < rows) at.push(WORD_AT[n - 1]);
  }
  return at;
})();

const HEADER = ["Claude Code v2.1.296", "Opus 5.5", "~/Work files/promptible/", "remotion-liam"];
// Claude Code's mascot, its block characters drawn the way the terminal fills their cells.
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
const SPIN = ["·", "✢", "✶", "✻", "✽", "✻", "✶", "✢"]; // Claude Code's spinner

const open = (f: number, at: number, len = 7) => interpolate(f, [at, at + len], [0, 1], { ...clamp, easing: ENTER });

const Caret: React.FC<{ on: boolean }> = ({ on }) => (
  <span style={{ display: "inline-block", width: Math.round(ADV), height: L - 12, verticalAlign: -9, background: UI.ink, opacity: on ? 0.92 : 0 }} />
);

const Row: React.FC<{ y: number; opacity?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ y, opacity = 1, children, style }) =>
  opacity <= 0.001 ? null : (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, height: L, lineHeight: `${L}px`, whiteSpace: "pre", opacity, ...style }}>{children}</div>
  );

export const HookTerminal: React.FC<{ frame: number }> = ({ frame: f }) => {
  const sent = f >= ENTER_KEY;
  const typedRows = sent ? FULL_ROWS : wrap(WORDS.slice(0, wordsAt(f)).join(" "), PROMPT_COLS);
  const rowsSmooth = 1 + ROW_AT.slice(1).reduce((a, t) => a + open(f, t, 5), 0);
  const typing = !sent && WORD_AT.some((t) => f >= t - 1 && f < t + 6);
  const blinkOn = Math.floor(f / 9) % 2 === 0;

  // ------------------------------------------------ layout (body-local y)
  let y = 0;
  const SHELL_Y = y;
  y += L + 12;
  const HEADER_Y = y;
  y += HEADER.length * L + 22;
  const PROMPT_Y = y;
  const promptH = 24 + rowsSmooth * L;
  y += promptH;
  const kSent = open(f, ENTER_KEY, 8);
  y += 16 * kSent;
  const kStatus = open(f, ENTER_KEY + 2, 8);
  const STATUS_Y = y;
  y += L * kStatus;
  const kInput = open(f, ENTER_KEY + 3, 8);
  y += 10 * kInput;
  const INPUT_Y = y;
  y += 76 * kInput;
  y += 4;
  const FOOT_Y = y;
  y += L;
  const scroll = Math.max(0, y - VIEW_H);

  const spin = SPIN[Math.floor(Math.max(0, f - ENTER_KEY) / 3) % SPIN.length];
  const secs = Math.max(1, Math.floor((f - ENTER_KEY) / 30) + 1);
  const tok = 0.2 + 0.03 * Math.max(0, f - ENTER_KEY);

  const ruleOut = 1 - kSent;
  const rule = (yy: number, o: number) =>
    o <= 0.001 ? null : <div style={{ position: "absolute", left: 0, right: 0, top: yy, height: 2, background: UI.hair, opacity: o }} />;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxSizing: "border-box",
        borderRadius: 18,
        background: UI.body,
        border: `2px solid ${UI.edge}`,
        overflow: "hidden",
        fontFamily: MONO,
        fontSize: FONT,
        fontWeight: 500,
        color: UI.ink,
        fontVariantLigatures: "none",
      }}
    >
      {/* title bar: traffic lights + Ghostty tab */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: TAB, background: UI.chrome }} />
      {[UI.red, UI.amber, UI.lime].map((c, i) => (
        <div key={c} style={{ position: "absolute", left: 24 + i * 32, top: TAB / 2 - 10, width: 20, height: 20, borderRadius: "50%", background: c }} />
      ))}
      <div
        style={{
          position: "absolute",
          left: 136,
          top: 8,
          height: TAB - 16,
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
      <div style={{ position: "absolute", left: 0, right: 0, top: TAB, height: 2, background: UI.hair, opacity: 0.6 }} />

      {/* scrollback (bottom-anchored once it overflows) */}
      <div style={{ position: "absolute", left: PAD_X, right: 0, top: BODY_TOP, height: VIEW_H, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: -scroll }}>
          <Row y={SHELL_Y}>
            <span style={{ color: UI.muted }}>{"remotion-liam % "}</span>
            <span>claude</span>
          </Row>
          <Mascot y={HEADER_Y} />
          {HEADER.map((t, i) => (
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

          {/* the prompt: input box while dictating, the sent message after Enter */}
          {rule(PROMPT_Y, ruleOut)}
          <div style={{ position: "absolute", left: -14, right: 22, top: PROMPT_Y + 6, height: promptH - 12, borderRadius: 8, background: UI.userBg, opacity: kSent }} />
          {typedRows.map((r, i) => (
            <Row key={`p${i}`} y={PROMPT_Y + 12 + i * L} opacity={i === 0 ? 1 : open(f, ROW_AT[i] ?? -99, 5)}>
              <span style={{ color: sent ? UI.muted : UI.ink }}>{i === 0 ? "> " : "  "}</span>
              <span>{r}</span>
              {!sent && i === typedRows.length - 1 ? <Caret on={typing || blinkOn} /> : null}
            </Row>
          ))}
          {rule(PROMPT_Y + promptH - 2, ruleOut)}

          {/* spinner status line */}
          <Row y={STATUS_Y} opacity={kStatus}>
            <span style={{ color: UI.coral }}>{`${spin} Percolating… `}</span>
            <span style={{ color: UI.muted }}>{`(${secs}s · ↓ ${tok.toFixed(1)}k tokens)`}</span>
          </Row>

          {/* the new input box */}
          {rule(INPUT_Y, kInput)}
          <Row y={INPUT_Y + 13} opacity={kInput}>
            <span style={{ color: UI.ink }}>{"> "}</span>
            <Caret on={blinkOn} />
          </Row>
          {rule(INPUT_Y + 74, kInput)}

          {/* footer */}
          <Row y={FOOT_Y}>
            <span style={{ color: UI.crimson }}>{"  ▶▶ bypass permissions on"}</span>
          </Row>
        </div>
      </div>
    </div>
  );
};
