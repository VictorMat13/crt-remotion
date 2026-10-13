import React from "react";
import { interpolate } from "remotion";
import { REPO } from "../theme";
import { CLICK_COPY, CLICK_CODE, DROP, ENTER, OPEN, PAGE, POP_IN, ROW, ROW_W, clamp } from "./plan";
import {
  Branch,
  Caret,
  Check,
  Code,
  Copy,
  DesktopDownload,
  File,
  FileZip,
  Folder,
  Fork,
  History,
  IssueOpened,
  PullRequest,
  Question,
  Search,
  Star,
  TerminalIcon,
} from "./glyphs";
import { MONO_FONT, UI, UI_FONT } from "./ui";

// ===========================================================================
// storytold/photocraft's repo page (GitHub dark, mobile layout), drawn inside
// photocraft's list row as it grows, at 34px so it reads on a phone. Every
// string is the real page: Fork 9.1k, Star 54.5k, Issues 817 / Pull requests
// 447 (gh search, Oct 13), branch main, the real root file list, "2,012
// Commits", the newest real commit subject. GitHub's real Code dropdown
// (Local / Clone / HTTPS / the clone URL / Download ZIP) is its own overlay,
// full safe width as on mobile, so the mono URL fits at 30px.
// ===========================================================================

const PAD = 28;
const FS = 34; // body type
const LATEST = "feat(gpu): composite Blend If on the GPU (#4395) (#4541)"; // newest in photocraft-recent-commits.tsv

// layout (page-local)
const BTN_TOP = 104;
const TABS_TOP = 192;
const TOOL_TOP = 290;
const BOX = { top: 392, header: 74, row: 60 };
/** the green Code button (page-local) */
export const CODE_BTN = { left: ROW_W - PAD - 210, top: TOOL_TOP, w: 210, h: 68 };
export const PAGE_CONTENT_H = BOX.top + BOX.header + REPO.files.length * BOX.row;

const T0 = OPEN[0];
const rise = (frame: number, at: number, dy = 14) => {
  const k = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: ENTER });
  return { opacity: k, transform: `translateY(${((1 - k) * dy).toFixed(2)}px)` };
};

const btn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  height: 64,
  padding: "0 18px",
  boxSizing: "border-box",
  borderRadius: 12,
  border: `2px solid ${UI.edge}`,
  fontSize: FS,
  fontWeight: 500,
  color: UI.ink,
  whiteSpace: "nowrap",
};

const Tab: React.FC<{ icon: React.ReactNode; label: string; count?: string; on?: boolean }> = ({ icon, label, count, on }) => (
  <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 11, height: 64, color: on ? UI.ink : UI.meta, fontWeight: on ? 600 : 500, flex: "none" }}>
    {icon}
    <span>{label}</span>
    {count ? (
      <span style={{ padding: "0 11px", borderRadius: 999, border: `2px solid ${UI.hair}`, fontSize: 28, fontWeight: 500, color: UI.ink }}>{count}</span>
    ) : null}
    {on ? <div style={{ position: "absolute", left: -6, right: -6, bottom: -8, height: 5, borderRadius: 3, background: UI.tab }} /> : null}
  </div>
);

const Hair: React.FC<{ top: number; left?: number; right?: number; style?: React.CSSProperties }> = ({ top, left = 0, right = 0, style }) => (
  <div style={{ position: "absolute", left, right, top, height: 2, background: UI.hair, ...style }} />
);

export const RepoPage: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  if (f < T0 + 2) return null;
  const codePress = interpolate(f, [CLICK_CODE, CLICK_CODE + 2, CLICK_CODE + 5], [0, 1, 0], clamp);

  return (
    <>
      {/* Fork / Star */}
      <div style={{ position: "absolute", left: PAD, top: BTN_TOP, display: "flex", gap: 16 }}>
        <div style={{ ...btn, ...rise(f, T0 + 2) }}>
          <Fork size={31} color={UI.meta} />
          Fork
          <span style={{ fontWeight: 600, marginLeft: 4 }}>{REPO.forks}</span>
          <Caret size={24} color={UI.meta} />
        </div>
        <div style={{ ...btn, ...rise(f, T0 + 4) }}>
          <Star size={32} color={UI.meta} sw={1.4} />
          Star
          <span style={{ fontWeight: 600, marginLeft: 4 }}>{REPO.stars}</span>
          <Caret size={24} color={UI.meta} />
        </div>
      </div>

      {/* tabs (they run off the right edge, as GitHub's mobile tab bar does) */}
      <div style={{ position: "absolute", left: PAD + 6, top: TABS_TOP, display: "flex", gap: 30, fontSize: FS, whiteSpace: "nowrap", ...rise(f, T0 + 5) }}>
        <Tab on icon={<Code size={31} color={UI.ink} sw={1.7} />} label="Code" />
        <Tab icon={<IssueOpened size={31} color={UI.meta} />} label="Issues" count="817" />
        <Tab icon={<PullRequest size={31} color={UI.meta} />} label="Pull requests" count="447" />
      </div>
      <Hair top={TABS_TOP + 76} style={{ opacity: rise(f, T0 + 6).opacity }} />

      {/* toolbar: branch, Go to file, Code */}
      <div style={{ position: "absolute", left: PAD, top: TOOL_TOP + 2, display: "flex", gap: 12, ...rise(f, T0 + 7) }}>
        <div style={btn}>
          <Branch size={31} color={UI.meta} />
          <span style={{ fontWeight: 600 }}>{REPO.branch}</span>
          <Caret size={24} color={UI.meta} />
        </div>
        <div style={{ ...btn, color: UI.meta }}>
          <Search size={29} color={UI.meta} />
          Go to file
        </div>
      </div>
      <div style={{ position: "absolute", left: CODE_BTN.left, top: CODE_BTN.top, width: CODE_BTN.w, height: CODE_BTN.h, ...rise(f, T0 + 9) }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxSizing: "border-box",
            borderRadius: 12,
            background: UI.green,
            border: "2px solid rgba(240,246,252,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 11,
            color: "#FFFFFF",
            fontSize: FS,
            fontWeight: 600,
            transform: `scale(${(1 - 0.035 * codePress).toFixed(4)})`,
            filter: codePress > 0.01 ? `brightness(${(1 - 0.18 * codePress).toFixed(3)})` : undefined,
          }}
        >
          <Code size={31} color="#FFFFFF" sw={1.8} />
          Code
          <Caret size={24} color="#FFFFFF" />
        </div>
      </div>

      {/* file box */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          right: PAD,
          top: BOX.top,
          height: BOX.header + REPO.files.length * BOX.row,
          boxSizing: "border-box",
          borderRadius: 12,
          border: `2px solid ${UI.edge}`,
          overflow: "hidden",
          ...rise(f, T0 + 9, 20),
        }}
      >
        <div style={{ position: "absolute", left: 22, right: 22, top: 0, height: BOX.header, display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ color: UI.meta, fontSize: 28, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>{LATEST}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: UI.ink, fontSize: FS, fontWeight: 600, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
            <History size={31} color={UI.ink} />
            {REPO.commits.toLocaleString("en-US")} Commits
          </span>
        </div>
        <Hair top={BOX.header - 2} />
        {REPO.files.map((it, i) => (
          <div
            key={it.name}
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              top: BOX.header + i * BOX.row,
              height: BOX.row,
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontSize: FS,
              color: UI.ink,
              ...rise(f, T0 + 11 + i * 0.6, 10),
            }}
          >
            {it.dir ? <Folder size={32} color={UI.folder} /> : <File size={32} color={UI.meta} sw={1.4} />}
            <span>{it.name}</span>
          </div>
        ))}
      </div>
    </>
  );
};

// ---------------------------------------------------------------- the Code dropdown (world px)
const DW = DROP.right - DROP.left; // 908
const PR = { tabs: 76, clone: 70, sub: 66, url: 84, hint: 54, item: 74 };
const URL_TOP = PR.tabs + PR.clone + PR.sub + 10;
const COPY_SIZE = 72;
export const DROP_H = URL_TOP + PR.url + PR.hint + 2 * PR.item;
/** copy button, world px */
export const COPY_BTN = { left: DROP.left + DW - 12 - COPY_SIZE, top: DROP.top + URL_TOP, size: COPY_SIZE };
/** Code button, world px */
export const CODE_BTN_WORLD = { left: ROW.left + CODE_BTN.left, top: PAGE.top + CODE_BTN.top, w: CODE_BTN.w, h: CODE_BTN.h };

export const CodeDropdown: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  const pop = interpolate(f, [POP_IN, POP_IN + 9], [0, 1], { ...clamp, easing: ENTER });
  if (pop <= 0.001) return null;
  const copyPress = interpolate(f, [CLICK_COPY, CLICK_COPY + 2, CLICK_COPY + 5], [0, 1, 0], clamp);
  const copied = f >= CLICK_COPY + 1;
  return (
    <div
      style={{
        position: "absolute",
        left: DROP.left,
        top: DROP.top,
        width: DW,
        height: DROP_H,
        boxSizing: "border-box",
        borderRadius: 16,
        background: UI.panel,
        border: `2px solid ${UI.edge}`,
        boxShadow: "0 28px 70px rgba(0,0,0,0.9)",
        opacity: Math.min(1, pop * 1.8),
        transform: `translateY(${((1 - pop) * -12).toFixed(2)}px) scale(${(0.97 + 0.03 * pop).toFixed(4)})`,
        transformOrigin: "85% 0",
        overflow: "hidden",
        zIndex: 30,
        fontFamily: UI_FONT,
        fontSize: FS,
        color: UI.ink,
      }}
    >
      {/* Local | Codespaces */}
      <div style={{ position: "absolute", left: 32, top: 0, height: PR.tabs, display: "flex", alignItems: "center", gap: 44, ...rise(f, POP_IN + 1, 8) }}>
        <div style={{ position: "relative", fontWeight: 600 }}>
          Local
          <div style={{ position: "absolute", left: -8, right: -8, bottom: -21, height: 5, borderRadius: 3, background: UI.tab }} />
        </div>
        <div style={{ color: UI.meta, fontWeight: 500 }}>Codespaces</div>
      </div>
      <Hair top={PR.tabs - 2} />
      {/* Clone */}
      <div style={{ position: "absolute", left: 26, right: 26, top: PR.tabs, height: PR.clone, display: "flex", alignItems: "center", gap: 16, fontWeight: 600, ...rise(f, POP_IN + 2, 8) }}>
        <TerminalIcon size={34} color={UI.meta} />
        Clone
        <div style={{ marginLeft: "auto" }}>
          <Question size={32} color={UI.meta} />
        </div>
      </div>
      {/* HTTPS SSH GitHub CLI */}
      <div style={{ position: "absolute", left: 32, top: PR.tabs + PR.clone, height: PR.sub, display: "flex", alignItems: "center", gap: 40, fontSize: 32, ...rise(f, POP_IN + 3, 8) }}>
        <div style={{ position: "relative", fontWeight: 600 }}>
          HTTPS
          <div style={{ position: "absolute", left: -6, right: -6, bottom: -15, height: 5, borderRadius: 3, background: UI.tab }} />
        </div>
        <div style={{ color: UI.meta, fontWeight: 500 }}>SSH</div>
        <div style={{ color: UI.meta, fontWeight: 500 }}>GitHub CLI</div>
      </div>
      <Hair top={PR.tabs + PR.clone + PR.sub - 2} left={20} right={20} style={{ opacity: 0.8 }} />
      {/* URL + copy */}
      <div style={{ position: "absolute", left: 12, right: 12, top: URL_TOP, height: COPY_SIZE, ...rise(f, POP_IN + 4, 8) }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: COPY_SIZE + 10,
            top: 0,
            bottom: 0,
            boxSizing: "border-box",
            borderRadius: 11,
            border: `2px solid ${UI.edge}`,
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
            fontFamily: MONO_FONT,
            fontSize: 30,
            fontWeight: 500,
            color: UI.ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {REPO.clone}
        </div>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: COPY_SIZE,
            height: COPY_SIZE,
            boxSizing: "border-box",
            borderRadius: 11,
            border: `2px solid ${copied ? UI.check : UI.edge}`,
            display: "grid",
            placeItems: "center",
            transform: `scale(${(1 - 0.06 * copyPress).toFixed(4)})`,
          }}
        >
          {copied ? <Check size={42} color={UI.check} sw={2.1} /> : <Copy size={38} color={UI.ink} sw={1.5} />}
        </div>
      </div>
      <div style={{ position: "absolute", left: 26, top: URL_TOP + PR.url, height: PR.hint - 8, display: "flex", alignItems: "center", fontSize: 30, color: UI.meta, ...rise(f, POP_IN + 5, 8) }}>
        Clone using the web URL.
      </div>
      {/* Open with GitHub Desktop / Download ZIP */}
      {[
        { icon: <DesktopDownload size={34} color={UI.meta} />, label: "Open with GitHub Desktop" },
        { icon: <FileZip size={34} color={UI.meta} />, label: "Download ZIP" },
      ].map((it, i) => {
        const top = URL_TOP + PR.url + PR.hint + i * PR.item;
        return (
          <React.Fragment key={it.label}>
            <Hair top={top} style={{ opacity: rise(f, POP_IN + 6 + i).opacity }} />
            <div style={{ position: "absolute", left: 26, top, height: PR.item, display: "flex", alignItems: "center", gap: 18, fontWeight: 500, ...rise(f, POP_IN + 6 + i, 8) }}>
              {it.icon}
              {it.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
