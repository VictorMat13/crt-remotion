import React from "react";
import { Img, staticFile } from "remotion";
import { CX, CY, P, PAGES, c01, dofPx, powerOf, project, toCam, type Cam, type Page, type V3 } from "./rig";

// ===========================================================================
// The six real Resolve pages as planes on one CSS-3D stage (the rig's lens).
// Every plane carries its own depth-of-field blur, because a filter flattens
// anything 3D inside it. Each plane is the official press shot with its own
// page bar cropped off (the bar is the frame's chrome, see PageBar).
// ===========================================================================

export const Stage: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => {
  const tf = `translateZ(${P}px) rotateX(${cam.ph}rad) rotateY(${cam.th}rad) translate3d(${-cam.C.x}px, ${-cam.C.y}px, ${-cam.C.z}px)`;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: `${P}px`, perspectiveOrigin: `${CX}px ${CY}px` }}>
      <div style={{ position: "absolute", left: CX, top: CY, width: 0, height: 0, transformStyle: "preserve-3d", transformOrigin: "0 0", transform: tf }}>
        {children}
      </div>
    </div>
  );
};

/** depth haze: far pages sink a little toward black */
const haze = (cam: Cam, d: number) => 1 - 0.2 * c01((d - Math.max(4000, cam.focus)) / 14000);

/** pages not reached by the page bar stay dimmed; a page switching on lifts with a brief overexposure */
const lightOf = (pg: Page, f: number) => {
  const pw = powerOf(pg.id, f);
  return (0.66 + 0.34 * pw.on) * (1 + 0.3 * pw.over);
};

export const PagePlane: React.FC<{ pg: Page; cam: Cam; frame: number }> = ({ pg, cam, frame }) => {
  const c = project(cam, pg.c);
  if (c.d < 40) return null;
  const blurPx = dofPx(cam, c.d);
  const blurLocal = blurPx / c.s;
  const bright = pg.bright * lightOf(pg, frame) * haze(cam, c.d);
  // Resolve's dark grey panels sink to black through the tube: flattened a little so they survive
  const filter = [blurLocal >= 0.35 ? `blur(${blurLocal.toFixed(2)}px)` : "", "contrast(0.86)", `brightness(${bright.toFixed(3)})`].join(" ").trim();
  // the bezel stays a constant ~2.5 screen px whatever the depth
  const bezel = 2.5 / c.s;
  const imgH = (pg.w * (pg.sw === 5120 ? 2880 : 2160)) / pg.sw;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: pg.w,
        height: pg.h,
        transformOrigin: "0 0",
        transform: `translate3d(${pg.c.x}px, ${pg.c.y}px, ${pg.c.z}px) rotateY(${pg.rot}deg) translate(${-pg.w / 2}px, ${-pg.h / 2}px)`,
        filter,
        backfaceVisibility: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "#16171A" }}>
        <Img src={staticFile(pg.src)} style={{ position: "absolute", left: 0, top: 0, width: pg.w, height: imgH, display: "block" }} />
      </div>
      {/* a thin light bezel so overlapping dark pages read as separate screens inside the tube */}
      <div
        style={{
          position: "absolute",
          inset: -bezel,
          border: `${bezel.toFixed(2)}px solid rgba(233,231,226,0.42)`,
          borderRadius: bezel * 2,
        }}
      />
    </div>
  );
};

export const Stack: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  // painter order: far to near (the compositor sorts 3D planes anyway)
  const planes = PAGES.map((pg) => ({ d: project(cam, pg.c).d, pg })).sort((a, b) => b.d - a.d);
  return (
    <Stage cam={cam}>
      {planes.map(({ pg }) => (
        <PagePlane key={pg.id} pg={pg} cam={cam} frame={frame} />
      ))}
    </Stage>
  );
};

// ------------------------------------------------------------- the floor (the scope's graticule)
const NEAR = 40;
const G = 240;
const X_SPAN = 18;
const Z_FRONT = 8200;
const Z_BACK = -9000;
const lerp3 = (a: V3, b: V3, t: number): V3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
const clipped = (cam: Cam, a: V3, b: V3) => {
  const da = toCam(cam, a).d;
  const db = toCam(cam, b).d;
  if (da < NEAR && db < NEAR) return null;
  let p = a;
  let q = b;
  if (da < NEAR) p = lerp3(a, b, (NEAR - da) / (db - da));
  if (db < NEAR) q = lerp3(b, a, (NEAR - db) / (da - db));
  const P1 = project(cam, p);
  const P2 = project(cam, q);
  return { x1: P1.sx, y1: P1.sy, x2: P2.sx, y2: P2.sy, d: (P1.d + P2.d) / 2 };
};
const gridAlpha = (d: number) => 0.4 * (1 - 0.85 * c01((d - 3000) / 14000)) * c01(d / 300);

/** the floor the front page stands on, drawn from the rig's own projection (lines up with the 3D planes) */
export const Floor: React.FC<{ cam: Cam }> = ({ cam }) => {
  const lines: React.ReactNode[] = [];
  const CH = 10;
  const span = (Z_FRONT - Z_BACK) / CH;
  for (let k = -X_SPAN; k <= X_SPAN; k++) {
    const x = k * G;
    for (let c = 0; c < CH; c++) {
      const s = clipped(cam, { x, y: 0, z: Z_FRONT - c * span }, { x, y: 0, z: Z_FRONT - (c + 1) * span });
      if (!s) continue;
      const a = gridAlpha(s.d);
      if (a < 0.02) continue;
      lines.push(<line key={`l${k}-${c}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={`rgba(233,231,226,${a.toFixed(3)})`} strokeWidth={2} />);
    }
  }
  for (let z = Math.floor(Z_FRONT / G) * G; z >= Z_BACK; z -= G) {
    const s = clipped(cam, { x: -X_SPAN * G, y: 0, z }, { x: X_SPAN * G, y: 0, z });
    if (!s) continue;
    const a = gridAlpha(toCam(cam, { x: 0, y: 0, z }).d);
    if (a < 0.02) continue;
    lines.push(<line key={`c${z}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={`rgba(233,231,226,${a.toFixed(3)})`} strokeWidth={2} />);
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {lines}
    </svg>
  );
};
