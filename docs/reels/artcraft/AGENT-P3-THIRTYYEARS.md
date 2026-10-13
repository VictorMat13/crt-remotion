# AGENT P3: AcP3ThirtyYears (9:8, 1080x960, 180 frames, 6.0s)

Read ./RULES.md first, all of it. Then the reading list in it.

## Your file
- `~/Work files/promptible/remotion-liam/src/artcraft/AcP3ThirtyYears.tsx` (currently a stub). Helpers only under `src/artcraft/p3/`.
- Keep exports `AC_P3_DURATION` (180; you may adjust within 165-195) and `AcP3ThirtyYears`.

## The line (Victor's VO, never on screen)
"But here's where it gets crazy. Adobe spent over thirty years building these apps, and Claude rebuilt them in a couple of weeks."
Rough timing at 30fps: "But here's where it gets crazy" 0-40, "Adobe spent over thirty years building these apps" 40-105, "and Claude rebuilt them in a couple of weeks" 105-180.

## Concept: the oscilloscope timebase
The scope's horizontal axis is time, like turning the timebase knob on a real oscilloscope.
1. **Thirty years (0-~105).** Three lanes, one per Adobe app, each a live scope trace with the official icon (`ADOBE_FIRST`: Photoshop 1990, Premiere Pro 1991, After Effects 1993) sitting on its trace at its real first-release year. A time axis runs underneath with year ticks 1990 ... 2026 (mono, small, in-world axis text). A sweep point travels the traces from 1990 to 2026 while the camera drifts along with it; the traces it has passed stay lit (like a scope's persistence). The decades should feel LONG: dense year ticks, the sweep taking its time, the camera slowly trucking. Fill the frame: lanes big, the axis wide.
2. **The switch (~105).** One soft glitch, and the timebase zooms: the whole 1990-2026 span compresses into a sliver at the left while the last two weeks (Sep 30 to Oct 13, 2026) expand to fill the frame. Day ticks now (`COMMITS_PER_DAY[].day`). Eased, one continuous move, never a cut.
3. **Two weeks (~110-180).** The Claude mark (`LOGOS.claude`) sits on the trace at Sep 30. The trace now carries the real commit activity: its amplitude (or a row of bars riding the line) follows `COMMITS_PER_DAY` (6 on Sep 30 up to 376 on Oct 9), drawing left to right. The three Craft twins (`appIcon` photocraft, filmcraft, effectcraft) land on the trace at their real repo creation dates (photocraft + filmcraft Sep 30, effectcraft Oct 1; `REPOS`). Underneath, a dark panel scrolls the real git log (sha + subject lines from `public/artcraft/data/photocraft-first-commits.tsv` first, oldest at top starting with "init repo", then `photocraft-recent-commits.tsv`), and a plain counter ticks to the real total in GitHub's own wording ("2,012 Commits", `REPO.commits`) in the panel header. The ending keeps the log scrolling and the trace alive.

## Notes
- Real data only (theme.ts + public/artcraft/data). Never write "30 years", "2 weeks" or any caption: the axis labels carry it.
- Glitch: once, at the timebase switch.
- Safe area: `safeRect(1080, 960)` = x 86-994, y 77-922. Fill it.
- Stills to check (max 8): f0, f30, f70, f100, f112, f130, f155, f179.
