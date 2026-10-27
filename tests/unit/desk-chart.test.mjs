import test from 'node:test';
import assert from 'node:assert/strict';
import {deskChart} from '../../studio/ui/desk-charts.ts';
const T=(en)=>en;
const spec={id:'example',title:'Reported play',unit:'minutes',explanation:'Reported subset',source:'L01',limit:'Missing is unknown',line:true};
test('chart gaps remain unknown and cannot draw a continuous line across absent observations',()=>{
 const markup=deskChart({...spec,points:[{label:'Day one',value:2},{label:'Missing day',value:null},{label:'Day three',value:3}]},T);
 const path=/class="desk-line"/.test(markup)&&/<path d="([^"]+)"/.exec(markup)?.[1];
 assert.ok(path);assert.equal((path.match(/M/g)||[]).length,2);assert.ok(!path.includes('L'));
 assert.match(markup,/Missing day<\/td><td>Unavailable/);
});
test('chart untrusted labels are escaped and negative financial values remain signed and accessible',()=>{
 const markup=deskChart({...spec,line:false,points:[{label:'<img src=x onerror=alert(1)>',value:-3}]},T);
 assert.ok(!markup.includes('<img'));assert.match(markup,/&lt;img/);assert.match(markup,/<td>-3<\/td>/);assert.ok(!/width="-/.test(markup));
 const absent=deskChart({...spec,points:[{label:'Unknown',value:null}]},T);assert.match(absent,/No eligible observations/);assert.ok(!absent.includes('<circle'));
});
