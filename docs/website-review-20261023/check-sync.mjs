// A real source change must fail the website gate; leave working game files untouched.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
const git=(args,env={})=>execFileSync('git',args,{encoding:'utf8',env:{...process.env,...env}}).trim();
const reviewed=JSON.parse(fs.readFileSync(new URL('./game-review-lock.json',import.meta.url),'utf8'));
const source=git(['rev-parse',process.env.SV_WEBSITE_SOURCE||reviewed.source]),dir=fs.mkdtempSync(path.join(os.tmpdir(),'website-drift-'));
assert.equal(source,git(['rev-parse',reviewed.source]),'negative drift fixture must start from the reviewed source, not another release');
const env={GIT_INDEX_FILE:path.join(dir,'index')};
try{
 git(['read-tree',source],env);
 const file='js/adventure.ts',original=git(['show',source+':'+file]);
 const blob=execFileSync('git',['hash-object','-w','--stdin'],{input:original+'\n// unreviewed source change for the website gate check\n',encoding:'utf8'}).trim();
 git(['update-index','--cacheinfo','100644',blob,file],env);
 const tree=git(['write-tree'],env),commit=git(['commit-tree',tree,'-p',source,'-m','Temporary website drift fixture']);
 const result=spawnSync(process.execPath,['docs/website-review-20261023/sync-website.mjs'],{env:{...process.env,SV_WEBSITE_SOURCE:commit,SV_WEBSITE_OUTPUT:path.join(dir,'static')},encoding:'utf8'});
 assert.equal(result.status,1,'unreviewed gameplay source must fail');
 const report=JSON.parse(fs.readFileSync('docs/website-review-20261023/website-drift.json'));
 assert.deepEqual(report.changed,[file]);assert.equal(report.requiresEditorialReview,true);
 assert(fs.existsSync(path.join(dir,'static/index.html')),'rebuilt review artifact remains available');
 console.log('PASS: unreviewed adventure source fails and is named in the review report.');
}finally{
 fs.rmSync(dir,{recursive:true,force:true});
 execFileSync(process.execPath,['docs/website-review-20261023/sync-website.mjs'],{env:{...process.env,SV_WEBSITE_SOURCE:source},stdio:'inherit'});
}
