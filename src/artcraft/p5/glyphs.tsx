import React from "react";

// ===========================================================================
// P5 glyphs. The official Adobe Photoshop icon (paths copied verbatim from
// public/artcraft/logos/Adobe_Photoshop_CC_icon.svg), the composer's controls
// as drawn in the real Claude app capture (public/claude-chat/shots/
// 05-transcript.png: "+", mic, model chevron, coral send with an up arrow),
// and the plain macOS arrow cursor.
// ===========================================================================

const PS_TILE =
  "M42.5,0h155C221,0,240,19,240,42.5v149c0,23.5-19,42.5-42.5,42.5h-155C19,234,0,215,0,191.5v-149C0,19,19,0,42.5,0z";
const PS_P =
  "M54,164.1V61.2c0-0.7,0.3-1.1,1-1.1c1.7,0,3.3,0,5.6-0.1c2.4-0.1,4.9-0.1,7.6-0.2c2.7-0.1,5.6-0.1,8.7-0.2c3.1-0.1,6.1-0.1,9.1-0.1c8.2,0,15,1,20.6,3.1c5,1.7,9.6,4.5,13.4,8.2c3.2,3.2,5.7,7.1,7.3,11.4c1.5,4.2,2.3,8.5,2.3,13c0,8.6-2,15.7-6,21.3c-4,5.6-9.6,9.8-16.1,12.2c-6.8,2.5-14.3,3.4-22.5,3.4c-2.4,0-4,0-5-0.1c-1-0.1-2.4-0.1-4.3-0.1v32.1c0.1,0.7-0.4,1.3-1.1,1.4c-0.1,0-0.2,0-0.4,0H55.2C54.4,165.4,54,165,54,164.1z M75.8,79.4V113c1.4,0.1,2.7,0.2,3.9,0.2H85c3.9,0,7.8-0.6,11.5-1.8c3.2-0.9,6-2.8,8.2-5.3c2.1-2.5,3.1-5.9,3.1-10.3c0.1-3.1-0.7-6.2-2.3-8.9c-1.7-2.6-4.1-4.6-7-5.7c-3.7-1.5-7.7-2.1-11.8-2c-2.6,0-4.9,0-6.8,0.1C77.9,79.2,76.5,79.3,75.8,79.4L75.8,79.4z";
const PS_S =
  "M192,106.9c-3-1.6-6.2-2.7-9.6-3.4c-3.7-0.8-7.4-1.3-11.2-1.3c-2-0.1-4.1,0.2-6,0.7c-1.3,0.3-2.4,1-3.1,2c-0.5,0.8-0.8,1.8-0.8,2.7c0,0.9,0.4,1.8,1,2.6c0.9,1.1,2.1,2,3.4,2.7c2.3,1.2,4.7,2.3,7.1,3.3c5.4,1.8,10.6,4.3,15.4,7.3c3.3,2.1,6,4.9,7.9,8.3c1.6,3.2,2.4,6.7,2.3,10.3c0.1,4.7-1.3,9.4-3.9,13.3c-2.8,4-6.7,7.1-11.2,8.9c-4.9,2.1-10.9,3.2-18.1,3.2c-4.6,0-9.1-0.4-13.6-1.3c-3.5-0.6-7-1.7-10.2-3.2c-0.7-0.4-1.2-1.1-1.1-1.9v-17.4c0-0.3,0.1-0.7,0.4-0.9c0.3-0.2,0.6-0.1,0.9,0.1c3.9,2.3,8,3.9,12.4,4.9c3.8,1,7.8,1.5,11.8,1.5c3.8,0,6.5-0.5,8.3-1.4c1.6-0.7,2.7-2.4,2.7-4.2c0-1.4-0.8-2.7-2.4-4c-1.6-1.3-4.9-2.8-9.8-4.7c-5.1-1.8-9.8-4.2-14.2-7.2c-3.1-2.2-5.7-5.1-7.6-8.5c-1.6-3.2-2.4-6.7-2.3-10.2c0-4.3,1.2-8.4,3.4-12.1c2.5-4,6.2-7.2,10.5-9.2c4.7-2.4,10.6-3.5,17.7-3.5c4.1,0,8.3,0.3,12.4,0.9c3,0.4,5.9,1.2,8.6,2.3c0.4,0.1,0.8,0.5,1,0.9c0.1,0.4,0.2,0.8,0.2,1.2v16.3c0,0.4-0.2,0.8-0.5,1C192.9,107.1,192.4,107.1,192,106.9z";

/**
 * The official Ps icon. Its navy tile (#001E36) crushes to pure black in the
 * tube and only the letters survive, so the tile is lifted to the next navy
 * that still reads as navy after the CRT grade. Letters keep the official
 * #31A8FF. Shapes are untouched.
 */
export const PsIcon: React.FC<{ width: number; style?: React.CSSProperties }> = ({ width, style }) => (
  <svg width={width} height={(width * 234) / 240} viewBox="0 0 240 234" style={{ display: "block", ...style }}>
    <path d={PS_TILE} fill="#0F3D6B" />
    <path d={PS_P} fill="#31A8FF" />
    <path d={PS_S} fill="#31A8FF" />
  </svg>
);

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
