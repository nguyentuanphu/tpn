# Lê Minh production integration · 26 October 2026 AEDT

Optional parent-selected public Vietnamese narration; the female default and family-recording priority are preserved. 6,344 verified canonical units, 424,275,298 bytes (~405 MiB). New private speech never goes to FPT. Three public prototype instructions and 19 privacy-held units remain excluded and retain the existing fallback policy.

The service has a separate provider/model/voice manifest and cache, verifies size/SHA-256 before saving, survives Settings close, resumes cached work and supports revoked mobile permission. A full device is reported as unable to save; it cannot produce a false ready status. Closing the browser may pause work; reopening resumes it. The optional size is shown before downloading. Default Woman/Man previews remain separate from the Lê Minh preview.

Local browser evidence: 18 actual files, female default avoids fetching the optional pack, preview preserves choice, download continues after Settings close, mobile permission pauses/resumes, and a female character uses Lê Minh offline. Four focused service units pass. Existing default male/female/background regression passes (110s). Final browser/layout/types follow-up passes 2/2 (130s,23s), 152 explicit files/49 server and Studio files. First newly included test-file type error corrected; no product assertion weakened.

The six committed EN/VI phone/tablet/computer images were visually inspected. The test downloads a small set of actual recordings; the displayed size/count comes from the generated production metadata. Full latest-source GitHub checks and physical listening remain required.

Rebuild with `node tools/build-hanoi-pack.mts <verified baseline staging> temp/fpt-recordings`, then `node tools/build.mts`. The packaging tool verifies recorded text identity/checksums and fails for a new current voice unit without a recording or explicit privacy/review hold. It makes no paid request. A content release requires updating the reviewed voice inventories and recording the approved delta.
