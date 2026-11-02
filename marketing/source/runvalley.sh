#!/bin/bash
# records and assembles versions of the big kids' film (the 3D valley), one after another: ./runvalley.sh "en land" ...
# (SCALE=0.15 for a quick test of every shot)
cd /home/user/sv-next/marketing/source
export SV_URL=http://localhost:8767/ CHROMIUM=/opt/pw-browsers/chromium
D=${D:-/tmp/claude-0/-home-user-Sparkle-Valley/cbc9a382-659a-5266-8e15-1f9ccb9bed5b/scratchpad/film}
while pgrep -f "^/bin/bash ./runlittle" >/dev/null; do sleep 30; done
for v in "$@"; do set -- $v; lang=$1 shape=$2; [ $shape = land ] && sn=landscape || sn=vertical; out=valley-$lang-$shape${SCALE:+-test}
  node rec-valley.mts $lang $shape $D/$out > $D/rec-$out.log 2>&1
  echo "recorded $out $(ls $D/$out | grep -c jpg) frames" >> $D/runvalley.log
  [ -z "$SCALE" ] && node makefilm.mts valley $lang $shape $D/$out $D/out/sparkle-valley-film-valley-$lang-$sn.mp4 >> $D/runvalley.log 2>&1
done
echo done >> $D/runvalley.log
