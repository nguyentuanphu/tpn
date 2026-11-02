// Publishing helper only. Original runner artifacts stay on GitHub; never change test results to pass a check.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pictograph=/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/gu;
const allowed=/^[\u2190-\u21FF\u25A0-\u25FF\u2B05-\u2B07\u23E9-\u23FA©®™‼⁉〰]$/u;
const names=new Map([[0x2705,'PASS'],[0x274c,'FAIL'],[0x26a0,'NOTE']]);
for(const input of process.argv.slice(2)){
 const file=path.resolve(input),relative=path.relative(root,file);
 if(relative.startsWith('..')||path.isAbsolute(relative)||! /\.(md|txt)$/i.test(file))throw new Error('Choose a Markdown/text evidence file within this handbook. Keep original JSON payloads unchanged.');
 let count=0;const source=fs.readFileSync(file,'utf8');const result=source.replace(pictograph,ch=>{
  if(allowed.test(ch))return ch;count++;const point=ch.codePointAt(0);return names.get(point)||'[U+'+point.toString(16).toUpperCase()+']';
 }).replaceAll('\uFE0F','');
 if(result!==source)fs.writeFileSync(file,result);
 console.log(`${relative}: ${count} pictographic markers normalized; outcome text and numbers retained`);
}
