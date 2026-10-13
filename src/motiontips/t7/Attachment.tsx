import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile } from "remotion";
import { CLAUDE_DARK } from "../../artcraft/theme";
import { PsIcon } from "../../artcraft/p5/glyphs";
import { BADGE, CARD, FILES, NAME, RIDE, ROW_TOP, THUMB, badgeIn, cardIn, flightAt, nameIn, slotX, wrapName } from "./plan";

// ===========================================================================
// One attachment, in three layers so the file's own thumbnail can travel:
//   CardChrome  the claude.ai file card (as in 02-attached.png: dark card,
//               lifted border, the file name top left); builds around the
//               thumbnail as it lands.
//   Thumb       the file itself (its real image, the playing video, or the
//               real mark), dragged in along the trace, then sitting in the
//               card's lower area.
//   Badge       the file type badge, bottom left, over the thumbnail.
// World px. Card and badge share one transform so they scale together.
// ===========================================================================

const INK = CLAUDE_DARK.text;
const CARD_BG = "#1A1A19";
const ORIGIN = `${THUMB.x + THUMB.w / 2}px ${THUMB.y + THUMB.h / 2}px`;

const cardBox = (i: number, k: number): React.CSSProperties => ({
  position: "absolute",
  left: slotX(i),
  top: ROW_TOP,
  width: CARD.w,
  height: CARD.h,
  transformOrigin: ORIGIN,
  transform: `scale(${(0.94 + 0.06 * k).toFixed(4)})`,
});

export const CardChrome: React.FC<{ i: number; f: number; font: string }> = ({ i, f, font }) => {
  const k = cardIn(i, f);
  if (k <= 0.001) return null;
  const n = nameIn(i, f);
  return (
    <div
      style={{
        ...cardBox(i, k),
        boxSizing: "border-box",
        borderRadius: CARD.r,
        background: CARD_BG,
        border: "2px solid rgba(255,255,255,0.42)",
        opacity: k,
        fontFamily: font,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: NAME.x - 2,
          top: NAME.top,
          width: CARD.w - 2 * NAME.x + 4,
          fontSize: NAME.font,
          lineHeight: `${NAME.line}px`,
          fontWeight: 500,
          letterSpacing: -0.2,
          color: INK,
          opacity: n,
          transform: `translateY(${((1 - n) * 8).toFixed(2)}px)`,
        }}
      >
        {wrapName(FILES[i].name)}
      </div>
    </div>
  );
};

export const Badge: React.FC<{ i: number; f: number; font: string }> = ({ i, f, font }) => {
  const b = badgeIn(i, f);
  if (b <= 0.001) return null;
  return (
    <div style={cardBox(i, cardIn(i, f))}>
      <div
        style={{
          position: "absolute",
          left: THUMB.x + BADGE.inset,
          bottom: CARD.h - THUMB.y - THUMB.h + BADGE.inset,
          padding: "3px 11px",
          borderRadius: 8,
          background: "rgba(22,22,21,0.92)",
          border: "2px solid rgba(255,255,255,0.45)",
          fontFamily: font,
          fontSize: BADGE.font,
          lineHeight: "30px",
          fontWeight: 500,
          color: INK,
          opacity: b,
          transform: `translateY(${((1 - b) * 6).toFixed(2)}px)`,
        }}
      >
        {FILES[i].type}
      </div>
    </div>
  );
};

const fill: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" };

const ThumbContent: React.FC<{ i: number }> = ({ i }) => {
  const file = FILES[i];
  if (file.kind === "img") {
    return (
      <Img
        src={staticFile(file.src!)}
        style={{ ...fill, objectFit: "cover", objectPosition: file.pos ?? "50% 50%", filter: file.dim && file.dim !== 1 ? `brightness(${file.dim})` : undefined }}
      />
    );
  }
  if (file.kind === "video") {
    // the reference video plays from the moment it is dragged in
    return (
      <Sequence from={RIDE[i]} layout="none">
        <OffthreadVideo
          src={staticFile(file.src!)}
          muted
          style={{ ...fill, objectFit: "cover", transform: "scale(1.4)", transformOrigin: "64% 38%", filter: file.dim ? `brightness(${file.dim})` : undefined }}
        />
      </Sequence>
    );
  }
  if (file.kind === "claude") {
    const s = THUMB.w * 0.5;
    return <Img src={staticFile(file.src!)} style={{ position: "absolute", left: (THUMB.w - s) / 2, top: (THUMB.h - s) / 2, width: s, height: s, opacity: 0.94 }} />;
  }
  const w = THUMB.w * 0.48;
  return <PsIcon width={w} style={{ position: "absolute", left: (THUMB.w - w) / 2, top: (THUMB.h - (w * 234) / 240) / 2 }} />;
};

export const Thumb: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  const fl = flightAt(i, f);
  if (!fl.started) return null;
  // its own edge reads while it rides the line; once in the card it is just the preview
  const edge = 0.46 - 0.26 * fl.uy;
  return (
    <div
      style={{
        position: "absolute",
        left: fl.x - THUMB.w / 2,
        top: fl.y - THUMB.h / 2,
        width: THUMB.w,
        height: THUMB.h,
        transform: `scale(${fl.s.toFixed(4)})`,
        borderRadius: THUMB.r,
        overflow: "hidden",
        background: "#141413",
      }}
    >
      <ThumbContent i={i} />
      <div style={{ position: "absolute", inset: 0, borderRadius: THUMB.r, border: `2px solid rgba(255,255,255,${edge.toFixed(3)})` }} />
    </div>
  );
};
