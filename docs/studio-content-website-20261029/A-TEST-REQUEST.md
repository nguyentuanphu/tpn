# A-owned fixture updates required at integration

29 October 2026 AEDT. B has left tests/unit/studio-off-policy.test.mjs unchanged because it is A's shared policy test. Two baseline assertions necessarily become stale when intended content is integrated:

1. Line 37 assumes 26 declared-only items and 25 bilingual names. The actual remaining declared-only IDs are exactly `hiddenpic`, `paperfold`, `rongran`, `spotdiff`; three have bilingual names. Keep the existing fail-closed availability, contradictory-metadata and private-field assertions. Replace the frozen counts with an exact sorted-ID assertion and the bilingual count of three. Do not remove the protection or accept an empty pending list.
2. Line 47 uses `aodai` as an unknown/unintegrated event ID. It is now intentionally integrated and must be accepted. Use `paperfold` (or iterate all four remaining pending IDs) for the same unknown_catalogue_id rejection assertion, and add acceptance coverage for the integrated items.

B's new tests/unit/content-art.test.mjs independently exercises all twenty-two integrated event IDs and all four rejections against MemoryManagementTestDatabase. It does not call production, change an API/schema, weaken the shared test or exempt runtime events. The full local unit check remains red until A reconciles these two fixtures; do not describe it as all passed.

A separate catalogue test originally failed because its AST counted three guarded register calls in drawing2 as real registrations. B fixed the content layout instead of changing that test: the three unfinished definitions are retained in games/art-pending.ts as an unregistered exported proposal array. The real drawing2 loader now contains exactly its ten intended registrations, and the management exporter reads the pending source without marking it implemented.
