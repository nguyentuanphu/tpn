// (v1.08b games, owner's plan 3 Nov 2026 AEDT, docs/plans/links-rollout-install.md part 1; owner 5 Nov 2026 AEDT: "9 bước
// và một huy hiệu") learning quests: each subject of Học vui has a journey of 9 steps ("Hành trình Toán"), each step a
// game of that subject from the easiest up; a step won gives its sticker (one page of 9 in the sticker book per subject,
// js/content/stickers.ts) and the 9th gives the subject's badge. The steps are worked out from the games each child can
// play (js/learnquest.ts), so a game held back or switched off in Studio is never a step. No imports, so the voice tool
// and the sticker list can read it.

export type LearnPath = { key: string; areas: string[]; color: string; name: [string, string]; badge: [string, string]; done: [string, string] };
export const STEPS = 9;
export const LEARN_PATHS: LearnPath[] = [
  { key: 'vi', areas: ['hv_vi'], color: '#e8433a', name: ['Vietnamese journey', 'Hành trình Tiếng Việt'], badge: ['Vietnamese star', 'Ngôi sao Tiếng Việt'], done: ['You finished the Vietnamese journey!', 'Con đi hết Hành trình Tiếng Việt rồi!'] },
  { key: 'en', areas: ['hv_en'], color: '#3b6fe0', name: ['English journey', 'Hành trình Tiếng Anh'], badge: ['English star', 'Ngôi sao Tiếng Anh'], done: ['You finished the English journey!', 'Con đi hết Hành trình Tiếng Anh rồi!'] },
  { key: 'math', areas: ['numbers'], color: '#ff9f43', name: ['Maths journey', 'Hành trình Toán'], badge: ['Maths star', 'Ngôi sao Toán'], done: ['You finished the Maths journey!', 'Con đi hết Hành trình Toán rồi!'] },
  { key: 'shape', areas: ['shapes'], color: '#9a6bff', name: ['Shapes journey', 'Hành trình Hình khối'], badge: ['Shapes star', 'Ngôi sao Hình khối'], done: ['You finished the Shapes journey!', 'Con đi hết Hành trình Hình khối rồi!'] },
  { key: 'money', areas: ['money'], color: '#43c463', name: ['Money journey', 'Hành trình Tiền'], badge: ['Money star', 'Ngôi sao Tiền'], done: ['You finished the Money journey!', 'Con đi hết Hành trình Tiền rồi!'] },
  { key: 'sci', areas: ['hv_sci'], color: '#3cc7e8', name: ['Science journey', 'Hành trình Khoa học'], badge: ['Science star', 'Ngôi sao Khoa học'], done: ['You finished the Science journey!', 'Con đi hết Hành trình Khoa học rồi!'] },
  { key: 'read', areas: ['words', 'reading'], color: '#ff7eb8', name: ['Reading journey', 'Hành trình Chữ và đọc'], badge: ['Reading star', 'Ngôi sao Chữ và đọc'], done: ['You finished the Reading journey!', 'Con đi hết Hành trình Chữ và đọc rồi!'] },
  { key: 'me', areas: ['me'], color: '#ffd23f', name: ['Me and my family journey', 'Hành trình Em và gia đình'], badge: ['Family star', 'Ngôi sao Gia đình'], done: ['You finished the family journey!', 'Con đi hết Hành trình Em và gia đình rồi!'] }
];
/** the spoken lines of the journeys (each in both languages, no child's name) */
export const LEARN_LINES = {
  step: ['A journey step done! Here is a sticker.', 'Xong một bước hành trình! Tặng con một hình dán.'] as [string, string],
  today: ['Today’s learning step: play this game!', 'Bước học hôm nay: chơi trò này nhé!'] as [string, string],
  title: ['Learning journeys', 'Hành trình học'] as [string, string]
};
/** the sticker of a step (n from 1 to 9) and the badge of a journey */
export const stepSticker = (key: string, n: number) => `lp_${key}_${n}`;
export const badgeIcon = (key: string) => `lp:badge:${key}`;
