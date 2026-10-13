# DISPATCH: 3 Tips for Better Motion Graphics with AI (Victor organic reel) graphics sprint

Victor, Oct 13: "make the next ones for these two scripts also" (Scripting Briefs). Same treatment as the ArtCraft reel.
Script: Notion brief "3 Tips for Better Motion Graphics with AI" (https://app.notion.com/p/3ec9c1cbbaa181f794f8de4390303c6e), writer's draft opening on the top hook. CTA "Comment MOTION" (no graphic).
Remotion: ~/Work files/promptible/remotion-liam, src/motiontips/ (theme.ts read-only; parts registered as MtP1Hook..MtP8MoreRefs). Shared CRT Scope kit from src/artcraft (theme re-exports it).
Deliver: ../graphics/ named by the line's first words + (9x8)/(9x16).

## Rules
Follow `~/Work files/CREATORS/Victor/reels/organic reels/artcraft adobe/dispatch/RULES.md` in full (CRT Scope, every frame moving, fill the frame, readable on a phone, 8% safe area, real things only, renders), with these overrides:
- Your files are `src/motiontips/<YourComp>.tsx` + helpers under `src/motiontips/<part>/` only. Read-only: src/motiontips/theme.ts, src/artcraft/*, src/resolve/*, src/Root.tsx.
- Stills go to `out/motiontips/<CompId>-f<N>.png`.
- The reel is self-referential ("I made every graphic in this video by typing to an AI"), so the real material is Victor's own pipeline:
  - Remotion: `LOGOS.remotionDark` (official, blue mark + white wordmark) / `LOGOS.remotionMark`.
  - The skill: the real file `~/Work files/CREATORS/Styles/CRT Scope/STYLE.md` (`SKILL_LINES` are its real lines).
  - Prompts: `BAD_PROMPT`, `MOVE_PROMPTS` (real Prompt Bank lines + the script's own examples). Claude Code terminal look: see src/fish7/theme.ts `TERM` and the fish8 terminal comps for the real Claude Code UI grammar; claude.ai dark = `CLAUDE_DARK` in src/artcraft/theme.ts.
  - Finished graphics from this pipeline (real outputs): the ArtCraft MP4s in `~/Work files/CREATORS/Victor/reels/organic reels/artcraft adobe/graphics/` (copy what you need into `public/motiontips/clips/` and use `OffthreadVideo`), and earlier deliverables in CREATORS/ahmed/reels/brand deals (fish 8, invideo 3 graphics folders) for "every video looks different".
  - Real reference material: `public/artcraft/site/*` (app screenshots), `public/resolve/shots/*`, the CRT Scope contact sheet + example MP4 in CREATORS/Styles/CRT Scope, official logos in public/*/logos.
- Brands on screen: Remotion, Claude (and the real third-party logos only where a part shows them AS references). Nothing else.

## Parts (9:16 never above 240)
| # | Comp | Line | Format | Frames |
|---|---|---|---|---|
| T1 | MtP1Hook | "I made every graphic in this video by typing to an AI. These three tips are why they don't look like AI made them." | 9:8 + overlay | 190 |
| T2 | MtP2Remotion | "Motion graphics used to take me hours to do until I discovered Remotion, a free tool that turns simple prompts into motion graphics." | 9:16 | 195 |
| T3 | MtP3LookDifferent | "Thing is, every video edited this way can look different, and if you want consistent results, you have to have a skill." | 9:8 | 180 |
| T4 | MtP4Skill | "A skill is simply a template instruction sheet you give the AI that lists things like the font choice, colors, background, and style that you want for each video." | 9:16 | 240 |
| T5 | MtP5Movement | "A huge mistake a lot of new users make is that they don't tell the AI what kind of movement they want." | 9:8 | 180 |
| T6 | MtP6Direction | "Rather than going 'Make me a well-edited video', you want real direction. Give it specific prompts like 'track this object as it moves' or 'cut out the awkward pauses in this segment'." | 9:16 | 240 |
| T7 | MtP7References | "This can already give you pretty good results, but if you want the video to be perfect, give your AI references to everything." | 9:8 | 185 |
| T8 | MtP8MoreRefs | "Screenshots or demos of your product, and reference videos, and even PNGs of your logo. The more references it has, the more the end result will match what you actually want." | 9:16 | 240 |

## Concepts (one per part; the builder owns the details)
- **T2 Remotion.** A Claude Code terminal (dark) shows Victor's real prompt from this session typing ("make it the CRT scope style. Just make sure that it's very visually stimulating and that there's always something going on."), then real code from this repo streams (src/artcraft/kit/Scope.tsx lines) as the Remotion mark wakes on the trace; the trace carries it down into a frame where a finished ArtCraft graphic plays (OffthreadVideo of a delivered MP4). One continuous camera travel down.
- **T3 Look different.** Four or five screens on the trace, each playing a real past graphic in a DIFFERENT look (pull clips from older deliverables: Liam white, fish 8 clean, invideo 3 Vox, etc.), visibly inconsistent; a STYLE.md file card drops onto the trace and a pulse runs through the screens, each one switching to the CRT Scope look (ArtCraft clips) as it passes. Ends consistent, still playing.
- **T4 Skill.** The real STYLE.md open in a dark editor panel (big mono text, `SKILL_LINES`), its lines highlighting one at a time while a sample scene below changes to match each line: black screen (ground crushes), phosphor halation (the tube glow comes on), tube surface (scanlines/grille appear), convergence (RGB split), oscilloscope trace (the line draws in), dark UI panels (a white card turns dark). Build the sample from the real CRT kit (vary `CRT` props / cross-fade from no-CRT to CRT). Fill the frame: editor top half, sample bottom half.
- **T5 Movement.** A scene where cards just fade in and sit there (a static "slideshow" made of real UI cards) while the scope trace goes FLAT like a flatline monitor; the camera itself creeps (never frozen) and the stillness reads as the problem. Near the end, a single pulse kicks the trace back to life as the cut to T6 approaches.
- **T6 Direction.** Claude Code prompt: `BAD_PROMPT` types, gets deleted, and "track this object as it moves" types instead; below, a real UI card glides across the frame and the camera follows it (demonstrating the prompt). Then "cut out the awkward pauses in this segment" types and a real audio waveform below collapses its silent gaps, the segments snapping together. The trace is alive throughout.
- **T7 References.** A Claude Code / claude.ai prompt gets attachments dropped in as real file chips with real file names from this repo (photocraft-hero.webp, example - fish 8 hook.mp4, claude.svg, Adobe_Photoshop_CC_icon.svg), each flying in along the trace; the camera pushes in on the growing attachment row.
- **T8 More refs.** Three reference kinds land on the trace in turn: a real app screenshot (PhotoCraft), a reference video playing (the CRT Scope example MP4), and official logos (Claude, Remotion, Resolve). With each one, a packet flows into an output frame that gets closer to the finished graphic (crossfading through real intermediate states into the delivered ArtCraft P2 frame). Ends on the finished graphic playing.
- **T1 Hook.** After Victor picks.

## Waves
ArtCraft first. Then interleave with the Resolve reel, two builders at a time. Serial renders, strict black check, deliver per part, open for Victor.

## T1 Hook (orchestrator's pick, Oct 13; Victor had not answered, so built on the recommendation, swappable)
- Graphic: "This reel's own graphics". In front, a Claude Code terminal (T2's look) types Victor's real prompt; behind it, in real 2.5D depth (CSS perspective, per-plane blur by depth, parallax; model: src/artcraft/AcP1Hook.tsx + p1/rig.ts), the actual finished graphics from his reels stand as CRT screens receding down the scope rail, each PLAYING (OffthreadVideo of delivered MP4s from artcraft adobe/graphics, davinci resolve/graphics, remotion tips/graphics; copy trims into public/motiontips/t1/). The camera pulls out of the terminal and flies down the row of screens as each one powers on. Ends on a slow orbit. Every frame moving, frame filled.
- Overlay: `HOOK_OVERLAY` ("Every graphic here was typed") via `src/invideo3/p1/HookOverlay.tsx` as is (plain white text, no box), rendered OUTSIDE the CRT, frame 0 to ~64.
