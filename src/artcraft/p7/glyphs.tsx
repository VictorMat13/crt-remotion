import React from "react";

// ===========================================================================
// P7 glyphs: the claude.ai composer controls (as drawn in the real Claude app
// capture, public/claude-chat/shots/05-transcript.png: "+", mic, the model
// chevron, the coral send button's up arrow), a checkbox tick, and the plain
// macOS arrow cursor. Strokes stay >= 2px so the tube never eats them.
// ===========================================================================

type G = { size: number; color: string; sw?: number; style?: React.CSSProperties };

export const Plus: React.FC<G> = ({ size, color, sw = 2, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" style={{ display: "block", ...style }}>
    <path d="M12 4.5v15M4.5 12h15" />
  </svg>
);

export const Mic: React.FC<G> = ({ size, color, sw = 1.8, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", ...style }}>
    <rect x="8.6" y="2.6" width="6.8" height="11.6" rx="3.4" />
    <path d="M5.4 10.8a6.6 6.6 0 0 0 13.2 0M12 17.6v3.8M8.6 21.4h6.8" />
  </svg>
);

export const Chevron: React.FC<G> = ({ size, color, sw = 2, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", ...style }}>
    <path d="M6.5 9.5 12 15l5.5-5.5" />
  </svg>
);

export const ArrowUp: React.FC<G> = ({ size, color, sw = 2.4, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", ...style }}>
    <path d="M12 19.5v-15M5.8 10.7 12 4.5l6.2 6.2" />
  </svg>
);

/** a check that draws itself: k 0..1 */
export const Tick: React.FC<{ size: number; k: number; color: string; sw?: number }> = ({ size, k, color, sw = 3.2 }) => {
  const len = 22;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
      <path
        d="M5.2 12.6 9.9 17.2 18.8 7.4"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={(len * (1 - k)).toFixed(2)}
      />
    </svg>
  );
};

/** Plain macOS arrow, tip at (x, y). `press` (0..1) is a small scale dip, nothing else. */
export const MacCursor: React.FC<{ x: number; y: number; size: number; press?: number; opacity?: number }> = ({ x, y, size, press = 0, opacity = 1 }) =>
  opacity <= 0.001 ? null : (
    <svg
      width={(size * 13) / 20}
      height={size}
      viewBox="0 0 13 20"
      style={{
        position: "absolute",
        left: x,
        top: y,
        overflow: "visible",
        transform: `scale(${(1 - 0.1 * press).toFixed(4)})`,
        transformOrigin: "0 0",
        filter: "drop-shadow(0 1px 1.4px rgba(0,0,0,0.5))",
        opacity,
        zIndex: 40,
      }}
    >
      <path d="M0 0 L0 17.5 L4.2 13.6 L6.9 19.8 L10 18.5 L7.4 12.5 L12.8 12.5 Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={0.6} strokeLinejoin="round" />
      <path d="M1.3 3.1 L1.3 14.4 L4.6 11.4 L7.5 18 L8.6 17.5 L5.8 11.2 L10 11.2 Z" fill="#000000" />
    </svg>
  );
