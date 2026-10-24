// Family code (Analytics & Infra, docs/cores/tasks/save-copy-family-code.md Part 2; privacy wording approved in
// docs/cores/tasks/family-code-privacy-wording-v1.01.md). Links a family's phones, tablets and computers for Studio's
// anonymous device-count statistics only—never shares saved progress or photos. Studio receives only a one-way
// 16-hex-character digest (fh), never the raw family code.

const FAM_COLOUR: [string, string][] = [['Red', 'Đỏ'], ['Blue', 'Xanh'], ['Green', 'Lục'], ['Gold', 'Vàng'], ['Pink', 'Hồng'], ['Purple', 'Tím'], ['Orange', 'Cam'], ['Silver', 'Bạc']];
const FAM_ANIMAL: [string, string][] = [['Koala', 'Gấu túi'], ['Panda', 'Gấu trúc'], ['Turtle', 'Rùa'], ['Fox', 'Cáo'], ['Owl', 'Cú'], ['Dolphin', 'Cá heo'], ['Rabbit', 'Thỏ'], ['Tiger', 'Hổ'], ['Duck', 'Vịt'], ['Kangaroo', 'Chuột túi'], ['Buffalo', 'Trâu'], ['Lotus', 'Sen']];

export const FAMILY_CODE_PRIVACY = {
  en: 'The family code and your children’s photos stay on this device or the devices you share with.',
  vi: 'Mã gia đình và ảnh của các con chỉ được lưu trên máy này hoặc máy do bạn chia sẻ.'
};

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Strip spaces and hyphens, uppercase, and format as XXXX-XXXX (8 to 16 unambiguous characters). Returns '' if invalid. */
export function normalizeFamilyCode(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const clean = raw.toUpperCase().replace(/[\s-]+/g, '');
  if (clean.length < 8 || clean.length > 16 || !/^[A-Z0-9]+$/.test(clean)) return '';
  const groups: string[] = [];
  for (let i = 0; i < clean.length; i += 4) groups.push(clean.slice(i, i + 4));
  return groups.join('-');
}

/** Generate a fresh 8-character family code formatted as XXXX-XXXX. */
export function makeFamilyCode(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let raw = '';
  for (let i = 0; i < 8; i++) raw += ALPHABET[bytes[i] % ALPHABET.length];
  return raw.slice(0, 4) + '-' + raw.slice(4, 8);
}

// Pure-JS SHA-256 so familyHash() is synchronous everywhere (browser, service worker, Node unit tests).
const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

function sha256Hex16(ascii: string): string {
  const len = ascii.length;
  const bitLen = len * 8;
  const totalBytes = ((len + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(totalBytes);
  for (let i = 0; i < len; i++) buf[i] = ascii.charCodeAt(i) & 0xff;
  buf[len] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(totalBytes - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let off = 0; off < totalBytes; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  return (h0 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

/** One-way 16-hex-character digest sent to Studio for anonymous family device-count statistics. */
export function familyHash(code: unknown): string {
  const norm = normalizeFamilyCode(code);
  if (!norm) return '';
  return sha256Hex16('sv-family-v1:' + norm);
}

/** Friendly two-word family name from either a raw family code or its 16-hex-character digest. */
export function familyName(codeOrHash: unknown, lang = 'en'): string {
  if (typeof codeOrHash !== 'string' || !codeOrHash) return '';
  const digest = /^[0-9a-f]{16}$/.test(codeOrHash) ? codeOrHash : familyHash(codeOrHash);
  if (!digest) return '';
  let h = 0;
  for (const ch of 'fam-' + digest) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = FAM_ANIMAL[h % FAM_ANIMAL.length], c = FAM_COLOUR[(h >>> 4) % FAM_COLOUR.length], n = (h >>> 8) % 90 + 10;
  return lang === 'vi' ? `${a[1]} ${c[1]} ${n}` : `${c[0]} ${a[0]} ${n}`;
}

// Self-contained ISO/IEC 18004 Version 1-L QR Code SVG (21x21 modules, Byte mode, mask 0) so the first device can show
// a scannable QR code offline with zero external libraries.
function qrVersion1Matrix(text: string): boolean[][] {
  const data = new Uint8Array(19);
  const bytes: number[] = [];
  for (let i = 0; i < text.length && i < 17; i++) bytes.push(text.charCodeAt(i) & 0xff);
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, 8);
  for (const b of bytes) pushBits(b, 8);
  pushBits(0, Math.min(4, 152 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  for (let i = 0; i < bits.length / 8; i++) {
    let v = 0;
    for (let b = 0; b < 8; b++) v = (v << 1) | bits[i * 8 + b];
    data[i] = v;
  }
  const pads = [0xec, 0x11];
  for (let i = bits.length / 8, p = 0; i < 19; i++, p ^= 1) data[i] = pads[p];

  // Reed-Solomon 7 EC codewords over GF(256) (0x11d)
  const exp = new Uint8Array(512), log = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x; log[x] = i;
    x <<= 1; if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
  const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : exp[log[a] + log[b]]);
  let gen = [1];
  for (let i = 0; i < 7; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= mul(gen[j], exp[i]);
    }
    gen = next;
  }
  const rem = new Uint8Array(7);
  for (let i = 0; i < 19; i++) {
    const factor = data[i] ^ rem[0];
    for (let j = 0; j < 6; j++) rem[j] = rem[j + 1] ^ mul(gen[j + 1], factor);
    rem[6] = mul(gen[7], factor);
  }

  const allBits: number[] = [];
  for (let i = 0; i < 19; i++) pushBits.call(null, data[i], 8);
  const allCodewords = new Uint8Array(26);
  allCodewords.set(data, 0);
  allCodewords.set(rem, 19);
  for (let i = 0; i < 26; i++) {
    for (let b = 7; b >= 0; b--) allBits.push((allCodewords[i] >>> b) & 1);
  }

  const N = 21;
  const mod: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));
  const reserved: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  const placeFinder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r, cc = c0 + c;
        if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
        reserved[rr][cc] = true;
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6);
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        mod[rr][cc] = inOuter || inInner;
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, N - 7);
  placeFinder(N - 7, 0);

  for (let i = 8; i < N - 8; i++) {
    reserved[6][i] = reserved[i][6] = true;
    mod[6][i] = mod[i][6] = i % 2 === 0;
  }
  reserved[N - 8][8] = true;
  mod[N - 8][8] = true;

  // Reserve format info areas
  for (let i = 0; i < 9; i++) {
    if (i !== 6) { reserved[8][i] = true; reserved[i][8] = true; }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][N - 1 - i] = true;
    reserved[N - 1 - i][8] = true;
  }

  // Place data bits with mask 0 ((r + c) % 2 === 0)
  let bitIdx = 0;
  let up = true;
  for (let right = N - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < N; v++) {
      const r = up ? N - 1 - v : v;
      for (let d = 0; d < 2; d++) {
        const c = right - d;
        if (reserved[r][c]) continue;
        const bit = bitIdx < allBits.length ? allBits[bitIdx++] === 1 : false;
        const mask = (r + c) % 2 === 0;
        mod[r][c] = bit !== mask;
      }
    }
    up = !up;
  }

  // Format bits for EC level L (01) and mask 0 (000): 0x77c4 (111011111000100)
  const fmt = 0x77c4;
  const fbit = (i: number) => ((fmt >>> i) & 1) === 1;
  const fCoords1: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) mod[fCoords1[i][0]][fCoords1[i][1]] = fbit(14 - i);
  for (let i = 0; i < 7; i++) mod[N - 1 - i][8] = fbit(14 - i);
  for (let i = 7; i < 15; i++) mod[8][N - 15 + i] = fbit(14 - i);

  return mod;
}

/** Render an offline SVG QR code for a normalized family code. */
export function familyQrSvg(code: unknown): string {
  const norm = normalizeFamilyCode(code);
  if (!norm) return '';
  const mat = qrVersion1Matrix(norm);
  const N = mat.length, quiet = 4, total = N + quiet * 2;
  let path = '';
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (mat[r][c]) path += `M${c + quiet},${r + quiet}h1v1h-1z`;
    }
  }
  return `<svg class="fam-qr" role="img" data-code="${norm}" aria-label="Family code QR ${norm}" viewBox="0 0 ${total} ${total}" width="136" height="136" shape-rendering="crispEdges"><rect width="${total}" height="${total}" rx="2" fill="#fff"/><path d="${path}" fill="#2b2118"/></svg>`;
}
