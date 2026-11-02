// Package the rendered review with content-addressed assets; no game code executes.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const out=path.resolve(process.argv[2]||'website-preview');
fs.mkdirSync(path.join(out,'assets'),{recursive:true});
const html=fs.readFileSync(new URL('./prototype.html',import.meta.url),'utf8').replace(/data:([^;]+);base64,([A-Za-z0-9+/=]+)/g,(_,mime,encoded)=>{
 const data=Buffer.from(encoded,'base64'),ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','font/woff2':'woff2'}[mime];
 if(!ext)throw Error('Unsupported embedded media '+mime);
 const name=createHash('sha256').update(data).digest('hex').slice(0,24)+'.'+ext;
 if(data.length>25*1024*1024)throw Error('Oversize hosted asset '+name);
 fs.writeFileSync(path.join(out,'assets',name),data);return './assets/'+name;
});
fs.writeFileSync(path.join(out,'index.html'),html);console.log('Static website output: '+out);
