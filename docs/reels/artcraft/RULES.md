# Hard rules for every ArtCraft builder (read all of it)

## Ownership
- Edit ONLY the files your brief names. `src/artcraft/theme.ts`, `src/artcraft/kit/Scope.tsx`, `src/Root.tsx`, `src/fish8/*` and every other folder are read-only. Another builder works in this repo at the same time. Helper files only under the folder your brief names.
- Keep the two exports your brief lists, with the same names (the comp is already registered in Root.tsx).

## Style: CRT Scope (Victor approved, saved style)
- Read `~/Work files/CREATORS/Styles/CRT Scope/STYLE.md` and look at `contact-sheet.png` + `example - fish 8 hook.mp4` there, and `~/.claude/skills/liam-remotion-graphics/reference/examples/fish8-crt-scope/`.
- Build the scene clean on black first, then wrap the whole scene in `<CRT glitchAt={[...]}>` (import `CRT` from `./theme`). The CRT pass gives the phosphor glow, scanlines, convergence split, vignette and tube corners. Never add glow to individual elements on top of it.
- Glitches: soft, only on 1-2 real story beats per part. Never decorative.
- One live oscilloscope trace grounds the subjects (`Scope` from `./kit/Scope`). Subjects sit ON the line; packets travel along it; a voice shows as wave amplitude around whoever is "talking" (Claude coral `PH.claude`, the person green `PH.user`).
- Dark UI panels (`PH.panel` #101217) with light ink. Never white panels inside the tube (they bloom out). Real app screenshots are dark UIs already and read well.
- No 3D (three.js was rejected for this style). 2.5D depth (perspective via CSS transforms, depth-of-field blur by depth, parallax) is fine.

## Motion (Victor, Oct 13: "very visually stimulating... every single frame should have some sort of movement")
- Every frame has something moving. Never more than ~8 consecutive frames where nothing on screen moves. Three layers always: primary (camera move or the main action), secondary (UI entrances, typing, counters, packets on the trace), ambient (the scope carrier, slow camera drift, caret blink). The last frames keep ambient motion; nothing freezes.
- Smooth transitions: beats connect through eased camera travel (follow the action), never hard jumps or cuts inside a part. Bezier only, from `EASE` in theme.ts (`travel` 0.65,0,0.35,1 / `enter` 0.05,0.7,0.1,1 / `decel` 0.2,0,0,1). Never linear, zero overshoot, no bounce, no springs with overshoot. Stagger inner elements 2-3 frames.
- `CameraMotionBlur` stays at samples 1 (Oct 13 finding: 8-sample windows rendered dark, murky or flickering frames in the final MP4s of this series, under the CRT grade; DrP1Hook, DrP4Hours, AcP4 had to be re-rendered without it). Pace fast moves instead (keep big pans under ~40 px/frame) so they read clean without blur.
- All motion from useCurrentFrame / interpolate / Easing.bezier. No CSS transitions or animations.

## Fill the frame (Victor, Oct 13: "there shouldn't be too much empty space. Most of the space should be filled up")
- Scale the subjects up. The safe area should be mostly occupied: secondary real UI/data fills the rest (real screenshots, real file lists, real commit lines, the scope trace). No big empty black zones. Black between elements is fine; a black half-frame is not.

## Readable on a phone (Victor, Oct 13: "some of the stuff is kind of hard to read... make it more visible")
- The frame is watched on a phone, about 1/3 of its pixel size. Any text meant to be read: 9:8 parts at least 30px (labels, axis ticks, log lines), headlines/counters 44px+; 9:16 parts at least 34px. Nothing readable under 26px anywhere. Fewer, bigger lines beat many small ones (show 5-6 log rows, not 10; label every other tick if needed).
- Ink near-white (PH.ink) for anything to be read; PH.muted only for secondary words that are also large. The CRT pass now uses the "readable" grade (kit/Tube.tsx), but dim grey still sinks.
- Real screenshots: their own UI text is small, so the camera pushes in close (1.4-1.7x) on the region that the beat is about (the panel that changes, the button being clicked) instead of showing the whole window small. Follow the action across the screenshot with eased pans.
- Details that carry the beat (a selection box, a duplicated row, a changed value) must be big on screen: at least ~40px tall after camera zoom.

## Safe area (Victor, Oct 13: "8% padding on the top, left, and right sides")
- Use `safeRect(width, height)` from theme.ts. Meaningful content (text, UI, icons) stays inside it: 8% top, 8% left, 8% right; bottom 4% on 9:8 and 12% on 9:16. Only the black tube and ambient background bleed to the edges. The CRT tube corners already mask the outer 14px.

## Real things only
- Real assets: `public/artcraft/site/*` (12 real app icons + real screenshots from getartcraft.com), `public/artcraft/logos/*` (official Adobe Ps/Pr/Ae icons, Claude mark), `public/artcraft/data/*` (real GitHub data). Constants in theme.ts (APPS, REPO, REPOS, COMMITS_PER_DAY, ADOBE_FIRST, GH, CLAUDE_DARK, BUILD_PROMPT).
- On-screen text = real in-world UI text only (app names, menu items, file names, commit messages from the data files, dates, axis ticks). Never text that narrates the VO line, labels under objects, stamps, captions, invented stats, prices, discounts.
- Plain macOS arrow cursor if a cursor is needed. No AI driver chip.
- Brands: Claude (official mark), the Craft apps (their real icons/screenshots), Adobe only via the official Ps/Pr/Ae icons where your brief says so, GitHub UI in P4. Nothing else.

## Never (Victor has rejected each of these)
- Narration text, labels under objects, rubber stamps, counters made up for drama, arrows pointing at things, sparkles, confetti, lightning, per-element glows, neon, glassmorphism, gradient text, screen shake, emojis, em dashes or en dashes in any on-screen text, all-caps captions.
- Effects on words (trails, shine, wobble). Text only moves with its panel, types out, or ticks as a plain counter.
- "Vibe coded" gimmicks: more than one idea per beat, toy UI, invented chat bubbles.

## Renders (this Mac crashes under parallel renders)
- Check stills only, at most 8, one at a time: `npx remotion still <CompId> out/artcraft/<CompId>-f<N>.png --frame <N>`. Before each: `until mkdir /tmp/claude-501/render.lock 2>/dev/null; do sleep 20; done` and `memory_pressure | tail -1` must show free >= 20% (if lower, release the lock, wait, retry). After each, ALWAYS `rmdir /tmp/claude-501/render.lock`, even on failure.
- Never render an MP4. The orchestrator does final renders.
- `npx tsc --noEmit` must be clean before you report, apart from the pre-existing error in src/bconductor/BcP04BuiltWithPaperclip.tsx (not yours, ignore it).

## Reading list (absolute paths)
- ~/.claude/skills/liam-remotion-graphics/SKILL.md and reference/upstream/cinematic-camera.md
- ~/.claude/skills/liam-remotion-graphics/reference/examples/fish8-crt-scope/ and fish8-live-wire-smooth/README.md
- ~/Work files/CREATORS/Styles/CRT Scope/STYLE.md (+ contact-sheet.png)
- ~/Work files/CREATORS/Remotion Prompt Bank/full-reel-series.md and depth.md
- ~/Work files/promptible/remotion-liam/src/artcraft/theme.ts and kit/Scope.tsx
- ~/Work files/promptible/remotion-liam/src/fish8/crt.tsx and src/fish8/F8P01LiveWire.tsx (the approved CRT scene: card language, scope, easing)

## Report back (raw, not prose)
Files written, exports, duration, the still paths with frame number + what each shows, tsc PASS/FAIL, lock released YES, anything the orchestrator should check.
