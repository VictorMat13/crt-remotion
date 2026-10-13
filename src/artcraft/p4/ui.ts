import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// ===========================================================================
// GitHub dark (github.com default dark), adjusted only where the CRT grade
// would erase it: the tube crushes anything darker than ~30% to black, so
// muted grays, the link blue, edges and the green button are lifted to the
// next real Primer step that survives. Panels stay dark (they crush to black).
// ===========================================================================

export const { fontFamily: UI_FONT } = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
export const { fontFamily: MONO_FONT } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

export const UI = {
  link: "#79C0FF", // Primer dark blue.2 (links are #4493F8; that crushes to a dim navy in the tube)
  linkRgb: [121, 192, 255] as const,
  ink: "#E6EDF3", // fg.default
  inkRgb: [230, 237, 243] as const,
  out: "#D2D8DF", // terminal output
  meta: "#A9B1BA", // fg.muted #7D8590 lifted
  edge: "rgba(233,231,226,0.55)", // panel edges
  hair: "rgba(233,231,226,0.42)", // dividers inside panels
  rust: "#DEA584", // GitHub's Rust language color
  green: "#2EA043", // primary button (#238636 crushes to near black)
  check: "#3FB950", // success fg
  tab: "#F78166", // selected tab underline
  folder: "#9AA6B4", // directory icon
  panel: "#0D1117", // GH canvas
  red: "#FF5F57",
  amber: "#FEBC2E",
  lime: "#28C840",
} as const;

export const mix = (a: readonly number[], b: readonly number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
