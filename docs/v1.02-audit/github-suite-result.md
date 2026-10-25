# Collected baseline regression

Runtime dfd46bb7, run 40171076084, 25 October 2026 AEDT. This checks the audit baseline, not the later Fruit Parade rewrite.

## Full suite on GitHub: 225/233 passed

The speed checks (`perf`, `startup`, `battery`) are not run here: the Release chat runs them on its own machine.

### Failed
- **netgames**: page.waitForSelector: Timeout 20000ms exceeded.
- **games**: did not open: fruitparade 
- **a11y**: {"bad":{},"cap":{"shown":true,"px":16,"contrast":10.8},"motion":{"calm":true,"forever":[]},"quiet":["fruitparade","cacuangua"],"errs":[]}
- **adventure**: under-5 path: {"cats":13,"inOrder":true,"heads":13,"missed":["fruitparade"],"notDrawn":["unlocks 101/102"],"tooBig":[],"stops":177}
- **friendstab**: {"sharedMap":true,"mismatch":true,"same":true,"foldedSaved":true,"stillFolded":true,"closedOnJoin":true,"closedOnStart":true,"together":{"made":false,"raceN":5,"invited":true},"errs":[]}
- **swupdate**: an update stopped part way keeps what it saved and fetches only the rest: {"first":"swa","partial":306,"refetched":1,"again":["/js/games/multiplayer-foundations.js"],"second":"swb","reloaded":true,"keys":["sv-photos","sv-world","sv-save","sv-2099-swtest-a","sv-2099-swtest-b"],"playing":{"same":true,"notice":true,"heroes":1},"third":"swc","asks":1,"errs":[]}
- **voicecover**: 22 lines not covered: not recorded (en fm): Tap the centre to strike the wooden peg! | not recorded (vi fm): Chạm vào giữa để đánh trúng cọc nhé! | not recorded (en fm): Aim the còn at the target! | not recorded (vi fm): Ngắm ném còn vào vòng nhé! | not recorded (en fm): Horse Racing Chess | not recorded (vi fm): Cờ Cá Ngựa | not recorded (en fm): Sparkle Fruit Parade | not recorded (vi fm): Diễu 
- **offline**: {"saved":5204,"off":5237,"played":true,"none":-1,"errs":[]}

### Passed only on a second try
- phone (first: page.evaluate: Execution context was destroyed, most likely because of a navigation.)

Code map refreshed: 285 files (the artifact "check-map" holds tests/check-map.json and tests/check-times.json for Release to commit).

[The run](https://github.com/nguyentuanphu/tpn/actions/runs/40171076084)
