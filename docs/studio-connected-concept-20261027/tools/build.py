"""Build a concept handbook from explicit mappings; never contacts an application API."""
from pathlib import Path
import csv, hashlib, html, json, re, subprocess

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
BASE = REPO / 'docs/studio-management-foundation'
SOURCE = 'a1f82e740e95bcd491f075980b8b891be79419e7'
URL = f'https://github.com/nguyentuanphu/tpn/blob/{SOURCE}/'

# The fields below describe code observed at SOURCE, not a live deployment.
CONNECTIONS = [
 ('L01','Game usage → People and usage graphs','js/players.ts','POST /api/hello','Private players / bot-players Blobs','People; Game & website','installation id + local profile key + device day; originating build kept separate','analytics for legacy; management.read for summaries; management.deviceDetail for names','Existing counters are reporting samples, not a complete audience or exact attempts.'),
 ('L02','Detailed game events → outcome graphs','js/management-telemetry.ts','POST /api/management/events','PostgreSQL management_events; conflicts quarantined','People; Game & website; Work','deviceId + eventId dedup; deviceId + attemptId lifecycle','Consented collection; management.read; management.deviceDetail for profile context','Code exists; SQL binding, real-family retention and production activation remain unverified.'),
 ('L03','Website observations → acquisition graphs','home/analytics.ts','POST /api/parent-analytics','Private parent-analytics aggregate Blobs','Game & website → Website performance','aggregate dimensions only: day/route/language/device; no person join','Existing website opt-out; analytics / management.read','Page views and Play clicks cannot be joined to a particular child or confirmed boot.'),
 ('L04','Shared source → game, website and Studio catalogue','tools/export-management-catalogue.mts','Versioned content/management-catalogue.json; website build/review pipeline','Git/source snapshots; generated public content','Game & website → selected item','kind + id; sourceCommit + sourceHash; guide review source','Public catalogue reads; existing edit/site/release grants for actual writes','Code/source integration exists; current website alignment must not be assumed.'),
 ('L05','Studio configuration → game availability/content','netlify/lib/management/transactional/service.mts','POST /studio/api/management/config → conditional projection → GET /api/live','SQL configs/config_versions/changes/projection_jobs/audit; public management-live Blob','Game & website → item control; Work → changes','global scopeKey + revision + effectiveHash','management.configure AND existing rules/content edit grant','Current HTTP publication supports global scope only. Friendly contextual editors are proposed.'),
 ('L06','Device acknowledgement → delivery evidence','js/management-telemetry.ts','POST /api/management/config-receipts → private change coverage','SQL receipts joined to changes/config_versions','Work → change delivery; People → device','deviceId + scopeKey + revision + effectiveHash','Device-reported observation; management.read plus deviceDetail for private drilldown','Applied means client reports persistence, not every open screen immediately redrawn.'),
 ('L07','Game problem report → Studio evidence','js/report.ts','POST /api/tester and private Studio tester routes','Private testers records and screenshot storage','Work → problem; People → linked device','clientId receipt; device/build/context; problem key','Tester entitlement; testers permission for private text/images','Reports may contain sensitive context; masking/access and retention require review.'),
 ('L08','Studio follow-up → work history','netlify/lib/management/transactional/service.mts','POST /studio/api/management/attention/:id','SQL attention + audit','Work → task inspector','issue id + expectedRevision; deployment and verification references','management.triage','Follow-up lifecycle does not automatically modify the original tester status.'),
 ('L09','Providers → operations and release graphs','netlify/lib/management/operations-control.mts','GET operations; POST operations/refresh or operations/run under Studio API','Provider observations; SQL operations + audit','Work → service/run/release','operationId; matched provider run/deploy identifier','operations.read/run; additional bot/config grants as applicable','Only bounded maintenance dispatches exist; network acceptance is not successful execution.'),
 ('L10','Operator documents → Money graphs','netlify/lib/management/finance.mts','/studio/api/management/finance/{preview,commit,budget,settings}; GET snapshot/export/history','SQL finance_lines/versions/settings/budgets/batches + audit','Money','provider + accountAlias + sourceDocumentId + sourceLineId; revision; operationId','finance.read / finance.write','Manual ledger, no provider-billing synchronisation, bank payments or full accounting claim.'),
 ('L11','Local save/private family services → authorised family view','js/state.ts','Existing local save/copy and separately authorised family/photo services','Local authoritative saves; separate private family/photo stores','People → explicitly authorised family tools','local profile id + installation; explicit private family membership','Separate family/photo permissions; analytics code is not photo authentication','No automatic remote save authority, cross-device merge or public exposure.'),
 ('L12','Studio accounts → every private action','netlify/lib/admins.mts','Authenticated Studio routes; explicit grants checked server-side','Private admin/session/key/access-log stores','Settings → access; audit in relevant item','account id and grants; selected actor for audit','Server role/custom-grant enforcement','Opening a workspace or hiding a button never grants or enforces authority by itself.'),
 ('L13','Optional website Play handoff → reportable game boot','home/analytics.ts','PROPOSED: short-lived random handoff and bounded acknowledgement contract','PROPOSED: short-retention handoff aggregate; no current table/endpoint','Game & website → acquisition','PROPOSED: random single handoff, never child name, family code or fingerprint','New collection/access/retention decision required; analytics opt-outs honoured','Not implemented. Do not draw a current matched conversion funnel.'),
]
connections = [dict(zip(['id','label','producer','transport','storage','destination','join','permission','limitation'],r),
                    status='proposed' if r[0]=='L13' else 'current_code_not_live_verified') for r in CONNECTIONS]

GRAPH_ROWS = [
 ('G01','Reporting audience over time','Today / People','line','M01 M02','L01','DAY-01 DAY-03 DAY-04 DAY-05 ID-01','Distinct reporting active installations per day; new means first retained observation. Never sum daily distincts into monthly distincts.','Return to days and permitted device records.','Cleared storage, opt-out and missing days bias audience; no global unique-child count.'),
 ('G02','Reported profiles and device mix','People','bars','M01 M03','L01','ID-07 ID-08 ID-10 ID-11 KID-01 KID-02','Count reporting installation/profile pairs and distinct installations separately; group device/OS/browser and age band. Approximate online presence uses the current 5-minute freshness window, not permanent live status.','Open selected device group then an authorised device.','Profiles are not globally deduplicated children. Name reporting can be off.'),
 ('G03','New and returning reporting installations','People','stacked bars','M02 M18','L01 L02','ID-01 DAY-01 EVENT-02 EVENT-03','New: first retained active day in window. Returning: active earlier in retained history. Exact-day D7 uses only matured cohorts and is a separate proposed metric.','Open cohort definition and permissible records.','Retention job, rollups and mature cohort reporting remain work; not all historical first-ever dates are known.'),
 ('G04','Reported play pattern','People / selected device','hour-by-day heatmap','M04','L01','DAY-01 DAY-03 DAY-07 KID-03 KID-04','Sum reported minutes per device-local hour/day; label timezone basis. Profile participation minutes may overlap in shared play.','Open selected day and activity summary.','Reported active play is not total screen time; no precise minute-by-minute timeline from daily buckets.'),
 ('G05','Website engagement','Game & website / Website','line + bars','M13 M14 M15','L03','WEB-01 WEB-02 WEB-03 WEB-04 WEB-05 WEB-06 WEB-07 WEB-08','Page views, Play clicks and reported active seconds shown as separate event series. Clicks/views is an event ratio, not person conversion.','Open route/language/device aggregate.','Best-effort dropped requests and opt-out; no unique visitor or session linkage.'),
 ('G06','Website-to-play connection','Game & website / Website','separate stages; future matched funnel','M13 M14 M20','L03 L02 L13','WEB-01 WEB-06 EVENT-06','Current website views/clicks and game boot observations are separate panels. Matched funnel only after L13 exists, with eligible handoff denominator and pending/expired outcomes.','Inspect stage definition and current gap.','No numerical conversion arrow between unmatched populations; no cross-device attribution.'),
 ('G07','Activity popularity','Game & website','ranked bars','M04 M07','L01 L04','DAY-04 DAY-05 KID-05 CONTENT-01 CONTENT-03','Game starts per kind:id where available; story opens historically aggregate, named story attempts only from detailed events.','Open one game/story editor with evidence.','A popular activity is not proof of learning benefit or quality.'),
 ('G08','Activity outcomes','Game & website / selected activity','stacked outcomes','M05 M06 M19','L01 L02 L04','KID-06 KID-07 KID-08 EVENT-05','Detailed attempts: completed/abandoned/pending/unknown/inconsistent within same start cohort. Legacy participation ratios kept separately.','Open outcome definition and anonymous attempt evidence; names need detail permission.','Do not mix attempt and profile-participation denominators; no causal difficulty claim.'),
 ('G09','Built-in story journeys','Game & website / selected story','opened and completed bars','M07','L02 L04','EVENT-07 CONTENT-03','Match built-in opened/completed events by device+attemptId+storyId; pending/unknown separate. Completion follows actual instrumented final-page condition.','Open story and recording/review details.','Earlier aggregate opens cannot be backfilled into per-story completion.'),
 ('G10','Startup experience','Work / experience','median and p95 lines','M10 M20 M21','L01 L02','PERF-04 PERF-05 PERF-06 PERF-07 PERF-08 EVENT-06','Split legacy capped startup samples from reportable boot attempts. For proposed p95 use matched ready-start nearest-rank distribution, show n; no directional status below 20.','Open build/device cohort and startup-stage evidence.','Failures before instrumentation invisible; first picture and first playable are different measures. p95 chart requires validated rollup implementation.'),
 ('G11','Smoothness and reported errors','Work / experience','lines + affected-device bars','M08 M09 M38','L01','PERF-01 PERF-02 PERF-03 DAY-09 DAY-10','Weighted FPS=sum samples/count; low-FPS count/count; error-affected distinct active devices/active devices.','Open selected build/device and problem evidence.','Low FPS <20 at current legacy threshold; stuck detection is not a confirmed defect.'),
 ('G12','Measured battery behaviour','Work / experience','qualified bars','M11 M12','L01','BAT-01 BAT-02 BAT-07 BAT-08 BAT-09 BAT-10','Battery percentage-point loss / measured battery hours; active drawing FPS excludes idle and unmeasured intervals.','Inspect supported samples and measurement definitions.','Many browsers cannot measure battery; not watts, monetary energy cost or all-device battery performance.'),
 ('G13','Reported connection outcomes','Work / experience','stacked bars','M22','L02','EVENT-08','Success / eligible matched connection-attempt starts; pending/unknown remain in denominator; direct/relay split.','Inspect outcome codes without room codes or media.','Current hooks cover guest join; host/reconnect coverage incomplete.'),
 ('G14','Voice playback evidence','Game & website / Voice','stacked source/language bars','M23','L02 L04','EVENT-09 CONTENT-08','Current recorded success rate: confirmed successes / confirmed success-or-failure observations; cancelled/unknown shown separately, not hidden in denominator.','Open affected asset context where safely known.','Browser playback completion is not proof of audibility; no speech content collection. Current wire event is voice.result, not legacy proposal voice.playback/result.'),
 ('G15','Content and website review coverage','Game & website','coverage matrix','M26 M27','L04','CONTENT-01 CONTENT-03 CONTENT-07 CONTENT-08','Rows=kind:id; columns EN/VI metadata, implementation, reviewed guide source and recording audit. Counts use explicit required-item inventory.','Open missing item and reviewer action.','Catalogue recordings currently not-audited. Anchor exists does not mean source alignment; missing review is not complete coverage.'),
 ('G16','Release adoption','Work / releases','stacked version bars','M01','L01 L04','ID-04 DAY-02 CONTENT-06','Observed sender-build distribution across distinct reporting devices; daily-originating build separately labelled.','Open version cohort and review evidence.','Sender build is not all gameplay within a retained bucket; no claim about non-reporting installs.'),
 ('G17','Configuration delivery','Work / change','stacked states + delay distribution','M24 M36','L05 L06','DELIVERY-01 DELIVERY-02 DELIVERY-03 DELIVERY-04 DELIVERY-05','Exact revision/hash applied receipts / fixed eligible reporting cohort saved with change; rejected/unsupported/unconfirmed separate; later/new devices shown outside cohort.','Open revision → eligible devices → available permitted receipt.','Actual current service counts exact revision/hash; do not use historical metric wording that credits arbitrary later revisions. Device clock skew can invalidate delay.'),
 ('G18','Problems and recovery','Work','trend + ageing bars','M16 M17 M25','L07 L08','ISSUE-02 ISSUE-11 OPS-05','New/open/verified work by date, unique reporting devices by issue/build; proposed verified recovery duration=verifiedAt-firstReportAt for qualified cases.','Open original report plus separate follow-up and verification.','Observed report rate is not total defect incidence; confirmed regression and recovery charts need validated classification/time fields.'),
 ('G19','Jobs and service readiness','Work / services','run timeline + status table','M34 M35 M37','L09','OPS-06 OPS-07','Terminal successful eligible provider runs / terminal eligible observed runs; queued/running/unknown separate. Quota forecast only matching real provider window/usage.','Open provider observation, run or durable operation.','Provider credentials/feeds may be absent/stale. Do not invent quotas or convert dispatch accepted into success.'),
 ('G20','Recorded cost trend','Money','stacked monthly columns','M28','L10','MONEY-01 MONEY-02 MONEY-03 MONEY-04 MONEY-06','Eligible nonvoid expense/credit original minor units allocated by service days, converted explicitly; cash view uses paidAt UTC date separately.','Open category → invoice line → immutable history.','Current manual-ledger coverage must be visible; missing FX means unavailable comparable totals, not zero.'),
 ('G21','Budget and commitments','Money','budget bar + commitments','M29','L10','MONEY-03 MONEY-04 MONEY-05','Budget minus recognised actual expense minus remaining separately reserved commitments; link settlements to avoid double counting.','Open budget, commitment and linked actuals.','Estimates are distinct; credits and commitment settlement must pass service constraints.'),
 ('G22','Recorded cash and upcoming obligations','Money','cash trend + due-date list','M28','L10','MONEY-03 MONEY-04','Cash trend from paidAt records only. A true due-date schedule is proposed and requires explicit dueAt/settlement data; existing commitments alone do not prove due dates.','Open payment-status evidence or obligation.','No bank balance, live payment verification or bank-payment action. A missing dueAt cannot become overdue.'),
 ('G23','Qualified operating forecast','Money','actual line + forecast band','M30','L10','MONEY-02 MONEY-03 MONEY-04 MONEY-05','Use fixed commitments plus variable actual-to-date plus remaining days times trailing 7 complete-day variable mean, only when required coverage is asserted.','Open basis, covered dates and assumptions.','Forecast is an estimate, not cash runway. Band must have an explicit method before numeric uncertainty limits are shown.'),
 ('G24','Cost per reporting activity','Money','unit-cost lines','M31 M32','L10 L01','MONEY-03 MONEY-06 MONEY-08 DAY-03 ID-01','Comparable operating cost / reporting active installations; cost / (reported minutes/60). Show period, currency, coverage and actual denominator.','Open invoice numerator and reporting usage denominator subject to permissions.','Not cost per unique child/customer; more complete analytics can change the ratio without a true cost change.'),
 ('G25','Revenue and contribution','Money','qualified waterfall','M33','L10','MONEY-07 MONEY-08','Recognised eligible revenue - refunds - payment fees - explicitly attributed variable costs, using documented allocation; require approved revenue definition.','Open each contributing record and allocation.','Deferred until revenue/attribution policy and sufficient records exist; no assumed monetisation of children.'),
 ('G26','Update and backup observations','Work / experience; People / device','stacked result bars','M20','L02','EVENT-10 PRIVATE-02','Count update.result and backup.result by operation/outcome; initiated/cancelled/failed/succeeded separate. No reuse of boot-readiness formula for this chart.','Inspect safe reason codes and relevant device if authorised.','Browser export completion does not prove durable off-device backup or restore recoverability.'),
]
graphs=[]
for r in GRAPH_ROWS:
 g=dict(zip(['id','title','destination','visual','metric_ids','connections','data_ids','definition','drilldown','limitation'],r))
 for k in ['metric_ids','connections','data_ids']:g[k]=g[k].split()
 # G26 is a new outcome breakdown, not M20. Preserve no false metric association.
 if g['id']=='G26':g['metric_ids']=[]
 g['ui_status']='proposed_graph_ui'
 graphs.append(g)

# Controls: these are UX contracts. Only the named backing paths are current.
CONTROL_ROWS = [
 ('K01','Filter and compare','Today / each graph','Dates, build, device class, ordinary/test traffic; no write','Graph query only','Current reads; consistent cross-graph filter UI proposed','L01 L02 L03 L10','Only filters supported by that source apply; unsupported filters must say so. Changing a filter never changes play.','No audit for a view filter; retain Back state.','Inspect scope/time basis, sample size and coverage.'),
 ('K02','Open person/device detail','People','Selected installation and local profile context','Private detail view','Current device/child reads; combined new layout proposed','L01 L02 L11','management.deviceDetail; separate family/photo grants still required.','Read/access log; no data mutation.','Name unavailable/denied/last reported states; never merge on name.'),
 ('K03','Change feature availability','Game & website / item','Feature and explicit rules; publication scope currently global','Approved config → public snapshot → applicable game clients','Current global revisioned write; friendly item editor proposed','L04 L05 L06','management.configure plus releases/content grant; validate expectedRevision. Proposed device/cohort projection not enabled.','Reason, before/after, actor/revision; revert creates a new reviewed revision.','Saved/available/unconfirmed/applied shown separately; offline clients wait.'),
 ('K04','Edit game/story public content','Game & website / item','Selected field and EN/VI surfaces; show shared vs website-only','Source draft → reviewed game/website build','Connected field editor/preview proposed; versioned source pipeline exists','L04','Existing edit/site/release permissions apply; field schema and supported write path must be inventoried.','Draft revision, diff and affected-surface list; no silent publish.','Preview game and website; source lock must match reviewed release.'),
 ('K05','Review recording','Game & website / item voice','Selected static asset key/language/voice/source revision','Recording review → approved asset build','Contextual review proposed; existing voice tooling remains','L04 L09','voices permission; generation credentials and billable action require appropriate authority.','Asset hash/review evidence; generation does not publish by itself.','Not-audited/missing/failed/approved states; playback success alone is insufficient.'),
 ('K06','Assign and update work','Work / problem','Selected issue; owner, next action, state and evidence','Attention record + audit','Current follow-up write; new inspector proposed','L07 L08','management.triage; expectedRevision; required deployment/verification evidence enforced.','Actor, reason, revision; original tester status separate.','Conflict reload; denied write; missing evidence; inspect saved record.'),
 ('K07','Review release','Work / release','Exact commit/build and affected public surfaces','Approval gate → existing code/content release pipeline','Review concept; existing release approval policy remains','L04 L09','Existing deploy/publish/site privileges and explicit owner approval for main/Netlify.','Exact source, tests, known failures/retries and approval evidence.','Card movement and green mock charts never deploy; verify website and build independently.'),
 ('K08','Inspect delivery / retry projection','Work / configuration change','Selected revision; retry projects latest global config','SQL job → conditional public snapshot; receipts later','Current service/project and bounded retry path','L05 L06 L09','management.configure; operations retry may also require operations.run.','Durable operation and projection evidence; no blind resend after uncertain dispatch.','Readback match; failures remain pending; no receipt is unconfirmed.'),
 ('K09','Preview and confirm invoice import','Money','CSV rows, settings revision, original currency/source identity','Preview → atomic ledger transaction','Current finance preview/commit; redesigned flow proposed','L10','finance.write; explicit currency setup; ≤200 rows/180k chars; strict source IDs.','Preview hash, stable operationId, expected revisions; immutable corrections.','New/duplicate/correction/errors visible; lost acknowledgement retries same operation identity.'),
 ('K10','Correct/void/reconcile a line','Money / invoice','One source line and expected revision; reason','New ledger version; original history preserved','Current finance commit path','L10','finance.write; settlement and currency constraints; linked commitments cannot be silently invalidated.','New version + audit; never delete previous financial version.','Totals recomputed or unavailable; inspect history and coverage.'),
 ('K11','Set budget / coverage','Money','Month, minor units, reporting currency, coverageThrough','Budget + audit → qualified finance summaries','Current budget write','L10','finance.write; no future coverage assertion; expectedRevision.','Revision and reason; coverage is operator assertion, not verified provider ingestion.','Show coverage basis and how it enables/suppresses forecasts.'),
 ('K12','Run bounded maintenance','Work / services','Kind, selected inputs, operationId and scope','Durable operation → permitted provider or database check','Current limited bot/db/read/projection operations','L09','operations.run plus required underlying bot/config permission; not arbitrary command execution.','Audit and provider match; uncertain dispatch stays unknown.','Queued/running/terminal/unknown; refresh observes, it does not guarantee retry safety.'),
 ('K13','Manage account access','Settings / access','Named account and explicit grants','Server account permission record','Existing access tools; redesigned screen proposed','L12','Account administration privilege; show effective permissions immediately for custom access.','Record authorised access changes; revocation semantics documented per credential.','Device details, tester images, finance and family photos have separate boundaries.'),
 ('K14','Change analytics/name reporting','Game grown-up settings; Studio displays observation','That device’s analytics/reportNames choice','Local producer eligibility → future reports','Existing device setting; remote override not proposed','L01 L02','Authorised local grown-up flow; Studio must respect opt-out.','Opt-out is not retroactive deletion; deletion/retention workflow must be built separately.','Not collected ≠ zero. Existing retained data needs explicit lifecycle policy.'),
 ('K15','Export records','Relevant area','Selected permitted scope and explicit coverage','Authorised export artifact','Finance CSV exists; general snapshot export proposed','L01 L02 L03 L10','Same server permissions as displayed data; never embed secrets or unrelated families.','Record export scope/time and retention handling; CSV spreadsheet safety required.','Bounded scan limits explicit; no silent partial export labelled complete.'),
 ('K16','Request deletion / recovery','Settings / data; authorised family detail','Explicit data categories, identity, scope and consequences','PROPOSED retention/deletion/restore workflow','Proposed; real-family detailed collection gate','L01 L02 L07 L10 L11','Separate authority per data class; legal/financial retention and backup obligations assessed.','Preview affected stores, confirmation, job/evidence and exceptions; never silently remove saves.','Unknown backup coverage visible; restore drill required, not just a backup-result event.'),
 ('K17','Enable optional website handoff measurement','Settings / collection','Future short-lived handoff, purpose, opt-out and retention','PROPOSED L13 → matched aggregate chart','Proposed only; no endpoint created','L13','Explicit collection design/security review; no child names in URLs, logs or public content.','Document schema, expiry and deletion; aggregation must prevent small-group exposure.','Without this, G06 stays separate unmatched populations.'),
]
controls=[]
for r in CONTROL_ROWS:
 c=dict(zip(['id','label','location','scope','effect','implementation','connections','permission_validation','audit_recovery','confirmation'],r));c['connections']=c['connections'].split();controls.append(c)

DOMAIN = {
 'identity':('People',['L01'],['G01','G02','G03','G16'],['K01','K02','K14'],'installation ID; session distinct; never name-as-identity'),
 'game usage':('People / Game & website',['L01'],['G01','G04','G07','G11','G24'],['K01','K02'],'installation + device day + originating build; activity kind:id'),
 'profile activity':('People',['L01'],['G02','G04','G08'],['K02','K14'],'installation + retained local profile key; participation may overlap'),
 'performance':('Work / experience',['L01'],['G10','G11','G12'],['K01','K02'],'device/day/build sample cohort; preserve sums and counts'),
 'configuration':('Game & website / Work',['L05','L06'],['G17'],['K03','K08'],'existing content key; new global revision/hash; do not equate config scope with rule device selection'),
 'catalogue':('Game & website',['L04'],['G07','G09','G15','G16'],['K03','K04','K05','K07'],'kind:id + exact source commit/hash; website guide review source separate'),
 'website':('Game & website / Website',['L03'],['G05','G06'],['K01','K14','K17'],'aggregate day/route/language/device; no visitor-to-child join'),
 'support':('Work / People',['L07','L08'],['G18'],['K02','K06'],'client receipt ID + problem key; installation/build context; original and follow-up distinct'),
 'private data':('People / authorised family tools',['L11'],['G26'],['K02','K16'],'local save ID or separately authorised family membership; statistics hash grants nothing'),
 'operations':('Work / Settings',['L09','L12'],['G19'],['K07','K12','K13'],'account id; source/run/deploy/operation identifiers; never credentials as chart dimensions'),
 'future measurement':('Relevant area / detailed evidence',['L02'],['G03','G08','G09','G10','G13','G14','G26'],['K01','K14'],'deviceId+eventId dedup; deviceId+attemptId lifecycle; do not sum with legacy counters'),
 'delivery':('Work / change delivery',['L05','L06'],['G17'],['K03','K08'],'deviceId + scopeKey + revision + effectiveHash; fixed eligible cohort'),
 'finance':('Money',['L10'],['G20','G21','G22','G23','G24','G25'],['K09','K10','K11'],'provider + accountAlias + sourceDocumentId + sourceLineId; integer currency units'),
}

def privacy_for(conn):
 if conn=='L03': return 'Aggregate website observations; no visitor identity or child-name join; existing opt-out applies.'
 if conn=='L10': return 'Private business records; finance.read/write; not public website/game data.'
 if conn=='L11': return 'Private local/family data; separate authority; not analytics authentication.'
 if conn in ['L04','L05']:return 'Only allowlisted public content/config projected; no actor, child name, audit or financial record in public snapshot.'
 return 'Private operational/reporting data; summary vs device/name permissions separated; telemetry never proves identity.'

points=[]
legacy=json.loads((BASE/'data-points.json').read_text())
for old in legacy['data_points']:
 dest,links,gs,ks,join=DOMAIN[old['domain']]
 points.append({**old,'lineage':'historical_registry','baseline_commit':legacy['baseline_commit'],
  'implementation_status':'baseline_status_only_not_current_schema_attestation','destination':dest,'connections':links,'graphs':gs,'controls':ks,'join_rule':join,
  'privacy':privacy_for(links[0]),'retention':'No duration inferred from this registry. Category policy, deletion and backup recovery must be verified before live activation.',
  'null_rule':'Missing/unsupported/opted-out stays unknown or not collected; never converted to numeric zero.',
  'mapping_precision':'Domain-level redesign placement; exact legacy field/source/transport/storage preserved above. See current-code field rows for refined runtime contracts.'})

def add_fields(prefix, domain, conn, source, transport, storage, fields, dest, gs, ks, join):
 for number,(field,meaning,unit) in enumerate(fields,1):
  points.append(dict(id=f'{prefix}-{number:02}',domain=domain,field=field,meaning=meaning,unit=unit,
   status='proposed' if conn=='L13' or prefix=='UX' else 'current_code',lineage='proposed_contract' if conn=='L13' or prefix=='UX' else 'current_code_field',
   implementation_status='proposed_not_implemented' if conn=='L13' or prefix=='UX' else 'code_observed_not_live_verified',source=source,transport=transport,storage=storage,
   screen=dest,access=next(c['permission'] for c in connections if c['id']==conn),caveat=next(c['limitation'] for c in connections if c['id']==conn),
   destination=dest,connections=[conn],graphs=gs,controls=ks,join_rule=join,privacy=privacy_for(conn),
   retention='Explicit category retention/deletion/recovery policy required. Client outbox bounds do not establish server retention.',
   null_rule='Preserve missing/unknown/opted-out; field nullability and validation follow the linked source, not a generic schema.',
   mapping_precision='Observed field path in named source at pinned commit.' if prefix not in ['UX','HAND'] else 'Proposed field, not a current wire name.'))

add_fields('EV','detailed events','L02','js/management-telemetry.ts; netlify/lib/management/transactional/validation.mts; netlify/lib/management/transactional/service.mts','POST /api/management/events','management_events columns plus payload JSON; conflicts separately',[
 ('schemaVersion','Envelope schema version','integer'),('eventId','Stable event identity; retries keep payload','UUID'),('deviceId','Reporting installation, not person','identifier'),('sessionId','Running tab/session','identifier'),('attemptId','One lifecycle attempt within installation','UUID'),('eventName','Allowlisted event kind','enum'),('occurredAt','Client event time','UTC ISO'),('receivedAt','Server-assigned receipt time','UTC ISO'),('deviceDay','Device-local calendar date','date'),('offsetMinutes','Device offset provenance','minutes'),('build','Originating event build','build label'),('sourceCommit','Exact source when known; otherwise null','SHA/null'),('environment','production/staging/local','enum'),('traffic','ordinary/authorised_test/synthetic_bot','enum'),('profiles[].id','Installation-local profile ID','identifier'),('profiles[].name','Optional sanitised first name; omitted on name opt-out','text'),('profiles[].age','little/big, not birth date','enum'),('payloadHash','Server-computed immutable payload fingerprint','SHA256'),('data','Bounded per-event allowlisted payload','object')],
 'Relevant area / scoped event evidence',['G03','G08','G09','G10','G13','G14','G26'],['K01','K02','K14'],'deviceId+eventId; deviceId+attemptId; eventName and kind-specific data')

add_fields('OBS','event payload','L02','js/core/events.ts','Bounded data inside management event','management_events.payload.data',[
 ('activity.started.data.activityId','Stable game catalogue ID','identifier'),('activity.started.data.difficulty','Selected difficulty','enum'),('activity.started.data.mode','solo/local_two/online','enum'),('activity.completed.data.activityId','Completed activity ID','identifier'),('activity.abandoned.data.reason','closed/navigation/cancelled','enum'),('boot.ready.data.elapsedMs','Observed elapsed phase to playable','ms'),('boot.failed.data.reasonCode','Bounded boot failure code','enum'),('story.opened.data.storyId','Built-in story identity','identifier'),('story.completed.data.storyId','Built-in story final condition','identifier'),('connection.attempt.data.transport','direct/relay','enum'),('connection.result.data.outcome','success/timeout/rejected/failed','enum'),('connection.result.data.elapsedMs','Matched join attempt duration','ms'),('voice.result.data.source','recorded/family/device','enum'),('voice.result.data.language','en/vi/zh/hi','enum'),('voice.result.data.outcome','success/failed/cancelled/unknown','enum'),('update.result.data.outcome','success/failed/cancelled','enum'),('update.result.data.reasonCode','Bounded reason; no raw resource URL','enum'),('backup.result.data.operation','Optional export/restore','enum'),('backup.result.data.outcome','initiated/success/failed/cancelled','enum'),('backup.result.data.reasonCode','Bounded backup result; no save bytes','enum')],
 'Game & website / Work / permitted device evidence',['G08','G09','G10','G13','G14','G26'],['K01','K02'],'deviceId+attemptId with compatible event kind; source validators define required fields')

add_fields('CFG','configuration and change','L05','netlify/lib/management/transactional/service.mts; netlify/lib/management/http.mts','POST /studio/api/management/config → GET /api/live','management_records configs/config_versions/changes/projection_jobs/audit',[
 ('scopeKey','Currently global in public HTTP write','enum'),('expectedRevision','Reject competing stale edit','integer'),('kind','rules/content patch type','enum'),('body','Validated intended public configuration/content','object'),('reason','Operator explanation','text'),('revision','New server-assigned revision','integer'),('effectiveHash','Resolved config hash','SHA256'),('actor','Authenticated operator; private audit only','identifier'),('changeId','Stable saved change reference','UUID'),('previousRevision','Prior revision retained','integer'),('createdAt','Saved change time','UTC ISO'),('availableAt','Successful public projection readback time','UTC ISO/null'),('eligibleDeviceIds','Server-derived fixed reporting cohort at save','identifier[]'),('state','Pending projection or available evidence','enum')],
 'Game & website / Work / change inspector',['G17'],['K03','K08'],'scopeKey+revision+effectiveHash; changeId; expectedRevision for write concurrency')

add_fields('RCPT','delivery receipt','L06','js/management-telemetry.ts; netlify/lib/management/transactional/service.mts','POST /api/management/config-receipts','management_records namespace receipts',[
 ('schemaVersion','Receipt contract version','integer'),('deviceId','Reporting installation','identifier'),('scopeKey','Known configuration scope','identifier'),('revision','Known published revision','integer'),('effectiveHash','Known revision fingerprint','SHA256'),('fetchedAt','Client-reported fetch time','UTC ISO'),('appliedAt','Client-reported persistence time, null on failure','UTC ISO/null'),('result','applied/rejected/unsupported','enum'),('reasonCode','none/invalid_config/incompatible_build/scope_mismatch/storage_failure','enum')],
 'Work / change delivery; People / authorised device',['G17'],['K02','K08'],'deviceId+scopeKey+revision+effectiveHash; fixed eligible cohort separate from new devices')

csvfields=['schemaVersion','provider','accountAlias','sourceDocumentId','sourceLineId','kind','amountMinor','currency','taxMinor','periodStart','periodEnd','recognisedAt','paidAt','category','expectedRevision','costType','reconciled','voided','settles','fxTargetCurrency','fxRate','fxSource','fxAsOf']
explain={
 'schemaVersion':('Finance row version','integer'),'provider':('Source supplier/provider label','text'),'accountAlias':('Non-secret account reference','text'),'sourceDocumentId':('Invoice/source document reference','text'),'sourceLineId':('Stable line reference within source document','text'),
 'kind':('actual/estimate/commitment/credit/revenue','enum'),'amountMinor':('Signed integer amount in original currency minor units','integer minor units'),'currency':('Supported original currency; exponent explicit','ISO currency'),'taxMinor':('Tax tracked separately in original minor units','integer minor units'),
 'periodStart':('Service period first day','date'),'periodEnd':('Service period last day','date'),'recognisedAt':('Record recognition timestamp; invoice allocation uses service days','UTC ISO'),'paidAt':('Recorded paid timestamp, not bank verification','UTC ISO/null'),'category':('Allowlisted category including hosting/voice/revenue/refund/fee','enum'),'expectedRevision':('Prior line revision required for correction','integer'),
 'costType':('fixed/variable/unallocated; default unallocated','enum'),'reconciled':('Operator reconciliation assertion','boolean'),'voided':('Exclude through new version, preserving history','boolean'),'settles':('Linked commitment line ID, if any','identifier/null'),
 'fxTargetCurrency':('CSV field normalised to fx.targetCurrency','currency'),'fxRate':('CSV decimal string normalised to fx.rate; not float money','decimal string'),'fxSource':('CSV field normalised to fx.source','text'),'fxAsOf':('CSV field normalised to fx.asOf','date')}
add_fields('FIN','finance fields','L10','netlify/lib/management/finance-import.mts; netlify/lib/management/finance-values.mts','Finance preview/commit; exact CSV field names below','management_records finance_lines.body; immutable finance_versions; fx CSV fields normalised to nested fx',[(f,*explain[f]) for f in csvfields],
 'Money / invoice line',['G20','G21','G22','G23','G24','G25'],['K09','K10'],'source tuple hashes to line ID; revision and operationId prevent duplicate/colliding writes')
next(p for p in points if p['id']=='FIN-15')['storage']='Import concurrency input, not stored in line body; committed revision is record metadata.'

add_fields('FCTL','finance control metadata','L10','netlify/lib/management/finance.mts','Finance settings/budget/preview/commit routes','finance_settings/finance_budgets/finance_batches/audit',[
 ('reportingCurrency','Configured reporting currency; locked after first ledger line','currency'),('expectedSettingsRevision','Protect against settings changed after preview','integer'),('previewHash','Confirm exactly previewed import','SHA256'),('operationId','Idempotent import identity','UUID'),('reason','Import/settings/budget explanation','text'),('month','Budget/report month','YYYY-MM'),('amountMinor','Budget amount, reporting currency','integer minor units'),('coverageThrough','Manual coverage-through day; not future','date/null'),('basis','Snapshot query invoice/cash','enum')],
 'Money / setup, import and budget',['G20','G21','G22','G23','G24'],['K09','K10','K11'],'settings revision; month for budget; stable operationId and request hash for batches')

add_fields('CAT','catalogue fields','L04','netlify/lib/management/catalogue.mts','content/management-catalogue.json → Studio activity reads','Versioned public catalogue snapshot',[
 ('entries[].id','Game/story stable identity within kind','identifier'),('entries[].kind','game/story namespace','enum'),('entries[].name.en','English display name','text'),('entries[].name.vi','Vietnamese display name','text'),('entries[].area','Catalogue area','identifier'),('entries[].sourceCommit','Item source revision or null','SHA/null'),('entries[].sourceFile','Actual source location','path'),('entries[].sourceHash','Source bytes fingerprint','SHA256'),('entries[].guide.href','Allowlisted website anchor or null','path/null'),('entries[].guide.verified','Anchor existence verified','boolean'),('entries[].guide.reviewedSource','Website explanation reviewed source','SHA/null'),('entries[].guide.sourceAligned','Review/source alignment tri-state','boolean/null'),('entries[].coverage.recordings','Currently not-audited','enum'),('entries[].unlock.prerequisites','Local progress dependencies; no business score','identifier[]')],
 'Game & website / selected item',['G07','G09','G15','G16'],['K03','K04','K05','K07'],'kind:id; sourceCommit/sourceHash and reviewedSource compared explicitly')

add_fields('TASK','work follow-up fields','L08','netlify/lib/management/transactional/service.mts','POST /studio/api/management/attention/:id','management_records attention; audit for actor/reason and transitions',[
 ('id','Issue/follow-up record identity from route','identifier'),('expectedRevision','Input concurrency guard, not a new stored revision','integer'),('revision','Committed record revision','integer'),('state','Enforced follow-up lifecycle; separate from original tester state','enum'),('owner','Assigned owner label or null','text/null'),('nextAction','Explicit next step','text'),('reason','Write explanation retained in audit','text'),('evidence.problemKey','Original problem reference','identifier'),('evidence.build','Relevant build; required for verification','build label'),('evidence.sourceCommit','Exact code reference when supplied','SHA text'),('evidence.runId','Supporting test/provider run reference','identifier'),('evidence.deployId','Required for deployed transition','identifier'),('evidence.verificationEvidence','Required verification explanation/reference','text'),('updatedAt','Server update time','UTC ISO')],
 'Work / issue inspector',['G18'],['K06'],'route id + expectedRevision; preserve original report reference and evidence')

# Exact current fields directly supporting each graph, rather than broad domain context.
direct={
 'G01':[], 'G02':['EV-03','EV-15','EV-16','EV-17','UX-01','UX-02','UX-03','UX-04','UX-05','UX-09'],
 'G03':['EV-03','EV-07','EV-09'], 'G04':[], 'G05':[], 'G06':['EV-03','EV-05','EV-06','EV-07','OBS-06','OBS-07']+[f'HAND-{i:02}' for i in range(1,9)],
 'G07':['CAT-01','CAT-02','CAT-03','CAT-04','OBS-01','OBS-08'],
 'G08':['EV-03','EV-05','EV-06','EV-07','OBS-01','OBS-02','OBS-03','OBS-04','OBS-05'],
 'G09':['EV-03','EV-05','EV-07','OBS-08','OBS-09'],
 'G10':['EV-03','EV-05','EV-06','EV-07','OBS-06','OBS-07'], 'G11':[], 'G12':[],
 'G13':['EV-03','EV-05','EV-07','OBS-10','OBS-11','OBS-12'], 'G14':['OBS-13','OBS-14','OBS-15'],
 'G15':['CAT-01','CAT-02','CAT-03','CAT-04','CAT-06','CAT-08','CAT-09','CAT-10','CAT-11','CAT-12','CAT-13'],
 'G16':['EV-11','CAT-06'], 'G17':[f'RCPT-{i:02}' for i in range(1,10)]+['CFG-01','CFG-06','CFG-07','CFG-09','CFG-12','CFG-13','CFG-14'],
 'G18':[f'TASK-{i:02}' for i in range(1,15)]+['UX-06'], 'G19':[],
 'G20':[f'FIN-{i:02}' for i in range(1,24)]+['FCTL-01','FCTL-06','FCTL-08','FCTL-09'],
 'G21':['FIN-06','FIN-07','FIN-08','FIN-16','FIN-18','FIN-19','FCTL-06','FCTL-07'],
 'G22':['FIN-06','FIN-07','FIN-08','FIN-13','FIN-19','UX-12'],
 'G23':['FIN-06','FIN-07','FIN-10','FIN-11','FIN-16','FCTL-06','FCTL-08'],
 'G24':['FIN-07','FIN-08','FIN-20','FIN-21','FIN-22','FIN-23','FCTL-06','FCTL-08'],
 'G25':['FIN-06','FIN-07','FIN-08','FIN-14','FIN-16','FIN-20','FIN-21'],
 'G26':['EV-03','EV-05','EV-07','OBS-16','OBS-17','OBS-18','OBS-19','OBS-20']}

add_fields('UX','proposed richer user detail','L01','PROPOSED user-detail read-model contract','PROPOSED additions to scoped People read model; existing names/device observations reused','PROPOSED derived view; no migration chosen',[
 ('deviceAlias','Operator-friendly optional device nickname, separate from identity','text'),('collectionState','Reported/not collected/unknown and reason','enum'),('firstObservedAt','First retained observation, not first installation ever','UTC ISO/null'),('lastObservedAt','Latest accepted observation with source freshness','UTC ISO/null'),('linkedProfileKey','Installation-local profile key with provenance','identifier'),('linkedIssueIds','Authorised problem references for this record','identifier[]'),('desiredConfigRef','Selected intended global revision reference','reference/null'),('latestMatchingReceipt','Applicable observed receipt reference and time','reference/null'),('dataCoverage','Sources/periods/limits relevant to this record','object'),('retentionPolicyRef','Approved category policy/version and applicability','reference/null'),('familyRelationship','Only explicitly authorised established relationship','reference/null'),('dueAt','Proposed financial obligation due date; belongs to Money, not a child','date/null')],
 'People / device detail; dueAt belongs to Money',['G02','G04','G17','G18','G22'],['K02','K16'],'No synthetic global child ID. Proposed read fields require exact adapters and permission checks.')
# dueAt is finance-specific; keep its exact lineage out of the People contract.
due=points[-1];due.update(domain='proposed obligation',connections=['L10'],destination='Money / obligations',screen='Money / obligations',source='PROPOSED finance obligation schema',transport='PROPOSED finance obligation route; no current endpoint',storage='PROPOSED finance obligation record; migration required',graphs=['G22'],controls=['K09','K10'],access='finance.read / finance.write',privacy=privacy_for('L10'),join_rule='Explicit obligation identity and source line; no guessed due date from periodEnd')

add_fields('HAND','proposed website handoff','L13','PROPOSED; existing home/analytics.ts does not implement these fields','PROPOSED handoff contract; no current endpoint','PROPOSED short-retention store and aggregates',[
 ('handoffId','Random short-lived one-time handoff; no stable visitor ID','random opaque identifier'),('createdAt','Server-controlled handoff start','UTC ISO'),('expiresAt','Short explicit expiry; duration to approve','UTC ISO'),('entryRoute','Allowlisted website source route','enum'),('language','Website language at click','enum'),('consentState','Collection eligibility for both surfaces','enum'),('bootOutcome','Matched reportable ready/failed/pending/expired','enum'),('releaseRef','Matched source/build where actually known','reference/null')],
 'Game & website / future matched acquisition',['G06'],['K17'],'Random handoff only; no names, family code, full referrer, stable fingerprint or automatic cross-device link')

for g in graphs:g['refined_data_ids']=direct[g['id']]

metrics=json.loads((BASE/'metrics.json').read_text())['metrics']
for m in metrics:
 m['baseline_definition_only']=True
 m['redesign_graphs']=[g['id'] for g in graphs if m['id'] in g['metric_ids']]
 m['current_override_note']={'M23':'G14 uses current confirmed-only recorded-voice denominator; unknown/cancelled separate.','M24':'G17 uses current exact revision/hash matching; later revision is not automatically credited.','M20':'G10 is reportable boot phase only, not all browser starts.'}.get(m['id'],'Use graph contract and source adapter; historical definition is not current implementation attestation.')

def write(name,text):
 (ROOT/name).parent.mkdir(parents=True,exist_ok=True);(ROOT/name).write_text(text,encoding='utf-8')
def table(headers,rows):
 def cell(x):return str(x).replace('|',' / ').replace('\n',' ')
 return '| '+' | '.join(headers)+' |\n|'+'|'.join(['---']*len(headers))+'|\n'+''.join('| '+' | '.join(cell(x) for x in row)+' |\n' for row in rows)
def source_links(s):
 return ' · '.join(f'[{p}]({URL+p})' if (REPO/p).is_file() else p for p in s.split('; '))

data=dict(schema_version=1,title='Studio connected concept',source_commit=SOURCE,historical_registry_commit=legacy['baseline_commit'],
 scope='Management-relevant field families plus explicitly enumerated current/proposed refinements; not every gameplay-save leaf, provider field or future form field.',
 runtime_changes=False,synthetic_visuals=True,data_points=points,connections=connections,graphs=graphs,controls=controls,metrics=metrics)
write('registry.json',json.dumps(data,indent=2,ensure_ascii=False)+'\n')
columns=['id','domain','field','meaning','unit','lineage','implementation_status','source','transport','storage','destination','access','join_rule','connections','graphs','controls','privacy','retention','null_rule','mapping_precision']
with (ROOT/'data-connections.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.DictWriter(f,columns);w.writeheader()
 for p in points:w.writerow({k:'; '.join(p[k]) if isinstance(p[k],list) else p[k] for k in columns})

text='# Field-by-field data and connection register\n\nGenerated from `registry.json` by `tools/build.py`. Historical rows preserve their original baseline status and transport/storage contract; they are not relabelled as current code. Current refinements are separately identified. No live database access is implied.\n\n'
text+=f'**{len(points)} entries:** 137 historical field families plus {len(points)-137} enumerated current/proposed refinements. Some are overlapping explanations of the same underlying data, not additional collection. This is the management data scope, not every field in a game save.\n\n'
text+='Each row has a stable ID, source, route, storage, join, permission, destination, connected graphs/controls, privacy, missing-data handling and retention caveat in the [JSON](registry.json) and [CSV](data-connections.csv). Domain-wide graph associations show contextual relevance; each graph’s narrower `data_ids` list identifies its direct historical inputs.\n\n'
for domain in dict.fromkeys(p['domain'] for p in points):
 text+='## '+domain+'\n\n'
 rows=[p for p in points if p['domain']==domain]
 text+=table(['ID / field','Meaning / unit','Source → transport → storage','Join / access','Studio / graphs / controls','Evidence status'],[
  (p['id']+' · '+p['field'],p['meaning']+' ('+p['unit']+')',source_links(p['source'])+' → '+p['transport']+' → '+p['storage'],p['join_rule']+'; '+p['access'],p['destination']+'; '+', '.join(p['graphs'])+'; '+', '.join(p['controls']),p['implementation_status']) for p in rows])+'\n'
write('DATA-MAP.md',text)

text='# Graph catalogue: what each graph means and connects to\n\nAll graph interfaces are proposed. Some source observations exist in code; this does not mean a deployed graph, complete history or live provider access. Default traffic is ordinary, and comparison periods use compatible date/currency/source bases.\n\nEvery graph must show its period, timezone/date basis, filters, source freshness, numerator/denominator or count unit, sample size, missing-data warning and a keyboard-accessible data table. Colour is never the only encoding. Switching a graph opens scoped detail; it never changes a game setting.\n\n'
text+=table(['Graph','Location','Visual','Source connections'],[(g['id']+' '+g['title'],g['destination'],g['visual'],', '.join(g['connections'])) for g in graphs])+'\n'
for g in graphs:
 text+=f"## {g['id']} · {g['title']}\n\n- **Location / visual:** {g['destination']} · {g['visual']}.\n- **Definition:** {g['definition']}\n- **Sources:** {', '.join(g['connections'])}; field families {', '.join(g['data_ids'])}.\n- **Metric references:** {', '.join(g['metric_ids']) or 'New outcome breakdown; no historical metric reused'}.\n- **Click / keyboard drilldown:** {g['drilldown']}\n- **Limits and implementation needs:** {g['limitation']}\n\n"
 text+='**Enumerated runtime/proposed refinements:** '+(', '.join(g['refined_data_ids']) or 'Historical field families above are sufficient to identify the existing input; adapter/query validation still required.')+'\n\n'
text+='## Placement without visual overload\n\nToday gets one compact audience trend plus a selectable experience/cost summary, behind the primary decision. People gets audience/device mix with optional activity pattern. Each selected game gets popularity/outcomes and its review matrix. Work gets experience, releases and operational graphs. Money gets costs, budget and qualified forecasts. Put two principal graphs in a screen’s first section; further graphs belong in named sections or selectable views, not a wall of 26 charts.\n\nComparison does not prove causation. Release annotations describe timing; they do not establish a release caused a change in usage or performance. Small private groups need an approved suppression policy before aggregate sharing; no arbitrary threshold is claimed already enforced.\n'
write('GRAPHS.md',text)

text='# Control contracts: purpose, scope, connection and confirmation\n\nAll redesigned controls are UX proposals. The backing-path column distinguishes current code from missing work. A control must expose **what it does, current value, selected scope, where it goes, when it takes effect and how to recover**. No proposed control bypasses server permissions.\n\n'
text+='## Standard control anatomy\n\nExample (fictional): **Reading activities · On**. “Changes this feature rule in the global configuration. The rule may contain supported device selection; this is not a separate device-specific configuration publication. Devices must fetch the published revision. Existing open screens may need reopening.” Show current revision → draft changes → affected-surface preview → reason → Save/review action → saved/public readback/receipt state. Never display an unimplemented target selector as active.\n\n'
for c in controls:
 text+=f"## {c['id']} · {c['label']}\n\n- **Location:** {c['location']}.\n- **What / selected scope:** {c['scope']}.\n- **Connects to:** {', '.join(c['connections'])} → {c['effect']}.\n- **Available backing path:** {c['implementation']}.\n- **Permission / validation:** {c['permission_validation']}\n- **Audit / recovery:** {c['audit_recovery']}\n- **How the operator knows:** {c['confirmation']}\n\n"
text+='## Required states for every write\n\nLoading; existing value; unsaved draft; invalid; permission denied; stale-revision conflict; request in flight; saved; downstream pending; confirmed downstream; failed; unknown after a lost acknowledgement. Preserve the draft after a recoverable error. For an uncertain non-idempotent provider request, observe before retrying. Destructive save/family actions still require explicit informed authority.\n\nA future simulation control must say “Expected result from these rules” and list unknown device-local progress/cache inputs. It cannot say “This child can play now” without the necessary observed evidence. A future due-date control requires a real obligation schema; service period end is not a due date.\n'
write('CONTROLS.md',text)

text='# Connections, identity and ownership\n\nCode references are pinned to '+SOURCE+'. No current row establishes live deployment/access. Proposed L13 has no active transport/store.\n\n'
for c in connections:
 text+=f"## {c['id']} · {c['label']}\n\n- **Producer:** {source_links(c['producer'])}.\n- **Transport:** {c['transport']}.\n- **Storage / authority:** {c['storage']}.\n- **Studio destination:** {c['destination']}.\n- **Join:** {c['join']}.\n- **Access:** {c['permission']}.\n- **Status:** {c['status']}.\n- **Limit:** {c['limitation']}\n\n"
text+='''## Identity: relationships that must remain separate

| Entity | Identity / relationship | What it does not prove |
|---|---|---|
| Website observation | Aggregate dimensions, no stable visitor identity | A person, child, session or game installation |
| Installation | Random device/browser-storage ID | A physical person, permanent hardware identity or customer |
| Reported profile | Installation plus local profile key; optional first name | Global unique child identity; equal names are not a join |
| Session | One running tab/session ID | A new child or another installation |
| Attempt | Installation plus attemptId, compatible lifecycle | One profile participation in shared play |
| Family statistics link | Existing digest for statistics association | Authentication, photo membership or save ownership |
| Private family membership | Explicitly established private service relationship | Finance or unrestricted other-family access |
| Content | kind:id; source commit/hash | A display name or proof of website editorial review |
| Configuration | Scope + revision + effective hash | Game code version or universally applied change |
| Release | Reviewed commit/build and deployment evidence | Every offline device having updated |
| Invoice line | Source tuple plus revision history | Bank payment or provider-verified account balance |

## Current control precedence and targeting

Do not invent a new precedence engine in the UI. `netlify/lib/management/catalogue.mts` explains expected availability against current rules; actual clients also have local progress, cache and clock inputs. `LIVE-05` documents device selections inside a release rule. That is distinct from publishing a dedicated `device:...` or `feature:...` revision: current management HTTP only accepts global publication. Proposed specialised editors must preserve this distinction and existing tester/keep/restore policy.

## Public/private crossing rules

Website and game receive allowlisted public content and configuration. Child names, private reports/screenshots, family photo bytes, credentials, finance records and operator audit details do not travel in that projection. Studio reads private data through its actual scoped server APIs; the browser is not given a database credential. Netlify Database is the selected SQL provider, with native `NETLIFY_DB_URL` binding for server Functions; current workspace binding is absent. Existing Blobs/local save stores remain separate until an explicit migration is designed.

## Time and interpretation

Store event UTC time, server received time and device day/offset separately. Legacy play buckets use device-local dates; detailed event summaries currently use production UTC windows. Financial service-day allocation, cash paidAt UTC date and Sydney-labelled reports need visible bases. UI labels should not pretend these windows are interchangeable. Missing watermarks mean freshness unknown, not “updated just now”.
'''
write('CONNECTIONS.md',text)

def validate():
 ids={p['id'] for p in points};assert len(ids)==len(points)
 assert len([p for p in points if p['lineage']=='historical_registry'])==137
 assert len(metrics)==38
 sets={'connections':{c['id'] for c in connections},'graphs':{g['id'] for g in graphs},'controls':{c['id'] for c in controls}}
 for p in points:
  for k,s in sets.items():assert set(p[k])<=s,(p['id'],k)
  for k in ['source','transport','storage','access','join_rule','privacy','retention','null_rule']:assert p[k],(p['id'],k)
  if p['lineage']=='current_code_field':
   for source in p['source'].split('; '):assert (REPO/source).is_file(),source
 for g in graphs:
  assert set(g['data_ids']+g['refined_data_ids'])<=ids,g['id'];assert set(g['connections'])<=sets['connections'];assert set(g['metric_ids'])<={m['id'] for m in metrics}
 for c in controls:assert set(c['connections'])<=sets['connections']
 assert all(m['redesign_graphs'] for m in metrics),'Historical metric without proposed graph placement'
 for c in connections:
  assert (REPO/c['producer']).is_file(),c['producer']
 sources=sorted({s for p in points if p['lineage']=='current_code_field' for s in p['source'].split('; ')}|{c['producer'] for c in connections if c['status']!='proposed'}|{'netlify/lib/management/http.mts','netlify/lib/admins.mts','netlify/functions/management.mts','netlify/functions/parent-analytics.mts'})
 evidence=[]
 for s in sources:
  original=subprocess.check_output(['git','show',SOURCE+':'+s],cwd=REPO)
  assert original==(REPO/s).read_bytes(),('Current source drift; review and repin before documenting',s)
  evidence.append(dict(path=s,source_commit=SOURCE,sha256=hashlib.sha256(original).hexdigest()))
 write('source-evidence.json',json.dumps(evidence,indent=2)+'\n')
 # This is local document/reference validation, not application or deployment validation.
 result=dict(passed=True,scope='Concept register structure and existing source-path validation only; no production/database claims',
             data_points=len(points),historical_field_families=137,current_refinements=sum(p['lineage']=='current_code_field' for p in points),
             proposed_refinements=sum(p['lineage']=='proposed_contract' for p in points),graphs=len(graphs),controls=len(controls),connections=len(connections),historical_metrics=len(metrics),source_commit=SOURCE)
 write('validation.json',json.dumps(result,indent=2)+'\n')
 print(json.dumps(result))

validate()
