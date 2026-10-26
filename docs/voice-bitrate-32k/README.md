# Consistent32kbps voice preparation

Owner selected preparation without a release number. Live v1.02 is unchanged; no deployment approved for this work.

English and default Vietnamese voices already use32kbps mono MP3. FPT Lê Minh masters use160kbps. The packager now produces32kbps,16kHz,mono delivery copies from verified originals, preserving all6663 canonical public IDs and their reviewed provider/text identity. Every newly encoded clip must fully decode and match its master duration within0.20seconds (MP3 frame padding); a failed batch does not replace the current package.

Originals stay in recording branches/Git history and the local package backup. The pipeline never compresses a previously compressed delivery copy. Hash-addressed conversion receipts resume an interrupted batch without encoding completed clips again.

Offline upgrade preserves a verified old cached recording until the new copy is available, then removes the superseded audio only after the replacement is verified and safely stored. This avoids discarding a family's working offline voices or permanently keeping both large and compact copies. No saves/progress/family content is modified.

32kbps is lossy: it matches existing delivery settings but is not bit-identical to the160kbps master. Automated format/duration/decode checks do not prove perceptual equality. Listening comparisons on phone speakers/headphones remain required before deployment review.

Provider routing/queues and the forward coverage gate are documented in ../voices/PROVIDERS.md. Current work does not assign a new version, deploy, or generate paid recordings.

Completed conversion:6,663 units,88,597,680 bytes (84.49MiB), down from435,948,496 bytes (415.75MiB):79.68% smaller. Every newly encoded clip passed32kbps/16kHz/mono format, duration and full-decode checks. Original master bytes/SHA match their unchanged receipts; the previous production pack is preserved in temp/hanoi-originals-VFBnNA. Ten focused routing/encoder/optional-cache cases pass; targeted validation passes7/7: provider routes, mixed speech, real optional voice/download/offline flow, female/male background flow, full default coverage,336 units and202 explicit/54 server/tool types. Human listening remains unverified; no deployment/version chosen.
