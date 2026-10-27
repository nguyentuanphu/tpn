#!/usr/bin/env python3
"""Build the handbook's registries, diagrams and offline HTML guide. No network calls."""
from pathlib import Path
import subprocess
import csv, hashlib, html, json, re, textwrap

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
BASELINE = 'ac76cf6097a8071bf2da4be90fe81fd0af8201d6'
ROWS = []

def group(prefix, domain, status, source, transport, storage, screen, access, fields, caveat='', task='B01'):
    for n, (field, meaning, unit) in enumerate(fields, 1):
        ROWS.append(dict(id=f'{prefix}-{n:02}', domain=domain, status=status, field=field,
                         meaning=meaning, unit=unit, source=source, transport=transport,
                         storage=storage, screen=screen, access=access, caveat=caveat,
                         build_ticket=task))

group('ID','identity','existing','js/players.ts; netlify/lib/hello-clean.mts',
      'POST /api/hello','device localStorage; players dev/ and info/ records','Device details','analytics',[
 ('id','Random installation identifier; resetting storage can create another installation','identifier'),
 ('sid','One running tab/session, not a person','identifier'),
 ('started','Session start; used to avoid treating an older tab as latest','Unix milliseconds'),
 ('b','Build attached to the sending session','build label'),
 ('h','Retry identifier for one hello batch','identifier'),
 ('l','Game language: en, vi or unknown','enum'),
 ('k','Number of profiles on this installation, not unique children globally','count'),
 ('d','Phone, tablet or computer classification','enum'),
 ('a','Standalone/PWA mode observed by browser; not proof of an install event','boolean'),
 ('os','Operating-system family','enum'),
 ('br','Browser family','enum'),
 ('sc','Reported screen dimensions','pixels'),
 ('fh','Digest of a statistics-linking family code; not authentication or photo permission','digest'),
 ('isRobot + traffic','Both flags route synthetic hello traffic into bot-players','classification')],
 'Existing wire names are compact. Do not rename them in place or infer a unique person from an installation.', 'B02')
group('DAY','game usage','existing','js/players.ts; netlify/lib/hello-clean.mts; netlify/lib/players.mts',
      'POST /api/hello days[]','sv2_hello_out -> players d/<day>/<id>, sum/<day>',
      'Home / Analytics / Activity','analytics',[
 ('days[].d','Day of play recorded on device; late arrivals belong to that day','YYYY-MM-DD device-local'),
 ('days[].build','Originating build of this bucket, separate from sender build','build label'),
 ('days[].m','Minutes of active play counted by existing hooks','minutes'),
 ('days[].g[gameId]','Activity start counts at device level','count'),
 ('days[].t','Stories opened, not stories completed','count'),
 ('days[].o','Minutes with friends online','minutes'),
 ('days[].h[hour]','Play minutes by device-local hour','minutes'),
 ('days[].q[gameId]','Activities left before completion','count'),
 ('days[].e[message]','Sanitised game-code error counts','count'),
 ('days[].s[areaPosition]','Stuck detections; not every instance is necessarily a bug','count')],
 'The client keeps up to 30 local dates; the server accepts bounded recent buckets. Existing comments mentioning 14 days are stale. Existing day labels lack a reliable timezone conversion.', 'B02')
group('KID','profile activity','existing','js/players.ts listen(), kidOf(); netlify/lib/hello-clean.mts kid()',
      'POST /api/hello days[].c[profileKey]','players daily children records','Restricted device/activity detail','analytics',[
 ('n','Profile first name when name reporting is enabled','text up to 20 characters'),
 ('a','Under-5 versus older age group; not date of birth','little | big'),
 ('m','Play minutes for this profile on this device','minutes'),
 ('sm','Minutes on the Simple screen','minutes'),
 ('t','Stories opened by this profile','count'),
 ('g[gameId][0]','Activity starts for participating profile','count'),
 ('g[gameId][1]','Activity completions for participating profile','count'),
 ('g[gameId][2]','Activity abandonments for participating profile','count'),
 ('p[placeId]','Entries into named game places','count')],
 'This is personal/pseudonymous activity information, not wholly anonymous analytics. Restrict names to operational views; never publish them on /home. Profile participation counts differ from unique activity attempts.', 'B02')
group('PERF','performance','existing','js/players.ts; netlify/lib/hello-clean.mts; netlify/lib/players.mts',
      'POST /api/hello days[].f and days[].st','players daily records and report aggregates',
      'Analytics / Performance / Release comparison','analytics',[
 ('days[].f[0]','Sum of sampled frame-rate measurements','FPS sum'),
 ('days[].f[1]','Number of frame-rate samples','sample count'),
 ('days[].f[2]','Samples below the existing 20 FPS threshold','sample count'),
 ('days[].st[][0]','Time until game code is ready','milliseconds'),
 ('days[].st[][1]','Time until valley is built','milliseconds'),
 ('days[].st[][2]','Time until first picture','milliseconds'),
 ('days[].st[][3]','Service-worker-controlled start flag; imperfect warm-cache proxy','0 | 1'),
 ('days[].st[][4]','Slowest named startup stage','stage ID')],
 'Current arrays contain capped samples. Do not claim population p95 or an exact cache hit rate from them. Render explicit sample counts and measurement limitations.', 'B03')
group('BAT','performance','existing','js/players.ts sampleDrawing(); netlify/lib/hello-clean.mts BAT_MAX',
      'POST /api/hello days[].b','players daily battery/drawing arrays','Analytics / Performance','analytics',[
 ('b[0]','Measured drawing minutes','minutes'),('b[1]','Active frames drawn','frames'),
 ('b[2]','Time spent drawing measured frames','milliseconds'),('b[3]','Draw calls on measured frames','calls'),
 ('b[4]','Pixel ratio multiplied by 100, summed per measured minute','ratio x100 sum'),
 ('b[5]','Minutes mostly idle','minutes'),('b[6]','Minutes measured while on battery','minutes'),
 ('b[7]','Observed battery loss','tenths of one percentage point'),
 ('b[8]','Minutes charging','minutes'),('b[9]','Seconds represented by active frame measurements','seconds')],
 'Battery API is unavailable on many Safari devices. Zero counters without measured battery time mean unavailable, not zero energy consumption. Prefer named adapters to exposing array slots.', 'B03')
group('LIVE','configuration','existing','studio/ui/app.ts LIVE_PAGES; netlify/lib/live.mts; js/custom.js',
      'Studio /studio/api/live or /live/content -> GET /api/live','live store: live and content; device sv2_live',
      'Game / Releases / Family content / Activity availability','pages to read; edit or releases to write',[
 ('releases[id].on','Explicit feature switch','boolean'),('releases[id].start','Scheduled release date','date'),
 ('releases[id].days','Availability duration','days'),('releases[id].newDays','New-badge duration','days'),
 ('releases[id].devices','Selected installation scope; empty is all applicable devices','ID list'),
 ('releases[id].levels','Tester mode per selected device','map'),('releases[id].peeks','Early-access features','ID list'),
 ('releases[id].revert','Default tester exit policy','keep | autoplay | progress'),
 ('releases[id].policies','Per-device revert, speed and autoplay choices','map'),
 ('festivals[id].on/date/buildup/deco','Festival enablement, dates and decorations','structured settings'),
 ('at / contentAt','Server timestamps for existing live rules/content','ISO timestamp'),
 ('content.message','Bilingual message','en/vi text'),('content.missions','Family missions','list'),
 ('content.quiz','Family quiz questions','list'),('content.tales','Family stories','list'),
 ('content.names/genders/faces','Villager overrides; private photo references require separate access','maps'),
 ('content.looks/plots','Story character and Memory Village configuration','maps'),
 ('content.activities','Activity area, little and hide overrides','map'),
 ('content.defaults/features','Device defaults and feature switches','maps'),
 ('content.ads','Owner-authored ad settings; uploaded pictures may still need Publish','object'),
 ('content.album','Family postcard metadata; photo bytes use private services','list')],
 'Public /api/live is public: never put secrets or private photo bytes here. Its 30-second cache is not a promise that every device applies a change in 30 seconds. Existing timestamps are not delivery acknowledgements.', 'B06')
group('CONTENT','catalogue','existing','js/content/activities.ts; js/games/registry.ts; js/content/releases.ts; js/content/unlocks.ts',
      'Versioned game files -> tools/build-website.mts and reviewed website source','Git source; generated browser files and /home assets',
      'Activity detail / Content coverage / Website review','pages; edit for future editorial work',[
 ('gameId / area / name / icon','Stable activity identity and display catalogue','catalogue entry'),
 ('minimum age / little / difficulty','Suitability and supported game difficulty','catalogue metadata'),
 ('storyId / shelf / pages','Story identity and shelf contents','catalogue entry'),
 ('featureId / default / release rule','What controls activity availability','catalogue entry'),
 ('wins / taleReads / unlock requirements','Local progress used for unlocks; not a business score','local progress'),
 ('BUILD / SHOWN / sw VERSION / studio version','Aligned game/cache/dashboard versions','build labels'),
 ('website source lock / file hashes','Reviewed source fingerprint for parent explanations','source provenance'),
 ('voice language / hash / manifest signature','Recorded-line identity and language-pack revision','manifest metadata')],
 'The website currently builds from a reviewed prototype via tools/build-website.mts; do not describe a dynamic shared catalogue API as already implemented.', 'B05')
group('WEB','website','existing','home/analytics.ts; home/site.ts; netlify/functions/parent-analytics.mts',
      'POST /api/parent-analytics -> GET /studio/api/parent-analytics','parent-analytics sum/<UTC day>',
      'Analytics / Website','analytics',[
 ('page_view.route','Count of allowlisted page-view events','events, not unique visitors'),
 ('action_click.action','Count of allowlisted actions','events'),('link_click','Aggregate link clicks','events'),
 ('scroll_milestone.milestone','25/50/75/100 percent milestones','events'),
 ('active_time.seconds','Best-effort active reading time','seconds'),
 ('play_conversion','Play button clicks; not confirmed game starts','clicks'),
 ('lang','Language of each accepted event','en | vi | unknown'),
 ('device','Viewport-based class attached to each event','phone | tablet | desktop'),
 ('sv_parent_analytics_consent','Local opt-out; current default counts unless no','local preference')],
 'No visitor/session identifier in current website events. Transport is best effort with no durable retry or idempotency key; aggregates use read-modify-write. Embedded website counting is disabled. Event totals are not people or visits.', 'B02')
group('ISSUE','support','existing','js/tester.ts; js/report-outbox.ts; netlify/lib/tester.mts',
      'POST /api/tester -> /studio/api/testers, /testers/problem/<key>, /testers/set','Device durable queue; testers private records/screenshots',
      'Attention / Sparkle Lab / Problem detail','testers read; testerset update',[
 ('clientId','Durable client receipt/deduplication identity','32 hex characters'),
 ('id / b / at','Reporting device, build and server receipt time','identity + timestamp'),
 ('kind / auto','Manual report kind or detector category','enums'),
 ('detail / note / spoken','Bounded report explanation and input mode','text + boolean'),
 ('where.area/place/game/window/x/z','Game context, never geographic GPS','context'),
 ('errors / log','Bounded error messages and action history','sanitised lists'),
 ('dev','OS/browser/screen/language and optional performance readings','object'),
 ('players / reporter','Profile context and separately identified report author','restricted metadata'),
 ('shot','Private screenshot requiring sensitive-content masking','private image'),
 ('count','Repeated reports grouped by client detector','count'),
 ('problem key / status / fixedIn','Grouped issue lifecycle and declared fix version','new/fixing/fixed/confirmed/back/notbug/dup')],
 'Tester entitlement is checked server-side. Existing limits include keepDays=60 and 20 reports/problem. Retention cleanup needs execution monitoring; an automated report is evidence to investigate, not a confirmed defect.', 'B04')
group('PRIVATE','private data','existing','js/state.ts; js/content/savecopy.ts; js/familydevices.ts; netlify/lib/family-devices.mts; netlify/lib/family.mts',
      'Local save/copy; /api/family/*; /api/family-devices/*','Device localStorage/IndexedDB/Cache; private family stores',
      'Protected Grown-ups / Studio backup import and family pages','family; device credentials for photo collection',[
 ('profiles / farm / settings','Local authoritative play state; not remote cloud-save authority','save objects'),
 ('save copy v3 / device','Explicit portable backup and installation association','validated file'),
 ('photo family membership / device approval','Parent-owned private photo collection membership','private records'),
 ('pairing code / recovery / session token','Photo-access credentials; never analytics dimensions','secrets'),
 ('Studio family photo reference','Opaque family:<random-name>, not public image bytes','private reference'),
 ('statistics family code digest','Links statistics only; distinct from photo access and save transfer','pseudonymous link')],
 'Three separate concepts: statistics linking, private photo sharing, and explicit progress backup/restore. Never use one credential to grant another capability.', 'B01')
group('OPS','operations','existing','netlify/lib/admins.mts; netlify/lib/accesslog.mts; netlify/lib/child-bots.mts; studio/core.cts',
      '/studio/api/*; GitHub workflows; publish pipeline','studio-admins; studio-log; live bot-schedule; studio-pending and studio-draft',
      'Setup / Security / Publish / Sparkle Lab','existing server-side permission map',[
 ('account role / perms','Viewer/editor/owner/custom permissions','permission set'),
 ('trusted browser / Studio key','Revocable authentication grants','private credentials'),
 ('access log at/who/role/what/where/note','Restricted sign-in and selected-action evidence','audit entry'),
 ('pending path / size / deletion','Changes held before publishing','file manifest'),
 ('draft / main commit / deploy ID','Source and deployment provenance','version IDs'),
 ('bot enabled/schedule/time/count/profile/duration','Private synthetic-run schedule; clock currently UTC','bounded configuration'),
 ('workflow run / result artifact','CI, bot and voice-job results','run references')],
 'Existing access log is not a complete before/after configuration audit. Provider run results and billing are not automatically available to Studio just because Git reads work.', 'B07')
group('EVENT','future measurement','proposed','js/core/events.ts; js/players.ts; js/launch.js; js/net.ts; js/voice.ts',
      'NEW POST /api/management/events','NEW transactional management event ledger; current save stores unchanged',
      'Activity funnel / Retention / Performance / Connections','analytics.read proposed; public ingest has no read access',[
 ('schemaVersion / eventId / payloadHash','Versioned validated event and duplicate identity','version + UUID + digest'),
 ('deviceId / sessionId / attemptId','Installation, session and one activity attempt; no child name','scoped IDs'),
 ('occurredAt / receivedAt / deviceDay / offsetMinutes','Separate event time, receipt time and local-day provenance','UTC timestamps + local label'),
 ('build / sourceCommit / environment / traffic','Release association and ordinary/test/bot classification','provenance'),
 ('activity.started/completed/abandoned','Attempt lifecycle with terminal outcome exactly once','events'),
 ('boot.started/ready/failed','Eligible boot attempts and result, when reportable','events'),
 ('story.opened/completed','Story lifecycle with explicit completion definition','events'),
 ('connection.attempt/result','Join attempts and outcomes, no room codes or media','events'),
 ('voice.playback/result','Recorded/family/device source outcome; no speech text or names','events'),
 ('backup.result / update.result','Operation result only; never backup contents','events')],
 'These events are a new protocol, not existing event-bus payloads. Full boot-failure population is unobservable when code never runs or sends. Use non-authoritative public telemetry with rate limits, not as proof of game rewards.', 'B08')
group('DELIVERY','delivery','proposed','netlify/lib/live.mts; js/custom.js; netlify/functions/studio.mts',
      'NEW revisioned mutation + POST /api/management/config-receipts','NEW revision/config/receipt tables; projections into existing public response',
      'Release / Change detail / Device detail','configuration.write proposed; acknowledgements contain no permission grants',[
 ('configRevision / contentRevision','Monotonic per-scope revisions assigned by service','integer'),
 ('scope / effectiveConfigHash','Resolved device scope and applied configuration fingerprint','scope + hash'),
 ('availableAt / fetchedAt / appliedAt','Evidence for separate delivery stages','timestamps'),
 ('applicationResult / reasonCode','Applied, rejected or unsupported; bounded failure reason','enum'),
 ('expectedDeviceCohort / observedDeviceCount','Snapshot of eligible recently reporting installations','counts + cohort timestamp'),
 ('previousRevision / actor / reason','Before/after change audit and optimistic concurrency','audit record')],
 'An offline device stays unconfirmed. No command may remotely overwrite saved progress. Revision acknowledgement means configuration handling, not that every feature was played.', 'B09')
group('MONEY','finance','proposed','NEW owner-entered ledger / provider billing adapters',
      'NEW /studio/api/management/finance/*','NEW private ledger, budgets, rate cards and imports',
      'Analytics / Finance','finance.read or finance.write proposed, owner-only initially',[
 ('provider / accountAlias / invoiceId / lineId','Source identity and duplicate-import key','identifiers'),
 ('periodStart / periodEnd / usageQuantity / usageUnit','Billing period and measured usage','date + quantity'),
 ('amountMinor / currency / taxMinor / category','Actual cost using integer minor units','money'),
 ('kind / recognisedAt / paidAt','Actual, estimate or commitment with distinct recognition/payment dates','classification'),
 ('budgetMinor / forecastMinor / asOf','Budget and dated forecast','money + timestamp'),
 ('fxRate / fxSource / fxAsOf','Explicit conversion into reporting currency','decimal + provenance'),
 ('revenueMinor / feeMinor / refundMinor','Only if an approved revenue model exists','money'),
 ('allocationRule / activeDeviceHours','Transparent cost allocation denominator','rule + measured hours')],
 'No current revenue or finance feed exists. Manual records first. Missing invoices mean incomplete spending, not zero. Reporting currency AUD is a proposal; never silently mix currencies.', 'B10')

NODES = [
 ('game','Children\'s game','existing','Play, local progress, reports'),
 ('website','Parent website /home','existing','Explanations, guides, Play entry'),
 ('studio','Private Studio','existing','Same UI and engine online/local'),
 ('catalogue','Versioned catalogues','existing','Activity, story, reward and release IDs'),
 ('live','Public live settings','existing','/api/live; bounded public content'),
 ('players','Game analytics','existing','/api/hello; players / bot-players'),
 ('webstats','Website counts','existing','/api/parent-analytics; aggregate events'),
 ('support','Private tester reports','existing','/api/tester; screenshots and receipts'),
 ('private','Local saves / private photos','existing','Independent permissions and recovery'),
 ('build','Reviewed build pipeline','existing','GitHub -> checks -> approved Netlify release'),
 ('management','Management read models','proposed','Joins, definitions, provenance, pagination'),
 ('ledger','Transactional event ledger','proposed','Attempt events, deduplication, rollups'),
 ('receipts','Configuration receipts','proposed','Available -> received -> applied'),
 ('finance','Private finance ledger','proposed','Manual/imported actuals and estimates')]
EDGES = [
 ('catalogue','game','CONTENT','Game reads versioned facts'),('catalogue','build','CONTENT','Review and generate website'),
 ('build','website','CONTENT','Publish reviewed parent explanations'),('studio','live','LIVE','Save approved live content'),
 ('live','game','LIVE','Fetch and keep configuration'),('game','players','DAY','Send bounded daily analytics'),
 ('website','webstats','WEB','Best-effort page and action counts'),('game','support','ISSUE','Entitled tester reports'),
 ('game','private','PRIVATE','Local progress and separate photo access'),('players','studio','ID','Read usage and device reports'),
 ('webstats','studio','WEB','Read aggregate website counts'),('support','studio','ISSUE','Triage and update status'),
 ('studio','build','OPS','Draft/publish or approved code release'),('players','management','DAY','Adapt existing records without inventing detail'),
 ('support','management','ISSUE','Join issue evidence'),('webstats','management','WEB','Keep site counts separate from game audience'),
 ('catalogue','management','CONTENT','Join by stable IDs and source revision'),('game','ledger','EVENT','New optional measurement protocol'),
 ('ledger','management','EVENT','Validated deterministic rollups'),('game','receipts','DELIVERY','New applied-revision acknowledgements'),
 ('receipts','management','DELIVERY','Observed delivery coverage'),('finance','management','MONEY','Budget and cost summaries'),
 ('management','studio','EVENT','Unified screens and attention list')]

METRICS = [
 ('M01','Reporting active installations','DAY','existing-derived','Count distinct id with m>0 or game starts>0 or stories opened>0 within period','installations','Do not label unique children or total audience.','B02'),
 ('M02','New observed installations','ID','existing-derived','Count distinct id whose earliest retained observed play date is in period','installations','Cleared storage and late first reports change this.','B02'),
 ('M03','Currently reporting online','ID','existing-derived','Count devices with active session presence newer than LIVE_MS (5 minutes)','installations','Presence is approximate; stale means unconfirmed/offline.','B03'),
 ('M04','Play time','DAY','existing-derived','Sum accepted days[].m for eligible ordinary traffic; exclude bot store','minutes','Menu/paused time follows existing producer hooks; not total screen time.','B02'),
 ('M05','Completion participation ratio','KID','existing-derived','Sum g[id][1] / sum g[id][0] over matching profile/device/day buckets','ratio','Not attempt conversion: split-screen creates two participations and late terminal events can cross windows.','B05'),
 ('M06','Early-exit participation ratio','KID','existing-derived','Sum g[id][2] / sum g[id][0] over matching buckets','ratio','Do not infer difficulty or dissatisfaction as a confirmed cause.','B05'),
 ('M07','Story opens','DAY','existing-derived','Sum days[].t','opens','No existing completion count should be invented.','B05'),
 ('M08','Sampled FPS','PERF','existing-derived','sum f[0] / sum f[1] when f[1]>0','FPS','Weighted by samples; do not average device averages.','B03'),
 ('M09','Low-FPS samples','PERF','existing-derived','sum f[2] / sum f[1] when f[1]>0','ratio','Current threshold below 20 FPS.','B03'),
 ('M10','Startup median','PERF','existing-derived','Median retained st[][2], split by st[][3] and originating build','milliseconds','Capped samples, not population p95.','B03'),
 ('M11','Measured active drawing FPS','BAT','existing-derived','sum b[1] / sum b[9] when seconds>0','FPS','Exclude idle and unmeasured intervals.','B03'),
 ('M12','Battery loss per measured hour','BAT','existing-derived','(sum b[7]/10) / (sum b[6]/60) when battery minutes>0','percentage points/hour','Unavailable on many browsers; never watts or device energy cost.','B03'),
 ('M13','Website page views','WEB','existing-derived','Sum pageViews counters for selected allowlisted routes','events','Not unique visitors, visits or people.','B03'),
 ('M14','Website Play clicks','WEB','existing-derived','Sum playConversions','clicks','Existing counter name does not mean a successful game start.','B03'),
 ('M15','Website reading time','WEB','existing-derived','Sum activeTimeTotalSec','seconds','Best-effort; no per-visitor retention or complete session funnel.','B03'),
 ('M16','Affected reporting devices','ISSUE','existing-derived','Distinct report id per problem/build within retained evidence','installations','Unreported devices are unknown; reporting count differs from total incidence.','B04'),
 ('M17','Open confirmed regressions','ISSUE','proposed','Count triaged problems with confirmed regression classification and nonterminal status','problems','Existing auto reports do not prove regression.','B04'),
 ('M18','Observed D7 return','EVENT','proposed','Eligible cohort installations observed active on cohortDay+7 / installations first active on cohortDay; exact-day definition','ratio','Only matured cohorts; late data window 7 days; label provisional; no cross-device person identity.','B08'),
 ('M19','Attempt completion','EVENT','proposed','Distinct completed attemptIds / eligible started attemptIds from same start cohort','ratio','Include pending outcomes separately; abandoned/expired definitions in contracts.','B08'),
 ('M20','Boot readiness','EVENT','proposed','Distinct boot IDs with ready / distinct reportable boot starts in start cohort','ratio','Never captures failures before instrumentation can run/send.','B08'),
 ('M21','First playable time p95','EVENT','proposed','Nearest-rank p95 of matched readyAt-startedAt within comparable build/device cohort','milliseconds','Show n; target at least 20 samples before directional status.','B08'),
 ('M22','Connection success','EVENT','proposed','Successful connection attemptIds / eligible connection attemptIds','ratio','Separate direct/relay and failures/timeouts; exclude synthetic runs.','B08'),
 ('M23','Recorded voice success','EVENT','proposed','Successful recorded playback events / attempted recorded playback events','ratio','Requires source/outcome instrumentation; missing-line inbox is not a denominator.','B08'),
 ('M24','Applied configuration coverage','DELIVERY','proposed','Eligible cohort devices acknowledging revision or later compatible effective hash / fixed eligible cohort size','ratio','Denominator from last-30-day reporting cohort snapshot; missing offline devices stay unconfirmed.','B09'),
 ('M25','Confirmed report recovery time','ISSUE','proposed','Median verifiedAt-firstReportedAt for comparable resolved cases','hours','Separate fixed-in-code, deployed and verified.','B04'),
 ('M26','Content recording coverage','CONTENT','proposed','Required static language/voice keys with playable verified recordings / required keys','ratio','Bounded static catalogue; dynamic lines and family recordings separately scoped.','B05'),
 ('M27','Website review coverage','CONTENT','proposed','Changed catalogue items with current source-linked review / items requiring review','ratio','Review lock is evidence of reviewed work, not automatic prose correctness.','B05'),
 ('M28','Actual operating cost','MONEY','proposed','Sum recognised actual expense lines in period after explicit currency conversion','reporting currency','Exclude estimates; show import completeness and tax basis.','B10'),
 ('M29','Budget remaining','MONEY','proposed','Approved period budget - recognised actual costs - separately reserved commitments','reporting currency','Display actual-only and commitment-adjusted balances separately.','B10'),
 ('M30','Monthly forecast','MONEY','proposed','Fixed monthly commitments + variable actual-to-date + remainingDays * trailing-7-complete-day variable mean','reporting currency','Avoid double-counting commitments; insufficient coverage -> unavailable.','B10'),
 ('M31','Cost per reporting active installation','MONEY','proposed','Comparable recognised actual operating cost / M01','currency/installation','Reporting subset denominator; not acquisition cost or unique customer cost.','B10'),
 ('M32','Cost per reported play hour','MONEY','proposed','Comparable actual operating cost / (M04/60)','currency/reported hour','Reporting opt-outs bias denominator.','B10'),
 ('M33','Contribution margin','MONEY','proposed','Recognised revenue - refunds - payment fees - attributed variable cost','reporting currency','Only after approved revenue model and accounting definitions.','B10'),
 ('M34','Quota headroom','OPS','proposed','Provider limit - current billed/observed usage in matching billing window','provider units','Unknown limit or stale feed means unavailable.','B11'),
 ('M35','Job success','OPS','proposed','Successful terminal workflow runs / terminal eligible runs','ratio','Queued/running/cancelled/retried visible separately.','B11'),
 ('M36','Delivery delay','DELIVERY','proposed','Applied receipt timestamp - availableAt for eligible compatible devices','seconds','Device clock can be wrong; validate and show receipt-time alternative.','B09'),
 ('M37','Days-to-quota estimate','OPS','proposed','Remaining quota / trailing-7-day matching usage mean','days','Only when same units/window and positive measured rate.','B11'),
 ('M38','Affected-device error proportion','DAY','existing-derived','Distinct active reporting installations with error>0 / distinct active reporting installations','ratio','Not crash-free sessions; no existing complete session outcomes.','B03')]

def dump(name, obj):
    (ROOT/name).write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n')

def diagrams():
    """Self-contained SVG illustrations, with accessible titles and no external fonts."""
    (ROOT/'images').mkdir(exist_ok=True)
    def diagram(name,title,subtitle,boxes,links,note):
        colors={'existing':('#e7f5ee','#18734b'),'proposed':('#fff1dc','#945600'),'private':('#f0eaff','#6942a8')}
        width,height=1200,780
        parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc"><title id="title">{html.escape(title)}</title><desc id="desc">{html.escape(subtitle+" "+note)}</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#52637b"/></marker></defs><rect width="1200" height="780" rx="24" fill="#f7f9fc"/><g font-family="Arial,sans-serif"><text x="40" y="52" font-size="30" font-weight="700" fill="#172a45">{html.escape(title)}</text><text x="40" y="84" font-size="17" fill="#52637b">{html.escape(subtitle)}</text>']
        for a,b,label in links:
            ax,ay,_,_,_=boxes[a]; bx,by,_,_,_=boxes[b]
            if ay==by:
                x1,y1,x2,y2=(ax+310,ay+62,bx,by+62) if bx>ax else (ax,ay+62,bx+310,by+62)
            else:
                x1,y1,x2,y2=ax+155,ay+124,bx+155,by
                if by<ay: x1,y1,x2,y2=ax+155,ay,bx+155,by+124
            parts.append(f'<path d="M{x1},{y1} L{x2},{y2}" stroke="#52637b" stroke-width="2.5" fill="none" marker-end="url(#arrow)"/>')
            if label:
                mx,my=(x1+x2)/2,(y1+y2)/2
                parts.append(f'<rect x="{mx-105}" y="{my-13}" width="210" height="26" rx="6" fill="#f7f9fc"/><text x="{mx}" y="{my+5}" text-anchor="middle" font-size="14" fill="#354962">{html.escape(label)}</text>')
        for k,(x,y,title2,body,status) in boxes.items():
            fill,stroke=colors[status]
            parts.append(f'<rect x="{x}" y="{y}" width="310" height="124" rx="16" fill="{fill}" stroke="{stroke}" stroke-width="2"/><text x="{x+18}" y="{y+27}" font-size="12" font-weight="700" fill="{stroke}">{status.upper()}</text><text x="{x+18}" y="{y+54}" font-size="20" font-weight="700" fill="#172a45">{html.escape(title2)}</text>')
            for i,line in enumerate(textwrap.wrap(body,35)[:2]):
                parts.append(f'<text x="{x+18}" y="{y+79+i*20}" font-size="16" fill="#354962">{html.escape(line)}</text>')
        for i,line in enumerate(textwrap.wrap(note,115)):
            parts.append(f'<text x="40" y="{700+i*23}" font-size="16" fill="#354962">{html.escape(line)}</text>')
        parts.append('</g></svg>')
        (ROOT/'images'/f'{name}.svg').write_text(''.join(parts))
    diagram('01-system','One product, three experiences','Read top to bottom. Green exists; amber is proposed; purple holds restricted data.',{
      'catalogue':(445,130,'Versioned facts','Activity IDs, stories, rewards','existing'),
      'game':(40,340,'Children play','Local progress; optional reports','existing'),
      'studio':(445,340,'Administrators manage','Content, releases, reports','existing'),
      'site':(850,340,'Parents understand','Reviewed website and guides','existing'),
      'mgmt':(445,550,'Management summaries','Connect evidence and decisions','proposed')},
      [('catalogue','game','Build game'),('catalogue','studio','Read facts'),('catalogue','site','Review + build'),('game','mgmt','Reporting'),('site','mgmt','Aggregate counts'),('mgmt','studio','Management views')],
      'Studio does not replace local saves. The website receives approved facts and explanations, never private child saves.')
    diagram('02-telemetry','How a game action reaches a Studio number','Example: completing one activity. Existing counters remain supported.',{
      'play':(40,140,'1. Child plays','ActivityCompleted on event bus','existing'),
      'queue':(445,140,'2. Device queues counts','Local outbox, day and build','existing'),
      'api':(850,140,'3. Server validates','/api/hello; receipt and retry','existing'),
      'report':(850,370,'4. Store and summarise','players; bots kept separately','existing'),
      'read':(445,370,'5. Studio reads','/studio/api/players','existing'),
      'future':(40,370,'Future attempt ledger','Exact start-to-outcome linking','proposed')},
      [('play','queue','Event listener'),('queue','api','Bounded batch'),('api','report','Accepted counts'),('future','read','New read adapter'),('report','read','Read aggregates')],
      'Current counts cannot reconstruct every attempt. New event IDs and terminal outcomes must be added before showing exact funnels.')
    diagram('03-delivery','Saved is different from applied','The top row exists. The lower row requires new delivery instrumentation.',{
      'save':(40,140,'1. Save in Studio','Validate scope and permission','existing'),
      'available':(445,140,'2. Available online','Public /api/live response','existing'),
      'fetch':(850,140,'3. Device fetches','Use and keep live settings','existing'),
      'revision':(40,390,'A. Assign revision','Expected revision prevents races','proposed'),
      'receipt':(445,390,'B. Receive applied receipt','Revision, hash, outcome; no saves','proposed'),
      'coverage':(850,390,'C. Show coverage','Eligible cohort + unconfirmed','proposed')},
      [('save','available','Save succeeds'),('available','fetch','Next refresh'),('save','revision','New contract'),('fetch','receipt','New acknowledgement'),('revision','receipt','Same revision'),('receipt','coverage','Observed evidence')],
      'Offline devices remain unconfirmed. Publishing a file or saving a switch is never evidence that every installation has applied it.')
    diagram('04-boundaries','Keep the data boundaries understandable','These collections serve different purposes and grant different permissions.',{
      'save':(40,140,'Progress and backups','On-device saves; explicit copies','private'),
      'photos':(445,140,'Private family photos','Approved device membership','private'),
      'stats':(850,140,'Statistics family code','Links statistics only','private'),
      'site':(40,390,'Public website','Approved facts and guides','existing'),
      'tele':(445,390,'Restricted analytics','May contain first names today','private'),
      'finance':(850,390,'Private finance','Owner-only ledger initially','proposed')},[],
      'There is deliberately no arrow from private saves/photos to the public website. Photo codes, statistics codes and progress copies are not interchangeable.')
    diagram('05-release','One reviewed release reaches both audiences','Existing publication gates remain. Management adds evidence, not automatic deployment.',{
      'source':(40,140,'1. Source changes','Stable IDs, game and Studio','existing'),
      'review':(445,140,'2. Review website','Regenerate facts; review copy','existing'),
      'tests':(850,140,'3. Verify candidate','CI + device visuals + budgets','existing'),
      'rollout':(40,390,'6. Observe rollout','Version and receipt coverage','proposed'),
      'deploy':(445,390,'5. Netlify deploy','Game + /home + functions','existing'),
      'owner':(850,390,'4. Owner approval','Explicit yes, deploy for round','existing')},
      [('source','review','Same source SHA'),('review','tests','Matching assets'),('tests','owner','Evidence'),('owner','deploy','Approved release'),('deploy','rollout','Report outcomes')],
      'A guide cannot promise content absent from its game build. A failed or skipped required check must stay visible; no automatic approval is created.')
    diagram('06-management','From one signal to an accountable action','A proposed management workflow using existing Studio evidence.',{
      'signal':(40,140,'1. Notice a signal','Error, low completion, cost rise','proposed'),
      'context':(445,140,'2. Inspect evidence','Build, samples, activity, device','proposed'),
      'owner':(850,140,'3. Assign an owner','Priority, next action, due date','proposed'),
      'verify':(40,390,'6. Confirm recovery','Retest and observe recurrence','proposed'),
      'release':(445,390,'5. Publish approved fix','Existing release process','existing'),
      'fix':(850,390,'4. Implement and test','Evidence on affected behavior','proposed')},
      [('signal','context','Drill down'),('context','owner','Triage'),('owner','fix','Build ticket'),('fix','release','Checks + approval'),('release','verify','Observe affected version')],
      'Correlation suggests an investigation. Only reviewed evidence confirms a cause. Fixed in code, deployed and verified are separate states.')
    cards=[('Attention','Problems needing review','Evidence -> owner -> next action'),('Audience','Reporting installations','Period, source day and late data'),('Experience','Measured reliability','Samples, build and device class'),('Content','Activity performance','Participations vs exact attempts'),('Money','Actual / estimate / budget','Source currency and completeness'),('Release','Available / applied / unknown','Exact source and eligible cohort')]
    p=['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="0 0 1200 820" role="img" aria-labelledby="title"><title id="title">Proposed Studio management Home wireframe, no live business data</title><rect width="1200" height="820" fill="#f3f6fb"/><g font-family="Arial,sans-serif"><rect width="1200" height="100" fill="#172a45"/><text x="32" y="44" fill="white" font-size="27" font-weight="700">Sparkle Studio | Management Home</text><text x="32" y="76" fill="#d8e4f3" font-size="16">PROPOSED WIREFRAME - labels only, no live or fabricated business figures</text><text x="32" y="143" font-size="17" fill="#354962">Period: selected range | Build: selected version | Traffic: ordinary | Data received: timestamp</text>']
    for i,(title,value,foot) in enumerate(cards):
        x=32+(i%3)*390;y=175+(i//3)*180
        p += [f'<rect x="{x}" y="{y}" width="356" height="150" rx="16" fill="white" stroke="#becde0"/><text x="{x+20}" y="{y+34}" font-size="22" font-weight="700" fill="#172a45">{html.escape(title)}</text><text x="{x+20}" y="{y+73}" font-size="18" fill="#24486f">{html.escape(value)}</text>']
        for j,line in enumerate(textwrap.wrap(foot,36)):
            p.append(f'<text x="{x+20}" y="{y+105+j*20}" font-size="15" fill="#52637b">{html.escape(line)}</text>')
    p += ['<rect x="32" y="550" width="1136" height="162" rx="16" fill="white" stroke="#becde0"/><text x="54" y="585" font-size="21" font-weight="700" fill="#172a45">Attention list</text><text x="54" y="623" font-size="17" fill="#354962">Priority | observed evidence | affected build/device scope | owner | next action</text><text x="54" y="665" font-size="16" fill="#52637b">Missing data is unavailable. Offline devices are unconfirmed. Clicks are not completed gameplay.</text><text x="32" y="766" font-size="17" fill="#354962">Keep navigation: Home | Family | Game | Analytics | Setup</text></g></svg>']
    (ROOT/'images'/'07-home-wireframe.svg').write_text(''.join(p))

def main():
    ROOT.mkdir(parents=True,exist_ok=True)
    points={'schema_version':1,'baseline_commit':BASELINE,'review_date':'2026-10-26 Australia/Sydney (AEDT)',
            'scope':'Management-relevant field families and current transport slots, not every gameplay save field.',
            'status_legend':{'existing':'Observed implementation at baseline; not a production access claim','proposed':'Design contract; requires implementation'},'data_points':ROWS}
    dump('data-points.json',points)
    with (ROOT/'data-points.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(ROWS[0]),lineterminator='\n');w.writeheader();w.writerows(ROWS)
    dump('connections.json',{'schema_version':1,'baseline_commit':BASELINE,
        'nodes':[dict(id=i,label=l,status=s,description=d) for i,l,s,d in NODES],
        'connections':[dict(id=f'C{i:02}',source=a,target=b,data_group=g,label=l,status='proposed' if a in ['management','ledger','receipts','finance'] or b in ['management','ledger','receipts','finance'] else 'existing') for i,(a,b,g,l) in enumerate(EDGES,1)]})
    dump('metrics.json',{'schema_version':1,'metrics':[dict(id=i,label=l,data_group=g,status=s,formula=f,unit=u,limitation=c,build_ticket=t) for i,l,g,s,f,u,c,t in METRICS]})
    paths=sorted(set(p for r in ROWS for p in re.findall(r'(?:js|home|netlify|studio|tools)/[\w./-]+\.(?:ts|mts|js|cts|mjs)',r['source']) if (REPO/p).is_file()))
    dump('source-evidence.json',{'baseline_commit':BASELINE,'meaning':'File hashes from inspected source. Recheck behavior when any source changes.', 'files':[{'path':p,'sha256':hashlib.sha256(subprocess.run(['git','show',BASELINE+':'+p],cwd=REPO,capture_output=True,check=True).stdout).hexdigest()} for p in paths]})
    (ROOT/'examples').mkdir(exist_ok=True)
    base=dict(schemaVersion=1,deviceId='demo12345678',sessionId='demo123456789012',attemptId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',occurredAt='2026-10-25T23:00:00Z',deviceDay='2026-10-26',offsetMinutes=660,build='v1.01',sourceCommit=BASELINE,environment='staging',traffic='synthetic_bot')
    fixture=[]
    event_data=[('activity.started',{'activityId':'oanquan','difficulty':'easy','mode':'solo'}),('activity.completed',{'activityId':'oanquan'}),('activity.abandoned',{'activityId':'oanquan','reason':'closed'}),('boot.started',{'stage':'boot'}),('boot.ready',{'stage':'first_playable','elapsedMs':1800}),('boot.failed',{'stage':'world','reasonCode':'timeout'}),('story.opened',{'storyId':'banhchung'}),('story.completed',{'storyId':'banhchung'}),('connection.attempt',{'transport':'relay'}),('connection.result',{'transport':'relay','outcome':'success','elapsedMs':900}),('voice.result',{'source':'recorded','outcome':'success','language':'vi'}),('update.result',{'outcome':'success','reasonCode':'none'}),('backup.result',{'outcome':'cancelled','reasonCode':'user_cancelled'})]
    for i,(name,data) in enumerate(event_data,1):
        fixture.append({**base,'eventId':f'{i:08x}-1111-4111-8111-111111111111','attemptId':f'{i:08x}-aaaa-4aaa-8aaa-aaaaaaaaaaaa','eventName':name,'data':data})
    dump('examples/events.json',{'notice':'Independent schema examples, not one consistent attempt history. Synthetic; never submit to production.','events':fixture})
    dump('examples/read-model.json',{'schemaVersion':1,'generatedAt':'2026-10-26T00:00:00Z','sourceAsOf':'2026-10-25T23:58:00Z','period':{'from':'2026-10-19','to':'2026-10-25','basis':'legacy-device-day'},'scope':{'traffic':'ordinary','build':'v1.01','deviceClass':'all'},'metrics':[{'id':'M08','value':28,'unit':'FPS','status':'observed','sampleCount':40},{'id':'M28','value':None,'unit':'AUD','status':'unavailable','sampleCount':0}],'quality':['reporting-devices-only','synthetic-example'],'nextCursor':None})
    dump('examples/config-receipt.json',{'schemaVersion':1,'deviceId':'demo12345678','scopeKey':'global','revision':7,'effectiveHash':'0'*64,'fetchedAt':'2026-10-25T23:00:00Z','appliedAt':'2026-10-25T23:00:01Z','result':'applied','reasonCode':'none'})
    dump('examples/finance-line.json',{'schemaVersion':1,'provider':'example-host','accountAlias':'synthetic-account','sourceDocumentId':'EXAMPLE-2026-10','sourceLineId':'1','kind':'actual','amountMinor':12000,'currency':'AUD','taxMinor':1200,'periodStart':'2026-10-01','periodEnd':'2026-10-31','recognisedAt':'2026-10-26T00:00:00Z','category':'hosting','expectedRevision':0})
    groups={}
    for row in ROWS:groups.setdefault(row['id'].split('-')[0],[]).append(row)
    md=['# Data dictionary and exact connection register','',
        'Generated from [tools/build.py](tools/build.py). Edit the source, regenerate, and review the diff. Machine-readable copies: [JSON](data-points.json), [CSV](data-points.csv), [graph](connections.json), [metric definitions](metrics.json).',
        '',f'Baseline: `{BASELINE}`. {len(ROWS)} management-relevant field entries; compact transport arrays are expanded slot by slot. This is not a claim to inventory every local gameplay-save field.','',
        'Existing means observed in source, not guaranteed production delivery. Proposed means new work. Field families such as festival settings are expanded further by their named runtime types; no unlisted key is automatically permitted.','',
        '![Action-to-report path](images/02-telemetry.svg)','']
    for key,rows in groups.items():
        first=rows[0]
        md += [f'## {key}: {first["domain"]} ({first["status"]})','',f'**Source:** `{first["source"]}`. **Transport:** `{first["transport"]}`.',
               f'**Storage:** {first["storage"]}. **Studio:** {first["screen"]}. **Access:** {first["access"]}.',
               '',first['caveat'],'','| ID | Field | Plain meaning | Unit |','|---|---|---|---|']
        md += ['| '+ ' | '.join(str(r[k]).replace('|',' / ') for k in ['id','field','meaning','unit'])+' |' for r in rows]
        md += ['',f'Implementation ticket: **{first["build_ticket"]}** in [build plan](06-BUILD-PLAN.md).','']
    (ROOT/'02-DATA-DICTIONARY.md').write_text('\n'.join(md))
    md=['# Metric definitions','', 'These definitions control labels, formulas and eligibility. Existing-derived means an adapter/report can derive a limited measure from existing data; it does not mean every proposed card exists. Proposed metrics require the named build ticket.','',
        'For every metric show period, timezone/bucket basis, source build, data freshness, sample size, ordinary/test traffic scope, formula version and limitations. Missing denominator means unavailable. Do not clamp a misleading ratio into 0–100%; surface the inconsistent data.','']
    for i,l,g,s,f,u,c,t in METRICS:
        md += [f'## {i}: {l}', '', f'- Status: **{s}**; data group: `{g}`; ticket: `{t}`.',f'- Formula: {f}.',f'- Unit: {u}.',f'- Interpretation limit: {c}', '']
    (ROOT/'03-METRICS.md').write_text('\n'.join(md))
    diagrams()
    build_html(points)
    print(f'Built {len(ROWS)} data points, {len(METRICS)} metrics, {len(EDGES)} connections, 7 SVG diagrams and HTML guide.')

def build_html(points):
    records=json.dumps(points['data_points'],ensure_ascii=False).replace('</','<\\/')
    metrics=json.dumps([dict(id=i,label=l,data_group=g,status=s,formula=f,unit=u,limitation=c,build_ticket=t) for i,l,g,s,f,u,c,t in METRICS],ensure_ascii=False).replace('</','<\\/')
    template='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sparkle Valley · Studio foundation</title>
<style>:root{font-family:system-ui,sans-serif;color:#172a45;background:#f3f6fb;line-height:1.55}*{box-sizing:border-box}body{margin:0}header{background:#172a45;color:white;padding:36px max(22px,calc((100vw - 1180px)/2));}header p{max-width:800px;color:#d8e4f3}h1{font-size:clamp(27px,4vw,44px);line-height:1.15;margin:10px 0}main{max-width:1220px;margin:auto;padding:24px 20px}nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}button,select,input{font:inherit;min-height:46px;border:1px solid #9dafc7;border-radius:9px;padding:9px 13px;background:white;color:#172a45}button{cursor:pointer}button[aria-pressed=true]{background:#24486f;color:white}a{color:#145d94}header a{color:#c9eaff}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.card,.panel{background:white;border:1px solid #d1ddeb;border-radius:15px;padding:20px;margin-bottom:16px}.badge{display:inline-block;border-radius:6px;padding:2px 8px;font-size:13px;font-weight:650;background:#e7f5ee;color:#18734b}.proposed{background:#fff1dc;color:#945600}.small{font-size:14px;color:#52637b}.toolbar{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}.toolbar input{flex:1;min-width:180px}.diagram{width:100%;height:auto}.tablewrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #dbe4ef}th{background:#edf2f8}code{overflow-wrap:anywhere;white-space:normal}details{padding:12px 0}summary{cursor:pointer;min-height:44px;font-weight:600}dl{margin:0}dt{font-weight:bold;margin-top:10px}dd{margin:2px 0 8px;overflow-wrap:anywhere}[hidden]{display:none!important}.steps{counter-reset:step}.steps p{padding:12px;border-left:4px solid #24486f;background:#edf2f8}.steps p:before{counter-increment:step;content:counter(step) ". ";font-weight:bold}footer{padding:24px 0}.printonly{display:none}@media(max-width:600px){header{padding:24px 20px}.card,.panel{padding:15px}main{padding:20px 12px}th,td{padding:9px}nav button{flex:1 1 42%}}@media print{nav,.toolbar{display:none}section[hidden]{display:block!important}header{background:white;color:#172a45;padding:0}header p{color:#172a45}body{background:white}.card,.panel{break-inside:avoid}a{color:inherit}.printonly{display:block}}</style>
<header><div>IMPLEMENTATION HANDBOOK · 26 OCTOBER 2026 AEDT</div><h1>One game. One website.<br>A Studio that connects the evidence.</h1><p>A source-grounded blueprint for Sparkle Valley. Green means existing code; amber means proposed work. This guide does not operate the live game or publish changes.</p><a href="README.md">Reading guide</a> · <a href="HANDBOOK.md">Full handbook</a> · <a href="06-BUILD-PLAN.md">Build tickets</a></header>
<main><p class="panel"><strong>27 October 2026 AEDT implementation update:</strong> child names with their devices are included in authorised private reporting; finance input is now authorised and implemented in code. This visual register remains the historical design. <a href="IMPLEMENTATION.md">Open current implementation, real screen captures and remaining work</a>.</p><nav aria-label="Guide sections"><button data-tab="implementation" aria-pressed="false">Implementation status</button><button data-tab="overview" aria-pressed="true">Understand</button><button data-tab="data" aria-pressed="false">Explore data</button><button data-tab="metrics" aria-pressed="false">Understand numbers</button><button data-tab="build" aria-pressed="false">Build in order</button><button data-tab="visuals" aria-pressed="false">Visual maps</button></nav>
<section id="overview"><div class="cards"><article class="card"><span class="badge">Existing</span><h2>Children play</h2><p>The game owns play and saves on each device. Optional analytics report bounded activity information.</p></article><article class="card"><span class="badge">Existing</span><h2>Parents understand</h2><p>The website explains the released game. Its event counts do not identify unique children.</p></article><article class="card"><span class="badge proposed">Proposed</span><h2>Administrators decide</h2><p>Studio connects an observed signal to its source, affected version, owner and safe next action.</p></article></div><img class="diagram" src="images/01-system.svg" alt="System map: versioned facts feed the game, Studio and reviewed website, with proposed management summaries beneath."><div class="panel"><h2>Do not confuse these three things</h2><p><strong>Statistics linking</strong> groups reporting installations. <strong>Photo sharing</strong> requires private membership. <strong>Progress transfer</strong> uses an explicit backup and restore. One does not grant the others.</p><p>Current game analytics may include first names and age groups. Proposed business reports should not expose those fields unnecessarily.</p></div><div class="panel"><h2>Start with one example</h2><p>A child completes Ô Ăn Quan. Its existing activity event becomes a bounded daily counter, goes through /api/hello, is cleaned and stored, then appears in Studio's report. Exact attempt funnels need new attempt IDs; website Play clicks alone cannot confirm this gameplay.</p><a href="HANDBOOK.md">Read the complete plain-language walkthrough</a></div></section>
<section id="data" hidden><h2>Follow each data point</h2><p>Search a field, question, file, transport, screen or build ticket. Expand a row to see the full path.</p><div class="toolbar"><input id="search" type="search" aria-label="Search data points" placeholder="Try battery, first name, delivery, money…"><select id="status" aria-label="Filter status"><option value="">All statuses</option><option value="existing">Existing</option><option value="proposed">Proposed</option></select><select id="domain" aria-label="Filter domain"><option value="">All domains</option></select></div><p id="count" aria-live="polite"></p><div id="rows"></div><p><a href="data-points.csv">Download the CSV register</a> · <a href="data-points.json">Open the machine-readable register</a></p></section>
<section id="metrics" hidden><h2>What each number actually means</h2><p>These are definitions, not fabricated live business figures. Missing measurements must show unavailable.</p><div class="toolbar"><input id="metric-search" type="search" aria-label="Search metric definitions" placeholder="Try cost, completion, return, startup…"></div><div id="metric-rows"></div></section>
<section id="build" hidden><h2>Build one verifiable slice at a time</h2><div class="steps"><p>B01–B02: Agree scope and definitions. Adapt existing data without changing gameplay.</p><p>B03–B05: Ship read-only Home, attention, activity and device pages with provenance.</p><p>B06–B07: Explain availability, permissions and change history.</p><p>B08: Add validated attempt events and transactional storage before exact funnels.</p><p>B09: Add revisioned settings and device application receipts.</p><p>B10–B11: Add private finance and provider/job integrations.</p><p>B12: Validate, migrate safely and obtain release approval.</p></div><div class="panel"><h3>Every ticket has a stopping point</h3><p>Read its prerequisites, file boundaries, data contract and acceptance criteria. A missing provider account, database or real-device check stays recorded as an unmet prerequisite. Never invent successful delivery, cost or learning data.</p><a href="06-BUILD-PLAN.md">Open detailed build tickets</a> · <a href="07-VALIDATION.md">Open acceptance scenarios</a> · <a href="08-DECISIONS.md">Open decision register</a></div></section>
<section id="visuals" hidden><h2>Visual maps</h2>__IMAGES__</section>
<section id="implementation" hidden><h2>How the recorded plan connects to the working code</h2><p class="panel">The original B01–B12 plan is still the reference. <a href="PLAN-TRACEABILITY.md">Open the complete ticket-to-code table</a>. Current code incorporates the already released v1.02. The new Studio and finance work has not been deployed, and this offline guide cannot operate the game or spend money.</p><div class="cards"><article class="panel"><h3>Game, website and Studio</h3><p>Private first names stay linked to reporting installations. Game attempts/outcomes and website clicks remain separate observations, with explicit missing-data limits.</p><a href="IMPLEMENTATION.md">Connections and current limits</a></article><article class="panel"><h3>Configuration and operations</h3><p>Saved, publicly available and device-applied configuration are separate states. Provider checks, recent workflow outcomes and bounded operations preserve audit evidence.</p><a href="NETLIFY-AND-OPERATIONS.md">Netlify SQL and operations guide</a></article><article class="panel"><h3>Private Finance · B10</h3><p>Manual entries and CSV imports require preview and confirmation. Corrections preserve versions. Original currency, tax and FX stay explicit; budgets and forecasts show completeness limits.</p><a href="FINANCE.md">Finance handbook and exact rules</a></article></div><div class="panel"><h3>Finance: follow these steps</h3><ol><li>Connect the intended Netlify database branch and explicitly apply migration v2.</li><li>Start the private ledger and choose the reporting currency before the first entry.</li><li>Enter or import stable invoice/document and line IDs. Keep source currency and tax separate.</li><li>Preview new, duplicate and corrected rows, then confirm with a reason.</li><li>Reconcile source documents and state coverage before trusting complete totals.</li><li>Read invoice and cash views separately. Missing FX, zero reporting hours or unmet forecast conditions stay unavailable.</li></ol><p>No payments or automatic billing changes are made. The ledger is not a tax return or an approved revenue-attribution model.</p></div><figure class="panel"><img class="diagram" src="current/finance-flow.svg" alt="Finance source-to-private-Studio flow"><figcaption>Follow one source line through preview, transaction, history and qualified summaries.</figcaption></figure><h3>Actual authenticated Finance screens · synthetic invoices only</h3><div class="cards"><figure class="panel"><a href="screenshots/implementation/en-390-finance.png"><img style="width:100%;height:260px;object-fit:contain" src="screenshots/implementation/en-390-finance.png" alt="English Finance on a phone"></a><figcaption>Phone; open image for the full screen.</figcaption></figure><figure class="panel"><a href="screenshots/implementation/vi-820-finance.png"><img style="width:100%;height:260px;object-fit:contain" src="screenshots/implementation/vi-820-finance.png" alt="Vietnamese Finance on a tablet"></a><figcaption>Tablet, Vietnamese.</figcaption></figure><figure class="panel"><a href="screenshots/implementation/en-1440-finance.png"><img style="width:100%;height:260px;object-fit:contain" src="screenshots/implementation/en-1440-finance.png" alt="English Finance on a computer"></a><figcaption>Computer, English.</figcaption></figure></div><div class="panel"><h3>Keep remaining work visible</h3><p>Live Netlify/provider access, retention/deletion and database recovery, specialised revisioned editors, reporting scale and rendering budgets remain separate work. <a href="IMPLEMENTATION-VALIDATION.md">Open the exact local/GitHub validation record</a>; a queued workflow is never a passing result.</p></div></section>
<footer class="small">Baseline ac76cf6097a8071bf2da4be90fe81fd0af8201d6 · Historical design register, with current implementation linked above · Opens offline with no analytics, external fonts or network calls. <a href="04-CONTRACTS.md">Contracts</a> · <a href="05-SCREENS-AND-OPERATIONS.md">Screens and operations</a></footer></main>
<script id="data-json" type="application/json">__DATA__</script><script id="metrics-json" type="application/json">__METRICS__</script><script>
const points=JSON.parse(document.getElementById('data-json').textContent),metrics=JSON.parse(document.getElementById('metrics-json').textContent);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ids=['implementation','overview','data','metrics','build','visuals'];function tab(id){if(!ids.includes(id))id='overview';for(const k of ids)document.getElementById(k).hidden=k!==id;for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-pressed',String(b.dataset.tab===id));history.replaceState(null,'','#'+id)}for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>tab(b.dataset.tab);tab(location.hash.slice(1)||'overview');
const domain=document.getElementById('domain');for(const d of [...new Set(points.map(x=>x.domain))].sort()){const o=document.createElement('option');o.value=o.textContent=d;domain.append(o)}
function render(){const q=document.getElementById('search').value.toLowerCase(),s=document.getElementById('status').value,d=domain.value;const rows=points.filter(r=>(!s||r.status===s)&&(!d||r.domain===d)&&(!q||Object.values(r).join(' ').toLowerCase().includes(q)));document.getElementById('count').textContent=rows.length+' of '+points.length+' data points';document.getElementById('rows').innerHTML=rows.length?rows.map(r=>'<article class="panel"><span class="badge '+(r.status==='proposed'?'proposed':'')+'">'+esc(r.status)+'</span> <code>'+esc(r.id)+'</code><h3>'+esc(r.meaning)+'</h3><code>'+esc(r.field)+'</code><details><summary>Follow source → storage → Studio</summary><dl>'+[['Source',r.source],['Transport',r.transport],['Storage',r.storage],['Studio destination',r.screen],['Access',r.access],['Unit',r.unit],['Interpretation limit',r.caveat],['Build ticket',r.build_ticket]].map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>').join('')+'</dl></details></article>').join(''):'<p role="status">No matching data points. Clear a filter or try another word.</p>'}
for(const e of [document.getElementById('search'),document.getElementById('status'),domain])e.addEventListener(e.tagName==='INPUT'?'input':'change',render);render();function renderMetrics(){const q=document.getElementById('metric-search').value.toLowerCase();const m=metrics.filter(r=>Object.values(r).join(' ').toLowerCase().includes(q));document.getElementById('metric-rows').innerHTML=m.length?m.map(r=>'<article class="panel"><span class="badge '+(r.status==='proposed'?'proposed':'')+'">'+esc(r.status)+'</span><h3>'+esc(r.id+' · '+r.label)+'</h3><p><strong>Formula:</strong> '+esc(r.formula)+'</p><p><strong>Unit:</strong> '+esc(r.unit)+'</p><p><strong>Limit:</strong> '+esc(r.limitation)+'</p><a href="06-BUILD-PLAN.md">'+esc(r.build_ticket)+' implementation ticket</a></article>').join(''):'<p role="status">No matching metrics.</p>'}document.getElementById('metric-search').oninput=renderMetrics;renderMetrics();</script></html>'''
    imgs=''.join(f'<figure class="panel"><img class="diagram" src="images/{n}.svg" alt="{html.escape(t)}"><figcaption>{html.escape(t)}</figcaption></figure>' for n,t in [
        ('01-system','System responsibilities'),('02-telemetry','Action to report'),('03-delivery','Save to application receipts'),('04-boundaries','Private and public boundaries'),('05-release','Reviewed release path'),('06-management','Signal to verified recovery'),('07-home-wireframe','Proposed Studio Home')])
    (ROOT/'index.html').write_text(template.replace('__DATA__',records).replace('__METRICS__',metrics).replace('__IMAGES__',imgs))

if __name__=='__main__':main()
