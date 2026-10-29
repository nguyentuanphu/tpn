// Retained source proposals, deliberately not registered or loaded: their promised mechanics are unfinished.
import { T } from '../i18n.js';
import { runArtPad, paintArt } from './art-pad.js';

export const PENDING_ART_DEFINITIONS = [
{
  id: 'spotdiff', icon: '🔍',
  name: () => T('Spot the Difference', 'Tìm Điểm Khác'),
  run(api) {
    return runArtPad(api, {
      id: 'spotdiff',
      sayText: ['Circle the differences between the twin pictures!', 'Khoanh tròn những điểm khác nhau giữa hai bức tranh nhé!'],
      winTitle: ['Differences Picture Saved!', 'Bức Tranh Tìm Điểm Khác Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#f8fafc';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.15)}px sans-serif`;
        await paintArt(g, '🍎', w * 0.15, h * 0.55, w * 0.22);
        await paintArt(g, '🍏', w * 0.6, h * 0.55, w * 0.22);
      }
    });
  }
},
{
  id: 'hiddenpic', icon: '🕵️',
  name: () => T('Hidden Pictures', 'Tìm Hình Ẩn'),
  run(api) {
    return runArtPad(api, {
      id: 'hiddenpic',
      sayText: ['Highlight the hidden treasures tucked behind leaves!', 'Tô nổi bật những vật ẩn giấu đằng sau vòm lá nhé!'],
      winTitle: ['Hidden Picture Keepsake Saved!', 'Bức Tranh Tìm Hình Ẩn Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#dcfce7';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.16)}px sans-serif`;
        await paintArt(g, '🌿', w * 0.2, h * 0.4, w * 0.22);
        await paintArt(g, '🔑', w * 0.45, h * 0.6, w * 0.22);
        await paintArt(g, '🍃', w * 0.7, h * 0.4, w * 0.22);
      }
    });
  }
},
{
  id: 'paperfold', icon: '📄',
  name: () => T('Paper Folding', 'Gấp Giấy'),
  run(api) {
    return runArtPad(api, {
      id: 'paperfold',
      sayText: ['Fold paper creases and color your origami boat!', 'Vẽ nếp gấp và tô màu chiếc thuyền giấy origami nhé!'],
      winTitle: ['Origami Folding Art Saved!', 'Tác Phẩm Gấp Giấy Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#fef2f2';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.22)}px sans-serif`;
        await paintArt(g, '⛵', w * 0.38, h * 0.62, w * 0.22);
      }
    });
  }
}
];
