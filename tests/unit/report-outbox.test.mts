import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readReportQueue,persistReportQueue} from '../../js/report-outbox.js';
const row={id:'tester000001',b:'r76',kind:'broken',at:1,clientId:'retry-stable',shot:'large-picture',note:'Synthetic note'};
test('legacy report without client ID survives queue parsing',()=>assert.deepEqual(readReportQueue(JSON.stringify([{...row,clientId:undefined}])),{ok:true,rows:[{id:row.id,b:row.b,kind:row.kind,at:1,shot:row.shot,note:row.note}]}));
test('invalid old storage is detected rather than overwritten as an empty queue',()=>{for(const raw of ['oops','{}','[null]','[{"id":"x"}]'])assert.equal(readReportQueue(raw).ok,false);assert.deepEqual(readReportQueue(null),{ok:true,rows:[]});});
test('quota fallback keeps every report identity/text and admits omitted pictures',()=>{let writes=0,saved;const result=persistReportQueue({setItem(k,v){if(++writes===1)throw Error('quota');saved=JSON.parse(v);}},'out',Array.from({length:25},(_,i)=>({...row,clientId:'report-'+i})));assert.deepEqual(result,{ok:true,withoutPictures:true});assert.equal(saved.length,25);assert.equal(saved[0].clientId,'report-0');assert.equal(saved[24].note,'Synthetic note');assert.ok(saved.every(r=>r.shot===''));});
test('storage denial returns failure; it never claims queued',()=>assert.deepEqual(persistReportQueue({setItem(){throw Error('denied');}},'out',[row]),{ok:false,reason:'storage'}));
