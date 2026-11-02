# v1.07 family-code: status

Branch: `work/v107-family-code` (from main v1.06). Brief: [family-code-brief.md](family-code-brief.md).

**Paused 2 Nov 2026, 11:14 am AEDT** on Release's "slow down" message (usage). Waiting for Release's "resume" after
2 pm AEDT. Not ready for Release yet.

## 1. What is already built (checked 2 Nov 2026 AEDT)

- **Part 1, Save a copy / Load a copy: live since v1.01.** Grown-ups, Analytics and backup: "Save a copy · Lưu một bản"
  makes `sparkle-valley-<date>.svsave` (share sheet, or a download), "Load a copy · Mở bản đã lưu" checks the file
  (`js/content/savecopy.ts` readSaveCopyOrLegacy), shows the names and date and asks before replacing. Unit tests:
  `tests/unit/savecopy.test.mjs`.
- **Part 2, the family code: built and live since v1.01** (PR #506, privacy wording approved 24 Oct 2026 AEDT,
  [wording](../family-code-privacy-wording-v1.01.md)).
  - `js/content/familycode.ts`: random 8-character code (XXXX-XXXX, no 0/O/1/I), normalising, one-way hash
    (`sha256("sv-family-v1:" + code)`, first 16 hex), a friendly family name made from the hash (EN and VI), an offline
    QR (Version 1-L) that scans to the code text.
  - `js/ui-settings.ts` (Grown-ups, behind the gate): privacy line, Make a family code, Join with a code, Copy code,
    Leave the family, family name and QR.
  - Kept with the saves (`settings.familyCode`) and inside Save a copy; Load a copy restores it.
  - `js/players.ts`: the hello carries only `fh` (the hash), never the code. `netlify/lib/hello-clean.mts` accepts only
    16 hex characters. `netlify/lib/players.mts` stores it in the device record `info/<id>` and counts families
    (count, linked devices, devices per family) over the last 30 days; Studio Players shows "N families (x/fam)".
- **What is left of Part 2** (against `docs/cores/tasks/save-copy-family-code.md`):
  1. The browser check of the whole journey (make on one device, join on a second, wipe one and rejoin from Save a
     copy) did not exist: only a one-page make/leave/join inside `grownupsui`. **Done now** (below).
  2. The QR was checked only for its corner squares, never read back. **Done now** (below).
  3. Studio does not count "a wiped device coming back". Needs a server change (read only): **waits for the owner.**
  4. Phone, tablet and computer screenshots in both languages for this round. **Done now** (below).
  5. The server keeps `fh` in `info/<id>` with no time limit (the device record has none). A limit would delete
     stored data: **owner's decision**, never assumed.

## 2. Plan for the rest of Part 2 (for the owner's pop-up; not asked yet)

- **What the child sees:** nothing new. The family code is only in Grown-ups, behind the grown-up gate.
- **What the grown-up sees:** nothing changes on the device. In Studio Players (owner only), next to "N families":
  "M devices came back" = devices first seen in the last 30 days whose family hash was already on an older device
  (a wiped or new device that joined by code). A device restored from Save a copy keeps its old device number, so it
  is not counted as new (checked by `familycodejourney`).
- **What the server stores and for how long:** nothing new. The count is worked out when Studio opens the report, from
  the `info/<id>` records already kept. Today `fh` stays in `info/<id>` as long as the record does (no limit). Option
  for the owner, not in the recommended plan: clear `fh` from records not seen for 13 months.
- **Privacy:** only the 16-hex hash ever leaves the device; no names, no code. Studio shows counts, never hashes or
  codes. The approved wording stays as it is ("statistics only"). Leaving does not erase past analytics (the wording
  never claims it does).
- **How an old family code keeps working:** the hash recipe (`sv-family-v1:`), the code format and the name are pinned
  by a unit test with a fixed value (K7M4-P9Q2 is 5dadcf8bcf1bb1e2, "Red Buffalo 58" / "Trâu Đỏ 58"); old save copies
  with or without a code still load. The older Studio-issued photo code (`js/custom.ts`, "Earlier photo code") is a
  separate thing and is not touched.
- **Files:** `netlify/lib/players.mts` (one count in `families`), `studio/ui/app.ts` (the words next to it, EN and VI),
  a server unit test with made-up devices. Checks: unit, `studio`, `--changed`, online checks with
  `node tests/services/start.cjs`.

## 3. Done (no family data touched; made-up families only)

- `tests/unit/familycode.test.mjs`: an independent QR reader (written from ISO/IEC 18004, not from the encoder) reads
  every made QR back to its code (format bits, Reed-Solomon, byte data); the v1 hash and family name are pinned so an
  old code keeps its family.
- `tests/family-code-journey.mts` + check `familycodejourney` at the end of `tests/run.mjs`: phone (EN) makes a code;
  tablet (VI) types it in lower case with a space and shows the same family; tablet saves a copy (download); a wiped
  computer loads it after one question and has the same family, progress and device number; leaving keeps every
  child's progress; a wrong code is refused with a message; touch targets 44 px or more; 11 screenshots in
  `tests/out/family-code/` (looked at: phone EN, tablet VI, computer VI, all tidy).
- Shared file touched: `tests/run.mjs` (three lines at the end: the new check).

## 4. Checks

| Check | Result | When |
|---|---|---|
| unit `tests/unit/familycode.test.mjs` (8 tests) | pass | 2 Nov 2026 AEDT |
| `familycodejourney` (alone) | pass (105 s) | 2 Nov 2026 AEDT |
| unit (all), grownupsui, saves, familyquizprivate, boot, phone | not run: stopped on Release's slow-down | |
| `suite.mjs --changed --list` | picks the full suite (new test file) | |
| full suite on GitHub (`full-suite.yml`) | not started yet | |
| online checks (`tests/services/start.cjs`) | not run (no server change yet) | |

## 5. Exact next step (after Release's "resume")

1. `cd tests && node run.mjs unit grownupsui saves familyquizprivate familycodejourney boot phone` (game served on
   :8765 after `node tools/build.mts`; restore `content/management-catalogue.json` if the build rewrites it).
2. Start `.github/workflows/full-suite.yml` on this branch (workflow_dispatch) and record the result here.
3. Ask the owner the pop-up "Build Part 2 as planned (Recommended)" / "Change the plan" / "Not now" (section 2). Never
   assumed. Build only after "Build Part 2 as planned".
4. Open a draft PR "v1.07 family-code: ..." and write "ready for Release" at the top when the checks are green.

## Owner's decisions

- None yet in this session.
