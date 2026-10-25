# Full FPT Lê Minh recording / Thu đầy đủ Lê Minh

Owner authorized the full Vietnamese batch on 25 October 2026 AEDT. This is recording authorization, not deployment approval. / Chủ game đã duyệt thu cả gói tiếng Việt; chưa duyệt triển khai.

The frozen inventory uses the same catalogue as the pack generator: static dialogue, games, stories, film speech, learned words, harvested dynamic lines, reading and template parts. **6319 recordings**, including **870 reusable parts**; **232,954 characters**. The helper’s static-only count of 3,521 is incomplete. 19 test-child-name entries are held; their name-free template parts remain available. / Danh sách đầy đủ gồm câu tĩnh, câu ghép động, bài đọc và các mảnh lời; không chỉ câu quét tĩnh.

Source: stable v1.01 plus recording tools. Unreviewed helper-game lines will be a separate delta after correction; no need to re-record this catalogue. At the owner’s displayed $16.50/million rate, text cost estimate is US$3.84, excluding retries and provider pricing changes.

- Provider: FPT Neo; model FPT.AI-VITs; voice leminh; speed 1; explicit MP3.
- Credential: FPT_API_KEY, GitHub secret only.
- Output: temp/fpt-recordings/<canonical game line ID>.mp3 plus per-shard manifests.
- Four sequential shards; one recording request at a time, 1.5 s spacing, bounded retries and stop on access/quota failures.
- Checkpoints every 50 clips; each file decoded with ffprobe, checksummed and linked to the exact text/provider configuration. Resume skips only validated matching files. Outputs and metadata are saved on work/fpt-leminh-full-20261025, never main.
- No replacement of female recordings, defaults, game manifests or live files occurs in this job. Voice policy and publication remain part of v1.02 review.

## Current status — 25 October 2026 AEDT

**Resumed, not complete.** [Fresh run 40175822783](https://github.com/nguyentuanphu/tpn/actions/runs/40175822783) is recording missing clips, reusing the first 1,580. Current independently downloaded checkpoint: 1680 clips; full coverage remains pending. Owner confirmed the key is active. One tiny diagnostic request in [run 40175648144](https://github.com/nguyentuanphu/tpn/actions/runs/40175648144) succeeded and fully decoded; the resumed batch also passed the exact input that originally returned 401.

First attempt disclosure: shard 0 completed with 1,580 saved clips. Shard 1 received HTTP 401 at 6:37 pm AEDT and stopped the remaining jobs. All 1,580 files passed independent checksums and full FFmpeg decoding. [Pre-resume audit](before-resume-audit.json) preserves that failure; [current audit](checkpoint-audit.json) explicitly distinguishes verified files from full decoding. The authorization failure is currently not reproducible; its original provider-side cause is not proven. No key was changed by Release.

## Completion audit

Owner chose parent-selectable Lê Minh for **all Vietnamese speech**, preserving the current default. This policy does not install unfinished recordings or approve deployment.

Read-only validation (no key, no synthesis calls):

```
node tools/verify-fpt-pack.mts --allow-partial
node tools/verify-fpt-pack.mts --decode
```

The first command reports partial progress without marking it complete. The final command must pass after all four shard manifests finish: exact frozen inventory/provider identity, every required clip, byte count, MP3 header, checksum, positive probed duration, and full FFmpeg decoding. Wrong-provider files, corrupted audio, stopped shards and missing shards block readiness. `decoded: 0` means full decoding was not requested; it is not an audio-quality/listening approval. The review also needs listening and game/offline integration checks.

Independent checkpoint review: 600 downloaded clips had matching checksums and all 600 fully decoded with FFmpeg without failure. A later 900-clip snapshot passed the new read-only hash/provenance audit; it correctly reports 5,419 recordings still missing and complete=false. Six focused recorder/integrity tests pass; the audit tool also passes strict TypeScript.


## Completed baseline recording · 25 October 2026 AEDT

Resumed run 40175822783 completed successfully with all 6,319 canonical Vietnamese clips saved across four complete manifests. The original run stopped after 1,580 clips on HTTP 401; the unchanged-key diagnostic succeeded, and resume recorded the previously failed line. The provider failure cause remains unproven. First 1,580 clips were independently fully decoded earlier; a separate unpaid GitHub job now checks hashes and fully decodes all 6,319. Recording success does not establish subjective listening approval or production integration. The owner-selected all-Vietnamese Lê Minh option must preserve the default female voice.
