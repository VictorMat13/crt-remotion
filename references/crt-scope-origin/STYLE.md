# CRT Scope style

Approved by Victor on 2026-09-30 ("thats the one"). First used on Ahmed x Fish Audio 8, the "Almost nobody in sales is" hook.

A smooth, restrained 2D scene played back through a color CRT tube. The screen is black, bright elements glow like phosphor, and a live oscilloscope line ties the subjects together. It should read as a real screen, not a filter slapped on top.

- Example: `example - fish 8 hook.mp4` (1080x960, 5.7s). Stills are in `contact-sheet.png`.
- Refs: `references/` holds the Pinterest "Free CRT Template" (green phosphor tube) and the glass cube (RGB dispersion on black).
- Source: `source/` holds snapshots. The live code is in `~/Work files/promptible/remotion-liam/src/fish8/`.

## The look

1. **Black screen.** The scene's gray ground is crushed to near-black by the grade. Content is bright on black.
2. **Phosphor halation.** Bright things bleed light at three blur radii (3 / 14 / 42 px), screen-blended. This glow comes from the tube, so it's allowed. Never add glow to individual elements on top of it.
3. **Tube surface.** Fine vertical aperture-grille stripes, interlaced scanlines that alternate each frame, light grain, and a 3% flicker. A slow, faint refresh band rolls down the screen.
4. **Convergence error.** The red and blue channels are split about 1.6px apart. It's subtle.
5. **Glass.** A vignette plus rounded tube corners.
6. **Glitches are soft and rare.** A brief tracking wobble (about 28px, 6 frames) fires ONLY on story beats. Never use hard tears. Victor said the hard version was "too hard".
7. **Oscilloscope trace.** One live scope line runs across the whole screen, and the subjects sit on it. Each voice shows as wave amplitude around the icon that's talking, in that speaker's color. It's the main way to keep icons from feeling isolated.
8. **Dark UI panels.** White cards bloom out and kill the text on a CRT. Use dark panels (#101217) with light ink so the text glows.

## Motion rules (carried over from the clean-motion reference)

- Bezier easing only: travel `(0.65,0,0.35,1)`, entrances `(0.05,0.7,0.1,1)`, decel `(0.2,0,0,1)`. Nothing linear, no overshoot.
- Open mid-action, with one idea per beat. The camera follows the action and eases out, with a tiny ambient drift.
- Staggered entrances land 2-3 frames apart. Waves and bars move calmly, never jittery.
- `CameraMotionBlur` (shutter 180, 8 samples) wraps the scene.
- No invented labels, stamps or captions. Only real in-world UI text.

## How to use it (Remotion, in remotion-liam)

```tsx
import { CRT } from "../fish8/crt";

export const MyCrtComp = () => (
  <CRT glitchAt={[/* story-beat frames only */]}>
    <MyScene dark scope />
  </CRT>
);
```

- `CRT` accepts `glitchAt` (a list of frames) and `convergence` (in px, default 1.6).
- Build the scene clean first, then wrap it. The CRT pass cannot rescue a vibe-coded scene.
- Verify with a strict black-frame check (`pix_th=0.02`). The normal check flags the intentionally dark frames.

## Don't

- Hard glitch tears, zigzag lightning, sparks, stamps, or all-caps captions.
- Neon glows added per element (the tube already glows).
- White panels inside the CRT.
- 3D. Victor rejected the three.js version.
