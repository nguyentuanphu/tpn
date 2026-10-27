import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
/** Never change applied migration bytes. Append the next version. */
export async function managementMigrations(){return Promise.all(['001-management.sql','002-finance.sql'].map(async(name,index)=>{const sql=await readFile(new URL(name,import.meta.url),'utf8');return {version:index+1,sql,sha256:createHash('sha256').update(sql).digest('hex')};}));}
