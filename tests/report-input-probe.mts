/** Test-only event diagnostics; no game callbacks or delivery assertions are replaced. */
export function installReportInputProbe() {
  const w=window as any;w.__reportInput=[];
  for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture','click','dblclick'])document.addEventListener(type,(event:Event)=>{
    const e=event as PointerEvent;if(!(e.target as Element)?.closest?.('.z-lb'))return;
    w.__reportInput.push({type,at:e.timeStamp,detail:e.detail,pointer:e.pointerId,button:e.button,trusted:e.isTrusted});
  },true);
}
export function readReportInputProbe() {
  return {events:(window as any).__reportInput,panels:document.querySelectorAll('.tpanel').length,
    buttons:document.querySelectorAll('.tester-floating').length,
    queue:JSON.parse(localStorage.getItem('sv2_tester_out')||'[]').map((x:any)=>({kind:x.kind,auto:x.auto,detail:x.detail})),
    nodes:document.querySelectorAll('*').length};
}
