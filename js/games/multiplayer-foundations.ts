// Shared multiplayer foundations for Ô Ăn Quan, Rắn và Thang, Kéo Co, and Family Quiz.
// (Round G/V, multiplayer foundations) A common state-synchronization shim.

export const MULTIPLAYER_UPGRADES = {
  oanquan: { id: 'oanquan', max: 2, all: false, turnBased: true },
  snakes: { id: 'snakes', max: 4, all: false, turnBased: true },
  tug: { id: 'tug', max: 6, all: true, turnBased: false },
  familyquiz: { id: 'familyquiz', max: 6, all: true, turnBased: false }
};

export const createGameState = (type) => ({
  type,
  seed: Math.random().toString(36).slice(2, 10),
  turn: 0,
  players: [],
  score: {}
});

export const getNextTurn = (current, total) => (current + 1) % total;
