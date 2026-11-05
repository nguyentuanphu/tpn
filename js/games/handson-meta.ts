// (v1.08d polish) How to play for the hands-on games (js/games/handson.ts), read aloud by the guide film behind the TV
// button. Loaded after the quiz guides (js/art/games108.ts), so the Tết game's guide is the hands-on one.
import { HOWTO } from '../howto-registry.js';
HOWTO.fg_tet = { steps: [
  { pic: '🍃', en: 'Tap each dong leaf to lay it in the square mould.', vi: 'Chạm vào từng lá dong để xếp vào khuôn vuông.' },
  { pic: '🌾 🫘 🥩', en: 'Fill it in order: sticky rice, mung beans, pork, mung beans, sticky rice.', vi: 'Cho nhân theo thứ tự: gạo nếp, đỗ xanh, thịt, đỗ xanh, gạo nếp.' },
  { pic: '🍃', en: 'Tap the leaves to fold them over the filling.', vi: 'Chạm vào lá để gấp phủ lên nhân bánh.' },
  { pic: '🎋', en: 'Tie the bamboo string across and down.', vi: 'Buộc lạt giang ngang rồi dọc.' }
] };
HOWTO.mazebuild = { steps: [
  { pic: 'ho:maze', en: 'Help the duckling get home to its mother.', vi: 'Giúp vịt con về với vịt mẹ.' },
  { pic: '🐥', en: 'Tap the grass next to the duckling to lay a stepping stone.', vi: 'Chạm vào bãi cỏ cạnh vịt con để đặt đá kê chân.' },
  { pic: '🪨', en: 'Go around the rocks. Each stone goes right beside the last one.', vi: 'Đi vòng qua tảng đá. Mỗi viên đá đặt ngay cạnh viên trước.' },
  { pic: '🦆', en: 'Reach the mother duck and the duckling walks home!', vi: 'Tới chỗ vịt mẹ là vịt con đi về nhà!' }
] };
