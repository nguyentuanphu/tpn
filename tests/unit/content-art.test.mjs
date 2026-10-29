import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {exportManagementCatalogue} from '../../tools/export-management-catalogue.mts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('integrated art has catalogue metadata, a real loader and existing release/progress dependencies',()=>{
 const catalogue=exportManagementCatalogue(root),audit=JSON.parse(read('docs/studio-content-website-20261029/art-audit.json'));
 const active=audit.filter(r=>r.discovery==='catalogued');assert.equal(active.length,22);
 for(const row of active){const item=catalogue.entries.find(e=>e.kind==='game'&&e.id===row.id);assert.ok(item);assert.equal(item.area,'art');assert.equal(item.coverage.implementation,true);assert.equal(item.coverage.metadata,true);assert.equal(item.unlock.featureId,'newGames');assert.equal(item.unlock.finishesEach,3);assert.ok(item.unlock.prerequisites.includes('colors'));assert.equal(item.guide.href,'/home/#art-'+row.id);}
 for(const id of ['spotdiff','hiddenpic','paperfold','rongran']){const item=catalogue.entries.find(e=>e.kind==='game'&&e.id===id);assert.equal(item.coverage.discovery,'declared-only');assert.equal(item.coverage.implementation,false);assert.equal(item.guide.verified,false);}
});
test('offline manifest includes both art groups and their new shared dependency',()=>{
 const sw=read('sw.ts');for(const name of ['drawing2','crafts','art-pad'])assert.ok(sw.includes(`'js/games/${name}.js'`));
});
test('public source graph covers all thirteen domains without claiming private records or runtime effects',()=>{
 const inventory=JSON.parse(read('docs/studio-content-website-20261029/source-inventory.json')),graph=JSON.parse(read('docs/studio-content-website-20261029/source-connections.json'));
 assert.equal(inventory.domains.length,13);assert.ok(inventory.domains.every(d=>d.sourceModules>0));assert.equal(new Set(inventory.modules.map(m=>m.key)).size,inventory.modules.length);
 assert.ok(inventory.boundaries.every(b=>b.enumerated===false));assert.ok(graph.connections.every(c=>['static-import','literal-dynamic-import'].includes(c.evidence)&&c.runtimeEffect==='not_proven'));
 assert.ok(inventory.modules.some(m=>m.file==='js/games/art-pad.ts'));assert.ok(graph.connections.some(c=>c.from==='source:js/games/drawing2.ts'&&c.to==='source:js/games/art-pad.ts'));
});
