// ===========================================================================
// 3 Tips for Better Motion Graphics with AI (Victor organic reel, Oct 2026).
// Shared series tokens. READ-ONLY for builders.
//
// Style: CRT Scope, same kit as the ArtCraft series (../artcraft): readable CRT
// tube, Scope trace, PH palette, EASE, safeRect (8% top/left/right).
// The reel is self-referential ("I made every graphic in this video by typing
// to an AI"), so the real material is Victor's own pipeline:
//   - Remotion: official logo public/motiontips/logos/remotion-new-logo-dark.png
//     (blue mark + white wordmark, for dark grounds), remotion-mark.svg (the official mark).
//   - The skill: the REAL CRT Scope style file, ~/Work files/CREATORS/Styles/CRT Scope/STYLE.md
//     (its own lines are quoted below in SKILL_LINES).
//   - The prompts: the REAL Prompt Bank lines (MOVE_PROMPTS) + the script's examples.
//   - References: the real reference frames/screenshots already in public/
//     (artcraft/site/*, resolve/shots/*, fish8 CRT reference contact sheet).
// ===========================================================================
export { EASE, FONT_UI, FONT_MONO, CRT, PH, SAFE, safeRect, FPS } from "../artcraft/theme";
export { Scope, type ScopeBump } from "../artcraft/kit/Scope";

// Script parts (writer's draft + top hook, Notion "3 Tips for Better Motion Graphics with AI").
export const PARTS = {
  t1: { id: "MtP1Hook", fmt: "9x8", frames: 190, line: "I made every graphic in this video by typing to an AI. These three tips are why they don't look like AI made them." },
  t2: { id: "MtP2Remotion", fmt: "9x16", frames: 195, line: "Motion graphics used to take me hours to do until I discovered Remotion, a free tool that turns simple prompts into motion graphics." },
  t3: { id: "MtP3LookDifferent", fmt: "9x8", frames: 180, line: "Thing is, every video edited this way can look different, and if you want consistent results, you have to have a skill." },
  t4: { id: "MtP4Skill", fmt: "9x16", frames: 240, line: "A skill is simply a template instruction sheet you give the AI that lists things like the font choice, colors, background, and style that you want for each video." },
  t5: { id: "MtP5Movement", fmt: "9x8", frames: 180, line: "A huge mistake a lot of new users make is that they don't tell the AI what kind of movement they want." },
  t6: { id: "MtP6Direction", fmt: "9x16", frames: 240, line: "Rather than going \"Make me a well-edited video\", you want real direction. Give it specific prompts like \"track this object as it moves\" or \"cut out the awkward pauses in this segment\"." },
  t7: { id: "MtP7References", fmt: "9x8", frames: 185, line: "This can already give you pretty good results, but if you want the video to be perfect, give your AI references to everything." },
  t8: { id: "MtP8MoreRefs", fmt: "9x16", frames: 240, line: "Screenshots or demos of your product, and reference videos, and even PNGs of your logo. The more references it has, the more the end result will match what you actually want." },
} as const;

export const HOOK_OVERLAY = "Every graphic here was typed"; // PLACEHOLDER until Victor picks

export const LOGOS = {
  remotionDark: "motiontips/logos/remotion-new-logo-dark.png", // 895x213, mark + white wordmark
  remotionMark: "motiontips/logos/remotion-mark.svg", // official mark (remotion-dev/remotion docs static/img/remotion_svg_tiny_ps_profile.svg); remotion-mark.png = crop of the dark lockup
  claude: "motiontips/logos/claude.svg",
} as const;

// The real skill file (CREATORS/Styles/CRT Scope/STYLE.md).
export const SKILL_FILE = "STYLE.md";
// Real lines from STYLE.md (verbatim, backticks dropped; item 7 cut to its first two sentences).
export const SKILL_LINES = [
  "# CRT Scope style",
  "## The look",
  "1. **Black screen.** The scene's gray ground is crushed to near-black by the grade. Content is bright on black.",
  "2. **Phosphor halation.** Bright things bleed light at three blur radii (3 / 14 / 42 px), screen-blended. This glow comes from the tube, so it's allowed. Never add glow to individual elements on top of it.",
  "3. **Tube surface.** Fine vertical aperture-grille stripes, interlaced scanlines that alternate each frame, light grain, and a 3% flicker. A slow, faint refresh band rolls down the screen.",
  "4. **Convergence error.** The red and blue channels are split about 1.6px apart. It's subtle.",
  "7. **Oscilloscope trace.** One live scope line runs across the whole screen, and the subjects sit on it.",
  "8. **Dark UI panels.** White cards bloom out and kill the text on a CRT. Use dark panels (#101217) with light ink so the text glows.",
  "## Motion rules (carried over from the clean-motion reference)",
  "- Bezier easing only: travel (0.65,0,0.35,1), entrances (0.05,0.7,0.1,1), decel (0.2,0,0,1). Nothing linear, no overshoot.",
  "- Staggered entrances land 2-3 frames apart. Waves and bars move calmly, never jittery.",
  "- No invented labels, stamps or captions. Only real in-world UI text.",
] as const;

// Real movement prompts (Remotion Prompt Bank + the script's own examples).
export const BAD_PROMPT = "Make me a well-edited video";
export const MOVE_PROMPTS = [
  "track this object as it moves",
  "the camera follows the card as it moves",
  "smooth zoom-ins",
  "one continuous scene, no hard cuts",
  "perspective, depth of field, parallax",
] as const;
