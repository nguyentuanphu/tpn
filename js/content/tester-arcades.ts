import { releaseOn, liveRule } from '../custom.js';
import { testerLevel } from './tester.js';
export type TesterArcade = 'sparkleorchard'|'sparklefruitbar';
export const familyArcadeAllowed=(published:boolean,preview:boolean,tester:boolean)=>published||preview&&tester;
export const testerArcadeAllowed=(tester:boolean,master:boolean,mode:boolean)=>tester&&master&&mode;
export function testerArcadeAvailable(id:TesterArcade,mode:'single'|'multi'){
 let device='',accepted=false;try{device=localStorage.getItem('sv2_playerid')||'';const a=JSON.parse(localStorage.getItem('sv2_tester')||'null');accepted=!!(a?.at&&!a.stopped);}catch{}
 // Explicit names let the unchanged Studio-control audit prove every reader has a control.
 const explicit=(key:string,on:boolean)=>liveRule(key)?.on!==false&&on;
 const modes={
  sparkleorchard:{tester:explicit('sparkleorchard_tester',releaseOn('sparkleorchard_tester',false)),single:explicit('sparkleorchard_single',releaseOn('sparkleorchard_single',false)),multi:explicit('sparkleorchard_multi',releaseOn('sparkleorchard_multi',false))},
  sparklefruitbar:{tester:explicit('sparklefruitbar_tester',releaseOn('sparklefruitbar_tester',false)),single:explicit('sparklefruitbar_single',releaseOn('sparklefruitbar_single',false)),multi:explicit('sparklefruitbar_multi',releaseOn('sparklefruitbar_multi',false))}
 };
 const eligible=accepted&&!!testerLevel(explicit('tester',releaseOn('tester',false)),liveRule('tester'),device);
 if(id==='sparklefruitbar')return familyArcadeAllowed(modes[id][mode],modes[id].tester,eligible);
 return testerArcadeAllowed(accepted&&!!testerLevel(explicit('tester',releaseOn('tester',false)),liveRule('tester'),device),modes[id].tester,modes[id][mode]);
}
