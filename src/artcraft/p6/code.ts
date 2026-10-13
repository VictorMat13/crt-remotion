// ===========================================================================
// The artifact's real source: a single-file HTML/JS crop-and-resize photo
// editor, the "simple version" BUILD_PROMPT asks for. It is the app the
// Preview shows, line for line: the header (file name + Open image), the
// stage (canvas + crop box with 8 handles, dimmed outside), Width / lock /
// Height, Export PNG, and the download name `${name}-${w}x${h}.png`.
// Releasing a handle applies the crop; typing a width keeps the ratio.
// It streams into the Code view too fast to read; nobody has to touch it.
// ===========================================================================

export const SOURCE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport"
  content="width=device-width, initial-scale=1">
<title>Crop &amp; Resize</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    font: 16px system-ui, sans-serif;
    background: #111214;
    color: #e8e6e1;
    padding: 24px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .btn {
    border: 1px solid #3a3d44;
    border-radius: 8px;
    padding: 8px 14px;
    background: none;
    color: inherit;
    cursor: pointer;
  }
  .stage {
    position: relative;
    margin: 20px 0;
    overflow: hidden;
    background: #0b0c0e;
    touch-action: none;
  }
  canvas { display: block; width: 100%; }
  #crop {
    position: absolute;
    border: 2px solid #fff;
    box-shadow: 0 0 0 9999px #0008;
  }
  .handle {
    position: absolute;
    width: 14px;
    height: 14px;
    margin: -7px 0 0 -7px;
    background: #fff;
  }
  .controls {
    display: flex;
    align-items: end;
    gap: 12px;
  }
  .controls label {
    display: grid;
    gap: 6px;
  }
  input {
    width: 96px;
    padding: 8px;
    background: #1b1d21;
    color: inherit;
    border: 1px solid #3a3d44;
    border-radius: 8px;
  }
  #lock[aria-pressed="true"] {
    color: #3b82f6;
    border-color: #3b82f6;
  }
  #export {
    margin-top: 20px;
    padding: 10px 18px;
    background: #3b82f6;
    color: #fff;
    border: 0;
    border-radius: 8px;
  }
</style>
</head>
<body>
  <header>
    <span id="name">No image yet</span>
    <label class="btn">Open image
      <input type="file" id="file"
        accept="image/*" hidden>
    </label>
  </header>
  <div class="stage" id="stage">
    <canvas id="view"></canvas>
    <div id="crop"></div>
  </div>
  <div class="controls">
    <label>Width <input id="w"
      type="number" min="1"></label>
    <button id="lock" class="btn"
      aria-pressed="true" title="Keep ratio">
      <svg width="16" height="16"
        viewBox="0 0 16 16" fill="none"
        stroke="currentColor" stroke-width="2">
        <rect x="3" y="7" width="10"
          height="7" rx="1.5"/>
        <path d="M5 7V5a3 3 0 0 1 6 0v2"/>
      </svg>
    </button>
    <label>Height <input id="h"
      type="number" min="1"></label>
  </div>
  <button id="export">Export PNG</button>
<script>
const $ = (id) => document.getElementById(id);
const view = $("view");
const ctx = view.getContext("2d");
const box = $("crop");
const wIn = $("w");
const hIn = $("h");
const base = document.createElement("canvas");
let name = "image";
let scale = 1;
let ratio = 1;
let locked = true;
let crop = { x: 0, y: 0, w: 0, h: 0 };
let drag = null;

const POS = {
  n: [50, 0], s: [50, 100],
  e: [100, 50], w: [0, 50],
  ne: [100, 0], nw: [0, 0],
  se: [100, 100], sw: [0, 100],
};
for (const side of Object.keys(POS)) {
  const h = document.createElement("div");
  h.className = "handle";
  h.dataset.side = side;
  h.style.left = POS[side][0] + "%";
  h.style.top = POS[side][1] + "%";
  box.appendChild(h);
}

$("file").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  name = file.name.replace(/\\.\\w+$/, "");
  $("name").textContent = file.name;
  const img = new Image();
  img.onload = () => {
    base.width = img.width;
    base.height = img.height;
    base.getContext("2d").drawImage(img, 0, 0);
    reset();
  };
  img.src = URL.createObjectURL(file);
};

function reset() {
  const w = $("stage").clientWidth;
  scale = w / base.width;
  view.width = w;
  view.height = Math.round(base.height * scale);
  ctx.drawImage(base, 0, 0, view.width, view.height);
  crop = { x: 0, y: 0, w: view.width, h: view.height };
  ratio = base.width / base.height;
  setSize(base.width, base.height);
  place();
}

function place() {
  box.style.left = crop.x + "px";
  box.style.top = crop.y + "px";
  box.style.width = crop.w + "px";
  box.style.height = crop.h + "px";
}

function setSize(w, h) {
  wIn.value = Math.round(w);
  hIn.value = Math.round(h);
}

box.onpointerdown = (e) => {
  const side = e.target.dataset.side;
  if (!side) return;
  drag = {
    side,
    x: e.clientX,
    y: e.clientY,
    start: { ...crop },
  };
  box.setPointerCapture(e.pointerId);
};

box.onpointermove = (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  const c = { ...drag.start };
  const s = drag.side;
  if (s.includes("e")) c.w += dx;
  if (s.includes("s")) c.h += dy;
  if (s.includes("w")) {
    c.x += dx;
    c.w -= dx;
  }
  if (s.includes("n")) {
    c.y += dy;
    c.h -= dy;
  }
  c.w = Math.max(20, Math.min(c.w, view.width - c.x));
  c.h = Math.max(20, Math.min(c.h, view.height - c.y));
  crop = c;
  setSize(c.w / scale, c.h / scale);
  place();
};

box.onpointerup = () => {
  if (!drag) return;
  drag = null;
  applyCrop();
};

function applyCrop() {
  const sx = crop.x / scale;
  const sy = crop.y / scale;
  const sw = Math.round(crop.w / scale);
  const sh = Math.round(crop.h / scale);
  const tmp = document.createElement("canvas");
  tmp.width = sw;
  tmp.height = sh;
  tmp.getContext("2d")
    .drawImage(base, sx, sy, sw, sh, 0, 0, sw, sh);
  base.width = sw;
  base.height = sh;
  base.getContext("2d").drawImage(tmp, 0, 0);
  reset();
}

wIn.oninput = () => {
  if (locked && wIn.value) {
    hIn.value = Math.round(wIn.value / ratio);
  }
};

hIn.oninput = () => {
  if (locked && hIn.value) {
    wIn.value = Math.round(hIn.value * ratio);
  }
};

$("lock").onclick = (e) => {
  locked = !locked;
  e.currentTarget.setAttribute("aria-pressed", locked);
};

$("export").onclick = () => {
  const w = Number(wIn.value);
  const h = Number(hIn.value);
  if (!w || !h) return;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const o = out.getContext("2d");
  o.imageSmoothingQuality = "high";
  o.drawImage(base, 0, 0, w, h);
  out.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = \`\${name}-\${w}x\${h}.png\`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, "image/png");
};

window.onresize = () => base.width && reset();
</script>
</body>
</html>`;

export const LINES: string[] = SOURCE.split("\n");

/** prefix[i] = chars streamed when line i starts (each line counts len + 1 for its newline) */
export const PREFIX: number[] = (() => {
  const p = [0];
  for (const l of LINES) p.push(p[p.length - 1] + l.length + 1);
  return p;
})();
export const TOTAL_CHARS = PREFIX[PREFIX.length - 1];

// ---------------------------------------------------------------- syntax colors (claude.ai's dark code view, lifted for the tube)
export type Tok = { t: string; k: "kw" | "str" | "tag" | "num" | "prop" | "pun" | "id" };

const KW = new Set([
  "const", "let", "function", "if", "return", "for", "of", "new", "null", "true", "false", "document", "window",
]);
const RE = /("(?:[^"\\]|\\.)*"?|`[^`]*`?|<\/?[A-Za-z!][\w-]*|\/?>|\b\d+(?:\.\d+)?(?:px|%)?\b|#[0-9a-fA-F]{3,8}\b|[A-Za-z_$][\w$-]*|\s+|.)/g;

export const tokenize = (line: string): Tok[] => {
  const out: Tok[] = [];
  const m = line.match(RE) ?? [];
  const cssProp = /^\s+[a-z-]+:/.test(line) && !line.includes("(");
  m.forEach((t, i) => {
    let k: Tok["k"] = "id";
    if (/^["`]/.test(t)) k = "str";
    else if (/^<\/?[A-Za-z!]/.test(t) || t === ">" || t === "/>") k = "tag";
    else if (/^\d/.test(t) || /^#[0-9a-fA-F]/.test(t)) k = "num";
    else if (KW.has(t)) k = "kw";
    else if (cssProp && i <= 1 && /^[a-z-]+$/.test(t)) k = "prop";
    else if (/^[{}()[\];,.=:+\-*/<>?&|!]$/.test(t)) k = "pun";
    out.push({ t, k });
  });
  return out;
};
