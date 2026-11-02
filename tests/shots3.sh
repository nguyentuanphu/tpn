#!/bin/bash
# films batch: stills of a sample of films on a phone, a tablet and a computer
cd "$(dirname "$0")"
for size in "390 844 phone" "820 1180 tablet" "1280 800 computer"; do set -- $size
  SHOT_ONE=1 SHOT_W=$1 SHOT_H=$2 CHROMIUM=/opt/pw-browsers/chromium SV_URL=http://localhost:8765/ timeout 2400 node filmshots.mts out/shots-$3 rongtien thachsanh emu greatrace ganesha hoguom > out/shots-$3.log 2>&1
done
