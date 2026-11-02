import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';
export async function musicAudioCheck(browser: Browser): Promise<string> {
  const P=await open(browser,{w:390,h:844,touch:true,settings:{sound:true,music:false,voice:false,tapSounds:false}});
  try {
    await clear(P.page);await noWelcome(P.page);
    const audio=await P.page.evaluateHandle(()=>{
      const log={starts:0,frequencies:[] as number[]},start=OscillatorNode.prototype.start,scheduled=new WeakMap<AudioParam,number>(),set=AudioParam.prototype.setValueAtTime;
      AudioParam.prototype.setValueAtTime=function(value:number,time:number){scheduled.set(this,value);return set.call(this,value,time);};
      OscillatorNode.prototype.start=function(...args:Parameters<OscillatorNode['start']>){log.starts++;log.frequencies.push(scheduled.get(this.frequency)??this.frequency.value);return start.apply(this,args);};return log;
    });
    await P.page.evaluate(()=>{window.__sv.heroes[0].profile.age='little';void window.__sv.playGame(0,'music','replay');});await P.page.locator('.mc-pad').first().waitFor();
    if(await P.page.locator('.mc-tab').count()!==4)throw Error('Not all four instruments available');
    for(let instrument=0;instrument<4;instrument++){
      await P.page.locator('.mc-tab').nth(instrument).click();
      const targets=await P.page.locator('.mc-pad,.mc-row button,.mc-tab').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {w:r.width,h:r.height};}));
      if(targets.some(r=>r.w<64||r.h<64))throw Error('Small music targets: '+JSON.stringify({instrument,targets}));
      for(let note=0;note<8;note++){
        const before=await audio.evaluate(l=>l.starts);
        await P.page.locator('.mc-pad').nth(note).dispatchEvent('pointerdown');
        if(await audio.evaluate(l=>l.starts)<=before)throw Error(`Silent pad ${instrument}/${note}`);
      }
    }
    if(await audio.evaluate(l=>l.frequencies.some(f=>!Number.isFinite(f)||f<=0||f>20000)))throw Error('Invalid instrument frequency');
    await P.page.locator('.mc-tab').first().click();await P.page.locator('.mc-row button').nth(0).click();
    await P.page.locator('.mc-pad').nth(0).dispatchEvent('pointerdown');await P.page.waitForTimeout(800);
    await P.page.locator('.mc-pad').nth(3).dispatchEvent('pointerdown');await P.page.locator('.mc-row button').nth(0).click();
    const before=await audio.evaluate(l=>l.starts);
    await P.page.locator('.mc-row button').nth(1).evaluate(b=>{if(!(b instanceof HTMLButtonElement))throw Error('Missing tune replay');for(let i=0;i<6;i++)b.click();});
    // A recording keeps the delay before its first note; check the guard now and exact note count when playback finishes.
    if(!await P.page.locator('.mc-row button').nth(1).isDisabled())throw Error('Tune replay guard is not active');
    await P.page.locator('.mc-tab').nth(1).click();
    if(!await P.page.locator('.mc-row button').nth(1).isDisabled())throw Error('Changing instrument bypasses replay guard');
    await P.page.waitForFunction(()=>{const b=document.querySelector('.mc-row button:nth-child(2)');return b instanceof HTMLButtonElement&&!b.disabled;});
    if(await audio.evaluate(l=>l.starts)!==before+4)throw Error('Recorded notes were skipped or duplicated: '+JSON.stringify({before,after:await audio.evaluate(l=>l.starts)}));
    await P.page.locator('.mc-row button').nth(1).click();
    await P.page.locator('.gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});
    const closing=await audio.evaluate(l=>l.starts);await P.page.waitForTimeout(1000);
    if(await audio.evaluate(l=>l.starts)!==closing)throw Error('Tune schedules notes after game closes');
    await audio.dispose();if(P.errors.length)throw Error(P.errors.join(' | '));
    return '4 instruments × 8 pads have 64 px targets and produce valid frequencies; recorded notes replay once, repeated taps/tab changes cannot overlap tunes, close cancels future notes';
  } finally {await P.ctx.close();}
}
