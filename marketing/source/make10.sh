#!/bin/bash
# The ten ads (r82) in English and Vietnamese: ./make10.sh [ad ...]  (stage served on :8770; stills in stills10/, voices in voice10/)
cd "$(dirname "$0")"; mkdir -p out10
ADS=${@:-homes bilingual family little learn heritage stories rewards together parents}
for a in $ADS; do for l in ${LANGS:-en vi}; do
  info=$(node render10.mts $a $l 2>log10-$a-$l.txt | tail -1)
  total=$(echo "$info" | python3 -c "import json,sys;print(json.load(sys.stdin)['total'])")
  python3 music.py music10-$a-$l.wav $total 4$((RANDOM%9)) >> log10-$a-$l.txt
  # the voice lines, each starting 0.35 s into its scene, over the music at a quarter of its volume
  args=(); filt=""; i=1
  for pair in $(echo "$info" | python3 -c "import json,sys;d=json.load(sys.stdin);print(' '.join(f'{i}:{int((s+.35)*1000)}' for i,s in zip(d['ids'],d['starts'])))"); do
    id=${pair%%:*}; ms=${pair##*:}; args+=(-i voice10/$id-$l.mp3); filt+="[$((i+1)):a]adelay=${ms}|${ms},volume=1.6[v$i];"; i=$((i+1))
  done
  n=$((i-1)); mix=""; for k in $(seq 1 $n); do mix+="[v$k]"; done
  ffmpeg -hide_banner -loglevel error -y -framerate 30 -i frames10/$a-$l/f%05d.jpg -i music10-$a-$l.wav "${args[@]}" \
    -filter_complex "${filt}[1:a]volume=0.22[m];${mix}[m]amix=inputs=$((n+1)):normalize=0:duration=longest,alimiter=limit=0.89:level=false[a]" \
    -map 0:v -map "[a]" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k -shortest out10/sparkle-valley-$a-$l.mp4 >> log10-$a-$l.txt 2>&1
  # the cover (owner: each thumbnail says what the video is about), next to the video and built into it as its cover picture
  node render10.mts $a $l thumb >> log10-$a-$l.txt 2>&1
  ffmpeg -hide_banner -loglevel error -y -i out10/sparkle-valley-$a-$l.mp4 -i out10/sparkle-valley-$a-$l-thumb.jpg -map 0 -map 1 -c copy -c:v:1 mjpeg -disposition:v:1 attached_pic -movflags +faststart out10/tmp-$a-$l.mp4 >> log10-$a-$l.txt 2>&1 && mv out10/tmp-$a-$l.mp4 out10/sparkle-valley-$a-$l.mp4
  echo "done $a $l $total" | tee -a log10-$a-$l.txt
done; done
