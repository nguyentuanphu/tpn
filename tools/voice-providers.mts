/** Authoritative public speech routes. Private family speech must never enter either cloud queue. */
export const VOICE_DELIVERY={codec:'mp3',bitrate:32000,sampleRate:16000,channels:1}as const;
export const AZURE_OUTPUT_FORMAT=`audio-${VOICE_DELIVERY.sampleRate/1000}khz-${VOICE_DELIVERY.bitrate/1000}kbitrate-${VOICE_DELIVERY.channels===1?'mono':'stereo'}-${VOICE_DELIVERY.codec}`;
// (owner, 3 Nov 2026 AEDT, v1.08 voices-aside) the male English and Vietnamese voices and Lê Minh are put aside
// (voices-aside/README.md): the tools record only the female voices. SV_ASIDE_VOICES=1 (or --aside-voices) switches
// the male voices and the Lê Minh route back on. Chinese and Hindi keep their one voice.
export const ASIDE_VOICES_ON=process.env.SV_ASIDE_VOICES==='1'||process.argv.includes('--aside-voices');
export const AZURE_VOICES_ALL={en:{f:'en-AU-NatashaNeural',m:'en-AU-WilliamNeural'},vi:{f:'vi-VN-HoaiMyNeural',m:'vi-VN-NamMinhNeural'},zh:{m:'zh-CN-YunxiNeural'},hi:{m:'hi-IN-MadhurNeural'}};
export const AZURE_VOICES:Record<string,Record<string,string>>=ASIDE_VOICES_ON?AZURE_VOICES_ALL:{en:{f:AZURE_VOICES_ALL.en.f},vi:{f:AZURE_VOICES_ALL.vi.f},zh:AZURE_VOICES_ALL.zh,hi:AZURE_VOICES_ALL.hi};
export const FPT_VOICE={provider:'FPT Neo',model:'FPT.AI-VITs',voice:'leminh',speed:1,response_format:'mp3'};
export type SpeechRoute={provider:'azure'|'fpt';language:string;slot:string;voice:string;deliveryDirectory:string};
export function speechRoutes(language:string,privateFamily=false):SpeechRoute[]{
 if(privateFamily)return[];
 const cast=AZURE_VOICES[language];
 if(!cast)throw Error('No approved speech provider for language: '+language);
 const routes:SpeechRoute[]=Object.entries(cast).map(([slot,voice])=>({provider:'azure',language,slot,voice,deliveryDirectory:`voices/${language}/${slot}`}));
 if(language==='vi'&&ASIDE_VOICES_ON)routes.push({provider:'fpt',language,slot:'leminh',voice:FPT_VOICE.voice,deliveryDirectory:'voices/fpt-leminh-v1'});
 return routes;
}
