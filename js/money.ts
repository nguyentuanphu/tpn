// Two real currencies: Australian dollars and Vietnamese đồng.
// The wallet is counted in "xu": 1 xu = 10 cents = 2.000 đồng, so prices read naturally in both.
import { settings } from './state.js';

export const CUR = {
  AUD: {
    name: { en: 'Australian dollars', vi: 'đô la Úc' }, flag: '🇦🇺', perXu: 10,
    denoms: [
      { v: 5, kind: 'coin', label: '5c', color: '#d8dde3', size: .74 },
      { v: 10, kind: 'coin', label: '10c', color: '#d8dde3', size: .84 },
      { v: 20, kind: 'coin', label: '20c', color: '#d8dde3', size: 1 },
      { v: 50, kind: 'coin', label: '50c', color: '#d8dde3', size: 1.04, sides: 12 },
      { v: 100, kind: 'coin', label: '$1', color: '#f0c548', size: .9 },
      { v: 200, kind: 'coin', label: '$2', color: '#f0c548', size: .76 },
      { v: 500, kind: 'note', label: '$5', color: '#d980b8' },
      { v: 1000, kind: 'note', label: '$10', color: '#4f8fd6' },
      { v: 2000, kind: 'note', label: '$20', color: '#e0614a' }
    ]
  },
  VND: {
    name: { en: 'Vietnamese đồng', vi: 'đồng Việt Nam' }, flag: '🇻🇳', perXu: 2000,
    denoms: [
      { v: 1000, kind: 'note', label: '1.000đ', color: '#b89a6a' },
      { v: 2000, kind: 'note', label: '2.000đ', color: '#a4785a' },
      { v: 5000, kind: 'note', label: '5.000đ', color: '#6c78b8' },
      { v: 10000, kind: 'note', label: '10.000đ', color: '#c9a54a' },
      { v: 20000, kind: 'note', label: '20.000đ', color: '#4f8fd6' },
      { v: 50000, kind: 'note', label: '50.000đ', color: '#d36aa0' },
      { v: 100000, kind: 'note', label: '100.000đ', color: '#5fa86a' },
      { v: 200000, kind: 'note', label: '200.000đ', color: '#d7704a' },
      { v: 500000, kind: 'note', label: '500.000đ', color: '#4fb7c4' }
    ]
  }
};

// (round S, owner 9 Oct) the money follows the language (Vietnamese: đồng, English: Australian dollars) unless a
// grown-up picked one in Grown-ups (settings.curPinned)
export const curCode = () => settings.curPinned && CUR[settings.currency] ? settings.currency : (settings.lang === 'vi' ? 'VND' : 'AUD');
export const cur = () => CUR[curCode()];
export const toMinor = xu => xu * cur().perXu;

// Format an amount in minor units (cents or đồng).
export function fmtMinor(v, code = curCode()) {
  if (code === 'VND') return v.toLocaleString('vi-VN').replace(/,/g, '.') + 'đ';
  if (v < 100) return v + 'c';
  return '$' + (v % 100 ? (v / 100).toFixed(2) : String(v / 100));
}
export const fmt = xu => fmtMinor(toMinor(xu));

// Words for the talking voice.
export function spokenMinor(v, lang = settings.lang, code = curCode()) {
  if (code === 'VND') {
    if (lang === 'vi') return v.toLocaleString('vi-VN').replace(/,/g, '.') + ' đồng';
    return v.toLocaleString('en-US') + ' dong';
  }
  const d = Math.floor(v / 100), c = v % 100;
  if (lang === 'vi') return [d ? d + ' đô' : '', c ? c + ' xu' : ''].filter(Boolean).join(' ');
  return [d ? d + (d === 1 ? ' dollar' : ' dollars') : '', c ? c + ' cents' : ''].filter(Boolean).join(' and ');
}
export const spoken = xu => spokenMinor(toMinor(xu));

// Draw a coin or note as an HTML element (used by the market game and the shop).
export function moneyEl(d) {
  const e = document.createElement('div');
  e.className = 'money ' + d.kind;
  e.style.setProperty('--mc', d.color);
  if (d.kind === 'coin') e.style.setProperty('--ms', d.size);
  e.innerHTML = '<span>' + d.label + '</span>';
  return e;
}
