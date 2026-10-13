# AGENT P5: AcP5PayMonthly (9:8, 1080x960, 150 frames, 5.0s)

Read ./RULES.md first, all of it. Then the reading list in it.

## Your file
- `~/Work files/promptible/remotion-liam/src/artcraft/AcP5PayMonthly.tsx` (stub). Helpers only under `src/artcraft/p5/`.
- Keep exports `AC_P5_DURATION` (150; may adjust 140-165) and `AcP5PayMonthly`.

## The line (Victor's VO, never on screen)
"So if there's an app you pay for every month, you can just ask Claude to build your own."
Rough timing: "So if there's an app you pay for every month" 0-55, "you can just ask Claude to build your own" 55-150.

## Concept: the monthly heartbeat runs into Claude
1. **0-55: every month.** The official Photoshop icon (`LOGOS.photoshop`) sits on the scope trace at the left. The trace beats like a heart monitor: a sharp blip leaves the icon once per month and runs right along the line, with month ticks underneath as in-world axis text (Jan, Feb, Mar ... Dec, mono). The camera trucks right with the beats; the blips keep coming, steady and relentless. No "$", no prices, no labels.
2. **55-150: ask Claude.** The trace runs into a claude.ai dark composer panel (`CLAUDE_DARK`, big, filling the right two thirds): placeholder "How can I help you today?" gives way to `BUILD_PROMPT` typing out (start it already partly typed at 55 so it finishes by ~125; real typing cadence with tiny pauses at commas). The coral send button arms when there is text; the cursor presses it ~130; the Claude mark (`LOGOS.claude`) on the trace wakes with coral amplitude and the monthly blips stop at the composer. Ending: Claude's mark still talking on the trace, caret gone, slow push.

## Notes
- Composer UI: rounded dark box, the prompt in the app's sans at a size that reads on a phone (~30-34px at 1080 wide), the model pill and paperclip/+ icons as in claude.ai. Keep it real and plain.
- Glitch: once, on send (~130).
- Safe area: `safeRect(1080, 960)` = x 86-994, y 77-922. Fill it.
- Stills (max 8): f0, f25, f50, f75, f100, f128, f140, f149.
