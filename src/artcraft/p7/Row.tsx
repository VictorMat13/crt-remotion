import React from "react";
import { Img, staticFile } from "remotion";
import { appIcon } from "../theme";
import { ICONS, ROW, barDim, c01, dofPx, haze, iconPos, progress, project, rowFade, rowSwing, type Cam, type RowIcon } from "./rig";

// ===========================================================================
// The twelve Craft apps downloading: each real icon sits on the trace with a
// download bar filling under it (the app's own accent). The row then swings
// back off the line into depth and keeps sinking away. Every icon stays
// parallel to the screen (a card, never a sliver), carries its own depth of
// field blur and haze, and dims as its download stalls.
// ===========================================================================

const BAR = { w: ROW.icon * 0.84, h: 18, gap: 24 } as const;

const RowItem: React.FC<{ ic: RowIcon; cam: Cam; f: number }> = ({ ic, cam, f }) => {
  const p = iconPos(ic.i, f);
  const q = project(cam, p);
  if (q.d < 80) return null;
  // cull icons well off the frame
  const half = (ROW.icon * q.s) / 2;
  if (q.sx + half < -200 || q.sx - half > 1280 || q.sy + half < -200 || q.sy - half > 1160) return null;
  const blurScreen = dofPx(cam, q.d);
  const blur = blurScreen / q.s;
  const fade = rowFade(f);
  if (fade <= 0.002) return null;
  // bright engraved icons bloom in the tube: dim ~20%, and sink further as the row recedes
  const bright = 0.8 * haze(cam, q.d) * (1 - 0.22 * rowSwing(f));
  const dim = barDim(ic.i, f);
  const prog = progress(ic.i, f);
  const filter = [blur >= 0.35 ? `blur(${blur.toFixed(2)}px)` : "", `brightness(${bright.toFixed(3)})`].join(" ").trim();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: ROW.icon,
        height: ROW.icon + BAR.gap + BAR.h,
        transformOrigin: "0 0",
        transform: `translate3d(${(p.x - ROW.icon / 2).toFixed(2)}px, ${(p.y - ROW.icon / 2).toFixed(2)}px, ${p.z.toFixed(2)}px)`,
        filter,
        opacity: fade < 0.999 ? fade : undefined,
      }}
    >
      <Img src={staticFile(appIcon(ic.id))} style={{ position: "absolute", left: 0, top: 0, width: ROW.icon, height: ROW.icon, display: "block" }} />
      {/* the download bar */}
      <div
        style={{
          position: "absolute",
          left: (ROW.icon - BAR.w) / 2,
          top: ROW.icon + BAR.gap,
          width: BAR.w,
          height: BAR.h,
          borderRadius: BAR.h / 2,
          background: `rgba(233,231,226,${(0.3 * (0.5 + 0.5 * dim)).toFixed(3)})`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: BAR.h,
            width: BAR.w * c01(prog),
            borderRadius: BAR.h / 2,
            background: `rgb(${ic.rgb})`,
            opacity: 0.35 + 0.65 * dim,
          }}
        />
      </div>
    </div>
  );
};

export const Row: React.FC<{ cam: Cam; f: number }> = ({ cam, f }) => (
  <>
    {ICONS.map((ic) => (
      <RowItem key={ic.id} ic={ic} cam={cam} f={f} />
    ))}
  </>
);
