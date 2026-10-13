import React from "react";

// ===========================================================================
// Small strokes heavy enough to survive the tube at phone size, plus the
// plain macOS arrow cursor. Nothing decorative.
// ===========================================================================

type G = { size: number; color: string; sw?: number; style?: React.CSSProperties };

const Svg: React.FC<G & { children: React.ReactNode; vb?: number }> = ({ size, color, sw = 2, style, children, vb = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox={`0 0 ${vb} ${vb}`}
    fill="none"
    stroke={color}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block", flex: "none", overflow: "visible", ...style }}
  >
    {children}
  </svg>
);

/** the lock from the app's own markup (p6/code.ts) */
export const Lock: React.FC<G> = (p) => (
  <Svg {...p}>
    <rect x="3" y="7" width="10" height="7" rx="1.5" />
    <path d="M5 7V5a3 3 0 0 1 6 0v2" />
  </Svg>
);

export const CloseX: React.FC<G> = (p) => (
  <Svg {...p}>
    <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" />
  </Svg>
);

export const CopyIcon: React.FC<G> = (p) => (
  <Svg {...p}>
    <rect x="5.2" y="5.2" width="9" height="9" rx="1.6" />
    <path d="M2.4 10.6V3.4c0-.6.4-1 1-1h7.2" />
  </Svg>
);

/** download: arrow (dy moves it) into a tray */
export const DownloadIcon: React.FC<G & { dy?: number; arrowOpacity?: number }> = ({ dy = 0, arrowOpacity = 1, ...p }) => (
  <Svg {...p}>
    <g transform={`translate(0 ${dy.toFixed(3)})`} opacity={arrowOpacity}>
      <path d="M8 1.6v7.6M4.8 6.2 8 9.4l3.2-3.2" />
    </g>
    <path d="M2.4 10.8v2.2c0 .6.4 1 1 1h9.2c.6 0 1-.4 1-1v-2.2" />
  </Svg>
);

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
