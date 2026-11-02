// (owner, 23 Oct 2026 AEDT: white screen on the iPhone Home Screen app) every launch picture index.html names exists and
// has the exact size of the screen its media query names, so iOS shows it instead of white
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('every apple-touch-startup-image exists at its screen size', () => {
  const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const links = [...html.matchAll(/<link rel="apple-touch-startup-image" media="\(device-width: (\d+)px\) and \(device-height: (\d+)px\) and \(-webkit-device-pixel-ratio: (\d)\) and \(orientation: (portrait|landscape)\)" href="([^"]+)">/g)];
  assert.ok(links.length >= 30, `only ${links.length} launch pictures`);
  for (const [, w, h, dpr, o, href] of links) {
    const png = fs.readFileSync(new URL('../../' + href, import.meta.url));
    const [pw, ph] = [png.readUInt32BE(16), png.readUInt32BE(20)], [ew, eh] = o === 'portrait' ? [w * dpr, h * dpr] : [h * dpr, w * dpr];
    assert.deepEqual([pw, ph], [ew, eh], href);
  }
});
