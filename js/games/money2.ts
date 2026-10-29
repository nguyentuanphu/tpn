// Money additions (owner, 23 Oct 2026 AEDT). (owner, 29 Oct 2026 AEDT audit: rebuilt) nine of the ten were one button
// to tap with no money in the thinking ("Tap to Pay", "Confirm", "Serve & Collect"), and Price Tags asked for a price
// nobody could know. Each one now asks a real money question with the real coins and notes: make an amount exactly,
// add up, compare prices, give change, keep to a budget, count a deposit back, and share fairly.
// Game coins only, never real money. Amounts are whole numbers in cents (AUD) or đồng (VND).
import { register, untilRight, tapOne } from "./frame.js";
import { T } from "../i18n.js";
import { pic } from "../art.js";
import { el, wait } from "../util.js";
import { curCode, fmtMinor, spokenMinor } from "../money.js";
import * as M from "./moneylogic.js";

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  document.head.appendChild(el("style", "", `
.mn2-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 12px; width: 100%; max-width: 600px; margin: 0 auto; }
.mn2-row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; align-items: center; }
.mn2-box { background: rgba(255, 255, 255, 0.92); border: 2px solid #5a3d7a; border-radius: 18px; padding: 12px 18px; font-size: clamp(20px, 4vw, 26px); font-weight: 800; color: #3b2054; text-align: center; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; max-width: 94vw; }
.mn2-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 110px; min-height: 56px; padding: 8px 16px; border-radius: 16px; border: 2px solid #5a3d7a; background: #fff; box-shadow: 0 4px 0 rgba(90, 60, 120, 0.2); font: 800 20px var(--font, sans-serif); color: #3b2054; cursor: pointer; touch-action: manipulation; }
.gl.little .mn2-btn { min-width: 120px; min-height: 64px; }
.mn2-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(90, 60, 120, 0.2); }
.mn2-art { display: inline-flex; width: 44px; height: 44px; }
.mn2-art svg { width: 100%; height: 100%; }
.mn2-cash { display: inline-flex; width: 52px; height: 52px; } .mn2-cash.note { width: 84px; height: 52px; } .mn2-cash svg.art { width: 100%; height: 100%; }
.mn2-coin { border: 0; background: rgba(255, 255, 255, .9); border-radius: 16px; min-width: 64px; min-height: 64px; padding: 4px 6px; box-shadow: 0 5px 0 rgba(90, 60, 130, .18); cursor: pointer; display: inline-flex; flex-direction: column; align-items: center; font: 800 17px var(--font, sans-serif); color: #3b2054; touch-action: manipulation; }
.mn2-tray { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; align-items: center; min-height: 64px; min-width: min(300px, 90vw); max-width: 94vw; padding: 6px; border: 3px dashed rgba(90, 60, 130, .3); border-radius: 18px; background: rgba(255, 255, 255, .6); }
.mn2-friends { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.mn2-friend { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 88px; min-height: 120px; border: 2px solid #5a3d7a; border-radius: 18px; background: #fff; cursor: pointer; padding: 6px; touch-action: manipulation; }
.mn2-friend .mn2-pile { display: flex; flex-wrap: wrap; gap: 2px; justify-content: center; max-width: 84px; }
.mn2-friend .mn2-pile .mn2-cash { width: 28px; height: 28px; }
`));
}

const getCode = () => M.CODES.includes(curCode()) ? curCode() : "AUD";
const mix = <V,>(list: V[]): V[] => [...list].sort(() => Math.random() - .5);
const money = (v: number, code: string) => fmtMinor(v, code);
const said = (v: number, code: string): [string, string] => [spokenMinor(v, "en", code), spokenMinor(v, "vi", code)];
// a coin or note picture (notes cropped to their own shape so they sit at the height of a coin)
const cash = (code: string, v: number) => { const d = M.denom(code, v), a = pic(M.artKey(code, v)); return `<span class="mn2-cash ${d ? d.kind : "coin"}">${d && d.kind === "note" ? a.replace('viewBox="0 0 48 48"', 'viewBox="0 9 48 30"') : a}</span>`; };
// one "unit" a little one counts in: $1 or 10.000 đồng; and a smaller and a bigger coin or note to mix in
const unit = (code: string) => code === "VND" ? 10000 : 100;
const small = (code: string) => code === "VND" ? 5000 : 50;
const big = (code: string) => code === "VND" ? 20000 : 200;

// a question with three money answers, the right one among two near it
async function moneyQuestion(api, show: string, ask: [string, string], right: number, by: number, code: string) {
  const box = el("div", "mn2-box", show);
  const row = el("div", "mn2-row");
  api.stage.querySelector(".mn2-wrap").replaceChildren(box, el("div", "mn2-box", T(ask[0], ask[1])), row);
  api.say(ask[0], ask[1]);
  const btns = mix(M.nearAnswers(right, by)).map(v => { const b = el("button", "mn2-btn", money(v, code)); b.dataset.v = String(v); row.appendChild(b); return b; });
  const target = btns.find(b => b.dataset.v === String(right));
  api.plan(() => target, { maxActions: 5 });
  return untilRight(api, btns, b => b === target);
}
function setup(api, intro: [string, string], rounds: number) {
  style();
  api.dots(rounds, 0);
  api.say(intro[0], intro[1]);
  const wrap = el("div", "mn2-wrap");
  api.stage.appendChild(wrap);
  return wrap;
}
// tap coins from the tray until the amount is made exactly; a coin that would go over bounces back
async function makeAmount(api, wrap: HTMLElement, code: string, goal: number, coins: number[], head: (sum: number) => string) {
  const top = el("div", "mn2-box", head(0));
  const tray = el("div", "mn2-tray");
  const row = el("div", "mn2-row");
  wrap.replaceChildren(top, tray, row);
  const btns = coins.map(v => { const b = el("button", "mn2-coin", cash(code, v) + money(v, code)); b.dataset.v = String(v); row.appendChild(b); return b; });
  let sum = 0;
  // auto play: the biggest coin that still fits
  api.plan(() => btns.filter(b => sum + +b.dataset.v <= goal).sort((a, b) => +b.dataset.v - +a.dataset.v)[0] || null, { maxActions: 12 });
  while (sum < goal) {
    const tapped = await tapOne(btns, api);
    if (!tapped || api.closed) return false;
    const v = +tapped.dataset.v;
    if (sum + v > goal) { api.sfx.no(); api.say("Too much! Try a smaller one.", "Nhiều quá! Thử tờ nhỏ hơn nhé."); continue; }
    sum += v; api.sfx.coin();
    tray.insertAdjacentHTML("beforeend", cash(code, v));
    top.innerHTML = head(sum);
  }
  return true;
}

register({
  id: "savegoal", icon: "🎯", name: () => T("Saving Goal", "Mục Tiêu Tiết Kiệm"),
  async run(api) {
    const code = getCode(), rounds = 3;
    const wrap = setup(api, ["Put coins in the money box until you have exactly enough!", "Bỏ tiền vào ống heo cho đến khi vừa đủ nhé!"], rounds);
    const toys: [string, [string, string]][] = mix([["⚽", ["a ball", "quả bóng"]], ["🧸", ["a teddy", "chú gấu bông"]], ["🪁", ["a kite", "con diều"]], ["📖", ["a book", "quyển sách"]]]);
    for (let r = 0; r < rounds; r++) {
      const goal = unit(code) * (api.little ? 2 + r : 3 + r * 2) + (r === 2 && !api.little ? small(code) : 0);
      const [icon, name] = toys[r];
      // (one whole line, so Lê Minh can record it: the price is on the money box)
      api.say("Save up to buy it! The price is on the money box.", "Tiết kiệm để mua nhé! Giá ghi trên ống heo.");
      const ok = await makeAmount(api, wrap, code, goal, [small(code), unit(code), big(code)],
        sum => `${pic(icon)} ${pic("🐷")} ${money(sum, code)} / ${money(goal, code)}`);
      if (!ok) return;
      api.sfx.ding(); api.dots(rounds, r + 1);
      await wait(900);
    }
    return api.win({ title: T("Goal reached!", "Đã đạt mục tiêu!") });
  }
});

register({
  id: "pocketweek", icon: "📅", name: () => T("Pocket Money Week", "Tiền Tiêu Vặt Trong Tuần"),
  async run(api) {
    const code = getCode(), each = unit(code), rounds = 4;
    const wrap = setup(api, ["You get pocket money each day. Keep count of your money!", "Mỗi ngày con được tiền tiêu vặt. Đếm xem con có bao nhiêu nhé!"], rounds);
    await wait(1500);
    const days: [string, string][] = [["Monday", "Thứ Hai"], ["Tuesday", "Thứ Ba"], ["Wednesday", "Thứ Tư"], ["Thursday", "Thứ Năm"]];
    // one day a treat is bought; the others add the day's money
    const spendDay = 2 + Math.floor(Math.random() * 2);
    let have = each;
    for (let r = 0; r < rounds; r++) {
      const spend = r === spendDay;
      const before = have;
      have = spend ? have - each : have + each;
      const ask: [string, string] = spend
        ? [`${days[r][0]}: you had ${said(before, code)[0]} and bought an ice cream for ${said(each, code)[0]}. How much is left?`, `${days[r][1]}: con có ${said(before, code)[1]} và mua kem hết ${said(each, code)[1]}. Còn lại bao nhiêu?`]
        : [`${days[r][0]}: you had ${said(before, code)[0]} and got ${said(each, code)[0]} more. How much now?`, `${days[r][1]}: con có ${said(before, code)[1]} và được thêm ${said(each, code)[1]}. Bây giờ có bao nhiêu?`];
      const show = `${pic("📅")} ${T(days[r][0], days[r][1])} ${spend ? pic("🍦") + " −" : " +"}${money(each, code)}`;
      const ok = await moneyQuestion(api, show, ask, have, each, code);
      if (!ok || api.closed) return;
      api.sfx.coin(); api.dots(rounds, r + 1);
      await wait(700);
    }
    return api.win({ title: T("Week complete!", "Đủ cả tuần rồi!") });
  }
});

register({
  id: "pricetags", icon: "🏷️", name: () => T("Price Tags", "Gắn Giá"),
  async run(api) {
    const code = getCode(), rounds = 4;
    const wrap = setup(api, ["Read the price tags. Which costs less, and which costs more?", "Đọc thẻ giá. Món nào rẻ hơn, món nào đắt hơn?"], rounds);
    await wait(1500);
    const things = ["🍎", "📖", "🚌", "🧸", "🎈", "🍌", "🪁", "🧃"];
    for (let r = 0; r < rounds; r++) {
      const less = r % 2 === 0;
      const [a, b] = mix(things).slice(0, 2);
      const [pa, pb] = api.little ? M.distinctPrices(2, unit(code), unit(code) * 9, unit(code)) : M.distinctPrices(2, M.step(code) * 2, code === "VND" ? 50000 : 1000, code === "VND" ? 1000 : 10);
      const ask: [string, string] = less ? ["Which costs less?", "Món nào rẻ hơn?"] : ["Which costs more?", "Món nào đắt hơn?"];
      wrap.replaceChildren(el("div", "mn2-box", T(ask[0], ask[1])));
      api.say(ask[0], ask[1]);
      const row = el("div", "mn2-row"); wrap.appendChild(row);
      const btns = [[a, pa], [b, pb]].map(([icon, p]) => { const btn = el("button", "mn2-coin", `<span class="mn2-art">${pic(String(icon))}</span>${pic("🏷️")} ${money(+p, code)}`); btn.dataset.p = String(p); row.appendChild(btn); return btn; });
      const right = less ? (pa < pb ? btns[0] : btns[1]) : (pa > pb ? btns[0] : btns[1]);
      api.plan(() => right, { maxActions: 4 });
      const ok = await untilRight(api, btns, x => x === right);
      if (!ok || api.closed) return;
      api.sfx.ding(); api.dots(rounds, r + 1);
      await wait(700);
    }
    return api.win({ title: T("Super shopper!", "Bé đi chợ giỏi!") });
  }
});

register({
  id: "busfare", icon: "🚌", name: () => T("Pay for the Bus", "Trả Tiền Xe Buýt"),
  async run(api) {
    const code = getCode(), rounds = 3;
    const wrap = setup(api, ["Pay the driver the exact fare with your coins!", "Trả bác tài đúng tiền vé bằng tiền của con nhé!"], rounds);
    for (let r = 0; r < rounds; r++) {
      const fare = code === "VND" ? [7000, 12000, 15000][r] : [150, 220, 350][r];
      const coins = code === "VND" ? [1000, 2000, 5000, 10000] : [10, 20, 50, 100, 200];
      api.say("Look at the fare and pay it!", "Xem giá vé rồi trả tiền nhé!");   // (the fare is on the screen; a whole line Lê Minh can record)
      const ok = await makeAmount(api, wrap, code, fare, api.little ? coins.slice(-3) : coins, sum => `${pic("🚌")} ${T("Fare", "Giá vé")} ${money(fare, code)} · ${T("Paid", "Đã trả")} ${money(sum, code)}`);
      if (!ok) return;
      api.sfx.ding(); api.say("Thank you! Hop on!", "Cảm ơn! Lên xe nào!");
      api.dots(rounds, r + 1);
      await wait(1000);
    }
    return api.win({ title: T("Ready to ride!", "Xe buýt khởi hành!") });
  }
});

register({
  id: "lemonade", icon: "🍋", name: () => T("Lemonade Stand", "Quầy Nước Chanh"),
  async run(api) {
    const code = getCode(), rounds = 3, price = unit(code);
    const wrap = setup(api, ["Sell lemonade! Work out how much each customer pays.", "Bán nước chanh! Tính xem mỗi khách trả bao nhiêu."], rounds);
    await wait(1500);
    for (let r = 0; r < rounds; r++) {
      const cups = 1 + Math.floor(Math.random() * (api.little ? 3 : 5));
      const show = `${pic("🍋")} ${money(price, code)} ${T("a cup", "một cốc")} · ${pic("🥤").repeat(cups)}`;
      const ok = await moneyQuestion(api, show, [`${cups} ${cups === 1 ? "cup" : "cups"}, please! How much altogether?`, `Cho tôi ${cups} cốc! Tất cả bao nhiêu tiền?`], price * cups, price, code);
      if (!ok || api.closed) return;
      api.sfx.coin(); api.dots(rounds, r + 1);
      await wait(700);
    }
    void wrap;
    return api.win({ title: T("Great lemonade day!", "Quầy nước chanh đắt hàng!") });
  }
});

register({
  id: "party", icon: "🎈", name: () => T("Party on a Budget", "Tiệc Tiết Kiệm"),
  async run(api) {
    const code = getCode(), u = unit(code);
    const need = api.little ? 2 : 3, budget = u * (api.little ? 6 : 10);
    const wrap = setup(api, [`You have ${said(budget, code)[0]}. Buy ${need} things for the party without going over!`, `Con có ${said(budget, code)[1]}. Mua ${need} món cho bữa tiệc mà không tiêu quá nhé!`], need);
    const shop: [string, [string, string], number][] = [["🎈", ["Balloons", "Bóng bay"], u * 2], ["🎂", ["Cake", "Bánh kem"], u * 5], ["🧃", ["Juice", "Nước trái cây"], u * 2], ["🎩", ["Party hats", "Mũ tiệc"], u * 3], ["🎁", ["Present", "Quà"], u * 4], ["🍪", ["Biscuits", "Bánh quy"], u]];
    let left = budget, bought = 0;
    const top = el("div", "mn2-box"), basket = el("div", "mn2-tray"), row = el("div", "mn2-row");
    wrap.replaceChildren(top, basket, row);
    const show = () => { top.innerHTML = `${pic("💰")} ${T("Money left", "Còn lại")}: ${money(left, code)}`; };
    show();
    const btns = mix(shop).map(([icon, name, p]) => { const b = el("button", "mn2-coin", `<span class="mn2-art">${pic(icon)}</span>${T(name[0], name[1])}<br>${money(p, code)}`); b.dataset.p = String(p); b.dataset.icon = icon; row.appendChild(b); return b; });
    api.plan(() => btns.filter(b => !b.disabled && +b.dataset.p <= left).sort((a, b) => +a.dataset.p - +b.dataset.p)[0] || null, { maxActions: 8 });
    while (bought < need) {
      const tapped = await tapOne(btns.filter(b => !b.disabled), api);
      if (!tapped || api.closed) return;
      const p = +tapped.dataset.p;
      if (p > left) { api.sfx.no(); api.say("Not enough money left for that!", "Không đủ tiền mua món đó rồi!"); continue; }
      left -= p; bought++; tapped.disabled = true; tapped.style.opacity = ".45";
      basket.insertAdjacentHTML("beforeend", `<span class="mn2-art">${pic(tapped.dataset.icon)}</span>`);
      show(); api.sfx.pop(bought); api.dots(need, bought);
      // stuck: nothing left that fits, so the shopping starts again
      if (bought < need && !btns.some(b => !b.disabled && +b.dataset.p <= left)) {
        api.say("Oh no, nothing else fits! Let us try again with cheaper things.", "Ôi, không còn món nào vừa túi tiền! Thử lại với món rẻ hơn nhé.");
        await wait(1800);
        left = budget; bought = 0; basket.innerHTML = ""; btns.forEach(b => { b.disabled = false; b.style.opacity = ""; }); show(); api.dots(need, 0);
      }
    }
    await wait(500);
    return api.win({ title: T("Party is ready!", "Bữa tiệc sẵn sàng!") });
  }
});

register({
  id: "recycle", icon: "♻️", name: () => T("Cans for Coins", "Đổi Lon Lấy Tiền"),
  async run(api) {
    const code = getCode(), rounds = 3;
    // (in Australia every can and bottle returned gives back 10 cents)
    const per = code === "VND" ? 1000 : 10;
    const wrap = setup(api, code === "VND" ? ["Each can you return gives back 1.000 đồng. How much do you get?", "Mỗi vỏ lon trả lại được 1.000 đồng. Con được bao nhiêu tiền?"] : ["Each can you return gives back 10 cents. How much do you get?", "Mỗi vỏ lon trả lại được 10 xu. Con được bao nhiêu tiền?"], rounds);
    await wait(1800);
    for (let r = 0; r < rounds; r++) {
      const cans = 2 + Math.floor(Math.random() * (api.little ? 3 : 7));
      const ok = await moneyQuestion(api, `${pic("♻️")} ${pic("🥫").repeat(cans)}`, [`${cans} cans. How much money back?`, `${cans} vỏ lon. Được trả lại bao nhiêu tiền?`], cans * per, per, code);
      if (!ok || api.closed) return;
      api.sfx.coin(); api.dots(rounds, r + 1);
      await wait(700);
    }
    void wrap;
    return api.win({ title: T("Recycling champion!", "Bé giỏi tái chế!") });
  }
});

register({
  id: "tetmarket", icon: "🏮", name: () => T("Tết Shopping", "Đi Chợ Tết"),
  async run(api) {
    const code = getCode(), rounds = 3;
    const wrap = setup(api, ["Shop at the Tết market! Pay with one note and work out your change.", "Đi chợ Tết! Trả bằng một tờ tiền rồi tính tiền thối nhé."], rounds);
    await wait(1600);
    const items: [string, [string, string], number][] = code === "VND"
      ? [["🌸", ["a branch of peach blossom", "cành đào"], 30000], ["🧧", ["a pack of red envelopes", "xấp bao lì xì"], 5000], ["🍊", ["a bag of oranges", "túi cam"], 15000], ["🏮", ["a lantern", "đèn lồng"], 20000]]
      : [["🌸", ["a branch of peach blossom", "cành đào"], 300], ["🧧", ["a pack of red envelopes", "xấp bao lì xì"], 50], ["🍊", ["a bag of oranges", "túi cam"], 150], ["🏮", ["a lantern", "đèn lồng"], 400]];
    for (const [r, [icon, name, price]] of mix(items).slice(0, rounds).entries()) {
      const paid = M.payWith(price, code, 1) ?? price;
      const show = `${pic(icon)} ${money(price, code)} · ${T("You pay", "Con trả")} ${cash(code, paid)}`;
      const ok = await moneyQuestion(api, show, [`${name[0][0].toUpperCase() + name[0].slice(1)} costs ${said(price, code)[0]}. You pay ${said(paid, code)[0]}. How much change?`, `${name[1][0].toUpperCase() + name[1].slice(1)} giá ${said(price, code)[1]}. Con trả ${said(paid, code)[1]}. Được thối lại bao nhiêu?`], paid - price, M.step(code) * (code === "VND" ? 5 : 10), code);
      if (!ok || api.closed) return;
      api.sfx.coin(); api.dots(rounds, r + 1);
      await wait(700);
    }
    void wrap;
    return api.win({ title: T("Happy Tết shopping!", "Sắm Tết vui vẻ!") });
  }
});

register({
  id: "bank", icon: "🏦", name: () => T("At the Bank", "Ở Ngân Hàng"),
  async run(api) {
    const code = getCode(), u = unit(code), rounds = 4;
    const wrap = setup(api, ["Put money in and take money out. Keep track of what is in the bank!", "Gửi tiền vào và rút tiền ra. Nhớ xem trong ngân hàng còn bao nhiêu nhé!"], rounds);
    await wait(1600);
    let balance = u * (2 + Math.floor(Math.random() * 3));
    for (let r = 0; r < rounds; r++) {
      const out = r % 2 === 1, amount = u * (1 + Math.floor(Math.random() * 2));
      const before = balance;
      balance = out ? balance - amount : balance + amount;
      const ask: [string, string] = out
        ? [`The bank has ${said(before, code)[0]}. You take out ${said(amount, code)[0]}. How much is left?`, `Ngân hàng có ${said(before, code)[1]}. Con rút ra ${said(amount, code)[1]}. Còn lại bao nhiêu?`]
        : [`The bank has ${said(before, code)[0]}. You put in ${said(amount, code)[0]}. How much now?`, `Ngân hàng có ${said(before, code)[1]}. Con gửi thêm ${said(amount, code)[1]}. Bây giờ có bao nhiêu?`];
      const ok = await moneyQuestion(api, `${pic("🏦")} ${money(before, code)} ${out ? "−" : "+"} ${money(amount, code)}`, ask, balance, u, code);
      if (!ok || api.closed) return;
      api.sfx.coin(); api.dots(rounds, r + 1);
      await wait(700);
    }
    void wrap;
    return api.win({ title: T("Bank counter clear!", "Giao dịch ngân hàng hoàn tất!") });
  }
});

register({
  id: "sharefair", icon: "🤝", name: () => T("Share Fairly", "Chia Đều"),
  async run(api) {
    const code = getCode(), coin = unit(code), rounds = 2;
    const wrap = setup(api, ["Share the coins so every friend gets the same. Give one each, round and round!", "Chia tiền để bạn nào cũng bằng nhau. Mỗi bạn một, lần lượt nhé!"], rounds);
    await wait(1600);
    for (let r = 0; r < rounds; r++) {
      const friends = api.little || r === 0 ? 2 : 3, each = 2 + Math.floor(Math.random() * (api.little ? 2 : 3));
      let pile = friends * each;
      const top = el("div", "mn2-box"), row = el("div", "mn2-friends");
      wrap.replaceChildren(top, row);
      const show = () => { top.innerHTML = `${T("Coins to share", "Tiền cần chia")}: ${cash(code, coin).repeat(pile) || "0"}`; };
      show();
      const faces = ["🧒", "👧", "🐻"];
      const cards = Array.from({ length: friends }, (_, i) => { const c = el("button", "mn2-friend", `<span class="mn2-art">${pic(faces[i])}</span><span class="mn2-pile"></span>`); c.dataset.n = "0"; row.appendChild(c); return c; });
      api.plan(() => cards.slice().sort((a, b) => +a.dataset.n - +b.dataset.n)[0], { maxActions: pile + 3 });
      while (pile > 0) {
        const tapped = await tapOne(cards, api);
        if (!tapped || api.closed) return;
        const least = Math.min(...cards.map(c => +c.dataset.n));
        if (+tapped.dataset.n > least) { api.sfx.no(); api.say("Give the others one first!", "Chia cho các bạn khác trước đã!"); continue; }
        tapped.dataset.n = String(+tapped.dataset.n + 1);
        tapped.querySelector(".mn2-pile").insertAdjacentHTML("beforeend", cash(code, coin));
        pile--; show(); api.sfx.coin();
      }
      api.say("Fair! Everyone has the same.", "Công bằng! Các bạn có bằng nhau.");
      api.sfx.ding(); api.dots(rounds, r + 1);
      await wait(1200);
    }
    return api.win({ title: T("Fairly shared!", "Chia đều thật vui!") });
  }
});
