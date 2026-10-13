import React from "react";
import { Img, staticFile } from "remotion";
import { COLOR, EDIT } from "./plan";

// ===========================================================================
// Real clip frames of the same Resolve project ("URSA Cine 17K - Ranch and
// Iceland Compile"), cropped at render time out of the official press-kit
// screenshots: the Edit page's two viewers, the Color page's viewer, its clip
// filmstrip (clips 23-35) and its gallery stills. No new files: a Sprite shows
// a source rect of the full screenshot inside an overflow-hidden box.
// ===========================================================================

type Sheet = { src: string; w: number; h: number };
export type Crop = { sheet: Sheet; x: number; y: number; w: number; h: number };

const e = (x: number, y: number, w: number, h: number): Crop => ({ sheet: EDIT, x, y, w, h });
const c = (x: number, y: number, w: number, h: number): Crop => ({ sheet: COLOR, x, y, w, h });

/** Edit page source viewer: B003_02101729_C002.braw (the truck) */
export const F_TRUCK = e(1238, 517, 1510, 644);
/** Edit page record viewer: A001_02101330_C150.braw (cowboy, profile) */
export const F_PROFILE = e(2758, 517, 1517, 644);
/** Color page viewer: clip 29 (cowboy on the fence) */
export const F_FENCE = c(1128, 255, 1434, 655);
/** Edit page record viewer image rect (where the cut plays) */
export const REC_VIEW = { x: 2756, y: 515, w: 1521, h: 648 } as const;

/** Color page clip filmstrip, clip n (23..35): 256x118 thumbs on a 272 px pitch */
const clip = (n: number) => c(260 + 272 * (n - 23) + 1, 1180, 254, 116);
/** Color page gallery stills (3 columns x 4 rows) */
const still = (r: number, col: number) => c([70, 358, 646][col] + 2, [217, 444, 671, 898][r] + 2, 194, r === 3 ? 92 : 98);

/** filler frames for the 2 hours of source (clip 29 is the hi-res F_FENCE) */
export const FILLER: Crop[] = [
  clip(23), clip(24), clip(25), clip(26), clip(27), clip(30), clip(31), clip(32), clip(33),
  still(0, 0), still(0, 1), still(0, 2), still(1, 0), still(1, 1), still(1, 2), still(2, 0), still(2, 2), still(3, 0), still(3, 1), still(3, 2),
];

/** the seven best moments, in cut order (the first three have hi-res frames for playback) */
export const MOMENTS: Crop[] = [F_FENCE, F_TRUCK, F_PROFILE, clip(35), still(2, 1), clip(34), clip(28)];
/** truncated clip names as Resolve shows them on short clips (real name prefixes) */
export const MOMENT_NAME = ["A00...", "B003...", "A001...", "A00...", "A0...", "A00...", "A0..."] as const;

/** a source rect of a screenshot, object-fit cover into width x height */
export const Sprite: React.FC<{ crop: Crop; width: number; height: number; style?: React.CSSProperties }> = ({ crop, width, height, style }) => {
  const k = Math.max(width / crop.w, height / crop.h);
  const ox = (crop.w * k - width) / 2;
  const oy = (crop.h * k - height) / 2;
  return (
    <div style={{ position: "absolute", width, height, overflow: "hidden", ...style }}>
      <Img
        src={staticFile(crop.sheet.src)}
        style={{
          position: "absolute",
          left: -crop.x * k - ox,
          top: -crop.y * k - oy,
          width: crop.sheet.w * k,
          height: crop.sheet.h * k,
          maxWidth: "none",
        }}
      />
    </div>
  );
};

/** a 1:1 copy of a screenshot region (used to patch / heal baked UI) */
export const Patch: React.FC<{ sheet?: Sheet; sx: number; sy: number; w: number; h: number; x: number; y: number }> = ({ sheet = EDIT, sx, sy, w, h, x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden" }}>
    <Img src={staticFile(sheet.src)} style={{ position: "absolute", left: -sx, top: -sy, width: sheet.w, height: sheet.h, maxWidth: "none" }} />
  </div>
);
