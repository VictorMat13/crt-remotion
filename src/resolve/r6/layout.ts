import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// ===========================================================================
// The quote's line layout, measured once the font is in (canvas measureText,
// after Inter has loaded), so the selection, the cursor and the lifted task
// names all know where every character sits. Lines are rendered nowrap at
// exactly these breaks, so the DOM never re-wraps them.
// ===========================================================================

const inter = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
export const UI_FONT = inter.fontFamily;

export type QLine = {
  text: string;
  /** index of the line's first char in the full string */
  start: number;
  /** index after its last char */
  end: number;
  /** x[i] = width of text.slice(0, i), i = 0..text.length */
  x: number[];
};
export type QLayout = { lines: QLine[] };

/** greedy wrap; a space inside a `keep` range is never a break (each task name stays on one line) */
export const measureLines = (text: string, font: string, maxW: number, keep: [number, number][] = []): QLayout => {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("r6: no 2d canvas");
  ctx.font = font;
  const wd = (s: string) => ctx.measureText(s).width;
  const words: { w: string; at: number }[] = [];
  const kept = (j: number) => keep.some(([a, b]) => j > a && j < b);
  let from = -1;
  for (let j = 0; j <= text.length; j++) {
    const brk = j === text.length || (text[j] === " " && !kept(j));
    if (brk) {
      if (from >= 0) words.push({ w: text.slice(from, j), at: from });
      from = -1;
    } else if (from < 0) from = j;
  }
  const lines: QLine[] = [];
  let cur: { w: string; at: number }[] = [];
  const flush = () => {
    if (!cur.length) return;
    const start = cur[0].at;
    const last = cur[cur.length - 1];
    const end = last.at + last.w.length;
    const t = text.slice(start, end);
    const x: number[] = [];
    for (let i = 0; i <= t.length; i++) x.push(wd(t.slice(0, i)));
    lines.push({ text: t, start, end, x });
    cur = [];
  };
  for (const w of words) {
    if (cur.length) {
      const trial = text.slice(cur[0].at, w.at + w.w.length);
      if (wd(trial) > maxW) flush();
    }
    cur.push(w);
  }
  flush();
  return { lines };
};

/** measure after the font has loaded; holds the render until then */
export const useQuoteLayout = (text: string, weight: number, size: number, maxW: number, keep: [number, number][]): QLayout | null => {
  const [lay, setLay] = useState<QLayout | null>(null);
  const [handle] = useState(() => delayRender("r6: measure the quote"));
  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) setLay(measureLines(text, `${weight} ${size}px ${UI_FONT}`, maxW, keep));
      continueRender(handle);
    };
    // if the font failed to load, measure with whatever the browser has rather than hang the render
    inter.waitUntilDone().then(done, done);
    return () => {
      alive = false;
    };
    // keep is a module constant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, text, weight, size, maxW]);
  return lay;
};
