# Declared game discovery reconciliation

This is a source investigation ticket, not a claim that these games are broken or ready. All26IDs below are declared in the second set but absent from the current exported catalogue.25have registration literals. A literal proves a source declaration exists, not that the lazy loader or user-facing menu reaches it.

| Declared ID | Registration reference | Menu/loader | Actual playable outcome |
|---|---|---|---|
| aodai | js/games/drawing2.ts:282 | Not verified | Not verified |
| bubblepaint | js/games/crafts.ts:235 | Not verified | Not verified |
| fingerpaint | js/games/crafts.ts:254 | Not verified | Not verified |
| finishpic | js/games/drawing2.ts:402 | Not verified | Not verified |
| fireworks | js/games/crafts.ts:331 | Not verified | Not verified |
| gallery | js/games/crafts.ts:389 | Not verified | Not verified |
| hiddenpic | js/games/drawing2.ts:382 | Not verified | Not verified |
| kitepaint | js/games/drawing2.ts:300 | Not verified | Not verified |
| lacquer | js/games/crafts.ts:198 | Not verified | Not verified |
| leafrub | js/games/crafts.ts:408 | Not verified | Not verified |
| makeface | js/games/crafts.ts:368 | Not verified | Not verified |
| masks | js/games/crafts.ts:350 | Not verified | Not verified |
| mosaic | js/games/drawing2.ts:237 | Not verified | Not verified |
| nonla | js/games/drawing2.ts:258 | Not verified | Not verified |
| paperfold | js/games/drawing2.ts:444 | Not verified | Not verified |
| pixelpic | js/games/crafts.ts:311 | Not verified | Not verified |
| rongran | No literal reference found | Not verified | Not verified |
| scene | js/games/drawing2.ts:423 | Not verified | Not verified |
| scratch | js/games/crafts.ts:216 | Not verified | Not verified |
| shades | js/games/drawing2.ts:325 | Not verified | Not verified |
| shadowpic | js/games/drawing2.ts:345 | Not verified | Not verified |
| spotdiff | js/games/drawing2.ts:363 | Not verified | Not verified |
| stamps | js/games/drawing2.ts:198 | Not verified | Not verified |
| thocam | js/games/crafts.ts:292 | Not verified | Not verified |
| weatherpaint | js/games/crafts.ts:273 | Not verified | Not verified |
| weave | js/games/drawing2.ts:217 | Not verified | Not verified |

## Implementation sequence

1. Inspect the registration function and bilingual metadata at each reference. Confirm the stable ID, area, age/difficulty policy, art and entry/exit lifecycle. Do not guess from the filename or copy another activity's metadata.
2. Trace loader registration through js/games/catalog.ts, the game frame/registry and Play/Simple menus. Record whether a direct engine launch, a menu launch and tester/autoplay discovery each reach the same ID. Check grouped newGames release policy and progress dependencies separately.
3. Determine whether the catalogue exporter omitted an otherwise supported registration or the game itself lacks loader/menu integration. Add a source-backed extractor or reviewed metadata mapping appropriate to that actual case. Preserve kind:id and avoid duplicate IDs.
4. For rongran, inspect dynamic/generated registration paths and intended design before deciding whether implementation is absent. Do not insert a fake playable entry or quietly delete the declaration.
5. Verify actual launch, legal completion, exit/back context, saved progress and supported EN/VI/age modes with the existing test runner. Check hidden/held/coming-soon states and an explicit Off rule. A static metadata test is insufficient.
6. Regenerate catalogue and website review evidence from the exact source; update any source-count explanations and applicable coverage checks together, preserving intended items. Review media/voice availability independently.
7. Refresh INVENTORY and CONTROL-COVERAGE, update Home's source review evidence, retain per-item screenshots/test results and run required GitHub verification. Do not mark all13domains complete from these game fixes alone.
