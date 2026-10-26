/** Small deterministic practice rules; no currency, profile or world state. */
export type AimGame='con'|'disc';
export type Target={x:number;y:number;radius:number};
export function throwResult(kind:AimGame,aim:number,power:number,target:Target){
 if(!['con','disc'].includes(kind)||!Number.isInteger(aim)||aim<50||aim>350||!Number.isInteger(power)||power<1||power>4||![target.x,target.y,target.radius].every(Number.isFinite)||target.radius<=0)return null;
 const x=aim,y=300-power*60;
 const tolerance=kind==='con'?Math.max(0,target.radius-13):target.radius+13;return{x,y,hit:Math.hypot(x-target.x,y-target.y)<=tolerance};
}
export type Chase={passed:number;cat:number;mouse:number;open:number;done:boolean};
const GATES=[0,2,1,3,0,1];
export const initialChase=():Chase=>({passed:0,cat:0,mouse:2,open:0,done:false});
export function passGate(s:Chase,gate:number,little:boolean):Chase|null{
 if(s.done||!Number.isInteger(gate)||gate<0||gate>3)return null;
 if(gate!==s.open)return{...s,cat:little?s.cat:Math.min(s.mouse-1,s.cat+1)};
 const passed=s.passed+1;return{passed,mouse:s.mouse+2,cat:s.mouse,open:GATES[passed%GATES.length],done:passed===4};
}
export function flagRunner(called:number,chosen:number){return Number.isInteger(called)&&called>=1&&called<=3&&chosen===called;}
export type Stroke='left'|'right';
export type Rowing={distance:number;next:Stroke;strokes:number;helper:number};
export const initialRowing=():Rowing=>({distance:0,next:'left',strokes:0,helper:0});
export function rowStroke(s:Rowing,side:Stroke,onBeat:boolean,little:boolean):Rowing|null{
 if(!['left','right'].includes(side)||s.distance>=120)return null;
 if(side!==s.next||!onBeat&&!little)return little?s:{...s,helper:Math.min(120,s.helper+2)};
 return{distance:Math.min(120,s.distance+10),next:side==='left'?'right':'left',strokes:s.strokes+1,helper:Math.min(120,s.helper+(little?7:9))};
}
export const sawAction=(beat:number)=>Number.isInteger(beat)&&beat>=0&&beat<20?(beat%2===0?'pull':'push'):null;
