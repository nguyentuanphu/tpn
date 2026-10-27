import test from 'node:test';
import assert from 'node:assert/strict';
import {goatCircle,goatListen,goatCue,goatStep,goatCatch,goatDistance,GOAT_DIRECTIONS,GOAT_BOUNDARY} from '../../js/games/goat-core.ts';

test('Blindfold circle has one seeker and three distinct friends within its boundary',()=>{
 for(let seeker=0;seeker<4;seeker++){
  const s=goatCircle(seeker,false,()=>.37);
  assert.equal(s.children.length,4);assert.notEqual(s.caller,s.seeker);
  assert.equal(s.heard,false);assert.deepEqual([s.children[seeker].x,s.children[seeker].y],[0,0]);
  const friends=s.children.filter(c=>c.id!==s.seeker);
  for(const c of friends)assert.ok(Math.hypot(c.x,c.y)<GOAT_BOUNDARY);
  for(let i=0;i<friends.length;i++)for(let j=i+1;j<friends.length;j++)assert.ok(Math.hypot(friends[i].x-friends[j].x,friends[i].y-friends[j].y)>.8);
 }
});
test('Listening gives a visible direction and stereo bearing; distant tapping cannot catch',()=>{
 const s=goatCircle(0,false,()=>0);s.caller=1;s.children[1].x=.5;s.children[1].y=0;
 assert.equal(goatCatch(s),null);const cue=goatListen(s);
 assert.equal(s.heard,true);assert.equal(cue.direction,'e');assert.equal(cue.near,false);assert.ok(cue.pan>0);
 s.children[1].x=-.5;assert.ok(goatCue(s).pan<0);
});
test('All movement directions remain in the circle, including diagonal steps at the edge',()=>{
 for(const d of Object.keys(GOAT_DIRECTIONS)){
  const s=goatCircle(0,true,()=>0);
  for(let n=0;n<100;n++){goatStep(s,d);assert.ok(Math.hypot(s.children[0].x,s.children[0].y)<=GOAT_BOUNDARY+1e-12);}
 }
});
test('Listening and real steps can catch every caller; the caught friend becomes next seeker',()=>{
 for(const little of [true,false])for(let phase=0;phase<30;phase++){
  const s=goatCircle(phase%4,little,()=>phase/30);
  for(let n=0;n<60&&goatCatch(s)===null;n++)goatStep(s,goatListen(s).direction);
  assert.ok(goatDistance(s)<=.22,`reachable: little=${little} phase=${phase}`);
  const caught=goatCatch(s);assert.equal(caught,s.caller);
  const next=goatCircle(caught,little,()=>.25);assert.equal(next.seeker,caught);assert.notEqual(next.caller,caught);
 }
});
test('Little children have no fleeing target; listening-only actions never add steps or penalties',()=>{
 const s=goatCircle(0,true,()=>.1),before=s.children.filter(c=>c.id!==0).map(c=>({...c}));
 for(let i=0;i<10;i++)goatListen(s);assert.equal(s.steps,0);
 goatStep(s,'n');assert.deepEqual(s.children.filter(c=>c.id!==0),before);
 assert.equal('deadline' in s,false);assert.equal('misses' in s,false);
});
