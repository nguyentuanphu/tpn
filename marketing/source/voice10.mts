// Voice-over for the ten ads (r82) (owner, 11 Oct): every scene's line in English and Vietnamese with Azure neural voices.
// node voice10.mts   (needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION; writes voice10/<id>-<lang>.mp3 and voice10/durations.json)
import fs from 'fs';
import { execFileSync } from 'child_process';
const DIR = new URL('./voice10/', import.meta.url).pathname; fs.mkdirSync(DIR, { recursive: true });
globalThis.window = {}; await import('./ads10.js'); const ADS = window.ADS10;
const KEY = process.env.AZURE_SPEECH_KEY, REGION = process.env.AZURE_SPEECH_REGION;
if (!KEY || !REGION) throw new Error('AZURE_SPEECH_KEY / AZURE_SPEECH_REGION not set');
const VOICE = { en: ['en-AU', 'en-AU-NatashaNeural'], vi: ['vi-VN', 'vi-VN-HoaiMyNeural'] };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const dur = {};
for (const [name, scenes] of Object.entries(ADS)) for (const s of scenes) for (const [k, lang] of [[0, 'en'], [1, 'vi']]) {
  const f = `${DIR}${s.id}-${lang}.mp3`;
  if (!fs.existsSync(f)) {
    const [xl, v] = VOICE[lang];
    const ssml = `<speak version="1.0" xml:lang="${xl}"><voice name="${v}"><prosody rate="-4%">${esc(s.say[k])}</prosody></voice></speak>`;
    const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3', 'User-Agent': 'sparkle-valley-ads' }, body: ssml });
    if (!r.ok) throw new Error(`${s.id}-${lang}: ${r.status} ${await r.text()}`);
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  }
  dur[`${s.id}-${lang}`] = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
}
fs.writeFileSync(DIR + 'durations.json', JSON.stringify(dur, null, 1));
console.log(Object.keys(dur).length, 'lines;', Object.entries(dur).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', '));
