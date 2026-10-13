# AGENT P6: AcP6NoCode (9:16, 1080x1920, 240 frames, 8.0s)

Read ./RULES.md first, all of it. Then the reading list in it. Look at `src/artcraft/AcP5PayMonthly.tsx` if it exists (this part continues it: same composer, same prompt).

## Your file
- `~/Work files/promptible/remotion-liam/src/artcraft/AcP6NoCode.tsx` (stub). Helpers only under `src/artcraft/p6/`.
- Keep exports `AC_P6_DURATION` (240, never above) and `AcP6NoCode`.

## The line (Victor's VO, never on screen)
"And you can do this even if you've never written a line of code. If you can describe what you want, Claude can make a simple version of it."
Rough timing: "even if you've never written a line of code" 0-90, "If you can describe what you want" 90-150, "Claude can make a simple version of it" 150-240.

## Concept: code you never touch, then the app
claude.ai dark (`CLAUDE_DARK`). Top of frame: the sent user message (`BUILD_PROMPT`) in the user bubble, the Claude mark on a horizontal scope trace under it talking in coral while it works. Below: the artifact panel, big.
1. **0-90: the code writes itself.** The artifact panel shows its Code view: a single-file HTML/JS crop-and-resize photo editor streaming in fast (write real, working-looking code: canvas, crop rect, width/height inputs, export to PNG). It scrolls by too fast to read, dimmed: nobody has to touch it. The trace pulses with each burst.
2. **90-150: described, so built.** The panel's toggle flips from Code to Preview with an eased push. The simple app appears: a dark mini editor with the Great Wave image (the public-domain print, crop it out of `appShot("photocraft")` canvas region), a crop box with handles, Width/Height fields with a lock, and an Export PNG button.
3. **150-240: it works.** A plain arrow cursor drags a crop handle (the crop box eases), the image crops; it types a new width (the height follows by aspect); it clicks Export PNG and a download chip appears. The trace turns green (`PH.user`) when the person uses the app. Ending keeps a slow push and the trace alive.

## Notes
- Only real in-world UI strings. Claude's reply text, if any shows above the artifact, is one short plain line in the claude.ai reply style; no marketing tone.
- Glitch: once on the Code to Preview flip (~92).
- Safe area: `safeRect(1080, 1920)` = x 86-994, y 154-1690. Fill it: the artifact panel takes most of the frame.
- Stills (max 8): f0, f45, f88, f100, f140, f175, f210, f239.
