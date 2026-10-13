import React from "react";
import { Img, staticFile } from "remotion";
import { PH } from "../theme";
import { CARDS, SLOTS, cardAlpha, cardVisible, type CardDef } from "./plan";

// ===========================================================================
// The "slideshow": real UI cards (crops of real app screenshots) that fade in
// one after another and sit there. Opacity only. No slide, no scale, no float:
// the content never moves. A later card in the same slot fades in over the
// older one, and the older one is dropped once it is covered.
// ===========================================================================

const Card: React.FC<{ c: CardDef; a: number }> = ({ c, a }) => {
  const s = SLOTS[c.slot];
  return (
    <div
      style={{
        position: "absolute",
        left: s.x,
        top: s.y,
        width: s.w,
        height: s.h,
        opacity: a,
        borderRadius: 14,
        overflow: "hidden",
        background: PH.panel,
      }}
    >
      <Img src={staticFile(c.src)} style={{ width: "100%", height: "100%", display: "block", filter: `brightness(${c.dim})` }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 14, border: "2px solid rgba(233,231,226,0.42)" }} />
    </div>
  );
};

export const Slideshow: React.FC<{ f: number }> = ({ f }) => (
  <>
    {CARDS.map((c, i) => (cardVisible(i, f) ? <Card key={i} c={c} a={cardAlpha(c, f)} /> : null))}
  </>
);
