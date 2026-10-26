import test from 'node:test';
import assert from 'node:assert/strict';
import { destinationStops } from '../js/travel-stops.js';

test('destination picker keeps one nearest stop per place without deleting physical stops',()=>{
 const stop=(id:string,x:number,name:string)=>({x,z:0,place:{id},name:()=>name,icon:'bus'});
 const stops=[stop('brisbane',80,'Brisbane'),stop('hanoi',120,'Hà Nội'),stop('brisbane-other-platform',40,'Brisbane'),stop('current',5,'Current')];
 const picked=destinationStops(stops,{x:0,z:0});assert.deepEqual(picked,[stops[2],stops[1]]);assert.equal(stops.length,4);
 assert.deepEqual(destinationStops([{...stops[0],place:null},{...stops[2],place:null}],{x:0,z:0}).map(s=>s.x),[40]);
});
