import { round, bounded, bounds } from './finance-values.mts';
import * as admins from '../admins.mts';
import { ManagementError } from './transactional/types.mts';
import { ManagementReadError } from './quality.mts';
import { managementOperations } from './operations.mts';
import { managementEnv } from './runtime.mts';
import { metric } from './metrics.mts';

export const managementJson = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
export async function managementBody(req: Request) {
  const reader = req.body?.getReader(); if (!reader) throw new ManagementError(400, 'body_required');
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) { const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength; if (size > 250000) { await reader.cancel(); throw new ManagementError(413, 'body_too_large'); } chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ManagementError(400, 'invalid_json'); }
}
export const managementFailure = (error) => error instanceof ManagementError || error instanceof ManagementReadError
  ? managementJson({ error: error.message, code: error.code }, error.status)
  : managementJson({ error: 'Management source unavailable. No change has been confirmed.', code: 'management_source_unavailable' }, 503);

/** Called only after Studio authentication. Permissions are also checked here for direct callers. */
export async function managementHttp(req: Request, me, { reads, service, operations = undefined, finance = undefined, catalogue = () => [], log = async (..._args) => {} }) {
  try {
    const url = new URL(req.url), route = decodeURIComponent(url.pathname.split('/studio/api/')[1] || '');
    const post = req.method === 'POST';
    if (!['GET', 'POST'].includes(req.method)) return managementJson({ error: 'method_not_allowed' }, 405);
    if (!admins.allowed(me, route, post)) return managementJson({ error: 'permission_required', need: admins.needs(route, post) }, 403);
    const path = route.slice('management/'.length), q = url.searchParams;
    const context = { includeProfileContext: admins.allowed(me, 'management/children', false) };
    await log(me.name, me.role, 'management', path);
    if(path==='finance'||path.startsWith('finance/')) {
      if(!finance)throw new ManagementError(503,'management_database_not_configured');
      if(!post){
        if(path==='finance'){
          const result=await finance.snapshot({month:q.get('month')||new Date().toLocaleDateString('en-CA',{timeZone:'Australia/Sydney'}).slice(0,7),basis:q.get('basis')||'invoice'});
          if(result.summary){result.summary.costPerActiveMinor=null;result.summary.costPerHourMinor=null;result.summary.denominators=null;
            if(result.summary.comparable&&result.basis==='invoice')try{const period=bounds(result.month),usage=await reads.overview(new URLSearchParams({from:period.start,to:period.end,traffic:'ordinary'}));
              const devices=usage.totals.activeDevices,mins=usage.totals.mins;
              result.summary.denominators={reportingActiveInstallations:devices,reportedMinutes:mins,basis:'legacy_device_calendar_dates',limitations:['reporting_subset','analytics_opt_out_bias','not_unique_children_or_customers']};
              if(Number.isSafeInteger(devices)&&devices>0)result.summary.costPerActiveMinor=bounded(round(BigInt(result.summary.actualCostMinor),BigInt(devices)));
              if(Number.isSafeInteger(mins)&&mins>0)result.summary.costPerHourMinor=bounded(round(BigInt(result.summary.actualCostMinor)*60n,BigInt(mins)));
            }catch{result.quality.push('finance_game_denominators_unavailable');}}
          return managementJson(result);
        }
        if(path==='finance/export')return new Response(await finance.exportCsv(),{headers:{'Content-Type':'text/csv; charset=utf-8','Cache-Control':'private, no-store','Content-Disposition':'attachment; filename="studio-finance.csv"','X-Content-Type-Options':'nosniff'}});
        if(path.startsWith('finance/history/budget/'))return managementJson(await finance.budgetHistory(path.slice('finance/history/budget/'.length)));
        if(path.startsWith('finance/history/'))return managementJson(await finance.history(path.slice('finance/history/'.length)));
      }else{const body=await managementBody(req);
        if(path==='finance/settings')return managementJson(await finance.configure(body,me.name));
        if(path==='finance/preview')return managementJson(await finance.preview(body));
        if(path==='finance/commit')return managementJson(await finance.commit(body,me.name));
        if(path==='finance/budget')return managementJson(await finance.budget(body,me.name));
      }
      throw new ManagementError(404,'finance_route_not_found');
    }
    if (!post) {
      if (path === 'overview') {
        const result = await reads.overview(q);
        if (service.configured() && !q.get('child') && (!q.get('deviceClass') || q.get('deviceClass') === 'all')) {
          try {
            const attempts = await service.attemptSummary({ from: result.period.from+'T00:00:00Z',
              to: new Date(Date.parse(result.period.to+'T00:00:00Z')+86400000).toISOString(),
              ...(result.scope.build === 'all' ? {} : { build: result.scope.build }), traffic: result.scope.traffic, environment: 'production' });
            result.metrics = result.metrics.filter(m=>m.id!=='M19');
            result.metrics.push(metric('M19', 'Reported attempt completion', attempts.completionRate, 'ratio', attempts.eligible,
              'Production UTC event window. Reporting attempts only; pending and unknown outcomes remain in the denominator. Not legacy profile participations.'));
            result['attempts'] = attempts; result.capabilities.exactAttempts = true;
            const telemetry = await service.eventSummary({from:attempts.from,to:attempts.to,environment:'production',traffic:result.scope.traffic,...(result.scope.build==='all'?{}:{build:result.scope.build})});
            result['telemetry'] = telemetry;
            const replacements = [metric('M20','Reportable boot-phase readiness',telemetry.boot.successRate,'ratio',telemetry.boot.eligible,'Reporting phase starts at players-module evaluation; earlier import/crash failures are invisible. Pending and unknown outcomes remain in the denominator.'),
              metric('M22','Reported connection-attempt success',telemetry.connections.successRate,'ratio',telemetry.connections.eligible,'Matched attempts/results only; pending and unknown outcomes remain in the denominator.'),
              metric('M23','Confirmed recorded-voice playback success',telemetry.voice.recorded.confirmedSuccessRate,'ratio',telemetry.voice.recorded.confirmed,'Browser completion/error observations only. Cancelled and watchdog/unknown results are excluded and shown separately.')];
            result.metrics = result.metrics.filter(m=>!replacements.some(r=>r.id===m.id)); result.metrics.push(...replacements);
            if(result.scope.build==='all'&&result.scope.traffic==='ordinary') {
              const latest=(await service.listChanges()).find(c=>String(c.createdAt)>=attempts.from&&String(c.createdAt)<attempts.to);
              if(latest){result.metrics=result.metrics.filter(m=>m.id!=='M24');result.metrics.push(metric('M24','Latest selected configuration receipt coverage',latest.eligibleCount?latest.applied/latest.eligibleCount:null,'ratio',latest.eligibleCount,'Current self-reported receipts for the latest revision saved within this period. The denominator is its fixed reporting-installation cohort.'));}
            }

          } catch { result.quality.push('event-attempt-summary-unavailable'); }
        }
        return managementJson(result);
      }
      if (path === 'devices') return managementJson(await reads.devices(q, context));
      if (path === 'children') return managementJson(await reads.children(q, context));
      if (path.startsWith('devices/')) {
        const id=path.slice(8),result=await reads.device(id,q,context);
        if(service.configured())try{result['delivery']=await service.deviceDelivery(id);}catch{result.quality.push('device-delivery-unavailable');}
        return managementJson(result);
      }
      if (path === 'activities') return managementJson({ schemaVersion: 1, generatedAt: new Date().toISOString(), activities: catalogue(), quality: ['static-source-catalogue'] });
      if (path.startsWith('activities/')) {
        const result = await reads.activity(path.slice(11), q, context);
        if(service.configured()&&!q.get('child')&&!q.get('search')&&(!q.get('deviceClass')||q.get('deviceClass')==='all')) {
          const query={from:result.period.from+'T00:00:00Z',to:new Date(Date.parse(result.period.to+'T00:00:00Z')+86400000).toISOString(),environment:'production',traffic:result.scope.traffic,...(result.scope.build==='all'?{}:{build:result.scope.build})};
          try {result['detailedOutcomes']=result.activity.kind==='story'?(await service.eventSummary(query,result.activity.id)).stories:await service.attemptSummary(query,result.activity.id);}
          catch{result.quality.push('detailed-outcomes-unavailable');}
        }
        return managementJson(result);
      }
      if (path === 'attention') return managementJson({ ...await reads.attention(q), assignments: service.configured() ? await service.listAttention() : [], transactional: service.configured() });
      if (path.startsWith('releases/')) return managementJson(await reads.release(path.slice(9), q));
      if (path === 'config') return managementJson({ configured: service.configured(), config: service.configured() ? await service.getConfig('global') : null, changes: service.configured() ? await service.listChanges() : [] });
      if (path.startsWith('changes/')) {
        if (!context.includeProfileContext) return managementJson({ error: 'device_context_permission_required' }, 403);
        return managementJson(await service.changeCoverage(path.slice(8)));
      }
      if (path === 'operations' && operations) return managementJson(await operations.snapshot());
      if (path === 'operations') return managementJson(managementOperations({ configured: {
        database: service.configured(), githubRead: !!managementEnv('GITHUB_TOKEN'), githubDispatch: !!managementEnv('GITHUB_TOKEN'),
        netlifyRead: !!managementEnv('NETLIFY_TOKEN'), voiceGeneration: !!managementEnv('AZURE_KEY'),
        managementEvents: service.configured(), configurationReceipts: service.configured() } }));
    } else {
      const body = await managementBody(req);
      if (path === 'operations/run') {
        if (!operations) throw new ManagementError(503, 'operations_not_connected');
        if (body.kind === 'bot' && !admins.allowed(me, 'bot/run', true)) return managementJson({ error: 'website_permission_required' }, 403);
        if (body.kind === 'retry_configuration' && !admins.allowed(me, 'management/config', true)) return managementJson({ error: 'configuration_permission_required' }, 403);
        return managementJson(await operations.run(body, me.name));
      }
      if (path === 'operations/refresh') {
        if (!operations) throw new ManagementError(503, 'operations_not_connected');
        return managementJson(await operations.snapshot(true));
      }
      if (path === 'config/project') return managementJson(await service.projectLatest('global'));
      if (path === 'config') {
        if (body.scopeKey !== 'global') throw new ManagementError(400, 'only_global_scope_supported');
        const permission = body.kind === 'rules' ? 'live' : 'live/content';
        if (!admins.allowed(me, permission, true)) return managementJson({ error: 'existing_edit_permission_required' }, 403);
        if (body.rollbackRevision !== undefined && (!admins.allowed(me, 'live', true) || !admins.allowed(me, 'live/content', true)))
          return managementJson({ error: 'rollback_requires_release_and_content_permissions' }, 403);
        // Cohort comes from reporting records, never from user-supplied counts.
        const eligibleDeviceIds: string[] = []; let cursor = '';
        do {
          const page = await reads.devices({ limit: '100', ...(cursor ? { cursor } : {}) });
          eligibleDeviceIds.push(...page.devices.filter(d => d.days > 0).map(d => d.id));
          if (eligibleDeviceIds.length > 10000) throw new ManagementError(503, 'cohort_requires_rollup');
          cursor = page.nextCursor || '';
        } while (cursor);
        const changed = await service.changeConfig({ ...body, eligibleDeviceIds }, me.name);
        const projection = await service.projectLatest('global');
        return managementJson({ ...changed, state: projection.ok ? 'available' : 'pending_projection', projection, cohortStatus: 'reporting_installations_at_save' }, projection.ok ? 200 : 202);
      }
      if (path.startsWith('attention/')) return managementJson(await service.updateAttention(path.slice(10), body, me.name));
    }
    return managementJson({ error: 'management_route_not_found' }, 404);
  } catch (error) { return managementFailure(error); }
}
