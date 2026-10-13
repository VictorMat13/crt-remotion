// ===========================================================================
// DaVinci Resolve x Claude (Victor organic reel, Oct 2026). Shared series tokens.
// READ-ONLY for builders: import from here, build layouts in your own file.
//
// Style: CRT Scope, same kit as the ArtCraft series (../artcraft): the readable
// CRT tube, the Scope trace, PH palette, EASE, safeRect (8% top/left/right).
// Real assets: public/resolve/shots (official Blackmagic press-kit screenshots of
// Resolve 21 + Reference Manual figures), public/resolve/logos (official marks),
// facts in public/resolve/SOURCES.md. Never use shots/_do-not-use (AI-stylized
// thumbnails with invented quotes) or bmd-21-1-press-1.jpg (marketing art).
// ===========================================================================
export { EASE, FONT_UI, FONT_MONO, CRT, PH, SAFE, safeRect, FPS } from "../artcraft/theme";
export { Scope, type ScopeBump } from "../artcraft/kit/Scope";

// Script parts (writer's draft in Notion "DaVinci Resolve Now Works with Claude and ChatGPT").
// VO is Victor's, never on screen. Frames at Victor's pace (~3.7 words/s).
export const PARTS = {
  r1: { id: "DrP1Hook", fmt: "9x8", frames: 240, line: "I just watched someone turn hours of footage into a YouTube video by typing one sentence into DaVinci Resolve. But video editors don't have to worry about it yet." }, // H3 (orchestrator's pick, Victor may swap)
  r2: { id: "DrP2Connect", fmt: "9x16", frames: 180, line: "Resolve's new 21.1 update lets you connect Claude or ChatGPT straight into the app to do the boring editing for you." },
  r3: { id: "DrP3Highlight", fmt: "9x8", frames: 285, line: "So if you prompt something like \"Make a 60-second highlight from 2 hours of footage\", the AI will pull the best moments and drop the cut onto your timeline while you can relax." },
  r4: { id: "DrP4Hours", fmt: "9x16", frames: 135, line: "This same task would've taken hours before, and we're barely scratching the surface here." },
  r5: { id: "DrP5CanDo", fmt: "9x8", frames: 150, line: "It can color grade your edits, trim your footage, add subtitles, organize assets, and a whole lot more." },
  r6: { id: "DrP6Ceo", fmt: "9x16", frames: 240, line: "And for the video editors watching this, I know it sounds intimidating, but their own CEO has stated the update was introduced to free editors from boring tasks so they can focus on the creative decisions that actually matter." },
  r7: { id: "DrP7OffYourPlate", fmt: "9x8", frames: 135, line: "Basically, it's there to take work off your plate, not take you out of the process." },
} as const;

export const HOOK_OVERLAY = "2 hours of footage, one sentence"; // hook graphic 1 (orchestrator's pick, Victor may swap)

// Verified facts (public/resolve/SOURCES.md, primary sources).
export const RESOLVE = {
  version: "21.1",
  announced: "Sept 8, 2026", // Blackmagic press release, IBC Amsterdam
  app: "DaVinci Resolve Studio 21", // the AI feature is Studio-only (Reference Manual p.4318)
  setupMenu: ["File", "Setup AI Assistants"],
  // the real dialog (shots/manual-p4318-ai-assistant-config-dialog.png)
  dialog: {
    title: "AI Assistants Configured",
    body: "The DaVinci Resolve MCP server has been added to these AI assistants. Please restart them for changes to take effect.",
    list: ["Claude Desktop (extension installer opened)", "Claude Code", "Codex in ChatGPT", "Google Antigravity", "Grok"],
    ok: "OK",
  },
  // press release wording of what it can do
  canDo: ["analyze projects", "organize media", "adjust settings", "batch render", "create highlight edits from long form video", "remove unwanted clips", "render deliverables"],
  // Reference Manual wording
  canDoManual: ["organize timelines", "create custom looks", "create and run scripts"],
  // EXACT, Blackmagic press release 2026-09-08. Petty says "repetitive", not "boring".
  quote:
    "With AI assistant support, our customers can now ask Claude or ChatGPT to handle repetitive tasks such as create highlight edits, organizing media or batch rendering, which frees them up to focus on creative decisions.",
  quoteBy: "Grant Petty, Blackmagic Design CEO",
  // NOT supported by any primary source: subtitles. Never show the AI making subtitles.
} as const;

// The prompt from the script (in-world text the person types).
export const HIGHLIGHT_PROMPT = "Make a 60-second highlight from 2 hours of footage";

// Official Blackmagic press-kit screenshots (Resolve 21). Width x height in px.
export const SHOTS = {
  edit: { src: "resolve/shots/bmd-resolve21-Edit-hires.png", w: 5120, h: 2880 },
  cut: { src: "resolve/shots/bmd-resolve21-Cut-hires.png", w: 3840, h: 2160 },
  color: { src: "resolve/shots/bmd-resolve21-Color-hires.png", w: 3840, h: 2160 },
  fusion: { src: "resolve/shots/bmd-resolve21-Fusion-hires.png", w: 3840, h: 2160 },
  fairlight: { src: "resolve/shots/bmd-resolve21-Fairlight-hires.png", w: 3840, h: 2160 },
  photo: { src: "resolve/shots/bmd-resolve21-Photo-hires.png", w: 3840, h: 2160 },
  media: { src: "resolve/shots/manual-media-page.png", w: 1034, h: 569 },
  aiDialog: { src: "resolve/shots/manual-p4318-ai-assistant-config-dialog.png", w: 538, h: 326 },
  quickExport: { src: "resolve/shots/manual-deliver-a.png", w: 951, h: 572 },
  renderSettings: { src: "resolve/shots/manual-deliver-render-settings.png", w: 0, h: 0 },
  colorNodes: { src: "resolve/shots/manual-color-nodes-a.png", w: 1034, h: 587 },
} as const;

export const LOGOS = {
  resolve: "resolve/logos/davinci-resolve-icon.svg",
  blackmagic: "resolve/logos/blackmagic-design-logo-official.svg",
  claude: "resolve/logos/claude.svg",
  chatgpt: "resolve/logos/chatgpt-logo.svg",
  openai: "resolve/logos/openai-symbol.svg",
} as const;
