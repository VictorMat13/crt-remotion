# AGENT P2: AcP2SameShortcuts (9:16, 1080x1920, 240 frames, 8.0s)

Read ./RULES.md first, all of it. Then the reading list in it.

## Your file
- `~/Work files/promptible/remotion-liam/src/artcraft/AcP2SameShortcuts.tsx` (currently a stub). Helpers only under `src/artcraft/p2/`.
- Keep exports `AC_P2_DURATION` (must stay 240, the 9:16 cap is 8s) and `AcP2SameShortcuts`.

## The line (Victor's VO, never on screen)
"These are apps people pay Adobe hundreds of dollars a year for, and the free copies have almost every feature, right down to the same keyboard shortcuts. If you know Photoshop, you already know how to use this."
The VO runs ~10s; this 9:16 covers the first 8s, then the edit cuts back to Victor. Rough word timing at 30fps: "These are apps... Adobe... a year for" 0-75, "and the free copies have almost every feature" 75-130, "right down to the same keyboard shortcuts" 130-195, "If you know Photoshop" 195-240.

## Concept: twins on the wire, then the same keys
One continuous shot, the camera travels down a tall world.
1. **Twins (0-~110).** Three short scope traces stacked in the upper part of the frame. Each has the official Adobe icon on its left end (Photoshop, Premiere Pro, After Effects: `LOGOS.photoshop/premiere/afterEffects`) and its free Craft twin on its right end (PhotoCraft fox, FilmCraft owl, EffectCraft unicorn: `appIcon(...)`, `ADOBE_FIRST[i].twin`). A packet runs along each trace from the Adobe icon to the twin, staggered; when it lands, the twin wakes to full brightness and its own real screenshot (`appShot`) slides out of it as a dark window. The three screenshots fill the rest of the frame (stack/fan them, big). Icons are big (~170-220px), traces long. No price, no "$", no "free" text.
2. **Same keys (~110-240).** The camera travels down onto the PhotoCraft screenshot, scaled up so its real toolbar + canvas + Layers panel fill the width. A row of dark keycaps (PH.panel, light ink, mono glyphs) sits on a scope trace below the window. Keys press in order with a blip on the trace per press and the matching thing happens in the real UI:
   - `⌘ J` (Layer via Copy, the README's own example "from ⌘J to ⇧⌘D"): duplicate a real layer row by cropping that row's pixels out of the screenshot and inserting the copy; rows below ease down.
   - `V`, `B`, `T` (Move, Brush, Type): a selected-tool highlight moves to that tool's button in the screenshot's real left toolbar (measure button positions on the 1600x1000 image).
   - `⇧ ⌘ D` last if it fits.
   - The cursor can paint one soft stroke on the Great Wave canvas after `B` if it reads cleanly. One idea per beat; drop anything that crowds.
3. End (~215-240): a slow pull-back with the keys still settling and the scope still running. Nothing freezes.

## Notes
- Real assets only: public/artcraft/site and public/artcraft/logos. Look at public/artcraft/site/photocraft-hero.webp at full size before placing anything.
- On-screen text: only key glyphs and whatever is already inside the screenshots. No captions, no labels under icons, no app names typed out.
- Glitch: one soft wobble when the camera arrives on PhotoCraft (~110), optionally one on `⌘ J`.
- Safe area: `safeRect(1080, 1920)` = x 86-994, y 154-1690. Fill it.
- Stills to check (max 8): f0, f40, f90, f120, f150, f180, f215, f239.
