// (v1.08b games, owner's plan 3 Nov 2026 AEDT, docs/plans/links-rollout-install.md part 4) a place and a host for every
// game. A game with no place of its own (js/main/talks.ts GAME_SPOT, the money, science and school tables, the city
// hosts) is found at its area's place: the school rooms for languages, maths, shapes and reading, Cô Mai's market for
// money, the village yard for folk games, the music corner, the art easel, the farm pen, home for "me and my family",
// Ông Cú for thinking, and the bus stop for going places. Each place has a villager host with one spoken line, said once
// as the child walks past when a game there has just opened. Only places that already stand in the valley are used.
// The `gameplace` check fails if a switched-on game has no place.

export type AreaPlace = { spot: string; host: [string, string]; line: [string, string] };
const SCHOOL: AreaPlace = { spot: 'school', host: ['Miss Tam', 'Cô Tam'], line: ['There is a new game at the school! Come and learn with me.', 'Có trò mới ở trường đó! Vào học vui với cô nhé.'] };
export const AREA_PLACE: Record<string, AreaPlace> = {
  hv_vi: SCHOOL, hv_en: SCHOOL, numbers: SCHOOL, shapes: SCHOOL, words: SCHOOL, reading: SCHOOL,
  hv_sci: { spot: 'school', host: ['Miss Tam', 'Cô Tam'], line: ['There is a new experiment to try! Come and find out with me.', 'Có thí nghiệm mới để thử đó! Cùng cô khám phá nhé.'] },
  money: { spot: 'npc_mai', host: ['Auntie Mai', 'Cô Mai'], line: ['There is a new game at the market! Come and shop with me.', 'Có trò mới ở chợ đó! Ra chợ chơi với cô nhé.'] },
  vietnam: { spot: 'npc_teo', host: ['Tèo', 'Tèo'], line: ['There is a new folk game in the village yard! Come and play.', 'Có trò dân gian mới ở sân đình đó! Ra chơi với tớ nhé.'] },
  play: { spot: 'npc_ti', host: ['Tí', 'Tí'], line: ['There is a new game to play outside! Come and run with me.', 'Có trò mới chơi ngoài trời đó! Ra chạy chơi với tớ nhé.'] },
  music: { spot: 'musiccorner', host: ['Music Corner', 'Góc Âm Nhạc'], line: ['There is a new game at the music corner! Come and make music.', 'Có trò mới ở góc âm nhạc đó! Vào chơi nhạc nhé.'] },
  art: { spot: 'easel', host: ['Art corner', 'Góc vẽ'], line: ['There is a new game at the art corner! Come and paint.', 'Có trò mới ở góc vẽ tranh đó! Vào vẽ nhé.'] },
  animals: { spot: 'pen', host: ['Uncle Ba', 'Bác Ba'], line: ['There is a new game with the farm animals! Come and see.', 'Có trò mới với các con vật ở trang trại đó! Ra xem nhé.'] },
  me: { spot: 'myhouse_door', host: ['Home', 'Nhà mình'], line: ['There is a new game at home! Come inside and play.', 'Có trò mới ở nhà mình đó! Vào nhà chơi nhé.'] },
  thinking: { spot: 'npc_owl', host: ['Grandpa Owl', 'Ông Cú'], line: ['Hoo hoo! There is a new puzzle for big thinkers.', 'Hú hú! Có câu đố mới cho bạn suy nghĩ giỏi đó.'] },
  festival: { spot: 'statue', host: ['Lotus Village', 'Làng Sen'], line: ['There is a festival game today! Come to the festival table.', 'Hôm nay có trò chơi lễ hội đó! Ra bàn lễ hội chơi nhé.'] },
  travel: { spot: 'busstop_1', host: ['Bus stop', 'Trạm xe buýt'], line: ['There is a new game on the road! Hop on and go.', 'Có trò mới trên đường đi đó! Lên xe đi nào.'] }
};
/** the place a game is found at when it has none of its own (its area's place) */
export const areaSpot = (area: string): string => (AREA_PLACE[area] || SCHOOL).spot;
/** the host of a place, by its spot id (an area place's host, or none) */
export const hostOfSpot = (spot: string): AreaPlace | null => Object.values(AREA_PLACE).find(a => a.spot === spot) || null;
/** every host line, for the voice pack (tools/make-voice-pack.mts) and the `voicecover` check; none has a name in it */
export function gamePlaceLines(): [string, string][] {
  const seen = new Set<string>(), out: [string, string][] = [];
  for (const a of Object.values(AREA_PLACE)) if (!seen.has(a.line[0])) { seen.add(a.line[0]); out.push(a.line); }
  return out;
}
