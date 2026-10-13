import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile } from "remotion";
import { ARRIVE, ALL_PACKETS, CROP, DECEL, ENTER, OUT, OUT_H, OUT_S, P2_FROM, SCX, SCY, STATE_LEN, c01, seg, worldTf, type Cam } from "./plan";
import { SHOT_SRC } from "./Refs";

// ===========================================================================
// The output frame, hanging from the trace. Its picture lives in the P2
// graphic's own pixel space (1080x1920), cropped to CROP and scaled to the
// frame. It steps through real states, one per reference:
//   0  a plain gray ground (nothing yet)
//   1  rough: the PhotoCraft screenshot dropped on that plain gray ground
//   2  the right look: a real CRT check frame from the ArtCraft P2 build
//      (out/artcraft/AcP2SameShortcuts-f120.png, an earlier check render: the
//      final layout in an older grade, a still)
//   3  the delivered P2 graphic, playing ("These are apps people (9x16).mp4")
// States 0-2 and the frame's edge are drawn inside the tube (<Output>). The
// delivered graphic is already a CRT Scope render (same tube, same grade), so
// state 3 (<FinalPicture>) is laid over the tube untouched: through a second
// tube pass its canvas floods with halation and the whole picture goes soft.
// It gets the tube's own vignette so it sits in the glass like the rest.
// ===========================================================================

const P2_STILL = "motiontips/t8/acp2-f120.png"; // 1080x1920, earlier check render of AcP2
const P2_CLIP = "motiontips/t8/these-are-apps-people-9x16.mp4"; // 1080x1920, 240f

/** the rough pass: the screenshot dropped full width onto a plain gray ground (no layout yet) */
const GRAY = "#4A4C50"; // reads as a plain mid gray once the tube's halation lifts it
const ROUGH = { x: 40, y: 320, w: 1000, h: 625 } as const;

/** an already-CRT still inside the tube: compress its range so the canvas doesn't
 * bloom out and the dark UI doesn't sink under the second grade */
const CRT_IN_CRT = "contrast(0.78) brightness(0.98)";

const EDGE_W = 2.5;
const RADIUS = 16;

const stateOn = (f: number, k: number) => seg(f, ARRIVE[k], ARRIVE[k] + STATE_LEN, ENTER);

const Layer: React.FC<{ o: number; children: React.ReactNode }> = ({ o, children }) =>
  o > 0.002 ? <div style={{ position: "absolute", inset: 0, opacity: o }}>{children}</div> : null;

/** P2 pixel space, cropped and scaled into the frame */
const P2Space: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: -CROP.x * OUT_S,
      top: -CROP.y * OUT_S,
      width: 1080,
      height: 1920,
      transform: `scale(${OUT_S})`,
      transformOrigin: "0 0",
    }}
  >
    {children}
  </div>
);

/** inside the tube: states 0-2 and the frame's edge (world px) */
export const Output: React.FC<{ f: number }> = ({ f }) => {
  const s1 = stateOn(f, 0);
  const s2 = stateOn(f, 1);

  // edge: lights on every packet that arrives
  let hit = 0;
  for (const p of ALL_PACKETS) {
    const a = p.at + p.len;
    const big = p.amp > 15 ? 1 : 0.55;
    hit = Math.max(hit, big * c01((f - a + 1) / 2) * (1 - seg(f, a + 1, a + 18, DECEL)));
  }

  // the rough render drifts like a default slow zoom; the still eases in slightly
  const roughScale = 1 + 0.04 * seg(f, ARRIVE[0], ARRIVE[0] + 80, DECEL);
  const stillScale = 1.04 - 0.04 * seg(f, ARRIVE[1] - 4, ARRIVE[2] + 12, DECEL);

  return (
    <div
      style={{
        position: "absolute",
        left: OUT.x,
        top: OUT.top,
        width: OUT.w,
        height: OUT_H,
        borderRadius: RADIUS,
        overflow: "hidden",
        background: "#000",
      }}
    >
      <P2Space>
        {/* each state fades in over the one below, which stays solid until it is covered */}
        {/* 0 + 1: the plain gray ground, the screenshot dropped on it */}
        <Layer o={s2 < 0.999 ? 1 : 0}>
          <div style={{ position: "absolute", inset: 0, background: GRAY }} />
          <Layer o={s1}>
            <Img
              src={staticFile(SHOT_SRC)}
              style={{
                position: "absolute",
                left: ROUGH.x,
                top: ROUGH.y,
                width: ROUGH.w,
                height: ROUGH.h,
                objectFit: "cover",
                transform: `scale(${roughScale.toFixed(4)})`,
                filter: "brightness(0.74)",
              }}
            />
          </Layer>
        </Layer>

        {/* 2: the right look (real CRT check render from the P2 build) */}
        <Layer o={s2}>
          <Img
            src={staticFile(P2_STILL)}
            style={{
              position: "absolute",
              inset: 0,
              width: 1080,
              height: 1920,
              transform: `scale(${stillScale.toFixed(4)})`,
              transformOrigin: "50% 60%",
              filter: CRT_IN_CRT,
            }}
          />
        </Layer>
      </P2Space>

      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: RADIUS,
          border: `${EDGE_W}px solid rgba(233,231,226,${(0.5 + 0.45 * hit).toFixed(3)})`,
        }}
      />
    </div>
  );
};

/** over the tube: the delivered graphic, playing (P2 frame == comp frame), inside the frame's edge */
export const FinalPicture: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const s3 = stateOn(f, 2);
  if (f < P2_FROM || s3 < 0.002) return null;
  const ix = OUT.x + EDGE_W;
  const iy = OUT.top + EDGE_W;
  // the tube's vignette (kit/Tube -> fish8/crt: ellipse 78% x 74% of the screen,
  // centred), expressed in this picture's own world px
  const vx = cam.x + (540 - SCX) / cam.z - ix;
  const vy = cam.y + (960 - SCY) / cam.z - iy;
  const rx = (0.78 * 1080) / cam.z;
  const ry = (0.74 * 1920) / cam.z;
  return (
    <AbsoluteFill style={{ opacity: s3 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: worldTf(cam) }}>
        <div
          style={{
            position: "absolute",
            left: ix,
            top: iy,
            width: OUT.w - 2 * EDGE_W,
            height: OUT_H - 2 * EDGE_W,
            borderRadius: RADIUS - EDGE_W,
            overflow: "hidden",
            background: "#000",
          }}
        >
          <div style={{ position: "absolute", left: -EDGE_W, top: -EDGE_W, width: OUT.w, height: OUT_H }}>
            <P2Space>
              <Sequence from={P2_FROM} layout="none">
                <OffthreadVideo
                  src={staticFile(P2_CLIP)}
                  trimBefore={P2_FROM}
                  muted
                  style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}
                />
              </Sequence>
            </P2Space>
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse ${rx.toFixed(1)}px ${ry.toFixed(1)}px at ${vx.toFixed(1)}px ${vy.toFixed(1)}px, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 85%, rgba(0,0,0,0.92) 100%)`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
