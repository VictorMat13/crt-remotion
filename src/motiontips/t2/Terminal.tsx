import React from "react";
import { interpolate } from "remotion";
import { SCOPE_FILE, SCOPE_LINES } from "./scopeSource";
import {
  ADV,
  BASH_AT,
  BODY,
  CODE,
  COLS,
  ENTER,
  ENTER_KEY,
  PROMPT,
  RENDER_CMD,
  RUNNING_AT,
  STREAM,
  TERM,
  VIEW_H,
  WORDS,
  WORD_AT,
  WRITE_AT,
  burst,
  clamp,
  wordsAt,
  wrap,
} from "./plan";
import { MONO, SYN, UI, tokenize } from "./ui";

// ===========================================================================
// Victor's Claude Code session (Ghostty, dark), drawn at reading size (36px,
// one size like a real terminal; the streamed code preview is the only smaller
// text and it is texture). Fresh session: the compact Claude Code header, then
// the input box where his prompt arrives word by word (dictated). Enter: the
// prompt stays put as the sent message, the spinner status line and a new
// input box open under it, then Claude writes src/artcraft/kit/Scope.tsx (the
// real file streams into the Write preview, far too fast to read, dimmed) and
// runs the real render. The content is inline like the real UI: once it is
// taller than the window it scrolls, smoothly.
// ===========================================================================

const L = TERM.line;
const PROMPT_COLS = COLS - 2; // "> " prefix
const FULL_ROWS = wrap(PROMPT, PROMPT_COLS);
const HEADER_TEXT = ["Claude Code v2.1.296", "Opus 5.5", "~/Work files/promptible/", "remotion-liam"];
// Claude Code's mascot. Its block characters drawn the way the terminal fills
// their cells (the web font has no block glyphs). Quadrant bits: 1 UL, 2 UR, 4 LL, 8 LR.
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
const SPIN = ["·", "✢", "✶", "✻", "✽", "✻", "✶", "✢"]; // Claude Code's spinner (no emoji-capable glyphs)
const BASH_ROWS = wrap(`● Bash(${RENDER_CMD})`, COLS).map((r, i) => (i === 0 ? r : `  ${r}`));

// frame each prompt row first appears while dictating
const ROW_AT = (() => {
  const at: number[] = [];
  for (let n = 1; n <= WORDS.length; n++) {
    const rows = wrap(WORDS.slice(0, n).join(" "), PROMPT_COLS).length;
    while (at.length < rows) at.push(WORD_AT[n - 1]);
  }
  return at;
})();

// bursty write rate -> rows written by frame f (continuous)
const STREAM_TABLE = (() => {
  const n = (STREAM[1] - STREAM[0]) * 4;
  const acc = [0];
  for (let i = 1; i <= n; i++) acc.push(acc[i - 1] + 0.35 + burst(STREAM[0] + i / 4));
  return acc.map((a) => (SCOPE_LINES.length * a) / acc[n]);
})();
const rowsAt = (f: number) => {
  if (f <= STREAM[0]) return 0;
  if (f >= STREAM[1]) return SCOPE_LINES.length;
  const x = (f - STREAM[0]) * 4;
  const i = Math.floor(x);
  return STREAM_TABLE[i] + (STREAM_TABLE[Math.min(i + 1, STREAM_TABLE.length - 1)] - STREAM_TABLE[i]) * (x - i);
};

const open = (f: number, at: number, len = 7) => interpolate(f, [at, at + len], [0, 1], { ...clamp, easing: ENTER });

const Caret: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    style={{
      display: "inline-block",
      width: Math.round(ADV),
      height: L - 12,
      verticalAlign: -9,
      background: UI.ink,
      opacity: on ? 0.92 : 0,
    }}
  />
);

const Row: React.FC<{ y: number; h?: number; opacity?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ y, h = L, opacity = 1, children, style }) =>
  opacity <= 0.001 ? null : (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, height: h, lineHeight: `${h}px`, whiteSpace: "pre", opacity, ...style }}>{children}</div>
  );

export const Terminal: React.FC<{ frame: number }> = ({ frame: f }) => {
  const sent = f >= ENTER_KEY;
  const nWords = wordsAt(f);
  const typedRows = sent ? FULL_ROWS : wrap(WORDS.slice(0, nWords).join(" "), PROMPT_COLS);
  const rowsSmooth = 1 + ROW_AT.slice(1).reduce((a, t) => a + open(f, t, 5), 0);
  const typing = !sent && WORD_AT.some((t) => f >= t - 1 && f < t + 6);
  const blinkOn = Math.floor(f / 9) % 2 === 0;

  // ------------------------------------------------ layout (body-local y)
  let y = 0;
  const SHELL_Y = y; // the zsh line Claude Code was launched from (it renders inline under it)
  y += L + 16;
  const HEADER_Y = y;
  y += 4 * L + 26;
  const PROMPT_Y = y;
  const promptH = 24 + rowsSmooth * L;
  y += promptH;
  const kSent = open(f, ENTER_KEY, 8);
  y += 22 * kSent;
  const kWrite = open(f, WRITE_AT, 6);
  const WRITE_Y = y;
  y += L * kWrite;
  const nRows = rowsAt(f);
  const CODE_Y = y;
  y += nRows * CODE.line + (nRows > 0 ? 10 * Math.min(1, nRows) : 0);
  const kBash = open(f, BASH_AT, 6);
  const BASH_Y = y;
  y += BASH_ROWS.length * L * kBash;
  const kRun = open(f, RUNNING_AT, 6);
  const RUN_Y = y;
  y += L * kRun;
  const kStatus = open(f, ENTER_KEY + 2, 8);
  y += 18 * kStatus;
  const STATUS_Y = y;
  y += L * kStatus;
  const kInput = open(f, ENTER_KEY + 3, 8);
  y += 12 * kInput;
  const INPUT_Y = y;
  y += 76 * kInput;
  y += 6;
  const FOOT_Y = y;
  y += L;
  const scroll = Math.max(0, y - VIEW_H);

  // ------------------------------------------------ live status values
  const spin = SPIN[Math.floor(Math.max(0, f - ENTER_KEY) / 3) % SPIN.length];
  const secs = Math.max(1, Math.floor((f - ENTER_KEY) / 30) + 1);
  const tok = 0.2 + 0.9 * (nRows / SCOPE_LINES.length) + 0.1 * interpolate(f, [BASH_AT, BASH_AT + 40], [0, 1], clamp);
  const writeDone = f >= STREAM[1];
  const nFull = Math.floor(nRows + 1e-6);
  const frac = nRows - nFull;

  const ruleOut = 1 - kSent; // the prompt box's rules go when the prompt is sent
  const rule = (yy: number, o: number) =>
    o <= 0.001 ? null : <div style={{ position: "absolute", left: 0, right: 0, top: yy, height: 2, background: UI.hair, opacity: o }} />;

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
      <div style={{ position: "absolute", left: TERM.padX, right: 0, top: BODY.top - TERM.top, height: VIEW_H, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: -scroll }}>
          <Row y={SHELL_Y}>
            <span style={{ color: UI.muted }}>{"remotion-liam % "}</span>
            <span>claude</span>
          </Row>
          {/* Claude Code's compact header */}
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

          {/* the prompt: input box while dictating, the sent message after Enter */}
          {rule(PROMPT_Y, ruleOut)}
          <div
            style={{
              position: "absolute",
              left: -14,
              right: 22,
              top: PROMPT_Y + 6,
              height: promptH - 12,
              borderRadius: 8,
              background: UI.userBg,
              opacity: kSent,
            }}
          />
          {typedRows.map((r, i) => (
            <Row key={`p${i}`} y={PROMPT_Y + 12 + i * L} opacity={i === 0 ? 1 : open(f, ROW_AT[i] ?? -99, 5)}>
              <span style={{ color: sent ? UI.muted : UI.ink }}>{i === 0 ? "> " : "  "}</span>
              <span>{r}</span>
              {!sent && i === typedRows.length - 1 ? <Caret on={typing || blinkOn} /> : null}
            </Row>
          ))}
          {rule(PROMPT_Y + promptH - 2, ruleOut)}

          {/* Write(src/artcraft/kit/Scope.tsx): the real file streams in */}
          <Row y={WRITE_Y} opacity={kWrite}>
            <span style={{ color: writeDone ? UI.green : UI.ink, opacity: writeDone || Math.floor(f / 6) % 2 === 0 ? 1 : 0.35 }}>{"● "}</span>
            <span style={{ fontWeight: 700 }}>Write</span>
            <span>{`(${SCOPE_FILE})`}</span>
          </Row>
          {nRows > 0
            ? SCOPE_LINES.map((line, i) => {
                if (i > nFull) return null;
                const top = CODE_Y + 4 + i * CODE.line;
                // cull rows that are scrolled out of the window
                if (top - scroll < -CODE.line || top - scroll > VIEW_H) return null;
                const text = i < nFull ? line : line.slice(0, Math.floor(line.length * frac));
                return (
                  <div key={`c${i}`} style={{ position: "absolute", left: 0, right: 0, top, height: CODE.line, whiteSpace: "pre", fontSize: CODE.font, lineHeight: `${CODE.line}px` }}>
                    <span style={{ position: "absolute", left: 40, width: 50, textAlign: "right", color: SYN.gutter, opacity: 0.8 }}>{i + 1}</span>
                    <span style={{ position: "absolute", left: 110, opacity: 0.6, fontWeight: 400 }}>
                      {tokenize(text).map((t, k) => (
                        <span key={k} style={{ color: SYN[t.k] }}>
                          {t.t}
                        </span>
                      ))}
                    </span>
                  </div>
                );
              })
            : null}

          {/* the render */}
          {BASH_ROWS.map((r, i) => (
            <Row key={`b${i}`} y={BASH_Y + i * L} opacity={kBash}>
              {i === 0 ? (
                <>
                  <span style={{ color: UI.ink, opacity: Math.floor(f / 6) % 2 === 0 ? 1 : 0.35 }}>{"● "}</span>
                  <span style={{ fontWeight: 700 }}>Bash</span>
                  <span>{r.slice("● Bash".length)}</span>
                </>
              ) : (
                <span>{r}</span>
              )}
            </Row>
          ))}
          <Row y={RUN_Y} opacity={kRun}>
            <span style={{ color: UI.muted }}>{"  ⎿  Running…"}</span>
          </Row>

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

