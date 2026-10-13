import React from "react";
import { interpolate } from "remotion";
import { CLAUDE_DARK } from "../theme";
import { ArrowUp, Chevron, Mic, Plus } from "./glyphs";
import { CMP, COMP, PRESS, PROMPT, SEND, TYPE, clamp, typedAt, typingAt } from "./plan";

// ===========================================================================
// The claude.ai composer (dark), laid out like the real Claude app capture
// (public/claude-chat/shots/05-transcript.png): rounded box, the prompt in the
// app's sans, "+" bottom left, the model ("Opus 5" + chevron), the mic and the
// coral send button bottom right. Placeholder "How can I help you today?"
// until the first key. The send button arms once there is text. Colours are
// CLAUDE_DARK, lifted only where the CRT grade would erase them (the border,
// the placeholder grey). World px, composer-local layout.
// ===========================================================================

const INK = CLAUDE_DARK.text;
const ICON_INK = "rgba(245,244,239,0.86)";
const PLACEHOLDER = "#ABA89F"; // CLAUDE_DARK.muted lifted one step so it survives the tube

export const Composer: React.FC<{ frame: number; font: string }> = ({ frame: f, font }) => {
  const n = typedAt(f);
  const typed = PROMPT.slice(0, n);
  const rest = PROMPT.slice(n);
  const sent = f >= SEND;
  // caret: solid while keys go down, blinking when idle, gone once sent
  const caretOn = !sent && (typingAt(f) || Math.floor(f / 8) % 2 === 0);
  const armed = interpolate(f, [TYPE[0], TYPE[0] + 4], [0, 1], clamp);
  const press = interpolate(f, [PRESS, PRESS + 2, PRESS + 6], [0, 1, 0], clamp);

  const caret = (
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
  );

  return (
    <div
      style={{
        position: "absolute",
        left: COMP.left,
        top: COMP.top,
        width: COMP.w,
        height: COMP.h,
        boxSizing: "border-box",
        borderRadius: 30,
        background: CLAUDE_DARK.composer,
        border: "2.5px solid rgba(255,255,255,0.5)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        fontFamily: font,
        zIndex: 10,
      }}
    >
      {/* the prompt (the untyped rest is laid out invisibly so lines never reflow while typing) */}
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
        {n === 0 ? (
          <>
            {caret}
            <span style={{ color: PLACEHOLDER }}>How can I help you today?</span>
          </>
        ) : (
          <>
            <span>{typed}</span>
            {caret}
            <span style={{ visibility: "hidden" }}>{rest}</span>
          </>
        )}
      </div>

      {/* bottom row */}
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
          opacity: 0.42 + 0.58 * armed,
          transform: `scale(${(1 - 0.06 * press).toFixed(4)})`,
          filter: press > 0.01 ? `brightness(${(1 - 0.18 * press).toFixed(3)})` : undefined,
        }}
      >
        <ArrowUp size={38} color="#FFFFFF" sw={2.6} />
      </div>
    </div>
  );
};
