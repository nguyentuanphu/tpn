// Small accessible SVG charts. Numbers come from scoped API responses, never fixtures.
export type ChartPoint = {label:string;value:number|null;target?:string};
export type ChartSpec = {id:string;title:string;unit:string;points:ChartPoint[];explanation:string;source:string;limit:string;line?:boolean;formatValue?:(value:number)=>string};
const escape = (s:unknown) => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function deskChart(spec:ChartSpec,T:(en:string,vi:string)=>string):string {
 const values=spec.points.filter(p=>p.value!==null&&Number.isFinite(p.value));
 const max=Math.max(1,...values.map(p=>Math.abs(p.value!))),height=Math.max(120,spec.line?180:values.length*45+20),width=520;
 const fmt=spec.formatValue||((n:number)=>new Intl.NumberFormat(T('en-AU','vi-VN'),{maximumFractionDigits:1}).format(n));
 let svg='';
 if(values.length&&spec.line){
  const x=(i:number)=>40+i*(width-75)/Math.max(1,spec.points.length-1),y=(n:number)=>height-35-(height-65)*n/max;
  let open=false;const path=spec.points.map((p,i)=>{if(p.value===null||!Number.isFinite(p.value)){open=false;return '';}const d=(open?'L':'M')+x(i)+' '+y(p.value);open=true;return d;}).join(' ');
  svg=`<path d="${path}" class="desk-line"/>`+spec.points.map((p,i)=>p.value===null?'':`<circle cx="${x(i)}" cy="${y(p.value)}" r="4" class="desk-dot"><title>${escape(p.label)}: ${escape(fmt(p.value))} ${escape(spec.unit)}</title></circle>`).join('')+`<text x="40" y="${height-8}">${escape(spec.points[0].label)}</text><text x="${width-30}" y="${height-8}" text-anchor="end">${escape(spec.points.at(-1)!.label)}</text><text x="8" y="20">${escape(fmt(max))}</text><text x="8" y="${height-34}">0</text>`;
 }else if(values.length){
  const negative=values.some(p=>p.value!<0),origin=negative?(width-90)/2:0;
  svg=values.map((p,i)=>{const span=(width-90)*p.value!/max/(negative?2:1);return `<text x="0" y="${i*45+17}">${escape(p.label.length>35?p.label.slice(0,33)+'…':p.label)}</text><rect class="desk-bar" x="${Math.min(origin,origin+span)}" y="${i*45+24}" height="8" rx="4" width="${Math.abs(span)}"/><text x="${width-4}" y="${i*45+31}" text-anchor="end">${escape(fmt(p.value!))}</text>`;}).join('');
 }
 return `<section class="card desk-chart" data-chart="${escape(spec.id)}"><h3>${escape(spec.title)}</h3><p class="note">${escape(spec.unit)}</p>${values.length?`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(spec.title+' — '+spec.unit)}"><title>${escape(spec.title)}</title>${svg}</svg>`:`<p class="desk-empty">${escape(T('No eligible observations for this graph.','Chưa có quan sát phù hợp cho biểu đồ này.'))}</p>`}<p class="note">${escape(spec.limit)}</p><details class="desk-chart-explain"><summary>${escape(T('Explain graph / show data','Giải thích biểu đồ / xem dữ liệu'))}</summary><p>${escape(spec.explanation)}</p><p class="note">${escape(spec.source)}</p><div class="desk-table"><table><caption>${escape(spec.title+' · '+spec.unit)}</caption><thead><tr><th>${escape(T('Observation','Quan sát'))}</th><th>${escape(spec.unit)}</th></tr></thead><tbody>${spec.points.map(p=>`<tr><td>${p.target?`<button type="button" class="desk-text" data-desk-route="${escape(p.target)}">${escape(p.label)}</button>`:escape(p.label)}</td><td>${p.value===null?escape(T('Unavailable','Chưa có số liệu')):escape(fmt(p.value))}</td></tr>`).join('')}</tbody></table></div></details></section>`;
}
// (v1.07, G03) columns split into parts (for example new and returning devices per day). A day with no report is a gap
// (no column) and says "Unavailable" in the table, never zero.
export type StackPoint = {label:string;parts:number[]|null};
export type StackSpec = {id:string;title:string;unit:string;series:string[];points:StackPoint[];explanation:string;source:string;limit:string};
export function deskStack(spec:StackSpec,T:(en:string,vi:string)=>string):string {
 const known=spec.points.filter(p=>p.parts&&p.parts.every(n=>Number.isFinite(n)));
 const max=Math.max(1,...known.map(p=>p.parts!.reduce((a,b)=>a+b,0))),width=520,height=200,left=34,bottom=34,step=(width-left-6)/Math.max(1,spec.points.length),bar=Math.max(3,Math.min(24,step*0.7));
 const fmt=(n:number)=>new Intl.NumberFormat(T('en-AU','vi-VN'),{maximumFractionDigits:1}).format(n);
 const y=(n:number)=>(height-bottom-14)*n/max;
 const cols=spec.points.map((p,i)=>{if(!p.parts)return '';let base=height-bottom;return p.parts.map((n,k)=>{const h=y(n);base-=h;return n>0?`<rect class="desk-stack-${k}" x="${(left+i*step+(step-bar)/2).toFixed(1)}" y="${base.toFixed(1)}" width="${bar.toFixed(1)}" height="${h.toFixed(1)}" rx="2"><title>${escape(p.label)} · ${escape(spec.series[k])}: ${escape(fmt(n))}</title></rect>`:'';}).join('');}).join('');
 const svg=`${cols}<text x="${left}" y="${height-10}">${escape(spec.points[0]?.label||'')}</text><text x="${width-6}" y="${height-10}" text-anchor="end">${escape(spec.points.at(-1)?.label||'')}</text><text x="4" y="16">${escape(fmt(max))}</text><text x="4" y="${height-bottom}">0</text>`;
 const legend=`<p class="desk-legend">${spec.series.map((name,k)=>`<span><i class="desk-stack-${k}" aria-hidden="true"></i>${escape(name)}</span>`).join('')}</p>`;
 return `<section class="card desk-chart" data-chart="${escape(spec.id)}"><h3>${escape(spec.title)}</h3><p class="note">${escape(spec.unit)}</p>${known.length?`${legend}<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(spec.title+' — '+spec.unit)}"><title>${escape(spec.title)}</title>${svg}</svg>`:`<p class="desk-empty">${escape(T('No eligible observations for this graph.','Chưa có quan sát phù hợp cho biểu đồ này.'))}</p>`}<p class="note">${escape(spec.limit)}</p><details class="desk-chart-explain"><summary>${escape(T('Explain graph / show data','Giải thích biểu đồ / xem dữ liệu'))}</summary><p>${escape(spec.explanation)}</p><p class="note">${escape(spec.source)}</p><div class="desk-table"><table><caption>${escape(spec.title+' · '+spec.unit)}</caption><thead><tr><th>${escape(T('Observation','Quan sát'))}</th>${spec.series.map(n=>`<th>${escape(n)}</th>`).join('')}</tr></thead><tbody>${spec.points.map(p=>`<tr><td>${escape(p.label)}</td>${p.parts?p.parts.map(n=>`<td>${escape(fmt(n))}</td>`).join(''):`<td colspan="${spec.series.length}">${escape(T('Unavailable','Chưa có số liệu'))}</td>`}</tr>`).join('')}</tbody></table></div></details></section>`;
}
