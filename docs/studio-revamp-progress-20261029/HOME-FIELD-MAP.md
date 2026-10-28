# Home field and action map

| Display/action | Existing producer/read path | Meaning and limits |
|---|---|---|
| Reporting active installations | /api/hello → retained device-day records → management/overview M01 | Selected reporting subset; not unique children; original device-local dates |
| Reported play minutes | Same → M04 | Active-play hooks, not all screen time |
| Reported errors | Same → overview.totals.errors | Observed game-code counts, not confirmed crashes |
| Catalogue review count | Source extractor → static catalogue → management/activities?summary=1 | Server counts each entry once if bilingual/metadata/implementation-reference/guide-source-alignment not confirmed; unknown counts as needs review. Summary omits entries and is tested below600JSON bytes |
| Change receipt coverage | Detailed SQL summary via overview M24 | Latest eligible change selected by existing API's period semantics, exact revision/hash in fixed cohort; not every consumer effect |
| Website Play clicks | Website allowlisted events → parent-analytics aggregates → overview M14 | UTC-day clicks; no inferred install/child conversion |
| Priorities | Existing unpublished source flag; overview.attention.open; catalogue review count | Up to three; only permitted review destinations; not inferred urgency or due dates |
| Audience trend | overview.dailySeries | Distinct installs each original device date; missing days break lines; do not sum daily distincts into monthly unique audience |
| Recent reports | management/attention?limit=8 | Bounded returned page; source permissions/caveats apply; no claim of complete queue from this page |
| Catalogue/control section | Returned games/stories and explicit static caveat | Does not expose a false all-domain completeness percentage |
| Source read times | Existing generatedAt response | Server read time, explicitly not underlying-source freshness; no reliable legacy watermark |
| Money link | Existing permitted money route | Separate month/basis and finance grant; no finance prefetch or merged reporting period |

Home uses management.read and existing canPage/permission checks. It does not call children/device detail on load. Every destination preserves existing routing/filter behaviour. Missing or denied sources stay unavailable/outside access; source errors do not produce a healthy catalogue count of zero. All displayed labels are EN/VI.

Zero reporting counts with no retained source days display Unavailable. Observed retained buckets can support a real zero; the absence of all buckets cannot. Read success remains separate from a freshness assertion.

This phase uses six figures and one principal graph. The master permits a second useful graph when source/decision coverage warrants it; no decorative graph is added to fill a slot. Shared CSS/art/font retain game identity without importing its fixed-canvas layout.
