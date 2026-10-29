import { register } from './frame.js';
import { T } from '../i18n.js';
import { runArtPad, paintArt } from './art-pad.js';

// 1. lacquer
register({
  id: 'lacquer', icon: '🖼️',
  name: () => T('Lacquer Painting', 'Tranh Sơn Mài'),
  run(api) {
    return runArtPad(api, {
      id: 'lacquer',
      sayText: ['Gently rub gold leaf onto the dark lacquer board!', 'Thoa dát vàng quỳ lấp lánh lên vóc gỗ sơn mài nhé!'],
      winTitle: ['Lacquer Painting Saved!', 'Tranh Sơn Mài Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#121212';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.18)}px sans-serif`;
        await paintArt(g, '🪷', w * 0.38, h * 0.6, w * 0.22);
      }
    });
  }
});

// 2. scratch
register({
  id: 'scratch', icon: '✨',
  name: () => T('Scratch Art', 'Tranh Cào'),
  run(api) {
    return runArtPad(api, {
      id: 'scratch',
      sayText: ['Scratch away the dark coat to reveal rainbow colors underneath!', 'Cào lớp phủ đen để lộ dải màu cầu vồng rực rỡ nhé!'],
      winTitle: ['Scratch Art Keepsake Saved!', 'Tranh Cào Cầu Vồng Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#212529';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#ffb703';
        g.lineWidth = 3;
        g.strokeRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84);
      }
    });
  }
});

// 3. bubblepaint
register({
  id: 'bubblepaint', icon: '🫧',
  name: () => T('Bubble Paint', 'Vẽ Bong Bóng'),
  run(api) {
    return runArtPad(api, {
      id: 'bubblepaint',
      sayText: ['Choose a colour and tap to paint bubble rings!', 'Chọn màu rồi chạm để vẽ vòng bong bóng nhé!'],
      winTitle: ['Bubble Print Artwork Saved!', 'Tranh Bong Bóng Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#f8f9fa';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.14)}px sans-serif`;
        await paintArt(g, '🫧', w * 0.15, h * 0.4, w * 0.22);
        await paintArt(g, '🫧', w * 0.55, h * 0.65, w * 0.22);
      }
    });
  }
});

// 4. fingerpaint
register({
  id: 'fingerpaint', icon: '🖐️',
  name: () => T('Finger Painting', 'Vẽ Bằng Ngón Tay'),
  run(api) {
    return runArtPad(api, {
      id: 'fingerpaint',
      sayText: ['Paint with your fingertips directly on the canvas!', 'Dùng ngón tay chấm tô màu trực tiếp lên tranh nhé!'],
      winTitle: ['Fingerprint Picture Saved!', 'Tranh Dấu Ngón Tay Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#fffdf6';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.15)}px sans-serif`;
        await paintArt(g, '🌺', w * 0.2, h * 0.5, w * 0.22);
        await paintArt(g, '🦋', w * 0.6, h * 0.5, w * 0.22);
      }
    });
  }
});

// 5. weatherpaint
register({
  id: 'weatherpaint', icon: '🌦️',
  name: () => T('Colour the Weather', 'Tô Màu Thời Tiết'),
  run(api) {
    return runArtPad(api, {
      id: 'weatherpaint',
      sayText: ['Paint gentle rain, sunbeams, and clouds in the sky!', 'Tô màu cho nắng ấm và hạt mưa dịu dàng nhé!'],
      winTitle: ['Weather Canvas Saved!', 'Tranh Thời Tiết Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#e0f2fe';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.16)}px sans-serif`;
        await paintArt(g, '☀️', w * 0.15, h * 0.4, w * 0.22);
        await paintArt(g, '🌧️', w * 0.55, h * 0.6, w * 0.22);
      }
    });
  }
});

// 6. thocam
register({
  id: 'thocam', icon: '🧶',
  name: () => T('Brocade Patterns', 'Hoa Văn Thổ Cẩm'),
  run(api) {
    return runArtPad(api, {
      id: 'thocam',
      sayText: ['Paint vibrant ethnic geometric patterns on woven cloth!', 'Tô màu dải thổ cẩm vùng cao rực rỡ nhé!'],
      winTitle: ['Brocade Tapestry Saved!', 'Thổ Cẩm Vùng Cao Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#2b2d42';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#d90429';
        g.lineWidth = 4;
        g.strokeRect(w * 0.05, h * 0.1, w * 0.9, h * 0.8);
      }
    });
  }
});

// 7. pixelpic
register({
  id: 'pixelpic', icon: '👾',
  name: () => T('Pixel Picture', 'Tranh Ô Vuông'),
  run(api) {
    return runArtPad(api, {
      id: 'pixelpic',
      sayText: ['Fill grid squares to paint a cute retro pixel character!', 'Tô màu ô vuông để tạo nhân vật pixel ngộ nghĩnh nhé!'],
      winTitle: ['Pixel Art Saved!', 'Tranh Pixel Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#f1f5f9';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#cbd5e1';
        g.lineWidth = 2;
        for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
        for (let y = 20; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      }
    });
  }
});

// 8. fireworks
register({
  id: 'fireworks', icon: '🎆',
  name: () => T('Fireworks Painter', 'Vẽ Pháo Hoa'),
  run(api) {
    return runArtPad(api, {
      id: 'fireworks',
      sayText: ['Draw glowing fireworks bursts across the midnight sky!', 'Vẽ những chùm pháo hoa lấp lánh đêm Giao Thừa nhé!'],
      winTitle: ['Fireworks Display Saved!', 'Bức Tranh Pháo Hoa Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#0b090a';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.16)}px sans-serif`;
        await paintArt(g, '🎆', w * 0.2, h * 0.45, w * 0.22);
        await paintArt(g, '✨', w * 0.6, h * 0.45, w * 0.22);
      }
    });
  }
});

// 9. masks
register({
  id: 'masks', icon: '🎭',
  name: () => T('Mid-Autumn Masks', 'Làm Mặt Nạ Trung Thu'),
  run(api) {
    return runArtPad(api, {
      id: 'masks',
      sayText: ['Decorate festival masks with bright paint!', 'Tô màu chiếc mặt nạ giấy bồi đón Rằm tháng Tám nhé!'],
      winTitle: ['Festival Mask Saved!', 'Mặt Nạ Trung Thu Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#fff7ed';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.2)}px sans-serif`;
        await paintArt(g, '🎭', w * 0.35, h * 0.62, w * 0.22);
      }
    });
  }
});

// 10. makeface
register({
  id: 'makeface', icon: '😀',
  name: () => T('Make a Face', 'Ghép Khuôn Mặt'),
  run(api) {
    return runArtPad(api, {
      id: 'makeface',
      sayText: ['Paint smiles, eyes, and expressions on a cheerful face!', 'Tô nụ cười và ánh mắt rạng rỡ lên khuôn mặt nhé!'],
      winTitle: ['Cheerful Face Saved!', 'Khuôn Mặt Vui Vẻ Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#fef3c7';
        g.fillRect(0, 0, w, h);
        g.beginPath();
        g.arc(w * 0.5, h * 0.5, w * 0.3, 0, Math.PI * 2);
        g.strokeStyle = '#f59e0b';
        g.lineWidth = 5;
        g.stroke();
      }
    });
  }
});

// 11. gallery
register({
  id: 'gallery', icon: '🖼️',
  name: () => T('My Little Gallery', 'Phòng Tranh Của Em'),
  run(api) {
    return runArtPad(api, {
      id: 'gallery',
      sayText: ['Paint and frame your picture for your home exhibition!', 'Vẽ và lồng khung cho bức tranh triển lãm nhé!'],
      winTitle: ['Gallery Frame Artwork Saved!', 'Bức Tranh Triển Lãm Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#f8fafc';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = '#78350f';
        g.lineWidth = 10;
        g.strokeRect(10, 10, w - 20, h - 20);
      }
    });
  }
});

// 12. leafrub
register({
  id: 'leafrub', icon: '🍃',
  name: () => T('Leaf Rubbings', 'In Lá'),
  run(api) {
    return runArtPad(api, {
      id: 'leafrub',
      sayText: ['Rub wax crayons across the leaf to reveal delicate veins!', 'Chà sáp màu lên lá để hiện đường gân lá kỳ diệu nhé!'],
      winTitle: ['Leaf Rubbing Keepsake Saved!', 'Tranh In Lá Tự Nhiên Đã Ở Trong Album!'],
      async drawGuide(g, w, h) {
        g.fillStyle = '#fefae0';
        g.fillRect(0, 0, w, h);
        g.font = `${Math.round(w * 0.2)}px sans-serif`;
        await paintArt(g, '🍁', w * 0.35, h * 0.62, w * 0.22);
      }
    });
  }
});
