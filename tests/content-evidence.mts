import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export function contentEvidence(browser,files){
 const sourceHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const hashes=Object.fromEntries(files.map(file=>[file,createHash('sha256').update(fs.readFileSync('../'+file)).digest('hex')]));
 return {sourceHead,capturedAt:new Date().toISOString(),timezone:'Australia/Sydney',synthetic:true,browser:browser.version(),screenshotOptions:{animations:'disabled'},sourceFiles:hashes};
}
