import { register as registerGame } from './frame.js';
// These three sources are retained for review; their advertised puzzle/folding mechanics do not exist.
const register = def => { if (!['spotdiff', 'hiddenpic', 'paperfold'].includes(def.id)) registerGame(def); };
import { T } from '../i18n.js';
import { runArtPad, paintArt } from './art-pad.js';

// 1. stamps
register({
  id: 'stamps', icon: '🥔',
  name: () => T('Potato Stamps', 'In Hình'),
  run(api) {
    return runArtPad(api, {
      id: 'stamps',
      sayText: ['Choose a colour, then tap to stamp circles!', 'Chọn màu rồi chạm để in hình tròn nhé!'],
      winTitle: ['Potato Stamps Saved!', 'Tranh In Khoai Tây Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#f4ebd0';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.12)}px sans-serif`;
        await paintArt(g, '🌸', w * 0.1, h * 0.3, w * 0.22);
        await paintArt(g, '⭐', w * 0.7, h * 0.4, w * 0.22);
      }
    });
  }
});

// 2. weave
register({
  id: 'weave', icon: '🌾',
  name: () => T('Weave a Mat', 'Đan Chiếu'),
  run(api) {
    return runArtPad(api, {
      id: 'weave',
      sayText: ['Paint coloured strands across the woven reed mat!', 'Vẽ nếp cói màu sắc lên chiếc chiếu đan nhé!'],
      winTitle: ['Woven Mat Saved!', 'Chiếu Đan Thật Đẹp Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#f2e8cf';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#d4a373';
        g.lineWidth = 4;
        for (let x = 20; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
        for (let y = 20; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      }
    });
  }
});

// 3. mosaic
register({
  id: 'mosaic', icon: '🏺',
  name: () => T('Bát Tràng Tiles', 'Ghép Gốm Bát Tràng'),
  run(api) {
    return runArtPad(api, {
      id: 'mosaic',
      sayText: ['Paint ceramic glazes on your Bát Tràng tile artwork!', 'Tô màu men gốm rực rỡ lên bức tranh Bát Tràng nhé!'],
      winTitle: ['Glazed Ceramic Tile Saved!', 'Tranh Gốm Bát Tràng Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#e9ecef';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#adb5bd';
        g.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          g.strokeRect(w * 0.1 + i * w * 0.2, h * 0.2, w * 0.16, h * 0.5);
        }
      }
    });
  }
});

// 4. nonla
register({
  id: 'nonla', icon: '👒',
  name: () => T('Paint a Nón Lá', 'Vẽ Nón Lá'),
  run(api) {
    return runArtPad(api, {
      id: 'nonla',
      sayText: ['Paint bamboo and lotus onto your conical hat!', 'Vẽ cành tre và hoa sen lên chiếc nón lá xinh xắn nhé!'],
      winTitle: ['Painted Nón Lá Saved!', 'Chiếc Nón Lá Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#fefae0';
        g.fillRect(0, 0, w, h);
        g.beginPath();
        g.moveTo(w * 0.5, h * 0.1);
        g.lineTo(w * 0.1, h * 0.85);
        g.lineTo(w * 0.9, h * 0.85);
        g.closePath();
        g.strokeStyle = '#dda15e';
        g.lineWidth = 5;
        g.stroke();
      }
    });
  }
});

// 5. aodai
register({
  id: 'aodai', icon: '🥻',
  name: () => T('Áo Dài Designer', 'Thiết Kế Áo Dài'),
  run(api) {
    return runArtPad(api, {
      id: 'aodai',
      sayText: ['Design colorful silk patterns on the Áo Dài dress!', 'Tự tay tô vẽ tà áo dài lụa thướt tha nhé!'],
      winTitle: ['Áo Dài Silk Design Saved!', 'Mẫu Áo Dài Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#fff0f3';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.22)}px sans-serif`;
        await paintArt(g, '🥻', w * 0.38, h * 0.62, w * 0.22);
      }
    });
  }
});

// 6. kitepaint
register({
  id: 'kitepaint', icon: '🪁',
  name: () => T('Design a Kite', 'Trang Trí Diều'),
  run(api) {
    return runArtPad(api, {
      id: 'kitepaint',
      sayText: ['Paint bright wings on your flute kite!', 'Tô cánh diều sáo thật rực rỡ để bay cao nhé!'],
      winTitle: ['Flute Kite Saved!', 'Chiếc Diều Sáo Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#e0f2fe';
        g.fillRect(0, 0, w, h);
        g.beginPath();
        g.moveTo(w * 0.5, h * 0.15);
        g.lineTo(w * 0.85, h * 0.5);
        g.lineTo(w * 0.5, h * 0.85);
        g.lineTo(w * 0.15, h * 0.5);
        g.closePath();
        g.strokeStyle = '#0284c7';
        g.lineWidth = 4;
        g.stroke();
      }
    });
  }
});

// 7. shades
register({
  id: 'shades', icon: '🎨',
  name: () => T('Light and Dark Colours', 'Màu Đậm Màu Nhạt'),
  run(api) {
    return runArtPad(api, {
      id: 'shades',
      sayText: ['Blend pastel and deep shades together on the canvas!', 'Pha phối các dải màu đậm nhạt hòa quyện nhé!'],
      winTitle: ['Shades Artwork Saved!', 'Bức Tranh Dải Màu Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#bae6fd';
        g.fillRect(0, 0, w, h * 0.33);
        g.fillStyle = '#38bdf8';
        g.fillRect(0, h * 0.33, w, h * 0.33);
        g.fillStyle = '#0284c7';
        g.fillRect(0, h * 0.66, w, h * 0.34);
      }
    });
  }
});

// 8. shadowpic
register({
  id: 'shadowpic', icon: '👥',
  name: () => T('Light and Shadow', 'Bóng và Hình'),
  run(api) {
    return runArtPad(api, {
      id: 'shadowpic',
      sayText: ['Trace around shadows to capture secret animal shapes!', 'Vẽ nét quanh chiếc bóng để giữ lại hình các bạn thú nhé!'],
      winTitle: ['Shadow Art Saved!', 'Tranh Bóng Thú Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#334155';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.22)}px sans-serif`;
        await paintArt(g, '🐰', w * 0.35, h * 0.62, w * 0.22);
      }
    });
  }
});

// 9. spotdiff
register({
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
});

// 10. hiddenpic
register({
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
});

// 11. finishpic
register({
  id: 'finishpic', icon: '✏️',
  name: () => T('Finish the Picture', 'Vẽ Nốt Bức Tranh'),
  run(api) {
    return runArtPad(api, {
      id: 'finishpic',
      sayText: ['Draw the missing side to complete the happy picture!', 'Vẽ nốt nửa còn thiếu để hoàn thiện bức tranh vui nhé!'],
      winTitle: ['Completed Picture Saved!', 'Bức Tranh Hoàn Chỉnh Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#fef3c7';
        g.fillRect(0, 0, w, h);
        g.beginPath();
        g.arc(w * 0.5, h * 0.5, w * 0.25, -Math.PI / 2, Math.PI / 2);
        g.strokeStyle = '#d97706';
        g.lineWidth = 5;
        g.stroke();
      }
    });
  }
});

// 12. scene
register({
  id: 'scene', icon: '🏞️',
  name: () => T('Sticker Scene', 'Dán Tranh Cảnh'),
  run(api) {
    return runArtPad(api, {
      id: 'scene',
      sayText: ['Choose a colour and tap to add triangle stickers to your countryside!', 'Chọn màu rồi chạm để dán hình tam giác vào phong cảnh nhé!'],
      winTitle: ['Sticker Scene Saved!', 'Bức Tranh Phong Cảnh Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#e0e7ff';
        g.fillRect(0, 0, w, h * 0.55);
        g.fillStyle = '#bbf7d0';
        g.fillRect(0, h * 0.55, w, h * 0.45);
        g.font = `${Math.round(w * 0.15)}px sans-serif`;
        await paintArt(g, '🌳', w * 0.15, h * 0.65, w * 0.22);
        await paintArt(g, '🌈', w * 0.55, h * 0.35, w * 0.22);
      }
    });
  }
});

// 13. paperfold
register({
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
});
