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
