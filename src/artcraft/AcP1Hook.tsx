import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { CRT, HOOK_OVERLAY, PARTS } from "./theme";
import { HookOverlay } from "../invideo3/p1/HookOverlay";
import { CLAUDE, WINDOWS, camAt, project } from "./p1/rig";
import { Floor } from "./p1/Rail";
import { ClaudePlane, IconPlane, Stage, WindowPlane } from "./p1/Planes";

// ===========================================================================
// AcP1Hook: 1080x960 (9:8) @ 30fps, 240 frames (8.0s). HOOK of the ArtCraft
// reel. VO (Victor's, never on screen): "Somebody just used Claude to rebuild
// Photoshop, Premiere and After Effects, and he's giving every one of them
// away for free. Let me show you what that means for you."
//
// CRT Scope, power-on rail. One continuous CSS-3D shot inside the tube: the
// scope line runs down a receding floor (with the scope's graticule) like a
// rail. A coral pulse leaves the Claude mark and races away along it; the
// twelve real Craft windows stand along the rail, toed in, each app's real
// icon standing on the rail at its window's depth. When the pulse reaches an
// icon, the icon wakes, its trace answers in the app's color, and the window
// switches on like an old CRT: a bright line snaps across, then opens to the
// real screenshot.
//   0-85    the camera rides low behind the pulse (already moving on f0):
//           PhotoCraft on ~29 ("Photoshop"), FilmCraft ~53 ("Premiere"),
//           EffectCraft ~71 ("After Effects"); passed windows slide by large
//           and blurred
//   78-160  crane: the camera rises and pulls back while the pulse races down
//           the other nine, which light in a fast staggered row (~89-117)
//   120-240 the camera settles into a push toward PhotoCraft (front, sharp),
//           FilmCraft / EffectCraft behind it soft, the row deep and blurred;
//           packets keep trickling down the rail, every screen drifts, the
//           push is still under way on the last frame
// The hook overlay (HOOK_OVERLAY) sits on top in screen space, outside the
// tube, so it stays crisp: frames 0-64.
// ===========================================================================

export const AC_P1_DURATION = PARTS.p1.frames; // 240

/** soft tracking wobble on the first power-on and when the whole row lights */
const GLITCH = [32, 95];
/** 8-sample camera blur only on the fast travel (the ride, the crane) */
const BLUR_WIN: [number, number][] = [
  [8, 58],
  [94, 132],
];

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);

  // painter order inside the 3D context is resolved by the compositor; feed it far to near anyway
  const planes = [
    ...WINDOWS.map((w) => ({ d: project(cam, w.c).d, el: <WindowPlane key={`w-${w.id}`} w={w} cam={cam} frame={frame} /> })),
    ...WINDOWS.map((w) => ({ d: project(cam, { x: 0, y: -40, z: w.z }).d, el: <IconPlane key={`i-${w.id}`} w={w} cam={cam} frame={frame} /> })),
    { d: project(cam, { x: 0, y: -CLAUDE.size / 2, z: CLAUDE.z }).d, el: <ClaudePlane key="claude" cam={cam} /> },
  ].sort((a, b) => b.d - a.d);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Floor cam={cam} frame={frame} />
      <Stage cam={cam}>{planes.map((p) => p.el)}</Stage>
    </AbsoluteFill>
  );
};

export const AcP1Hook: React.FC<{ samples?: number }> = ({ samples }) => {
  const frame = useCurrentFrame();
  const big = BLUR_WIN.some(([a, b]) => frame >= a && frame <= b);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CRT glitchAt={GLITCH}>
        <AbsoluteFill style={{ backgroundColor: "#000" }}>
          <CameraMotionBlur shutterAngle={180} samples={samples ?? (big ? 8 : 1)}>
            <Scene />
          </CameraMotionBlur>
        </AbsoluteFill>
      </CRT>
      <HookOverlay text={HOOK_OVERLAY} />
    </AbsoluteFill>
  );
};
