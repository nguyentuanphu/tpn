import {publicFestivals,onPublicFestivals,startPublicFestivals} from '../js/festival-live.js';
declare global{interface Window{svFestivalVisible?:(id:string)=>boolean;}}
const guideId=(id:string)=>id.startsWith('quest-daily-fest_')?id.slice('quest-daily-fest_'.length):id.startsWith('quest-festival-')?id.slice('quest-festival-'.length):id.startsWith('quest-hunt-')?id.slice('quest-hunt-'.length):null;
export function setupWebsiteFestivals(){
 window.svFestivalVisible=id=>publicFestivals()?.enabled.includes(id)===true;
 const apply=()=>{
  const state=publicFestivals(),any=!!state?.enabled.length;
  document.querySelectorAll<HTMLElement>('.festival-card').forEach(card=>{
   const id=card.id.slice('festival-'.length);card.dataset.festivalVisible=String(window.svFestivalVisible(id));
   const rule=state?.festivals[id];
   card.querySelectorAll<HTMLElement>('[data-festival-dates],[data-fest-iso]').forEach(el=>{
    if(!el.dataset.originalFestivalDates&&el.dataset.festivalDates)el.dataset.originalFestivalDates=el.dataset.festivalDates;
    if(!el.dataset.originalFestIso&&el.dataset.festIso)el.dataset.originalFestIso=el.dataset.festIso;
    if(!el.dataset.originalFestBuild&&el.dataset.festBuild)el.dataset.originalFestBuild=el.dataset.festBuild;
    if(el.dataset.originalFestivalDates)el.dataset.festivalDates=el.dataset.originalFestivalDates;
    if(el.dataset.originalFestIso)el.dataset.festIso=el.dataset.originalFestIso;
    if(el.dataset.originalFestBuild)el.dataset.festBuild=el.dataset.originalFestBuild;
    if(rule?.buildup!=null)el.dataset.festBuild=String(rule.buildup);
    if(!rule?.date)return;
    const iso:Record<string,string>=JSON.parse(el.dataset.festIso||'{}'),dates:Record<string,string[]>=JSON.parse(el.dataset.festivalDates||'{}');
    for(const year of new Set([...Object.keys(iso),...Object.keys(dates)])){
     const moved=rule.date.length===5?`${year}-${rule.date}`:rule.date.startsWith(year+'-')?rule.date:null;if(!moved)continue;
     const day=new Date(moved+'T12:00:00');if(!Number.isFinite(+day))continue;
     if(year in iso)iso[year]=moved;
     if(year in dates)dates[year]=['en-AU','vi-VN'].map(locale=>new Intl.DateTimeFormat(locale,{day:'numeric',month:'long',year:'numeric'}).format(day));
    }
    if(el.dataset.festIso)el.dataset.festIso=JSON.stringify(iso);
    if(el.dataset.festivalDates)el.dataset.festivalDates=JSON.stringify(dates);
   });
  });
  document.querySelectorAll<HTMLElement>('[id^="quest-daily-fest_"],[id^="quest-festival-"],[id^="quest-hunt-"]').forEach(el=>{const id=guideId(el.id);el.dataset.festivalVisible=String(!!id&&window.svFestivalVisible(id));});
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#festival-"],a[href^="#quest-daily-fest_"]').forEach(link=>{
   const id=link.hash.startsWith('#festival-')?link.hash.slice(10):guideId(link.hash.slice(1));link.hidden=!id||!window.svFestivalVisible(id);
  });
  for(const id of['festival','festival-overview','guide-festivals']){const el=document.getElementById(id);if(el)el.hidden=!any;}
  document.querySelectorAll<HTMLAnchorElement>('a[href="#festivals"],a[href="#festival"]').forEach(link=>{link.hidden=!any;});
  document.dispatchEvent(new Event('sv-festivals-change'));
  const count=document.querySelector('#festival-count');
  if(count&&!state)count.textContent=document.documentElement.lang==='vi'?'Kết nối mạng để xem lịch lễ hội đã bật.':'Connect to see the enabled festival calendar.';
 };
 onPublicFestivals(apply);apply();startPublicFestivals();
}
