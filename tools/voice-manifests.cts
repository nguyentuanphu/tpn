// One writer shared by the recording tool and Studio. Keep the aggregate for old clients.
const { createHash } = require('node:crypto');
// voices/manifest.json (every language) and one language's part of it (voices/manifest-<lang>.json)
type Manifest = { version?: number, engine?: string, model?: string, made?: string, cast?: Record<string, string[]>,
  voices?: Record<string, Record<string, string>>, lines?: Record<string, string>, tpl?: Record<string, unknown[]>, areas?: unknown,
  other?: Record<string, string>, langOf?: Record<string, string>, formats?: string[] };
type Shard = Manifest & { language: string, signature?: string };
function splitManifest(man: Manifest): Record<string, Shard> {
  const language = new Map();
  for (const [lang, hashes] of Object.entries(man.other || {})) for (const h of String(hashes).split(' ')) if (h) language.set(h, lang);
  const out: Record<string, Shard> = {};
  for (const lang of ['en', 'vi', 'zh', 'hi']) {
    const lines = Object.fromEntries(Object.entries(man.lines || {}).filter(([h]) => (man.langOf?.[h] || language.get(h) || 'en') === lang));
    const shard: Shard = { version: man.version, engine: man.engine, model: man.model, made: man.made, language: lang,
      cast: { [lang]: man.cast?.[lang] || [] }, voices: { [lang]: man.voices?.[lang] || {} }, lines,
      tpl: { [lang]: man.tpl?.[lang] || [] }, areas: man.areas };
    // (v1.08 fix, check voiceopus) the formats there are (tools/make-voice-opus.mts) stay when the lists are written again
    // (--areas, Studio); a recording run starts without them and its Opus step writes them back
    if (Array.isArray(man.formats)) shard.formats = [...man.formats];
    // Recording dates and other languages changing must not invalidate this language's saved-pack marker.
    shard.signature = createHash('sha256').update(JSON.stringify({ lines, tpl: shard.tpl, cast: shard.cast, voices: shard.voices })).digest('hex');
    out[lang] = shard;
  }
  return out;
}
const voiceManifests = { splitManifest };
module.exports = voiceManifests;
// (as in studio/core.cts: TypeScript cannot see module.exports, and an "export" would make esbuild treat this file as a
// module when it bundles Studio) its shape, named for every file
declare global { type VoiceManifests = typeof voiceManifests; }
