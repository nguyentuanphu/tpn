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
