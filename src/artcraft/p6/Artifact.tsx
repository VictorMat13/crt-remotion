import React from "react";
import { Img, interpolate, interpolateColors, staticFile } from "remotion";
import { appShot } from "../theme";
import {
  APPLY,
  APPLY_K,
  APP_HEAD,
  APP_IN,
  APP,
  CHIP,
  CHIP_IN,
  CLICK_EXPORT,
  CLICK_W,
  CROP_END,
  CTRL,
  CODE_OUT,
  DECEL,
  DRAG,
  ENTER,
  EXPORT,
  FILE_OUT,
  H_IN,
  LABEL_TOP,
  KEYS,
  LOCK,
  PANEL,
  PANEL_W,
  PRESS,
  RELEASE,
  S0,
  SELECT,
  SRC,
  STAGE,
  STAGE_H0,
  STAGE_H1,
  TOGGLE,
  TRAVEL,
  TYPED,
  W_IN,
  clamp,
} from "./plan";
import { CodeView } from "./CodeView";
import { CloseX, CopyIcon, DownloadIcon, Lock } from "./glyphs";
import { C, UI_FONT } from "./ui";

// ===========================================================================
// The claude.ai artifact panel (dark): header with the Preview | Code toggle
// and the artifact's title, then the body: the Code view while Claude writes,
// the built app once the toggle flips. The app is drawn exactly as its source
// (p6/code.ts) lays it out, at reading size: file name + Open image, the
// stage (great-wave.jpg cropped out of the real PhotoCraft screenshot) with
// the crop box and its 8 handles, Width / lock / Height, Export PNG, and the
// browser's download chip.
// ===========================================================================

const TITLE = "Photo Crop & Resize";
const SHOT = staticFile(appShot("photocraft"));
// great-wave.jpg's canvas region inside the PhotoCraft screenshot (1600x1000, measured)
const DOC = { x: 92, y: 148, w: 1162, h: 781 } as const;
const DOC_S = STAGE.w / DOC.w;

const rise = (frame: number, at: number, dy = 16) => {
  const k = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: ENTER });
  return { opacity: k, transform: `translateY(${((1 - k) * dy).toFixed(2)}px)` };
};
const press = (frame: number, at: number) => interpolate(frame, [at, at + 2, at + 6], [0, 1, 0], clamp);

// ---------------------------------------------------------------- header
const SEG = [
  { label: "Preview", w: 174 },
  { label: "Code", w: 128 },
] as const;
const TOG = { left: 22, top: 20, h: 58, pad: 5 } as const;

const Header: React.FC<{ frame: number }> = ({ frame }) => {
  const t = interpolate(frame, TOGGLE, [0, 1], { ...clamp, easing: TRAVEL }); // 0 = Code, 1 = Preview
  const pillX = TOG.pad + (1 - t) * SEG[0].w;
  const pillW = SEG[1].w + (SEG[0].w - SEG[1].w) * t;
  const trackW = SEG[0].w + SEG[1].w + 2 * TOG.pad;
  const titleX = TOG.left + trackW + 24;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: TOG.left,
          top: TOG.top,
          width: trackW,
          height: TOG.h,
          boxSizing: "border-box",
          borderRadius: 14,
          background: C.track,
          border: `2px solid ${C.edgeSoft}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: pillX - 2,
            top: TOG.pad - 2,
            width: pillW,
            height: TOG.h - 2 * TOG.pad,
            boxSizing: "border-box",
            borderRadius: 10,
            background: C.pill,
            border: `2px solid ${C.edge}`,
          }}
        />
        {SEG.map((s, i) => {
          // Preview lights up as the pill arrives; Code dims as it leaves
          const on = i === 0 ? t : 1 - t;
          return (
            <div
              key={s.label}
              style={{
                position: "absolute",
                left: TOG.pad - 2 + (i === 0 ? 0 : SEG[0].w),
                top: 0,
                width: s.w,
                height: TOG.h - 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                fontWeight: 500,
                color: interpolateColors(on, [0, 1], [C.muted, C.ink]),
              }}
            >
              {s.label}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: titleX, top: TOG.top, height: TOG.h, display: "flex", alignItems: "center", fontSize: 34, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>
        {TITLE}
      </div>
      <CopyIcon size={34} color={C.muted} sw={1.6} style={{ position: "absolute", left: PANEL_W - 128, top: TOG.top + 12 }} />
      <CloseX size={32} color={C.muted} sw={2} style={{ position: "absolute", left: PANEL_W - 62, top: TOG.top + 13 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: PANEL.header - 2, height: 2, background: C.hair }} />
    </>
  );
};

// ---------------------------------------------------------------- app state
export const appState = (f: number) => {
  const d = interpolate(f, DRAG, [0, 1], { ...clamp, easing: TRAVEL });
  const a = interpolate(f, APPLY, [0, 1], { ...clamp, easing: TRAVEL });
  const cw0 = STAGE.w + (CROP_END.w - STAGE.w) * d;
  const ch0 = STAGE_H0 + (CROP_END.h - STAGE_H0) * d;
  const cw = cw0 + (STAGE.w - cw0) * a;
  const ch = ch0 + (STAGE_H1 - ch0) * a;
  const stageH = STAGE_H0 + (STAGE_H1 - STAGE_H0) * a;
  const imgK = 1 + (APPLY_K - 1) * a;
  // fields
  let w = String(Math.round(f < RELEASE ? cw0 / S0 : CROP_END.w / S0));
  let h = String(Math.round(f < RELEASE ? ch0 / S0 : CROP_END.h / S0));
  if (f < PRESS) {
    w = String(SRC.w);
    h = String(SRC.h);
  }
  const typedN = KEYS.filter((k) => f >= k).length;
  if (typedN > 0) {
    w = TYPED.slice(0, typedN);
    h = String(Math.round(Number(w) / (CROP_END.w / CROP_END.h)));
  }
  return { cw, ch, stageH, imgK, w, h, typedN, applying: a };
};

/** world px of the bottom-right crop handle */
export const handleBR = (f: number) => {
  const s = appState(f);
  return { x: STAGE.left + s.cw, y: STAGE.top + s.ch };
};

// ---------------------------------------------------------------- app
const HANDLES: [number, number][] = [
  [0.5, 0], [0.5, 1], [1, 0.5], [0, 0.5],
  [1, 0], [0, 0], [1, 1], [0, 1],
];

const Field: React.FC<{
  left: number;
  w: number;
  value: string;
  focus?: number;
  selected?: boolean;
  caret?: boolean;
}> = ({ left, w, value, focus = 0, selected = false, caret = false }) => (
  <div
    style={{
      position: "absolute",
      left,
      top: CTRL.top,
      width: w,
      height: CTRL.h,
      boxSizing: "border-box",
      borderRadius: 12,
      background: C.field,
      border: `2px solid ${C.fieldEdge}`,
      boxShadow: focus > 0.01 ? `0 0 0 ${(3.5 * focus).toFixed(2)}px ${C.blue}` : undefined,
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      fontSize: 40,
      fontWeight: 500,
      fontVariantNumeric: "tabular-nums",
      color: C.ink,
    }}
  >
    <span style={{ position: "relative", padding: "2px 2px", borderRadius: 4, background: selected ? C.select : "transparent" }}>{value}</span>
    {caret ? <span style={{ display: "inline-block", width: 3, height: 46, marginLeft: 2, background: C.ink }} /> : null}
  </div>
);

export const AppPreview: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  if (f < APP_IN - 1) return null;
  const s = appState(f);
  const handleOn = interpolate(f, [APP_IN + 5, APP_IN + 13], [0, 1], { ...clamp, easing: ENTER });
  const grab = interpolate(f, [PRESS, PRESS + 3, RELEASE, RELEASE + 4], [0, 1, 1, 0], clamp);
  const focus = f >= CLICK_W + 1 && f < CLICK_EXPORT + 1 ? interpolate(f, [CLICK_W + 1, CLICK_W + 5], [0, 1], { ...clamp, easing: ENTER }) : 0;
  const selected = f >= SELECT && f < KEYS[0];
  const caretOn = focus > 0.5 && !selected && (s.typedN > 0 && s.typedN < TYPED.length ? true : Math.floor((f - CLICK_W) / 8) % 2 === 0);
  const expPress = press(f, CLICK_EXPORT);
  const chip = interpolate(f, [CHIP_IN, CHIP_IN + 12], [0, 1], { ...clamp, easing: ENTER });
  const arrow = interpolate(f, [CHIP_IN + 3, CHIP_IN + 15], [0, 1], { ...clamp, easing: DECEL });

  return (
    <div style={{ position: "absolute", left: -PANEL.left, top: -PANEL.top, width: 1080, height: 1920, fontFamily: UI_FONT }}>
      {/* header row: file name + Open image */}
      <div style={{ position: "absolute", left: APP.left, top: APP_HEAD.top, height: APP_HEAD.h, display: "flex", alignItems: "center", fontSize: 34, color: C.ink, ...rise(f, APP_IN) }}>
        great-wave.jpg
      </div>
      <div
        style={{
          position: "absolute",
          left: APP.right - 236,
          top: APP_HEAD.top + 4,
          width: 236,
          height: APP_HEAD.h - 8,
          boxSizing: "border-box",
          borderRadius: 12,
          border: `2px solid ${C.fieldEdge}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 34,
          color: C.ink,
          ...rise(f, APP_IN + 1),
        }}
      >
        Open image
      </div>

      {/* stage */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: STAGE.top,
          width: STAGE.w,
          height: s.stageH,
          overflow: "hidden",
          background: C.stage,
          ...rise(f, APP_IN + 2, 22),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: STAGE.w,
            height: STAGE_H0,
            overflow: "hidden",
            transform: `scale(${s.imgK.toFixed(5)})`,
            transformOrigin: "0 0",
            filter: "brightness(0.68)",
          }}
        >
          <Img src={SHOT} style={{ position: "absolute", left: -DOC.x * DOC_S, top: -DOC.y * DOC_S, width: 1600 * DOC_S, height: 1000 * DOC_S, maxWidth: "none" }} />
        </div>
        {/* crop box: 2px white border, everything outside dimmed (#0008), 8 handles */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: s.cw,
            height: s.ch,
            boxSizing: "border-box",
            border: "3px solid #FFFFFF",
            outline: "2px solid rgba(0,0,0,0.6)",
            boxShadow: "0 0 0 2400px rgba(0,0,0,0.53)",
            opacity: handleOn,
          }}
        >
          {HANDLES.map(([hx, hy], i) => {
            const isBR = hx === 1 && hy === 1;
            const sz = 30 * (isBR ? 1 + 0.18 * grab : 1);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `calc(${hx * 100}% - ${sz / 2}px)`,
                  top: `calc(${hy * 100}% - ${sz / 2}px)`,
                  width: sz,
                  height: sz,
                  boxSizing: "border-box",
                  background: "#FFFFFF",
                  border: "3px solid rgba(0,0,0,0.75)",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Width / lock / Height */}
      <div style={{ position: "absolute", inset: 0, ...rise(f, APP_IN + 4) }}>
        <div style={{ position: "absolute", left: W_IN.left + 2, top: LABEL_TOP, height: 44, display: "flex", alignItems: "center", fontSize: 34, color: C.label }}>Width</div>
        <Field left={W_IN.left} w={W_IN.w} value={s.w} focus={focus} selected={selected} caret={caretOn} />
        <div
          style={{
            position: "absolute",
            left: LOCK.left,
            top: CTRL.top,
            width: LOCK.w,
            height: CTRL.h,
            boxSizing: "border-box",
            borderRadius: 12,
            border: `2px solid ${C.blue}`,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Lock size={38} color={C.blue} sw={2} />
        </div>
        <div style={{ position: "absolute", left: H_IN.left + 2, top: LABEL_TOP, height: 44, display: "flex", alignItems: "center", fontSize: 34, color: C.label }}>Height</div>
        <Field left={H_IN.left} w={H_IN.w} value={s.h} />
      </div>

      {/* Export PNG */}
      <div style={{ position: "absolute", left: EXPORT.left, top: EXPORT.top, width: EXPORT.w, height: EXPORT.h, ...rise(f, APP_IN + 6) }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            background: C.button,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 600,
            color: "#FFFFFF",
            transform: `scale(${(1 - 0.04 * expPress).toFixed(4)})`,
            filter: expPress > 0.01 ? `brightness(${(1 - 0.2 * expPress).toFixed(3)})` : undefined,
          }}
        >
          Export PNG
        </div>
      </div>

      {/* the browser's download chip */}
      {chip > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: CHIP.left,
            top: CHIP.top + (1 - chip) * 26,
            width: CHIP.right - CHIP.left,
            height: CHIP.h,
            boxSizing: "border-box",
            padding: "0 20px 0 20px",
            borderRadius: 16,
            background: C.field,
            border: `2px solid ${C.edge}`,
            boxShadow: "0 18px 40px rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: Math.min(1, chip * 1.6),
            fontSize: 30,
            fontFeatureSettings: '"calt" 0',
            color: C.ink,
            whiteSpace: "nowrap",
          }}
        >
          <DownloadIcon size={38} color={C.check} sw={1.9} dy={-5 * (1 - arrow)} arrowOpacity={0.2 + 0.8 * arrow} />
          {FILE_OUT}
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- the panel
export const ArtifactPanel: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  // Code view leaves as the toggle flips; the app rises in under it
  const codeO = interpolate(f, CODE_OUT, [1, 0], { ...clamp, easing: DECEL });
  const codeDy = interpolate(f, CODE_OUT, [0, -18], { ...clamp, easing: DECEL });
  return (
    <div
      style={{
        position: "absolute",
        left: PANEL.left,
        top: PANEL.top,
        width: PANEL_W,
        height: PANEL.bottom - PANEL.top,
        boxSizing: "border-box",
        borderRadius: 18,
        background: C.panel,
        border: `2px solid ${C.edge}`,
        boxShadow: "0 30px 70px rgba(0,0,0,0.7)",
        overflow: "hidden",
        fontFamily: UI_FONT,
        zIndex: 5,
      }}
    >
      <Header frame={f} />
      <div style={{ position: "absolute", left: 0, right: 0, top: PANEL.header, bottom: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: -PANEL.header, width: PANEL_W, height: PANEL.bottom - PANEL.top }}>
          <CodeView frame={f} opacity={codeO} dy={codeDy} />
          <AppPreview frame={f} />
        </div>
      </div>
    </div>
  );
};

