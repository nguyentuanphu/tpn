// Names, artwork, age and discovery come from the same immutable source as the rest of the website.
import {extractGameMetadata} from '../../tools/export-management-catalogue.mts';
const MODES={
 stamps:['Tap to stamp coloured circles.','Chạm để in các hình tròn màu.'],
 mosaic:['Paint individual tile cells.','Tô từng ô gạch.'],pixelpic:['Fill square cells to make a pixel picture.','Tô các ô vuông để tạo tranh pixel.'],
 scratch:['Reveal rainbow colours by brushing over the dark board.','Tô lên bảng tối để hiện màu cầu vồng.'],
 bubblepaint:['Tap to paint bubble rings.','Chạm để vẽ vòng bong bóng.'],scene:['Tap to place coloured triangle stickers in a scene.','Chạm để dán hình tam giác màu vào phong cảnh.'],
 fireworks:['Tap to draw bursts across the night sky.','Chạm để vẽ những chùm pháo hoa trên trời đêm.'],
 leafrub:['Brush over the paper to reveal the illustrated leaf.','Tô lên giấy để hiện hình chiếc lá.'],
 lacquer:['Paint gold strokes on the dark illustrated board.','Vẽ nét vàng lên bảng tranh tối màu.']
};
export function artSection({readGame,dual,icon,esc}){
 const parsed=extractGameMetadata(readGame('js/games/catalog.ts'),readGame('js/content/activities.ts'),readGame('js/games/learning-meta.ts'),readGame('js/games/readingmenu.ts'));
 const second=readGame('js/content/secondset.ts').match(/art:\s*\[([^\]]+)\]/)?.[1]||'';
 const ids=new Set([...second.matchAll(/['"]([^'"]+)['"]/g)].map(m=>m[1]));
 const games=parsed.games.filter(g=>ids.has(g.id));
 const catalogue=readGame('js/games/catalog.ts');
 const rows=games.map(g=>{
  const key=g.id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const symbol=new RegExp(`id: ['"]${key}['"], icon: ['"]([^'"]+)['"]`).exec(catalogue)?.[1];
  const art=symbol&&icon(symbol);if(!art)throw Error('Missing reviewed game artwork: '+g.id);
  const info=parsed.facts[g.id];if(!info)throw Error('Missing art metadata: '+g.id);
  const description=MODES[g.id]||['Paint your own picture on an illustrated canvas. Choose colours and draw freely.','Tự vẽ trên khung tranh minh họa. Chọn màu và tự do sáng tạo.'];
  return `<details class="parent-faq" id="art-${esc(g.id)}"><summary>${art}${dual('span','',[g.name.en,g.name.vi])}</summary>${dual('p','',description)}${dual('p','',[`Suggested age ${info[1]}+. Easy. Touch or mouse paints; arrow keys move the brush and Space paints. Make 12 marks, then choose Keep in Album.`,`Gợi ý từ ${info[1]} tuổi. Dễ. Chạm hoặc chuột để vẽ; phím mũi tên di chuyển cọ và phím cách tô. Tô 12 nét rồi chọn Lưu vào Album.`])}</details>`;
 }).join('');
 return `<section class="section" id="art-guide"><style>#art-guide details{scroll-margin-top:96px}#art-guide summary{display:flex;align-items:center;gap:16px;min-height:64px}#art-guide summary .art{width:48px;height:48px;flex:none}#art-guide p{line-height:1.65;margin:16px 0}#art-guide details p{padding:0 18px}</style>${dual('h2','',['More colours and pictures','Thêm màu sắc và tranh'])}${dual('p','',[`${games.length} second-set art activities. They appear only after New games is released and every original art game is finished three times. An individual activity can also be switched Off. On does not bypass release or progress requirements; Hide only removes a Simple-screen listing.`,`${games.length} hoạt động nghệ thuật đợt hai. Chỉ mở khi Trò chơi mới được phát hành và mỗi trò nghệ thuật gốc đã hoàn thành ba lần. Từng hoạt động còn có thể bị Tắt. Bật không bỏ qua điều kiện phát hành hoặc tiến độ; Ẩn chỉ bỏ mục khỏi màn hình Đơn giản.`])}${dual('p','',['These pages describe the shipped source, not live availability for your device. Item Off blocks new entries after a device fetches the setting; an active activity can finish. Offline devices keep their last fetched settings.','Các trang này mô tả mã nguồn đã phát hành, không xác nhận tình trạng mở trên thiết bị. Tắt từng mục chặn lần mở mới sau khi thiết bị tải cài đặt; hoạt động đang chơi vẫn có thể hoàn thành. Thiết bị ngoại tuyến giữ cài đặt tải lần cuối.'])}${dual('p','',['Pictures stay in each playing child’s album on this device; the newest 12 are kept. Saving finishes the activity with the shared star celebration. Coins and progress follow the game’s entry route; artwork is not a paid prize or an uploaded photo. Leaving before saving adds no picture.','Tranh nằm trong album của mỗi bé đang chơi trên thiết bị này; giữ 12 bức mới nhất. Lưu tranh hoàn thành hoạt động với màn chúc mừng sao chung. Xu và tiến độ theo lối vào trò chơi; tranh không phải quà trả phí hay ảnh tải lên. Thoát trước khi lưu không thêm tranh.'])}<div class="faq-list">${rows}</div>${dual('p','',['Spot the Difference, Hidden Pictures and Paper Folding are not available to choose. These guides cover the listed art activities; check your game menu for current choices.','Tìm Điểm Khác, Tìm Hình Ẩn và Gấp Giấy chưa có để chọn. Hướng dẫn này giới thiệu các hoạt động nghệ thuật trong danh sách; xem menu trò chơi để biết lựa chọn hiện tại.'])}</section>`;
}
