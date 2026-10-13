import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { noise2D } from "@remotion/noise";
import { loadFont } from "@remotion/google-fonts/SourceSans3";

// Victor, Oct 13: "make it more like the first ten seconds of this YouTube
// video" (videolancer, "Creating a 3D Screen in Premiere Pro"): macro
// close-ups of a tilted screen, shallow depth of field, live typing, a cursor
// click, hard cuts that rack into focus. Same Photoshop screenshot as
// PsTiltCrt (Adobe's Microsoft Store shot, public/random/SOURCES.md); the
// Generative Fill panel's text and borders are redrawn crisp on top of it at
// the exact positions measured from that shot.

const { fontFamily } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export const PS_MACRO_DURATION = 300;

// ---- source geometry: pixel coords in the 1920x1080 store screenshot ----
const BASE = { x: 188, y: 152, w: 1514, h: 928 }; // ps-genfill-2x.png covers this rect
const PROMPT = "photo of northern lights at dusk";
const BUTTON = { x: 1551, y: 533, w: 138, h: 40 };
const THUMBS = [
  { x: 1348, y: 648, x1: 1451, y1: 723 },
  { x: 1463, y: 648, x1: 1566, y1: 723 },
  { x: 1578, y: 648, x1: 1681, y1: 723 },
];
const C = {
  panel: "#535353",
  field: "#454545",
  thumbs: "#4d4d4d",
  text: "#f0f0f0",
  label: "#d6d6d6",
  blue: "#0f64d2",
};
const TEXT_ASC = 0.812; // baseline offset for Source Sans 3 at line-height 1 (calibrated on a still)

type Cam = { lx: number; ly: number; rx: number; ry: number; tz: number };
type Shot = {
  from: number;
  dur: number;
  K: number;
  region: [number, number, number, number];
  cam: (f: number) => Cam;
};

const ease = Easing.bezier(0.45, 0, 0.55, 1);
const out = Easing.bezier(0.2, 0.7, 0.3, 1);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixCam = (a: Cam, b: Cam, t: number): Cam => ({
  lx: lerp(a.lx, b.lx, t),
  ly: lerp(a.ly, b.ly, t),
  rx: lerp(a.rx, b.rx, t),
  ry: lerp(a.ry, b.ry, t),
  tz: lerp(a.tz, b.tz, t),
});
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
// in-plane roll that lays text lines along the plane's iso-depth lines, so the
// focus band runs along the line being read (like a real tilted macro lens)
const alignRz = (rx: number, ry: number) =>
  deg(Math.atan((Math.sin(rad(ry)) * Math.cos(rad(rx))) / Math.sin(rad(rx))));
// screen angle of those iso-depth lines (parallel to the image plane)
const bandAngle = (rx: number, ry: number) =>
  deg(Math.atan(Math.sin(rad(ry)) / (Math.sin(rad(rx)) * Math.cos(rad(ry)))));

// typing: one character every ~1.75 frames with a little human jitter
const TYPE_START = 8;
const typedAt = (i: number) => TYPE_START + i * 1.75 + random(`ty-${i}`) * 1.3;
const TYPE_END = typedAt(PROMPT.length - 1);

const SHOTS: Shot[] = [
  {
    // A: the prompt types in, camera rides the caret
    from: 0,
    dur: 84,
    K: 5,
    region: [900, 250, 1760, 1000],
    cam: (f) => {
      const t = ease(clamp01((f - 6) / 66));
      return {
        ...mixCam(
          { lx: 1378, ly: 433, rx: -30, ry: -8, tz: 0 },
          { lx: 1552, ly: 436, rx: -27, ry: -10, tz: 80 },
          t,
        ),
        lx: lerp(1378, 1552, t),
      };
    },
  },
  {
    // B: cursor slides onto Generate and clicks
    from: 84,
    dur: 60,
    K: 5,
    region: [1380, 330, 1760, 760],
    cam: (f) =>
      mixCam(
        { lx: 1600, ly: 548, rx: 26, ry: 8, tz: 0 },
        { lx: 1626, ly: 556, rx: 23, ry: 6, tz: 70 },
        ease(f / 59),
      ),
  },
  {
    // C: sweep across the variations, the pick moves to the second one
    from: 144,
    dur: 78,
    K: 4,
    region: [1150, 180, 1760, 860],
    cam: (f) =>
      mixCam(
        { lx: 1398, ly: 684, rx: 30, ry: -9, tz: 0 },
        { lx: 1572, ly: 690, rx: 27, ry: -10, tz: 60 },
        ease(f / 77),
      ),
  },
  {
    // D: rack from the new Generative Layer out to the mountain, pulling back
    from: 222,
    dur: 78,
    K: 3,
    region: [100, 80, 1790, 1150],
    cam: (f) =>
      mixCam(
        { lx: 400, ly: 880, rx: 26, ry: -12, tz: 0 },
        { lx: 760, ly: 640, rx: 18, ry: -7, tz: -520 },
        ease(f / 77),
      ),
  },
];

const CLICK_B = 84 + 33; // press frames on Generate
const CLICK_C = 144 + 47; // press frames on variation 2

const cursorAt = (
  frame: number,
): { x: number; y: number; press: boolean } | null => {
  if (frame >= 84 && frame < 144) {
    const f = frame - 84;
    const t = out(clamp01((f - 2) / 24));
    return {
      x: lerp(1712, 1627, t) + Math.max(0, f - 26) * 0.08,
      y: lerp(628, 558, t),
      press: frame >= CLICK_B && frame < CLICK_B + 6,
    };
  }
  if (frame >= 144 && frame < 222) {
    const f = frame - 144;
    const t = out(clamp01((f - 14) / 28));
    return {
      x: lerp(1560, 1517, t) + Math.max(0, f - 42) * 0.1,
      y: lerp(800, 692, t),
      press: frame >= CLICK_C && frame < CLICK_C + 5,
    };
  }
  return null;
};

const Text: React.FC<{
  x: number;
  baseline: number;
  size: number;
  color: string;
  K: number;
  ox: number;
  oy: number;
  children: React.ReactNode;
}> = ({ x, baseline, size, color, K, ox, oy, children }) => (
  <div
    style={{
      position: "absolute",
      left: (x - ox) * K,
      top: (baseline - TEXT_ASC * size - oy) * K,
      fontFamily,
      fontSize: size * K,
      lineHeight: 1,
      color,
      whiteSpace: "pre",
    }}
  >
    {children}
  </div>
);

// The screen: Adobe's shot plus the crisp redraw of the Generative Fill panel.
const Screen: React.FC<{ shot: Shot; frame: number; calib?: boolean }> = ({
  shot,
  frame,
  calib,
}) => {
  const K = shot.K;
  const [ox, oy] = shot.region;
  const at = (
    x: number,
    y: number,
    w: number,
    h: number,
  ): React.CSSProperties => ({
    position: "absolute",
    left: (x - ox) * K,
    top: (y - oy) * K,
    width: w * K,
    height: h * K,
  });
  const patch = calib ? 0.45 : 1;

  // prompt state
  const typed = PROMPT.split("").filter((_, i) => frame >= typedAt(i)).length;
  const typing = frame < TYPE_END + 4;
  const caretOn =
    frame < 84 && (typing || Math.floor((frame - TYPE_END) / 15) % 2 === 1);

  // button state
  const cur = cursorAt(frame);
  const hover = frame >= 84 + 22 && frame < 144;
  const pressed = frame >= CLICK_B && frame < CLICK_B + 6;
  const selected = frame >= CLICK_C + 2 ? 1 : 0;
  const sel = THUMBS[selected];

  return (
    <>
      {/* monitor bezel + desktop behind the window cut-out */}
      <div
        style={{
          ...at(BASE.x - 30, BASE.y - 30, BASE.w + 60, BASE.h + 60),
          background: "#0b0b0c",
          borderRadius: 16 * K,
        }}
      />
      <div
        style={{ ...at(BASE.x, BASE.y, BASE.w, BASE.h), background: "#151619" }}
      />
      <Img
        src={staticFile("random/ps-genfill-2x.png")}
        style={at(BASE.x, BASE.y, BASE.w, BASE.h)}
      />

      {/* prompt field: empty, then typed live */}
      <div
        style={{
          ...at(1342, 417, 346, 109),
          background: C.field,
          opacity: patch,
        }}
      />
      <Text
        x={1348}
        baseline={435.5}
        size={16}
        color={C.text}
        K={K}
        ox={ox}
        oy={oy}
      >
        {PROMPT.slice(0, typed)}
        <span
          style={{
            display: "inline-block",
            width: 1.2 * K,
            height: 17 * K,
            marginLeft: 1 * K,
            verticalAlign: -3.5 * K,
            background: C.text,
            opacity: caretOn ? 1 : 0,
          }}
        />
      </Text>

      {/* "Prompt:" label */}
      <div
        style={{
          ...at(1340, 388, 62, 22),
          background: C.panel,
          opacity: patch,
        }}
      />
      <Text
        x={1343}
        baseline={402.5}
        size={15}
        color={C.label}
        K={K}
        ox={ox}
        oy={oy}
      >
        Prompt:
      </Text>

      {/* Generate button */}
      <div
        style={{
          ...at(BUTTON.x, BUTTON.y, BUTTON.w, BUTTON.h),
          boxSizing: "border-box",
          border: `${1 * K}px solid ${pressed ? "#9a9a9a" : hover ? "#8e8e8e" : "#7a7a7a"}`,
          borderRadius: 2 * K,
          background: pressed ? "#464646" : hover ? "#5d5d5d" : C.panel,
          opacity: calib ? 0.45 : 1,
        }}
      />
      <Img
        src={staticFile("random/ps-gen-icon.png")}
        style={{ ...at(1566, 539, 29, 29), opacity: pressed ? 0.85 : 1 }}
      />
      <Text
        x={1598}
        baseline={559.5}
        size={16.5}
        color={pressed ? "#d8d8d8" : C.text}
        K={K}
        ox={ox}
        oy={oy}
      >
        Generate
      </Text>

      {/* Variations header */}
      <div
        style={{
          ...at(1338, 597, 100, 20),
          background: C.panel,
          opacity: patch,
        }}
      />
      <svg style={at(1339, 599, 16, 11)} viewBox="0 0 16 11">
        <polyline
          points="2,3 7.5,8.5 13,3"
          fill="none"
          stroke="#c4c4c4"
          strokeWidth={1.3}
        />
      </svg>
      <Text
        x={1362}
        baseline={612.5}
        size={16.5}
        color={C.text}
        K={K}
        ox={ox}
        oy={oy}
      >
        Variations
      </Text>

      {/* selection ring: paint out the baked one, draw the live one */}
      {[
        [1345, 646, 109, 4],
        [1345, 722, 109, 5],
        [1345, 646, 4, 81],
        [1449, 646, 5, 81],
      ].map(([x, y, w, h], i) => (
        <div
          key={i}
          style={{ ...at(x, y, w, h), background: C.thumbs, opacity: patch }}
        />
      ))}
      <div
        style={{
          ...at(sel.x - 3, sel.y - 2, sel.x1 - sel.x + 6, sel.y1 - sel.y + 5),
          boxSizing: "border-box",
          border: `${4 * K}px solid ${C.blue}`,
        }}
      />

      {/* cursor */}
      {cur ? (
        <svg
          style={{
            ...at(cur.x, cur.y, 13, 20),
            transformOrigin: "0 0",
            transform: `scale(${cur.press ? 0.9 : 1})`,
            overflow: "visible",
          }}
          viewBox="0 0 13 20"
        >
          <path
            d="M1 1 L1 16.5 L4.8 12.9 L7.5 19 L10 17.9 L7.4 12 L12.4 12 Z"
            fill="#fff"
            stroke="#000"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </>
  );
};

// Handheld operator (Victor: "like somebody's actually recording it with a
// camera"): slow body sway, breathing, hand tremor, and the camera also
// pitches, yaws and drifts in depth a little, not just a flat 2D wobble.
// Seeded per shot, so every cut is its own take.
const handheld = (frame: number, fps: number, take: number) => {
  const t = frame / fps;
  const n = (k: string, freq: number) =>
    noise2D(`hh-${take}-${k}`, t * freq, 0);
  const breath = Math.sin(t * Math.PI * 2 * 0.27 + take);
  return {
    x: n("x", 0.35) * 15 + n("xb", 1.4) * 5 + n("xf", 7) * 1.5,
    y: n("y", 0.3) * 12 + n("yb", 1.2) * 5 + n("yf", 7) * 1.5 + breath * 3,
    r: n("r", 0.3) * 0.75 + n("rb", 1.5) * 0.22 + n("rf", 6) * 0.05,
    pitch: n("p", 0.4) * 0.9 + breath * 0.15,
    yaw: n("w", 0.4) * 0.9,
    push: n("z", 0.25) * 18,
    focus: n("f", 0.5) * 14, // the lens breathing a touch around the subject
  };
};

const Scene: React.FC<{ shot: Shot; frame: number; calib?: boolean }> = ({
  shot,
  frame,
  calib,
}) => {
  const { fps, width, height } = useVideoConfig();
  const f = frame - shot.from;
  const cam = shot.cam(f);
  const s = handheld(frame, fps, shot.from);
  // calib: flat, unrotated, so the redraw can be checked against the shot under it
  const c = calib
    ? { ...cam, rx: 0, ry: 0, tz: 0 }
    : { ...cam, rx: cam.rx + s.pitch, ry: cam.ry + s.yaw, tz: cam.tz + s.push };
  // roll the content off the steady camera so the shake never twists the UI
  const rz = calib ? 0 : alignRz(cam.rx, cam.ry);
  const K = shot.K;
  const [x0, y0, x1, y1] = shot.region;
  const px = (c.lx - x0) * K;
  const py = (c.ly - y0) * K;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg) scale(1.06)`,
      }}
    >
      <AbsoluteFill style={{ perspective: 1400, perspectiveOrigin: "50% 50%" }}>
        <div
          style={{
            position: "absolute",
            left: width / 2 - px,
            top: height / 2 - py,
            width: (x1 - x0) * K,
            height: (y1 - y0) * K,
            overflow: "hidden",
            transformOrigin: `${px}px ${py}px`,
            transform: `translateZ(${c.tz}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${rz}deg)`,
          }}
        >
          <Screen shot={shot} frame={frame} calib={calib} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const PsMacro: React.FC<{ calib?: boolean }> = ({ calib }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const shot =
    SHOTS.find((s) => frame >= s.from && frame < s.from + s.dur) ??
    SHOTS[SHOTS.length - 1];
  const f = frame - shot.from;
  const cam = shot.cam(f);
  const hh = handheld(frame, fps, shot.from);

  // depth of field: a focus band along the iso-depth line through the
  // look point; blurrier copies fade in with distance from it
  const phi = 180 + bandAngle(cam.rx + hh.pitch, cam.ry + hh.yaw);
  const len =
    Math.abs(width * Math.sin(rad(phi))) +
    Math.abs(height * Math.cos(rad(phi)));
  const pct = (v: number) => `${((v / len) * 100).toFixed(3)}%`;
  // the band rides the shake (the subject moves in frame, focus stays on it)
  // plus a little lens breathing
  const mid =
    len / 2 + hh.x * Math.sin(rad(phi)) - hh.y * Math.cos(rad(phi)) + hh.focus;
  const band = (h0: number, h1: number) => {
    const m = `linear-gradient(${phi}deg, #000 0%, #000 ${pct(mid - h1)}, transparent ${pct(mid - h0)}, transparent ${pct(mid + h0)}, #000 ${pct(mid + h1)}, #000 100%)`;
    return { WebkitMaskImage: m, maskImage: m } as React.CSSProperties;
  };
  // each cut racks in from soft
  const rack = 1 - ease(clamp01(f / (shot.from === 0 ? 14 : 9)));

  const flicker = 0.982 + 0.018 * random(`fl-${frame}`);
  const bandY = ((frame * 9) % (height + 500)) - 250;
  const seed = Math.floor(random(`gr-${frame}`) * 1000);

  return (
    <AbsoluteFill style={{ backgroundColor: "#050506" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter
            id="psm-crt"
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="r"
            />
            <feOffset in="r" dx={1} dy={0} result="r2" />
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="g"
            />
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="b"
            />
            <feOffset in="b" dx={-1} dy={0} result="b2" />
            <feBlend in="r2" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="b2" mode="screen" result="rgb" />
            <feGaussianBlur in="rgb" stdDeviation={6} result="h1" />
            <feComponentTransfer in="h1" result="h1d">
              <feFuncR type="linear" slope={0.24} />
              <feFuncG type="linear" slope={0.24} />
              <feFuncB type="linear" slope={0.24} />
            </feComponentTransfer>
            <feGaussianBlur in="rgb" stdDeviation={28} result="h2" />
            <feComponentTransfer in="h2" result="h2d">
              <feFuncR type="linear" slope={0.2} />
              <feFuncG type="linear" slope={0.2} />
              <feFuncB type="linear" slope={0.2} />
            </feComponentTransfer>
            <feBlend in="rgb" in2="h1d" mode="screen" result="s1" />
            <feBlend in="s1" in2="h2d" mode="screen" />
          </filter>
          <filter id="psm-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed={seed}
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      <AbsoluteFill style={{ filter: "url(#psm-crt)", opacity: flicker }}>
        <Scene shot={shot} frame={frame} calib={calib} />
        {calib ? null : (
          <>
            <AbsoluteFill style={{ filter: "blur(5px)", ...band(70, 230) }}>
              <Scene shot={shot} frame={frame} calib={calib} />
            </AbsoluteFill>
            <AbsoluteFill style={{ filter: "blur(16px)", ...band(230, 560) }}>
              <Scene shot={shot} frame={frame} calib={calib} />
            </AbsoluteFill>
          </>
        )}
        {rack > 0.001 && !calib ? (
          <AbsoluteFill style={{ filter: "blur(18px)", opacity: rack }}>
            <Scene shot={shot} frame={frame} calib={calib} />
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>

      {/* screen texture: faint scanlines + grille, rolling refresh, grain */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,70,70,0.025) 0px, rgba(255,70,70,0.025) 1px, rgba(70,255,110,0.025) 1px, rgba(70,255,110,0.025) 2px, rgba(80,120,255,0.025) 2px, rgba(80,120,255,0.025) 3px)",
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          width,
          top: bandY,
          height: 260,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0) 100%)",
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill style={{ opacity: 0.05, mixBlendMode: "screen" }}>
        <svg width={width} height={height}>
          <rect width={width} height={height} filter="url(#psm-grain)" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 90% 72% at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.4) 88%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
