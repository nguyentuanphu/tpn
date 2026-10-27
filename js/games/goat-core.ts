// Virtual Bịt mắt bắt dê: children take turns as the blindfolded seeker inside a circle.
// Screen-normalised coordinates keep rules independent of the drawing and viewport.
export type GoatPoint = {x: number; y: number};
export type GoatDirection = 'nw'|'n'|'ne'|'w'|'e'|'sw'|'s'|'se';
export type GoatChild = GoatPoint & {id: number};
export type GoatCircle = {children: GoatChild[]; seeker: number; caller: number; little: boolean; steps: number; heard: boolean};
export const GOAT_DIRECTIONS: Record<GoatDirection, readonly [number,number]> = {
 nw:[-1,-1],n:[0,-1],ne:[1,-1],w:[-1,0],e:[1,0],sw:[-1,1],s:[0,1],se:[1,1]
};
export const GOAT_BOUNDARY = .84, GOAT_REACH = .22;
export function goatCircle(seeker = 0, little = false, random:()=>number = Math.random): GoatCircle {
 const phase = random()*Math.PI*2;
 const children = Array.from({length:4},(_,id)=>{
  const angle = phase + id*Math.PI*2/3;
  return {id,x:id===seeker?0:Math.cos(angle)*.58,y:id===seeker?0:Math.sin(angle)*.58};
 });
 // Evenly space the three friends; the seeker is always in the centre.
 const friends = children.filter(c=>c.id!==seeker);
 friends.forEach((c,i)=>{const a=phase+i*Math.PI*2/3;c.x=Math.cos(a)*.58;c.y=Math.sin(a)*.58;});
 return {children,seeker,caller:friends[Math.min(2,Math.floor(random()*3))].id,little,steps:0,heard:false};
}
export function goatDistance(state: GoatCircle): number {
 const a=state.children[state.seeker],b=state.children[state.caller];
 return Math.hypot(b.x-a.x,b.y-a.y);
}
export function goatCue(state: GoatCircle): {direction: GoatDirection; near: boolean; pan: number} {
 const a=state.children[state.seeker],b=state.children[state.caller],dx=b.x-a.x,dy=b.y-a.y;
 const sx=Math.abs(dx)<.06?0:Math.sign(dx),sy=Math.abs(dy)<.06?0:Math.sign(dy);
 const direction=Object.keys(GOAT_DIRECTIONS).find(k=>{const [x,y]=GOAT_DIRECTIONS[k as GoatDirection];return x===sx&&y===sy;}) as GoatDirection | undefined;
 return {direction:direction||'n',near:goatDistance(state)<=GOAT_REACH,pan:Math.max(-.8,Math.min(.8,dx))};
}
export function goatStep(state: GoatCircle,direction: GoatDirection): void {
 const [dx,dy]=GOAT_DIRECTIONS[direction],length=Math.hypot(dx,dy),step=state.little ? .17 : .14;
 const seeker=state.children[state.seeker];seeker.x+=dx/length*step;seeker.y+=dy/length*step;
 const radius=Math.hypot(seeker.x,seeker.y);
 if(radius>GOAT_BOUNDARY){seeker.x*=GOAT_BOUNDARY/radius;seeker.y*=GOAT_BOUNDARY/radius;}
 state.steps++;
 // Friends take small steps around the circle. They never outrun the seeker or leave the boundary.
 if(!state.little&&state.steps%2===0) for(const c of state.children)if(c.id!==state.seeker){
  const radius=Math.hypot(c.x,c.y),angle=Math.atan2(c.y,c.x)+.055;
  c.x=Math.cos(angle)*radius;c.y=Math.sin(angle)*radius;
 }
}
export function goatListen(state: GoatCircle): ReturnType<typeof goatCue> {state.heard=true;return goatCue(state);}
// Catch is a nearby tag, not a tap on a distant visible friend. A miss has no penalty or deadline.
export function goatCatch(state: GoatCircle): number|null {return goatDistance(state)<=GOAT_REACH?state.caller:null;}
