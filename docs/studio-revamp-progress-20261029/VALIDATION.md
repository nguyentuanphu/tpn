# Validation — Home continuation

Runtime17cb0c5c87ac7095cbebee2bb9a3010daed001db. No production deployment.

## Local evidence so far

- Initial runner attempt stopped because the local game server was not running; it did not exercise application checks. Started the standard local server before retrying.
- First exercised batch:2/3. The added unavailable-source assertion assumed English while its isolated browser used the default Vietnamese. Kept the assertion and set that fixture's language explicitly. Initial evidence retained in evidence/initial-focused.json/txt.
- Corrected batch:3/3 (ownerdesk, unit, types),405unit cases. Evidence in evidence/home-focused-before-summary.json.
- Expanded batch after bounded server-summary response:6/6 (ownerdesk, unit, types, rules, arch, emoji),406unit cases. Browser checks include6EN/VI/device combinations, private-detail/finance permission boundaries, unavailable catalogue, empty-day zero handling and preserved navigation/filter context. Evidence in evidence/focused-six-before-order.json.
- Final visual ordering puts the quiet snapshot before the potentially lengthy priorities. Final shared batch **6/6 passed**: studio, ownerstudiofailures, managementstudio, ownerdesk, ownerstudiofolds and ownerstudioperms. The fold check covered90page/device combinations,1004sections and784successful close/reopen operations, with no thin/loose/stuck/persistence/browser errors. Custom grants passed on phone and desktop with21visible permissions. Final source hashes match all captured sources. Screenshots are synthetic data and browser emulation, not physical devices; current phone/tablet/desktop views were inspected. Evidence: evidence/final-studio-six.json/txt. Nineteen overwritten historical captures were preserved under evidence/generated-captures before restoring their original tracked bytes. Local timings were preserved separately rather than committed as the official GitHub map.

## Comprehensive verification

New exact-runtime all=true GitHub run40784169211: https://github.com/nguyentuanphu/tpn/actions/runs/40784169211. Started after source commit/push. At dispatch it is in progress; no full pass is inferred. Actual result artifacts/collector must be inspected and preserved before claiming a completed pass.

The previous253/253 success on35bcb63c is baseline evidence only. No live Netlify binding, physical-device/Windows, retention/restore or all-game/all-control completeness is established by these checks.

Unit total406passes retains the pre-existing intentional legacy exclusion; it is not a new skip introduced by this slice. Root/source inventory generation and git diff whitespace checks pass. Catalogue summary body measured197bytes versus210,534bytes for full entries; HTTP headers/compression/provider billing are outside that measurement.
