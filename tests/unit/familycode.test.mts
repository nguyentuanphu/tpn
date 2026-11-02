import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { FAMILY_CODE_PRIVACY, makeFamilyCode, normalizeFamilyCode, familyHash, familyName, familyQrSvg } from "../../js/content/familycode.ts";

test("approved bilingual privacy notice matches exact specification", () => {
  assert.equal(
    FAMILY_CODE_PRIVACY.en,
    "Link your family’s devices for statistics only—no progress or photo sharing. Keep your code private."
  );
  assert.equal(
    FAMILY_CODE_PRIVACY.vi,
    "Liên kết thiết bị để thống kê gia đình—không chia sẻ tiến trình hay ảnh. Giữ riêng mã gia đình."
  );
});

test("makeFamilyCode creates an 8-character XXXX-XXXX code", () => {
  const code = makeFamilyCode();
  assert.match(code, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
  assert.equal(normalizeFamilyCode(code), code);
});

test("normalizeFamilyCode strips spaces and hyphens and rejects invalid inputs", () => {
  assert.equal(normalizeFamilyCode("k7m4 p9q2"), "K7M4-P9Q2");
  assert.equal(normalizeFamilyCode("  k7m4-p9q2  "), "K7M4-P9Q2");
  assert.equal(normalizeFamilyCode("short"), "");
  assert.equal(normalizeFamilyCode("bad!code!"), "");
  assert.equal(normalizeFamilyCode(null), "");
});

test("familyHash matches Node SHA-256 first 16 hex chars and never exposes raw code", () => {
  const code = "K7M4-P9Q2";
  const expected = createHash("sha256").update("sv-family-v1:" + code).digest("hex").slice(0, 16);
  const digest = familyHash("k7m4 p9q2");
  assert.equal(digest, expected);
  assert.match(digest, /^[0-9a-f]{16}$/);
  assert.equal(familyHash(""), "");
});

test("familyName produces the same friendly name from raw code or digest", () => {
  const code = "K7M4-P9Q2";
  const digest = familyHash(code);
  assert.equal(familyName(code, "en"), familyName(digest, "en"));
  assert.equal(familyName(code, "vi"), familyName(digest, "vi"));
  assert.ok(familyName(code, "en").length > 3);
});

test("familyQrSvg renders an offline SVG QR code with finder patterns", () => {
  const svg = familyQrSvg("K7M4-P9Q2");
  assert.ok(svg.startsWith('<svg class="fam-qr"'));
  assert.ok(svg.includes('data-code="K7M4-P9Q2"'));
  assert.ok(svg.includes("M4,4h1v1h-1z"));
});

// (v1.07 family-code) An independent Version 1 QR reader, written from ISO/IEC 18004 and not from the encoder, so a
// phone camera's reading is checked here: finder and timing patterns, the format bits (BCH), the Reed-Solomon
// syndromes and the text itself. Made-up codes only.
function svgMatrix(svg) {
  const N = 21, quiet = 4, m = Array.from({ length: N }, () => Array(N).fill(false));
  for (const [, x, y] of svg.matchAll(/M(\d+),(\d+)h1v1h-1z/g)) m[+y - quiet][+x - quiet] = true;
  return m;
}
function readQrV1(m) {
  const N = 21;
  assert.equal(m.length, N);
  // finder patterns: a dark 7x7 ring, a light ring, a dark 3x3 centre, and a light separator around it
  for (const [r0, c0] of [[0, 0], [0, N - 7], [N - 7, 0]]) {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const rr = r0 + r, cc = c0 + c; if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
      const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
      assert.equal(m[rr][cc], ring === 3 || ring <= 1, `finder at ${rr},${cc}`);
    }
  }
  for (let i = 8; i < N - 8; i++) { assert.equal(m[6][i], i % 2 === 0, 'timing row'); assert.equal(m[i][6], i % 2 === 0, 'timing column'); }
  assert.equal(m[N - 8][8], true, 'dark module');
  // format bits, both copies, bit 14 first
  const a = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  const b = [[20, 8], [19, 8], [18, 8], [17, 8], [16, 8], [15, 8], [14, 8], [8, 13], [8, 14], [8, 15], [8, 16], [8, 17], [8, 18], [8, 19], [8, 20]];
  const word = cells => cells.reduce((v, [r, c]) => (v << 1) | (m[r][c] ? 1 : 0), 0);
  const f1 = word(a), f2 = word(b);
  assert.equal(f1, f2, 'both format copies agree');
  let fmt = -1;
  for (let d = 0; d < 32; d++) { let v = d << 10; for (let i = 14; i >= 10; i--) if (v & (1 << i)) v ^= 0x537 << (i - 10); if ((((d << 10) | v) ^ 0x5412) === f1) fmt = d; }
  assert.ok(fmt >= 0, 'format bits are a valid BCH word');
  const ecLevel = fmt >> 3, mask = fmt & 7;
  assert.equal(ecLevel, 1, 'error correction level L');
  const masks = [(r, c) => (r + c) % 2 === 0, r => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0, (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0];
  // function modules (never data): finders with separators and format areas, timing, the dark module
  const fn = (r, c) => (r <= 8 && c <= 8) || (r <= 8 && c >= N - 8) || (r >= N - 8 && c <= 8) || r === 6 || c === 6;
  const bits = [];
  for (let right = N - 1, up = true; right >= 1; right -= 2, up = !up) {
    if (right === 6) right = 5;
    for (let v = 0; v < N; v++) {
      const r = up ? N - 1 - v : v;
      for (const c of [right, right - 1]) if (!fn(r, c)) bits.push(m[r][c] !== masks[mask](r, c) ? 1 : 0);
    }
  }
  assert.equal(bits.length, 26 * 8, '208 data modules');
  const cw = []; for (let i = 0; i < 26; i++) cw.push(bits.slice(i * 8, i * 8 + 8).reduce((v, x) => (v << 1) | x, 0));
  // Reed-Solomon: the 26 codewords as a polynomial must be zero at alpha^0 .. alpha^6
  const exp = [], log = []; for (let i = 0, x = 1; i < 255; i++) { exp[i] = x; log[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  const mul = (x, y) => (x && y ? exp[(log[x] + log[y]) % 255] : 0);
  for (let k = 0; k < 7; k++) { let s = 0; for (const c of cw) s = mul(s, exp[k]) ^ c; assert.equal(s, 0, 'RS syndrome ' + k); }
  // the data: byte mode, an 8-bit length, the bytes
  const data = cw.slice(0, 19).flatMap(c => [7, 6, 5, 4, 3, 2, 1, 0].map(i => (c >> i) & 1));
  const take = n => { let v = 0; for (let i = 0; i < n; i++) v = (v << 1) | data.shift(); return v; };
  assert.equal(take(4), 0b0100, 'byte mode');
  const len = take(8); let text = ''; for (let i = 0; i < len; i++) text += String.fromCharCode(take(8));
  return text;
}

test("familyQrSvg reads back to the same family code with an independent QR reader", () => {
  for (const code of ["K7M4-P9Q2", "2222-2222", "ZZZZ-ZZZZ", makeFamilyCode(), makeFamilyCode(), "ABCD-EFGH-JKMN"]) {
    assert.equal(readQrV1(svgMatrix(familyQrSvg(code))), normalizeFamilyCode(code), code);
  }
  assert.equal(familyQrSvg("bad!"), "");
});

test("an old family code keeps its family: the v1 hash and the name stay the same", () => {
  // pinned from v1.01 (released 24 Oct 2026 AEDT): changing either would split every family that already has a code
  assert.equal(familyHash("K7M4-P9Q2"), createHash("sha256").update("sv-family-v1:K7M4-P9Q2").digest("hex").slice(0, 16));
  assert.equal(familyHash("k7m4p9q2"), familyHash(" K7M4 - P9Q2 "));
  assert.equal(familyHash("K7M4-P9Q2"), "5dadcf8bcf1bb1e2");
  assert.equal(familyName("K7M4-P9Q2", "en"), "Red Buffalo 58");
  assert.equal(familyName("K7M4-P9Q2", "vi"), "Trâu Đỏ 58");
  assert.equal(familyName("5dadcf8bcf1bb1e2", "en"), "Red Buffalo 58");
});
