import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import type { Browser } from 'playwright';
import { lineHash } from '../js/packhash.js';
import { mixedVoiceFragments } from '../js/voice-fragments.js';

const LINE = 'Welcome to Hà Nội, enjoy bánh khọt!';
const PRIVATE = 'Our family has a private question about Hà Nội.';
const WELCOME = 'Hello! Welcome to Sparkle Valley.';
const fragments = mixedVoiceFragments(LINE)!;
const hash = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');

// Deliberately synthetic tones identify which prerecorded source was used. Production voice/text identity and
// MP3 decoding are verified separately by the recording/package audit; this check does not claim a listening review.
function wave(frequency: number) {
  const rate = 8000, samples = 1600, bytes = Buffer.alloc(44 + samples * 2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 2, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) bytes.writeInt16LE(Math.round(Math.sin(i * frequency * Math.PI * 2 / rate) * 10000), 44 + i * 2);
  return bytes;
}
const complete = wave(110), english = wave(330), vietnamese = wave(660);
declare global {
  interface Window {
    __mixedVoiceBuffers?: Array<{ duration: number; frequencies: number[] }>;
    __mixedDeviceWords?: string[];
  }
}

export async function mixedHanoiVoiceCheck(browser: Browser) {
  const cases = ['standard', 'mixed', 'missing', 'corrupt', 'cancel', 'warm', 'preview', 'private', 'private-remote'] as const;
  for (const mode of cases) {
    const context = await browser.newContext(), page = await context.newPage(), requests: string[] = [], errors: string[] = [];
    let release: () => void = () => {};
    const held = new Promise<void>(resolve => { release = resolve; });
    page.on('pageerror', error => errors.push(error.message));
    try {
      const enLines: Record<string, string[]> = Object.fromEntries([LINE, WELCOME, ...fragments.filter(f => f.lang === 'en').map(f => f.text)].map(text => [lineHash('en', text), ['f', 'm']]));
      if (mode === 'missing') delete enLines[lineHash('en', fragments.find(f => f.lang === 'en')!.text)];
      const viLines = Object.fromEntries(fragments.filter(f => f.lang === 'vi').map(f => [lineHash('vi', f.text), { bytes: vietnamese.length, sha256: hash(vietnamese) }]));
      await page.route('**/__mixed-voice', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><button>Start</button></body></html>' }));
      await page.route('**/voices/manifest-en.json', route => route.fulfill({ json: { language: 'en', version: 2, signature: 'mixed-fixture', lines: enLines, tpl: {}, cast: {}, voices: {} } }));
      await page.route('**/voices/fpt-leminh-v1/**', async route => {
        const url = new URL(route.request().url()); requests.push(url.pathname);
        if (url.pathname.endsWith('manifest.json')) return route.fulfill({ json: { schema: 1, provider: 'FPT Neo', model: 'FPT.AI-VITs', voice: 'leminh', language: 'vi', signature: 'mixed-fixture', bytes: Object.keys(viLines).length * vietnamese.length, lines: viLines } });
        if (mode === 'cancel') await held;
        return route.fulfill({ contentType: 'audio/wav', body: mode === 'corrupt' ? Buffer.from('invalid') : vietnamese });
      });
      await page.route(/\/voices\/en\/[fm]\/[^/]+\.mp3$/, route => {
        const url = new URL(route.request().url()); requests.push(url.pathname);
        const full = [lineHash('en', LINE), lineHash('en', WELCOME)].some(id => url.pathname.endsWith(id + '.mp3'));
        return route.fulfill({ contentType: 'audio/wav', body: full ? complete : english });
      });
      await page.goto('http://localhost:8765/__mixed-voice');
      await page.evaluate(({mode}) => {
        Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class extends EventTarget{text:string;voice:unknown;lang='';rate=1;pitch=1;volume=1;onend:((event:Event)=>void)|null=null;onerror:((event:Event)=>void)|null=null;constructor(text:string){super();this.text=text;}dispatchEvent(event:Event){if(event.type==='end')this.onend?.(event);if(event.type==='error')this.onerror?.(event);return super.dispatchEvent(event);}}});
        window.__mixedVoiceBuffers = []; window.__mixedDeviceWords = [];
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { getVoices: () => [{name:'Fixture local English',lang:'en-AU',localService:mode!=='private-remote'}], addEventListener() {}, cancel() {}, resume() {}, speak(utterance: SpeechSynthesisUtterance) { window.__mixedDeviceWords!.push(utterance.text); setTimeout(() => utterance.dispatchEvent(new Event('end')), 1); } } });
        const start = AudioBufferSourceNode.prototype.start;
        AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof start>) {
          const buffer = this.buffer;
          if (buffer) {
            const data = buffer.getChannelData(0), frequencies = [.08, .32, .70, .94].filter(time => time < buffer.duration).map(time => {
              const first = Math.round(time * buffer.sampleRate), length = Math.round(.04 * buffer.sampleRate);
              let changes = 0; for (let i = first + 1; i < Math.min(data.length, first + length); i++) if (data[i - 1] <= 0 && data[i] > 0) changes++;
              return changes / (length / buffer.sampleRate);
            });
            window.__mixedVoiceBuffers!.push({ duration: buffer.duration, frequencies });
          }
          return start.apply(this, args);
        };
      },{mode});
      await page.evaluate(async mode => {
        const S = await import(String('/js/state.js'));
        Object.assign(S.settings, { lang: 'en', bilingual: false, voice: true, voiceMale: false, voiceStyle: 'natural', autoPack: false, sound: false, music: false, packCell: false, voiceViVariant: mode === 'standard' ? 'standard' : 'leminh' });
        await import(String('/js/voice.js'));
      }, mode);
      await page.locator('button').click();
      // audio.ts unlocks iPhone audio with a one-sample silent source on this real tap. Start observing the spoken
      // operation after that completed gesture; every source started by the operation itself remains asserted.
      await page.evaluate(() => { window.__mixedVoiceBuffers = []; });
      if (mode === 'private' || mode === 'private-remote') {
        await page.evaluate(async text => { const V = await import(String('/js/voice.js')); await V.sayPrivateFamilyLine('en', text); }, PRIVATE);
        assert.deepEqual(await page.evaluate(() => window.__mixedDeviceWords), mode==='private'?[PRIVATE]:[], 'private words never use a cloud-backed OS voice');
        assert.equal(requests.some(url => url.endsWith('.mp3')), false, 'private speech must not enter fragment lookups');
        assert.equal(await page.evaluate(async text => JSON.stringify((await import(String('/js/voice.js'))).voiceMisses()).includes(text), PRIVATE), false);
      } else if (mode === 'cancel') {
        const speaking = page.evaluate(async text => { await (await import(String('/js/voice.js'))).sayAsync(text, text); }, LINE);
        for (let i = 0; i < 100 && !requests.some(url => /fpt-leminh-v1\/.+\.mp3$/.test(url)); i++) await page.waitForTimeout(20);
        assert.ok(requests.some(url => /fpt-leminh-v1\/.+\.mp3$/.test(url)), 'hold an actual in-flight fragment');
        await page.evaluate(async () => (await import(String('/js/voice.js'))).hush()); release(); await speaking;
        assert.deepEqual(await page.evaluate(() => window.__mixedVoiceBuffers), [], 'cancelling preflight must not play a fragment or fallback afterward');
      } else {
        if (mode === 'warm') {
          await page.evaluate(async text => (await import(String('/js/voice.js'))).warmVoiceLine(text), LINE);
          requests.length = 0;
        }
        if (mode === 'preview') await page.evaluate(async () => (await import(String('/js/voice.js'))).previewPackVoice('m'));
        else await page.evaluate(async text => (await import(String('/js/voice.js'))).sayAsync(text, text), LINE);
        const recordings = await page.evaluate(() => window.__mixedVoiceBuffers!);
        assert.equal(recordings.length, 1, mode + ': a complete line uses one cancellable playback source: ' + JSON.stringify(recordings));
        if (mode === 'mixed' || mode === 'warm') {
          assert.ok(Math.abs(recordings[0].duration - 1.06) < .01, JSON.stringify(recordings));
          assert.equal(recordings[0].frequencies.length, 4);
          recordings[0].frequencies.forEach((frequency, i) => assert.ok(Math.abs(frequency - (i % 2 ? 660 : 330)) < 30, JSON.stringify(recordings)));
          assert.deepEqual(await page.evaluate(() => window.__mixedDeviceWords), [], 'known recorded fragments never use device speech');
          if (mode === 'warm') assert.equal(requests.some(url => url.endsWith('.mp3')), false, 'film warmup must cache the selected composite recording');
        } else {
          assert.ok(Math.abs(recordings[0].duration - .2) < .01, 'missing/corrupt fragments preserve the original complete recording');
          assert.ok(Math.abs(recordings[0].frequencies[0] - 110) < 30);
          if (mode === 'standard' || mode === 'preview') assert.equal(requests.some(url => url.includes('fpt-leminh-v1')), false, 'female default and male preview must avoid optional fragments');
          if (mode === 'preview') assert.ok(requests.some(url => url.includes('/en/m/')), 'the male preview retains its requested slot');
        }
      }
      assert.deepEqual(errors, []);
    } finally { release(); await context.unrouteAll({ behavior: 'ignoreErrors' }); await context.close(); }
  }
  return 'Deterministic recorded-audio identity checks: selected English/VI composite order and pauses, whole-recording fallback before any partial playback, cancellation, warmup, female default, male preview and private on-device speech';
}
