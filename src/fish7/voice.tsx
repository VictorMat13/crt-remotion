// ===========================================================================
// fish7 voice layer — the agent logo with a radial "soundbar" ring.
// Procedural speech envelope NOW (audio is produced in ElevenLabs after the
// videos are cut); flip AUDIO_SRC in your comp to a staticFile path later and
// the ring becomes audio-reactive with no other change.
// READ-ONLY for builder agents: import, do not edit.
// ===========================================================================
import React from "react";
import { Img, interpolate, staticFile, useVideoConfig } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";

export const BAR_COUNT = 48; // visualizeAudio samples 64 (power of two); we draw the first 48
const SAMPLES = 64;

// Deterministic speech-like envelope: syllable pulses + breath pauses.
export const speechEnvelope = (frame: number, seed = 0): number => {
  const t = frame + seed * 13;
  const syll = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.42 + seed));
  const phrase = 0.65 + 0.35 * Math.sin(t * 0.075 + seed * 2.1);
  const breath = Math.sin(t * 0.021 + seed) < -0.86 ? 0.25 : 1;
  return Math.min(1, syll * phrase * breath);
};

export const proceduralBars = (frame: number, active: boolean, seed = 0): number[] => {
  const env = active ? 0.35 + 0.65 * speechEnvelope(frame, seed) : 0.06;
  return Array.from({ length: BAR_COUNT }).map((_, i) => {
    const v =
      0.3 +
      0.5 * Math.abs(Math.sin(i * 0.55 + (frame + seed * 11) * 0.31)) +
      0.3 * Math.abs(Math.sin(i * 1.3 - (frame + seed * 5) * 0.17));
    return Math.min(1, (v / 1.1) * env);
  });
};

/**
 * Audio-reactive bars. Only mount a component that calls this when a real
 * audio file exists (hooks cannot be conditional). Pattern in your comp:
 *   const AUDIO_SRC: string | null = null; // set later, e.g. "fish7/voice/astra.mp3"
 *   {AUDIO_SRC ? <VoiceRingAudio audioSrc={AUDIO_SRC} ... /> : <VoiceRing bars={proceduralBars(frame, active, seed)} ... />}
 */
export const useAudioBars = (audioSrc: string, frame: number, audioStartFrame = 0, fallbackSeed = 0): number[] => {
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(audioSrc));
  if (!audioData) return proceduralBars(frame, true, fallbackSeed);
  const v = visualizeAudio({ fps, frame: Math.max(0, frame - audioStartFrame), audioData, numberOfSamples: SAMPLES });
  return v.slice(0, BAR_COUNT).map((x) => Math.min(1, Math.sqrt(x) * 2.6));
};

export type VoiceRingProps = {
  /** logo path relative to public/ (theme AGENTS[key].logo) */
  logo: string;
  /** ring/bar color (AGENTS[key].color) */
  color: string;
  /** "r,g,b" for glow (AGENTS[key].colorRgb) */
  colorRgb: string;
  bars: number[];
  /** outer diameter in px */
  size?: number;
  /** 0..1 entrance scale (spring it) */
  scaleIn?: number;
  /** 0..1 how "alive" the glow is (tie to envelope) */
  energy?: number;
  /** logo diameter as fraction of size (default 0.34) */
  logoFrac?: number;
  /** disc behind the logo */
  disc?: string;
  style?: React.CSSProperties;
};

/** Agent logo centred inside a ring of radial soundbars (the Fish 4 orb move, re-skinned). */
export const VoiceRing: React.FC<VoiceRingProps> = ({
  logo,
  color,
  colorRgb,
  bars,
  size = 320,
  scaleIn = 1,
  energy = 0.6,
  logoFrac = 0.34,
  disc = "#2A2F3A",
  style,
}) => {
  const r = size / 2;
  const inner = r * 0.62; // where bars start
  const maxLen = r * 0.3; // bar max length
  const n = bars.length;
  const logoD = size * logoFrac;
  const glowA = interpolate(energy, [0, 1], [0.12, 0.42]);
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        transform: `scale(${scaleIn})`,
        ...style,
      }}
    >
      {/* halo */}
      <div
        style={{
          position: "absolute",
          inset: -size * 0.12,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${colorRgb},${glowA}) 0%, rgba(${colorRgb},0) 62%)`,
        }}
      />
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* faint guide ring */}
        <circle cx={r} cy={r} r={inner - 6} fill="none" stroke={`rgba(${colorRgb},0.18)`} strokeWidth={1.2} />
        {bars.map((v, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const len = 6 + v * maxLen;
          const x1 = r + Math.cos(a) * inner;
          const y1 = r + Math.sin(a) * inner;
          const x2 = r + Math.cos(a) * (inner + len);
          const y2 = r + Math.sin(a) * (inner + len);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={Math.max(3, size * 0.012)}
              strokeLinecap="round"
              opacity={0.45 + 0.55 * v}
            />
          );
        })}
      </svg>
      {/* disc + logo */}
      <div
        style={{
          position: "absolute",
          left: r - inner * 0.86,
          top: r - inner * 0.86,
          width: inner * 1.72,
          height: inner * 1.72,
          borderRadius: "50%",
          background: disc,
          boxShadow: `0 18px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img src={staticFile(logo)} style={{ width: logoD, height: logoD, objectFit: "contain" }} />
      </div>
    </div>
  );
};

/** "● Voice generated by Fish Audio" compliance pill (brand rule). */
export const FishLabel: React.FC<{ opacity?: number; scale?: number; fontSize?: number; style?: React.CSSProperties }> = ({
  opacity = 1,
  scale = 1,
  fontSize = 30,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      display: "flex",
      alignItems: "center",
      gap: fontSize * 0.45,
      padding: `${fontSize * 0.5}px ${fontSize * 0.9}px`,
      borderRadius: 999,
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.12)",
      backdropFilter: "blur(10px)",
      color: "#F3F1EC",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize,
      fontWeight: 500,
      letterSpacing: -0.2,
      opacity,
      transform: `scale(${scale})`,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <span style={{ width: fontSize * 0.36, height: fontSize * 0.36, borderRadius: "50%", background: "#FF4F00" }} />
    Voice generated by Fish Audio
  </div>
);

/** VoiceRing driven by a real audio file (mount only when the file exists). */
export const VoiceRingAudio: React.FC<Omit<VoiceRingProps, "bars"> & { audioSrc: string; frame: number; audioStartFrame?: number; seed?: number }> = ({
  audioSrc,
  frame,
  audioStartFrame = 0,
  seed = 0,
  ...rest
}) => {
  const bars = useAudioBars(audioSrc, frame, audioStartFrame, seed);
  const audioEnergy = Math.min(1, (bars.reduce((a, b) => a + b, 0) / bars.length) * 1.8);
  return <VoiceRing bars={bars} {...rest} energy={audioEnergy} />;
};
