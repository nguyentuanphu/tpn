# Additive field and control contract

| Field | Producer → transport → consumer | Type/default/state | Permission/privacy |
|---|---|---|---|
| coverage.discovery | Source exporter → content/management-catalogue.json → private activities/detail and Studio | catalogued or declared-only. Legacy rows default catalogued; no playability guarantee | Existing management.read; source facts only |
| summary.declaredOnly | Server summary of coverage.discovery → activities?summary=1 → Home | Nonnegative integer; returned once per summary; counts declared-only records, not available games | Same management grant; no profile/device/finance data |
| Declared entry name | Registration literal in drawing2.ts/crafts.ts, or stable ID from secondset.ts → management catalogue |25bilingual source names; one ID fallback explicitly not bilingual evidence | No invented translated title; no private authored data |
| Declared metadata/implementation | Source exporter and parser → coverage evidence | Always false for declared-only, even contradictory hand-edited true flags | Cannot upgrade availability via a metadata edit |
| Runtime integration gate | Catalogue entry → explainAvailability helper | Closed for declared-only, independent of release/unlock/admin state | Expected state only; not a device receipt or real launch test |
| Accepted activity ID set | Parsed catalogue → management runtime service → public event validator | Declared-only excluded until actual integration; unknown_catalogue_id rejects such events | Does not expand game collection or trust arbitrary producers |

No persistent schema migration, retention-category change or new collected user field occurs. Static metadata lifetime follows source/release artifacts. Existing response headers remain private/no-store for Studio reads. Source hashes and commit provenance are refreshed after code commits; dirty work is not labelled an immutable clean source.

## Effective retained-feature control

1. Keep wayfind's existing special policy.
2. Resolve live release rule before fallback content release rule.
3. Effective rule on:false means Off, regardless of saved usage or preview retention.
4. With no release rule, an explicit CUSTOM.features false means Off.
5. Otherwise preserve existing featureOn or saved-use retention, including intended scheduling behaviour.
6. Never remove saved tried/wins/ownership/progress to hide a feature.

Direct releaseOn/featureOn consumers and independent tester exceptions still need their own effect review; a control-effect claim must identify its actual consumer and apply timing. Existing configuration publication/receipt contracts are unchanged. Studio's availability explanation is kept in step for retained reading/money gates, but a server expectation is not proof of an offline client's applied state.
