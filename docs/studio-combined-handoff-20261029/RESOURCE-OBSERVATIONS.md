# Resource observations and operating recommendation

The actual report is evidence/reporting-budget.json. Four alternating cold browser contexts used the same synthetic phone viewport, parent Analytics permission, reporting release and short start-of-play workload. Collect was Off, On, On, Off; Process and Show were Off. No production policy was changed.

| Observation | Both Collect Off samples | Both Collect On samples |
|---|---:|---:|
| Optional management client requests |0|1|
| Optional management API requests |0|2|
| Optional request JSON body bytes |0|875|
| Observed encoded resource body bytes |4,178,080|4,196,232|

This fixture observed18,152additional encoded resource bytes with collection enabled. Those are local uncompressed browser observations, not a complete network charge, server/SQL measurement, forecast, production bill or long-session limit. HTTP/TLS overhead is not counted in request-body bytes. Endpoints were synthetic; software-rendered animation callbacks and non-standard heap measurements are descriptive only. Battery, actual devices and real Netlify execution remain unmeasured.

Recommended operation: leave optional reporting gated by parent choice and the existing release control. Use a short, reviewed temporary collection policy when a specific question requires it. Check incoming events and resource/provider evidence, then let expiry stop collection/processing. Keep Show independent and permission-gated. Never treat Show Off as a bandwidth reduction or Collect Off as deletion of accepted server data.

This is one family. Legacy usage and website analytics remain separate, and attribution/experiments/provider sync have no implemented switches here. Other optional functions need an audited producer → processor → consumer contract and comparable workload measurements before activation. Offline or older clients can incur incoming retry overhead even when the server rejects their events; no zero-impact promise is made.
