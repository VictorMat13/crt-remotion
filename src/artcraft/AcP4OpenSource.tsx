import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, PARTS, PH } from "./theme";
import { Scope, type ScopeBump } from "./kit/Scope";
import {
  BLUR_WIN,
  CLICK_CODE,
  CLICK_COPY,
  CURSOR_IN,
  END_ICON,
  END_PKT,
  END_WAKE,
  ENTER,
  ENTRY,
  GLITCH,
  LIST,
  OPEN,
  PAGE,
  PC,
  PKT_C,
  ROW,
  TERM,
  TERM_BOTTOM,
  TRACE_INK,
  TRACE_X,
  TRAVEL,
  WAKE,
  WHITE_RGB,
  camAt,
  clamp,
  packetAY,
} from "./p4/plan";
import { RepoRow, TraceIcon } from "./p4/Rows";
import { CODE_BTN_WORLD, COPY_BTN, CodeDropdown, RepoPage } from "./p4/RepoPage";
import { Terminal } from "./p4/Terminal";
import { MacCursor } from "./p4/glyphs";

// ===========================================================================
// AcP4OpenSource: 1080x1920 (9:16) @ 30fps, 210 frames (7.0s).
// VO (Victor's, never on screen): "I mean, this is the future of AI. More and
// more software is going open source, which means anyone can grab the code
// and use it for free."
//
// CRT Scope style. One continuous shot down a tall world. A vertical scope
// trace runs down the left gutter; every subject sits to its right with its
// app icon ON the trace.
//   0-110    repos keep coming: storytold's 12 Craft repos as GitHub list rows
//            (real order: newest created first, so photocraft, the first one,
//            is last). The camera travels down the list while rows rise into
//            place at the bottom; a packet runs down the trace waking each app
//            icon, and each woken row's star count ticks up to its real value.
//            Everything slows onto photocraft.
//   110-147  grab the code: photocraft's row opens into its repo page (one soft
//            glitch) as the camera dives in: Fork 9.1k, Star 54.5k, Issues 817,
//            Pull requests 447, main, the real file list, 2,012 Commits. A plain
//            arrow clicks the green Code button; GitHub's dropdown opens (Local,
//            Clone, HTTPS, the clone URL) and the arrow clicks copy (-> check).
//   147-209  use it: the copied URL rides the trace (green, the person) down into
//            the terminal under the page: "git clone " typed, the URL pasted,
//            Enter, then the real clone output ticking through git's own states.
//            When it's done the PhotoCraft icon at the bottom of the trace wakes.
// ===========================================================================

export const AC_P4_DURATION = PARTS.p4.frames; // 210

const WORLD_H = END_ICON.y + 900;

// ---------------------------------------------------------------- trace
const traceBumps = (f: number): ScopeBump[] => {
  const b: ScopeBump[] = [];
  // phase A packet (phosphor white) runs down the list
  const envA = interpolate(f, [100, 114], [1, 0], clamp);
  if (envA > 0.01) b.push({ x: packetAY(f), amp: 22 * envA, sigma: 44, rgb: WHITE_RGB });
  // each woken icon speaks once in its own color, then keeps a small hum
  LIST.forEach((r, i) => {
    const w = WAKE[i];
    if (f < w) return;
    const mod = 0.75 + 0.25 * Math.sin(f * 0.13 + i * 1.7);
    const peak = interpolate(f, [w, w + 4, w + 36], [0, 1, 0], clamp);
    const alive = interpolate(f, [w, w + 10], [0, 1], clamp);
    let amp = (18 * peak + 4 * alive) * mod;
    if (r === PC) amp += 9 * interpolate(f, [w + 6, w + 22], [0, 1], clamp) * mod; // stays live while its page is open
    if (amp > 0.3) b.push({ x: r.cy, amp, sigma: 62, rgb: r.rgb });
  });
  // the person's clicks: green blips at photocraft
  for (const at of [CLICK_CODE, CLICK_COPY]) {
    const k = interpolate(f, [at, at + 3, at + 20], [0, 1, 0], clamp);
    if (k > 0.01) b.push({ x: PC.cy, amp: 15 * k, sigma: 40, rgb: PH.userRgb });
  }
  // the copied URL rides the trace down into the terminal
  const u = interpolate(f, PKT_C, [0, 1], { ...clamp, easing: TRAVEL });
  const envC = interpolate(f, [PKT_C[0], PKT_C[0] + 3, PKT_C[1] - 1, PKT_C[1] + 3], [0, 1, 1, 0], clamp);
  if (envC > 0.01) b.push({ x: PC.cy + (TERM.top + 30 - PC.cy) * u, amp: 24 * envC, sigma: 46, rgb: PH.userRgb });
  // when the clone is done, a packet runs out of the terminal's bottom edge into the PhotoCraft icon
  const ue = interpolate(f, END_PKT, [0, 1], { ...clamp, easing: TRAVEL });
  const envE = interpolate(f, [END_PKT[0], END_PKT[0] + 2, END_PKT[1] - 1, END_PKT[1] + 3], [0, 1, 1, 0], clamp);
  if (envE > 0.01) b.push({ x: TERM_BOTTOM - 30 + (END_ICON.y - TERM_BOTTOM + 30) * ue, amp: 22 * envE, sigma: 36, rgb: PH.userRgb });
  // PhotoCraft wakes and speaks
  const v = interpolate(f, [END_WAKE, END_WAKE + 6], [0, 1], { ...clamp, easing: ENTER });
  if (v > 0.01) b.push({ x: END_ICON.y, amp: 19 * v * (0.75 + 0.25 * Math.sin(f * 0.17)), sigma: 72, rgb: PC.rgb });
  return b;
};

// ---------------------------------------------------------------- cursor (world px, tip)
const cursorAt = (f: number) => {
  const code = { x: CODE_BTN_WORLD.left + CODE_BTN_WORLD.w * 0.56, y: CODE_BTN_WORLD.top + CODE_BTN_WORLD.h * 0.58 };
  // the tip lands on the button's lower right so the arrow never hides the check
  const copy = { x: COPY_BTN.left + COPY_BTN.size * 0.74, y: COPY_BTN.top + COPY_BTN.size * 0.76 };
  const start = { x: 990, y: PAGE.top + 1100 };
  const rest = { x: copy.x - 40, y: copy.y + 150 };
  const legs: [number, number, { x: number; y: number }, { x: number; y: number }, number][] = [
    [CURSOR_IN, CLICK_CODE - 1, start, code, 46],
    [CLICK_CODE + 6, CLICK_COPY - 1, code, copy, -24],
    [CLICK_COPY + 4, CLICK_COPY + 26, copy, rest, 14],
  ];
  let p = start;
  for (const [a, b, from, to, bow] of legs) {
    const k = interpolate(f, [a, b], [0, 1], { ...clamp, easing: TRAVEL });
    if (k <= 0) break;
    // a slight arc, the way a hand moves a mouse
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const arc = bow * Math.sin(Math.PI * k);
    p = { x: from.x + dx * k - (dy / len) * arc, y: from.y + dy * k + (dx / len) * arc };
  }
  const press = Math.max(
    interpolate(f, [CLICK_CODE, CLICK_CODE + 2, CLICK_CODE + 5], [0, 1, 0], clamp),
    interpolate(f, [CLICK_COPY, CLICK_COPY + 2, CLICK_COPY + 5], [0, 1, 0], clamp),
  );
  return { ...p, press, opacity: interpolate(f, [CURSOR_IN, CURSOR_IN + 5], [0, 1], clamp) };
};

// ---------------------------------------------------------------- scene
const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cam = camAt(f);
  const fx = cam.x + 3 * Math.sin(f / 40);
  const fy = cam.y + 2.5 * Math.sin(f / 53);
  const z = cam.z;
  const reach = 1150 / z;
  const near = (y0: number, y1: number) => y1 > cam.y - reach && y0 < cam.y + reach;

  // photocraft's row opens into its repo page
  const pageH = interpolate(f, OPEN, [ROW.h, PAGE.h], { ...clamp, easing: TRAVEL });
  const headerT = interpolate(f, [OPEN[0], OPEN[0] + 14], [0, 1], { ...clamp, easing: TRAVEL });
  const metaO = interpolate(f, [OPEN[0] - 2, OPEN[0] + 6], [1, 0], clamp);
  const cur = cursorAt(f);

  return (
    <AbsoluteFill style={{ backgroundColor: "#050608" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: WORLD_H,
          transform: `translate(${width / 2 - fx}px, ${height / 2 - fy}px) scale(${z})`,
          transformOrigin: `${fx}px ${fy}px`,
        }}
      >
        {/* the scope trace, vertical: Scope's x axis runs down world y */}
        <svg width={1080} height={WORLD_H} viewBox={`0 0 1080 ${WORLD_H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", zIndex: 1 }}>
          <g transform={`translate(${TRACE_X} 0) rotate(90)`}>
            {/* the trace ends at the PhotoCraft icon (the bottom of the trace) */}
            <Scope frame={f} x0={Math.round(cam.y - reach)} x1={Math.round(Math.min(cam.y + reach, END_ICON.y))} y={0} bumps={traceBumps(f)} hum={1.6} stroke={2.6} color={TRACE_INK} />
          </g>
        </svg>

        {/* the list */}
        {LIST.map((r, i) => {
          const isPC = r === PC;
          const h = isPC ? pageH : ROW.h;
          if (!near(r.top, r.top + h)) return null;
          return (
            <React.Fragment key={r.id}>
              <RepoRow
                row={r}
                frame={f}
                entry={ENTRY[i]}
                wake={WAKE[i]}
                height={h}
                headerT={isPC ? headerT : 0}
                metaOpacity={isPC ? metaO : 1}
              >
                {isPC ? <RepoPage frame={f} /> : null}
              </RepoRow>
              <TraceIcon src={r.icon} y={r.cy} frame={f} wake={WAKE[i]} rgb={r.rgb} entry={ENTRY[i]} />
            </React.Fragment>
          );
        })}

        <CodeDropdown frame={f} />

        {near(TERM.top, END_ICON.y + 80) ? (
          <>
            <Terminal frame={f} />
            <TraceIcon src={PC.icon} y={END_ICON.y} frame={f} wake={END_WAKE} rgb={PC.rgb} size={END_ICON.size} />
          </>
        ) : null}

        <MacCursor x={cur.x} y={cur.y} size={48} press={cur.press} opacity={cur.opacity} />
      </div>
    </AbsoluteFill>
  );
};

export const AcP4OpenSource: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  return (
    <CRT glitchAt={GLITCH}>
      <AbsoluteFill style={{ backgroundColor: "#050608" }}>
        <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
          <Scene />
        </CameraMotionBlur>
      </AbsoluteFill>
    </CRT>
  );
};
