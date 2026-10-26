# Operating handbook and recovery procedures

These are proposed procedures for the future management features. Existing Studio/Netlify/GitHub operations retain their current permissions and release rules. Every procedure records exact build, environment, timestamps and evidence; dates shown to the owner use Australia/Sydney with AEDT/AEST. Do not put secrets or private family data in reports.

## Morning review: five minutes

1. Confirm data freshness and ordinary-traffic scope before interpreting any number.
2. Review critical Attention signals: save/restore failures, update failures, unavailable required services and recurring reproduced issues.
3. Compare experience by build and device class with adequate samples. Inspect stale/unsupported measurements separately.
4. Check current release/source alignment, pending publishing and devices without confirmation.
5. Check actual costs/import completeness, budget commitments, provider quotas and jobs that failed or have not reported.
6. Assign an owner and next action to each actionable issue. Do not change a feature switch merely because a chart looks unusual.

## Weekly review

Review new/returning reporting installations, eligible matured retention cohorts once implemented, activity participation/attempt definitions, parent guide usage, missing recordings, unresolved/reopened problems, delivery coverage, spending/forecast assumptions and recovery-test age. Write decisions and their reasons in Studio. A weekly report initially remains inside Studio; no automatic email/chat sending is included.

## A. A chart looks wrong

1. Record metric/formula version, exact filters, sample count, source watermark, source day basis and originating build.
2. Check missing data, opt-outs, late reports, new traffic classification, device reset and pagination caps.
3. Compare one synthetic fixture with underlying source and named adapter. Check for duplicate legacy/new counting.
4. Suppress only the misleading derived card if needed; keep source data and visible incident note. Do not rewrite real source records to force an expected trend.
5. Rebuild affected rollups from the committed source watermark after correcting the adapter. Record correction scope and date; re-open any business conclusion affected.

## B. A Studio change is saved but not applied

1. Find change ID, scope, revision and actor permission. Is it saved, pending projection or available?
2. If projection failed, inspect redacted error and the latest queued revision. Retry the latest state through the serial projector; never replay an older snapshot over newer state.
3. If available, inspect eligible devices and receipts. Offline/no receipt is unconfirmed, not failure or success.
4. Compare reported hash and revision, client compatibility and winning feature rule. A setting can be received while an activity remains locked by a separate rule.
5. A rollback is a new compatible revision with reason and reviewed scope. Never reset revision numbers or delete user saves.

## C. Game reports are not arriving

1. Verify service response and rate-limit status using a synthetic/staging report; do not fabricate a production child report.
2. Check Analytics setting and environment restrictions. Local Studio/test contexts intentionally differ from deployed game reporting.
3. Inspect only bounded queue counts/age and redacted errors from an authorised diagnostic path. Do not dump localStorage, tokens, photos or saves.
4. Confirm server validation, schema compatibility and database/provider health. A beacon send is not a storage receipt.
5. Recover by fixing the prerequisite and retrying stable IDs. Do not clear the queue to make “pending” disappear. Expired/dropped telemetry remains a visible quality limitation.

## D. A provider or job fails

1. Separate denied credentials, network error, stale observation, dispatch acceptance, running job and terminal failure.
2. Use exact run IDs/source commits, bounded retries and provider rate limits. A retry gets linked to the original operation; one manual action cannot accidentally create many jobs.
3. Check configured job limits before dispatch. Keep original bot schedules and UTC clock semantics unless a reviewed migration changes them.
4. If access is missing, list the precise required provider scope and secure configuration destination. Existing Git read access is not evidence of billing/API authorisation.
5. Keep related costs/health unavailable until confirmed; continue unrelated local work.

## E. Spending rises unexpectedly

1. Confirm billing period, currency, tax basis and invoice/import completeness.
2. Split actual increase into usage growth, changed provider rate, repeated jobs, larger delivery assets, voice generation and one-time charges where evidence supports the split.
3. Compare cost per reported hour only for comparable reporting coverage. Check Analytics changes before blaming efficiency.
4. Review commitments and forecast assumptions; avoid charging a fixed monthly commitment twice.
5. Propose a bounded change with its expected benefit, rollback and affected experience. Payments or new paid services require their own authorisation; the dashboard does not buy automatically.

## F. Backup/restore drill

Use staging and synthetic records first. Verify database snapshot encryption/access, then restore to an isolated approved destination. Compare row counts, selected content hashes, configuration revisions, invoice uniqueness and queue watermarks. Check older clients can still read compatible public projections. Record actual recovery point/time and differences. Proposed initial targets are recovery point <=24 hours and recovery time <=4 hours, subject to provider/owner acceptance; targets are not achieved evidence.

Private family photos, local progress copies, Git source, live configuration and the proposed management database have different backups. A successful database restore does not restore an unsaved device or a separate photo collection. A cloud environment snapshot is not a substitute for production application backup. Never run a destructive recovery drill against real family data.

## G. Retention and deletion

Check each store's approved policy and last cleanup result. New retention jobs report source scope, cutoff, deleted count, retained aggregate behavior, backup expiration and errors. A failed cleanup remains actionable even if the dashboard is healthy. Deleting or anonymising an identity must consider events, aggregates, support evidence, photo membership, logs and backup lifecycle; do not call pseudonymous IDs anonymous by default. Existing photo revocation and save restore must retain their separate semantics.

## H. Release and rollback

Record candidate source, website review lock, game/Studio/service-worker versions, schema migrations and old-client support. Complete meaningful tests and review EN/VI phone/tablet/computer evidence. Keep failed/skipped/retried and real-device/provider gaps explicit. Prepare the Netlify package and exact deployment/rollback steps; obtain the owner's round-specific approval before main/Netlify changes.

After an approved deployment, verify response versions/assets, representative functional behavior and reporting receipt. Watch comparable cohorts and configuration application status. If rolling back, check save/schema compatibility and live rules first; do not restore an old binary that cannot read retained data. Follow the same explicit approval boundary for application publication changes.
