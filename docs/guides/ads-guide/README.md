# How in-game ads look (picture guide)

Made by the Studio chat, 12 Oct 2026 AEDT (r65 Studio round). These are real screenshots of the game with a pretend ad
switched on ("Little Lotus Books", a made-up family bookshop). Studio's Ads page shows the same pictures under
"Pictures: how ads look in the game" (copies in `studio/ui/ads-guide/`, bundled into SparkleStudio.exe by
`studio/build-exe.sh`).

| Picture | What it shows |
|---|---|
| `board-computer.jpg` | A signboard beside the road near a town gate (Đà Nẵng), on a computer |
| `board-phone.jpg` | The same signboard on a phone |
| `card-computer.jpg` | The small card under "You did it!" after a mini-game, on a computer |
| `card-phone.jpg` | The same card on a phone |
| `sample-ad.jpg` | The pretend ad's picture (1200 x 680) |

What the pictures teach:
- The ad's picture fills the signboard, so it is seen from far away: big simple shapes and few words work best.
- On the card the picture is small (64 x 44 px on a computer); the words beside it carry the message.
- Every ad says "Ad" / "Quảng cáo" (and on the card, who it is from).

Before an ad can go live, Studio's checklist asks for: a picture, the words in English and in Vietnamese, who the ad is
from, where it shows (a signboard or the card), and, if there is a link, one that starts with `https://`, has no
tracking (`utm_...`, `fbclid`, `gclid`) and is not a link shortener. "Show ads" is not saved while an active ad is not
ready.

Examples of good ads: the ten ready-made videos about Sparkle Valley, each in English and in Vietnamese
(`marketing/ads-r82/`: https://github.com/nguyentuanphu/Sparkle-Valley/tree/main/marketing/ads-r82).

To make the pictures again (after the game's look changes):

```
python3 -m http.server 8765 &
SV_URL=http://localhost:8765/ CHROMIUM=/opt/pw-browsers/chromium node docs/guides/ads-guide/capture.mjs
```

The script changes nothing in the repo's content: the browser hands the page the pretend ad. `BOARD`, `ANG` and `DIST`
choose which signboard and where the camera stands.
