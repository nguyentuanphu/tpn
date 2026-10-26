// The recorded voices getting ready: a small, quiet note at the bottom of the screen while the voice pack downloads
// to the device ("Getting the voices ready… 45%" with a thin bar), "Voices ready" for a moment when it is done, and
// "waiting for the internet" if it stops. Once the pack is on the device a start shows nothing (round O, owner: it
// looked as if the voices loaded every time); it says when this address can't keep the voices or no recorded voices
// were found.
// Never in the way: it can't be tapped, sits between the joystick and the buttons, and fades when idle.
import { T } from './i18n.js';
import { onPackProgress } from './voice.js';

let box = null, hideT: ReturnType<typeof setTimeout> | 0 = 0;
const show = (text, pct) => {
  if (!box) { box = document.createElement('div'); box.className = 'packbar'; box.setAttribute('role', 'status'); box.innerHTML = '<span></span><i><b></b></i>'; document.body.appendChild(box); }
  clearTimeout(hideT); box.classList.remove('out');
  box.querySelector('span').textContent = text;
  box.querySelector('i').style.display = pct == null ? 'none' : '';
  if (pct != null) box.querySelector('b').style.width = Math.max(3, Math.min(100, pct)) + '%';
};
const hide = (after = 0) => { clearTimeout(hideT); hideT = setTimeout(() => { if (box) box.classList.add('out'); }, after); };
type PackStatus={state:string;provider?:string;done?:number;saved?:number;total?:number;fullTotal?:number;known?:boolean};
const packs=new Map<string,PackStatus>();
function combinedProgress(e:PackStatus){
  const key=e.provider==='Lê Minh'?'Lê Minh':'default';packs.set(key,{...packs.get(key),...e,known:e.known===true});
  if(!packs.has('default')||!packs.has('Lê Minh'))return false;
  const states=['default','Lê Minh'].map(id=>({id,p:packs.get(id)!}));
  if(states.every(s=>s.p.state==='ready'&&s.p.known)){hide();return true;}
  let total=0,done=0;
  const labels=states.map(({id,p})=>{
    const name=id==='default'?T('Default voices','Giọng mặc định'):'Lê Minh';
    const n=Math.max(0,p.fullTotal??p.total??0),saved=p.state==='ready'?n:Math.max(0,Math.min(n,p.saved??p.done??0));total+=n;done+=saved;
    if(p.state==='ready')return name+' ✓';
    if(p.state==='loading')return name+`: ${saved.toLocaleString()}/${n.toLocaleString()}`;
    return name+' · '+(p.state==='waiting'?T('paused','tạm dừng'):T('not saved','chưa lưu được'));
  });
  show(labels.join(' · '),total?done/total*100:null);
  if(!states.some(s=>s.p.state==='loading'))hide(states.every(s=>s.p.state==='ready')?3000:6000);
  return true;
}

export function startPackBar() {
  onPackProgress(e => {
    const label=e.provider==='Lê Minh'?'Lê Minh · ':'';
    // (round R item 12) on mobile data with the core voices in: a grown-up is asked about the rest (js/voicepack.js)
    if (e.state === 'ask') { import('./voicepack.js').then(m => m.askCard(e.mb)).catch(() => { }); return; }
    // Concurrent packs keep their own counters. A default batch must not erase the optional pack's status.
    if(combinedProgress(e))return;
    if (e.state === 'loading') { const saved = e.saved ?? e.done, total = e.fullTotal ?? e.total, pc = Math.max(0, Math.min(100, Math.floor(saved / (total || 1) * 100))); show(label+T(`Voices: ${saved.toLocaleString()} of ${total.toLocaleString()} saved`, `Giọng đọc: đã lưu ${saved.toLocaleString()} / ${total.toLocaleString()}`) + ' · ' + pc + '%', pc); } // (r63: never past 100 %)
    else if (e.state === 'ready' && e.known) { /* already on the device from an earlier start: nothing to say (round O) */ }
    else if (e.state === 'ready') { show(label+T('Voices ready', 'Giọng đọc đã sẵn sàng') + ' ✓' + (e.total ? ` (${e.total.toLocaleString()})` : ''), 100); hide(e.quiet ? 2500 : 3000); }
    else if (e.state === 'nostore') { show(e.provider==='Lê Minh'?T('Could not save Lê Minh. Check free device storage; recordings can still play online.','Chưa lưu được Lê Minh. Kiểm tra dung lượng trống; vẫn có thể nghe bản thu qua mạng.'):T('Voices play from the internet here: this address can’t keep them on the device (use the https website to keep them)', 'Ở địa chỉ này giọng đọc phát qua mạng, không lưu được trên máy (dùng trang https để lưu)'), null); hide(8000); }
    else if (e.state === 'nopack') { show(T('No recorded voices found: the device’s own voice is used', 'Không tìm thấy giọng đọc ghi sẵn: dùng giọng của máy'), null); hide(8000); }
    else if (e.state === 'waiting') { show(label+(e.provider==='Lê Minh'&&navigator.onLine!==false?T('Continues on Wi-Fi or when mobile downloads are allowed','Tải tiếp khi có Wi-Fi hoặc được phép dùng dữ liệu di động'):T('Voices will finish when the internet is back', 'Giọng đọc sẽ tải tiếp khi có mạng')), null); hide(6000); }
  });
}
