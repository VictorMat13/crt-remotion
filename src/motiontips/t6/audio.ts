// The clip's waveform, drawn from the real file (as in src/fish8/audio.ts
// useWaveform): per-bin peak and RMS over [0, dur] seconds, normalised to the
// loudest peak. useAudioData delays the render until the file is decoded, so
// this is safe in the Studio and in `remotion render`.
import { useMemo } from "react";
import { staticFile } from "remotion";
import { useAudioData } from "@remotion/media-utils";

export type Bin = { peak: number; rms: number };

export const useEnvelope = (src: string, dur: number, n: number): Bin[] | null => {
  const audio = useAudioData(staticFile(src));
  return useMemo(() => {
    if (!audio) return null;
    const ch = audio.channelWaveforms[0];
    const last = Math.min(ch.length, Math.round(dur * audio.sampleRate));
    const per = last / n;
    const raw = Array.from({ length: n }, (_, b) => {
      const i0 = Math.floor(b * per);
      const i1 = Math.max(i0 + 1, Math.floor((b + 1) * per));
      let pk = 0;
      let s = 0;
      for (let i = i0; i < i1; i++) {
        const v = ch[i];
        const a = Math.abs(v);
        if (a > pk) pk = a;
        s += v * v;
      }
      return { peak: pk, rms: Math.sqrt(s / (i1 - i0)) };
    });
    const max = Math.max(...raw.map((r) => r.peak), 1e-6);
    // a gentle curve so quiet speech still reads; silence stays a flat line
    return raw.map((r) => ({ peak: Math.pow(r.peak / max, 0.8), rms: Math.min(1, Math.pow((1.6 * r.rms) / max, 0.8)) }));
  }, [audio, dur, n]);
};
