// Eleven more money games (v1.08, owner's plan 3 Nov 2026 AEDT, part D: "add more money games"). Each one asks a real
// money question with the real coins and notes of the child's home, Australian dollars or Vietnamese đồng (drawn by us,
// js/art/things-money.ts), for ages 4 to 9, with levels up to Talent: Shop and Pay, Give Change (counting up), Save for
// a Toy, Needs before Wants, Price Tag Line-up, Market Day, Coin Sort, Make the Amount, Budget a Picnic, Earn by Chores
// and Two Homes Money. The sums are in js/games/moneylogic3.ts. Game coins only, never real money.
import { register, untilRight, tapOne } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";
import { curCode, fmtMinor } from "../money.js";
import * as M from "./moneylogic.js";
import * as L from "./moneylogic3.js";

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  document.head.appendChild(el("style", "", `
.mn3-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 10px; width: 100%; max-width: 640px; margin: 0 auto; box-sizing: border-box; }
.mn3-row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; align-items: center; max-width: 100%; }
.mn3-box { background: rgba(255, 255, 255, .92); border: 2px solid #5a3d7a; border-radius: 18px; padding: 10px 16px; font-size: clamp(18px, 4vw, 24px); font-weight: 800; color: #3b2054; text-align: center; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; max-width: 94vw; box-sizing: border-box; }
.mn3-ask { font-size: clamp(17px, 3.6vw, 22px); }
.mn3-btn { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-width: 96px; min-height: 64px; padding: 6px 12px; border-radius: 16px; border: 2px solid #5a3d7a; background: #fff; box-shadow: 0 4px 0 rgba(90, 60, 120, .2); font: 800 19px var(--font, sans-serif); color: #3b2054; cursor: pointer; touch-action: manipulation; }
.mn3-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(90, 60, 120, .2); }
.mn3-btn.done { opacity: .45; background: #eafbe6; }
.mn3-btn.picked { background: #fff3c4; border-color: #e0a400; }
.mn3-btn small { font-size: 15px; font-weight: 800; }
.mn3-art { display: inline-flex; width: 44px; height: 44px; } .mn3-art svg { width: 100%; height: 100%; }
.mn3-big { display: inline-flex; width: 64px; height: 64px; } .mn3-big svg { width: 100%; height: 100%; }
.mn3-cash { display: inline-flex; width: 48px; height: 48px; } .mn3-cash.note { width: 78px; height: 48px; } .mn3-cash svg.art { width: 100%; height: 100%; }
.mn3-mini .mn3-cash { width: 28px; height: 28px; } .mn3-mini .mn3-cash.note { width: 44px; height: 28px; }
.mn3-tray { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; align-items: center; min-height: 56px; min-width: min(300px, 90vw); max-width: 94vw; padding: 6px; border: 3px dashed rgba(90, 60, 130, .3); border-radius: 18px; background: rgba(255, 255, 255, .6); box-sizing: border-box; }
.mn3-jar { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 76px; min-height: 96px; padding: 6px; border: 2px solid #5a3d7a; border-radius: 14px 14px 22px 22px; background: rgba(232, 246, 255, .95); cursor: pointer; touch-action: manipulation; font: 800 16px var(--font, sans-serif); color: #3b2054; }
.mn3-line { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; min-height: 64px; }
.mn3-step { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; background: #eafbe6; font-weight: 800; font-size: 16px; }
.mn3-bar { width: min(320px, 86vw); height: 18px; border: 2px solid #5a3d7a; border-radius: 10px; background: #fff; overflow: hidden; }
.mn3-bar i { display: block; height: 100%; width: 0; background: #ffb020; transition: width .35s; }
.gl.little .mn3-btn { min-width: 110px; min-height: 72px; }
.gl.little .mn3-jar { min-width: 84px; min-height: 104px; }
`));
}

// ---------- small helpers, the same as the other money games ----------
const getCode = () => M.CODES.includes(curCode()) ? curCode() : "AUD";
const mix = <V,>(list: V[]): V[] => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pickOne = <V,>(list: V[]): V => list[Math.floor(Math.random() * list.length)];
const money = (v: number, code: string) => fmtMinor(v, code);
// a coin or note picture (notes cropped to their own shape so they sit at the height of a coin)
const cash = (code: string, v: number) => { const d = M.denom(code, v), a = pic(M.artKey(code, v)); return `<span class="mn3-cash ${d ? d.kind : "coin"}">${d && d.kind === "note" ? a.replace('viewBox="0 0 48 48"', 'viewBox="0 9 48 30"') : a}</span>`; };
const art = (key: string, cls = "mn3-art") => `<span class="${cls}">${pic(key)}</span>`;
// one "unit" a little one counts in: $1 or 10.000 đồng; a smaller and a bigger coin or note to mix in
const unit = (code: string) => code === "VND" ? 10000 : 100;
const half = (code: string) => code === "VND" ? 5000 : 50;
const big = (code: string) => code === "VND" ? 20000 : 200;
// the value for the chosen level: Easy, Medium, Hard, Talent; under-5s always get the Easy value (js/games/money2.ts)
const lv = <V,>(api, e: V, m: V, h: V, t: V = h): V => { const v = api.little ? e : [e, m, h, t][api.smart || 0] ?? e; api.lvNote?.([e, m, h, t], v); return v; };
// the numbers a game's level uses, written on the stage (data-lv) before the first tap, for the levels check
const mark = (api, ...v) => { api.stage.dataset.lv = v.join(","); };
function setup(api, intro: [string, string], rounds: number) {
  style();
  api.dots(rounds, 0);
  api.say(intro[0], intro[1]);
  const wrap = el("div", "mn3-wrap");
  api.stage.appendChild(wrap);
  return wrap;
}
// a question with money answers: the right one and others near it (3 Easy, 4 Medium and Hard, 5 Talent)
async function moneyQuestion(api, wrap: HTMLElement, show: string, ask: [string, string], right: number, by: number, code: string, many: number) {
  const row = el("div", "mn3-row");
  wrap.replaceChildren(el("div", "mn3-box", show), el("div", "mn3-box mn3-ask", T(ask[0], ask[1])), row);
  api.say(ask[0], ask[1]);
  const answers = [right];
  for (const k of [1, -1, 2, -2, 3, -3, 4]) { const v = right + k * by; if (answers.length < many && v > 0 && !answers.includes(v)) answers.push(v); }
  const btns = mix(answers).map(v => { const b = el("button", "mn3-btn", money(v, code)); b.dataset.v = String(v); row.appendChild(b); return b; });
  const target = btns.find(b => b.dataset.v === String(right));
  api.plan(() => target, { maxActions: 5 });
  return untilRight(api, btns, b => b === target);
}
// tap coins from the row until the amount is made exactly; a coin that would go over bounces back. With a limit, using
// more coins than that empties the tray to start again (the fewest coins). Returns false when the game closed.
async function makeAmount(api, wrap: HTMLElement, code: string, goal: number, coins: number[], head: (sum: number, used: number) => string, limit = 0) {
  const top = el("div", "mn3-box", head(0, 0));
  const tray = el("div", "mn3-tray");
  const row = el("div", "mn3-row");
  wrap.replaceChildren(top, tray, row);
  const btns = coins.map(v => { const b = el("button", "mn3-btn", cash(code, v) + `<small>${money(v, code)}</small>`); b.dataset.v = String(v); row.appendChild(b); return b; });
  let sum = 0, used = 0;
  // auto play: the biggest coin that still fits (always the fewest, both currencies are canonical)
  api.plan(() => btns.filter(b => sum + +b.dataset.v <= goal).sort((a, b) => +b.dataset.v - +a.dataset.v)[0] || null, { maxActions: 16 });
  while (sum < goal) {
    const tapped = await tapOne(btns, api);
    if (!tapped || api.closed) return false;
    const v = +tapped.dataset.v;
    if (sum + v > goal) { api.wrong(tapped, "Too much! Try a smaller one.", "Nhiều quá! Thử tờ nhỏ hơn nhé."); continue; }
    sum += v; used++; api.sfx.coin();
    tray.insertAdjacentHTML("beforeend", cash(code, v));
    if (limit && used >= limit && sum < goal) {
      api.wrong(tapped, "Too many coins! Start again with bigger ones.", "Nhiều đồng quá! Làm lại với đồng lớn hơn nhé.");
      sum = 0; used = 0; tray.replaceChildren();
    }
    top.innerHTML = head(sum, used);
  }
  return true;
}
// a row of buttons to tap in turn; check says if a tap is right now; each right tap runs then(), until done() says so
async function tapUntil(api, btns: HTMLElement[], right: (b: HTMLElement) => boolean, then: (b: HTMLElement) => void, done: () => boolean, plan: () => HTMLElement | null) {
  api.plan(plan, { maxActions: 20 });
  while (!done()) {
    const b = await untilRight(api, btns, right);
    if (!b || api.closed) return false;
    then(b);
  }
  return true;
}
const finishRound = async (api, rounds: number, r: number, ms = 700) => { api.sfx.ding(); api.dots(rounds, r + 1); await wait(ms); };

// things to buy, with their pictures (all drawn in js/art)
type Thing = [string, [string, string]];
const SHOP: Thing[] = [["🍎", ["an apple", "quả táo"]], ["🍌", ["bananas", "nải chuối"]], ["🥖", ["bread", "bánh mì"]], ["🧃", ["a juice", "hộp nước"]], ["🥛", ["milk", "sữa"]],
  ["🖍️", ["crayons", "bút sáp"]], ["📖", ["a book", "quyển sách"]], ["🎈", ["a balloon", "bóng bay"]], ["🧸", ["a teddy", "gấu bông"]], ["🪁", ["a kite", "con diều"]], ["⚽", ["a ball", "quả bóng"]], ["🍪", ["biscuits", "bánh quy"]]];

// ---------- Shop and Pay: add up the basket, then pay it exactly ----------
register({
  id: "shoppay", icon: "mn3:shoppay", name: () => T("Shop and Pay", "Mua Hàng Trả Tiền"),
  async run(api) {
    // (levels) one thing Easy, two Medium, three Hard and Talent; Talent pays without the big coin or note
    const code = getCode(), rounds = lv(api, 3, 3, 4, 4), items = lv(api, 1, 2, 3, 3), kinds = api.talent ? [half(code), unit(code)] : [half(code), unit(code), big(code)];
    mark(api, rounds, items, kinds.length);
    const wrap = setup(api, ["Put things in your basket, add up the price and pay exactly!", "Bỏ đồ vào giỏ, cộng tiền rồi trả đúng số tiền nhé!"], rounds);
    await wait(1200);
    for (let r = 0; r < rounds; r++) {
      const basket = mix(SHOP).slice(0, items), prices = basket.map(() => half(code) * (api.little ? 2 * (1 + Math.floor(Math.random() * 3)) : 1 + Math.floor(Math.random() * 5)));
      const total = M.total(prices), show = basket.map(([icon], i) => `${art(icon)}${money(prices[i], code)}`).join(" + ");
      if (items > 1) {
        const ok = await moneyQuestion(api, wrap, `${pic("🧺")} ${show}`, ["How much for everything?", "Tất cả hết bao nhiêu tiền?"], total, half(code), code, lv(api, 3, 4, 4, 5));
        if (!ok || api.closed) return;
        await wait(500);
      }
      api.say("Now pay with your coins. Make it exactly right!", "Giờ trả tiền nhé. Trả cho thật đúng!");
      const paid = await makeAmount(api, wrap, code, total, kinds, sum => `${show} · ${T("Pay", "Trả")} ${money(total, code)} · ${T("Paid", "Đã trả")} ${money(sum, code)}`);
      if (!paid) return;
      api.say("Thank you! Enjoy your shopping!", "Cảm ơn con! Mua sắm vui nhé!");
      await finishRound(api, rounds, r, 900);
    }
    return api.win({ title: T("Shopping done!", "Đi chợ xong rồi!") });
  }
});

// ---------- Give Change: count up from the price to the money paid ----------
register({
  id: "givechange", icon: "mn3:givechange", name: () => T("Give Change: Count Up", "Đếm Thêm Trả Tiền Thừa"),
  async run(api) {
    // (levels) Easy: change from $1 (10.000 đồng); then from bigger notes; Talent: from $20 (100.000 đồng) and more rounds
    const code = getCode(), V = code === "VND";
    const rounds = lv(api, 3, 4, 4, 5), paidOpts = lv(api, V ? [10000] : [100], V ? [20000, 50000] : [200, 500], V ? [50000, 100000] : [500, 1000], V ? [100000, 200000] : [1000, 2000]);
    const coins = V ? [1000, 2000, 5000, 10000, 20000, 50000] : [10, 20, 50, 100, 200, 500, 1000];
    mark(api, rounds, paidOpts.join("/"));
    const wrap = setup(api, ["You are the shopkeeper. Count up from the price to the money you were given!", "Con là người bán hàng. Đếm thêm từ giá tiền đến số tiền khách đưa nhé!"], rounds);
    await wait(1400);
    for (let r = 0; r < rounds; r++) {
      const paid = pickOne(paidOpts), stepV = V ? 1000 : 10, most = Math.min(paid - stepV, api.little ? (V ? 5000 : 50) : paid);
      const change = stepV * (1 + Math.floor(Math.random() * Math.floor(most / stepV))), price = paid - change, thing = pickOne(SHOP);
      api.say("Count up from the price to the money you were given.", "Đếm thêm từ giá tiền đến số tiền khách đưa.");
      const ok = await makeAmount(api, wrap, code, change, coins.filter(c => c <= change),
        sum => `${art(thing[0])} ${pic("🏷️")} ${money(price, code)} · ${cash(code, paid)} · <span class="mn3-step">${money(price + sum, code)} → ${money(paid, code)}</span>`);
      if (!ok) return;
      api.say("Here is your change. Thank you!", "Tiền thừa của bạn đây. Cảm ơn nhé!");
      await finishRound(api, rounds, r, 900);
    }
    return api.win({ title: T("Super shopkeeper!", "Bé bán hàng giỏi quá!") });
  }
});

// ---------- Save for a Toy: how many weeks of pocket money? ----------
const TOYS: Thing[] = [["🧸", ["a teddy", "gấu bông"]], ["🪁", ["a kite", "con diều"]], ["⚽", ["a ball", "quả bóng"]], ["🎮", ["a game", "trò chơi"]], ["📖", ["a book", "quyển sách"]], ["🚗", ["a toy car", "ô tô đồ chơi"]]];
register({
  id: "toysave", icon: "mn3:toysave", name: () => T("Save for a Toy", "Để Dành Mua Đồ Chơi"),
  async run(api) {
    // (levels) more weeks to count each level; Hard: some money is in the piggy bank already; Talent: the weekly money
    // is not a whole dollar (or 10.000 đồng)
    const code = getCode(), rounds = lv(api, 2, 3, 3, 4), weeks = lv(api, [2, 3], [3, 4, 5], [4, 5, 6], [5, 6, 7, 8]), head = lv(api, false, false, true, true);
    const each = unit(code) + (api.talent ? half(code) : 0), many = lv(api, 3, 4, 4, 5);
    mark(api, rounds, weeks.join("/"), head ? 1 : 0, each, many);
    const wrap = setup(api, ["Save your pocket money in the piggy bank. How many weeks until you can buy the toy?", "Bỏ tiền tiêu vặt vào heo đất. Bao nhiêu tuần thì con mua được đồ chơi?"], rounds);
    await wait(1500);
    for (let r = 0; r < rounds; r++) {
      const toy = TOYS[(r + Math.floor(Math.random() * TOYS.length)) % TOYS.length], w = pickOne(weeks), start = head ? each * (1 + Math.floor(Math.random() * 2)) : 0;
      // the price is a little under a whole number of weeks sometimes (Hard and Talent), so the last week tops it up
      const price = start + each * w - (head && Math.random() < .5 ? half(code) : 0), right = L.weeksToSave(price, each, start);
      const top = `${art(toy[0], "mn3-big")} ${pic("🏷️")} ${money(price, code)} · ${pic("🐷")} ${money(start, code)} · +${money(each, code)} / ${T("week", "tuần")}`;
      const row = el("div", "mn3-row"), bar = el("div", "mn3-bar", "<i></i>");
      wrap.replaceChildren(el("div", "mn3-box", top), bar, el("div", "mn3-box mn3-ask", T("How many weeks until you can buy it?", "Bao nhiêu tuần thì mua được?")), row);
      (bar.firstChild as HTMLElement).style.width = Math.round(100 * start / price) + "%";
      api.say("How many weeks until you can buy it?", "Bao nhiêu tuần thì mua được?");
      const opts = [right]; for (const k of [1, -1, 2, -2, 3]) if (opts.length < many && right + k > 0) opts.push(right + k);
      const btns = mix(opts).map(n => { const b = el("button", "mn3-btn", `<b>${n}</b><small>${T("weeks", "tuần")}</small>`); b.dataset.n = String(n); row.appendChild(b); return b; });
      api.plan(() => btns.find(b => +b.dataset.n === right), { maxActions: 5 });
      const ok = await untilRight(api, btns, b => +b.dataset.n === right);
      if (!ok || api.closed) return;
      // the piggy bank fills week by week
      for (const v of L.savingWeeks(price, each, start).slice(1)) { if (api.closed) return; (bar.firstChild as HTMLElement).style.width = Math.min(100, Math.round(100 * v / price)) + "%"; api.sfx.coin(); await wait(260); }
      api.say("You saved enough. Well done for waiting!", "Con để dành đủ rồi. Giỏi lắm vì đã biết chờ!");
      await finishRound(api, rounds, r, 1000);
    }
    return api.win({ title: T("Patient saver!", "Bé tiết kiệm giỏi!") });
  }
});

// ---------- Needs before Wants: buy every need, then one treat that fits ----------
const NEEDS: Thing[] = [["🍚", ["rice", "gạo"]], ["🥛", ["milk", "sữa"]], ["🪥", ["a toothbrush", "bàn chải"]], ["🧦", ["socks", "tất"]], ["🍞", ["bread", "bánh mì"]], ["🧼", ["soap", "xà phòng"]], ["🥚", ["eggs", "trứng"]]];
const WANTS: Thing[] = [["🧸", ["a teddy", "gấu bông"]], ["🎮", ["a game", "trò chơi"]], ["🍬", ["sweets", "kẹo"]], ["🎈", ["a balloon", "bóng bay"]], ["🪁", ["a kite", "con diều"]], ["🍦", ["an ice cream", "kem"]]];
register({
  id: "needsfirst", icon: "mn3:needsfirst", name: () => T("Needs before Wants", "Cần Trước, Muốn Sau"),
  async run(api) {
    // (levels) more needs and wants each level; Easy: any treat fits; Hard: only some fit; Talent: just one fits
    const code = getCode(), rounds = lv(api, 2, 3, 3, 4), nNeeds = lv(api, 2, 2, 3, 3), nWants = lv(api, 2, 3, 3, 4), fitting = lv(api, 99, 2, 2, 1);
    mark(api, rounds, nNeeds, nWants, fitting);
    const wrap = setup(api, ["Buy everything you need first. Then choose one treat with the money left!", "Mua hết những thứ cần trước. Rồi chọn một món thích bằng tiền còn lại nhé!"], rounds);
    await wait(1500);
    for (let r = 0; r < rounds; r++) {
      const needs = mix(NEEDS).slice(0, nNeeds), wants = mix(WANTS).slice(0, nWants), u = half(code);
      const needP = needs.map(() => u * (1 + Math.floor(Math.random() * 3))), wantP = wants.map((_, i) => u * (2 + i * 2));   // the wants all cost different amounts
      const sortedW = wantP.slice().sort((a, b) => a - b), extra = sortedW[Math.min(fitting, sortedW.length) - 1];
      const budget = M.total(needP) + extra;   // after the needs, exactly the `fitting` cheapest wants still fit
      let left = budget, needsLeft = nNeeds;
      const head = el("div", "mn3-box"), row = el("div", "mn3-row"), tray = el("div", "mn3-tray mn3-mini");
      const draw = () => { head.innerHTML = `${pic("mn3:purse")} ${T("Money left", "Tiền còn")} ${money(left, code)}`; };
      draw();
      const all = [...needs.map((t, i) => ({ t, p: needP[i], need: true })), ...wants.map((t, i) => ({ t, p: wantP[i], need: false }))];
      const btns = mix(all).map(x => { const b = el("button", "mn3-btn", `${art(x.t[0])}<small>${money(x.p, code)}</small>`); Object.assign(b.dataset, { p: String(x.p), need: x.need ? "1" : "", icon: x.t[0] }); row.appendChild(b); return b; });
      wrap.replaceChildren(head, el("div", "mn3-box mn3-ask", T("Needs first, then one treat!", "Cần trước, rồi một món thích!")), row, tray);
      api.say("Tap the things you need first.", "Chạm vào những thứ cần trước nhé.");
      const live = () => btns.filter(b => !b.classList.contains("done"));
      const right = (b: HTMLElement) => !b.classList.contains("done") && (needsLeft > 0 ? b.dataset.need === "1" : +b.dataset.p <= left);
      // a want tapped while needs are left, or a treat that costs too much: say why
      const sayWhy = (b: HTMLElement) => { if (needsLeft > 0 && !b.dataset.need) api.say("Needs first! We need that before treats.", "Cần trước đã! Mua thứ cần trước khi mua đồ thích."); else if (needsLeft === 0 && +b.dataset.p > left) api.say("Not enough money left for that one.", "Không đủ tiền cho món đó rồi."); };
      const watch = (e: Event) => { const b = (e.target as Element).closest?.(".mn3-btn") as HTMLElement; if (b && !right(b)) sayWhy(b); };
      row.addEventListener("click", watch, true);
      let treat = false;
      const ok = await tapUntil(api, live(), right, b => {
        b.classList.add("done"); left -= +b.dataset.p; tray.insertAdjacentHTML("beforeend", art(b.dataset.icon)); api.sfx.coin(); draw();
        if (b.dataset.need === "1") { if (--needsLeft === 0) api.say("All the needs are bought. Now one treat that fits your money!", "Đã mua đủ thứ cần. Giờ chọn một món thích vừa đủ tiền nhé!"); } else treat = true;
      }, () => treat, () => live().find(right) || null);
      row.removeEventListener("click", watch, true);
      if (!ok) return;
      await finishRound(api, rounds, r, 900);
    }
    return api.win({ title: T("Smart spender!", "Bé tiêu tiền thông minh!") });
  }
});

// ---------- Price Tag Line-up: cheapest to dearest ----------
register({
  id: "pricesort", icon: "mn3:pricesort", name: () => T("Price Tag Line-up", "Xếp Thẻ Giá"),
  async run(api) {
    // (levels) more tags each level (3, 4, 5, 6); Talent's prices are close together
    const code = getCode(), rounds = lv(api, 3, 3, 4, 4), n = lv(api, 3, 4, 5, 6), close = api.talent;
    mark(api, rounds, n, close ? 1 : 0);
    const wrap = setup(api, ["Line up the price tags, from the cheapest to the dearest!", "Xếp các thẻ giá từ rẻ nhất đến đắt nhất nhé!"], rounds);
    await wait(1400);
    for (let r = 0; r < rounds; r++) {
      const things = mix(SHOP).slice(0, n), by = close ? (code === "VND" ? 1000 : 10) : half(code);
      const lo = close ? unit(code) : half(code), prices = M.distinctPrices(n, lo, lo + by * (close ? n + 3 : n * 3), by);
      const line = el("div", "mn3-line"), row = el("div", "mn3-row");
      wrap.replaceChildren(el("div", "mn3-box mn3-ask", T("Tap the cheapest one first.", "Chạm món rẻ nhất trước.")), line, row);
      api.say("Tap the cheapest one first, then the next.", "Chạm món rẻ nhất trước, rồi đến món tiếp theo.");
      const btns = things.map(([icon], i) => { const b = el("button", "mn3-btn", `${art(icon)}<small>${pic("🏷️")} ${money(prices[i], code)}</small>`); b.dataset.p = String(prices[i]); row.appendChild(b); return b; });
      const order = L.tagOrder(prices); let k = 0;
      const ok = await tapUntil(api, btns, b => b === btns[order[k]], b => { b.classList.add("done"); line.appendChild(el("span", "mn3-step", `${k + 1}. ${money(+b.dataset.p, code)}`)); k++; }, () => k >= n, () => btns[order[k]] || null);
      if (!ok) return;
      await finishRound(api, rounds, r);
    }
    return api.win({ title: T("All in order!", "Xếp đúng hết rồi!") });
  }
});

// ---------- Market Day: at the sạp, pay with the one note that is just enough ----------
const MARKET: Thing[] = [["🥭", ["mangoes", "xoài"]], ["🍚", ["rice", "gạo"]], ["🐟", ["a fish", "con cá"]], ["🌸", ["flowers", "hoa"]], ["🍊", ["oranges", "cam"]], ["🥥", ["a coconut", "quả dừa"]], ["🍍", ["a pineapple", "quả dứa"]], ["🥕", ["carrots", "cà rốt"]]];
register({
  id: "marketday", icon: "mn3:marketday", origin: "vn", name: () => T("Market Day", "Phiên Chợ"),
  async run(api) {
    // (levels) Easy: only one note is enough; Medium on: the smallest note that is enough; more notes each level;
    // Talent: then say how much change comes back
    const code = getCode(), rounds = lv(api, 3, 4, 4, 5), wallet = lv(api, 3, 4, 5, 5), onlyOne = lv(api, true, false, false, false);
    const ups = M.DENOMS[code].map(d => d.v).filter(v => v >= unit(code) / 2 && v <= (code === "VND" ? 200000 : 5000));
    mark(api, rounds, wallet, onlyOne ? 1 : 0, api.talent ? 1 : 0);
    const wrap = setup(api, ["Market day! Pay the seller at her stall with the note that is just enough.", "Phiên chợ! Trả tiền cho cô bán hàng bằng tờ tiền vừa đủ nhé."], rounds);
    await wait(1500);
    for (let r = 0; r < rounds; r++) {
      // the right note is the third or later, so smaller ones are there to be too little
      const ri = 2 + Math.floor(Math.random() * (ups.length - 2 - (onlyOne ? 0 : 1))), note = ups[ri], below = ups[ri - 1], step = M.step(code);
      const price = below + step * (1 + Math.floor(Math.random() * Math.max(1, Math.floor((note - below) / step) - 1)));
      const small = mix(ups.slice(0, ri)).slice(0, onlyOne ? wallet - 1 : Math.max(1, wallet - 2)), more = onlyOne ? [] : mix(ups.slice(ri + 1)).slice(0, wallet - 1 - small.length);
      const notes = mix([note, ...small, ...more]), right = L.smallestCover(price, notes), thing = pickOne(MARKET);
      const row = el("div", "mn3-row");
      const ask: [string, string] = onlyOne ? ["Which one is enough to pay?", "Tờ nào đủ để trả?"] : ["Which is the smallest one that is enough?", "Tờ nhỏ nhất mà vẫn đủ là tờ nào?"];
      wrap.replaceChildren(el("div", "mn3-box", `${art("mn3:sap", "mn3-big")} ${art(thing[0])} ${pic("🏷️")} ${money(price, code)}`), el("div", "mn3-box mn3-ask", T(ask[0], ask[1])), row);
      api.say(ask[0], ask[1]);
      const btns = notes.map(v => { const b = el("button", "mn3-btn", cash(code, v) + `<small>${money(v, code)}</small>`); b.dataset.v = String(v); row.appendChild(b); return b; });
      api.plan(() => btns.find(b => +b.dataset.v === right), { maxActions: 6 });
      const ok = await untilRight(api, btns, b => +b.dataset.v === right);
      if (!ok || api.closed) return;
      if (api.talent) {
        await wait(500);
        const got = await moneyQuestion(api, wrap, `${art(thing[0])} ${money(price, code)} · ${cash(code, right)}`, ["How much change do you get back?", "Con được thối lại bao nhiêu?"], right - price, step, code, 5);
        if (!got || api.closed) return;
      }
      api.say("Thank you, little one! Come again!", "Cảm ơn con nhé! Lần sau lại ghé!");
      await finishRound(api, rounds, r, 900);
    }
    return api.win({ title: T("Market master!", "Bé đi chợ giỏi quá!") });
  }
});

// ---------- Coin Sort: each coin or note into its own jar ----------
register({
  id: "coinsort", icon: "mn3:coinsort", name: () => T("Coin Sort", "Phân Loại Tiền"),
  async run(api) {
    // (levels) more jars and more money to sort each level; Talent: then count one jar
    const code = getCode(), jars = lv(api, 2, 3, 4, 5), pieces = lv(api, 6, 8, 10, 12);
    const all = M.DENOMS[code].map(d => d.v).filter(v => code === "VND" ? v <= 100000 : v <= 1000);
    // Easy picks two that look very different (a silver and a gold coin, or a small and a big note)
    const kinds = (jars === 2 ? [all[1], all[code === "VND" ? 5 : 4]] : mix(all).slice(0, jars)).sort((a, b) => a - b);
    mark(api, jars, pieces, api.talent ? 1 : 0);
    const wrap = setup(api, ["Sort the money! Put each one in the jar with the same picture.", "Phân loại tiền nhé! Bỏ mỗi tờ vào hũ có hình giống nó."], pieces);
    await wait(1300);
    const count: Record<number, number> = {}; kinds.forEach(k => { count[k] = 0; });
    const now = el("div", "mn3-box"), row = el("div", "mn3-row");
    wrap.replaceChildren(now, row);
    const btns = kinds.map(v => { const b = el("button", "mn3-jar", `${art("🫙")}${cash(code, v)}<small>${money(v, code)}</small>`); b.dataset.v = String(v); row.appendChild(b); return b; });
    for (let r = 0; r < pieces; r++) {
      const v = kinds[(r + Math.floor(Math.random() * kinds.length)) % kinds.length];
      now.innerHTML = `${T("Where does it go?", "Bỏ vào hũ nào?")} ${cash(code, v)}`;
      if (r === 0) api.say("Where does this one go?", "Tờ này bỏ vào hũ nào?");
      api.plan(() => btns.find(b => +b.dataset.v === v), { maxActions: 4 });
      const ok = await untilRight(api, btns, b => +b.dataset.v === v);
      if (!ok || api.closed) return;
      count[v]++; api.sfx.coin(); api.dots(pieces, r + 1);
      await wait(350);
    }
    if (api.talent) {
      const v = kinds.find(k => count[k] > 1) || kinds[0];
      const got = await moneyQuestion(api, wrap, `${art("🫙")} ${Array.from({ length: count[v] }, () => cash(code, v)).join("")}`, ["How much money is in this jar?", "Hũ này có bao nhiêu tiền?"], count[v] * v, v, code, 5);
      if (!got || api.closed) return;
    }
    return api.win({ title: T("All sorted!", "Phân loại xong rồi!") });
  }
});

// ---------- Make the Amount: exactly, and with the fewest coins at Hard and Talent ----------
register({
  id: "makeamount", icon: "mn3:makeamount", name: () => T("Make the Amount", "Ghép Đủ Số Tiền"),
  async run(api) {
    // (levels) more kinds of coin and bigger amounts each level; Hard: at most one coin more than the fewest; Talent: the fewest
    // every set holds a coin that all the others are made of, so no tap can leave the amount impossible to finish
    const code = getCode(), V = code === "VND", rounds = lv(api, 3, 4, 4, 5), nk = lv(api, 2, 3, 5, 6), spare = lv(api, -1, -1, 1, 0), adds = lv(api, 2, 3, 4, 5);
    const pool = V ? [1000, 2000, 5000, 10000, 20000, 50000] : [10, 20, 50, 100, 200, 500];
    const kinds = nk <= 3 ? pool.slice(2, 2 + nk) : pool.slice(0, nk);
    mark(api, rounds, kinds.length, spare, adds);
    const wrap = setup(api, ["Make the amount exactly with the coins and notes!", "Ghép tiền cho thật đúng số tiền nhé!"], rounds);
    await wait(1300);
    for (let r = 0; r < rounds; r++) {
      const goal = Array.from({ length: adds }, () => pickOne(kinds)).reduce((s, v) => s + v, 0);
      const least = L.fewest(goal, code, kinds) || 1, limit = spare < 0 ? 0 : least + spare;
      api.say(limit ? "Make the amount with as few coins as you can!" : "Make the amount exactly!", limit ? "Ghép đủ số tiền với ít tờ nhất có thể nhé!" : "Ghép cho thật đúng số tiền nhé!");
      const ok = await makeAmount(api, wrap, code, goal, kinds, (sum, used) => `${pic("🎯")} ${money(goal, code)} · ${money(sum, code)}${limit ? ` · ${used} / ${limit}` : ""}`, limit);
      if (!ok) return;
      await finishRound(api, rounds, r, 900);
    }
    return api.win({ title: T("Exactly right!", "Đúng từng đồng!") });
  }
});

// ---------- Budget a Picnic: one from each group, within the money ----------
const PICNIC: [string, string][][] = [[["🥪", "food"], ["🍙", "food"], ["🥖", "food"]], [["🧃", "drink"], ["🥛", "drink"], ["🥤", "drink"]], [["🍎", "fruit"], ["🍌", "fruit"], ["🍉", "fruit"], ["🥭", "fruit"]], [["🍪", "treat"], ["🧁", "treat"], ["🍦", "treat"]]];
register({
  id: "budgetpicnic", icon: "mn3:budgetpicnic", name: () => T("Budget a Picnic", "Đi Dã Ngoại Tiết Kiệm"),
  async run(api) {
    // (levels) more groups to choose from and less money to spare each level; Hard and Talent: say what is left at the end
    const code = getCode(), rounds = lv(api, 2, 2, 3, 3), groups = lv(api, 2, 3, 3, 4), opts = lv(api, 2, 3, 3, 3), spareU = lv(api, 6, 3, 2, 1), askLeft = lv(api, false, false, true, true);
    mark(api, rounds, groups, opts, spareU, askLeft ? 1 : 0);
    const wrap = setup(api, ["Plan a picnic! Choose one thing from each group and keep within your money.", "Lên kế hoạch dã ngoại! Chọn một món ở mỗi nhóm, tiêu không quá số tiền con có nhé."], rounds);
    await wait(1600);
    for (let r = 0; r < rounds; r++) {
      const u = half(code), gs = PICNIC.slice(0, groups).map(g => { const ps = M.distinctPrices(opts, u, u * 6, u); return mix(g).slice(0, opts).map(([icon], i) => ({ icon, p: ps[i] })); });
      const budget = L.cheapestPicnic(gs.map(g => g.map(x => x.p))) + u * spareU;
      let left = budget;
      const head = el("div", "mn3-box"), tray = el("div", "mn3-tray mn3-mini"), row = el("div", "mn3-row");
      const draw = () => { head.innerHTML = `${art("mn3:budgetpicnic")} ${T("Money left", "Tiền còn")} ${money(left, code)}`; };
      draw(); wrap.replaceChildren(head, tray, row);
      api.say("Choose one from this group.", "Chọn một món trong nhóm này.");
      for (let k = 0; k < gs.length; k++) {
        const rest = gs.slice(k + 1).map(g => g.map(x => x.p));
        const btns = gs[k].map(x => { const b = el("button", "mn3-btn", `${art(x.icon)}<small>${money(x.p, code)}</small>`); b.dataset.p = String(x.p); b.dataset.icon = x.icon; return b; });
        row.replaceChildren(...btns);
        const fits = (b: HTMLElement) => +b.dataset.p <= left && L.canFinish(left - +b.dataset.p, rest);
        const why = (e: Event) => { const b = (e.target as Element).closest?.(".mn3-btn") as HTMLElement; if (b && !fits(b)) api.say("Then there is not enough for the rest!", "Vậy thì không đủ tiền cho các món còn lại!"); };
        row.addEventListener("click", why, true);
        api.plan(() => btns.slice().sort((a, b) => +a.dataset.p - +b.dataset.p)[0], { maxActions: 5 });
        const b = await untilRight(api, btns, fits);
        row.removeEventListener("click", why, true);
        if (!b || api.closed) return;
        left -= +b.dataset.p; tray.insertAdjacentHTML("beforeend", art(b.dataset.icon)); api.sfx.coin(); draw();
        await wait(300);
      }
      if (askLeft && left > 0) {
        const got = await moneyQuestion(api, wrap, `<span class="mn3-mini">${tray.innerHTML}</span> ${pic("mn3:purse")} ${money(budget, code)}`, ["How much money is left?", "Còn lại bao nhiêu tiền?"], left, u, code, api.talent ? 5 : 4);
        if (!got || api.closed) return;
      }
      await finishRound(api, rounds, r, 900);
    }
    return api.win({ title: T("Picnic time!", "Đi dã ngoại thôi!") });
  }
});

// ---------- Earn by Chores: chores that add up to the goal exactly ----------
const CHORES: Thing[] = [["🧹", ["sweep the floor", "quét nhà"]], ["🍽️", ["wash the dishes", "rửa bát"]], ["🪴", ["water the plants", "tưới cây"]], ["🐶", ["feed the dog", "cho chó ăn"]], ["🛏️", ["make the bed", "dọn giường"]], ["👕", ["fold the clothes", "gấp quần áo"]], ["🧺", ["hang the washing", "phơi đồ"]]];
register({
  id: "chores", icon: "mn3:chores", name: () => T("Earn by Chores", "Làm Việc Nhà Kiếm Tiền"),
  async run(api) {
    // (levels) more chores to choose from each level; the goal needs more of them from Hard; tap a chore again to undo it
    const code = getCode(), rounds = lv(api, 2, 3, 3, 4), n = lv(api, 3, 4, 5, 6), need = lv(api, 2, 2, 3, 3);
    mark(api, rounds, n, need);
    const wrap = setup(api, ["Help at home to earn money for your piggy bank. Earn exactly the amount on the goal!", "Giúp việc nhà để kiếm tiền bỏ heo. Kiếm cho đúng số tiền mục tiêu nhé!"], rounds);
    await wait(1600);
    for (let r = 0; r < rounds; r++) {
      const u = half(code), list = mix(CHORES).slice(0, n), pays = mix(Array.from({ length: 6 }, (_, i) => u * (i + 1))).slice(0, n);
      const pick = mix(pays.map((_, i) => i)).slice(0, need), goal = pick.reduce((s, i) => s + pays[i], 0);
      const plan = L.choresFor(goal, pays) || pick;
      let sum = 0; const done = new Set<number>();
      const head = el("div", "mn3-box"), row = el("div", "mn3-row");
      const draw = () => { head.innerHTML = `${pic("🐷")} ${T("Goal", "Mục tiêu")} ${money(goal, code)} · ${T("Earned", "Đã kiếm")} ${money(sum, code)}`; };
      draw();
      const btns = list.map(([icon, name], i) => { const b = el("button", "mn3-btn", `${art(icon)}<small>+${money(pays[i], code)}</small>`); b.setAttribute("aria-label", T(name[0], name[1])); b.dataset.i = String(i); row.appendChild(b); return b; });
      wrap.replaceChildren(head, el("div", "mn3-box mn3-ask", T("Which chores make the goal exactly?", "Việc nào cộng lại vừa đúng mục tiêu?")), row);
      api.say("Tap the chores to do them. Tap again to undo.", "Chạm vào việc để làm. Chạm lại để bỏ.");
      // auto play: undo a chore that is not in the plan, else do the next one of the plan
      api.plan(() => btns.find(b => done.has(+b.dataset.i) && !plan.includes(+b.dataset.i)) || btns.find(b => plan.includes(+b.dataset.i) && !done.has(+b.dataset.i)) || null, { maxActions: 14 });
      while (sum !== goal) {
        const b = await tapOne(btns, api);
        if (!b || api.closed) return;
        const i = +b.dataset.i;
        if (done.has(i)) { done.delete(i); sum -= pays[i]; b.classList.remove("picked"); api.sfx.tap?.(); draw(); continue; }
        if (sum + pays[i] > goal) { api.wrong(b, "That is too much. Try another chore, or undo one.", "Vậy là nhiều quá. Thử việc khác, hoặc bỏ bớt một việc."); continue; }
        done.add(i); sum += pays[i]; b.classList.add("picked"); api.sfx.coin(); draw();
        if (sum === goal) api.right(b);
      }
      api.say("Exactly the goal! Thank you for helping!", "Vừa đúng mục tiêu! Cảm ơn con đã giúp đỡ!");
      await finishRound(api, rounds, r, 1000);
    }
    return api.win({ title: T("Super helper!", "Bé chăm làm quá!") });
  }
});

// ---------- Two Homes Money: Australian or Vietnamese, and which one it is ----------
register({
  id: "twomoney", icon: "mn3:twomoney", name: () => T("Two Homes Money", "Tiền Hai Nhà"),
  async run(api) {
    // (levels) more money to look at each level; Easy and Medium: which home is it from; Hard: which one it is (3
    // answers), Talent: 4 answers
    const rounds = lv(api, 5, 6, 8, 10), names = lv(api, 0, 0, 3, 4);
    mark(api, rounds, names);
    const wrap = setup(api, names ? ["Look at the money. Which one is it?", "Nhìn tiền nhé. Đây là tờ nào?"] : ["Is this money from Australia or from Vietnam?", "Tiền này của nước Úc hay của Việt Nam?"], rounds);
    await wait(1300);
    const label = (code: string, v: number) => code === "VND" ? M.denom(code, v).label + "đ" : M.denom(code, v).label;
    const every = M.CODES.flatMap(code => M.DENOMS[code].map(d => ({ code, v: d.v })));
    for (let r = 0; r < rounds; r++) {
      const it = pickOne(every), row = el("div", "mn3-row");
      wrap.replaceChildren(el("div", "mn3-box", `<span class="mn3-big">${cash(it.code, it.v)}</span>`), row);
      let btns: HTMLElement[], right: (b: HTMLElement) => boolean;
      if (!names) {
        btns = [["AUD", "🇦🇺", "Australia", "Nước Úc"], ["VND", "🇻🇳", "Vietnam", "Việt Nam"]].map(([c, flag, en, vi]) => { const b = el("button", "mn3-btn", `${art(flag)}<small>${T(en, vi)}</small>`); b.dataset.c = c; row.appendChild(b); return b; });
        right = b => b.dataset.c === it.code;
      } else {
        const same = M.DENOMS[it.code].map(d => d.v).filter(v => v !== it.v), other = M.CODES.find(c => c !== it.code);
        const opts = [{ code: it.code, v: it.v }, ...mix(same).slice(0, names - 2).map(v => ({ code: it.code, v })), { code: other, v: (pickOne(M.DENOMS[other] as { v: number }[])).v }];
        btns = mix(opts).map(o => { const b = el("button", "mn3-btn", `<b>${label(o.code, o.v)}</b>`); b.dataset.k = o.code + o.v; row.appendChild(b); return b; });
        right = b => b.dataset.k === it.code + it.v;
      }
      if (r === 0 || names) api.say(names ? "Which one is it?" : "Australia or Vietnam?", names ? "Đây là tờ nào?" : "Nước Úc hay Việt Nam?");
      api.plan(() => btns.find(right) || null, { maxActions: 4 });
      const ok = await untilRight(api, btns, right);
      if (!ok || api.closed) return;
      api.sfx.coin(); api.dots(rounds, r + 1);
      await wait(450);
    }
    return api.win({ title: T("You know the money of both homes!", "Con biết tiền của cả hai nhà rồi!") });
  }
});
