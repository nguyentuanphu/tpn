#!/bin/bash
# The five ads in English and Vietnamese: ./make5.sh [ad ...]  (stage served on :8770; stills in stills5/, voices in voice5/)
cd "$(dirname "$0")"; mkdir -p out5
ADS=${@:-parents little heritage together explore}
for a in $ADS; do for l in ${LANGS:-en vi}; do
  info=$(node render5.mts $a $l 2>log5-$a-$l.txt | tail -1)
  total=$(echo "$info" | python3 -c "import json,sys;print(json.load(sys.stdin)['total'])")
  python3 music.py music5-$a-$l.wav $total 4$((RANDOM%9)) >> log5-$a-$l.txt
  # the voice lines, each starting 0.35 s into its scene, over the music at a quarter of its volume
  args=(); filt=""; i=1
  for pair in $(echo "$info" | python3 -c "import json,sys;d=json.load(sys.stdin);print(' '.join(f'{i}:{int((s+.35)*1000)}' for i,s in zip(d['ids'],d['starts'])))"); do
    id=${pair%%:*}; ms=${pair##*:}; args+=(-i voice5/$id-$l.mp3); filt+="[$((i+1)):a]adelay=${ms}|${ms},volume=1.6[v$i];"; i=$((i+1))
  done
  n=$((i-1)); mix=""; for k in $(seq 1 $n); do mix+="[v$k]"; done
  ffmpeg -hide_banner -loglevel error -y -framerate 30 -i frames5/$a-$l/f%05d.jpg -i music5-$a-$l.wav "${args[@]}" \
    -filter_complex "${filt}[1:a]volume=0.22[m];${mix}[m]amix=inputs=$((n+1)):normalize=0:duration=longest,alimiter=limit=0.89:level=false[a]" \
    -map 0:v -map "[a]" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k -shortest out5/sparkle-valley-$a-$l.mp4 >> log5-$a-$l.txt 2>&1
  echo "done $a $l $total" | tee -a log5-$a-$l.txt
done; done
