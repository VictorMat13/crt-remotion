# DISPATCH: DaVinci Resolve x Claude (Victor organic reel) graphics sprint

Victor, Oct 13: "make the next ones for these two scripts also" (Scripting Briefs). Same treatment as the ArtCraft reel.
Script: Notion brief "DaVinci Resolve Now Works with Claude and ChatGPT" (https://app.notion.com/p/3ec9c1cbbaa181578371fe0c51be34d1), writer's draft. CTA "Comment RESOLVE" (no graphic).
Remotion: ~/Work files/promptible/remotion-liam, src/resolve/ (theme.ts read-only; parts registered as DrP1Hook..DrP7OffYourPlate). Shared CRT Scope kit from src/artcraft (theme re-exports it).
Facts + assets: public/resolve/SOURCES.md (read it), public/resolve/shots, public/resolve/logos.
Deliver: ../graphics/ named by the line's first words + (9x8)/(9x16).

## Rules
Follow `~/Work files/CREATORS/Victor/reels/organic reels/artcraft adobe/dispatch/RULES.md` in full (CRT Scope, every frame moving, fill the frame, readable on a phone, 8% safe area, real things only, renders), with these overrides:
- Your files are `src/resolve/<YourComp>.tsx` + helpers under `src/resolve/<part>/` only. Read-only: src/resolve/theme.ts, src/artcraft/*, src/Root.tsx.
- Stills go to `out/resolve/<CompId>-f<N>.png`.
- Real assets: `public/resolve/shots/*` (official Blackmagic press-kit screenshots of Resolve 21, 3840-5120px wide, so push in close: their UI text reads at 1.4-2x), manual figures, `public/resolve/logos/*` (Resolve icon, Blackmagic logo, Claude, ChatGPT, OpenAI). NEVER `shots/_do-not-use/*`, `bmd-21-1-press-1.jpg`, or anything in `frames/` (third-party YouTube, reference only).
- Facts: only what theme.ts `RESOLVE` holds. The AI making subtitles is NOT supported by any source: never show it. Petty's quote says "repetitive tasks", use it verbatim if shown.
- Brands on screen: DaVinci Resolve / Blackmagic (real UI + marks), Claude, ChatGPT. Nothing else.
- Real prompts: `HIGHLIGHT_PROMPT`. Claude composer = claude.ai dark (`CLAUDE_DARK` in src/artcraft/theme.ts).

## Parts (frames at Victor's pace; 9:16 never above 240)
| # | Comp | Line | Format | Frames |
|---|---|---|---|---|
| R1 | DrP1Hook | pending Victor's pick | 9:8 + overlay | 180 |
| R2 | DrP2Connect | "Resolve's new 21.1 update lets you connect Claude or ChatGPT straight into the app to do the boring editing for you." | 9:16 | 180 |
| R3 | DrP3Highlight | "So if you prompt something like 'Make a 60-second highlight from 2 hours of footage', the AI will pull the best moments and drop the cut onto your timeline while you can relax." | 9:8 | 285 |
| R4 | DrP4Hours | "This same task would've taken hours before, and we're barely scratching the surface here." | 9:16 | 135 |
| R5 | DrP5CanDo | "It can color grade your edits, trim your footage, add subtitles, organize assets, and a whole lot more." | 9:8 | 150 |
| R6 | DrP6Ceo | "And for the video editors watching this... their own CEO has stated the update was introduced to free editors from boring tasks so they can focus on the creative decisions that actually matter." | 9:16 | 240 |
| R7 | DrP7OffYourPlate | "Basically, it's there to take work off your plate, not take you out of the process." | 9:8 | 135 |

## Concepts (one per part; the builder owns the details)
- **R2 Connect.** Claude mark and ChatGPT mark each on a scope trace; packets run down both traces into the Resolve icon (traces converge). The real "AI Assistants Configured" dialog (rebuild it as a dark panel from shots/manual-p4318-ai-assistant-config-dialog.png with the exact `RESOLVE.dialog` strings, BIG) assembles; its list rows light one by one as packets arrive; OK presses. Camera then travels down into the real Edit page (push in on the timeline) as a coral packet lands on it. Opens mid-action.
- **R3 Highlight.** A dark Claude composer types `HIGHLIGHT_PROMPT` (already partly typed at f0), send, Claude's mark talks coral on the trace. The trace runs into the real Edit page, pushed in on the timeline: a long source strip (built from real clip thumbnails cropped out of the Edit/Cut screenshots) scrubs fast, colored markers drop on the best moments, those moments lift out and fly down onto a fresh timeline track, packing into a short cut; the record timecode in Resolve's own format ticks to the 60-second length. Last beat: the cut plays in the real viewer region while the camera eases out ("while you can relax").
- **R4 Hours.** Start pushed in on one real page, then a long eased pull-back reveals the six real pages (Cut, Edit, Fusion, Color, Fairlight, Photo shots) standing in depth (2.5D, blur by distance), with Resolve's real page bar (Media, Cut, Edit, Fusion, Color, Fairlight, Deliver) lighting along the trace. Fill the frame with the stack.
- **R5 Can do.** A fast eased tour across real pages, one capability per ~35f, the camera always travelling: Color page (push in on the HDR Color Wheels; the wheel pucks drift and the parade scope shifts), Edit timeline (a clip's edge trims in), Media page (clip thumbnails re-sort into bins), then a quick pull back across Fusion and Fairlight for "a whole lot more". Skip subtitles entirely.
- **R6 CEO.** A dark press-release panel: Blackmagic Design logo, the real dateline "IBC 2026, Amsterdam, Netherlands - Tuesday, September 8, 2026", then `RESOLVE.quote` typing out BIG, with `RESOLVE.quoteBy`. A text-selection highlight (in-world, like dragging a cursor) sweeps "repetitive tasks such as create highlight edits, organizing media or batch rendering" and those three task names lift off along a coral trace to the Claude mark; then the selection sweeps "focus on creative decisions" and a green trace runs to the real Color page (the creative part the editor keeps). 8s cap: it covers the start of the line.
- **R7 Off your plate.** The real Edit timeline, pushed in: the editor's own playhead (green, `PH.user`) keeps scrubbing and a clip gets nudged by a plain cursor (the person stays in the process), while coral jobs lift off the timeline along the trace into a render queue panel (Deliver render settings look, from shots/manual-deliver-render-settings.png) and complete with progress bars. Ending keeps both moving.
- **R1 Hook.** After Victor picks.

## Waves
ArtCraft first (its builders hold the two slots). Then: R2 + R3, R4 + R5, R6 + R7, R1 when picked. Serial renders, strict black check, deliver per part, open for Victor.

## R1 Hook (orchestrator's pick, Oct 13; Victor had not answered, so built on the recommendation, swappable)
- Spoken hook H3: "I just watched someone turn hours of footage into a YouTube video by typing one sentence into DaVinci Resolve. But video editors don't have to worry about it yet." (240f, 8s)
- Graphic: "2 hours, one sentence". A long real filmstrip (frames cropped from the press-kit shots, like R3's strip) recedes in perspective to the horizon of the tube (2.5D: CSS perspective, per-plane blur by depth, parallax; model: src/artcraft/AcP1Hook.tsx + p1/rig.ts). The scope trace runs along it like a rail. A coral Claude pulse races down the rail; as it passes, a handful of moments lift off the strip and fly forward toward the camera, landing in a short cut on a real Resolve timeline track in the foreground (blue V2 colours). The record timecode ticks to the 60-second length. Ends on a slow orbit with the cut playing in the real record viewer. Every frame moving, frame filled.
- Overlay: `HOOK_OVERLAY` via `src/invideo3/p1/HookOverlay.tsx` as is (plain white Inter 800 ~38px, soft shadow, NO box), rendered OUTSIDE the CRT, frame 0 to ~64.
