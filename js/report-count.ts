// The play report's counting (v1.08 startup, PERF-001: split from js/report.ts, which keeps the report window, its PDF
// and pictures and is loaded only when a grown-up opens it). Counting listens to the event bus (architecture step 1):
// ActivityCompleted / ActivityAbandoned add a game to the day; main.js adds a minute for every minute of real play.
//   profile.stats.days = { 'YYYY-MM-DD': { min, games } } (the last 30 days)   profile.stats.played = { gameId: times }
import { events } from './core/events.js';
import { parse } from './core/ids.js';
import { GAMES } from './games/registry.js';

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const days = p => { const s = p.stats = p.stats || {}; s.days = s.days && typeof s.days === 'object' ? s.days : {}; return s.days; };
const today = p => { const d = days(p), k = dayKey(); if (!d[k]) { d[k] = { min: 0, games: 0 }; const keys = Object.keys(d).sort(); while (keys.length > 30) delete d[keys.shift()]; } return d[k]; };
/** one more minute of play for this child */
export const addMinute = p => { today(p).min++; };

export function createReport(G, { save }) {
  const profileOf = playerId => { const n = (parse(playerId) || {}).name; return (G.heroes.find(h => h.profile.id === n) || {}).profile; };
  // (v1.08b quality) each day also keeps the games played and won that day, for the learning report by subject
  const played = (players, defId, won = false) => {
    // (v1.08c parents fix, kept at merge) an event id turns "vi_tones" into "vi-tones": find the game's own id again, so
    // games with "_" in their id (vi_, rd_, mx_, sci_) count in the report too
    const slugged = (parse(defId) || {}).name, game = slugged && !GAMES[slugged] && GAMES[slugged.replace(/-/g, '_')] ? slugged.replace(/-/g, '_') : slugged;
    for (const id of players || []) { const p = profileOf(id); if (!p) continue; const d = today(p); d.games++; const pl = p.stats.played = p.stats.played || {}; if (game) { pl[game] = (pl[game] || 0) + 1; d.by = d.by || {}; d.by[game] = (d.by[game] || 0) + 1; if (won) { d.won = d.won || {}; d.won[game] = (d.won[game] || 0) + 1; } } }
    save();
  };
  events.on('ActivityStarted', e => { G._actPlayers = G._actPlayers || {}; G._actPlayers[e.activityId] = e.players; });
  events.on('ActivityCompleted', e => played(e.players, e.defId, !!e.result?.won));
  events.on('ActivityAbandoned', e => { const pl = (G._actPlayers || {})[e.activityId]; if (pl) played(pl, e.activityId.replace(/^act:([^/]+)\/.*$/, 'game:$1')); });
}
