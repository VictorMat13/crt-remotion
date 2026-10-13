// ===========================================================================
// MtP8MoreRefs plan: world layout, timeline, camera and trace math (T8 only).
// Pure math (Easing + EASE only) so framing can be checked numerically.
//
// One world, 1080 wide, y down (world px == screen px at zoom 1).
//   - The scope trace runs across the world at TY.
//   - Three references stand ON the trace, left to right, each dropping in on
//     its own beat: the real PhotoCraft screenshot, the CRT Scope example MP4
//     (plays), and a stack of official logos (Claude, Remotion, Resolve).
//   - The output frame hangs from the trace under them (its feed "port" sits
//     on the line at x 540). It shows the delivered ArtCraft P2 graphic
//     (These are apps people (9x16).mp4) cropped to its content area
//     (y 0..1660 of 1920), and before that its real intermediate states.
// Each reference sends a green packet (the person's material) along the line
// into the port; the output steps one state closer to the finished graphic.
// ===========================================================================
import { Easing } from "remotion";
import { EASE } from "../theme";

export const DUR = 240;
export const TRAVEL = Easing.bezier(...EASE.travel);
export const ENTER = Easing.bezier(...EASE.enter);
export const DECEL = Easing.bezier(...EASE.decel);
export const c01 = (v: number) => Math.min(1, Math.max(0, v));
/** eased 0 -> 1 between frames a and b */
export const seg = (f: number, a: number, b: number, ease: (n: number) => number = TRAVEL) => ease(c01((f - a) / (b - a)));
/** eased 0 -> 1 that reaches 1 on the last frame while still moving there */
const toEnd = (f: number, a: number, b: number) => seg(f, a, b) / seg(DUR - 1, a, b);

// ---------------------------------------------------------------- lens
export const SCX = 540;
export const SCY = 960;

// ---------------------------------------------------------------- world
export const TY = 560; // the trace
const STAND = 22; // references stand just above the line (clear of its packets)
export const REF_BOTTOM = TY - STAND; // 538

/** the real PhotoCraft screenshot (public/artcraft/site/photocraft-hero.webp, 1600x1000) */
export const SHOT = { x: 86, w: 440, h: 275 } as const;
/** the CRT Scope example video (1080x960 source, 9:8) */
export const VID = { x: 556, w: 300, h: 267 } as const;
/** the logo stack: three PNG tiles */
export const LOGO = { x: 886, size: 88, gap: 10 } as const;
export const LOGO_H = 3 * LOGO.size + 2 * LOGO.gap; // 284

export const SHOT_CX = SHOT.x + SHOT.w / 2; // 306
export const VID_CX = VID.x + VID.w / 2; // 706
export const LOGO_CX = LOGO.x + LOGO.size / 2; // 930

/** the output frame: hangs from the trace across the full safe width. It shows the
 * P2 graphic's content area, P2 px CROP.x..+w, CROP.y..+h (its own tube margins cropped). */
export const CROP = { x: 40, y: 16, w: 1000, h: 1624 } as const;
export const OUT = { x: 86, top: TY + 24, w: 908 } as const;
export const OUT_S = OUT.w / CROP.w; // P2 px -> world px (0.908)
export const OUT_H = CROP.h * OUT_S; // 1475
export const OUT_BOTTOM = OUT.top + OUT_H; // 2059
export const PORT_X = 540;

// ---------------------------------------------------------------- timeline
// VO: "Screenshots or demos of your product," 0-46 | "and reference videos," 46-78 |
// "and even PNGs of your logo." 78-124 | "The more references it has, the more the
// end result will match what you actually want." 124-240
const DROP_H = 430;
/** drop windows [start, land] */
export const SHOT_DROP: [number, number] = [-14, 4]; // earlier (orchestrator): no long empty gray open
export const VID_DROP: [number, number] = [40, 56];
export const LOGO_DROPS: [number, number][] = [
  [76, 92], // bottom tile lands first (Claude)
  [80, 96], // Remotion
  [84, 100], // Resolve, on top
];
/** y offset of a dropping reference (0 = standing on the line) */
export const dropY = (f: number, w: [number, number]) => -DROP_H * (1 - seg(f, w[0], w[1], ENTER));

export type Packet = { from: number; at: number; len: number; amp: number };
/** the three main packets: reference -> port. The output switches state as each one arrives. */
export const MAIN: Packet[] = [
  { from: SHOT_CX, at: 5, len: 11, amp: 20 },
  { from: VID_CX, at: 60, len: 12, amp: 20 },
  { from: LOGO_CX, at: 103, len: 14, amp: 22 },
];
export const ARRIVE = MAIN.map((p) => p.at + p.len); // 31, 72, 117
/** output states: 0 empty, 1 rough (screenshot on gray), 2 CRT look (real ArtCraft P2 check still), 3 delivered P2 */
export const STATE_LEN = 12;
/** one soft wobble: the reference video's look lands in the output */
export const GLITCH = [ARRIVE[1]];

/** after the last one, all three keep feeding the output */
const SOURCES = [SHOT_CX, VID_CX, LOGO_CX];
export const TRICKLE: Packet[] = Array.from({ length: 11 }, (_, i) => ({
  from: SOURCES[i % 3],
  at: 128 + i * 11,
  len: 12,
  amp: 12,
}));
export const ALL_PACKETS = [...MAIN, ...TRICKLE];

/** packet position along the line (eased), and its envelope */
export const packetX = (p: Packet, f: number) => p.from + (PORT_X - p.from) * seg(f, p.at, p.at + p.len);
export const packetEnv = (p: Packet, f: number) =>
  c01((f - p.at + 1) / 3) * (1 - c01((f - (p.at + p.len) + 2) / 3));

/** the P2 graphic plays with P2 frame == comp frame from here (its second half) */
export const P2_FROM = 112;

// ---------------------------------------------------------------- camera
// One continuous move, never resting. It opens close on the screenshot as it
// lands (z 1.12), eases out to the whole reference row as the video and the
// logos land (z 1.0, the row spans the safe width), and from the video on it
// tilts down the rig into the output, which ends filling the frame (the line
// and its packets stay across the top, the row exits through the top edge).
// Axes are overlapping eased segments; the long tilt is still moving on the
// last frame.
export type Cam = { x: number; y: number; z: number };
export const camAt = (f: number): Cam => ({
  x: 460 + 80 * seg(f, -60, 150) + 6 * Math.sin(f / 45),
  y: 968 + 373 * toEnd(f, -40, 320) + 4 * Math.sin(f / 53 + 1.1),
  z: 1.12 - 0.19 * seg(f, -40, 150) + 0.085 * toEnd(f, 110, 330),
});
export const worldTf = (c: Cam) =>
  `translate(${(SCX - c.x * c.z).toFixed(2)}px, ${(SCY - c.y * c.z).toFixed(2)}px) scale(${c.z.toFixed(5)})`;

/** 8 samples only while a reference falls (the fastest moves; the P2 clip is not playing yet) */
export const BLUR_WINS: [number, number][] = [
  [0, 5],
  [40, 53],
  [76, 97],
];
