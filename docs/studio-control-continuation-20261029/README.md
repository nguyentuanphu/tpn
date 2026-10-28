# Studio control and pending-content continuation

29 October 2026 AEDT. Continues the [Home/source-audit slice](../studio-revamp-progress-20261029/README.md) on review/studio-finance-20261027, with one agent. No main merge, deployment, version change, payment, paid provisioning or private-save mutation.

## Implemented

1. **Explicit Off beats remembered usage.** The game's shared keptOn policy now checks the effective release rule and fallback feature setting before retaining used access. Saved tried/wins/progress remains intact. Future scheduling can still retain used access, and On restores access. Wayfind retains its separate explicit-version policy.
2. **Studio can inspect intended content that is not integrated.** The management catalogue includes26declared-only game entries in addition to207listed games and92stories.25names come from real bilingual registration declarations; rongran displays its stable ID with bilingual/implementation evidence unconfirmed. No player menu, lazy-loader registration or game unlock is added by these management rows.
3. **Pending entries stay unavailable.** Their metadata/implementation flags remain false, the expectation helper closes runtime integration even with admin/unlock-all settings, Studio shows a plain-language integration notice, and the runtime ingestion allowlist excludes them.
4. **Home separates intended and listed content.** The compact summary includes declaredOnly; catalogue review remains a source-evidence count, not an all-games-ready score.

## Exact limits

- Off is enforced when the relevant consumer rechecks its effective policy. This is not an instant remote termination of an already open activity; offline devices remain unconfirmed until they receive settings. The change does not delete saves, history, ownership or rewards.
- Existing global publication, tester early-schedule machinery and consumer-specific tester exceptions remain separate mechanisms. No dedicated device/cohort revision publication is added. Further consumer-by-consumer effect audits are still required.
- The parent Analytics choice, optional reporting collection and all existing save authority are preserved. The proposed Collect/Process/Show panel remains pending; this phase does not implement it.
- These management records are public source facts exposed under existing Studio permission gates. No new gameplay event, tracking field, database schema, SQL migration or provider binding is introduced.
- Website/playable-game counts must not be increased from233management game records. The actual player catalogue remains207games including its separately registered reading metadata;26management records are explicitly not integrated. Public website/art/release review remains a separate release gate.

## Validation and handoff

See VALIDATION.md for exact local checks and comprehensive-run status, FIELD-CONTRACTS.md for additive API metadata, and VISUALS.md for actual synthetic-data phone/tablet/desktop captures. The original master's complete architecture, marketing, finance, privacy/resource controls and B00–B13 plan remain in docs/studio-revamp-master-20261027.

Next priorities: verify/integrate each intended game's actual discovery/loader/playability; expand control-effect coverage beyond the tested switches; implement contextual private draft/review editors; implement optional-function policy/controls; complete marketing/cohort/remaining graphs, services/finance connections and live Netlify lifecycle/recovery/device evidence. Do not erase pending items or infer zero-impact guarantees to make readiness appear complete.
