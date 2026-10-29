# Schema and resource changes in this slice

No new collected field, gameplay event, persistent table, migration or privacy eligibility is added. No production database is accessed.

Existing authenticated GET `/studio/api/management/activities` gains optional query `summary=1`. Existing full response remains compatible. New response returns `schemaVersion:1`, `generatedAt`, `summary:{total,games,stories,review}`, and quality labels for static source evidence and absence of playability/control audit. Each summary count is a nonnegative integer derived from the complete already-loaded catalogue. The `activities` list is omitted in summary mode.

`review` counts a row once if any required bilingual/metadata/implementation-reference/source-alignment boolean is not explicitly true. Null/absent evidence remains a review requirement. This count does not include declared IDs absent from the existing catalogue and does not establish all-domain completeness. The separate static inventory records26such IDs explicitly.

Permission remains `management.read`, enforced by the existing server route gate. No child/profile, provider, actor/audit or finance details enter this summary. Existing private/no-store response headers remain. The browser test and HTTP unit assert missing-source behaviour and bounded response, respectively.

Home makes one extra small static-source request per render. It does not add background polling or increase game/website uploads. Aggregate calculation scans the existing in-memory catalogue; no raw reporting scan is added by this request. Actual billing and low-end physical-device performance remain separate evidence requirements.

Measured source-only JSON bodies at this source:197bytes for summary versus210,534bytes for the full catalogue. This excludes HTTP overhead/compression and does not predict a Netlify invoice. Exact evidence is in evidence/catalogue-response-size.json.
