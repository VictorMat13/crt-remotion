import React from "react";
import { interpolate } from "remotion";
import { REPO } from "../theme";
import { CLONING, COMPRESSING, COUNTING, ENUMERATING, RECEIVING, RESOLVING, TOTAL } from "./cloneLog";
import { ENTER_KEY, OUT, PASTE, TERM, TEXT_TOP, TRAVEL, TYPE, clamp } from "./plan";
import { MONO_FONT, UI } from "./ui";

// ===========================================================================
// A dark terminal window (traffic lights, zsh prompt), bigger than the frame:
// the camera pushes into it and pans with the action. "git clone " is typed,
// the copied URL lands as a paste when the packet arrives, Enter, then the
// REAL clone output from photocraft-git-clone.log: each progress line ticks
// through git's own states in place (\r), and "remote: Total" overwrites the
// 99% receiving line exactly as in the log.
// ===========================================================================

const PROMPT = "~ % ";
const TYPED = "git clone ";
const I99 = RECEIVING.length - 3; // the 99% state; then 100% (35.33 MiB), then 100% ... done.

const tick = (frame: number, [a, b]: [number, number], n: number) =>
  Math.min(n - 1, Math.floor(interpolate(frame, [a, b], [0, n - 1], { ...clamp, easing: TRAVEL }) + 1e-6));

type Ln = { prompt?: boolean; text: string };

export const termLines = (f: number): Ln[] => {
  const typed = f < TYPE[0] ? "" : TYPED.slice(0, Math.round(interpolate(f, TYPE, [0, TYPED.length], { ...clamp, easing: TRAVEL })));
  const out: Ln[] = [{ prompt: true, text: typed + (f >= PASTE ? REPO.clone : "") }];
  if (f < ENTER_KEY) return out;
  if (f >= OUT.cloning) out.push({ text: CLONING });
  if (f >= OUT.enumerating) out.push({ text: ENUMERATING });
  if (f >= OUT.counting[0]) out.push({ text: COUNTING[tick(f, OUT.counting, COUNTING.length)] });
  if (f >= OUT.compressing[0]) out.push({ text: COMPRESSING[tick(f, OUT.compressing, COMPRESSING.length)] });
  if (f >= OUT.receiving[0]) {
    if (f < OUT.total) out.push({ text: RECEIVING[tick(f, OUT.receiving, I99 + 1)] });
    else {
      out.push({ text: TOTAL });
      out.push({ text: RECEIVING[f >= OUT.recvDone ? RECEIVING.length - 1 : RECEIVING.length - 2] });
    }
  }
  if (f >= OUT.resolving[0]) out.push({ text: RESOLVING[tick(f, OUT.resolving, RESOLVING.length)] });
  if (f >= OUT.prompt) out.push({ prompt: true, text: "" });
  return out;
};

export const Terminal: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  const lines = termLines(f);
  // caret: solid while typing / while git is writing, blinking at an idle prompt
  const busy = f >= TYPE[0] && f < OUT.prompt;
  const caretOn = busy || Math.floor(f / 8) % 2 === 0;
  const adv = 0.6 * TERM.font;

  return (
    <div
      style={{
        position: "absolute",
        left: TERM.left,
        top: TERM.top,
        width: TERM.right - TERM.left,
        height: TERM.h,
        boxSizing: "border-box",
        borderRadius: 16,
        background: "#0B0D10",
        border: `2px solid ${UI.edge}`,
        boxShadow: "0 26px 60px rgba(0,0,0,0.7)",
        overflow: "hidden",
        zIndex: 12,
      }}
    >
      {/* title bar */}
      {[UI.red, UI.amber, UI.lime].map((c, i) => (
        <div key={c} style={{ position: "absolute", left: 22 + i * 30, top: 15, width: 18, height: 18, borderRadius: "50%", background: c }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: TERM.title, height: 2, background: UI.hair, opacity: 0.7 }} />
      {/* scrollback */}
      <div
        style={{
          position: "absolute",
          left: TERM.pad,
          top: TEXT_TOP - TERM.top,
          fontFamily: MONO_FONT,
          fontSize: TERM.font,
          fontWeight: 500,
          lineHeight: `${TERM.line}px`,
          color: UI.out,
          whiteSpace: "pre",
        }}
      >
        {lines.map((ln, i) => (
          <div key={i} style={{ height: TERM.line }}>
            {ln.prompt ? <span style={{ color: UI.check }}>{PROMPT}</span> : null}
            <span style={{ color: ln.prompt ? UI.ink : UI.out }}>{ln.text}</span>
            {i === lines.length - 1 ? (
              <span
                style={{
                  display: "inline-block",
                  width: Math.round(adv),
                  height: TERM.line - 12,
                  marginLeft: 1,
                  verticalAlign: -8,
                  background: UI.ink,
                  opacity: caretOn ? 0.9 : 0,
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
