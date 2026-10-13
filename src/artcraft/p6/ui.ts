import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { CLAUDE_DARK } from "../theme";

// ===========================================================================
// claude.ai dark (CLAUDE_DARK) for the tube. Surfaces keep their real colors
// (the CRT grade crushes them to black, like P4's GitHub panels); everything
// that has to read is lifted: edges, dividers, the toggle pill, muted text.
// The built app is its own dark UI (the colors in p6/code.ts), lifted the
// same way. Bright image content is taken down ~20% (halation blows it out).
// ===========================================================================

export const { fontFamily: UI_FONT } = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
export const { fontFamily: MONO_FONT } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

export const C = {
  page: CLAUDE_DARK.bg,
  panel: CLAUDE_DARK.sidebar, // artifact panel body
  bubble: "#34332F", // user bubble (#141413 lifted one step so its shape survives the grade)
  ink: CLAUDE_DARK.text,
  muted: "#BDBAB1", // CLAUDE_DARK.muted lifted
  edge: "rgba(233,231,226,0.5)",
  edgeSoft: "rgba(233,231,226,0.32)",
  hair: "rgba(233,231,226,0.38)",
  pill: "#5E5C56", // active toggle segment
  track: "#2E2D2A",
  // the built app (p6/code.ts colors, lifted)
  app: "#111214",
  stage: "#0B0C0E",
  field: "#1B1D21",
  fieldEdge: "rgba(233,231,226,0.5)",
  label: "#D3D1CA",
  blue: "#4F8EF7", // #3b82f6 lifted one step (the tube crushes the darker blue)
  blueRgb: "79,142,247",
  button: "#3B77E6", // Export PNG: a step deeper so its white label holds against the bloom
  select: "rgba(79,142,247,0.55)",
  check: "#3FB950",
} as const;

// code view syntax colors (dimmed: the code is texture, nobody reads it)
export const SYN = {
  id: "#D2D5DA",
  kw: "#F0A58C",
  str: "#A9D79A",
  tag: "#8DB9F2",
  num: "#E9C46A",
  prop: "#9FCCE8",
  pun: "#AEB3BA",
  gutter: "#8E939E",
} as const;
