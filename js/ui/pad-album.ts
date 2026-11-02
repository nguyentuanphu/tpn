// The Sparkle Pad's Album tab (split from js/ui.ts, v1.07): the sticker book and the album's other parts.
// The three functions are as they were inside openPad; albumTab hands them the same names they used there.
import { T } from '../i18n.js';
import { say, spoken } from '../voice.js';
import { SFX, Music } from '../audio.js';
import { esc, $ } from '../util.js';
import { confetti } from '../popups.js';
import { sync as sbSync, has as sbHas, freshIds as sbFresh, seen as sbSeen, isShiny as sbIsShiny, pageCount as sbPageCount, pageFull as sbPageFull, welcome as sbWelcome, claimPrize as sbClaimPrize, prizeWon as sbPrizeWon } from '../stickers.js';
import { THEMES as SB_THEMES, PAGES as SB_PAGES, BY_ID as SB_BY_ID, BOOK_LINES as SB_LINES } from '../content/stickers.js';
import { playSound as stickerSound, sayName as stickerName } from '../stickerfx.js';
import { familyCardsHTML, bindFamilyCards } from '../familycards.js';
import { showStory, storyList } from '../story.js';
import { LANDMARKS, VENDORS } from '../regions.js';
import { AUSSIE_SLANG, VN_WORDS, VN_SLANG } from '../words.js';
import { pic } from '../art.js';
import { toast, foldHeadings } from './common.js';
// (sticker book, chat B 16 Oct) the Album tab is the sticker book (js/stickers.js, js/content/stickers.js)
// the page each child had open (UX-004: the book opens where it was left)
const sbAt = { theme: 'farm', page: {} };
export function albumTab(game, i, hero, p, m, close, savePhoto) {
  // (sticker book, owner plan 16 Oct AEDT, chat B) the Album tab is the sticker book: tabs by theme, pages of 3 x 3, a
  // count and a progress bar, missing stickers as a grey shape with "?" and a hint (spoken on tap), the prize at the
  // bottom (STK-1 to STK-6). The scrapbook, family postcards, photos, words, storybook and food passport stay below it.
  function drawAlbum(body) {
    sbSync(p);
    const little = p.age !== 'big', all = SB_PAGES.filter(x => x.theme === sbAt.theme);
    if (!all.length) sbAt.theme = SB_THEMES[0].id;
    const pages = SB_PAGES.filter(x => x.theme === sbAt.theme), page = pages[Math.min(sbAt.page[sbAt.theme] || 0, pages.length - 1)], th = SB_THEMES.find(t => t.id === page.theme);
    // STK-3: a page is never empty: its welcome sticker comes as a present the first time it is opened
    const gift = sbWelcome(page, p);
    const fresh = new Set(sbFresh(p)), got = sbPageCount(page, p), full = got === page.stickers.length;
    const prize = full && !sbPrizeWon(page, p) ? sbClaimPrize(page, p) : null, won = sbPrizeWon(page, p);
    const tile = st => { const have = sbHas(st.id, p), isNew = have && fresh.has(st.id), shiny = have && sbIsShiny(st.id, p);
      return have
        ? `<button class="stk-tile have${isNew ? ' new' : ''}${shiny ? ' shiny' : ''}" data-sid="${st.id}" aria-label="${esc(T(st.en, st.vi))}"><span class="stk-pic">${pic(st.icon)}</span><b class="stk-name">${esc(T(st.en, st.vi))}</b>${isNew ? `<span class="stk-new">${T('New!', 'Mới!')}</span>` : ''}</button>`
        : `<button class="stk-tile miss" data-miss="${st.id}" aria-label="${esc(T(st.hint[0], st.hint[1]))}"><span class="stk-pic stk-ghost">${pic(st.icon)}<b class="stk-q">?</b></span><small class="stk-hint">${esc(T(st.hint[0], st.hint[1]))}</small></button>`; };
    const newIn = t => sbFresh(p).filter(id => SB_BY_ID[id] && SB_BY_ID[id].theme === t).length;
    body.innerHTML = `<div class="stkbook${little ? ' little' : ''}" style="--c:${th.color}">
      <div class="stk-tabs" role="tablist" aria-label="${T('Sticker pages', 'Các trang hình dán')}">${SB_THEMES.map(t => `<button role="tab" data-th="${t.id}" aria-selected="${t.id === th.id}" class="${t.id === th.id ? 'on' : ''}" style="--c:${t.color}"><span>${pic(t.icon)}</span><small>${esc(T(t.tab[0], t.tab[1]))}</small>${newIn(t.id) ? `<i class="stk-dot">${newIn(t.id)}</i>` : ''}</button>`).join('')}</div>
      <section class="stk-page${won ? ' won' : ''}" data-page="${page.key}">
        <div class="stk-head"><b class="stk-title">${esc(T(th.en, th.vi))}${page.of > 1 ? ` <small>${page.n + 1}/${page.of}</small>` : ''}</b><span class="stk-got">${got} / ${page.stickers.length}</span></div>
        <div class="stk-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${page.stickers.length}" aria-valuenow="${got}"><i style="width:${Math.round(got / page.stickers.length * 100)}%"></i></div>
        <div class="stk-grid">${page.stickers.map(tile).join('')}</div>
        ${page.of > 1 ? `<div class="stk-nav"><button class="stk-prev" ${page.n ? '' : 'disabled'} aria-label="${T('Page before', 'Trang trước')}">${pic('⬅️')}</button><span class="stk-dots">${pages.map((x, k) => `<i class="${k === page.n ? 'on' : ''}${sbPageFull(x, p) ? ' full' : ''}"></i>`).join('')}</span><button class="stk-next" ${page.n < page.of - 1 ? '' : 'disabled'} aria-label="${T('Next page', 'Trang sau')}">${pic('➡️')}</button></div>` : ''}
        <div class="stk-fly" hidden></div>
        <div class="stk-prize${won ? ' won' : ''}"><span class="stk-frame" aria-hidden="true"></span>${won
          ? `<span>${T('Golden frame won! A present is in your house.', 'Con được khung vàng! Có quà trong nhà con.')}</span><button class="btn stk-song">${pic('🎵')} ${T('My song', 'Bài hát của con')}</button>`
          : `<span>${T(SB_LINES.prize[0], SB_LINES.prize[1])}</span>`}</div>
      </section></div>
      <div class="stk-more">
        <button class="btn wide big" id="scrapBtn">📒 ${T('My scrapbook: decorate with stickers and photos', 'Sổ dán hình: trang trí bằng hình dán và ảnh')}</button>
        ${th.id === 'friends' ? familyCardsHTML(p) : ''}
        ${albumMoreHTML()}
      </div>`;
    const sb = body.querySelector('.stkbook');
    sb.querySelectorAll('[data-th]').forEach(b => b.onclick = () => { SFX.tap(); sbAt.theme = b.dataset.th; const t = SB_THEMES.find(x => x.id === b.dataset.th); say(t.en, t.vi); drawAlbum(body); foldHeadings(body, 'album'); });
    const go = d => { SFX.tap(); sbAt.page[th.id] = Math.max(0, Math.min(page.of - 1, page.n + d)); drawAlbum(body); foldHeadings(body, 'album'); };
    const pv = sb.querySelector('.stk-prev'), nx = sb.querySelector('.stk-next'); if (pv) pv.onclick = () => go(-1); if (nx) nx.onclick = () => go(1);
    // STK-6: a sticker they have says its name in both languages and plays its sound; the "New!" badge goes (STK-5)
    sb.querySelectorAll('[data-sid]').forEach(b => b.onclick = () => { const st = SB_BY_ID[b.dataset.sid]; sbSeen(st.id, p); b.classList.remove('new'); const n = b.querySelector('.stk-new'); if (n) n.remove(); stickerSound(st); stickerName(st); game.stickerBadges && game.stickerBadges(); });
    // STK-2: a missing one says where to find it; a postcard or a place can be flown to, as before
    sb.querySelectorAll('[data-miss]').forEach(b => b.onclick = () => { SFX.tap(); const st = SB_BY_ID[b.dataset.miss]; say(st.hint[0], st.hint[1]); toast(T(st.hint[0], st.hint[1]));
      const fly = sb.querySelector('.stk-fly'), w = st.earn.find(x => x.postcard), l = w && LANDMARKS.find(x => x.id === w.postcard);
      fly.hidden = !l; if (l) { fly.innerHTML = `<button class="btn primary big" data-fly="${l.id}">${pic('✈️')} ${T('Fly there', 'Bay đến đó')}: ${esc(l.name())}</button>`;
        fly.querySelector('[data-fly]').onclick = () => { close(); game.travel(hero, l.x, l.z + (l.id === 'uluru' ? -4 : 3)); }; } });
    const song = sb.querySelector('.stk-song'); if (song) song.onclick = () => { SFX.tap(); if (Music.key === th.song) Music.stop(); else Music.play(th.song, true); };
    if (gift) { toast(`${T(SB_LINES.gift[0], SB_LINES.gift[1])} ${T(gift.en, gift.vi)}`); say(SB_LINES.gift[0], SB_LINES.gift[1]); }
    if (prize) { confetti(); SFX.fanfare(); say(SB_LINES.full[0], SB_LINES.full[1]); try { Music.play(th.song, true); } catch (e) { } }
    bindFamilyCards(body, toast);
    body.querySelector('#scrapBtn').onclick = () => { m.close(); game.closePad(i); setTimeout(() => game.openScrapbook(hero), 220); };
    bindAlbumMore(body);
    game.stickerBadges && game.stickerBadges();
  }
  // the album's other parts, kept as they were (each folds open and shut): food passport, words, storybook, photos
  function albumMoreHTML() {
    const tasted = p.tasted || {}, words = Object.keys(p.words || {});
    return `<h3>🍜 ${T('Food passport', 'Hộ chiếu ẩm thực')} ${Object.keys(tasted).length}/${VENDORS.length}</h3><div class="secrets">${VENDORS.map(v => `<div class="sec ${tasted[v.id] ? 'on' : ''}"><span>${tasted[v.id] ? v.food[0] : '❔'}</span><small>${tasted[v.id] ? esc(T(v.food[1], v.food[2])) : esc(v.name)}</small></div>`).join('')}</div>
      <h3>🗣️ ${T('Words I learned', 'Từ con đã học')} ${words.length}</h3><div class="wordlist">${words.map(k => { const [kind, w] = [k.slice(0, 2), k.slice(3)];
        // (r79 A3, owner 16 Oct: pictures fell below and across the rows, empty circles on the left) one row each: the
        // word's picture, its words, and a button to hear it again, all inside the row and lined up; (owner, 17 Oct
        // AEDT: the round speaker was not understood) the button is a big coloured "Listen / Nghe" pill
        const row = (icon, flag, words, say) => `<div class="wl-row"><span class="wl-pic">${icon}</span><span class="wl-txt"><i class="wl-flag">${flag}</i> ${words}</span><button class="wl-say" data-wsay="${esc(JSON.stringify(say))}" aria-label="${T('Hear it', 'Nghe lại')}"><span class="wl-ico">🔊</span><b>${T('Listen', 'Nghe')}</b></button></div>`;
        if (kind === 'au') { const s = AUSSIE_SLANG.find(x => x[0] === w); return s ? row(s[3], '🇦🇺', `<b>${esc(s[0])}</b> = ${esc(T(s[1], s[2]))}`, [`${s[0]} means ${s[1]}`, `${s[0]} nghĩa là ${s[2]}`]) : ''; }
        if (kind === 'vs') { const s = VN_SLANG.find(x => x[0] === w); return s ? row(s[3], '🇻🇳', `<b>${esc(s[0])}</b> = ${esc(T(s[1], s[2]))}`, [`${s[0]} means ${s[1]}`, `${s[0]}: ${s[2]}`]) : ''; }
        const v = VN_WORDS.find(x => x[1] === w); return v ? row(v[0], '🇻🇳', `Bắc <b>${esc(v[2])}</b> · Trung <b>${esc(v[3])}</b> · Nam <b>${esc(v[4])}</b>`, [`${v[1]}: in the north ${v[2]}, in the middle ${v[3]}, in the south ${v[4]}`, `Miền Bắc nói ${v[2]}, miền Trung nói ${v[3]}, miền Nam nói ${v[4]}`]) : ''; }).join('') || `<p class="note">${T('Ask the market sellers and the Aussie shopkeepers to teach you a word!', 'Hỏi các cô chú bán hàng ở chợ và ở Góc Nước Úc để học từ mới nhé!')}</p>`}</div>
      <h3>📖 ${T('Storybook', 'Sách truyện')}</h3><div class="stories">${storyList(p).map((st, k) => `<button class="qbtn" data-st="${k}"><span>📖</span><small>${esc(st.title())}</small></button>`).join('')}</div>
      <h3>${T('Photos', 'Ảnh chụp')}</h3><div class="photos">${p.album.map((src, k) => `<figure><img src="${src}" alt=""><button class="btn" data-dl="${k}">⬇</button></figure>`).join('') || `<p class="note">${T('Use the Camera tab to take pictures of your adventure!', 'Dùng thẻ Máy ảnh để chụp ảnh chuyến phiêu lưu!')}</p>`}</div>`;
  }
  function bindAlbumMore(body) {
    body.querySelectorAll('[data-st]').forEach(b => b.onclick = () => showStory(storyList(p)[+b.dataset.st], p.name));
    body.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => savePhoto(p.album[+b.dataset.dl]));
    body.querySelectorAll('[data-wsay]').forEach(b => b.onclick = () => { SFX.tap(); const [en, vi] = JSON.parse(b.dataset.wsay); say(en, vi); });   // (r79 A3) a learned word, heard again
  }
  return drawAlbum;
}
