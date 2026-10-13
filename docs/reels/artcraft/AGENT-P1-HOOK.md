# AGENT P1: AcP1Hook (9:8, 1080x960, 240 frames, 8.0s) + hook overlay

Read ./RULES.md first, all of it. Then the reading list in it, plus `~/Work files/CREATORS/Remotion Prompt Bank/depth.md`.

## Your file
- `~/Work files/promptible/remotion-liam/src/artcraft/AcP1Hook.tsx` (currently a stub). Helpers only under `src/artcraft/p1/`.
- Keep exports `AC_P1_DURATION` (240) and `AcP1Hook`.

## The line (Victor's VO, never on screen)
"Somebody just used Claude to rebuild Photoshop, Premiere and After Effects, and he's giving every one of them away for free. Let me show you what that means for you."
Rough timing at 30fps: "Somebody just used Claude to rebuild Photoshop" 0-50, "Premiere" 50-65, "and After Effects" 65-85, "and he's giving every one of them away for free" 85-150, "Let me show you what that means for you" 150-240.

## Concept (Victor's pick, Oct 13): power-on rail
The scope line runs deep into the tube like a rail (drawn on a receding floor plane, CSS perspective, no three.js). A coral pulse leaves the Claude mark (`LOGOS.claude`, near the camera at the start) and races away down the rail. Each app window standing along the rail switches on like an old CRT when the pulse reaches it: a bright horizontal line snaps open vertically into the real screenshot (`appShot`). The camera rides behind the pulse, so passed windows slide by large and blurred in the foreground (depth of field by distance, parallax by depth).
1. **0-85:** open mid-action, the pulse already leaving Claude, the camera already moving. PhotoCraft powers on ~30-45 ("Photoshop"), FilmCraft ~55-65 ("Premiere"), EffectCraft ~72-82 ("After Effects"). Its real app icon (`appIcon`) sits on the rail at each window's foot.
2. **85-150:** the camera rises and pulls back: the rail keeps going and the other nine Craft apps (`APPS`) power on down the line in a fast staggered row, filling the frame with screens receding to the vanishing point.
3. **150-240:** the camera settles into a slow push toward the PhotoCraft window (front, sharp) with FilmCraft and EffectCraft behind it (soft), the rest of the row deep and blurred. The screens stay alive (slow drift inside each screenshot, the scope carrier running, packets still trickling down the rail). Nothing freezes.

## Hook overlay (on this part only)
- Text = `HOOK_OVERLAY` from theme.ts (never hardcode).
- Reuse `src/invideo3/p1/HookOverlay.tsx` as is (import it, read-only): plain white Inter 800 text, ~38px, soft shadow, NO box (Victor, Oct 13), dead center, fully visible on frame 0, holds to 54, eases out 54-64.
- Render it OUTSIDE the `<CRT>` wrapper (screen space, on top) so it stays crisp. The scene behind it must already be moving on frame 0.

## Notes
- Depth: perspective camera through a real CSS 3D space (container with `perspective` + `transform-style: preserve-3d`), per-plane blur for depth of field (a filter flattens 3D inside it, so blur each plane separately, like `src/invideo3/Iv3P1Hook.tsx` + `src/invideo3/p1/rig.ts`). The CRT filter wraps the whole picture from outside the 3D context; check a still to confirm the 3D survives.
- Power-on: bright line first (it blooms through the CRT pass by itself), then it opens to the picture over ~6-8 frames, eased. No per-element glow.
- Glitch: soft, at the first power-on (~32) and when the full row lights (~95). Nothing else.
- Real assets only (public/artcraft/site, public/artcraft/logos). No text besides the overlay and whatever is inside the screenshots.
- Safe area: `safeRect(1080, 960)` = x 86-994, y 77-922 for the hero window and icons; the rail and deep row can bleed.
- CameraMotionBlur samples 8 on the fast travel windows, 1 elsewhere.
- Stills to check (max 8): f0, f30, f60, f84, f110, f150, f200, f239.
