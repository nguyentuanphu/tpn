import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../../js/', import.meta.url);
function read(file, lang) {
  const source = fs.readFileSync(new URL(file, root), 'utf8').replace(/^import .*;$/gm, '').replace(/export const /g, 'const ');
  return vm.runInNewContext(source + '\nMORE_TALES', { T: (...pair) => pair[lang], customTales: () => [{ id: 'family-example', flag: 'custom', en: 'Family story', vi: 'Truyện gia đình', pages: [['picture', 'English', 'Tiếng Việt']] }] });
}
test('lazy tale catalogue preserves identity, titles, page pictures and custom family stories', () => {
  for (const lang of [0, 1]) {
    const plain = list => JSON.parse(JSON.stringify(list.map(t => ({ id: t.id, flag: t.flag, title: t.title(), pictures: t.pages.map(p => p[0]) }))));
    assert.deepEqual(plain(read('talesdata.js', lang)), plain(read('tales-content.js', lang)));
  }
});
