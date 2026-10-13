import React from "react";
import { interpolate } from "remotion";
import { CLAUDE_DARK, PH } from "../theme";
import { ArrowUp, Chevron, Mic, Plus } from "./glyphs";
import { COMP, COMP_IN, ENTER, TALK_END, WORDS, WORD_AT, clamp, speech } from "./rig";

// ===========================================================================
// The claude.ai composer (dark), as in P5 (laid out like the real Claude app
// capture): the person dictates, so the mic is live (green) and the request
// transcribes word by word as each word is spoken. "+" bottom left, the model
// ("Opus 5" + chevron), the live mic and the coral send button bottom right.
// Placeholder "How can I help you today?" until the first word. World px.
// ===========================================================================

const INK = CLAUDE_DARK.text;
const ICON_INK = "rgba(245,244,239,0.86)";
const PLACEHOLDER = "#ABA89F"; // CLAUDE_DARK.muted lifted one step so it survives the tube
const PAD_X = 36;
const TEXT_TOP = 30;
const FONT = 56;
const LINE = 74;
const ROW_CY = COMP.h - 24 - 34;
const SEND = 68;

export const Composer: React.FC<{ f: number; font: string }> = ({ f, font }) => {
  const enter = interpolate(f, [COMP_IN, COMP_IN + 16], [0, 1], { ...clamp, easing: ENTER });
  if (enter <= 0) return null;
  const rise = (d: number) => {
    const k = interpolate(f, [COMP_IN + d, COMP_IN + d + 12], [0, 1], { ...clamp, easing: ENTER });
    return { opacity: k, transform: `translateY(${((1 - k) * 10).toFixed(2)}px)` };
  };
  const shown = WORD_AT.filter((a) => f >= a - 0.5).length;
  const listening = interpolate(f, [WORD_AT[0] - 6, WORD_AT[0] - 2, TALK_END, TALK_END + 8], [0, 1, 1, 0], clamp);
  const armed = interpolate(f, [WORD_AT[0], WORD_AT[0] + 4], [0, 1], clamp);
  const lastAt = shown > 0 ? WORD_AT[shown - 1] : 0;
  // caret: solid while words land, blinking once the person stops
  const caretOn = f < TALK_END ? true : Math.floor((f - TALK_END) / 8) % 2 === 0;
  const voice = speech(f);

  const caret = (
    <span style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 2, top: -2, width: 3, height: FONT + 6, background: INK, opacity: caretOn ? 0.95 : 0 }} />
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
        opacity: Math.min(1, enter * 2.2),
        transform: `translateY(${((1 - enter) * 40).toFixed(2)}px) scale(${(0.985 + 0.015 * enter).toFixed(4)})`,
      }}
    >
      {/* the request, word by word (unspoken words are laid out invisibly so lines never reflow) */}
      <div
        style={{
          position: "absolute",
          left: PAD_X,
          right: PAD_X - 8,
          top: TEXT_TOP,
          fontSize: FONT,
          lineHeight: `${LINE}px`,
          fontWeight: 400,
          letterSpacing: -0.3,
          color: INK,
          ...rise(3),
        }}
      >
        {shown === 0 ? (
          <>
            {caret}
            <span style={{ color: PLACEHOLDER }}>How can I help you today?</span>
          </>
        ) : (
          WORDS.map((w, i) => {
            const k = i < shown ? interpolate(f, [WORD_AT[i] - 0.5, WORD_AT[i] + 2], [0.25, 1], clamp) : 0;
            return (
              <React.Fragment key={i}>
                <span style={{ opacity: k, visibility: i < shown ? "visible" : "hidden" }}>{w}</span>
                {i === shown - 1 && f >= lastAt ? caret : null}
                {i < WORDS.length - 1 ? " " : ""}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* bottom row */}
      <div style={{ position: "absolute", left: PAD_X - 8, top: ROW_CY - 22, ...rise(5) }}>
        <Plus size={44} color={ICON_INK} sw={1.9} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 24 + SEND + 108,
          top: ROW_CY - 22,
          height: 44,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 34,
          fontWeight: 500,
          color: INK,
          whiteSpace: "nowrap",
          ...rise(6),
        }}
      >
        <span>Opus 5</span>
        <Chevron size={30} color={ICON_INK} sw={2.2} style={{ marginTop: 3 }} />
      </div>
      {/* the live mic: green while the person talks, with a ring that breathes with the voice */}
      <div style={{ position: "absolute", right: 24 + SEND + 22, top: ROW_CY - 31, width: 62, height: 62, ...rise(7) }}>
        <div
          style={{
            position: "absolute",
            inset: -6 * voice,
            borderRadius: "50%",
            background: `rgba(${PH.userRgb},${(0.22 * listening).toFixed(3)})`,
            border: `2.5px solid rgba(${PH.userRgb},${(0.85 * listening).toFixed(3)})`,
          }}
        />
        <div style={{ position: "absolute", left: 9, top: 9 }}>
          <Mic size={44} color={listening > 0.5 ? PH.user : ICON_INK} sw={1.9} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 24,
          top: ROW_CY - SEND / 2,
          width: SEND,
          height: SEND,
          borderRadius: 16,
          background: CLAUDE_DARK.send,
          display: "grid",
          placeItems: "center",
          opacity: (0.42 + 0.58 * armed) * rise(8).opacity,
        }}
      >
        <ArrowUp size={38} color="#FFFFFF" sw={2.6} />
      </div>
    </div>
  );
};
