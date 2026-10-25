import test from 'node:test';
import assert from 'node:assert/strict';
import { createNetGames } from '../../js/netgames.js';

test('accepted story retains an inviter page arriving before its delayed start, with no foreign moves', () => {
  const seen=[];let game;
  game=createNetGames({net:{ids:()=>['A'],send:()=>{}},me:()=> 'B',onStart:()=>game.onMove((...args)=>seen.push(args))});
  const invite={t:'gask',gid:'story1',game:'tale-banhchung',level:1,from:'A'};
  game.answer(invite,true);
  game.receive({t:'gmove',gid:'story1',n:2,mv:2,from:'A'});
  game.receive({t:'gmove',gid:'story1',n:3,mv:0,from:'C'});
  game.receive({t:'gstart',gid:'story1',game:'tale-banhchung',level:1,seats:['A','B'],from:'A'});
  assert.deepEqual(seen,[[0,2,2]],'The real start listener must receive the accepted inviter’s early page, not restart at page zero');
  assert.equal(game.session.moves.get(2)?.get(0),2);
  assert.equal(game.session.moves.has(3),false);
});

test('pending story pages are replayed in move order despite relay reordering', () => {
  const pages=[];let game;
  game=createNetGames({net:{ids:()=>['A'],send:()=>{}},me:()=> 'B',onStart:()=>game.onMove((seat,n,page)=>pages.push(page))});
  game.answer({gid:'story2',from:'A'},true);
  for(const n of [2,0,1])game.receive({t:'gmove',gid:'story2',from:'A',n,mv:n});
  game.receive({t:'gstart',gid:'story2',game:'tale-banhchung',level:1,seats:['A','B'],from:'A'});
  assert.deepEqual(pages,[0,1,2]);
});

test('declining an accepted but not started story discards its pending pages and permission', () => {
  const game=createNetGames({net:{ids:()=>['A'],send:()=>{}},me:()=> 'B'}),invite={gid:'story3',from:'A'};
  game.answer(invite,true);game.receive({t:'gmove',gid:'story3',from:'A',n:0,mv:2});game.answer(invite,false);
  game.receive({t:'gstart',gid:'story3',game:'tale-banhchung',level:1,seats:['A','B'],from:'A'});
  assert.equal(game.session,null);
});
