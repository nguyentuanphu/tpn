# Four owner-assigned fixes

Owner assigned this chat on 18 October 2026 AEDT to #341 slow gameplay, #350 Ô Ăn Quan, the Friends status map check, and #34 road appearance. The owner said to proceed. Branch: `claude/codex-last-four-20261018`. This is a helper handoff to the existing Release chat, with no merge or deployment authorization.

## Implemented changes

- #341: an automatic-report burst shares one composed-screen capture, keeping separate report details. Concurrent repeats of the same problem share one pending report. A later event gets a fresh capture. Reproduction with 12 simultaneous detector reports: baseline 24 canvas encodes (12 captures), fixed 2 encodes (one capture); all 12 distinct reports retained. This removes reporting overhead; it does not establish the cause of every slow frame on the owner's Mac.
- #350: an empty end pit can be skipped to capture beyond it; an end pit containing its mandarin stone cannot be skipped during chained captures. Autoplay receives legal square/direction choices and waits through sowing and the opponent's turn. Sowing redraws only the changed pit instead of replacing all twelve pits on every seed. Pending taps are cleaned up when the game closes.
- Friends: `G.shareStatus` explicitly includes `Net.mapVersion`. Note: the encrypted envelope already adds a default map version and batch 3 already made `_openFriend` retain it; the board's claim that no status ever carries a map was partly stale. New verification covers the shared status and both same/different-map Join states without requiring a live relay.
- #34: Concept D's darker Australian asphalt and grey Vietnamese asphalt, retaining ROAD-014's subtle region tint; stone kerbs on Vietnam roads. Existing dirt red earth, wheel tracks, grass and edging stones from Round T already match that portion of the reference. No road geometry, map positions, materials count, or collision change.

## Validation (18 October 2026 AEDT)

Runtime code commit: `29fd9ecc`. Before changes: unit (162), types, rules and arch passed. After changes: **all 17 targeted checks pass**: unit (165), types, rules, arch, emoji, noemoji, preload, names, bilingual, boot, phone, contract, friendstab, roadtone, roadshape, reportburst, oanquanrules.

The combined local run was 16/17 because the reduced checkout omitted a tracked documentation file required by the emoji audit. After restoring all tracked Markdown/text files, `suite.mjs --only emoji` passed. No test or requirement was weakened. `noemoji` inspected 99 games. `phone` inspected ten main screens on desktop/phone/tablet. `roadtone` verified 17 asphalt roads and six shared road materials. New rule cases fail on the baseline: an empty-end-pit capture gives zero instead of four; the occupied-end-pit chain gives seven instead of three. The corrected rules pass both directions and preserve stone value in the authored cases.

GitHub fast checks and the Netlify package build passed on the runtime-code commit. Full changed-check selection requests GitHub's full suite; no local full suite was run. Full suite is running on draft [PR #358](https://github.com/nguyentuanphu/Sparkle-Valley/pull/358); see the PR checks for the current run. **Not ready for merge/deployment while it is pending.** The AI-review workflow completed with the comment "did not finish"; it is not a successful AI review.

## Pictures inspected

Eight pictures of the actual game frame: English and Vietnamese at phone 390×844, tablet 820×1180, computer 1180×820 and phone landscape 844×390. These are isolated UI fixtures using the real frame/game/CSS/art; the local `phone` check additionally exercised the full game. Images use synthetic player names. `roads-before-after.png` compares real texture canvases from baseline `1ac883f` (left) with the revised code (right); dirt is shown unchanged for comparison. The reference is `docs/concept-d/index.html`, section "How roads, paths and rivers will look".

- [Road surfaces before/after](roads-before-after.png)
- [Phone EN](oanquan-phone-en.png) · [VI](oanquan-phone-vi.png)
- [Tablet EN](oanquan-tablet-en.png) · [VI](oanquan-tablet-vi.png)
- [Computer EN](oanquan-computer-en.png) · [VI](oanquan-computer-vi.png)
- [Phone landscape EN](oanquan-phone-landscape-en.png) · [VI](oanquan-phone-landscape-vi.png)

## Remaining limits and Release handoff

- #341 still needs a normal-speed try on the reporting Mac. Removing reproduced report-burst overhead is not proof that every source of 3–17 FPS is resolved; world draw-call/memory work remains with its existing owner.
- Existing compact Ô Ăn Quan controls are about 47 px wide on a 390 px portrait phone and 59 px high in short landscape, below the handbook's 64 px under-5 target. This patch preserves the existing layout; a board/direction-control layout follow-up remains to be scoped with the owner. No visual-layout compliance claim is made for those existing controls.
- No new spoken lines and no game version bump: Release owns final versions and the combined release. The fixes do not add runtime files, and existing offline/preload lists remain current.
- The owner assigned the four tasks and said to proceed. No merge or deployment was requested. Keep the PR a draft until the full suite and Release review are complete.
