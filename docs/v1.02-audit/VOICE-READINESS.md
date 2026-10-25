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
