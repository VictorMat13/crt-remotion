# AGENT P7: AcP7WhereHeading (9:8, 1080x960, 300 frames, 10.0s)

Read ./RULES.md first, all of it. Then the reading list in it. Look at the finished sibling parts in `src/artcraft/` for the series' panel language.

## Your file
- `~/Work files/promptible/remotion-liam/src/artcraft/AcP7WhereHeading.tsx` (stub). Helpers only under `src/artcraft/p7/`.
- Keep exports `AC_P7_DURATION` (300; may adjust 285-315) and `AcP7WhereHeading`.

## The line (Victor's VO, never on screen)
"And this is where everything's heading. You won't need to download and pay for apps anymore. You'll just tell AI what you need, and it'll build it for you, fully custom, with exactly the features you want."
Rough timing: "where everything's heading" 0-45, "won't need to download and pay for apps anymore" 45-110, "just tell AI what you need" 110-160, "and it'll build it for you" 160-215, "fully custom, with exactly the features you want" 215-300.

## Concept: say it, it's built
1. **0-110: the downloads fall away.** A row of real app icons (the 12 Craft icons, `appIcon`) sit on the scope trace with download progress bars filling under them. The camera pulls back and the row recedes into depth (perspective, blur by distance), the bars stall and dim, the trace calms. Fill the frame with the receding row, not black.
2. **110-160: tell it.** A green mic ring (fish8 VoiceRing language, `PH.user`, `public/fish8/mic.svg`) sits on the trace at the left; the person's voice drives green amplitude along the line, and a dark composer panel shows the spoken request transcribing word by word: "I need a photo editor that crops, resizes and adds my watermark." (in-world prompt text).
3. **160-300: built, exactly that.** The Claude mark (`LOGOS.claude`) wakes in coral on the trace, a packet runs right, and a custom app window assembles panel by panel (dark UI, real-looking controls, the Great Wave image cropped from `appShot("photocraft")`). A features list on the window's side ticks on one by one: Crop, Resize, Watermark; each tick adds that exact control to the app and it works once (crop box eases, size changes, a watermark appears in the corner). Then one more the person asks for adds itself at the end (Export PNG) to sell "exactly the features you want". Last frames: the app keeps running (cursor, trace, slow push).

## Notes
- No narration text. Feature names are real control labels in the app UI, nothing more.
- Glitch: twice at most: when the row recedes (~60) and when Claude wakes (~160).
- Safe area: `safeRect(1080, 960)` = x 86-994, y 77-922. Fill it.
- Stills (max 8): f0, f50, f100, f135, f170, f210, f255, f299.
