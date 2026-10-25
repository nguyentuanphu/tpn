import { register, api } from './frame.js';
import { T } from '../i18n.js';
import { el, wait } from '../util.js';
import { pic } from '../art.js';
import { SymbolRegistry, DifficultyEngine, MissionEngine, ComboEngine, LightRunner, createParadeSession, processStop } from './parade-engine.js';

const SYMBOLS = {
  apple: { id: 'apple', emoji: '🍎', tier: 'common', weight: 35, effect: 'mission' },
  strawberry: { id: 'strawberry', emoji: '🍓', tier: 'common', weight: 30, effect: 'mission' },
  watermelon: { id: 'watermelon', emoji: '🍉', tier: 'common', weight: 25, effect: 'mission' },
  ladybug: { id: 'ladybug', emoji: '🐞', tier: 'special', weight: 15, effect: 'helper', comboCount: 3 },
  star: { id: 'star', emoji: '⭐', tier: 'special', weight: 10, effect: 'wildcard', comboCount: 3 },
  rainbow: { id: 'rainbow', emoji: '🌈', tier: 'special', weight: 8, effect: 'transform' },
  dragon: { id: 'dragon', emoji: '🐉', tier: 'rare', weight: 5, effect: 'challenge', comboCount: 3 },
  key: { id: 'key', emoji: '🗝️', tier: 'rare', weight: 3, effect: 'treasure', comboCount: 3 },
};

register({
  id: 'sparkleorchard',
  icon: '🌈',
  name: () => T('Sparkle Orchard Quest', 'Nhiệm vụ Vườn Quả Lấp Lánh'),
  online: true,
  async run(api) {
    api.show('Welcome to Sparkle Orchard Quest!', 'Chào mừng đến Nhiệm vụ Vườn Quả Lấp Lánh!');
    // Game loop using parade-engine
  }
});