import { releaseOn, liveRule } from '../custom.js';
import { testerLevel } from './tester.js';
export type TesterArcade = 'sparkleorchard'|'sparklefruitbar';
export const testerArcadeAllowed=(tester:boolean,master:boolean,mode:boolean)=>tester&&master&&mode;
export function testerArcadeAvailable(id:TesterArcade,mode:'single'|'multi'){
 let device='',accepted=false;try{device=localStorage.getItem('sv2_playerid')||'';const a=JSON.parse(localStorage.getItem('sv2_tester')||'null');accepted=!!(a?.at&&!a.stopped);}catch{}
 const on=(key:string)=>liveRule(key)?.on!==false&&releaseOn(key,false);
 return testerArcadeAllowed(accepted&&!!testerLevel(on('tester'),liveRule('tester'),device),on(`${id}_tester`),on(`${id}_${mode}`));
}
