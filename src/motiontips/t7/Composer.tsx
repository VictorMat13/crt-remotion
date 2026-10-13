import React from "react";
import { CLAUDE_DARK } from "../../artcraft/theme";
import { ArrowUp, Chevron, Mic, Plus } from "../../artcraft/p5/glyphs";
import { COMP, COMP_H, COMP_W, CTRL_CY, PROMPT, PROMPT_BOX } from "./plan";

// ===========================================================================
// The claude.ai composer (dark), laid out like the real Claude app captures
// (public/claude-chat/shots/02-attached.png + 05-transcript.png): rounded
// box, the attachment row at the top (cards drawn by Attachment.tsx), the
// prompt in the app's sans, then "+", the Chat | Cowork switch, the model
// ("Opus 5" + chevron), the mic and the coral send button. Same surface and
// lifted border as the ArtCraft P5 composer so it survives the tube's grade.
// ===========================================================================

const INK = CLAUDE_DARK.text;
const ICON_INK = "rgba(245,244,239,0.86)";
const MUTED = "#ABA89F"; // CLAUDE_DARK.muted lifted one step for the tube

export const Composer: React.FC<{ frame: number; font: string }> = ({ frame: f, font }) => {
  const caretOn = Math.floor(f / 9) % 2 === 0;
  const cy = CTRL_CY - COMP.top; // control row centre, composer-local
  return (
    <div
      style={{
        position: "absolute",
        left: COMP.left,
        top: COMP.top,
        width: COMP_W,
        height: COMP_H,
        boxSizing: "border-box",
        borderRadius: COMP.r,
        // the app's page tone, not its lighter composer grey: a big lifted panel reads as an
        // empty grey slab in the tube; this one crushes to black and the border draws it
        background: CLAUDE_DARK.bg,
        border: "2.5px solid rgba(255,255,255,0.5)",
        fontFamily: font,
      }}
    >
      {/* the prompt (already typed), caret blinking at its end */}
      <div
        style={{
          position: "absolute",
          left: COMP.pad + 2,
          top: PROMPT_BOX.top - COMP.top,
          fontSize: PROMPT_BOX.font,
          lineHeight: `${PROMPT_BOX.line}px`,
          letterSpacing: -0.2,
          color: INK,
          whiteSpace: "nowrap",
        }}
      >
        {PROMPT}
        <span style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 3, top: 2, width: 3, height: PROMPT_BOX.font + 6, background: INK, opacity: caretOn ? 0.95 : 0 }} />
        </span>
      </div>

      {/* control row, left: "+" and the Chat | Cowork switch */}
      <div style={{ position: "absolute", left: COMP.pad - 6, top: cy - 22 }}>
        <Plus size={44} color={ICON_INK} sw={1.9} />
      </div>
      <div
        style={{
          position: "absolute",
          left: COMP.pad + 58,
          top: cy - 29,
          height: 58,
          display: "flex",
          alignItems: "stretch",
          borderRadius: 14,
          background: "rgba(255,255,255,0.06)",
          fontSize: 32,
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.32)",
            color: INK,
          }}
        >
          Chat
        </div>
        <div style={{ display: "flex", alignItems: "center", padding: "0 20px", color: MUTED }}>Cowork</div>
      </div>

      {/* control row, right: model, mic, send */}
      <div
        style={{
          position: "absolute",
          right: 24 + 66 + 92,
          top: cy - 22,
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
      <div style={{ position: "absolute", right: 24 + 66 + 24, top: cy - 22 }}>
        <Mic size={44} color={ICON_INK} sw={1.8} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 24,
          top: cy - 33,
          width: 66,
          height: 66,
          borderRadius: 16,
          background: CLAUDE_DARK.send,
          display: "grid",
          placeItems: "center",
        }}
      >
        <ArrowUp size={38} color="#FFFFFF" sw={2.6} />
      </div>
    </div>
  );
};
