import React from "react";
import { Img, interpolate, random, staticFile } from "remotion";
import { LOGOS, PH, Scope, type ScopeBump } from "../theme";
import { REPO, appIcon } from "../../artcraft/theme";
import {
  APPLY,
  CARD,
  ICON,
  MARK,
  PULSE,
  S,
  SAMPLE,
  TRAVEL,
  TUBE,
  WIRE_Y,
  clamp,
  pulseStarts,
  sampleCam,
  seg,
} from "./plan";

// ===========================================================================
// The sample screen (bottom half). A 9:8 scene built from real ArtCraft
// material: the Claude mark and the PhotoCraft icon on one wire, and the real
// storytold/photocraft repo row under them (GitHub light, later GitHub dark).
// It starts raw (gray ground, white card, a plain hairline, no tube) and each
// STYLE.md rule switches on as it is selected. The tube pass here is built
// up from the same pieces as fish8/crt.tsx (grade, channel split, halation,
// grille, interlaced scanlines, grain, flicker, refresh band) with its own
// filter ids, each piece weighted by its rule. The sample camera films the
// tube, so its surface and split are drawn in sample-world px (a magnified
// tube) and grow when the camera pushes in.
// ===========================================================================

const GROUND = "#5A5C60"; // the raw scene's gray ground (lifted so it still reads gray through the series tube)
const GRID = "rgba(233,231,226,0.22)"; // faint after the crush, like the ArtCraft grounds
const CORAL = PH.claudeRgb;
const BLUE = "79,142,247"; // PhotoCraft blue, lifted
const RAW_WIRE = "rgba(233,231,226,0.5)";
const LIVE_WIRE = "rgba(243,241,236,0.62)";

// grade: identity -> the crush (gray ground to black, highlights kept)
const ID = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const CRUSH = [0, 0, 0, 0, 0.02, 0.3, 0.5, 0.65, 0.78, 0.9, 1];

// GitHub repo row, light (default) and dark. Light white dimmed ~20%.
const GH_LIGHT = { bg: "#C2C2BE", edge: "#9AA2AC", title: "#0969DA", badge: "#59636E", badgeEdge: "#AEB6C0", text: "#59636E", meta: "#59636E" };
const GH_DARK = { bg: PH.panel, edge: "rgba(233,231,226,0.55)", title: "#62AEFF", badge: "#C3C8CF", badgeEdge: "rgba(233,231,226,0.5)", text: PH.ink, meta: "#C9CED6" };

export type TubeK = { crush: number; glow: number; surface: number; split: number; trace: number; dark: number };
export const tubeAt = (f: number): TubeK => {
  const k = (i: number) => seg(f, APPLY[i][0], APPLY[i][1], TRAVEL);
  return { crush: k(0), glow: k(1), surface: k(2), split: k(3), trace: seg(f, APPLY[4][0], APPLY[4][1], TRAVEL), dark: seg(f, APPLY[5][0], APPLY[5][1], TRAVEL) };
};

// ---------------------------------------------------------------- camera (world -> frame px)
const Cam: React.FC<{ f: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ f, style, children }) => {
  const c = sampleCam(f);
  return (
    <div style={{ position: "absolute", inset: 0, ...style }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 960,
          transform: `translate(${SAMPLE.w / 2 - c.x}px, ${SAMPLE.h / 2 - c.y}px) scale(${S * c.z})`,
          transformOrigin: `${c.x}px ${c.y}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- wire: plain hairline -> live scope trace
const sweepX = (k: number) => -60 + (1180 + 60) * k;

const LightPulse: React.FC<{ id: string; head: number; o: number }> = ({ id, head, o }) => {
  if (o <= 0.01) return null;
  const tail = Math.max(PULSE.from, head - 150);
  return (
    <g opacity={o}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={tail} y1={WIRE_Y} x2={head} y2={WIRE_Y}>
          <stop offset="0%" stopColor={`rgba(${CORAL},0)`} />
          <stop offset="100%" stopColor={`rgba(${CORAL},1)`} />
        </linearGradient>
      </defs>
      <line x1={tail} y1={WIRE_Y} x2={head} y2={WIRE_Y} stroke={`url(#${id})`} strokeWidth={4} strokeLinecap="round" />
      <circle cx={head} cy={WIRE_Y} r={6} fill="#F3F1EC" />
    </g>
  );
};

const Wire: React.FC<{ f: number; k: TubeK }> = ({ f, k }) => {
  const sx = sweepX(k.trace);
  const pulses = pulseStarts().map((t) => {
    const u = seg(f, t, t + PULSE.len, TRAVEL);
    const env = interpolate(f, [t, t + 2, t + PULSE.len - 3, t + PULSE.len], [0, 1, 1, 0], clamp);
    return { t, x: PULSE.from + (PULSE.to - PULSE.from) * u, env };
  });
  // the PhotoCraft icon answers each packet that lands
  const recv = pulseStarts().reduce((a, t) => a + interpolate(f, [t + PULSE.len - 2, t + PULSE.len + 2, t + PULSE.len + 22], [0, 1, 0], clamp), 0);
  const mod = 0.8 + 0.2 * Math.sin(f * 0.19);

  const bumps: ScopeBump[] = [{ x: MARK.x, amp: (8 + 4 * Math.sin(f * 0.23)) * mod, sigma: 64, rgb: CORAL }];
  for (const p of pulses) if (p.env > 0.01 && p.x < sx) bumps.push({ x: p.x, amp: 19 * p.env, sigma: 38, rgb: CORAL });
  if (recv > 0.02) bumps.push({ x: ICON.x, amp: 16 * recv, sigma: 96, rgb: BLUE });

  return (
    <svg width={1080} height={960} viewBox="0 0 1080 960" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {k.trace > 0.001 ? <Scope frame={f} x0={-520} x1={sx} y={WIRE_Y} bumps={bumps} hum={1.8} stroke={3.2} color={LIVE_WIRE} /> : null}
      {k.trace < 0.999 ? <line x1={Math.max(-520, sx)} y1={WIRE_Y} x2={1600} y2={WIRE_Y} stroke={RAW_WIRE} strokeWidth={2.6} /> : null}
      {pulses.map((p) => (p.x >= sx ? <LightPulse key={p.t} id={`t4p-${p.t}`} head={p.x} o={p.env} /> : null))}
      {k.trace > 0.001 && k.trace < 0.999 ? <circle cx={sx} cy={WIRE_Y} r={6} fill="#F3F1EC" /> : null}
    </svg>
  );
};

// ---------------------------------------------------------------- the repo row (GitHub list item)
const Star: React.FC<{ c: string }> = ({ c }) => (
  <svg width={38} height={38} viewBox="0 0 16 16" style={{ display: "block" }}>
    <path
      d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"
      fill={c}
    />
  </svg>
);
const Law: React.FC<{ c: string }> = ({ c }) => (
  <svg width={38} height={38} viewBox="0 0 16 16" style={{ display: "block" }}>
    <path
      d="M8.75.75V2h.985c.304 0 .603.08.867.231l1.29.736c.038.022.08.033.124.033h2.234a.75.75 0 0 1 0 1.5h-.427l2.111 4.692a.75.75 0 0 1-.154.838l-.53-.53.529.531-.001.002-.002.002-.006.006-.006.005-.01.01-.045.04c-.21.176-.441.327-.686.45C14.556 10.78 13.88 11 13 11a4.498 4.498 0 0 1-2.023-.454 3.544 3.544 0 0 1-.686-.45l-.045-.04-.016-.015-.006-.006-.004-.004v-.001a.75.75 0 0 1-.154-.838L12.178 4.5h-.162c-.305 0-.604-.079-.868-.231l-1.29-.736a.245.245 0 0 0-.124-.033H8.75V13h2.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h2.5V3.5h-.984a.245.245 0 0 0-.124.033l-1.289.737c-.265.15-.564.23-.869.23h-.162l2.112 4.692a.75.75 0 0 1-.154.838l-.53-.53.529.531-.001.002-.002.002-.006.006-.016.015-.045.04c-.21.176-.441.327-.686.45C4.556 10.78 3.88 11 3 11a4.498 4.498 0 0 1-2.023-.454 3.544 3.544 0 0 1-.686-.45l-.045-.04-.016-.015-.006-.006-.004-.004v-.001a.75.75 0 0 1-.154-.838L2.178 4.5H1.75a.75.75 0 0 1 0-1.5h2.234a.249.249 0 0 0 .125-.033l1.288-.737c.265-.15.564-.23.869-.23h.984V.75a.75.75 0 0 1 1.5 0Zm2.945 8.477c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L13 6.327Zm-10 0c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L3 6.327Z"
      fill={c}
    />
  </svg>
);

const RepoRow: React.FC<{ C: typeof GH_LIGHT; ui: string }> = ({ C, ui }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: 18,
      background: C.bg,
      border: `3px solid ${C.edge}`,
      boxSizing: "border-box",
      fontFamily: ui,
    }}
  >
    <div style={{ position: "absolute", left: 44, top: 34, display: "flex", alignItems: "center", gap: 20, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: 54, fontWeight: 600, color: C.title, letterSpacing: -0.4 }}>
        {REPO.owner} / {REPO.name}
      </span>
      <span style={{ fontSize: 32, fontWeight: 500, color: C.badge, border: `2px solid ${C.badgeEdge}`, borderRadius: 999, padding: "1px 16px" }}>Public</span>
    </div>
    <div style={{ position: "absolute", left: 44, top: 122, width: CARD.w - 88, fontSize: 40, lineHeight: "54px", color: C.text }}>{REPO.description}</div>
    <div style={{ position: "absolute", left: 44, top: CARD.h - 88, display: "flex", alignItems: "center", gap: 14, fontSize: 40, color: C.meta, whiteSpace: "nowrap" }}>
      <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#DEA584", display: "inline-block" }} />
      <span style={{ marginRight: 34 }}>{REPO.language}</span>
      <Star c={C.meta} />
      <span style={{ marginRight: 34 }}>{REPO.stars}</span>
      <Law c={C.meta} />
      <span>{REPO.license}</span>
    </div>
  </div>
);

// ---------------------------------------------------------------- scene (sample world, 1080x960)
const SPIN = 0.85; // deg / frame

const World: React.FC<{ f: number; k: TubeK; ui: string }> = ({ f, k, ui }) => {
  const recv = pulseStarts().reduce((a, t) => a + interpolate(f, [t + PULSE.len - 2, t + PULSE.len + 2, t + PULSE.len + 16], [0, 1, 0], clamp), 0);
  const wipe = -80 + (CARD.h + 160) * k.dark; // px of the card already dark (soft 80px edge)
  return (
    <>
      {/* ground (bleeds well past the world so no camera framing ever shows an edge) */}
      <div
        style={{
          position: "absolute",
          left: -700,
          top: -700,
          width: 2480,
          height: 2360,
          backgroundColor: GROUND,
          backgroundImage: `linear-gradient(${GRID} 2px, transparent 2px), linear-gradient(90deg, ${GRID} 2px, transparent 2px)`,
          backgroundSize: "80px 80px",
          backgroundPosition: "20px 10px",
        }}
      />
      <Wire f={f} k={k} />

      {/* the Claude mark on the wire */}
      <div style={{ position: "absolute", left: MARK.x - 112, top: WIRE_Y - 112, width: 224, height: 224, borderRadius: "50%", background: GROUND }} />
      <Img
        src={staticFile(LOGOS.claude)}
        style={{ position: "absolute", left: MARK.x - MARK.size / 2, top: WIRE_Y - MARK.size / 2, width: MARK.size, height: MARK.size, transform: `rotate(${(f * SPIN).toFixed(2)}deg)` }}
      />

      {/* the PhotoCraft icon on the wire: takes each packet in */}
      <Img
        src={staticFile(appIcon("photocraft"))}
        style={{
          position: "absolute",
          left: ICON.x - ICON.size / 2,
          top: WIRE_Y - ICON.size / 2,
          width: ICON.size,
          height: ICON.size,
          transform: `scale(${(1 + 0.028 * Math.min(1, recv)).toFixed(4)})`,
          filter: "brightness(0.8)",
        }}
      />

      {/* the repo row: GitHub light, then the dark panel wipes down over it */}
      <div style={{ position: "absolute", left: CARD.left, top: CARD.top, width: CARD.w, height: CARD.h }}>
        <RepoRow C={GH_LIGHT} ui={ui} />
        {k.dark > 0.001 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              WebkitMaskImage: `linear-gradient(180deg, #000 0px, #000 ${wipe}px, transparent ${wipe + 80}px)`,
              maskImage: `linear-gradient(180deg, #000 0px, #000 ${wipe}px, transparent ${wipe + 80}px)`,
            }}
          >
            <RepoRow C={GH_DARK} ui={ui} />
          </div>
        ) : null}
      </div>
    </>
  );
};

// ---------------------------------------------------------------- tube surface (sample-world px, on the glass)
const Surface: React.FC<{ f: number; k: TubeK }> = ({ f, k }) => {
  if (k.surface <= 0.001) return null;
  const P = TUBE.pitch; // 1.5x the series tube's 4px rows
  const q = P / 4;
  const field = f % 2;
  const bandY = ((f * 9) % 1500) - 320; // slow refresh roll
  return (
    <>
      <Cam f={f} style={{ mixBlendMode: "multiply", opacity: k.surface }}>
        <div
          style={{
            position: "absolute",
            left: -700,
            top: -700,
            width: 2480,
            height: 2360,
            backgroundImage: `repeating-linear-gradient(90deg, rgba(255,60,60,0.10) 0px, rgba(255,60,60,0.10) ${q}px, rgba(60,255,90,0.10) ${q}px, rgba(60,255,90,0.10) ${2 * q}px, rgba(70,110,255,0.10) ${2 * q}px, rgba(70,110,255,0.10) ${3 * q}px, rgba(0,0,0,0.5) ${3 * q}px, rgba(0,0,0,0.5) ${P}px)`,
          }}
        />
      </Cam>
      <Cam f={f} style={{ opacity: k.surface }}>
        <div
          style={{
            position: "absolute",
            left: -700,
            top: -700 + field * (P / 2),
            width: 2480,
            height: 2360,
            backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.34) 0px, rgba(0,0,0,0.34) ${1.6 * q}px, transparent ${1.6 * q}px, transparent ${P}px)`,
          }}
        />
      </Cam>
      <Cam f={f} style={{ mixBlendMode: "screen", opacity: k.surface }}>
        <div
          style={{
            position: "absolute",
            left: -700,
            top: bandY,
            width: 2480,
            height: 300,
            background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
      </Cam>
    </>
  );
};

// ---------------------------------------------------------------- the sample screen
export const Sample: React.FC<{ f: number; ui: string }> = ({ f, ui }) => {
  const k = tubeAt(f);
  const c = sampleCam(f);
  const px = S * c.z; // sample-world px -> frame px
  const tv = (i: number) => (ID[i] + (CRUSH[i] - ID[i]) * k.crush).toFixed(4);
  const table = ID.map((_, i) => tv(i)).join(" ");
  const d = TUBE.convergence * TUBE.scale * px * k.split;
  const [r1, r2, r3] = TUBE.halation.map((r) => r * px);
  const g = 0.6 * k.glow;
  const seed = Math.floor(random(`t4-seed-${f}`) * 1000);
  const flicker = 1 - k.surface * 0.03 * random(`t4-flk-${f}`);
  const needs = k.crush > 0.001 || k.split > 0.001 || k.glow > 0.001;

  return (
    <div
      style={{
        position: "absolute",
        left: SAMPLE.left,
        top: SAMPLE.top,
        width: SAMPLE.w,
        height: SAMPLE.h,
        borderRadius: 16,
        overflow: "hidden",
        background: "#000",
        isolation: "isolate",
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="t4-tube" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feComponentTransfer in="SourceGraphic" result="g">
              <feFuncR type="table" tableValues={table} />
              <feFuncG type="table" tableValues={table} />
              <feFuncB type="table" tableValues={table} />
            </feComponentTransfer>
            {d > 0.01 ? (
              <>
                <feColorMatrix in="g" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
                <feOffset in="r" dx={d} dy="0" result="r2" />
                <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gch" />
                <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
                <feOffset in="b" dx={-d} dy="0" result="b2" />
                <feBlend in="r2" in2="gch" mode="screen" result="rg" />
                <feBlend in="rg" in2="b2" mode="screen" result="rgb" />
              </>
            ) : (
              <feOffset in="g" dx="0" dy="0" result="rgb" />
            )}
            {g > 0.001 ? (
              <>
                <feGaussianBlur in="rgb" stdDeviation={r1} result="h1raw" />
                <feComponentTransfer in="h1raw" result="h1">
                  <feFuncR type="linear" slope={g} />
                  <feFuncG type="linear" slope={g} />
                  <feFuncB type="linear" slope={g} />
                </feComponentTransfer>
                <feGaussianBlur in="rgb" stdDeviation={r2} result="h2raw" />
                <feComponentTransfer in="h2raw" result="h2">
                  <feFuncR type="linear" slope={0.9 * g} />
                  <feFuncG type="linear" slope={0.9 * g} />
                  <feFuncB type="linear" slope={0.9 * g} />
                </feComponentTransfer>
                <feGaussianBlur in="rgb" stdDeviation={r3} result="h3raw" />
                <feComponentTransfer in="h3raw" result="h3">
                  <feFuncR type="linear" slope={0.6 * g} />
                  <feFuncG type="linear" slope={0.6 * g} />
                  <feFuncB type="linear" slope={0.6 * g} />
                </feComponentTransfer>
                <feBlend in="rgb" in2="h1" mode="screen" result="s1" />
                <feBlend in="s1" in2="h2" mode="screen" result="s2" />
                <feBlend in="s2" in2="h3" mode="screen" />
              </>
            ) : null}
          </filter>
          <filter id="t4-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed={seed} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      {/* picture */}
      <div style={{ position: "absolute", inset: 0, filter: needs ? "url(#t4-tube)" : undefined, opacity: flicker }}>
        <Cam f={f}>
          <World f={f} k={k} ui={ui} />
        </Cam>
      </div>

      {/* tube surface */}
      <Surface f={f} k={k} />
      {k.surface > 0.001 ? (
        <div style={{ position: "absolute", inset: 0, opacity: 0.08 * k.surface, mixBlendMode: "screen" }}>
          <svg width={SAMPLE.w} height={SAMPLE.h}>
            <rect width={SAMPLE.w} height={SAMPLE.h} filter="url(#t4-grain)" />
          </svg>
        </div>
      ) : null}

      {/* bezel edge */}
      <div style={{ position: "absolute", inset: 0, borderRadius: 16, border: "3px solid rgba(233,231,226,0.55)" }} />
    </div>
  );
};

