# Public voice routing and recording sources

Owner request,27 October2026 AEDT. Prepared on work/voice-bitrate-32k; no release number or deployment approved.

`tools/voice-providers.mts` is the shared registry used by both recorders. No provider or accent is guessed from a filename or a person's gender.

| Public language | Required recordings | Provider voice IDs | Delivery folders |
| --- | --- | --- | --- |
| English | Female and male defaults | Azure en-AU-NatashaNeural, en-AU-WilliamNeural | voices/en/f and voices/en/m |
| Vietnamese | Female and male defaults, plus optional northern Lê Minh | Azure vi-VN-HoaiMyNeural, vi-VN-NamMinhNeural; FPT FPT.AI-VITs / leminh | voices/vi/f, voices/vi/m, voices/fpt-leminh-v1 |
| Existing Chinese and Hindi lines | Existing male defaults | Azure zh-CN-YunxiNeural, hi-IN-MadhurNeural | voices/zh/m, voices/hi/m |
| Private family questions/names | No cloud route | Explicitly offline device speech or read together | No provider recording queue |

All new delivery recordings use32kbps,16kHz,mono MP3. Azure requests that format directly. FPT originals are retained and compressed once during packaging; converted files never become recording masters. Existing recording IDs/text remain unchanged. SHA-256, byte totals and the manifest signature describe the actual delivery bytes.

## New games, stories, dialogue and films

1. Author speech in the established bilingual speech calls/content. The existing shared extractor and runtime harvest collect public utterances. `voicecover` fails for missing default recordings.
2. Azure's daily workflow records missing defaults to `voices/daily`, for Release review. The shared registry determines Azure voices and output format.
3. `tools/fpt-arcade-inventory.mts` now considers static Vietnamese lines across all game sources, rather than a fixed list of ten games. Only current default-manifest IDs qualify; privacy-held/name/placeholder text is excluded. Its historical filename is retained for compatibility. Variable/runtime-only additions require the established public-text review; they are never blindly sent to FPT.
4. Commit the reviewed FPT inventory, including exact source fingerprints, on a work/,release/ or voices/ branch. The FPT workflow follows that branch automatically, records only missing verified public entries and saves master MP3s/receipts back to the same branch. Editing tools alone does not start paid recording. Main is never a recording destination.
5. Package from verified originals using `tools/build-hanoi-pack.mts`. It verifies provider/text identity, source bytes/SHA and required coverage before encoding. Each output is fully decoded and checked for format/duration. Completed conversions resume by master checksum and encoding policy; an interrupted build cannot replace the existing package.
6. `voiceroutes` is a regression gate. It requires Azure female/male and FPT for each applicable Vietnamese ID, plus reviewed mixed-language fragments. Missing entries include the provider, voice ID, language and destination file. A new line cannot silently ship with only one provider covered.

The generated `docs/voice-bitrate-32k/provider-ledger.json` lists each required route and missing entries. FPT entries link reviewed text/source inventory and master/delivery hashes; Azure entries reference the established public text inventories. `delivery-audit.json` records every master-to-delivery checksum, size and duration.

## Where masters are kept

The full original FPT receipts/audio remain on work/fpt-leminh-full-20261025; title originals remain on work/fpt-v102-labels-20261026; later reviewed deltas remain in temp/fpt-recordings on the working release branch. These source locations are passed explicitly to the packager. The live-v1.02 originals also remain in Git history. A local backup preserves the preceding production pack during an atomic replacement. No master is overwritten and no provider key is placed in a ledger or file.

A new voice/provider must be explicitly added to the registry, recording identity and parent selection UI, with a separate destination/cache identity. Unsupported routes fail instead of selecting another voice. Recording credentials remain GitHub Secrets only. Packaging never calls a paid provider API.
