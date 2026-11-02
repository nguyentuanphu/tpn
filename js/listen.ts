// Talking to the game: the device's own speech recognition (Safari on iPhone/iPad, Chrome on Android).
// Most devices send the sound to Apple or Google to turn it into words, so this needs the internet.
// Nothing is stored. Children press the 🎤 button, say something, and the game understands simple commands.
import { settings } from './state.js';

import { ac, micMode } from './audio.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
// iPhone/iPad apps added to the Home Screen do not support speech recognition reliably, so the 🎤 button
// is hidden there (it still works in Safari itself).
const iosHomeScreen = navigator.standalone === true;
export const canListen = () => !!SR && !iosHomeScreen;

let active = null, cancelActive = null;
// Listen once. Resolves with what was heard ('' if nothing). onPartial shows words as they come in.
export function listen({ onPartial, lang } = {}) {
  if (!SR) return Promise.resolve('');
  stopListening();
  return new Promise(res => {
    const r = new SR(); active = r;
    r.lang = (lang || settings.lang) === 'vi' ? 'vi-VN' : 'en-AU';
    r.interimResults = true; r.maxAlternatives = 1; r.continuous = false;
    let best = '', done = false, hard = null;
    const finish = () => {
      if (done) return; done = true; active = null; clearTimeout(hard); micMode('listen', false);
      try { r.abort(); } catch (e) { }
      // wake the game's sound back up (listening can pause it on phones)
      setTimeout(() => { try { const a = ac(); a && a.resume && a.resume(); } catch (e) { } }, 300);
      res(best.trim());
    };
    cancelActive = () => { best = ''; finish(); };
    r.onresult = e => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; best = t; onPartial && onPartial(t); };
    r.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') best = '\u0000denied'; finish(); };
    r.onend = finish;
    micMode('listen', true);   // (Round V) iPhone cannot listen in its play-only sound mode (audio.js)
    try { r.start(); } catch (e) { finish(); }
    setTimeout(() => { try { r.stop(); } catch (e) { } }, 7000);
    hard = setTimeout(finish, 9000); // never wait forever, even if the device never answers
  });
}
export function stopListening() { if (cancelActive) { const c = cancelActive; cancelActive = null; c(); } else if (active) { try { active.abort(); } catch (e) { } active = null; } }

// Lower case, no Vietnamese accents, so "đi đến làng sen" and "di den lang sen" match the same way.
export const plain = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();
export const has = (text, ...words) => { const t = ' ' + plain(text) + ' '; return words.some(w => t.includes(' ' + plain(w) + ' ') || (plain(w).includes(' ') && t.includes(plain(w)))); };
