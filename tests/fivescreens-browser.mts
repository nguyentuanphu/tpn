import type {Browser} from 'playwright';
import {fitGames,type FitSize} from './gamefit-browser.mts';
// (v1.08b quality, owner 3 Nov 2026 AEDT: "Have all the games, films and stories been checked to work in landscape and
// portrait on mobile, tablets and PC?"; docs/plans/five-screens-check.md) every switched-on game, for a big kid and an
// under-5, at the five screens: nothing outside the screen, no scrolling, text at least 16 px, touch targets at least
// 44 px (64 px for under-5s), no two controls on top of each other. Phone landscape is fully playable (owner's choice).
// Split in two parts so the full suite stays about 30 minutes: the phone (fivescreens) and the wide screens (fivescreenswide).
// A failure saves a picture in tests/out/fivescreens/.
export const PHONES:FitSize[]=[
 {name:'phoneport',w:390,h:844,touch:true},
 {name:'phoneportlittle',w:390,h:844,touch:true,age:'little'},
 {name:'phoneland',w:844,h:390,touch:true},
 {name:'phonelandlittle',w:844,h:390,touch:true,age:'little'},
];
export const WIDE:FitSize[]=[
 {name:'tabletport',w:820,h:1180,touch:true},
 {name:'tabletland',w:1280,h:800,touch:true},
 {name:'tabletlandlittle',w:1280,h:800,touch:true,age:'little'},
 {name:'computer',w:1440,h:900,touch:false},
];
const pick=(list:FitSize[])=>{const p=(process.env.SV_FIT_SIZES||'').split(',').filter(Boolean);return list.filter(s=>!p.length||p.includes(s.name));};
const say=(r:{count:number,sizes:FitSize[]})=>`${r.count} games at ${r.sizes.map(s=>`${s.name} ${s.w}x${s.h}`).join(', ')}: inside the screen, no scrolling, text at least 16 px, touch targets at least 44/64 px, no overlaps`;
export async function fiveScreensCheck(browser:Browser){return say(await fitGames(browser,pick(PHONES),{dir:'fivescreens',taps:true}));}
export async function fiveScreensWideCheck(browser:Browser){return say(await fitGames(browser,pick(WIDE),{dir:'fivescreens',taps:true}));}
