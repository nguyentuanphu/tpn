# Current voice checkpoint · 26 October 2026 AEDT

Production packaging now contains **6,344 verified current public Lê Minh units**, with canonical IDs and provider/model/voice identity, checksum and byte totals. The optional pack is about 405 MiB. Staging has 6,345 clips including one historical title. Current default Vietnamese inventory has 6,366 units; 19 privacy-held units and three unreviewed prototype instructions remain excluded from FPT.

Parents can select Lê Minh for public Vietnamese narration while retaining the female default. Family recordings retain their existing priority; unrecorded/private speech retains the existing fallback policy. Independent provider caches prevent confusing Azure male recordings with Lê Minh. The shared download service continues after Settings closes, resumes cached work, verifies downloaded bytes, and never sends runtime speech to FPT. Mobile-data permission is visible and revocable. The download size is shown before the optional download starts.

The real browser integration passed with 18 actual recordings: default avoids optional fetching, preview does not opt in, download continues after closing Settings, and a female character uses Lê Minh offline. Existing male/female preview and offline-background regression also passes (110s). The first combined run passed 3/3 including types. A later newly included test-file type error was corrected; final mobile-permission/bilingual layout/types follow-up passes 2/2 (130s,23s). Four focused service units pass, including full-storage reporting. Full GitHub regression on this source remains required. Physical-device/listening review remains outstanding.

Turtle count recording runs 40256013533 (FPT) and 40256013546 (default Azure) succeeded. Three new FPT clips were independently checksummed and fully decoded. Current default coverage is zero missing. The packaging tool rejects unknown current voice gaps and excludes privacy-held units; adding a game/story/film requires reviewed recordings before packaging can complete.

The earlier dated audit follows; its pending-production statements describe the earlier checkpoint.

# Lê Minh readiness · 26 October 2026 AEDT

Snapshot of runtime `ad302279a`, voice assets through `1a05aed33`, after the default-voice coverage check reported zero missing files. Exact counts and source paths: [VOICE-READINESS.json](VOICE-READINESS.json).

| Inventory | Vietnamese voice units |
|---|---:|
| Current default manifest | 6,363 |
| Frozen v1.01 Lê Minh baseline, independently verified/decoded | 6,319 |
| Reviewed arcade delta including two family titles, recorded/decoded | 13 |
| New reviewed public title labels, recorded/decoded | 10 |
| Total Lê Minh staging, including one historical title | 6,342 |
| Current manifest units with a staged Lê Minh recording | 6,341 |
| Privacy-held items excluded from FPT | 19 |
| Public instructions awaiting game/copy review and an FPT delta | 3 |

The three held public instructions belong to Cờ Cá Ngựa, Đánh Đáo and Ném Còn. Review the game rules/copy before recording them. No unknown-source gap remains. The 19 privacy-held items must not be uploaded merely to make a count complete.

Baseline recordings are on `work/fpt-leminh-full-20261025` (838c0c46f), under `temp/fpt-recordings/`; independent full decode run 40190674496 verified all 6,319. The eleven new arcade recordings and `arcade-delta.json` are on `work/v1.02-fruit-parade`, also under `temp/fpt-recordings/`, from run 40190084618 and verified unchanged-text refreshes. Old helper dry-run/sample artifacts are audit evidence, not production packs.

Ten public title recordings are verified by checksum, MP3 format and full decode in run 40227974447, saved at `715f260d1` on `work/fpt-v102-labels-20261026`. Independent evidence: [label-audit.json](label-audit.json).

Production parent selection of Lê Minh for Vietnamese speech is still pending. It must preserve the female default, identify provider/model/voice separately from Azure, use the correct manifest/cache namespace, and keep an explicitly selected download running after Settings closes. Staged MP3s do not yet implement that runtime behaviour. Listening/physical-device review remains outstanding.

## How new content stays traceable

`tools/voice-lines.mts` collects static bilingual speech with source files, templates and reusable parts. `js/packhash.ts` gives a language/text unit its canonical ID. `tools/make-voice-pack.mts --cover` checks the current sources, including harvested dynamic lines, against the default recordings; a new game/story/film must pass that check before its manifest is treated as the complete current inventory.

An FPT batch freezes reviewed public Vietnamese text and canonical IDs. Manifests retain provider/model/voice, text identity, checksum and recording progress; source hashes in the arcade delta detect changed instructions. New actors also need the speaker/cast metadata. A new provider requires its own identity/cache path. Private family text and child names require the existing private/on-device fallback policy, not automatic provider upload.

The cache-area totals in the JSON are download groups, not numbers of games or stories: the games group also includes film/story material. Canonical IDs deduplicate shared phrases across source files. This readiness table is a dated audit snapshot; the source collectors, coverage check and reviewed batch inventories are the maintained records.

The 26 October family-access change replaces the adult-only title. Its old canonical clip remains historical staging, so 6,342 staged files cover 6,341 current units. Run 40243379237 reused the original eleven arcade clips and recorded only two new names; both were independently checksummed and fully decoded. Default run 40243424013 recorded eight English/Vietnamese female/male title files and passed coverage. No other privacy-held or prototype instruction was sent.
