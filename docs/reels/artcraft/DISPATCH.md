# DISPATCH: ArtCraft x Victor (organic reel) graphics sprint

Orchestrator: Claude (main session). Builders: Opus sub-agents, at most two building at a time. Final renders: main session only, serial.
Script: ../SCRIPT_artcraft-adobe.md (v6, ~57s, CTA "Comment CRAFT"). Notion: https://app.notion.com/p/One-guy-rebuilt-Adobe-with-Claude-free-ArtCraft-apps-3f79c1cbbaa181279143f6eefa9840d5
Remotion project: ~/Work files/promptible/remotion-liam, source folder src/artcraft/ (theme.ts + kit/Scope.tsx read-only for builders; all seven parts already registered in Root.tsx as AcP1Hook..AcP7WhereHeading).
Rules for every builder: ./RULES.md. Prompt bank: CREATORS/Remotion Prompt Bank/full-reel-series.md + depth.md.
Deliver MP4s to: ../graphics/ named by the line's opening words + (9x8) / (9x16).

## Locked decisions (Victor, Oct 13)
- Style: CRT Scope (CREATORS/Styles/CRT Scope), reference "Almost nobody in sales is" (fish 8/backups/crt-v5).
- Hook: 9:8 with overlay text, depth inside the tube (perspective, DOF, parallax; no three.js). Concept: 1, power-on rail (Victor, Oct 13: "You could get started" after my pick). Overlay "Claude rebuilt Adobe for free".
- Rest: mix 9:8 and 9:16, alternating. No 9:16 longer than 8s. Nothing for the CTA ("Comment CRAFT").
- Very visually stimulating: every frame moving, smooth eased transitions, the frame filled (no big empty space).
- Padding: 8% top, left, right.

## Parts
| # | Comp | Line | Format | Frames |
|---|---|---|---|---|
| P1 | AcP1Hook | "Somebody just used Claude to rebuild Photoshop, Premiere and After Effects, and he's giving every one of them away for free. Let me show you what that means for you." | 9:8 + overlay | 240 |
| P2 | AcP2SameShortcuts | "These are apps people pay Adobe hundreds of dollars a year for, and the free copies have almost every feature, right down to the same keyboard shortcuts. If you know Photoshop, you already know how to use this." | 9:16 | 240 |
| P3 | AcP3ThirtyYears | "But here's where it gets crazy. Adobe spent over thirty years building these apps, and Claude rebuilt them in a couple of weeks." | 9:8 | 180 |
| P4 | AcP4OpenSource | "I mean, this is the future of AI. More and more software is going open source, which means anyone can grab the code and use it for free." | 9:16 | 210 |
| P5 | AcP5PayMonthly | "So if there's an app you pay for every month, you can just ask Claude to build your own." | 9:8 | 150 |
| P6 | AcP6NoCode | "And you can do this even if you've never written a line of code. If you can describe what you want, Claude can make a simple version of it." | 9:16 | 240 |
| P7 | AcP7WhereHeading | "And this is where everything's heading. You won't need to download and pay for apps anymore. You'll just tell AI what you need, and it'll build it for you, fully custom, with exactly the features you want." | 9:8 | 300 |
| CTA | none | "Comment CRAFT and I'll send you the download link." | none | none |

## Waves (two builders at a time)
1. Wave 1: P2 + P3.
2. Wave 2: P1 hook (as soon as Victor picks) + P4.
3. Wave 3: P5 + P6.
4. Wave 4: P7.
5. RED TEAM (main session): stills vs the CRT reference, no narration text, safe zones (8%), frame filled, every frame moving, real assets only.
6. Serial final renders (lock + memory gate, --concurrency=1), strict black check (pix_th=0.02), deliver per part to ../graphics/, open each for Victor.

## Gates
- Plan: Victor, Oct 13 ("make it the CRT scope style... start once the video is done"). Watcher confirmed the invideo session idle 15+ min, no renders. PASSED.
- Pre-dispatch: theme.ts, kit/Scope.tsx, 7 stubs registered, tsc clean apart from the pre-existing src/bconductor error. PASSED.
- Agent completion: orchestrator reviews stills before any MP4 render.
- Merge readiness: all MP4s pass the strict black check, frames reviewed, named by script words.
