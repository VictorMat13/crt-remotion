import React from "react";

// ===========================================================================
// GitHub's octicons (16px grid) redrawn as strokes heavy enough to survive the
// CRT tube at phone size, plus the plain macOS arrow cursor. Shapes follow the
// real Primer icons; nothing invented.
// ===========================================================================

type G = { size: number; color: string; sw?: number; style?: React.CSSProperties };

const Svg: React.FC<G & { children: React.ReactNode; fill?: boolean }> = ({ size, color, sw = 1.5, style, children, fill }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={fill ? color : "none"}
    stroke={fill ? "none" : color}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block", flex: "none", overflow: "visible", ...style }}
  >
    {children}
  </svg>
);

const starPts = (() => {
  const pts: string[] = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? 7.1 : 3.2;
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    pts.push(`${(8 + r * Math.cos(a)).toFixed(2)},${(8.6 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
})();

export const Star: React.FC<G> = (p) => (
  <Svg {...p}>
    <polygon points={starPts} />
  </Svg>
);

export const Fork: React.FC<G> = (p) => (
  <Svg {...p}>
    <circle cx="4.5" cy="3" r="1.6" />
    <circle cx="11.5" cy="3" r="1.6" />
    <circle cx="8" cy="13" r="1.6" />
    <path d="M4.5 4.6v1.2c0 1.2.9 2 2.1 2h2.8c1.2 0 2.1-.8 2.1-2V4.6M8 7.8v3.6" />
  </Svg>
);

export const Law: React.FC<G> = (p) => (
  <Svg {...p}>
    <path d="M8 2v12M4.5 14h7M2.6 4.4h10.8M8 2.6v1.8" />
    <path d="M2.6 4.4.9 9.2M2.6 4.4l1.7 4.8M.9 9.2c.6 1.2 2.8 1.2 3.4 0Z" />
    <path d="M13.4 4.4l-1.7 4.8M13.4 4.4l1.7 4.8M11.7 9.2c.6 1.2 2.8 1.2 3.4 0Z" />
  </Svg>
);

export const Code: React.FC<G> = (p) => (
  <Svg {...p}>
    <path d="M5.4 4 1.6 8l3.8 4M10.6 4l3.8 4-3.8 4" />
  </Svg>
);

export const Caret: React.FC<G> = (p) => (
  <Svg {...p} fill>
    <path d="M3.8 6h8.4L8 10.6Z" />
  </Svg>
);

export const Branch: React.FC<G> = (p) => (
  <Svg {...p}>
    <circle cx="4.5" cy="3.5" r="1.6" />
    <circle cx="4.5" cy="12.5" r="1.6" />
    <circle cx="11.5" cy="4.5" r="1.6" />
    <path d="M4.5 5.1v5.8M11.5 6.1c0 3-7 2.4-7 4.8" />
  </Svg>
);

export const Folder: React.FC<G> = (p) => (
  <Svg {...p} fill>
    <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z" />
  </Svg>
);

export const File: React.FC<G> = (p) => (
  <Svg {...p}>
    <path d="M3.2 1.2h6.2l3.4 3.4v10.2H3.2Z" />
    <path d="M9.4 1.2v3.4h3.4" />
  </Svg>
);

export const History: React.FC<G> = (p) => (
  <Svg {...p}>
    <path d="M2.2 6.2A6 6 0 1 1 2 8" />
    <path d="M1.4 3.4 2.2 6.2 5 5.4" />
    <path d="M8 4.8V8l2.3 1.4" />
  </Svg>
);

export const Copy: React.FC<G> = (p) => (
  <Svg {...p}>
    <rect x="5.2" y="5.2" width="9" height="9" rx="1.6" />
    <path d="M2.4 10.6V3.4c0-.6.4-1 1-1h7.2" />
  </Svg>
);

export const Check: React.FC<G> = (p) => (
  <Svg {...p}>
    <path d="M2.4 8.6 6 12.2l7.6-8.4" />
  </Svg>
);

export const IssueOpened: React.FC<G> = (p) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6.4" />
    <circle cx="8" cy="8" r="1.1" fill={p.color} />
  </Svg>
);

export const PullRequest: React.FC<G> = (p) => (
  <Svg {...p}>
    <circle cx="4" cy="3.4" r="1.6" />
    <circle cx="4" cy="12.6" r="1.6" />
    <circle cx="12" cy="12.6" r="1.6" />
    <path d="M4 5v6M12 11V6.2c0-1.2-.9-2.2-2.1-2.2H7.4M9 2.2 7.2 4 9 5.8" />
  </Svg>
);

export const Search: React.FC<G> = (p) => (
  <Svg {...p}>
    <circle cx="6.8" cy="6.8" r="4.6" />
    <path d="M10.2 10.2 14.4 14.4" />
  </Svg>
);

export const TerminalIcon: React.FC<G> = (p) => (
  <Svg {...p}>
    <rect x="1" y="2.2" width="14" height="11.6" rx="1.6" />
    <path d="M4.2 6 6.6 8.2 4.2 10.4M8.4 10.6h3.4" />
  </Svg>
);

export const Question: React.FC<G> = (p) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6.4" />
    <path d="M6.1 6.1c.2-1.1 1-1.7 2-1.7 1.1 0 2 .8 2 1.8 0 1.5-2.1 1.6-2.1 3" />
    <circle cx="8" cy="11.7" r=".5" fill={p.color} />
  </Svg>
);

export const DesktopDownload: React.FC<G> = (p) => (
  <Svg {...p}>
    <path d="M5 2.6H2.6c-.6 0-1 .4-1 1v7.2c0 .6.4 1 1 1h10.8c.6 0 1-.4 1-1V3.6c0-.6-.4-1-1-1H11" />
    <path d="M8 1v6.6M5.6 5.4 8 7.8l2.4-2.4M6 14.6h4M8 11.8v2.8" />
  </Svg>
);

export const FileZip: React.FC<G> = (p) => (
  <Svg {...p}>
    <path d="M3.2 1.2h6.2l3.4 3.4v10.2H3.2Z" />
    <path d="M6 1.4v1.4M7.4 3.2v1.4M6 5v1.4M7.4 6.8v1.4" />
    <rect x="5.6" y="9.4" width="2.4" height="2.6" rx=".6" />
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
