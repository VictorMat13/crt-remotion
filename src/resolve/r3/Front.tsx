import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { CLAUDE_DARK } from "../../artcraft/theme";
import { ArrowUp, Chevron, MacCursor, Mic, Plus } from "../../artcraft/p5/glyphs";
import { LOGOS, PH } from "../theme";
import { CMP, COMP, COMP_CLOSE, ENTER, MARK, PRESS, PROMPT, SEND, TRAVEL, TY, TYPE, WAKE, clamp, cursorAt, typedAt, typingAt } from "./plan";

// ===========================================================================
// The front of the scene, undimmed: the claude.ai composer (dark), floating
// over Resolve's media pool on the scope trace, laid out like the real Claude
// app capture the series matched in AcP5 (public/claude-chat/shots/
// 05-transcript.png: "+", model + chevron, mic, coral send), the Claude mark
// on the line at its right (asleep until the prompt reaches it), and the
// plain arrow that presses send.
// ===========================================================================

const INK = CLAUDE_DARK.text;
const ICON_INK = "rgba(245,244,239,0.86)";

export const Composer: React.FC<{ frame: number; font: string }> = ({ frame: f, font }) => {
  const n = typedAt(f);
  const typed = PROMPT.slice(0, n);
  const rest = PROMPT.slice(n);
  const sent = f >= SEND;
  const caretOn = !sent && (typingAt(f) || Math.floor(f / 8) % 2 === 0);
  const armed = interpolate(f, [TYPE[0], TYPE[0] + 4], [0, 1], clamp);
  const press = interpolate(f, [PRESS, PRESS + 2, PRESS + 6], [0, 1, 0], clamp);
  const close = interpolate(f, COMP_CLOSE, [0, 1], { ...clamp, easing: TRAVEL });
  if (close >= 0.999) return null;
  return (
    <div
      style={{
        position: "absolute",
        opacity: 1 - close,
        transform: `scale(${(1 - 0.04 * close).toFixed(4)})`,
        left: COMP.left,
        top: COMP.top,
        width: COMP.w,
        height: COMP.h,
        boxSizing: "border-box",
        borderRadius: 30,
        background: CLAUDE_DARK.composer,
        border: "2.5px solid rgba(255,255,255,0.5)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        fontFamily: font,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: CMP.padX,
          right: CMP.padX - 6,
          top: CMP.textTop,
          fontSize: CMP.font,
          lineHeight: `${CMP.line}px`,
          fontWeight: 400,
          letterSpacing: -0.2,
          color: INK,
        }}
      >
        <span>{typed}</span>
        <span style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 1,
              top: -2,
              width: 3,
              height: CMP.font + 6,
              background: INK,
              opacity: caretOn ? 0.95 : 0,
            }}
          />
        </span>
        <span style={{ visibility: "hidden" }}>{rest}</span>
      </div>
      <div style={{ position: "absolute", left: CMP.padX - 6, top: CMP.rowCy - 22 }}>
        <Plus size={44} color={ICON_INK} sw={1.9} />
      </div>
      <div
        style={{
          position: "absolute",
          right: CMP.send.right + CMP.send.size + 92,
          top: CMP.rowCy - 22,
          height: 44,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 32,
          fontWeight: 500,
          color: INK,
          whiteSpace: "nowrap",
        }}
      >
        <span>Opus 5</span>
        <Chevron size={30} color={ICON_INK} sw={2.2} style={{ marginTop: 3 }} />
      </div>
      <div style={{ position: "absolute", right: CMP.send.right + CMP.send.size + 24, top: CMP.rowCy - 22 }}>
        <Mic size={44} color={ICON_INK} sw={1.8} />
      </div>
      <div
        style={{
          position: "absolute",
          right: CMP.send.right,
          top: CMP.rowCy - CMP.send.size / 2,
          width: CMP.send.size,
          height: CMP.send.size,
          borderRadius: 16,
          background: CLAUDE_DARK.send,
          display: "grid",
          placeItems: "center",
          opacity: (0.42 + 0.58 * armed) * (sent ? 0.55 : 1),
          transform: `scale(${(1 - 0.06 * press).toFixed(4)})`,
        }}
      >
        <ArrowUp size={38} color="#FFFFFF" sw={2.6} />
      </div>
    </div>
  );
};

/** the Claude mark on the line: grey and asleep, wakes in coral as the prompt arrives, turns while it works */
export const ClaudeMark: React.FC<{ frame: number }> = ({ frame: f }) => {
  const wake = interpolate(f, [WAKE, WAKE + 8], [0, 1], { ...clamp, easing: ENTER });
  const spin = 60 * interpolate(f, [WAKE, 240], [0, 1], { ...clamp, easing: TRAVEL });
  const talk = wake * (0.5 + 0.5 * Math.sin(f * 0.23));
  const s = MARK.size;
  const rip = (f - WAKE) / 26;
  return (
    <>
      {rip >= 0 && rip < 1 ? (
        <div
          style={{
            position: "absolute",
            left: MARK.x - s / 2 - 30 * ENTER(rip),
            top: TY - s / 2 - 30 * ENTER(rip),
            width: s + 60 * ENTER(rip),
            height: s + 60 * ENTER(rip),
            boxSizing: "border-box",
            borderRadius: "50%",
            border: `2.5px solid rgba(${PH.claudeRgb},${(0.6 * (1 - rip)).toFixed(3)})`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: MARK.x - s / 2,
          top: TY - s / 2,
          width: s,
          height: s,
          borderRadius: "50%",
          background: "#000",
          transform: `scale(${(0.9 + 0.1 * wake + 0.025 * talk).toFixed(4)})`,
        }}
      >
        <Img
          src={staticFile(LOGOS.claude)}
          style={{ position: "absolute", inset: s * 0.07, width: s * 0.86, height: s * 0.86, filter: "grayscale(1) brightness(0.92)", opacity: 0.85 * (1 - wake), transform: `rotate(${spin}deg)` }}
        />
        <Img
          src={staticFile(LOGOS.claude)}
          style={{ position: "absolute", inset: s * 0.07, width: s * 0.86, height: s * 0.86, opacity: wake, transform: `rotate(${spin}deg)` }}
        />
      </div>
    </>
  );
};

export const Cursor: React.FC<{ frame: number }> = ({ frame: f }) => {
  const c = cursorAt(f);
  return <MacCursor x={c.x} y={c.y} size={52} press={c.press} opacity={c.opacity} />;
};
