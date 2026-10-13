import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile } from "remotion";
import { LOGOS, PH } from "../theme";
import {
  DECEL,
  LOGO,
  LOGO_DROPS,
  MAIN,
  REF_BOTTOM,
  SHOT,
  SHOT_DROP,
  TRICKLE,
  VID,
  VID_DROP,
  c01,
  dropY,
  seg,
} from "./plan";

// ===========================================================================
// The three references, standing on the trace (world px, inside the camera).
//   - the real PhotoCraft screenshot (getartcraft.com)
//   - the CRT Scope example video, playing (CREATORS/Styles/CRT Scope)
//   - a stack of official logo PNG tiles: Claude, Remotion, DaVinci Resolve
// Each one falls in from above onto the line. Its edge brightens when it lands
// and each time it sends a packet into the output.
// ===========================================================================

export const SHOT_SRC = "artcraft/site/photocraft-hero.webp"; // 1600x1000
const VID_SRC = "motiontips/t8/example-fish-8-hook-540.mp4"; // 540x480 copy of "example - fish 8 hook.mp4" (170f)
const RESOLVE = "resolve/logos/davinci-resolve-icon.svg";

const EDGE = "233,231,226";

/** edge brightness 0..1: lands, then each packet it sends */
const pulseOf = (f: number, land: number, from: number) => {
  let p = c01((f - land + 1) / 2) * (1 - seg(f, land + 1, land + 22, DECEL));
  for (const k of [...MAIN, ...TRICKLE]) {
    if (k.from !== from) continue;
    p = Math.max(p, 0.6 * c01((f - k.at + 1) / 2) * (1 - seg(f, k.at + 1, k.at + 14, DECEL)));
  }
  return p;
};

const Card: React.FC<{
  x: number;
  w: number;
  h: number;
  dy: number;
  pulse: number;
  radius?: number;
  bg?: string;
  children: React.ReactNode;
}> = ({ x, w, h, dy, pulse, radius = 14, bg = "#08090C", children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: REF_BOTTOM - h + dy,
      width: w,
      height: h,
      borderRadius: radius,
      overflow: "hidden",
      background: bg,
    }}
  >
    {children}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        border: `2.5px solid rgba(${EDGE},${(0.62 + 0.36 * pulse).toFixed(3)})`,
      }}
    />
  </div>
);

export const ShotRef: React.FC<{ f: number; cx: number }> = ({ f, cx }) => {
  if (f < SHOT_DROP[0]) return null;
  return (
    <Card x={SHOT.x} w={SHOT.w} h={SHOT.h} dy={dropY(f, SHOT_DROP)} pulse={pulseOf(f, SHOT_DROP[1], cx)}>
      {/* bright canvas dimmed ~25% so it doesn't bloom out in the tube */}
      <Img
        src={staticFile(SHOT_SRC)}
        style={{ width: SHOT.w, height: SHOT.h, objectFit: "cover", display: "block", filter: "brightness(0.76)" }}
      />
    </Card>
  );
};

export const VidRef: React.FC<{ f: number; cx: number }> = ({ f, cx }) => {
  if (f < VID_DROP[0]) return null;
  return (
    <Card x={VID.x} w={VID.w} h={VID.h} dy={dropY(f, VID_DROP)} pulse={pulseOf(f, VID_DROP[1], cx)} bg="#000">
      {/* plays from the moment it falls in; 0.85x so its 170 frames run to the end */}
      <Sequence from={VID_DROP[0] - 2} layout="none">
        <OffthreadVideo
          src={staticFile(VID_SRC)}
          muted
          playbackRate={0.85}
          style={{ width: VID.w, height: VID.h, objectFit: "cover", display: "block", filter: "brightness(1.3) contrast(0.95)" }}
        />
      </Sequence>
    </Card>
  );
};

const LOGO_TILES = [
  { src: LOGOS.claude, pad: 16 }, // bottom
  { src: LOGOS.remotionMark, pad: 14 }, // middle
  { src: RESOLVE, pad: 12 }, // top
];

export const LogoRef: React.FC<{ f: number; cx: number }> = ({ f, cx }) => (
  <>
    {LOGO_TILES.map((t, i) => {
      const w = LOGO_DROPS[i];
      if (f < w[0]) return null;
      const lift = i * (LOGO.size + LOGO.gap);
      return (
        <div key={t.src} style={{ position: "absolute", left: 0, top: -lift, width: 0, height: 0 }}>
          <Card
            x={LOGO.x}
            w={LOGO.size}
            h={LOGO.size}
            dy={dropY(f, w)}
            pulse={pulseOf(f, w[1], cx)}
            radius={18}
            bg={PH.panel}
          >
            <Img
              src={staticFile(t.src)}
              style={{
                position: "absolute",
                left: t.pad,
                top: t.pad,
                width: LOGO.size - 2 * t.pad,
                height: LOGO.size - 2 * t.pad,
                objectFit: "contain",
              }}
            />
          </Card>
        </div>
      );
    })}
  </>
);
