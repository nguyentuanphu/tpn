#!/bin/bash
# records and assembles the four versions of the little ones' film, one after another
cd /home/user/sv-next/marketing/source
export SV_URL=http://localhost:8767/ CHROMIUM=/opt/pw-browsers/chromium
D=${D:-/tmp/claude-0/-home-user-Sparkle-Valley/cbc9a382-659a-5266-8e15-1f9ccb9bed5b/scratchpad/film}
for v in "$@"; do set -- $v; lang=$1 shape=$2; [ $shape = land ] && sn=landscape || sn=vertical
  node rec-little.mts $lang $shape $D/little-$lang-$shape > $D/rec-little-$lang-$shape.log 2>&1
  echo "recorded little $lang $shape $(ls $D/little-$lang-$shape | grep -c jpg) frames" >> $D/runlittle.log
  node makefilm.mts little $lang $shape $D/little-$lang-$shape $D/out/sparkle-valley-film-little-$lang-$sn.mp4 >> $D/runlittle.log 2>&1
done
echo done >> $D/runlittle.log
