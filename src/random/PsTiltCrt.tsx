import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";

// Victor, Oct 13: "go grab a screenshot of the Photoshop interface from the
// interwebs and then make it look tilted and then put a slight CRT look over
// it. And some slight camera shake, like you're looking at a screen."
// Screenshot: Adobe's own Microsoft Store listing shot (public/random/SOURCES.md).

export const PS_TILT_DURATION = 180;

const IMG_W = 1514;
const IMG_H = 928;
const S = 1.6; // screenshot scale on the screen plane
const PAD = 18; // desktop margin around the cut-out window
const BEZEL = 26;

const ease = Easing.bezier(0.45, 0, 0.55, 1);

// handheld: a slow wander plus a faint fast tremor, never still
const useShake = (frame: number, fps: number) => {
  const t = frame / fps;
  const x = noise2D("sx", t * 0.8, 0) * 9 + noise2D("sxf", t * 5, 0) * 1.6;
  const y = noise2D("sy", t * 0.8, 1) * 8 + noise2D("syf", t * 5, 1) * 1.6;
  const r = noise2D("sr", t * 0.6, 2) * 0.45 + noise2D("srf", t * 4, 2) * 0.06;
  return { x, y, r };
};

const Screen: React.FC<{ glareX: number }> = ({ glareX }) => {
  const w = IMG_W * S + PAD * 2;
  const h = IMG_H * S + PAD * 2;
  return (
    <div
      style={{
        position: "absolute",
        left: -(w / 2 + BEZEL),
        top: -(h / 2 + BEZEL),
        width: w,
        height: h,
        border: `${BEZEL}px solid #070708`,
        borderRadius: 30,
        background: "#0f1013",
        boxShadow: "0 0 0 2px #1c1d20, 0 60px 140px rgba(0,0,0,0.85)",
        overflow: "hidden",
      }}
    >
      <Img
        src={staticFile("random/ps-genfill.png")}
        style={{ position: "absolute", left: PAD, top: PAD, width: IMG_W * S, height: IMG_H * S }}
      />
      {/* glass glare that slides as the camera moves */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(115deg, rgba(255,255,255,0) ${glareX - 18}%, rgba(255,255,255,0.07) ${glareX}%, rgba(255,255,255,0) ${glareX + 14}%)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
};

export const PsTiltCrt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const p = ease(Math.min(1, frame / (PS_TILT_DURATION - 1)));

  // camera travel: start on the toolbar + Layers side, drift across the
  // mountain to the Generative Fill prompt, easing in a little closer
  const tx = interpolate(p, [0, 1], [440, -500]);
  const ty = interpolate(p, [0, 1], [-10, -40]);
  const tz = interpolate(p, [0, 1], [110, 160]);
  const ry = interpolate(p, [0, 1], [-27, -21]);
  const rx = interpolate(p, [0, 1], [9, 6]);
  const rz = interpolate(p, [0, 1], [-5, -3]);
  const shake = useShake(frame, fps);

  // CRT surface
  const flicker = 0.975 + 0.025 * random(`f-${frame}`);
  const bandY = ((frame * 9) % (height + 500)) - 250;
  const seed = Math.floor(random(`g-${frame}`) * 1000);

  return (
    <AbsoluteFill style={{ backgroundColor: "#040405" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="ps-crt" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feComponentTransfer in="SourceGraphic" result="grade">
              <feFuncR type="gamma" amplitude={1.06} exponent={1.12} offset={-0.012} />
              <feFuncG type="gamma" amplitude={1.06} exponent={1.12} offset={-0.012} />
              <feFuncB type="gamma" amplitude={1.06} exponent={1.12} offset={-0.012} />
            </feComponentTransfer>
            {/* slight convergence error */}
            <feColorMatrix in="grade" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={1.3} dy={0} result="r2" />
            <feColorMatrix in="grade" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feColorMatrix in="grade" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feOffset in="b" dx={-1.3} dy={0} result="b2" />
            <feBlend in="r2" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="b2" mode="screen" result="rgb" />
            {/* soft phosphor bloom */}
            <feGaussianBlur in="rgb" stdDeviation={5} result="h1" />
            <feComponentTransfer in="h1" result="h1d">
              <feFuncR type="linear" slope={0.32} />
              <feFuncG type="linear" slope={0.32} />
              <feFuncB type="linear" slope={0.32} />
            </feComponentTransfer>
            <feGaussianBlur in="rgb" stdDeviation={26} result="h2" />
            <feComponentTransfer in="h2" result="h2d">
              <feFuncR type="linear" slope={0.26} />
              <feFuncG type="linear" slope={0.26} />
              <feFuncB type="linear" slope={0.26} />
            </feComponentTransfer>
            <feBlend in="rgb" in2="h1d" mode="screen" result="s1" />
            <feBlend in="s1" in2="h2d" mode="screen" />
          </filter>
          <filter id="ps-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      <AbsoluteFill style={{ filter: "url(#ps-crt)", opacity: flicker }}>
        <AbsoluteFill
          style={{
            transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.r}deg) scale(1.04)`,
          }}
        >
          {/* light the screen throws into the room */}
          <AbsoluteFill
            style={{
              background:
                "radial-gradient(ellipse 70% 45% at 50% 50%, rgba(92,70,170,0.32) 0%, rgba(40,120,110,0.12) 45%, rgba(0,0,0,0) 75%)",
            }}
          />
          <AbsoluteFill style={{ perspective: 1500, perspectiveOrigin: "50% 50%" }}>
            <div
              style={{
                position: "absolute",
                left: width / 2,
                top: height / 2,
                transformStyle: "preserve-3d",
                transform: `translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
              }}
            >
              <Screen glareX={interpolate(p, [0, 1], [20, 75])} />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* scanlines */}
      <AbsoluteFill
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 3px)",
        }}
      />
      {/* faint aperture grille */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,70,70,0.035) 0px, rgba(255,70,70,0.035) 1px, rgba(70,255,110,0.035) 1px, rgba(70,255,110,0.035) 2px, rgba(80,120,255,0.035) 2px, rgba(80,120,255,0.035) 3px)",
          mixBlendMode: "screen",
        }}
      />
      {/* rolling refresh band */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width,
          top: bandY,
          height: 260,
          background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 100%)",
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "screen" }}>
        <svg width={width} height={height}>
          <rect width={width} height={height} filter="url(#ps-grain)" />
        </svg>
      </AbsoluteFill>
      {/* vignette */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 88%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
