// (Round U, owner 11 Oct: "Ông Cú as a guide") Each visit to Ông Cú after his first welcome, he explains one new thing
// about the valley (js/content/owllessons.js) on a picture page, read aloud. Loaded only when he is visited (js/main.js).
import { T, nm } from './i18n.js';
import { say, hush } from './voice.js';
import { SFX } from './audio.js';
import { pic } from './art.js';
import { el, esc } from './util.js';
import { saveProfiles } from './state.js';
import { OWL_LESSONS } from './content/owllessons.js';

// the next lesson this child has not heard (or the first again once all are heard)
export const nextLesson = p => OWL_LESSONS.find(l => !(p.owlLessons || []).includes(l.id)) || OWL_LESSONS[(p.owlLessons || []).length % OWL_LESSONS.length];

export function owlLesson(p) {
  const L = nextLesson(p); let i = 0;
  return new Promise(res => {
    const b = el('div', 'storybook quest-tale owl-lesson', `<div class="sb-title">${pic('🦉')} ${esc(nm('Ông Cú'))} ${T('explains', 'chỉ cho con')}</div><div class="sb-art in">${pic(L.icon)}</div>
      <p class="sb-text"></p><div class="sb-foot"><button class="qt-go"></button></div>`);
    document.body.appendChild(b); SFX.chime();
    const text = b.querySelector('.sb-text'), go = b.querySelector('.qt-go');
    const show = () => { const [en, vi] = L.lines[i]; text.textContent = T(en, vi); say(en, vi); go.innerHTML = i < L.lines.length - 1 ? '▶ ' + esc(T('Next', 'Tiếp')) : '✔ ' + esc(T('Got it!', 'Con hiểu rồi!')); };
    go.onclick = () => { SFX.tap(); if (i < L.lines.length - 1) { i++; show(); return; }
      hush(); const seen = p.owlLessons = Array.isArray(p.owlLessons) ? p.owlLessons : []; if (!seen.includes(L.id)) seen.push(L.id); else { p.owlLessons = [L.id]; } saveProfiles();
      b.classList.add('out'); setTimeout(() => { b.remove(); res(L.id); }, 300); };
    show();
  });
}
