# AGENT P4: AcP4OpenSource (9:16, 1080x1920, 210 frames, 7.0s)

Read ./RULES.md first, all of it. Then the reading list in it.

## Your file
- `~/Work files/promptible/remotion-liam/src/artcraft/AcP4OpenSource.tsx` (stub). Helpers only under `src/artcraft/p4/`.
- Keep exports `AC_P4_DURATION` (210, never above 240) and `AcP4OpenSource`.

## The line (Victor's VO, never on screen)
"I mean, this is the future of AI. More and more software is going open source, which means anyone can grab the code and use it for free."
Rough timing at 30fps: "I mean, this is the future of AI" 0-45, "More and more software is going open source" 45-115, "which means anyone can grab the code" 115-170, "and use it for free" 170-210.

## Concept: the repo, the Code button, the clone
GitHub's real dark UI (`GH` tokens), rebuilt in dark panels so it survives the tube. One continuous shot down a tall world.
1. **0-115: repos keep coming.** A vertical scope trace runs down the frame and the 12 Craft repos sit on it as GitHub repo list rows (`REPOS`: "storytold / photocraft", Public pill, the language dot "Rust", "Apache-2.0", the star count). Rows stream up into view one after another (more and more software), each one waking its app icon (`appIcon`) at the row's left as a packet passes it on the trace. Star counts tick up slightly as live counters (start a little below the real `REPOS[].stars` and land on it). Camera travels down the list and slows onto photocraft.
2. **115-170: grab the code.** photocraft opens into its repo page: header "storytold / photocraft" + Public, the real file list (`REPO.files`), ★ `REPO.stars`, forks `REPO.forks`, "2,012 Commits" (`REPO.commits`). A plain macOS arrow cursor clicks the green "<> Code" button; GitHub's real dropdown opens: "Local" tab, "Clone", "HTTPS", the URL `REPO.clone` with the copy icon, then "Download ZIP". Cursor clicks the copy icon (it turns into a check).
3. **170-210: use it.** A packet carries the URL down the trace into a dark terminal panel that types `git clone https://github.com/storytold/photocraft.git` and prints the REAL clone output from `public/artcraft/data/photocraft-git-clone.log` (read it: "Cloning into 'photocraft'...", "remote: Enumerating objects: 33738, done.", "Receiving objects: ...% (n/33738), x MiB | y MiB/s" ticking, "Resolving deltas: 100% (24635/24635), done."). Progress runs as a real ticking counter. The PhotoCraft icon at the bottom of the trace wakes when it finishes. Still moving at the last frame (cursor caret, trace).

## Notes
- No narration text. "Open source", "free" never appear except inside real UI (the "Apache-2.0" license label is real).
- Glitch: once when the repo page opens (~115).
- Safe area: `safeRect(1080, 1920)` = x 86-994, y 154-1690. Fill it: big rows, big repo page.
- Stills (max 8): f0, f40, f90, f120, f145, f170, f195, f209.
