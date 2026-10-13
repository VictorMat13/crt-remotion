---
name: crt-remotion
description: Victor's CRT Remotion style. Real UI and real data played back through a color CRT tube (black ground, phosphor glow, scanlines, a live oscilloscope trace), plus the "3D screen" macro look (a real screenshot on a tilted screen, shallow depth of field, live typing and clicks, handheld camera). Use when Victor asks for "CRT style", "CRT scope", "CRT remotion", "the tube look", "3D screen", "macro screen", "tilted screen with CRT", or continues the ArtCraft, DaVinci Resolve, Motion Tips or Photoshop pieces from Oct 13 2026.
---

# CRT Remotion

One style, two cameras:

1. **The tube (CRT Scope).** A clean 2D scene (real app UI, real data, real logos) wrapped in a color CRT pass. 21 of the 24 reference videos use it.
2. **The screen (3D screen macro).** A real screenshot sits on a physical, tilted monitor and a handheld macro camera films it. It has shallow depth of field, live typing, cursor clicks, and cuts that rack into focus. The CRT is only a light surface texture here. See `renders/photoshop/` and `src/random/PsMacro.tsx`.

Everything here was approved by Victor. Origin: Fish 8 CRT Scope (Sep 30 2026, "thats the one"). Extended Oct 13 2026 across three organic reels (ArtCraft, DaVinci Resolve, 3 Motion Graphics Tips) and two Photoshop pieces.

- Reference videos: `renders/` (all 24, named by the script line they cover).
- One-glance overview: `references/gallery.png`.
- The original style card: `references/crt-scope-origin/` (STYLE.md, contact sheet, Fish 8 hook, Pinterest refs).
- Builder briefs per reel: `docs/reels/*/DISPATCH.md`. The hard rules every builder followed: `docs/reels/artcraft/RULES.md`.

## The tube look

Wrap the finished scene, never individual elements:

```tsx
import { CRT } from "./artcraft/kit/Tube"; // "readable" grade by default

<CRT glitchAt={[/* 1-2 story-beat frames only */]}>
  <Scene />
</CRT>
```

`src/fish8/crt.tsx` is the engine. `src/artcraft/kit/Tube.tsx` defaults it to the readable grade.

1. **Black screen.** The gray ground crushes to near-black. Content is bright on black. Use `grade="readable"` (amp 1.25, exp 1.8) whenever there is text to read. Use `"black"` only for icon-and-trace scenes.
2. **Phosphor halation.** Bright things bleed light at 3, 14 and 42 px, screen-blended. The tube already glows, so never add per-element glows on top.
3. **Tube surface.** Fine RGB aperture grille, interlaced scanlines that alternate each frame, 7% grain, 3% flicker, and a slow faint refresh band rolling down.
4. **Convergence error.** The red and blue channels sit about 1.6 px apart.
5. **Glass.** A vignette and rounded tube corners. The corners mask the outer 14 px.
6. **Glitches are soft and rare.** A 6-frame tracking wobble, only on 1-2 real story beats per part. Never hard tears.
7. **Oscilloscope trace.** One live scope line (`src/artcraft/kit/Scope.tsx`) runs through the scene, and the subjects sit on it. Packets travel along it. A voice shows as wave amplitude around whoever is talking (Claude coral, the person green). It ties isolated icons together.
8. **Dark panels.** Use #101217 with near-white ink. White cards bloom out and kill the text. Real dark app screenshots read well.

## The 3D screen macro look

Template: `src/random/PsMacro.tsx` (10s, 9:16, four shots). Simpler one-move version: `src/random/PsTiltCrt.tsx`.

- **A real screen.** Put the screenshot on a plane inside a monitor bezel, with a desktop color behind any cut-out window. Camera moves are `rotateX / rotateY / translateZ` about a look point under `perspective: 1400`.
- **Lay out at final size.** Position everything in source-pixel coordinates times a scale K (4-5 for macro). Don't scale one small layer up with a transform, or Chrome rasterizes it blurry.
- **Depth of field.** Render the scene 3 times: sharp, 5 px blur and 16 px blur. Mask the blurred copies with a screen-space band through the look point. The band runs along the plane's iso-depth lines, at screen angle `atan(sin ry / (sin rx * cos ry))`. Roll the content in-plane by `atan(sin ry * cos rx / sin rx)` so the line being read sits in the band.
- **Sharp where the eye lands.** Screenshots are low-res. Paint flat patches over the in-focus UI text and redraw it crisp at the measured positions: same color, a matching font (Source Sans 3 for Adobe Clean). Measure the positions from the pixels, never by eye. Check alignment with the `calib` prop (flat, patches at 45%).
- **Live UI.** The text types with human jitter (about 1.75 frames per character) and a blinking caret. A plain arrow cursor glides in on an ease-out, the button shows hover and pressed states, and the selection box jumps the way the real app does. Only real UI states.
- **Cuts.** Hard cut between shots of about 2-3 s. Each shot racks in from blur over 9 frames, and the first shot over 14.
- **Handheld.** Combine slow sway (0.3 Hz, ~15 px), breathing (0.27 Hz), mid wobble (~1.4 Hz, 5 px) and a faint tremor. The camera also pitches and yaws about 0.9 deg and drifts in depth about 18 px. Seed it per shot so every cut is its own take. Keep the in-plane roll on the steady camera so the UI never twists. The focus band rides the shake and breathes about 14 px.
- **Slight CRT on top.** Scanlines at 0.12, a 0.025 grille, 1 px convergence, soft bloom (0.24 / 0.2), grain, a refresh band and a vignette. Light enough that the macro look leads.

## Motion

- Every frame moves: a primary action, secondary UI and ambient motion (scope carrier, drift, caret). No more than about 8 still frames.
- Bezier only. Travel `(0.65,0,0.35,1)`, entrances `(0.05,0.7,0.1,1)`, decel `(0.2,0,0,1)`. No linear moves, no overshoot, no springs. Stagger by 2-3 frames.
- Inside a tube part, beats connect through eased camera travel, not cuts. The macro look uses hard cuts plus a rack focus.
- `CameraMotionBlur` stays at samples 1. 8 samples rendered dark or flickering frames in final MP4s under the CRT grade even when the stills looked fine. Keep big pans under ~40 px per frame instead.
- All motion comes from `useCurrentFrame` and `interpolate`. No CSS animations.

## Layout and legibility (watched on a phone)

- Fill the frame. Scale subjects up. Real secondary UI and data fills the rest. A black half-frame is a failure.
- Safe area: 8% top, left and right. Bottom is 4% on 9:8 and 12% on 9:16. Only the black tube and ambient background bleed.
- Minimum text size: 30 px on 9:8, 34 px on 9:16, and 44 px or more for headlines and counters. Nothing readable under 26 px.
- Push in on screenshots (1.4-1.7x for the tube look, 4-5x for the macro look) on the part the beat is about.
- Hooks are 9:8 with the overlay from `src/invideo3/p1/HookOverlay.tsx`: about 38 px white Inter 800, soft shadow, no box, outside the CRT. The CTA gets no graphic.

## Real things only

- Real screenshots, official logos pulled from the web, and real data files (see each `public/<reel>/SOURCES.md`).
- On-screen text is real in-world UI text only. No narration, labels, stamps, arrows, invented stats, emojis, em dashes or all-caps captions.
- Use a plain arrow cursor. Never an AI driver chip.

## Never

Hard glitch tears, lightning, sparks, per-element neon glows, white panels inside the tube, glassmorphism, gradient text, effects on words, three.js (rejected for this style; CSS 2.5D is fine), toy UI, or more than one idea per beat.

## Render and QA

- Render one at a time (parallel renders crash the Mac) at `--concurrency=1 --crf=16`.
- Run `npm run qa -- <file.mp4>` before delivering. It does a strict black check (`pix_th=0.02`), a per-frame luma dip scan (YAVG under 55% of the median is a fail) and a frozen-frame scan.
- Name deliveries by the first words of their script line plus `(9x8)` or `(9x16)`.

## Project map

| Path | What |
|---|---|
| `src/fish8/crt.tsx` | CRT engine (grades, halation, grille, scanlines, glitch) |
| `src/artcraft/kit/Tube.tsx`, `Scope.tsx` | readable-grade wrapper, oscilloscope trace |
| `src/artcraft/` | ArtCraft reel, AcP1-AcP7 |
| `src/resolve/` | DaVinci Resolve reel, DrP1-DrP7 |
| `src/motiontips/` | 3 Motion Graphics Tips reel, MtP1-MtP8 |
| `src/random/PsMacro.tsx` | 3D screen macro (DOF band, crisp redraw, typing, cursor, handheld) |
| `src/random/PsTiltCrt.tsx` | single tilted-screen drift with slight CRT |
| `src/invideo3/p1/HookOverlay.tsx` | 9:8 hook overlay |
| `public/` | only the assets these comps use |
| `renders/` | the 24 delivered MP4s |
