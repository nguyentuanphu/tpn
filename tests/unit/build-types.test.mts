import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUSTRALIAN_HOUSE_TYPES,
  BUILD_TYPE_CATALOG,
  VIETNAMESE_HOUSE_TYPES,
} from '../../js/content/build-types.ts';

const VIETNAMESE_IDS = [
  'tube', 'tube2', 'village', 'villa', 'vn_courtyard', 'vn_garden', 'vn_hoi_an',
  'vn_hue_ruong', 'vn_mekong_stilt', 'vn_riverside', 'vn_single_storey',
  'vn_shop_house', 'vn_thai_roof', 'vn_townhouse', 'vn_urban_villa',
];

const AUSTRALIAN_IDS = [
  'cottage', 'raised', 'au_bungalow', 'au_brick_veneer', 'au_coastal', 'au_country',
  'au_federation', 'au_mid_century', 'au_modern', 'au_queenslander', 'au_ranch',
  'au_stilt', 'au_terrace', 'au_weatherboard', 'au_workers_cottage',
];

test('house catalogue has 15 stable Vietnamese and Australian IDs', () => {
  assert.deepEqual(Object.keys(VIETNAMESE_HOUSE_TYPES), VIETNAMESE_IDS);
  assert.deepEqual(Object.keys(AUSTRALIAN_HOUSE_TYPES), AUSTRALIAN_IDS);
  assert.equal(Object.keys(BUILD_TYPE_CATALOG).length, 30);
  assert.deepEqual(new Set([...VIETNAMESE_IDS, ...AUSTRALIAN_IDS]).size, 30);
});

test('every house type has bilingual names and its matching culture', () => {
  for (const [id, entry] of Object.entries(VIETNAMESE_HOUSE_TYPES)) {
    assert.equal(entry.culture, 'vietnam', id);
    assert.equal(entry.name.length, 2, id);
    assert.ok(entry.name.every(name => typeof name === 'string' && name.trim()), id);
    assert.ok(entry.model.family, id);
  }
  for (const [id, entry] of Object.entries(AUSTRALIAN_HOUSE_TYPES)) {
    assert.equal(entry.culture, 'australia', id);
    assert.equal(entry.name.length, 2, id);
    assert.ok(entry.name.every(name => typeof name === 'string' && name.trim()), id);
    assert.ok(entry.model.family, id);
  }
});
