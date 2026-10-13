#!/usr/bin/env bash
# QA for CRT renders: strict black frames, per-frame brightness dips, frozen frames.
# Usage: bash scripts/qa.sh <video.mp4> [more.mp4 ...]
set -euo pipefail

for f in "$@"; do
  echo "== $f"
  black=$(ffmpeg -v info -i "$f" -vf "blackdetect=d=0.01:pix_th=0.02" -an -f null - 2>&1 | grep -c black_start || true)
  echo "black frames (pix_th 0.02): $black"
  ffmpeg -v error -i "$f" -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -an -f null - 2>/dev/null \
    | grep -oE "YAVG=[0-9.]+" | cut -d= -f2 \
    | python3 -c "
import sys, statistics
v = [float(x) for x in sys.stdin]
m = statistics.median(v)
dips = [i for i, x in enumerate(v) if x < 0.55 * m]
print(f'luma median {m:.1f}, min {min(v):.1f}, dips (<55% of median): {dips}')
"
  ffmpeg -v error -i "$f" -vf "tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -an -f null - 2>/dev/null \
    | grep -oE "YAVG=[0-9.]+" | cut -d= -f2 \
    | python3 -c "
import sys
v = [float(x) for x in sys.stdin]
frozen = [i + 1 for i, x in enumerate(v) if x < 0.05]
print(f'frozen frames: {frozen if frozen else \"none\"}')
"
done
