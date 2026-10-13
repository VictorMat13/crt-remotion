import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { appShot } from "../theme";
import { Tick } from "./glyphs";
import { CANVAS, CROP_T, DECEL, ENTER, EXPORT_T, MARK_T, PRESS, RESIZE_T, SIDE, WIN, WIN_IN, c01, clamp, seg } from "./rig";

// ===========================================================================
// The custom app Claude builds: a dark desktop window that assembles panel by
// panel (frame + title bar, canvas, sidebar), with great-wave.jpg cropped out
// of the real PhotoCraft screenshot. The sidebar is the app's feature list:
// each feature ticks on with its control, and that control works once on the
// picture: Crop (16:9 box eases in, outside dims, the crop applies), Resize
// (W x H tick 3200 x 1800 -> 1920 x 1080, the picture shrinks), Watermark
// ("© 2026" typed, it appears in the picture's corner). Then the one the person
// asks for adds itself: Export PNG. Text >= 34px world (>= 30px on screen).
// ===========================================================================

const SHOT = staticFile(appShot("photocraft"));
const SHOT_W = 1600;
// great-wave.jpg's canvas region inside the PhotoCraft screenshot (1600x1000, measured)
const DOC = { x: 92, y: 148, w: 1162, h: 781 } as const;
// the 16:9 crop, screenshot px: 3200 x 1800 doc px (3859 doc px = 1162 shot px), clear of the caption card
const CROP = { x: 212, y: 166, w: 963.6, h: 542 } as const;

type R = { x: number; y: number; w: number; h: number };
const lerpR = (a: R, b: R, t: number): R => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t });

// canvas-local rects
const IMG_W = CANVAS.w - 40;
const IMG0: R = { x: 20, y: (CANVAS.h - (IMG_W * DOC.h) / DOC.w) / 2, w: IMG_W, h: (IMG_W * DOC.h) / DOC.w };
const K0 = IMG_W / DOC.w;
/** the crop box, relative to IMG0 */
const BOX1: R = { x: (CROP.x - DOC.x) * K0, y: (CROP.y - DOC.y) * K0, w: CROP.w * K0, h: CROP.h * K0 };
const BOX0: R = { x: 0, y: 0, w: IMG0.w, h: IMG0.h };
const CROPPED: R = { x: 20, y: (CANVAS.h - (IMG_W * 9) / 16) / 2, w: IMG_W, h: (IMG_W * 9) / 16 };
const SHRUNK = 0.86;
const RESIZED: R = { w: IMG_W * SHRUNK, h: ((IMG_W * 9) / 16) * SHRUNK, x: (CANVAS.w - IMG_W * SHRUNK) / 2, y: (CANVAS.h - ((IMG_W * 9) / 16) * SHRUNK) / 2 };

// beats
const BOX_IN: [number, number] = [CROP_T + 4, CROP_T + 18];
const APPLY: [number, number] = [CROP_T + 20, CROP_T + 31];
const SHRINK: [number, number] = [RESIZE_T + 4, RESIZE_T + 20];
const TYPE: [number, number] = [MARK_T + 3, MARK_T + 11];
const MARK = "© 2026";

const PANEL = "#121419";
const TITLE_BG = "#1E2128";
const SIDE_BG = "#171A20";
const EDGE = "rgba(255,255,255,0.5)";
const SEP = "rgba(255,255,255,0.32)";
const INK = "#EEECE7";
const SOFT = "#B9BDC6";
const BLUE = "#3A86FF";
const BLUE_RGB = "58,134,255";

const riseAt = (f: number, at: number, dy = 14, len = 12) => {
  const k = interpolate(f, [at, at + len], [0, 1], { ...clamp, easing: ENTER });
  return { k, style: { opacity: k, transform: `translateY(${((1 - k) * dy).toFixed(2)}px)` } as React.CSSProperties };
};

/** the picture: the screenshot's source rect `src` shown in canvas rect `c` */
const Picture: React.FC<{ c: R; src: R; children?: React.ReactNode; style?: React.CSSProperties }> = ({ c, src, children, style }) => {
  const s = c.w / src.w;
  return (
    <div style={{ position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, overflow: "hidden", ...style }}>
      <Img
        src={SHOT}
        style={{
          position: "absolute",
          left: -src.x * s,
          top: -src.y * s,
          width: SHOT_W * s,
          height: 1000 * s,
          maxWidth: "none",
          // the cream sky blooms to white in the tube: dim it hard
          filter: "brightness(0.6)",
        }}
      />
      {children}
    </div>
  );
};

const CropBox: React.FC<{ b: R; dim: number; handles: number }> = ({ b, dim, handles }) => {
  const arm = 30;
  const th = 6;
  const corner = (key: string, x: number, y: number, sx: 1 | -1, sy: 1 | -1) => (
    <React.Fragment key={key}>
      <div style={{ position: "absolute", left: sx > 0 ? x - th / 2 : x - arm + th / 2, top: y - th / 2, width: arm, height: th, background: "#FFFFFF", opacity: handles }} />
      <div style={{ position: "absolute", left: x - th / 2, top: sy > 0 ? y - th / 2 : y - arm + th / 2, width: th, height: arm, background: "#FFFFFF", opacity: handles }} />
    </React.Fragment>
  );
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: b.x,
          top: b.y,
          width: b.w,
          height: b.h,
          boxSizing: "border-box",
          border: `3px solid rgba(255,255,255,${(0.95 * handles).toFixed(3)})`,
          boxShadow: `0 0 0 1400px rgba(0,0,0,${dim.toFixed(3)})`,
        }}
      >
        {/* rule of thirds */}
        {[1, 2].map((i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: (b.w * i) / 3 - 1, top: 0, width: 2, height: "100%", background: `rgba(255,255,255,${(0.42 * handles).toFixed(3)})` }} />
            <div style={{ position: "absolute", top: (b.h * i) / 3 - 1, left: 0, height: 2, width: "100%", background: `rgba(255,255,255,${(0.42 * handles).toFixed(3)})` }} />
          </React.Fragment>
        ))}
      </div>
      {corner("tl", b.x, b.y, 1, 1)}
      {corner("tr", b.x + b.w, b.y, -1, 1)}
      {corner("bl", b.x, b.y + b.h, 1, -1)}
      {corner("br", b.x + b.w, b.y + b.h, -1, -1)}
    </>
  );
};

const Checkbox: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const fill = interpolate(f, [at, at + 3], [0, 1], clamp);
  const k = seg(f, at + 1, at + 7, DECEL);
  return (
    <div
      style={{
        position: "absolute",
        left: 22,
        top: 0,
        width: 40,
        height: 40,
        boxSizing: "border-box",
        borderRadius: 10,
        border: `2.5px solid ${fill > 0.5 ? BLUE : "rgba(255,255,255,0.65)"}`,
        background: `rgba(${BLUE_RGB},${fill.toFixed(3)})`,
        display: "grid",
        placeItems: "center",
      }}
    >
      <Tick size={34} k={k} color="#FFFFFF" sw={3.4} />
    </div>
  );
};

const Section: React.FC<{ f: number; at: number; top: number; label: string; font: string; children: React.ReactNode }> = ({ f, at, top, label, font, children }) => {
  const head = riseAt(f, at - 2, 16);
  const ctl = riseAt(f, at + 3, 12);
  if (head.k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, top, width: SIDE.w, fontFamily: font }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: SIDE.w, height: 40, ...head.style }}>
        <Checkbox f={f} at={at} />
        <div style={{ position: "absolute", left: 76, top: 0, height: 40, lineHeight: "40px", fontSize: 36, fontWeight: 500, color: INK, whiteSpace: "nowrap" }}>{label}</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 60, width: SIDE.w, height: 56, ...ctl.style }}>{children}</div>
    </div>
  );
};

const Chip: React.FC<{ x: number; w: number; label: string; on: number }> = ({ x, w, label, on }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: 0,
      width: w,
      height: 56,
      boxSizing: "border-box",
      borderRadius: 12,
      border: `2.5px solid ${on > 0.5 ? BLUE : "rgba(255,255,255,0.4)"}`,
      background: `rgba(${BLUE_RGB},${(0.24 * on).toFixed(3)})`,
      color: on > 0.5 ? INK : SOFT,
      fontSize: 34,
      fontWeight: 500,
      lineHeight: "51px",
      textAlign: "center",
    }}
  >
    {label}
  </div>
);

const Field: React.FC<{ x: number; w: number; mono?: string; align?: "center" | "left"; children: React.ReactNode }> = ({ x, w, mono, align = "center", children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: 0,
      width: w,
      height: 56,
      boxSizing: "border-box",
      borderRadius: 10,
      border: "2px solid rgba(255,255,255,0.42)",
      background: "#0C0E12",
      color: INK,
      fontSize: 34,
      fontFamily: mono,
      fontWeight: 500,
      lineHeight: "52px",
      textAlign: align,
      paddingLeft: align === "left" ? 14 : 0,
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {children}
  </div>
);

export const AppWindow: React.FC<{ f: number; font: string; mono: string }> = ({ f, font, mono }) => {
  const enter = interpolate(f, [WIN_IN, WIN_IN + 14], [0, 1], { ...clamp, easing: ENTER });
  if (enter <= 0) return null;
  const lights = riseAt(f, WIN_IN + 2, 8);
  const title = riseAt(f, WIN_IN + 4, 8);
  const canvas = riseAt(f, WIN_IN + 5, 0, 10);
  const pic = riseAt(f, WIN_IN + 7, 18);
  const sideK = seg(f, WIN_IN + 9, WIN_IN + 21, ENTER);

  // crop
  const boxT = seg(f, BOX_IN[0], BOX_IN[1]);
  const box = lerpR(BOX0, BOX1, boxT);
  const dim = 0.62 * seg(f, BOX_IN[0], BOX_IN[0] + 8, DECEL) + 0.38 * seg(f, APPLY[0] - 3, APPLY[0], DECEL);
  const handles = (f < BOX_IN[0] ? 0 : 1) * (1 - seg(f, APPLY[0] - 2, APPLY[0] + 4, DECEL));
  const applied = f >= APPLY[0];
  const applyT = seg(f, APPLY[0], APPLY[1]);
  const boxInCanvas: R = { x: IMG0.x + BOX1.x, y: IMG0.y + BOX1.y, w: BOX1.w, h: BOX1.h };
  // resize
  const shrinkT = seg(f, SHRINK[0], SHRINK[1]);
  const c = !applied ? IMG0 : f < SHRINK[0] ? lerpR(boxInCanvas, CROPPED, applyT) : lerpR(CROPPED, RESIZED, shrinkT);
  const wNow = Math.round(interpolate(f, [SHRINK[0], SHRINK[1] - 2], [3200, 1920], { ...clamp, easing: DECEL }));
  const hNow = Math.round((wNow * 9) / 16);
  const outline = interpolate(f, [SHRINK[0], SHRINK[0] + 3, SHRINK[1], SHRINK[1] + 10], [0, 0.6, 0.6, 0], clamp);
  // watermark
  const typed = MARK.slice(0, Math.round(interpolate(f, TYPE, [0, MARK.length], clamp)));
  const typing = f >= TYPE[0] - 2 && f <= TYPE[1] + 14;
  // export
  const exp = riseAt(f, EXPORT_T, 18);
  const press = interpolate(f, [PRESS, PRESS + 2, PRESS + 6], [0, 1, 0], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: WIN.left,
        top: WIN.top,
        width: WIN.w,
        height: WIN.h,
        boxSizing: "border-box",
        borderRadius: 22,
        background: PANEL,
        border: `2.5px solid ${EDGE}`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        overflow: "hidden",
        fontFamily: font,
        opacity: Math.min(1, enter * 2.2),
        transform: `translateY(${((1 - enter) * 34).toFixed(2)}px) scale(${(0.982 + 0.018 * enter).toFixed(4)})`,
      }}
    >
      {/* title bar */}
      <div style={{ position: "absolute", left: 0, top: 0, width: WIN.w, height: WIN.title, background: TITLE_BG, borderBottom: `2px solid ${SEP}`, boxSizing: "border-box" }}>
        <div style={{ position: "absolute", left: 26, top: WIN.title / 2 - 11, display: "flex", gap: 13, ...lights.style }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((col) => (
            <div key={col} style={{ width: 22, height: 22, borderRadius: 11, background: col }} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, width: WIN.w, top: 0, height: WIN.title, lineHeight: `${WIN.title}px`, textAlign: "center", fontSize: 34, fontWeight: 500, color: INK, ...title.style }}>
          great-wave.jpg
        </div>
      </div>

      {/* canvas */}
      <div style={{ position: "absolute", left: 0, top: WIN.title, width: CANVAS.w, height: CANVAS.h, background: "#0B0C0F", opacity: canvas.k }}>
        <div style={{ position: "absolute", inset: 0, ...pic.style }}>
          {outline > 0.01 ? (
            <div
              style={{
                position: "absolute",
                left: CROPPED.x,
                top: CROPPED.y,
                width: CROPPED.w,
                height: CROPPED.h,
                boxSizing: "border-box",
                border: `2.5px dashed rgba(255,255,255,${outline.toFixed(3)})`,
              }}
            />
          ) : null}
          <Picture c={c} src={applied ? CROP : DOC}>
            {!applied && boxT > 0 ? <CropBox b={box} dim={dim} handles={handles} /> : null}
            {typed.length > 0 ? (
              <div
                style={{
                  position: "absolute",
                  right: 14,
                  bottom: 8,
                  fontSize: 34,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.86)",
                  whiteSpace: "nowrap",
                  letterSpacing: 0.2,
                }}
              >
                {typed}
              </div>
            ) : null}
          </Picture>
        </div>
      </div>

      {/* sidebar: the feature list */}
      <div
        style={{
          position: "absolute",
          left: CANVAS.w,
          top: WIN.title,
          width: SIDE.w,
          height: SIDE.h,
          background: SIDE_BG,
          opacity: sideK,
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: 2, height: SIDE.h * sideK, background: SEP }} />
        <Section f={f} at={CROP_T} top={30} label="Crop" font={font}>
          <Chip x={22} w={80} label="1:1" on={0} />
          <Chip x={114} w={108} label="16:9" on={c01((f - CROP_T - 4) / 2)} />
        </Section>
        <Section f={f} at={RESIZE_T} top={180} label="Resize" font={font}>
          <Field x={22} w={108} mono={mono}>
            {wNow}
          </Field>
          <div style={{ position: "absolute", left: 130, width: 40, top: 0, lineHeight: "56px", textAlign: "center", fontSize: 34, color: SOFT }}>×</div>
          <Field x={170} w={108} mono={mono}>
            {hNow}
          </Field>
        </Section>
        <Section f={f} at={MARK_T} top={330} label="Watermark" font={font}>
          <Field x={22} w={256} align="left">
            <span>{typed}</span>
            {typing ? (
              <span style={{ display: "inline-block", width: 3, height: 38, marginLeft: 3, verticalAlign: "-7px", background: INK, opacity: f <= TYPE[1] || Math.floor(f / 8) % 2 === 0 ? 0.95 : 0 }} />
            ) : null}
          </Field>
        </Section>
        {exp.k > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 22,
              top: 492,
              width: 256,
              height: 66,
              borderRadius: 14,
              background: BLUE,
              color: "#FFFFFF",
              fontSize: 34,
              fontWeight: 600,
              lineHeight: "66px",
              textAlign: "center",
              whiteSpace: "nowrap",
              ...exp.style,
              transform: `${exp.style.transform} scale(${(1 - 0.05 * press).toFixed(4)})`,
              filter: press > 0.01 ? `brightness(${(1 - 0.2 * press).toFixed(3)})` : undefined,
            }}
          >
            Export PNG
          </div>
        ) : null}
      </div>
    </div>
  );
};

/** the Export PNG button's centre, world px (for the cursor) */
export const EXPORT_BTN = { x: SIDE.left + 22 + 128, y: SIDE.top + 492 + 33, w: 256, h: 66 } as const;
