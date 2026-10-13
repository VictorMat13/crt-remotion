// ===========================================================================
// invideo 3 (Claude Motion) x Ahmed, Oct 2026. Shared series tokens.
// READ-ONLY for builders: import from here, build layouts in your own file.
//
// World = Ahmed's world (fish7/fish8 tokens via invideo + invideo2). The 3D hook
// lives on the slate floor (WORLD.bg); every flat part sits on BlackDepthGround
// (Victor's Oct 6 "cut out the screen recording and change the background").
// Product UI: claude.ai (light, from invideo's own walkthrough video, frames in
// public/invideo3/reference/guide/) and the invideo Editor (dark, IV tokens).
// The finished explainer is the real Vox test Claude built through the invideo
// Editor connector on Oct 12 (public/invideo3/vox/vox-test-5s.mp4, 20 layers,
// spec in public/invideo3/reference/vox-test-build-report.txt).
// ===========================================================================
export { WORLD, SPRINGS, safePadX, FONT_UI, FONT_MONO, SAFE, EASE, IV, IV_UI, IV_LOGO, TERM, AGENTS } from "../invideo2/theme";
export { BLACK, BlackDepthGround } from "../invideo2/BlackDepth";

export const FPS = 30;

// Script parts (VO never appears on screen). Frames at ~230 WPM plus a short tail.
export const PARTS = {
  p1: { id: "Iv3P1Hook", fmt: "9x8", frames: 225, line: "You don't need After Effects to make motion graphics anymore. Claude made this whole explainer from one prompt, and I can still change any part of it." },
  p2: { id: "Iv3P2Connect", fmt: "9x16", frames: 200, line: "Claude works with invideo now, so first I connected them. You go to Settings, then Connectors, hit Discover, find invideo and click Connect." },
  p3: { id: "Iv3P3Request", fmt: "9x8", frames: 215, line: "Then I gave Claude a screenshot of my AI sales team and asked for a Vox-style explainer on how my agents hand off a lead to each other." },
  p4: { id: "Iv3P4Built", fmt: "9x16", frames: 160, line: "It built the whole thing inside invideo in about ten minutes, with every card and every arrow already animated." },
  p5: { id: "Iv3P5Layers", fmt: "9x8", frames: 150, line: "Then I opened the editable timeline, and every title and every card Claude made is its own layer." },
  p6: { id: "Iv3P6Headline", fmt: "9x16", frames: 195, line: "I wanted a different headline, so I clicked it and typed a new one. I didn't have to prompt Claude again or regenerate anything." },
  p7: { id: "Iv3P7SameProject", fmt: "9x8", frames: 160, line: "It's the same project the whole way through, from my prompt in Claude to the final cut in invideo." },
} as const;

// Hook overlay (on P1 only). PLACEHOLDER until Victor picks; builders read this constant, never hardcode.
export const HOOK_OVERLAY = "Motion graphics, no After Effects";

// claude.ai copy. UI strings are real (guide frames g03s-g23s). The chat copy is
// Ahmed's request and Claude's reply written in the reply grammar the guide shows.
export const CLAUDE_UI = {
  settingsPath: ["Settings", "Connectors", "Discover"],
  connectorsTitle: "Connectors",
  connectorTabs: ["Yours", "Discover"],
  search: "invideo",
  connectorName: "invideo Editor",
  connect: "Connect",
  connected: "Connected",
  integrationChip: "Used invideo Editor integration, loaded tools",
  chatTitle: "AI sales team lead handoff explainer",
  request:
    "Here's a screenshot of my AI sales team. Make a Vox-style explainer on how my agents hand off a lead to each other.",
  attachment: "ai-sales-team.png",
  reply: {
    built: "I built your Vox-style explainer in invideo and it's rendered at 1080x1920.",
    watchLabel: "Watch / download:",
    file: "ai_agents_hand_off_a_lead.mp4",
    expiry: "This link expires in about an hour, so grab it soon. You can always re-export from the",
    timelineLink: "editable timeline",
  },
} as const;

// The explainer's headline = its three yellow highlighter tags (like the reference's "LOOK / AT THIS /
// ANIMATION"). P6 retypes the first tag only (t1), so "after" differs from "before" in tag 1 alone.
export const HEADLINE = {
  before: ["HOW AI AGENTS", "HAND OFF", "A LEAD"],
  after: ["HOW MY AGENTS", "HAND OFF", "A LEAD"],
} as const;

// invideo project/timeline names, read from the real test project on Oct 12 (read-only connector dump in
// public/invideo3/reference/timeline-inspect.json: 20 clips on V1-V20, track kinds, clip names, start times).
export const IV3_PROJECT = {
  name: "Claude x invideo test - Vox explainer",
  timeline: "Vox explainer - AI agents hand off a lead",
  size: "1080x1920",
  fps: 30,
} as const;

// Vox explainer look (Victor, Oct 12): EXACTLY the reference Vox collage he sent
// (public/invideo3/reference/voxref-full.mp4 + voxref/*.jpg, sanji.chien IG post DeJ_gTHs-FB, used for style
// only). Aged newsprint and kraft paper, halftone black-and-white archival cut-outs, torn paper, masking tape,
// yellow highlighter tags in serif caps, black torn label with white serif caps, red/white stripes, big pale
// numerals, ink stamps, red hand-drawn route lines with x marks, grain + slight RGB fringing.
// Values below are starting points sampled by eye; the kit builder samples the reference frames and may refine
// them inside kit/vox.tsx.
export const VOX = {
  newsprint: "#D9CDB4",
  kraft: "#B89A72",
  cream: "#EDE6C8",
  ink: "#1C1915",
  highlighter: "#F2C230",
  red: "#D9402B",
  orange: "#E4682C",
  paperWhite: "#F3EFE6",
  fontTag: "Playfair Display", // bold serif caps on the yellow tags and the black label (refine against the frames)
  fontName: "Montserrat", // geometric sans for the torn name label ("CHARLES / DICKENS" look)
  fontType: "Special Elite", // typewriter for small clipping text, if needed
} as const;

// SFX kit (real samples). One sound per visible event, mixed under the VO (peaks ~ -18 dBFS).
export const SFX = {
  typing: "invideo2/sfx/typing.mp3",
  mouseClick: "invideo2/sfx/mouse-click.mp3",
  uiClick: "invideo2/sfx/ui-click.mp3",
  uiPop: "invideo2/sfx/ui-pop.mp3",
  notif: "invideo2/sfx/notif.mp3",
  swipeDeep: "invideo2/sfx/swipe-deep.mp3",
  wooshSoft: "invideo2/sfx/woosh-soft.mp3",
  whooshDeep: "invideo2/sfx/whoosh-deep.wav",
  whooshLow: "invideo2/sfx/whoosh-lowpassed.wav",
  hitSub: "invideo2/sfx/hit-sub.wav",
} as const;
