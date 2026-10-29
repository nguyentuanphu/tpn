# Studio functions and resource controls

29 October 2026 AEDT. Workstream A on review/studio-finance-20261027. This extends the item workspaces and the existing private draft/review/publication mechanism. No deployment, main merge, new version, paid provisioning, production migration or private-save change.

The first connected family is **Detailed Studio reporting**. Settings now offers separate **Collect / Process / Show** controls, a private proposal, before/proposed comparison, saved-proposal resume, review and publication. Home shows a compact policy summary after one has been published. English/Vietnamese, game fonts/tokens and existing Studio controls are retained.

- **Collect Off:** compatible clients stop optional producers, detach listeners, abort optional uploads and clear only their unsent management queue. The server rejects new optional event batches with410. Previously accepted rows remain.
- **Process Off:** new on-demand event-report calculations are refused. This is not a switch for an invented background worker; no aggregation worker exists in this slice.
- **Show Off:** detailed optional event responses are omitted from Studio views. It does not stop uploads or hide existing legacy usage summaries.
- **Expiry:** enabled collection/processing policies last at most24hours. At expiry both stop; Show retains its separate value. The policy does not automatically re-enable the old mode.

Collection still requires the existing Detailed Studio reporting release switch, an eligible game context and the parent's Analytics permission. Installing this panel does not turn reporting on. Invalid/unsupported explicit policy fails closed. Absence of a new policy preserves previous behaviour. A malformed policy in the local cache must not silently become absence/legacy behaviour.

[Exact fields, permissions and connections](CONTRACT.md) · [Capability registry](FUNCTION-REGISTRY.json) · [Validation](VALIDATION.md) · [Actual screenshots](VISUALS.md) · [Continue next](NEXT-CHAT.md).

## Boundaries and pending work

This controls one real function family. Legacy usage reporting, website analytics, marketing attribution, experiments and provider sync do not gain fictional switches. Gameplay, saves, earned progress, family data and manually filed problem reports are protected from these controls. Other families need their own producer/processor/consumer audit and implementation.

Receipts currently share the client consent/collection gate. A device that stops collection may therefore never acknowledge its Off revision; Studio must retain unconfirmed status. Server receipt validation remains independent of event collection. Receipts prove reported persistence, not that every producer stopped. Offline and older clients cannot be controlled instantly; accepted/in-flight requests cannot be recalled. A410 stops retries on the new client; older clients may continue bounded retries and still incur incoming request/rate-limit overhead.

Stored server data has no new automatic retention/deletion job here. Queue bounds are existing client ceilings, not billing estimates or a zero-impact guarantee. Parent opt-out remains a client-side eligibility choice, not a server-verifiable identity/consent certificate. Reports remain untrusted evidence.

Workstream B still owns pending game integrations, content inventory and website alignment. See [the two-chat plan](../studio-item-workspaces-20261029/TWO-CHAT-PLAN.md). A owns this policy, Studio/API/shared runtime gates, business views and final integration. The earlier master concept is frozen; this folder records actual new implementation rather than changing its packaged ZIP.
