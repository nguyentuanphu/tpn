// Cartoon actors and painted scenes for the tale theatre (js/tales.js): people drawn like a picture book
// (head, hair, face, clothes, arms and legs) who walk in, breathe, blink, and move their mouths while the
// page is read; and layered scenes (sky, hills, trees, water…) where clouds drift, trees sway, waves roll.
// The movement is CSS (css/style.css, .ct-* and .sc-*), so it is smooth and costs almost nothing.
const O = '#3b2a4f', W = `stroke="${O}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const SKIN = { light: '#ffe0c4', mid: '#f2b98a', tan: '#d9965f' };

// a person: { skin, hair, hairStyle, top, bottom, dress, hat, beard, small, wings, staff, crown, robe }
function person(p) {
  const s = p.skin || SKIN.mid, h = p.hair || '#2a1d18', top = p.top || '#3b6fe0', bot = p.bottom || '#3a4a6a';
  const legs = p.dress ? '' : bot;
  const shoe = p.shoe || '#5a3a2a';
  const leg = (x, cls) => `<g class="${cls}" style="transform-origin:${x}px 100px"><rect x="${x - 6}" y="98" width="12" height="40" rx="6" fill="${p.dress ? s : legs}" ${W}/><path d="M${x - 8} 138h18c3 0 4 6 0 6h-18z" fill="${shoe}" ${W}/></g>`;
  const arm = (x, dir, cls) => `<g class="${cls}" style="transform-origin:${x}px 70px"><rect x="${x - 5.5}" y="66" width="11" height="34" rx="5.5" fill="${p.robe || top}" ${W}/><circle cx="${x}" cy="103" r="6" fill="${s}" ${W}/>${p.staff && dir > 0 ? `<path d="M${x + 2} 70v74" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/><circle cx="${x + 2}" cy="68" r="6" fill="#ffd23f" ${W}/>` : ''}</g>`;
  const body = p.dress
    ? `<path d="M36 64h28l14 52H22z" fill="${top}" ${W}/><path d="M28 104h44" stroke="#fff" stroke-width="3" opacity=".6"/>`
    : p.robe ? `<path d="M34 62h32l10 56H24z" fill="${p.robe}" ${W}/><path d="M50 64v52" stroke="#ffd23f" stroke-width="4"/>`
    : `<rect x="33" y="62" width="34" height="42" rx="10" fill="${top}" ${W}/>`;
  const hair = {
    short: `<path d="M27 40c0-17 11-25 23-25s23 8 23 25c-6-8-13-11-23-11s-17 3-23 11z" fill="${h}" ${W}/>`,
    long: `<path d="M25 44c-2-20 10-30 25-30s27 10 25 30l2 26c-6 2-10-2-10-8V40c-6-6-11-8-17-8s-11 2-17 8v22c0 6-4 10-10 8z" fill="${h}" ${W}/>`,
    buns: `<circle cx="28" cy="20" r="8" fill="${h}" ${W}/><circle cx="72" cy="20" r="8" fill="${h}" ${W}/><path d="M27 40c0-17 11-25 23-25s23 8 23 25c-6-8-13-11-23-11s-17 3-23 11z" fill="${h}" ${W}/>`,
    bun: `<circle cx="50" cy="12" r="9" fill="${h}" ${W}/><path d="M27 40c0-17 11-25 23-25s23 8 23 25c-6-8-13-11-23-11s-17 3-23 11z" fill="${h}" ${W}/>`,
    bald: `<path d="M28 34c4-12 12-16 22-16s18 4 22 16" fill="none" stroke="${h}" stroke-width="5" stroke-linecap="round"/>`,
    tuft: `<path d="M44 16c2-6 8-6 10 0" fill="${h}" ${W}/>`
  }[p.hairStyle || 'short'];
  const hat = p.crown ? `<path d="M32 22l6-14 6 9 6-11 6 11 6-9 6 14z" fill="#ffd23f" ${W}/><circle cx="50" cy="12" r="2.5" fill="#e8433a"/>`
    : p.hat === 'nonla' ? `<path d="M14 30L50 4l36 26z" fill="#e8d8a0" ${W}/><path d="M30 22h40" stroke="#c9a05a" stroke-width="2"/>`
    : p.hat === 'wizard' ? `<path d="M26 28L52 -6 74 28z" fill="#7a4aa0" ${W}/><circle cx="50" cy="10" r="3" fill="#ffd23f"/>` : '';
  const beard = p.beard ? `<path d="M34 50c2 18 10 26 16 26s14-8 16-26c-4 6-10 8-16 8s-12-2-16-8z" fill="${p.beard}" ${W}/>` : '';
  const wings = p.wings ? `<g class="ct-wings" style="transform-origin:50px 72px"><ellipse cx="24" cy="66" rx="18" ry="26" fill="#d8f4ff" fill-opacity=".85" ${W} transform="rotate(-25 24 66)"/><ellipse cx="76" cy="66" rx="18" ry="26" fill="#d8f4ff" fill-opacity=".85" ${W} transform="rotate(25 76 66)"/></g>` : '';
  // a picture-book face: eyes with a coloured iris and a shine, eyebrows, a little nose, rosy cheeks, and soft shading
  const iris = p.eyes || '#5a3a24';
  const face = `<g class="ct-eyes" style="transform-origin:50px 40px"><ellipse cx="41" cy="40" rx="5" ry="6" fill="#fff" ${W.replace('3"', '1.6"')}/><ellipse cx="59" cy="40" rx="5" ry="6" fill="#fff" ${W.replace('3"', '1.6"')}/><circle class="ct-pupil" cx="41.6" cy="41" r="3.4" fill="${iris}"/><circle class="ct-pupil" cx="59.6" cy="41" r="3.4" fill="${iris}"/><circle cx="41.8" cy="41.2" r="1.7" fill="${O}"/><circle cx="59.8" cy="41.2" r="1.7" fill="${O}"/><circle cx="40.4" cy="39.2" r="1.2" fill="#fff"/><circle cx="58.4" cy="39.2" r="1.2" fill="#fff"/></g>
    <path d="M36 32q5-3 9 0M55 32q5-3 9 0" stroke="${p.hairStyle === 'bald' || /e8|f2|ff/.test(h) ? '#9a8a80' : h}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M49 45q1.6 2.4 3.4 0" stroke="${O}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
    <circle cx="35" cy="50" r="4.4" fill="#ff8aa8" opacity=".5"/><circle cx="65" cy="50" r="4.4" fill="#ff8aa8" opacity=".5"/>
    <path class="ct-mouth-shut" d="M44 52q6 5 12 0" fill="none" ${W}/><ellipse class="ct-mouth-open" cx="50" cy="54" rx="5" ry="4" fill="#a8304a" ${W.replace('3"', '2"')}/>
    <path d="M62 22a22 22 0 0 1 0 36 26 26 0 0 0 0-36z" fill="#3b2a4f" opacity=".07"/>`;
  const ears = `<circle cx="28" cy="43" r="5" fill="${s}" ${W}/><circle cx="72" cy="43" r="5" fill="${s}" ${W}/>`;
  const neck = `<rect x="45" y="56" width="10" height="9" fill="${s}" ${W}/>`;
  const shade = p.dress || p.robe ? '' : `<rect x="57" y="64" width="9" height="39" rx="5" fill="#3b2a4f" opacity=".1"/>`;
  const sc = p.small ? .72 : 1;
  return `<svg class="ct" viewBox="0 -10 100 160" aria-hidden="true"><ellipse class="ct-shadow" cx="50" cy="145" rx="28" ry="6" fill="rgba(0,0,0,.18)"/>
    <g class="ct-all" style="transform-origin:50px 145px;transform:scale(${sc})">${wings}
      ${leg(42, 'ct-legL')}${leg(58, 'ct-legR')}
      <g class="ct-body" style="transform-origin:50px 100px">${arm(30, -1, 'ct-armL')}${neck}${body}${shade}${arm(70, 1, 'ct-armR')}
        <g class="ct-head" style="transform-origin:50px 60px">${p.hairStyle === 'long' ? hair : ''}${ears}<circle cx="50" cy="40" r="22" fill="${s}" ${W}/>${p.hairStyle === 'long' ? '' : hair}${face}${beard}${hat}</g>
      </g></g></svg>`;
}

// which picture in a tale is which person
export const CAST = {
  '👦': () => person({ hairStyle: 'short', top: '#ff9f43', bottom: '#3a5a8a' }),
  '🧒': () => person({ hairStyle: 'short', top: '#5fd36a', bottom: '#3a5a8a', small: true }),
  '👧': () => person({ hairStyle: 'buns', top: '#ff7eb8', dress: true }),
  '👩': () => person({ hairStyle: 'long', top: '#e8433a', dress: true, skin: SKIN.light }),
  '👨': () => person({ hairStyle: 'short', top: '#3b6fe0', bottom: '#5a4a3a', hat: 'nonla' }),
  '🧑': () => person({ hairStyle: 'short', top: '#9a6ac0', bottom: '#3a4a6a' }),
  '👵': () => person({ hairStyle: 'bun', hair: '#e8e8e8', top: '#7a4aa0', dress: true }),
  '👴': () => person({ hairStyle: 'bald', hair: '#e8e8e8', top: '#c9a05a', bottom: '#5a4a3a', beard: '#f2f2f2' }),
  '👶': () => person({ hairStyle: 'tuft', top: '#ffd23f', bottom: '#ffd23f', small: true }),
  '👸': () => person({ hairStyle: 'long', top: '#ff7eb8', dress: true, crown: true, skin: SKIN.light }),
  '🤴': () => person({ hairStyle: 'short', top: '#3b6fe0', bottom: '#ffd23f', crown: true }),
  '👑': () => person({ hairStyle: 'short', robe: '#c0392b', crown: true, beard: '#4a3428' }),
  '🧙': () => person({ hairStyle: 'bald', hair: '#f2f2f2', robe: '#7a4aa0', beard: '#ffffff', hat: 'wizard', staff: true }),
  '🧚': () => person({ hairStyle: 'buns', hair: '#ffd23f', top: '#c8b6ff', dress: true, wings: true, small: true, skin: SKIN.light })
};

// ---------- painted scenes: SVG layers (far to near), each with its own movement ----------
const tree = (x, y, s, c = '#3f9a5a') => `<g class="sc-sway" style="transform-origin:${x}px ${y}px"><rect x="${x - 6 * s}" y="${y - 50 * s}" width="${12 * s}" height="${50 * s}" fill="#8a5a2b"/><circle cx="${x}" cy="${y - 70 * s}" r="${34 * s}" fill="${c}"/><circle cx="${x - 22 * s}" cy="${y - 52 * s}" r="${22 * s}" fill="${c}"/><circle cx="${x + 22 * s}" cy="${y - 54 * s}" r="${24 * s}" fill="${c}"/><circle cx="${x - 10 * s}" cy="${y - 84 * s}" r="${10 * s}" fill="#fff" opacity=".12"/></g>`;
const cloud = (x, y, s, cls = 'sc-cloud') => `<g class="${cls}"><g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="60" ry="22" fill="#fff"/><circle cx="-24" cy="-12" r="22" fill="#fff"/><circle cx="12" cy="-20" r="28" fill="#fff"/><circle cx="40" cy="-6" r="18" fill="#fff"/></g></g>`;
const sun = (x, y, r = 40) => `<g class="sc-rays" style="transform-origin:${x}px ${y}px">${Array.from({ length: 12 }, (_, i) => `<path d="M${x} ${y - r - 8}l6 -16h-12z" fill="#ffe27a" transform="rotate(${i * 30} ${x} ${y})"/>`).join('')}</g><circle cx="${x}" cy="${y}" r="${r}" fill="#ffd23f"/><circle cx="${x}" cy="${y}" r="${r * .8}" fill="#ffe680"/>`;
const hills = (y, c1, c2) => `<path d="M0 ${y}q120 -70 260 -10t280 -20 260 10V450H0z" fill="${c1}"/><path d="M0 ${y + 50}q160 -60 330 -6t300 -16 170 6V450H0z" fill="${c2}"/>`;
const sky = (a, b) => `<defs><linearGradient id="g${a.slice(1)}${b.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="450" fill="url(#g${a.slice(1)}${b.slice(1)})"/>`;
const flowers = y => Array.from({ length: 14 }, (_, i) => `<g class="sc-sway" style="transform-origin:${30 + i * 57}px ${y + 14}px"><path d="M${30 + i * 57} ${y + 14}v-12" stroke="#4f9a4a" stroke-width="3"/><circle cx="${30 + i * 57}" cy="${y}" r="6" fill="${['#ff7eb8', '#ffd23f', '#fff', '#c8b6ff'][i % 4]}"/></g>`).join('');
export const SCENES = {
  meadow: () => sky('#8fd8ff', '#e8f8ff') + sun(680, 80) + cloud(160, 90, 1) + cloud(480, 60, .8, 'sc-cloud slow') + hills(300, '#9bdc7a', '#7fcf6a') + tree(90, 360, 1) + tree(720, 350, .8, '#4fae5a') + flowers(420),
  sky: () => sky('#5fc0ff', '#e2f6ff') + sun(660, 90) + cloud(120, 120, 1.2) + cloud(420, 200, 1, 'sc-cloud slow') + cloud(700, 300, .9) + `<path d="M0 450l160-170 120 110 140-200 180 210 120-90 80 140z" fill="#a8c4d8"/><path d="M280 240l40 40-60 0zM420 190l40 50h-80z" fill="#fff"/>` + cloud(260, 380, 1.4, 'sc-cloud slow'),
  forest: () => sky('#a8e6c0', '#e8f8d8') + sun(680, 70, 32) + hills(280, '#6fbf6a', '#4f9f5a') + tree(60, 380, 1.3, '#2f8a4a') + tree(200, 340, .9) + tree(600, 350, 1) + tree(740, 390, 1.4, '#2f8a4a') + `<g class="sc-twinkle"><circle cx="300" cy="200" r="4" fill="#fff6b0"/><circle cx="520" cy="160" r="3" fill="#fff6b0"/><circle cx="420" cy="240" r="3" fill="#fff6b0"/></g>` + `<rect y="410" width="800" height="40" fill="#5f9f4a"/>`,
  sea: () => sky('#7fd0ff', '#c8efff') + sun(650, 90) + cloud(200, 80, .9) + `<path d="M0 250h800v200H0z" fill="#3cb0e8"/>` + [0, 1, 2].map(i => `<g class="sc-wave${i ? i + 1 : ''}"><path d="M-40 ${270 + i * 55}q40-14 80 0t80 0 80 0 80 0 80 0 80 0 80 0 80 0 80 0 80 0 80 0V450H-40z" fill="${['#5fc0f0', '#2f9ad0', '#1f86c0'][i]}"/></g>`).join('') + `<g class="sc-bob"><path d="M560 262l40 0-6 12h-28z" fill="#c0503a" stroke="${O}" stroke-width="2"/><path d="M580 262v-36l18 30z" fill="#fff" stroke="${O}" stroke-width="2"/></g>`,
  night: () => sky('#141238', '#3a3a7a') + `<g class="sc-twinkle">${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 137) % 800}" cy="${(i * 71) % 220}" r="${1 + (i % 3)}" fill="#fff"/>`).join('')}</g><g class="sc-twinkle2">${Array.from({ length: 20 }, (_, i) => `<circle cx="${(i * 211 + 40) % 800}" cy="${(i * 53 + 20) % 240}" r="1.6" fill="#fff6b0"/>`).join('')}</g>` + `<circle cx="640" cy="100" r="60" fill="#fffbe8" opacity=".2" class="sc-glow"/><circle cx="640" cy="100" r="42" fill="#fffbe8"/><circle cx="625" cy="92" r="8" fill="#e8dfb0"/><circle cx="655" cy="114" r="6" fill="#e8dfb0"/>` + hills(300, '#2d3a5a', '#232c48') + `<g class="sc-flick"><circle cx="160" cy="330" r="5" fill="#ffd96b"/><circle cx="420" cy="350" r="4" fill="#ffd96b"/><circle cx="600" cy="320" r="4" fill="#ffd96b"/></g>`,
  palace: () => sky('#ffd8a8', '#fff1d8') + sun(120, 80, 34) + cloud(560, 70, .8) + `<rect x="230" y="200" width="340" height="180" fill="#f6d58a" stroke="${O}" stroke-width="3"/><path d="M200 200l200-90 200 90z" fill="#c0392b" stroke="${O}" stroke-width="3"/><path d="M250 150l150-60 150 60" fill="none" stroke="#ffd23f" stroke-width="6"/><rect x="370" y="290" width="60" height="90" rx="30" fill="#8a3a2a" stroke="${O}" stroke-width="3"/>` + [270, 500].map(x => `<rect x="${x}" y="240" width="30" height="36" fill="#9fd3e8" stroke="${O}" stroke-width="2"/>`).join('') + [210, 590].map(x => `<rect x="${x - 4}" y="150" width="8" height="230" fill="#8a3a2a"/><g class="sc-flag" style="transform-origin:${x + 4}px 160px"><path d="M${x + 4} 150h40l-8 12 8 12h-40z" fill="#e8433a" stroke="${O}" stroke-width="2"/></g>`).join('') + `<rect y="380" width="800" height="70" fill="#e8c890"/>` + tree(80, 400, .9) + tree(720, 400, .9),
  field: () => sky('#bfe9ff', '#effad8') + sun(660, 80) + cloud(220, 90, 1) + hills(250, '#a8dc8a', '#8fd06a') + `<g>${Array.from({ length: 9 }, (_, r) => Array.from({ length: 22 }, (_, c) => `<g class="sc-sway" style="transform-origin:${c * 38 + (r % 2) * 19}px ${330 + r * 14}px"><path d="M${c * 38 + (r % 2) * 19} ${330 + r * 14}v-${12 + r}" stroke="${r % 2 ? '#7cc85a' : '#9ade6a'}" stroke-width="4" stroke-linecap="round"/></g>`).join('')).join('')}</g>` + `<path d="M0 450V420h800v30z" fill="#7aa850"/>`,
  desert: () => sky('#ffcf8a', '#ffefc8') + `<g class="sc-shimmer">${sun(620, 100, 52)}</g>` + `<path d="M0 330q200-80 400 0t400-20V450H0z" fill="#f2b860"/><path d="M0 380q240-60 460 10t340-10V450H0z" fill="#e8a24a"/>` + `<g transform="translate(130 330)"><rect x="-6" y="-60" width="12" height="60" rx="6" fill="#5fa860"/><rect x="-22" y="-44" width="10" height="26" rx="5" fill="#5fa860"/><rect x="12" y="-50" width="10" height="24" rx="5" fill="#5fa860"/></g>`
};
