/** Authoritative public speech routes. Private family speech must never enter either cloud queue. */
export const VOICE_DELIVERY={codec:'mp3',bitrate:32000,sampleRate:16000,channels:1}as const;
export const AZURE_OUTPUT_FORMAT=`audio-${VOICE_DELIVERY.sampleRate/1000}khz-${VOICE_DELIVERY.bitrate/1000}kbitrate-${VOICE_DELIVERY.channels===1?'mono':'stereo'}-${VOICE_DELIVERY.codec}`;
export const AZURE_VOICES={en:{f:'en-AU-NatashaNeural',m:'en-AU-WilliamNeural'},vi:{f:'vi-VN-HoaiMyNeural',m:'vi-VN-NamMinhNeural'},zh:{m:'zh-CN-YunxiNeural'},hi:{m:'hi-IN-MadhurNeural'}};
export const FPT_VOICE={provider:'FPT Neo',model:'FPT.AI-VITs',voice:'leminh',speed:1,response_format:'mp3'};
export type SpeechRoute={provider:'azure'|'fpt';language:string;slot:string;voice:string;deliveryDirectory:string};
export function speechRoutes(language:string,privateFamily=false):SpeechRoute[]{
 if(privateFamily)return[];
 const cast=AZURE_VOICES[language as keyof typeof AZURE_VOICES];
 if(!cast)throw Error('No approved speech provider for language: '+language);
 const routes:SpeechRoute[]=Object.entries(cast).map(([slot,voice])=>({provider:'azure',language,slot,voice,deliveryDirectory:`voices/${language}/${slot}`}));
 if(language==='vi')routes.push({provider:'fpt',language,slot:'leminh',voice:FPT_VOICE.voice,deliveryDirectory:'voices/fpt-leminh-v1'});
 return routes;
}
