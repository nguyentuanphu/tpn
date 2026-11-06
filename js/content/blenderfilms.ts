// The Blender films' pages (made by tools/blender/make-film.mts; round v1.08c): for each film its version and, per page of
// the story, where the page starts and ends in the video (seconds) and the child's help moment (when the video stops, where
// the tap ring goes, in % of the picture, and what is asked). A film is listed here only once its video is in videos/films/ (copied to Netlify with videos/).
// (v1.08f films) optional: bytes, the video's size (for the "Download all films" card's total; about 3 MB is assumed
// without it), and en / vi, the story's title for its Studio switch (the id is shown without it).
export type BlenderFilm = { v: string, bytes?: number, en?: string, vi?: string, pages: { s: number, e: number, help?: { t: number, x: number, y: number, en: string, vi: string } }[] };
// (v1.08f films) the five for everyone and each film's Studio switch: js/content/films-for-all.ts. Every other listed film
// plays only on a tester device while Studio's "Blender films for testers" is on (js/blenderfilm.ts filmOpen), until the
// owner turns its own "Blender film for everyone" switch on.
export { BLENDER_FOR_ALL, BLENDER_TITLES } from './films-for-all.js';
// the size assumed for a film whose size is not listed (720p, about a minute)
export const FILM_BYTES_GUESS = 3 * 1048576;
export const filmBytes = (id: string) => { const f = BLENDER_FILMS[id]; return f && f.bytes > 0 ? f.bytes : FILM_BYTES_GUESS; };
// (6 Nov 2026 AEDT) rendered with Eevee on an RTX 3060 Ti, 1280x720, 12 frames a second made smooth at 24 (docs/cores/tasks/v108c/blender-films-gpu.md)
export const BLENDER_FILMS: Record<string, BlenderFilm> = {
banhchung: { v: 'v1', bytes: 4304086, pages: [
    { s: 0, e: 21.13 },
    { s: 21.13, e: 35.25 },
    { s: 35.25, e: 47.88, help: { t: 44.9, x: 57, y: 38, en: 'Tap to pick the big green leaves!', vi: 'Chạm để hái những chiếc lá dong to nhé!' } },
    { s: 47.88, e: 56.33, help: { t: 49.91, x: 50, y: 45, en: 'Tap to wrap the square cake!', vi: 'Chạm để gói bánh chưng vuông nào!' } },
    { s: 56.33, e: 79.88 }] },
chucuoi: { v: 'v1', bytes: 2168875, pages: [
    { s: 0, e: 13.88 },
    { s: 13.88, e: 19.67, help: { t: 17.84, x: 45, y: 48, en: 'Tap to give the leaf to the sick man!', vi: 'Chạm để đưa lá cho người ốm nào!' } },
    { s: 19.67, e: 30.88 },
    { s: 30.88, e: 37.92, help: { t: 36, x: 52, y: 53, en: 'Tap to help Cuội hold on!', vi: 'Chạm để giúp chú Cuội níu lấy rễ cây!' } },
    { s: 37.92, e: 45.62 },
    { s: 45.62, e: 58.17 }] },
tamcam: { v: 'v1', bytes: 3755703, pages: [
    { s: 0, e: 13.88 },
    { s: 13.88, e: 21.5, help: { t: 19.55, x: 46, y: 59, en: 'Tap to call Bống the fish!', vi: 'Chạm để gọi cá Bống nào!' } },
    { s: 21.5, e: 32.21 },
    { s: 32.21, e: 43.92 },
    { s: 43.92, e: 51.62, help: { t: 49.6, x: 56, y: 60, en: 'Tap to try the slipper on Tấm!', vi: 'Chạm để Tấm thử hài nào!' } },
    { s: 51.62, e: 66.92 }] },
thanhgiong: { v: 'v1', bytes: 4943499, pages: [
    { s: 0, e: 17.04 },
    { s: 17.04, e: 31.17 },
    { s: 31.17, e: 37.88, help: { t: 34.24, x: 50, y: 46, en: 'Tap to give him more rice!', vi: 'Chạm để đưa thêm cơm cho cậu bé!' } },
    { s: 37.88, e: 54.42 },
    { s: 54.42, e: 59.38, help: { t: 55.4, x: 44, y: 55, en: 'Tap the bamboo to pull it up!', vi: 'Chạm vào bụi tre để nhổ lên nào!' } },
    { s: 59.38, e: 79.25 }] },
rainbowserpent: { v: 'v1', bytes: 1388894, pages: [
    { s: 0, e: 16.13 },
    { s: 16.13, e: 21.58, help: { t: 19.76, x: 41, y: 43, en: 'Tap to wake the Rainbow Serpent!', vi: 'Chạm để đánh thức Rắn Cầu Vồng nào!' } },
    { s: 21.58, e: 29.88 },
    { s: 29.88, e: 35.42, help: { t: 33.59, x: 33, y: 60, en: 'Tap to call the rain!', vi: 'Chạm để gọi mưa về nào!' } },
    { s: 35.42, e: 43.96 },
    { s: 43.96, e: 58.5 }] },
rongtien: { v: 'v1', bytes: 2892139, pages: [
    { s: 0, e: 14.13 },
    { s: 14.13, e: 23.33 },
    { s: 23.33, e: 31.04 },
    { s: 31.04, e: 36.33, help: { t: 34.54, x: 50, y: 56, en: 'Tap to hatch the eggs!', vi: 'Chạm để trứng nở nào!' } },
    { s: 36.33, e: 42.79, help: { t: 40.9, x: 50, y: 55, en: 'Tap to wave goodbye!', vi: 'Chạm để vẫy tay chào nhé!' } },
    { s: 42.79, e: 56.08 }] },
caytre: { v: 'v1', bytes: 3212586, pages: [
    { s: 0, e: 11.13 },
    { s: 11.13, e: 23.75 },
    { s: 23.75, e: 32.21 },
    { s: 32.21, e: 41.75, help: { t: 39.59, x: 46, y: 67, en: 'Tap and say: Khắc nhập!', vi: 'Chạm và đọc: Khắc nhập!' } },
    { s: 41.75, e: 49.54, help: { t: 47.59, x: 50, y: 55, en: 'Tap and say: Khắc xuất!', vi: 'Chạm và đọc: Khắc xuất!' } },
    { s: 49.54, e: 61.83 }] },
sodua: { v: 'v1', bytes: 2764155, pages: [
    { s: 0, e: 14.54 },
    { s: 14.54, e: 22.75, help: { t: 20.78, x: 58, y: 43, en: 'Tap to make the goats happy!', vi: 'Chạm để đàn dê vui nào!' } },
    { s: 22.75, e: 32.88 },
    { s: 32.88, e: 40.5, help: { t: 38.55, x: 65, y: 58, en: 'Tap to help him take off his coconut shell!', vi: 'Chạm để chàng bỏ lốt sọ dừa nào!' } },
    { s: 40.5, e: 49.04 },
    { s: 49.04, e: 60.58 }] },
thachsanh: { v: 'v1', bytes: 3620258, pages: [
    { s: 0, e: 13.13 },
    { s: 13.13, e: 19.25, help: { t: 17.39, x: 46, y: 54, en: 'Tap to help Thạch Sanh be brave!', vi: 'Chạm để Thạch Sanh thật dũng cảm nào!' } },
    { s: 19.25, e: 27.79 },
    { s: 27.79, e: 37.92 },
    { s: 37.92, e: 44.21, help: { t: 42.34, x: 50, y: 52, en: 'Tap to fill everyone\'s bowl!', vi: 'Chạm để xới cơm cho mọi người nào!' } },
    { s: 44.21, e: 58.33 }] },
cockien: { v: 'v1', bytes: 2581139, pages: [
    { s: 0, e: 13.13 },
    { s: 13.13, e: 18.58, help: { t: 16.76, x: 50, y: 90, en: 'Tap to help Toad hop!', vi: 'Chạm để Cóc nhảy nào!' } },
    { s: 18.58, e: 27.54 },
    { s: 27.54, e: 35.83, help: { t: 33.86, x: 56, y: 46, en: 'Tap to beat the drum!', vi: 'Chạm để đánh trống nào!' } },
    { s: 35.83, e: 46.96 },
    { s: 46.96, e: 60.25 }] },
vusua: { v: 'v1', bytes: 2832134, pages: [
    { s: 0, e: 12.38 },
    { s: 12.38, e: 20.33 },
    { s: 20.33, e: 26.29, help: { t: 24.43, x: 50, y: 55, en: 'Tap to help him run home!', vi: 'Chạm để cậu chạy về nhà nào!' } },
    { s: 26.29, e: 35.83 },
    { s: 35.83, e: 43.46, help: { t: 41.51, x: 64, y: 51, en: 'Tap to give the tree a big hug!', vi: 'Chạm để ôm cây thật chặt nào!' } },
    { s: 43.46, e: 57.58 }] },
baluoiriu: { v: 'v1', bytes: 2668289, pages: [
    { s: 0, e: 12.71 },
    { s: 12.71, e: 23.83 },
    { s: 23.83, e: 30.88, help: { t: 28.95, x: 65, y: 43, en: 'Tap to say: not mine!', vi: 'Chạm để nói: không phải của con!' } },
    { s: 30.88, e: 41.67 },
    { s: 41.67, e: 48.96, help: { t: 47.04, x: 56, y: 40, en: 'Tap to take the three axes!', vi: 'Chạm để nhận ba lưỡi rìu nào!' } },
    { s: 48.96, e: 59.67 }] },
quabau: { v: 'v1', bytes: 2903808, pages: [
    { s: 0, e: 16.29 },
    { s: 16.29, e: 26.83 },
    { s: 26.83, e: 32.88, help: { t: 31.02, x: 42, y: 69, en: 'Tap to plant the gourd seed!', vi: 'Chạm để gieo hạt bầu nào!' } },
    { s: 32.88, e: 42.75 },
    { s: 42.75, e: 50.71, help: { t: 48.74, x: 50, y: 53, en: 'Tap to open the gourd!', vi: 'Chạm để mở quả bầu nào!' } },
    { s: 50.71, e: 62 }] },
thayboi: { v: 'v1', bytes: 2994825, pages: [
    { s: 0, e: 14.38 },
    { s: 14.38, e: 19.5, help: { t: 17.72, x: 53, y: 42, en: 'Tap to wiggle the trunk!', vi: 'Chạm để vòi voi ngọ nguậy nào!' } },
    { s: 19.5, e: 24.63, help: { t: 22.84, x: 51, y: 47, en: 'Tap to flap the big ear!', vi: 'Chạm để tai voi phe phẩy nào!' } },
    { s: 24.63, e: 36.33 },
    { s: 36.33, e: 44.63 },
    { s: 44.63, e: 55.75 }] },
nhacmeo: { v: 'v1', bytes: 1985050, pages: [
    { s: 0, e: 10.71 },
    { s: 10.71, e: 21.58 },
    { s: 21.58, e: 26.88, help: { t: 25.09, x: 50, y: 47, en: 'Tap to clap with the mice!', vi: 'Chạm để vỗ tay cùng các chú chuột nào!' } },
    { s: 26.88, e: 36 },
    { s: 36, e: 40.71, help: { t: 38.97, x: 50, y: 47, en: 'Tap to see who is brave!', vi: 'Chạm xem ai dũng cảm nào!' } },
    { s: 40.71, e: 51.25 }] },
ongtao: { v: 'v1', bytes: 1989801, pages: [
    { s: 0, e: 12.13 },
    { s: 12.13, e: 20.67 },
    { s: 20.67, e: 27.71, help: { t: 25.79, x: 50, y: 44, en: 'Tap to let the carp swim free!', vi: 'Chạm để thả cá chép nào!' } },
    { s: 27.71, e: 33.67, help: { t: 31.81, x: 50, y: 58, en: 'Tap to help the carp leap!', vi: 'Chạm để cá chép vượt lên nào!' } },
    { s: 33.67, e: 43.38 },
    { s: 43.38, e: 54.08 }] },
cachep: { v: 'v1', bytes: 1891715, pages: [
    { s: 0, e: 10.96 },
    { s: 10.96, e: 21.25 },
    { s: 21.25, e: 32.13 },
    { s: 32.13, e: 37.33, help: { t: 35.55, x: 50, y: 78, en: 'Tap to help her practise!', vi: 'Chạm để giúp chú tập nhảy nào!' } },
    { s: 37.33, e: 43.29, help: { t: 41.43, x: 48, y: 69, en: 'Tap for the biggest leap!', vi: 'Chạm để nhảy thật cao nào!' } },
    { s: 43.29, e: 55.25 }] },
sontinh: { v: 'v1', bytes: 2207436, pages: [
    { s: 0, e: 13.54 },
    { s: 13.54, e: 21.33, help: { t: 19.39, x: 50, y: 50, en: 'Tap to bring the presents!', vi: 'Chạm để mang sính lễ đến nào!' } },
    { s: 21.33, e: 29.96, help: { t: 27.97, x: 52, y: 41, en: 'Tap to make the mountain grow!', vi: 'Chạm để núi cao thêm nào!' } },
    { s: 29.96, e: 43.08 }] },
emu: { v: 'v1', bytes: 1940457, pages: [
    { s: 0, e: 14.88 },
    { s: 14.88, e: 26 },
    { s: 26, e: 34.21, help: { t: 32.24, x: -2, y: 43, en: 'Tap to see what the turkey does!', vi: 'Chạm xem gà tây làm gì nào!' } },
    { s: 34.21, e: 43.5 },
    { s: 43.5, e: 49.46, help: { t: 47.6, x: 35, y: 41, en: 'Tap to make Dinewan run!', vi: 'Chạm để Dinewan chạy nào!' } },
    { s: 49.46, e: 60.58 }] },
dotkangaroo: { v: 'v1', bytes: 1987016, pages: [
    { s: 0, e: 13.13 },
    { s: 13.13, e: 23 },
    { s: 23, e: 30.29, help: { t: 28.37, x: 55, y: 46, en: 'Tap to give Dot the magic berries!', vi: 'Chạm để Dot ăn quả mọng thần nào!' } },
    { s: 30.29, e: 40.58 },
    { s: 40.58, e: 46.13, help: { t: 44.3, x: 41, y: 42, en: 'Tap to hop home!', vi: 'Chạm để nhảy về nhà nào!' } },
    { s: 46.13, e: 58.42 }] },
birdcolours: { v: 'v1', bytes: 2018824, pages: [
    { s: 0, e: 11.96 },
    { s: 11.96, e: 19.67 },
    { s: 19.67, e: 25.79, help: { t: 23.93, x: 45, y: 53, en: 'Tap to bring the little bird some berries!', vi: 'Chạm để mang quả mọng cho chim nhỏ nào!' } },
    { s: 25.79, e: 32.25, help: { t: 30.36, x: 50, y: 29, en: 'Tap to paint the birds!', vi: 'Chạm để tô màu cho các bạn chim nào!' } },
    { s: 32.25, e: 41.21 },
    { s: 41.21, e: 52.92 }] },
magicpudding: { v: 'v1', bytes: 2325272, pages: [
    { s: 0, e: 11.71 },
    { s: 11.71, e: 20.67 },
    { s: 20.67, e: 27.21, help: { t: 25.32, x: 50, y: 43, en: 'Tap to cut a slice of pudding!', vi: 'Chạm để cắt một miếng bánh nào!' } },
    { s: 27.21, e: 37.5 },
    { s: 37.5, e: 41.88, help: { t: 40.18, x: 6, y: 40, en: 'Tap to get Albert back!', vi: 'Chạm để giành lại Albert nào!' } },
    { s: 41.88, e: 54 }] },
tiddalik: { v: 'v1', bytes: 1973604, pages: [
    { s: 0, e: 15.71 },
    { s: 15.71, e: 26.83 },
    { s: 26.83, e: 35.88, help: { t: 33.87, x: 40, y: 62, en: 'Tap to make the animals dance!', vi: 'Chạm để các con vật nhảy múa nào!' } },
    { s: 35.88, e: 44.42, help: { t: 42.43, x: 56, y: 54, en: 'Tap to tie the eel in a silly knot!', vi: 'Chạm để lươn uốn thành nút buồn cười nào!' } },
    { s: 44.42, e: 58.54 }] },
greatrace: { v: 'v1', bytes: 3320848, pages: [
    { s: 0, e: 13.21 },
    { s: 13.21, e: 19.67, help: { t: 17.78, x: 50, y: 36, en: 'Tap to make Rat jump!', vi: 'Chạm để Chuột nhảy nào!' } },
    { s: 19.67, e: 29.96 },
    { s: 29.96, e: 40.08 },
    { s: 40.08, e: 46.29, help: { t: 44.43, x: 50, y: 46, en: 'Tap to wake up Cat!', vi: 'Chạm để đánh thức Mèo nào!' } },
    { s: 46.29, e: 60.17 }] },
maliang: { v: 'v1', bytes: 2471140, pages: [
    { s: 0, e: 13.29 },
    { s: 13.29, e: 21.25 },
    { s: 21.25, e: 28.79, help: { t: 26.85, x: 50, y: 41, en: 'Tap to bring the bird to life!', vi: 'Chạm để chú chim sống dậy nào!' } },
    { s: 28.79, e: 37.5 },
    { s: 37.5, e: 47.13, help: { t: 45.1, x: 35, y: 46, en: 'Tap to paint a big wind!', vi: 'Chạm để vẽ một cơn gió to nào!' } },
    { s: 47.13, e: 60 }] },
weaver: { v: 'v1', bytes: 1787448, pages: [
    { s: 0, e: 11.13 },
    { s: 11.13, e: 19.42 },
    { s: 19.42, e: 27.96 },
    { s: 27.96, e: 36.67 },
    { s: 36.67, e: 42.96, help: { t: 41.09, x: 50, y: 68, en: 'Tap to call the magpies!', vi: 'Chạm để gọi chim khách nào!' } },
    { s: 42.96, e: 51.75, help: { t: 46.92, x: 50, y: 50, en: 'Tap for the gentle Ngâu rain!', vi: 'Chạm để mưa ngâu rơi nào!' } }] },
nian: { v: 'v1', bytes: 1630205, pages: [
    { s: 0, e: 12.29 },
    { s: 12.29, e: 19.58 },
    { s: 19.58, e: 29.71 },
    { s: 29.71, e: 35.75, help: { t: 33.89, x: 50, y: 50, en: 'Tap to make it bright and loud!', vi: 'Chạm để thắp đèn và đốt pháo nào!' } },
    { s: 35.75, e: 43.04 },
    { s: 43.04, e: 52.25, help: { t: 47.39, x: 50, y: 50, en: 'Tap to start the dragon dance!', vi: 'Chạm để múa rồng nào!' } }] },
kongrong: { v: 'v1', bytes: 3151461, pages: [
    { s: 0, e: 11.96 },
    { s: 11.96, e: 20.67 },
    { s: 20.67, e: 27.71, help: { t: 25.79, x: 42, y: 43, en: 'Tap to help Kong Rong take the smallest pear!', vi: 'Chạm để Khổng Dung lấy quả lê nhỏ nhất nào!' } },
    { s: 27.71, e: 32.92, help: { t: 31.13, x: 50, y: 47, en: 'Tap to give the big pears to the brothers!', vi: 'Chạm để mời các anh quả lê to nào!' } },
    { s: 32.92, e: 40.46 },
    { s: 40.46, e: 52.17 }] },
change: { v: 'v1', bytes: 1049595, pages: [
    { s: 0, e: 13.54 },
    { s: 13.54, e: 22.25 },
    { s: 22.25, e: 29.29, help: { t: 27.37, x: 50, y: 82, en: 'Tap to light the lanterns!', vi: 'Chạm để thắp đèn lồng nào!' } },
    { s: 29.29, e: 42.17 }] },
crow: { v: 'v1', bytes: 1670555, pages: [
    { s: 0, e: 10.54 },
    { s: 10.54, e: 19.5 },
    { s: 19.5, e: 27.21 },
    { s: 27.21, e: 33.67, help: { t: 31.78, x: 65, y: 28, en: 'Tap to drop the pebbles in!', vi: 'Chạm để thả sỏi vào bình nào!' } },
    { s: 33.67, e: 38.79, help: { t: 37.01, x: 53, y: 46, en: 'Tap to help the crow drink!', vi: 'Chạm để quạ uống nước nào!' } },
    { s: 38.79, e: 49.92 }] },
lionrabbit: { v: 'v1', bytes: 2914868, pages: [
    { s: 0, e: 11.54 },
    { s: 11.54, e: 18.08, help: { t: 16.19, x: 50, y: 43, en: 'Tap to walk slowly, slowly!', vi: 'Chạm để đi thật chậm, thật chậm nào!' } },
    { s: 18.08, e: 28.96 },
    { s: 28.96, e: 37.67 },
    { s: 37.67, e: 46.79, help: { t: 44.78, x: 50, y: 40, en: 'Tap to look into the well!', vi: 'Chạm để nhìn xuống giếng nào!' } },
    { s: 46.79, e: 58.08 }] },
ganesha: { v: 'v1', bytes: 2445409, pages: [
    { s: 0, e: 15.13 },
    { s: 15.13, e: 24.25 },
    { s: 24.25, e: 31.96 },
    { s: 31.96, e: 38.42, help: { t: 36.53, x: 37, y: 65, en: 'Tap to walk around Mother and Father!', vi: 'Chạm để đi vòng quanh cha mẹ nào!' } },
    { s: 38.42, e: 46.71 },
    { s: 46.71, e: 56.17, help: { t: 51.28, x: 60, y: 48, en: 'Tap to give Ganesha the mango!', vi: 'Chạm để trao xoài cho Ganesha nào!' } }] },
bluejackal: { v: 'v1', bytes: 2144739, pages: [
    { s: 0, e: 11.29 },
    { s: 11.29, e: 19, help: { t: 17.05, x: 68, y: 38, en: 'Tap for the big splash!', vi: 'Chạm để nghe "tõm" nào!' } },
    { s: 19, e: 29.88 },
    { s: 29.88, e: 37.17, help: { t: 35.24, x: 50, y: 74, en: 'Tap: what does the blue jackal do?', vi: 'Chạm xem chó rừng xanh làm gì nào?' } },
    { s: 37.17, e: 44.46 },
    { s: 44.46, e: 54.58 }] },
elephantmice: { v: 'v1', bytes: 2555702, pages: [
    { s: 0, e: 10.71 },
    { s: 10.71, e: 19.83 },
    { s: 19.83, e: 30.13 },
    { s: 30.13, e: 35.42, help: { t: 33.53, x: 50, y: 58, en: 'Tap to show the elephants the other path!', vi: 'Chạm để chỉ đường khác cho đàn voi nào!' } },
    { s: 35.42, e: 44.71 },
    { s: 44.71, e: 55.92, help: { t: 50.95, x: 50, y: 41, en: 'Tap to help the mice chew the ropes!', vi: 'Chạm để giúp lũ chuột gặm dây nào!' } }] },
monkey: { v: 'v1', bytes: 1737787, pages: [
    { s: 0, e: 14.71 },
    { s: 14.71, e: 20.42, help: { t: 18.59, x: 47, y: 37, en: 'Tap to share the fruit!', vi: 'Chạm để chia quả cho bạn nào!' } },
    { s: 20.42, e: 31.29 },
    { s: 31.29, e: 41.17, help: { t: 39.14, x: 50, y: 44, en: 'Tap to help the monkey jump to the tree!', vi: 'Chạm để khỉ nhảy lên cây nào!' } },
    { s: 41.17, e: 53.12 }] },
};
