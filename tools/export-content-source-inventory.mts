// Public definitions and import connections only. Never opens saves, environment bindings or provider records.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {exportManagementCatalogue} from './export-management-catalogue.mts';
const root=process.cwd(),out=path.join(root,'docs/studio-content-website-20261029');
const ts=createRequire(path.join(root,'tests/package.json'))('typescript');
const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8'}).trim();
const files=[...new Set([...git('ls-files','--','js','home','netlify','studio','tools','types','.github/workflows','index.html','sw.ts','css').split('\n'),...git('ls-files','--others','--exclude-standard','--','js','home','tools').split('\n')])].filter(f=>/\.(?:[cm]?[jt]s|tsx|html|css|ya?ml)$/.test(f)&&fs.statSync(f).isFile()).sort();
const domains=['games','stories','quests','rewards','festivals','world','social','media','website','people','quality','services','finance'];
function domain(f:string){
 if(/finance|ledger|budget/.test(f))return 'finance';
 if(/home\/|website|parent-analytics/.test(f))return 'website';
 if(/festival|festcal|festhunt/.test(f))return 'festivals';
 if(/tales|story|chapters|film/.test(f))return 'stories';
 if(/adventure|quest|missions|jobs/.test(f))return 'quests';
 if(/sticker|shop|money|econom|unlock|prize|reward/.test(f))return 'rewards';
 if(/games\/|activities|learning|howto/.test(f))return 'games';
 if(/voice|audio|song|art\.|recorder|sounds/.test(f))return 'media';
 if(/players|hello|telemetry|management\/read|familycode|profile/.test(f))return 'people';
 if(/net\.|netmsg|relay|family|shared|peer|chat|friends/.test(f))return 'social';
 if(/world|roads|regions|cities|map\.|places|animals|homes|travel|transport|ferry|traffic|player\.|town|farm|avatar|solids|terrain|weather|npc|gather|buildings|heritage|village|suburb|boat|landmark/.test(f))return 'world';
 if(/\.github|validate|report|tester|build|sw\.|install|release|version|preload|audit|export|tsconfig/.test(f))return 'quality';
 return 'services';
}
const modules=files.map(file=>{
 const source=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true),definitions:any[]=[],imports:any[]=[];
 function visit(node:any){
  if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node)){
   const ref=node.moduleSpecifier?.text;
   if(typeof ref==='string')imports.push({specifier:ref,kind:'static-import',line:ast.getLineAndCharacterOfPosition(node.pos).line+1});
  }
  if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&ts.isStringLiteral(node.arguments[0]))imports.push({specifier:node.arguments[0].text,kind:'literal-dynamic-import',line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1});
  if(node.modifiers?.some((m:any)=>m.kind===ts.SyntaxKind.ExportKeyword)){
   const line=ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1;
   if(node.name?.text)definitions.push({name:node.name.text,line,type:ts.SyntaxKind[node.kind]});
   if(ts.isVariableStatement(node))for(const d of node.declarationList.declarations)definitions.push({name:d.name.getText(ast),line,type:'variable-definition'});
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);
 return {key:'source:'+file,file,domain:domain(file),sha256:createHash('sha256').update(source).digest('hex'),classification:'source-definition',definitions,imports,instanceRecords:'not_enumerated',providerEvidence:'not_requested'};
});
const byPath=new Map(modules.map(m=>[m.file,m]));
const connections=modules.flatMap(m=>m.imports.map(i=>{
 const base=path.posix.normalize(path.posix.join(path.posix.dirname(m.file),i.specifier));
 const target=i.specifier.startsWith('.')?[base,base.replace(/\.js$/,'.ts'),base.replace(/\.cjs$/,'.cts'),base.replace(/\.mjs$/,'.mts')].find(f=>byPath.has(f)):null;
 return {from:m.key,to:target?'source:'+target:null,specifier:i.specifier,line:i.line,evidence:i.kind,runtimeEffect:'not_proven',external:!i.specifier.startsWith('.')};
}));
const catalogue=exportManagementCatalogue(root);
const items=catalogue.entries.map(e=>({key:e.kind+':'+e.id,domain:e.kind==='game'?'games':'stories',sourceFile:e.sourceFile,discovery:e.coverage.discovery,implementationReference:e.coverage.implementation,sourceHash:e.sourceHash,guide:e.guide,unlock:e.unlock,playability:'consult-browser-validation-not-inferred-from-metadata'}));
const itemDependencies=catalogue.entries.flatMap(e=>{
 const key=e.kind+':'+e.id;
 return [{from:key,to:'source:'+e.sourceFile,relation:'defined-in',evidence:'source-reference'},
 ...e.unlock.prerequisites.map(id=>({from:key,to:e.kind+':'+id,relation:'requires-three-finishes',evidence:'shared-progress-rule'})),
 ...(e.unlock.featureId?[{from:key,to:'release:'+e.unlock.featureId,relation:'requires-release',evidence:'source-rule'}]:[]),
 ...(e.guide.href?[{from:key,to:'website:'+e.guide.href,relation:'static-guide',evidence:e.guide.sourceAligned?'source-aligned':'anchor-only-combined-review-pending'}]:[])];
});
const boundaries=[
 ['people','Private installations/profiles','netlify/lib/management/read.mts','Installation-scoped reporting; never merge names into global people; excluded from public marketing.'],
 ['stories','Private authored stories/questions','js/custom.ts','Private records are not enumerated or copied.'],
 ['social','Pairings and family media','netlify/functions/family.mts','Separate grants and recovery; no save-sharing inference.'],
 ['finance','Ledger/provider documents','netlify/lib/management/finance.mts','Schema is source; actual invoices, balances and payments are not source definitions.'],
 ['services','Database/provider state','netlify/lib/management/connection.mts','Bindings and credentials remain private; source does not prove service readiness.'],
 ['website','Marketing observations','home/analytics.ts','Consent-based aggregates; Play clicks do not prove game starts or identify children.']
].map(([domain,label,file,limit])=>({domain,label,file,classification:'private-or-provider-record-boundary',enumerated:false,limit}));
const dirtyPaths=git('diff','--name-only','HEAD','--',...files).split('\n').filter(Boolean);
const output={schemaVersion:1,sourceHead:git('log','-1','--format=%H','--',...files),sourceDirty:dirtyPaths.length>0,dirtyPaths,scope:'All tracked public code/config surfaces under the declared roots, plus new source files; not every runtime entity or private/provider record.',domains:domains.map(id=>({id,sourceModules:modules.filter(m=>m.domain===id).length,definitionCoverage:'module-manifest-complete-within-listed-roots',runtimeCoverage:'not_claimed'})),modules,items,boundaries,limitations:['Domain attribution is a reviewable filename-based grouping; shared imports cross domains.','Dynamic imports, DOM messages, runtime identifiers and API dispatch need consumer review beyond lexical import evidence.','Asset binaries and recording catalogues are covered by separate manifests; never interpreted as child/profile records.','No all-domain control/playability percentage is inferred.']};
const mediaManifests=['en','vi','zh','hi'].map(language=>{
 const file=`voices/manifest-${language}.json`,text=fs.readFileSync(path.join(root,file),'utf8'),manifest=JSON.parse(text);
 if(!manifest.lines||typeof manifest.lines!=='object')throw Error('Missing recording definitions: '+file);
 const recordings=Object.entries(manifest.lines).map(([id,voices])=>{
  if(!/^[a-f0-9-]+$/.test(id)||typeof voices!=='string'||!/^[fm]+$/.test(voices))throw Error('Unsupported recording definition: '+file);
  const assets=[...voices].map(voice=>{const asset=`voices/${language}/${voice}/${id}.mp3`;return {file:asset,present:fs.existsSync(path.join(root,asset))};});
  return {key:`voice:${language}:${id}`,language,id,classification:'shipped-recording-definition',assets,playback:'not_inferred_from_file_presence'};
 });
 return {file,sha256:sha(text),language,recordings};
});
function sha(value:string){return createHash('sha256').update(value).digest('hex');}
const bundledAssets=git('ls-tree','-r','HEAD','--','fonts','icons','vendor').split('\n').filter(Boolean).map(line=>{const [meta,file]=line.split('\t');return {file,gitBlob:meta.split(' ')[2],classification:'bundled-public-asset'};});
const media={schemaVersion:1,sourceHead:output.sourceHead,scope:'Public shipped language-pack definitions and bundled fonts/icons/vendor references. No line text, photos, names, device IDs or private family recordings are exported.',manifests:mediaManifests,bundledAssets,missingAssets:mediaManifests.flatMap(m=>m.recordings.flatMap(r=>r.assets.filter(a=>!a.present))),providerEvidence:'not_requested'};
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'media-inventory.json'),JSON.stringify(media,null,2)+'\n');
fs.writeFileSync(path.join(out,'source-inventory.json'),JSON.stringify(output,null,2)+'\n');
fs.writeFileSync(path.join(out,'source-connections.json'),JSON.stringify({schemaVersion:1,sourceHead:output.sourceHead,connections,itemDependencies,boundaries},null,2)+'\n');
fs.writeFileSync(path.join(out,'SOURCE-INVENTORY.md'),'# Public source inventory\n\n'+output.scope+'\n\n| Domain | Source modules | Runtime/private records |\n|---|---:|---|\n'+output.domains.map(d=>`| ${d.id} | ${d.sourceModules} | Not enumerated |`).join('\n')+'\n\nThe JSON records every inspected file hash, exported definition, source import and typed game/story ID. media-inventory.json enumerates shipped recording definitions across four languages and bundled font/icon/vendor references without exporting spoken text or private media. It distinguishes declarations, catalogue discovery, implementation references, unlock dependencies, static guides, runtime instances and provider evidence. Supplement with the existing public declaration audit in `public-definitions/`; that audit remains partial at the entity level.\n\n'+output.limitations.map(s=>'- '+s).join('\n')+'\n');
console.log(`${modules.length} public source modules, ${items.length} typed content entries, ${connections.length} import connections across ${domains.length} domains`);
