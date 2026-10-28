// Reproducible source inventory. Reads only explicit, public versioned source paths;
// never loads custom/family content, credentials, browser runtime or remote services.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { exportManagementCatalogue, literalOf } from '../../../tools/export-management-catalogue.mts';

const folder=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),root=path.resolve(folder,'../..');
const sources=new Map<string,string>();
const source=(file:string)=>{if(!sources.has(file))sources.set(file,fs.readFileSync(path.join(root,file),'utf8'));return sources.get(file)!;};
const sha=(s:string)=>crypto.createHash('sha256').update(s).digest('hex');
function evaluate(expression:string,context:Record<string,unknown>={}){
 return JSON.parse(new vm.Script(`JSON.stringify(${expression})`).runInContext(vm.createContext(context,{codeGeneration:{strings:false,wasm:false}}),{timeout:1500}));
}
function literal(file:string,name:string){return evaluate('('+literalOf(source(file),name)+')');}
function moduleValue(file:string,name:string,context:Record<string,unknown>={}){
 const code=stripTypeScriptTypes(source(file),{mode:'strip'}).replace(/^import[^\n]*;\s*$/gm,'').replace(/\bexport\s+(?=(const|function|async)\b)/g,'');
 return JSON.parse(new vm.Script(code+'\n;JSON.stringify('+name+');').runInContext(vm.createContext(context,{codeGeneration:{strings:false,wasm:false}}),{timeout:1500}));
}
const domains=[
 ['games','Games and learning'],['stories','Stories and private family content'],['quests','Quests and missions'],['rewards','Rewards, economy and unlocks'],['festivals','Festivals and schedules'],['world','World and transport'],['social','Multiplayer and social'],['media','Voice and media'],['website','Website and marketing'],['people','People and devices'],['quality','Quality and releases'],['services','Services and operations'],['finance','Finance']
].map(([id,label])=>({id,label,status:'partial_source_inventory',limitations:['Static source declarations do not prove runtime playability or working control.']}));
type Item={key:string;kind:string;id:string;domain:string;label:string;sourceFile:string;declaration:string;controls:string[];evidence:Record<string,unknown>};
const items:Item[]=[];
function add(kind:string,id:string,domain:string,label:string,file:string,declaration:string,controls:string[]=[],evidence:Record<string,unknown>={}){
 if(!id||items.some(i=>i.key===kind+':'+id))throw new Error('Invalid/duplicate item '+kind+':'+id);
 source(file);items.push({key:kind+':'+id,kind,id,domain,label,sourceFile:file,declaration,controls,evidence:{sourceExistence:'confirmed',runtimePlayability:'not_audited',controlEffect:'not_audited',...evidence}});
}
const catalogue=exportManagementCatalogue(root);
for(const e of catalogue.entries)add(e.kind,e.id,e.kind==='game'?'games':'stories',e.name.en,e.sourceFile,e.kind==='game'?'GAME_CATALOG / reading registration':'TALES / MORE_TALES',e.unlock.featureId?[e.unlock.featureId]:[],{catalogueMetadata:e.coverage.metadata,implementationReference:e.coverage.implementation,bilingual:e.coverage.bilingual,guideAnchor:e.guide.verified,guideSourceAligned:e.guide.sourceAligned,dependencyIds:e.unlock.prerequisites});
for(const key of catalogue.coverage.declaredSecondSetMissingMetadata){const [kind,id]=key.split(':');add('declared-'+kind,id,kind==='game'?'games':'stories',id,'js/content/secondset.ts','SECOND_SET_GAMES / SECOND_SET_TALES',[kind==='game'?'newGames':'newStories'],{catalogueMetadata:false,implementationReference:'unknown',gap:'declared_id_absent_from_catalogue'});}
const festivals=literal('js/content/festcal.js','FESTCAL');
for(const f of festivals)add('festival',f.id,'festivals',f.en,'js/content/festcal.js','FESTCAL',['fest_'+f.id],{sharedPolicySource:'js/content/festival-visibility.ts',websiteConsumer:'home/live-visibility.js',runtimeConsumer:'js/festivals.ts'});
for(const m of literal('js/content/familymissions.js','FAMILY_MISSIONS'))add('mission',m.id,'quests',m.en,'js/content/familymissions.js','FAMILY_MISSIONS',['familyMissions'],{privateAuthoredMissions:'excluded',individualSelection:'device_parent_settings_not_revisioned_Studio_control'});
for(const c of literal('js/content/chapters.ts','CHAPTERS')){
 add('chapter',c.id,'stories',c.en,'js/content/chapters.ts','CHAPTERS',['story_'+c.id],{steps:c.steps.length});
 for(const step of c.steps)add('quest-step',c.id+'.'+step.id,'quests',step.en,'js/content/chapters.ts','CHAPTERS.steps',['story_'+c.id],{chapter:c.id,stepId:step.id,individualControl:'not_established'});
}
for(const a of moduleValue('js/content/adventures.js','ADVENTURES'))add('adventure',a.id,'quests',a.en||a.id,'js/content/adventures.js','ADVENTURES',['adventure'],{steps:a.steps.length,individualControl:'not_established'});
for(const [id] of Object.entries(literal('js/content/jobs.js','JOBS')))add('job-board',id,'quests',id,'js/content/jobs.js','JOBS',['jobs'],{unit:'place_job_board_not_individual_job',individualJobIds:'not_declared'});
for(const c of moduleValue('js/content/shop.js','CLOTHES'))add('clothing',c.id,'rewards',c.en||c.id,'js/content/shop.js','CLOTHES',['shop'],{individualAvailabilityControl:'not_established'});
for(const s of moduleValue('js/content/stickers.js','STICKERS'))add('sticker',s.id,'rewards',s.en||s.id,'js/content/stickers.js','STICKERS',['collectibles'],{individualAvailabilityControl:'not_established'});
for(const [decl,kind]of [['PLACES','place'],['WATERS','water'],['BRIDGES','bridge'],['ROADS','road'],['SHRINES','shrine'],['TOWERS','tower'],['LEAFIES','leafy'],['BOATS','boat']] as const){
 for(const x of moduleValue('js/content/map.js',decl)){if(!x.id)throw new Error(decl+' has an item without an ID');add(kind,x.id,'world',x.en||x.id,'js/content/map.js',decl,[],{controlMechanism:'source_build_change',coordinates:'excluded_from_management_export'});}
}
for(const s of literal('js/content/songs.js','SONG_LIST'))add('song-placement',s.group+'.'+s.key+(s.alt?'.'+s.alt:''),'media',s.key,'js/content/songs.js','SONG_LIST',[],{tuneKey:s.key,group:s.group,unit:'menu_placement_not_unique_tune',familyRecordings:'excluded',individualControl:'not_established'});
// These domains have live/private/provider resources, not public enumerable children.
// Register their actual source-backed mechanisms without pretending they enumerate private entities.
for(const [kind,id,domain,label,file,decl] of [
 ['system','shared-play','social','Shared game/session adapter','js/games/shared-board-session.ts','createSharedBoardSession'],
 ['system','family-service','social','Private family service','netlify/functions/family.mts','family endpoint'],
 ['surface','website','website','Public family website','home/index.html','reviewed website'],
 ['system','marketing-events','website','Aggregate website observations','netlify/functions/parent-analytics.mts','allowlisted event ingestion'],
 ['system','profiles-devices','people','Permitted profile/installation reporting','netlify/lib/management/read.mts','children / devices'],
 ['system','quality-followup','quality','Report follow-up','netlify/lib/management/transactional/service.mts','attention transitions'],
 ['system','bounded-operations','services','Bounded provider operations','netlify/lib/management/operations-control.mts','operation service'],
 ['system','database','services','Existing Netlify Database binding','netlify/lib/management/connection.mts','private server connection'],
 ['system','ledger','finance','Manual audited finance ledger','netlify/lib/management/finance.mts','finance service']
])add(kind,id,domain,label,file,decl,[],{unit:'management_mechanism_not_person_or_content_inventory',privateProviderData:'excluded',enumeration:'requires_authorised_runtime_source'});

const rules=moduleValue('js/content/releases.ts','RELEASES',{FESTCAL:festivals});
const gameSources=new Map<string,string>();
function scan(dir:string){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const f=dir+'/'+entry.name;if(entry.isDirectory())scan(f);else if(/\.(ts|js)$/.test(f)&&!f.endsWith('.d.ts')&&!(f.endsWith('.js')&&fs.existsSync(path.join(root,f.slice(0,-3)+'.ts'))))gameSources.set(f,fs.readFileSync(path.join(root,f),'utf8'));}}
scan('js');
for(const item of items.filter(i=>i.kind==='declared-game')){
 const pattern=new RegExp(`\\bid\\s*:\\s*['"]${item.id}['"]`,'g');
 const refs:{file:string;line:number}[]=[];
 for(const [file,text] of gameSources)if(file.startsWith('js/games/'))for(const m of text.matchAll(pattern)){
  refs.push({file,line:text.slice(0,m.index).split('\n').length});sources.set(file,text);
 }
 item.evidence.registrationLiteralReferences=refs;
 item.evidence.implementationReference=refs.length?'registration_literal_found_not_execution_proof':'unknown';
}
const controls=rules.map((rule:any)=>{
 const refs:{file:string;line:number;function:string}[]=[],wrappers:{file:string;line:number;function:string}[]=[];
 const p=new RegExp(`\\b(featureOn|keptOn|releaseOn)\\s*\\(\\s*(['"])${rule.id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\2`,'g');
 for(const [file,text]of gameSources)for(const m of text.matchAll(p))refs.push({file,line:text.slice(0,m.index).split('\n').length,function:m[1]});
 const wrapperPattern=new RegExp(`\\b((?:G|game)\\.keep)\\s*\\(\\s*(['"])${rule.id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\2`,'g');
 for(const [file,text]of gameSources)for(const m of text.matchAll(wrapperPattern))wrappers.push({file,line:text.slice(0,m.index).split('\n').length,function:m[1]});
 const retained=(refs.some(r=>r.function==='keptOn')||wrappers.length>0)&&rule.id!=='wayfind';
 return {id:rule.id,label:rule.en,group:rule.group,defaultOn:rule.def,definition:'js/content/releases.ts',state:'declared_rule',referencedItems:items.filter(i=>i.controls.includes(rule.id)).map(i=>i.key),literalConsumerReferences:refs,wrapperConsumerReferences:wrappers,wrapperBridge:'js/main.ts G.keep delegates to keptOn; game context requires per-caller review',referenceCoverage:refs.length||wrappers.length?'literal_references_found':'dynamic_or_unverified',runtimeEffectVerified:false,publicationScope:'global_revision_only',disableCaveat:retained?'previously_tried_retention_may_override_off':'consumer_semantics_still_require_review'};
});
for(const [file,text]of gameSources)if([...controls].some(c=>[...c.literalConsumerReferences,...c.wrapperConsumerReferences].some(r=>r.file===file)))sources.set(file,text);
const output={schemaVersion:1,scope:'public_static_source_inventory_partial_not_a_runtime_or_private_data_audit',auditedHead:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),allDomainsComplete:false,domains,items:items.sort((a,b)=>a.key.localeCompare(b.key)),summary:{items:items.length,byDomain:Object.fromEntries(domains.map(d=>[d.id,items.filter(i=>i.domain===d.id).length])),catalogueGames:catalogue.coverage.games,catalogueStories:catalogue.coverage.stories,missingDeclaredIds:catalogue.coverage.declaredSecondSetMissingMetadata.length},sources:Object.fromEntries([...sources].sort().map(([f,s])=>[f,sha(s)])),limitations:['Private family-authored data, people, credentials, provider data and saves are excluded.','World inventory includes selected stable-ID map declarations, not every NPC/building/vendor/runtime instance.','Direct literal call references are lexical evidence, not execution proof; dynamic consumers require manual review.','No universal content-readiness or working-control percentage can be calculated from this partial audit.']};
const coverage={schemaVersion:1,scope:'release_rule_declarations_and_literal_consumer_references_not_end_to_end_effect',controls,summary:{declaredRules:controls.length,rulesWithLiteralReferences:controls.filter(c=>c.literalConsumerReferences.length).length,rulesWithWrapperReferences:controls.filter(c=>c.wrapperConsumerReferences.length).length,rulesWithRetentionCaveat:controls.filter(c=>c.disableCaveat==='previously_tried_retention_may_override_off').length,endToEndVerified:0},gaps:['Per-item availability and explicit-off behaviour need runtime tests.','Current keptOn implementation can retain previously-tried features despite an Off rule; G.keep wrappers extend this beyond the three direct literal keptOn rule IDs.','Dedicated scoped revision publication and true private draft/review are not implemented.']};
fs.writeFileSync(path.join(folder,'INVENTORY.json'),JSON.stringify(output,null,2)+'\n');fs.writeFileSync(path.join(folder,'CONTROL-COVERAGE.json'),JSON.stringify(coverage,null,2)+'\n');
fs.writeFileSync(path.join(folder,'INVENTORY.md'),'# Source inventory audit\n\nPartial public-source audit; no claim that all domains or runtime instances are enumerated. See INVENTORY.json for per-item source and evidence.\n\n| Domain | Public declarations/mechanisms | Status |\n|---|---:|---|\n'+domains.map(d=>`| ${d.label} | ${output.summary.byDomain[d.id]} | Partial |`).join('\n')+'\n\n'+output.limitations.map(s=>'- '+s).join('\n')+'\n\n## Declared entries missing catalogue metadata\n\nA missing catalogue row does not prove missing gameplay code. Registration-literal references, where found, are retained in INVENTORY.json; they still do not prove discovery, loading or playability.\n\n'+catalogue.coverage.declaredSecondSetMissingMetadata.map(s=>'- '+s).join('\n')+'\n');
fs.writeFileSync(path.join(folder,'CONTROL-COVERAGE.md'),'# Control source audit\n\nThese are declarations and lexical call references, not verified working effects. No working-control percentage is claimed. G.keep wrappers are listed separately and linked to the js/main.ts retention bridge; dynamic aliases still need review.\n\n| Rule | Direct references | Wrapper references | Off retention caveat |\n|---|---:|---:|---|\n'+controls.map(c=>`| ${c.id} | ${c.literalConsumerReferences.length} | ${c.wrapperConsumerReferences.length} | ${c.disableCaveat} |`).join('\n')+'\n\n## Gaps\n\n'+coverage.gaps.map(s=>'- '+s).join('\n')+'\n');
console.log(JSON.stringify({inventory:output.summary,controls:coverage.summary}));
