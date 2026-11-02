#!/bin/bash
# render frames, make music to length, mux to mp4
cd "$(dirname "$0")"
for v in "$@"; do
  node render.mts $v > log-$v.txt 2>&1
  n=$(ls frames/$v | wc -l); secs=$(python3 -c "print($n/30)")
  python3 music.py music-$v.wav $secs $RANDOM >> log-$v.txt
  ffmpeg -hide_banner -loglevel error -y -framerate 30 -i frames/$v/f%05d.jpg -i music-$v.wav -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k -shortest out-$v.mp4 >> log-$v.txt 2>&1
  echo "done $v $secs" >> log-$v.txt
done
