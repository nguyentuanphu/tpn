# Simple screen return and fruit preview review

29 October 2026 AEDT. Unversioned preparation on `work/voice-bitrate-32k`; no deployment or version approval.

The owner reported that returning from a game jumps the under-5 Simple screen to the top, and enabling all three fruit previews in Studio shows only two.

## Causes and changes

- `draw()` replaces the long path's HTML. Its temporary shorter height clamps the scroll position to zero. Activity return calls `draw()` to update stars, without restoring the position. Both redraw paths now save and restore the vertical and horizontal offsets after layout. Explicit tab changes and category jumps still choose their intended positions.
- Simple did not subscribe to delayed Studio content or re-evaluate late tester acceptance. It now marks Studio content changes for refresh and uses its existing interval to refresh fruit visibility while idle. Open activities finish before that refresh; the same scroll preservation applies.
- The public live release snapshot was inspected selectively: global testing and all three fruit preview switches were on, while Orchard and Fruit Bar single/multiplayer modes were off. Fruit Parade and Fruit Bar admitted accepted testers through preview alone. Orchard incorrectly required both preview and a second mode switch. Its corrected gate is **eligible accepted tester AND (preview OR requested mode)**. Non-testers, unaccepted/stopped testers and devices outside the invited list remain excluded. With preview off, the two requested-mode controls remain independent; with every Orchard control off it is hidden. Studio's Orchard preview text explains the preview path. No live settings were modified.

The previous unit truth table required both preview and mode; it was changed with this documented contract correction, rather than removed. Additional assertions exercise actual consent, global permission, selected-device and mode checks.

## Verification

- `node --test tests/arcade-engines.mts`: **11/11 passed** (about 4.2 seconds), including all gate combinations and actual eligibility checks.
- Syntax check of `tests/simple-return-fruit.mts`: passed.
- `git diff --check`: passed.
- New browser fixture `simpleReturnFruitCheck(browser)` in `tests/simple-return-fruit.mts` is ready for Release to register and run. It covers three preview-only games, a real delayed Studio response, late tester consent, global/preview/mode off-on changes, game/story returns in EN/VI on phone/tablet/computer and phone landscape, both scroll axes, and intentional tab resets.
- Browser, suite and screenshot execution are owned by Release and were **not run by this helper**, to avoid parallel local suites. No deployment readiness is claimed from unit tests alone.

Changed runtime and test files are TypeScript. No new spoken lines, private data, save migration, recording calls, version change or publication is involved.

## Release browser result

`types,resumerecovery,simplereturnfruit` passed3/3 sequentially. Simple return fixture passed124s across eight device/language layouts: all three previews, real delayed Studio content, late consent and mode/global gates, game/story return offsets, explicit tab reset. Screenshots in `shots/` reviewed by Release. Physical device review and fresh GitHub regression remain pending.
