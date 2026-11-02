// Screens and pop-ups: title, who's playing, grown-ups settings, photo editor, NPC dialogue,
// the Sparkle Pad (map, backpack, adventure log, album, camera), cooking, shop and online play.
// (v1.07 split-code, 2 Nov 2026 AEDT) each part now lives in js/ui/; this file passes their exports on unchanged,
// so every import of './ui.js' keeps working.
export { holdButton } from './popups.js'; // (round R privacy, 9 Oct) moved to popups.js so the real-place window can ask a grown-up too
export { familyTrialOn, PALS_NAME, STYLE_ICON, STYLE_NAME, applyComfort, hideCaption, toast, flagBtns, learnBtns, bindLearn, bindLang, foldHeadings, jumpNav, openSite } from './ui/common.js';
export { openGrownups, openRecorder } from './ui/grownups.js';
export { showTitle } from './ui/title.js';
export { twoViewNow, showWho, openEditor } from './ui/profile.js';
export { openQuick } from './ui/quick.js';
export { festCalendarHTML, openFestivals } from './ui/festivals-ui.js';
export { openPad } from './ui/pad.js';
export { openCooking, openShop, openWardrobe } from './ui/shops.js';
export { folkGames, HUB, nextGameAfter, openGamesHub } from './ui/hub.js';
// (windows, NPC dialogue, the reward pop-up and confetti live in js/popups.js since architecture step 2; passed on from here)
export { modal, dialog, dialogHooks, reward } from './popups.js';
