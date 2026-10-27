# Marketing decisions and game protection

Marketing sits inside Game & website, with relevant findings on Home. Proposed views: Overview; Acquisition; Activation; Retention; Content & promotions; Experiments. The current aggregate website counts do not implement this complete workspace.

| Decision | Required evidence | Missing contract |
|---|---|---|
| Which campaign deserves investment? | Recorded spend, campaign visits, attributable outcomes | Campaign registry/spend links; supported attribution |
| Is a landing page effective? | Eligible page views, calls to action and version | Comparable exposure/denominator, no fake unique visitor |
| Does a new installation reach play? | First launch → onboarding → first activity → completion | Explicit attempt/install semantics and eligible event schema |
| Which content brings return play? | Returning installations grouped by eligible first observation/source/activity | Cohort maturity, return-window and retention definitions |
| Does promotion work? | Exposure → click → start → qualified engagement | Placement/version/exposure contract |
| Is an experiment persuasive? | Hypothesis, assignment, sample size, result and recorded decision | Safe assignment and analysis policy; no automatic causal claim |

Track unknown/unattributed outcomes. A download click is not an install; installs are not unique people. Do not connect child names to marketing identifiers or ad audiences. Financial acquisition costs need compatible period/currency/attribution coverage; no complete profit/lifetime-value claim from partial data.

## Function switches

The detailed specification is included as [FUNCTION-SWITCHES.md](FUNCTION-SWITCHES.md). Proposed Settings → Functions & resource use has independent Collect, Process and Show controls. Presets Essential/Standard/Detailed temporarily/Custom require explicit membership and budgets before implementation. Detailed diagnostics expire automatically.

Hiding a graph does not stop uploads or jobs. Stopping processing does not erase stored data. Optional collection off must stop its producers/timers/retries and clear only its own expendable queued analytics according to explicit policy. Parent Analytics off overrides Studio enabling. Preserve gameplay, saves, durable user-filed reports, security and authorised audit requirements.

Offline clients cannot receive an immediate remote shutoff. Show desired/published/received states separately; reject disabled optional ingestion server-side as designed, acknowledging request overhead can still occur. A persisted configuration receipt is not proof all collectors stopped. Define safe expiry/unsupported-build behaviour. Do not add frequent polling just for switches.

## Resource architecture

Game/website → compact eligible batches → validation → raw records with bounded retention → daily summaries/cache → Studio graphs. Separate authorised control publication from reporting ingestion. Studio visits should read summaries instead of making the game upload more.

Before enabling new collection, establish and measure bytes/session, requests/session, batch limits, queue bytes/age, retry/backoff, sample rate, raw/aggregate retention, function calls, database growth and query latency. Set account-specific alerts from verified Netlify limits; no paid provisioning is implied. Actual charges include provider plan, storage/indexes/backups/compute and cannot be predicted from raw payload size alone.

Example only: 10,000 reporting installs × 20 events/day = 200,000 events/day. At 300 payload bytes/event, 60 MB/day before overhead/storage/indexes. Ten-event batches could reduce request count around tenfold where sessions permit; it is not a traffic forecast or billing quote.

Release evidence compares equivalent off/on workloads for startup, responsiveness, memory and network, including a lower-end physical phone where available. Reporting failure must preserve play. No zero-impact guarantee, no per-frame network tracking, no silent unlimited queue or retry storm. Existing unrelated rendering/startup debt stays visible.
