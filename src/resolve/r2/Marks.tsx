import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { LOGOS, PH } from "../theme";
import { ChatGPTMark } from "./glyphs";
import { buildPath, Wire, type WireBump } from "./Wire";
import {
  CLAUDE_AT,
  DECEL,
  ENTER,
  GPT_AT,
  GPT_RGB,
  ICON,
  ICON_WAKE,
  MARK_SIZE,
  PACKETS,
  PLUG_CLAUDE,
  PLUG_GPT,
  TRAVEL,
  clamp,
  type Packet,
} from "./plan";

// ===========================================================================
// FG plane: the Claude mark and the ChatGPT mark, each sitting on its own
// scope trace; both traces converge into the Resolve icon. Packets leave each
// mark and run down its trace into the icon; each mark keeps a small voice on
// its trace (Claude coral, ChatGPT phosphor white). The icon answers every
// arrival with one soft ring in the packet's colour.
// ===========================================================================

const LEAD = 1200; // trace length above each mark (runs off the top of the world)

export const CLAUDE_PATH = buildPath([
  ["L", { x: CLAUDE_AT.x, y: CLAUDE_AT.y - LEAD }, { x: CLAUDE_AT.x, y: CLAUDE_AT.y }],
  ["C", { x: CLAUDE_AT.x, y: CLAUDE_AT.y }, { x: CLAUDE_AT.x, y: 470 }, { x: PLUG_CLAUDE.x, y: 430 }, PLUG_CLAUDE],
]);
export const GPT_PATH = buildPath([
  ["L", { x: GPT_AT.x, y: GPT_AT.y - LEAD }, { x: GPT_AT.x, y: GPT_AT.y }],
  ["C", { x: GPT_AT.x, y: GPT_AT.y }, { x: GPT_AT.x, y: 520 }, { x: PLUG_GPT.x, y: 460 }, PLUG_GPT],
]);

const pathOf = (w: Packet["wire"]) => (w === "claude" ? CLAUDE_PATH : GPT_PATH);
const rgbOf = (w: Packet["wire"]) => (w === "claude" ? PH.claudeRgb : GPT_RGB);

/** a packet's arc-length position + envelope at frame f (null when not on the trace) */
const packetAt = (p: Packet, f: number) => {
  if (f < p.t0 || f > p.t1 + 3) return null;
  const path = pathOf(p.wire);
  const u = interpolate(f, [p.t0, p.t1], [0, 1], { ...clamp, easing: TRAVEL });
  const env = interpolate(f, [p.t0, p.t0 + 4, p.t1 - 2, p.t1 + 2], [0, 1, 1, 0], clamp);
  return { s: LEAD + (path.L - LEAD) * u, env };
};

const voice = (f: number, w: Packet["wire"]) => {
  const ph = w === "claude" ? 0 : 1.9;
  let a = 9 + 4 * Math.sin(f * 0.21 + ph) + 2 * Math.sin(f * 0.53 + ph * 2);
  // a mark speaks up as each packet leaves it
  for (const p of PACKETS) if (p.wire === w) a += 12 * interpolate(f, [p.t0 - 8, p.t0, p.t0 + 12], [0, 1, 0], clamp);
  return a;
};

const bumpsFor = (w: Packet["wire"], f: number): WireBump[] => {
  const rgb = rgbOf(w);
  const b: WireBump[] = [{ s: LEAD, amp: voice(f, w), sigma: 74, rgb }];
  for (const p of PACKETS) {
    if (p.wire !== w) continue;
    const at = packetAt(p, f);
    if (at && at.env > 0.01) b.push({ s: at.s, amp: 22 * at.env, sigma: 42, rgb });
  }
  return b;
};

export const Traces: React.FC<{ frame: number }> = ({ frame: f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <Wire path={GPT_PATH} frame={f} bumps={bumpsFor("gpt", f)} phase={137} />
    <Wire path={CLAUDE_PATH} frame={f} bumps={bumpsFor("claude", f)} />
  </svg>
);

/** last arrival at the icon at or before f: frame + colour */
const arrivals = PACKETS.map((p) => ({ at: p.t1, rgb: rgbOf(p.wire) }));

const Ring: React.FC<{ cx: number; cy: number; r0: number; at: number; frame: number; rgb: string; round?: number; len?: number }> = ({
  cx,
  cy,
  r0,
  at,
  frame,
  rgb,
  round,
  len = 24,
}) => {
  const t = (frame - at) / len;
  if (t < 0 || t > 1) return null;
  const g = 30 * DECEL(t);
  const r = r0 + g;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: 2 * r,
        height: 2 * r,
        boxSizing: "border-box",
        borderRadius: round === undefined ? "50%" : round + g * 0.4,
        border: `2.5px solid rgba(${rgb},${(0.6 * (1 - t)).toFixed(3)})`,
      }}
    />
  );
};

/** the Resolve icon on the traces (and in the dialog): asleep until the first packet, a ring per arrival */
export const ResolveIcon: React.FC<{ frame: number }> = ({ frame: f }) => {
  const k = interpolate(f, [ICON_WAKE - 2, ICON_WAKE + 8], [0, 1], { ...clamp, easing: ENTER });
  const cx = ICON.left + ICON.size / 2;
  const cy = ICON.top + ICON.size / 2;
  return (
    <>
      {arrivals.map((a, i) => (
        <Ring key={i} cx={cx} cy={cy} r0={ICON.size / 2} at={a.at} frame={f} rgb={a.rgb} round={30} />
      ))}
      <Img
        src={staticFile(LOGOS.resolve)}
        style={{
          position: "absolute",
          left: ICON.left,
          top: ICON.top,
          width: ICON.size,
          height: ICON.size,
          transform: `scale(${(0.95 + 0.05 * k).toFixed(4)})`,
          filter: k < 0.995 ? `grayscale(${(0.9 * (1 - k)).toFixed(3)}) brightness(${(0.7 + 0.3 * k).toFixed(3)})` : undefined,
        }}
      />
    </>
  );
};

const Disc: React.FC<{ at: { x: number; y: number }; rgb: string; talk: number; children: React.ReactNode }> = ({ at, rgb, talk, children }) => (
  <div
    style={{
      position: "absolute",
      left: at.x - MARK_SIZE / 2,
      top: at.y - MARK_SIZE / 2,
      width: MARK_SIZE,
      height: MARK_SIZE,
      boxSizing: "border-box",
      borderRadius: "50%",
      background: "#08090B",
      border: `2.5px solid rgba(${rgb},0.5)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `scale(${(1 + 0.03 * talk).toFixed(4)})`,
    }}
  >
    {children}
  </div>
);

export const Marks: React.FC<{ frame: number }> = ({ frame: f }) => {
  const tc = (voice(f, "claude") - 9) / 16;
  const tg = (voice(f, "gpt") - 9) / 16;
  return (
    <>
      {PACKETS.map((p, i) => (
        <Ring
          key={i}
          cx={(p.wire === "claude" ? CLAUDE_AT : GPT_AT).x}
          cy={(p.wire === "claude" ? CLAUDE_AT : GPT_AT).y}
          r0={MARK_SIZE / 2}
          at={p.t0}
          frame={f}
          rgb={rgbOf(p.wire)}
        />
      ))}
      <Disc at={CLAUDE_AT} rgb={PH.claudeRgb} talk={tc}>
        <Img src={staticFile(LOGOS.claude)} style={{ width: MARK_SIZE * 0.62, height: MARK_SIZE * 0.62 }} />
      </Disc>
      <Disc at={GPT_AT} rgb={GPT_RGB} talk={tg}>
        <ChatGPTMark size={MARK_SIZE * 0.6} color={PH.ink} />
      </Disc>
    </>
  );
};
