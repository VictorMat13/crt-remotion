import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { FONT_UI, PH, Scope, type ScopeBump } from "../theme";
import { useEnvelope, type Bin } from "./audio";
import {
  BG_CARDS,
  CLIP,
  DEEP,
  DEEP_CARDS,
  deepDim,
  CLIP_W,
  CUTS,
  ENTER1,
  ENTER2,
  HERO,
  PIECES,
  TRAVEL,
  VP,
  bgDim,
  bladeIn,
  clamp,
  clipRight,
  heroSel,
  heroX,
  pauseOut,
  pieceShift,
  seamFade,
  seg,
  tx,
  viewRect,
  type Cam,
} from "./plan";

// ===========================================================================
// The viewport: the video Claude is making, filmed by the inner camera.
//   StageBack  (inside the camera blur) the T5 mosaic of real UI cards and a
//              faint scope graticule, streaming past while the camera tracks.
//   StageFront (sharp) the scope trace, the hero card on it, and the audio
//              clip with its real waveform, the coral blades and the ripple.
//              Thin lines and the waveform stay out of the blur.
// ===========================================================================

const CORAL = PH.claudeRgb;
const WAVE = "59,224,138"; // the voice, the person's green
const BIN_PX = 3; // waveform resolution (world px per bin)
const NBINS = Math.round(CLIP_W / BIN_PX);

/** the viewport window + the inner camera */
export const Viewport: React.FC<{ cam: Cam; children: React.ReactNode }> = ({
  cam,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: VP.left,
      top: VP.top,
      width: VP.w,
      height: VP.h,
      overflow: "hidden",
      borderRadius: 16,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: VP.w / 2,
        top: VP.h / 2,
        width: 0,
        height: 0,
        transformOrigin: "0 0",
        transform: `scale(${cam.z.toFixed(5)}) translate(${(-cam.x).toFixed(2)}px, ${(-cam.y).toFixed(2)}px)`,
      }}
    >
      {children}
    </div>
  </div>
);

// ---------------------------------------------------------------- back layer
const GRID = 136;
export const StageBack: React.FC<{ cam: Cam; frame: number }> = ({
  cam,
  frame,
}) => {
  const v = viewRect(cam);
  const m = 40 / cam.z;
  const dim = bgDim(frame);
  const gx0 = Math.floor(v.x0 / GRID) * GRID;
  const gy0 = Math.floor(v.y0 / GRID) * GRID;
  const lines: React.ReactNode[] = [];
  for (let x = gx0; x <= v.x1; x += GRID)
    lines.push(
      <rect
        key={`x${x}`}
        x={x - 1}
        y={v.y0 - 10}
        width={2}
        height={v.y1 - v.y0 + 20}
      />,
    );
  for (let y = gy0; y <= v.y1; y += GRID)
    lines.push(
      <rect
        key={`y${y}`}
        x={v.x0 - 10}
        y={y - 1}
        width={v.x1 - v.x0 + 20}
        height={2}
      />,
    );
  // the deeper row: its own camera (moves 0.8x, sits smaller)
  const dc = { x: cam.x * DEEP.k, y: cam.y * DEEP.k, z: cam.z * DEEP.s };
  const dv = viewRect(dc);
  const dd = deepDim(frame);
  return (
    <>
      {dd > 0.01 ? (
        <Viewport cam={dc}>
          {DEEP_CARDS.filter(
            (c) => c.x + c.w > dv.x0 - m && c.x < dv.x1 + m,
          ).map((c) => (
            <div
              key={`${c.x}`}
              style={{
                position: "absolute",
                left: c.x,
                top: c.y,
                width: c.w,
                height: c.h,
                borderRadius: 14,
                overflow: "hidden",
                background: PH.panel,
              }}
            >
              <Img
                src={staticFile(c.src)}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  filter: `brightness(${dd.toFixed(3)}) blur(1.5px)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 14,
                  border: `2px solid rgba(233,231,226,${(0.5 * dd).toFixed(3)})`,
                }}
              />
            </div>
          ))}
        </Viewport>
      ) : null}
      <Viewport cam={cam}>
        <svg
          width={1}
          height={1}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          <g fill="rgba(233,231,226,0.1)">{lines}</g>
        </svg>
        {BG_CARDS.filter(
          (c) =>
            c.x + c.w > v.x0 - m &&
            c.x < v.x1 + m &&
            c.y + c.h > v.y0 - m &&
            c.y < v.y1 + m,
        ).map((c) => (
          <div
            key={`${c.x}:${c.y}`}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: c.w,
              height: c.h,
              borderRadius: 14,
              overflow: "hidden",
              background: PH.panel,
            }}
          >
            <Img
              src={staticFile(c.src)}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                filter: `brightness(${dim.toFixed(3)})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 14,
                border: "2px solid rgba(233,231,226,0.30)",
              }}
            />
          </div>
        ))}
      </Viewport>
    </>
  );
};

// ---------------------------------------------------------------- trace bumps
const packet = (
  f: number,
  at: number,
  len: number,
  from: number,
  to: number,
  amp: number,
  rgb: string,
  sigma = 34,
): ScopeBump | null => {
  const u = interpolate(f, [at, at + len], [0, 1], {
    ...clamp,
    easing: TRAVEL,
  });
  const env = interpolate(
    f,
    [at, at + 2, at + len - 2, at + len],
    [0, 1, 1, 0],
    clamp,
  );
  return env > 0.01
    ? { x: from + (to - from) * u, amp: amp * env, sigma, rgb }
    : null;
};

const bumpsAt = (f: number, cam: Cam): ScopeBump[] => {
  const v = viewRect(cam);
  const mod = (k: number) => 0.8 + 0.2 * Math.sin(f * 0.21 + k);
  const b: (ScopeBump | null)[] = [];
  // the line is alive: broad, slow signal along it (kept off the audio clip, where flat means silence)
  for (let x = Math.floor(v.x0 / 520) * 520 - 520; x < v.x1 + 520; x += 520) {
    if (x > CLIP.x0 - 260 && x < clipRight(f) + 260) continue;
    b.push({
      x: x + 90 * Math.sin(f / 37 + x * 0.013),
      amp: 7 + 3 * Math.sin(f / 19 + x * 0.007),
      sigma: 150,
      rgb: "243,241,236",
    });
  }
  // Enter: Claude's packet runs in from the viewport's left edge to the card
  const from1 = v.x0 + 10;
  b.push(packet(f, ENTER1 + 1, 9, from1, -HERO.w / 2 - 20, 24, CORAL, 30));
  // Claude moves the card: coral on the line either side of it
  const work = seg(f, 104, 112) * (1 - seg(f, 166, 178));
  if (work > 0.01)
    b.push({ x: heroX(f), amp: 20 * work * mod(1), sigma: 210, rgb: CORAL });
  // second Enter: a packet runs on from the card to the clip
  b.push(
    packet(
      f,
      ENTER2 + 1,
      15,
      HERO.dist + HERO.w / 2 + 20,
      CLIP.x0,
      24,
      CORAL,
      32,
    ),
  );
  // Claude at work on the clip: coral at its two ends
  const cut = seg(f, 180, 188) * (1 - seg(f, 228, 240));
  if (cut > 0.01) {
    b.push({ x: CLIP.x0 - 70, amp: 15 * cut * mod(3), sigma: 46, rgb: CORAL });
    b.push({
      x: clipRight(f) + 70,
      amp: 15 * cut * mod(4),
      sigma: 46,
      rgb: CORAL,
    });
  }
  return b.filter((x): x is ScopeBump => x !== null);
};

// ---------------------------------------------------------------- the clip
const envPath = (
  bins: Bin[],
  i0: number,
  i1: number,
  key: "peak" | "rms",
  x0: number,
) => {
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = i0; i < i1; i++) {
    const x = x0 + (i - i0) * BIN_PX;
    const a = Math.max(0.9, bins[i][key] * CLIP.wh);
    top.push(
      `${x.toFixed(1)},${(-a).toFixed(1)}`,
      `${(x + BIN_PX).toFixed(1)},${(-a).toFixed(1)}`,
    );
    bot.push(
      `${(x + BIN_PX).toFixed(1)},${a.toFixed(1)}`,
      `${x.toFixed(1)},${a.toFixed(1)}`,
    );
  }
  bot.reverse();
  return `M ${top.join(" L ")} L ${bot.join(" L ")} Z`;
};

// Edges, left to right: 2j = the left edge of pause j, 2j + 1 = its right edge.
// Pieces: S0 P0 S1 P1 S2 P2 S3 (speech / pause). An internal edge only exists
// once its blade has landed: until then the clip is one clip (one outline, one name).
type Piece = {
  t0: number;
  t1: number;
  shift: number;
  alpha: number;
  key: string;
  /** edge index on each side, -1 = the clip's own end */
  le: number;
  re: number;
};

const piecesAt = (f: number): Piece[] => {
  const out: Piece[] = [];
  PIECES.forEach(([t0, t1], k) => {
    out.push({
      t0,
      t1,
      shift: pieceShift(k, f),
      alpha: 1,
      key: `s${k}`,
      le: k === 0 ? -1 : 2 * k - 1,
      re: k < CUTS.length ? 2 * k : -1,
    });
    if (k < CUTS.length) {
      const a = 1 - pauseOut(k, f);
      if (a > 0.005)
        out.push({
          t0: CUTS[k][0],
          t1: CUTS[k][1],
          shift: pieceShift(k, f),
          alpha: a,
          key: `p${k}`,
          le: 2 * k,
          re: 2 * k + 1,
        });
    }
  });
  return out;
};

const HAIR = "233,231,226";
const NAME: React.CSSProperties = {
  position: "absolute",
  left: 16,
  top: 0,
  height: CLIP.header,
  lineHeight: `${CLIP.header}px`,
  whiteSpace: "pre",
  fontFamily: FONT_UI,
  fontSize: 44,
  fontWeight: 500,
  color: PH.ink,
};

const ClipPanels: React.FC<{ f: number }> = ({ f }) => {
  const cut0 = bladeIn(0, f);
  const H = CLIP.bottom - CLIP.top;
  return (
    <>
      {piecesAt(f).map((p) => {
        const x = tx(p.t0) + p.shift;
        // 1 px over the next piece on internal edges, so the uncut clip shows no anti-aliased seam
        const w = (p.t1 - p.t0) * CLIP.pps + (p.re >= 0 ? 1 : 0);
        const lA = p.le < 0 ? 1 : bladeIn(p.le, f);
        const rA = p.re < 0 ? 1 : bladeIn(p.re, f);
        const r = (end: boolean) => (end ? 10 : 0);
        return (
          <div
            key={p.key}
            style={{
              position: "absolute",
              left: x,
              top: CLIP.top,
              width: w,
              height: H,
              opacity: p.alpha,
              overflow: "hidden",
              borderTopLeftRadius: r(p.le < 0),
              borderBottomLeftRadius: r(p.le < 0),
              borderTopRightRadius: r(p.re < 0),
              borderBottomRightRadius: r(p.re < 0),
              background: PH.panel,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: CLIP.header,
                background: PH.panel2,
              }}
            />
            {/* each piece gets its own (clipped) name once its left edge is cut; the first piece's is the clip's */}
            {p.le < 0 ? (
              <div style={{ ...NAME, opacity: cut0 }}>{CLIP.name}</div>
            ) : lA > 0.005 ? (
              <div style={{ ...NAME, opacity: lA }}>{CLIP.name}</div>
            ) : null}
            {/* outline: an internal edge only shows once its blade has landed */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                boxSizing: "border-box",
                borderTopLeftRadius: r(p.le < 0),
                borderBottomLeftRadius: r(p.le < 0),
                borderTopRightRadius: r(p.re < 0),
                borderBottomRightRadius: r(p.re < 0),
                borderTop: `2px solid rgba(${HAIR},0.42)`,
                borderBottom: `2px solid rgba(${HAIR},0.42)`,
                borderLeft: `2px solid rgba(${HAIR},${(0.42 * lA).toFixed(3)})`,
                borderRight: `2px solid rgba(${HAIR},${(0.42 * rA).toFixed(3)})`,
              }}
            />
          </div>
        );
      })}
      {/* the uncut clip's name runs across the clip until the first blade lands */}
      {cut0 < 0.995 ? (
        <div
          style={{
            position: "absolute",
            left: CLIP.x0,
            top: CLIP.top,
            width: CLIP_W,
            height: CLIP.header,
            overflow: "hidden",
          }}
        >
          <div style={{ ...NAME, opacity: 1 - cut0 }}>{CLIP.name}</div>
        </div>
      ) : null}
    </>
  );
};

const Waveform: React.FC<{ f: number; bins: Bin[] | null }> = ({ f, bins }) => {
  if (!bins) return null;
  return (
    <svg
      width={1}
      height={1}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {piecesAt(f).map((p) => {
        const i0 = Math.round((p.t0 * CLIP.pps) / BIN_PX);
        const i1 = Math.min(
          bins.length,
          Math.round((p.t1 * CLIP.pps) / BIN_PX),
        );
        if (i1 <= i0) return null;
        const x0 = CLIP.x0 + i0 * BIN_PX;
        return (
          <g
            key={p.key}
            transform={`translate(${p.shift.toFixed(2)} 0)`}
            opacity={p.alpha}
          >
            <path
              d={envPath(bins, i0, i1, "peak", x0)}
              fill={`rgba(${WAVE},0.36)`}
            />
            <path
              d={envPath(bins, i0, i1, "rms", x0)}
              fill={`rgba(${WAVE},0.74)`}
            />
          </g>
        );
      })}
    </svg>
  );
};

/** Claude's coral blades on the pause edges; the pair of a gap meets as one seam when it closes */
const Blades: React.FC<{ f: number; z: number }> = ({ f, z }) => {
  const w = 5.5 / z;
  const y0 = CLIP.top - 18;
  const y1 = CLIP.bottom + 18;
  return (
    <svg
      width={1}
      height={1}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {CUTS.flatMap(([a, bT], j) =>
        [
          { t: a, k: j, i: 2 * j }, // left edge: rides with the piece before the gap
          { t: bT, k: j + 1, i: 2 * j + 1 }, // right edge: rides with the piece after it
        ].map(({ t, k, i }) => {
          const g = bladeIn(i, f);
          if (g <= 0.001) return null;
          const x = tx(t) + pieceShift(k, f);
          const h = (y1 - y0) * g;
          return (
            <rect
              key={i}
              x={x - w / 2}
              y={y0}
              width={w}
              height={h}
              fill={`rgba(${CORAL},${(0.95 * seamFade(j, f)).toFixed(3)})`}
            />
          );
        }),
      )}
    </svg>
  );
};

// ---------------------------------------------------------------- front layer
export const StageFront: React.FC<{ cam: Cam; frame: number }> = ({
  cam,
  frame: f,
}) => {
  const bins = useEnvelope(CLIP.src, CLIP.dur, NBINS);
  const v = viewRect(cam);
  const bumps = bumpsAt(f, cam);
  const stroke = 2.8 / cam.z;
  const ink = "rgba(243,241,236,0.5)";
  const x0 = v.x0 - 30;
  const x1 = v.x1 + 30;
  const cL = CLIP.x0;
  const cR = clipRight(f);
  const hx = heroX(f);
  const sel = heroSel(f);
  const scope = (a: number, b: number, k: string) =>
    b - a > 4 ? (
      <Scope
        key={k}
        frame={f}
        x0={a}
        x1={b}
        y={0}
        bumps={bumps}
        hum={3.2}
        stroke={stroke}
        color={ink}
      />
    ) : null;
  return (
    <Viewport cam={cam}>
      {/* the trace outside the clip (the card sits on it and hides it) */}
      <svg
        width={1}
        height={1}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        {scope(x0, Math.min(x1, cL), "a")}
        {scope(Math.max(x0, cR), x1, "b")}
      </svg>

      {/* the hero card, on the line */}
      {hx + HERO.w / 2 > v.x0 - 40 && hx - HERO.w / 2 < v.x1 + 40 ? (
        <div
          style={{
            position: "absolute",
            left: hx - HERO.w / 2,
            top: -HERO.h / 2,
            width: HERO.w,
            height: HERO.h,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 14,
              overflow: "hidden",
              background: PH.panel,
            }}
          >
            <Img
              src={staticFile(HERO.src)}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                filter: `brightness(${HERO.dim})`,
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 14,
              border: "2px solid rgba(233,231,226,0.55)",
            }}
          />
          {sel > 0.005 ? (
            <div
              style={{
                position: "absolute",
                inset: -9,
                borderRadius: 20,
                border: `${(5 / cam.z).toFixed(2)}px solid rgba(${CORAL},${(0.95 * sel).toFixed(3)})`,
              }}
            />
          ) : null}
        </div>
      ) : null}

      {/* the audio clip on the line: panels, then the trace through it (silence reads as the flat line), then the voice */}
      {cR > v.x0 - 40 && cL < v.x1 + 40 ? (
        <>
          <ClipPanels f={f} />
          <svg
            width={1}
            height={1}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              overflow: "visible",
            }}
          >
            {scope(Math.max(x0, cL), Math.min(x1, cR), "c")}
          </svg>
          <Waveform f={f} bins={bins} />
          <Blades f={f} z={cam.z} />
        </>
      ) : null}
    </Viewport>
  );
};
