// Play the finished MP4s at 1x to ended, without seeking; capture decoded frames.
// SV_URL=... node tools/meshy/play_cow_review.mts OUTPUT /repo/path/near.mp4 /repo/path/far.mp4
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(new URL('../../tests/package.json',import.meta.url))('playwright');
const [out,...paths]=process.argv.slice(2);if(!out||paths.length!==2)throw Error('Expected output and two MP4 paths');
mkdirSync(out,{recursive:true});
const base=process.env.SV_URL||'http://127.0.0.1:8798';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1000,height:840}}),results=[];
 for(const [index,path]of paths.entries()){
  await page.goto(base+'/docs/meshy-farm-cloud/model-review.html');
  const result=await page.evaluate(async src=>{
   document.body.replaceChildren();const video=document.createElement('video');video.width=1000;video.height=840;video.muted=true;video.controls=true;video.playsInline=true;document.body.append(video);
   const times=[],frames=[],events=[],targets=[0,2,4,6,8,10,12,14,16,18,20];let target=0;
   video.addEventListener('seeking',()=>events.push({type:'seeking',at:video.currentTime}));
   video.addEventListener('ratechange',()=>events.push({type:'ratechange',rate:video.playbackRate}));
   video.src=src;await new Promise<void>((resolve,reject)=>{video.onloadedmetadata=()=>resolve();video.onerror=()=>reject(Error('MP4 metadata failed'));});
   const began=performance.now();
   const sample=(_now,metadata)=>{times.push(metadata.mediaTime);if(target<targets.length&&metadata.mediaTime>=targets[target]){
    const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);frames.push({at:metadata.mediaTime,png:canvas.toDataURL('image/png')});target++;
   }if(!video.ended)video.requestVideoFrameCallback(sample);};video.requestVideoFrameCallback(sample);
   const end=new Promise<void>((resolve,reject)=>{video.onended=()=>resolve();video.onerror=()=>reject(Error('Playback failed'));setTimeout(()=>reject(Error('Playback did not reach ended')),45000);});
   await video.play();await end;
   const quality=video.getVideoPlaybackQuality();return {duration:video.duration,ended:video.ended,currentTime:video.currentTime,rate:video.playbackRate,wallSeconds:(performance.now()-began)/1000,totalFrames:quality.totalVideoFrames,droppedFrames:quality.droppedVideoFrames,times,events,frames};
  },base+path);
  const tier=index===0?'near':'far';
  for(const [i,frame]of result.frames.entries())writeFileSync(`${out}/${tier}-${String(i).padStart(2,'0')}.png`,Buffer.from(frame.png.split(',')[1],'base64'));
  const {frames,...report}=result;
  const ok=report.ended&&report.rate===1&&report.events.length===0&&report.currentTime>=report.duration-.1&&report.wallSeconds>=report.duration*.95&&report.times.length>report.duration*8&&report.times.every((t,i,a)=>!i||t>=a[i-1]);
  results.push({tier,path,...report,capturedFrames:frames.map(f=>f.at),pass:ok});if(!ok)process.exitCode=1;
  console.log(tier,ok?'PASS':'FAIL',report.duration,report.times.length,'presented callbacks');
 }
 writeFileSync(out+'/playback.json',JSON.stringify(results,null,2)+'\n');
}finally{await browser.close();}
