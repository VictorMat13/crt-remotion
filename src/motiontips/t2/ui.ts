import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// ===========================================================================
// T2 tokens: Victor's Claude Code terminal (Ghostty, dark) for the tube.
// Grammar from src/fish7/terminal.tsx (TERM): traffic lights + tab strip,
// "●" tool bullets, "⎿" results, coral spinner status line, "›/>" prompt with
// a block caret, crimson "bypass permissions" footer. Panel surfaces keep their
// real near-black (the CRT grade crushes them); everything that must read is
// lifted one step so it survives the readable grade.
// ===========================================================================

export const { fontFamily: MONO } = loadMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });

export const UI = {
  body: "#0B0D10",
  chrome: "#16181D",
  edge: "rgba(233,231,226,0.55)",
  hair: "rgba(233,231,226,0.40)",
  ink: "#ECEAE5",
  muted: "#B4B8C0",
  faint: "#8E939E",
  coral: "#E8896A", // Claude Code accent (#D97757) lifted for the grade
  green: "#4FC86A", // finished tool bullet
  crimson: "#F2566E", // Victor's footer (TERM.crimson #DC143C lifted)
  userBg: "#1F2229",
  tabActive: "rgba(255,255,255,0.12)",
  red: "#FF5F57",
  amber: "#FEBC2E",
  lime: "#28C840",
} as const;

// syntax colors for the streamed code (texture: drawn small and dimmed)
export const SYN = {
  id: "#D2D5DA",
  kw: "#F0A58C",
  str: "#A9D79A",
  num: "#E9C46A",
  com: "#8E939E",
  tag: "#8DB9F2",
  pun: "#AEB3BA",
  gutter: "#8E939E",
} as const;
export type SynKind = keyof typeof SYN;

const KW = new Set([
  "import", "from", "export", "const", "let", "type", "return", "if", "for", "of", "null", "as", "extends", "new", "true", "false",
]);

/** a tiny TSX tokenizer, good enough to color a texture */
export const tokenize = (line: string): { t: string; k: SynKind }[] => {
  const out: { t: string; k: SynKind }[] = [];
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\sA-Za-z0-9_$])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) out.push({ t: m[1], k: "com" });
    else if (m[2]) out.push({ t: m[2], k: "str" });
    else if (m[3]) out.push({ t: m[3], k: "tag" });
    else if (m[4]) out.push({ t: m[4], k: "num" });
    else if (m[5]) out.push({ t: m[5], k: KW.has(m[5]) ? "kw" : "id" });
    else if (m[6]) out.push({ t: m[6], k: "id" });
    else out.push({ t: m[7] ?? m[0], k: "pun" });
  }
  return out;
};
