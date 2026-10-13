import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

// ===========================================================================
// invideo 2 (MCP), style variant B (Victor, Oct 6): black background with
// depth. A CSS-3D floor grid in perspective, drifting slowly toward the lens,
// fading into black at the horizon and at the frame edges, with a faint cool
// haze band. Same floor idea as the hook's world, but black and quiet, so the
// screens and terminal sit on it like the gray IvGround. No glows, no neon.
// ===========================================================================

export const BLACK = {
  bg: "#06070A",
  deep: "#000000",
  line: "rgba(255,255,255,0.17)",
  lineSoft: "rgba(255,255,255,0.035)",
  haze: "rgba(120,140,170,0.16)",
} as const;

const GRID = 96; // px between lines on the floor plane

export const BlackDepthGround: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const drift = (frame * 0.55) % GRID; // slow push toward the lens, loops seamlessly
  const horizon = 0.36; // fraction of the frame height where the floor meets the dark
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: BLACK.bg }} />
      {/* floor in perspective */}
      <AbsoluteFill style={{ perspective: 760, perspectiveOrigin: `50% ${(horizon * 100).toFixed(1)}%`, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: "-150%",
            width: "400%",
            top: `${(horizon * 100).toFixed(1)}%`,
            height: "320%",
            transformOrigin: "50% 0%",
            transform: "rotateX(71deg)",
            backgroundImage: `repeating-linear-gradient(90deg, ${BLACK.line} 0px, ${BLACK.line} 1.5px, transparent 1.5px, transparent ${GRID}px), repeating-linear-gradient(180deg, ${BLACK.line} 0px, ${BLACK.line} 1.5px, transparent 1.5px, transparent ${GRID}px)`,
            backgroundPosition: `0 0, 0 ${drift.toFixed(2)}px`,
            WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 8%, rgba(0,0,0,1) 28%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0) 100%)",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 8%, rgba(0,0,0,1) 28%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0) 100%)",
          }}
        />
      </AbsoluteFill>
      {/* haze band at the horizon + side falloff, then a vignette so the edges go to black */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(90% ${Math.round(height * 0.18)}px at 50% ${(horizon * 100).toFixed(1)}%, ${BLACK.haze} 0%, rgba(0,0,0,0) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(75% 70% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%)`,
        }}
      />
    </>
  );
};
