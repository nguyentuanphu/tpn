import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { Browser, Page } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';

// Complete the real game through its legal, visible answer buttons. Never call api.win.
async function solve(page: Page) {
  return page.evaluate(async () => {
    const url = '/js/games/frame.js', frame: typeof import('../js/games/frame.js') = await import(url);
    let taps = 0;
    const end = Date.now() + 45000;
    while (Date.now() < end && !document.querySelector('.gl-win')) {
      const ask = frame.playWatch.ask;
      const button = ask?.els.find(ask.check);
      if (button instanceof HTMLElement && button.isConnected && button.getBoundingClientRect().width) { button.click(); taps++; }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return { taps, won: !!document.querySelector('.gl-win'), choices: document.querySelectorAll('.gl-nx').length };
  });
}

async function finishWorldNotices(page: Page) {
  // Winning can unlock a story. Use its real Skip control before opening another activity.
  for (let n = 0; n < 20; n++) {
    const skip = page.locator('.storybook:not(.out) .sb-skip');
    if (await skip.isVisible()) { await skip.click(); await page.waitForTimeout(350); continue; }
    // Follow this reward, not a locator that can switch to the next earned reward.
    const reward = await page.$('.reward:not(.out)');
    if (reward) {
      try { await reward.evaluate(element => { if (element instanceof HTMLElement && element.isConnected) element.click(); }); }
      finally { await reward.dispose(); }
      await page.waitForTimeout(350); continue;
    }
    await page.waitForTimeout(500);
    if (!await page.locator('.storybook,.reward').count()) return;
  }
  throw Error('earned world notice did not finish');
}

async function gameFlowFailure(page: Page, phase: string, error: unknown): Promise<Error> {
  const state = await page.evaluate(() => ({
    games: [...document.querySelectorAll('.gl')].map(e => ({ id: e.getAttribute('data-game-id'), out: e.classList.contains('out'), win: !!e.querySelector('.gl-win'), choices: e.querySelectorAll('.gl-nx').length })),
    hubs: document.querySelectorAll('.modal.hub').length, notices: [...document.querySelectorAll('.storybook,.reward')].map(e => e.className),
    simple: document.querySelectorAll('.simple').length, paused: window.__sv.paused,
    errors: document.querySelector('.gl-error')?.textContent || ''
  })).catch(() => null);
  fs.writeFileSync('out/game-flow/failure.json', JSON.stringify({ phase, state, error: String(error) }, null, 2));
  await page.screenshot({ path: 'out/game-flow/failure.png', timeout: 5000 }).catch(() => {});
  return Error(`gameflow ${phase}: ${error instanceof Error ? error.message : String(error)}; state ${JSON.stringify(state)}`);
}

export async function gameFlowCheck(browser: Browser): Promise<string> {
  const dir = 'out/game-flow'; fs.mkdirSync(dir, { recursive: true });
  const results: object[] = [];
  const P = await open(browser, { w: 430, h: 517, touch: true, mode: 'split' });
  let phase = 'shrine launch';
  try {
    await clear(P.page); await noWelcome(P.page);
    const log = await P.page.evaluateHandle(async () => {
      const url = '/js/core/events.js', { events }: typeof import('../js/core/events.js') = await import(url);
      const log = { started: [] as { source: string; id: string }[], completed: [] as string[], abandoned: [] as string[] };
      events.on('ActivityStarted', event => { if (event.kind === 'game') log.started.push({ source: event.source, id: event.activityId }); });
      events.on('ActivityCompleted', event => log.completed.push(event.activityId));
      events.on('ActivityAbandoned', event => log.abandoned.push(event.activityId));
      return log;
    });
    const baseline = await P.page.evaluate(() => window.__sv.heroes.map(h => ({ wins: h.profile.wins.counting || 0, orbs: h.profile.orbs || 0, games: h.profile.stats.games || 0 })));
    // The real shrine interactable supplies the shrine ID and reward contract.
    await P.page.evaluate(() => {
      const G = window.__sv, shrine = G.interactables.find(it => it.id === 'sh_count');
      if (!shrine) throw Error('counting shrine missing'); void shrine.act(G.heroes[0], G);
    });
    await P.page.locator('.gl[data-game-id="counting"]').waitFor();
    phase = 'shrine difficulty restart';
    // Changing difficulty must keep the shrine origin and its once-only orb reward.
    await P.page.locator('.gl-lvl').click(); await P.page.locator('[data-l="medium"]').click();
    await P.page.waitForFunction(() => document.querySelectorAll('.gl:not(.out)').length === 1 && document.querySelector('.gl-lvl')?.textContent?.includes('Medium'), null, { timeout: 15000 });
    const shrine = await solve(P.page); assert.ok(shrine.won && shrine.taps >= 4); assert.equal(shrine.choices, 0);
    phase = 'shrine return';
    await P.page.screenshot({ path: dir + '/phone-return.png' });
    await P.page.locator('.gl').waitFor({ state: 'detached' });
    await P.page.waitForFunction(() => window.__sv.heroes.every(h => h.profile.shrines.sh_count), null, { timeout: 15000 });
    await P.page.locator('.reward').waitFor({ state: 'detached', timeout: 15000 });
    const after = await P.page.evaluate(() => window.__sv.heroes.map(h => ({ wins: h.profile.wins.counting, orbs: h.profile.orbs, games: h.profile.stats.games })));
    assert.deepEqual(after, baseline.map(p => ({ wins: p.wins + 1, orbs: p.orbs + 1, games: p.games + 1 })));
    assert.deepEqual(await log.evaluate(l => ({ started: l.started.map(e => e.source), completed: l.completed.length, abandoned: l.abandoned.length })), { started: ['shrine', 'shrine'], completed: 1, abandoned: 1 });
    results.push({ shrine, twoPlayerRewards: after });
    console.log('gameflow: shrine restart, return and both rewards verified');
    phase = 'shrine earned notices';
    await finishWorldNotices(P.page);

    await P.page.setViewportSize({ width: 820, height: 1180 });
    phase = 'folk launch';
    await P.page.evaluate(async () => { const url = '/js/state.js', state: typeof import('../js/state.js') = await import(url); state.settings.lang = 'vi'; void window.__sv.playGame(0, 'numbers', 'folk'); });
    await P.page.locator('.gl[data-game-id="numbers"]').waitFor();
    const folk = await solve(P.page); assert.ok(folk.won && folk.taps >= 4); assert.equal(folk.choices, 0);
    phase = 'folk return';
    await P.page.screenshot({ path: dir + '/tablet-return-vi.png' });
    await P.page.locator('.gl').waitFor({ state: 'detached' });
    await P.page.waitForFunction(() => window.__sv.heroes.every(h => h.profile.quests.played_numbers), null, { timeout: 15000 });
    await P.page.locator('.reward').waitFor({ state: 'detached', timeout: 15000 });
    results.push({ folk });
    console.log('gameflow: folk return and quest credit verified');
    phase = 'folk earned notices';
    await finishWorldNotices(P.page);

    await P.page.setViewportSize({ width: 1280, height: 800 });
    phase = 'Play menu open';
    await P.page.evaluate(() => { document.body.focus(); });
    await P.page.keyboard.press('g'); await P.page.locator('.modal.hub').waitFor();
    await P.page.locator('.modal.hub [data-play="numbers"]').click();
    phase = 'Play game launch';
    await P.page.locator('.gl[data-game-id="numbers"]').waitFor();
    const hub = await solve(P.page); assert.ok(hub.won && hub.choices === 2);
    phase = 'Play celebration';
    await P.page.locator('.gl-win.ask').waitFor();
    await P.page.screenshot({ path: dir + '/computer-choices-vi.png' });
    await P.page.locator('.gl-nx[data-n="again"]').click();
    phase = 'Play replay';
    await P.page.waitForFunction(() => document.querySelector('.gl:not(.out)')?.getAttribute('data-game-id') === 'numbers' && !document.querySelector('.gl:not(.out) .gl-win'), null, { timeout: 15000 });
    assert.equal(await log.evaluate(l => l.started.at(-1)?.source), 'hub');
    await P.page.locator('.gl:not(.out) .gl-x').click(); await P.page.locator('.gl').waitFor({ state: 'detached' });
    phase = 'Play hub restored';
    await P.page.locator('.modal.hub').waitFor();
    await P.page.locator('.modal.hub .x').click(); await P.page.locator('.modal.hub').waitFor({ state: 'detached' });
    assert.equal(await log.evaluate(l => l.completed.length), 3, 'replay/leave duplicated completion');
    results.push({ hub });
    console.log('gameflow: Play replay and hub return verified');
    assert.deepEqual(P.errors, []);
    await log.dispose();
  } catch (error) { throw await gameFlowFailure(P.page, phase, error); } finally { await P.ctx.close(); }

  const Q = await open(browser, { w: 430, h: 873, touch: true, screen: 'simple' });
  phase = 'Simple road launch';
  try {
    await noWelcome(Q.page);
    // Launch from the actual Simple road, preserving its existing category/scroll shell.
    const button = Q.page.locator('.sp-stop').filter({ hasText: 'Number Train' }).first();
    await button.click(); await Q.page.locator('.gl[data-game-id="numbers"]').waitFor();
    const simple = await solve(Q.page); assert.ok(simple.won && simple.choices === 2);
    phase = 'Simple celebration';
    await Q.page.locator('.gl-win.ask').waitFor(); await Q.page.screenshot({ path: dir + '/phone-simple-choices.png' });
    await Q.page.locator('.gl-nx[data-n="next"]').click();
    phase = 'Simple Next';
    await Q.page.waitForFunction(() => !!document.querySelector('.gl:not(.out)') && document.querySelector('.gl:not(.out)')?.getAttribute('data-game-id') !== 'numbers', null, { timeout: 15000 });
    const next = await Q.page.evaluate(async () => { const url = '/js/core/events.js', { events }: typeof import('../js/core/events.js') = await import(url); return events.recent().filter(e => e.name === 'ActivityStarted').at(-1)?.payload.source; });
    assert.equal(next, 'simple', 'Next lost the Simple origin');
    // Leaving the next game must not credit a second win.
    const id = await Q.page.locator('.gl:not(.out)').getAttribute('data-game-id');
    const wins = await Q.page.evaluate(id => window.__sv.heroes[0].profile.wins[id] || 0, id);
    await Q.page.locator('.gl:not(.out) .gl-x').click(); await Q.page.locator('.gl').waitFor({ state: 'detached' });
    phase = 'Simple cancellation return';
    assert.equal(await Q.page.evaluate(id => window.__sv.heroes[0].profile.wins[id] || 0, id), wins, 'leaving gameplay credited the win');
    await Q.page.waitForTimeout(700);
    assert.ok(await button.isVisible(), 'Simple road not restored');
    assert.deepEqual(Q.errors, []); results.push({ simple, next });
    console.log('gameflow: Simple Next origin and cancellation verified');
  } catch (error) { throw await gameFlowFailure(Q.page, phase, error); } finally { await Q.ctx.close(); }
  fs.writeFileSync(dir + '/results.json', JSON.stringify(results, null, 2));
  return 'real shrine and folk wins return without choices; difficulty restart retains shrine/orb, two-player rewards exactly once; Play replay returns to hub; Simple Next retains origin and cancellation preserves progress';
}
