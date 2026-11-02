// The mini-games, by id (architecture step 2): each game file registers itself here, and anyone who needs the list
// (the frame that plays them, the how-to films, the Pad's game list) reads it here. Moved out of frame.js so the
// how-to films (js/howto.js), which frame.js opens, no longer import frame.js back (an import circle).
export const GAMES = {};
export const register = def => { GAMES[def.id] = Object.assign(GAMES[def.id] || {}, def); };
// (r79 learning, owner 16 Oct AEDT, I4) a skill sticker for finishing Hard in each reasoning game, drawn in js/art.js
export const SKILLS = {
  rulefinder: { key: 'skill:rulefinder', en: 'Rule finder', vi: 'Tìm quy luật' },
  gardenorder: { key: 'skill:gardenorder', en: 'Story sorter', vi: 'Xếp câu chuyện' },
  steppingpath: { key: 'skill:steppingpath', en: 'Path planner', vi: 'Vẽ đường đi' },
  patternpicnic: { key: 'skill:patternpicnic', en: 'Pattern spotter', vi: 'Nhìn ra quy luật' },
  shapebuilders: { key: 'skill:shapebuilders', en: 'Shape builder', vi: 'Ghép hình giỏi' },
  remembergarden: { key: 'skill:remembergarden', en: 'Memory keeper', vi: 'Nhớ giỏi' }
};
import './hocvui-meta.js';
// (v1.08 money) How to play for the eleven new money games
import './money3-meta.js';
