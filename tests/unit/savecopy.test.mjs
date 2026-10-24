import test from "node:test";
import assert from "node:assert/strict";
import { createSaveCopy, readSaveCopy, readSaveCopyOrLegacy, COPY_VERSION, MAX_COPY_BYTES } from "../../js/content/savecopy.ts";

const good = {
  app: "sparkle-valley", v: COPY_VERSION, saved: Date.now(), device: "abc123def456",
  settings: { lang: "en", sound: true }, profiles: [
    { id: "k1", name: "Ada", age: "little", look: { style: "dress", color: "#ff5fa2", hat: "bow", back: "wings", hair: "#1d1412", hairStyle: "buns", skin: "#ffe3d1", glider: 0 }, inv: {}, levels: {}, wins: {}, quests: {}, stickers: [], album: [] }
  ], farm: { coins: 30, plots: [null,null,null,null,null,null,null,null,null], seeds: { carrot: 99, strawberry: 2 }, basket: {} }
};

const goodText = JSON.stringify(good);

test("valid copy parses and returns expected structure", () => {
  const parsed = readSaveCopy(goodText);
  assert.equal(parsed.app, "sparkle-valley");
  assert.equal(parsed.v, COPY_VERSION);
  assert.equal(parsed.profiles.length, 1);
  assert.equal(parsed.profiles[0].id, "k1");
  assert.equal(parsed.farm.coins, 30);
});

test("invalid JSON rejected", () => {
  assert.throws(() => readSaveCopy("not json"), /invalid JSON/);
});

test("too-large copy rejected", () => {
  const huge = "x".repeat(MAX_COPY_BYTES + 1);
  assert.throws(() => readSaveCopy(huge), /too large/);
});

test("wrong app rejected", () => {
  const bad = Object.assign({}, good, { app: "other" });
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid copy/);
});

test("wrong version rejected", () => {
  const bad = Object.assign({}, good, { v: COPY_VERSION - 1 });
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid copy/);
});

test("future saved timestamp rejected", () => {
  const bad = Object.assign({}, good, { saved: Date.now() + 2 * 864e5 });
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid copy/);
});

test("invalid device id rejected", () => {
  const bad = Object.assign({}, good, { device: "not-valid!" });
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid copy/);
});

test("missing profiles array rejected", () => {
  const bad = Object.assign({}, good, { profiles: "nope" });
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid copy/);
});

test("profile with bad age rejected", () => {
  const bad = Object.assign({}, good, { profiles: [{ ...good.profiles[0], age: "teen" }] });
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid profile/);
});

test("profile with non-object look rejected", () => {
  const bad = Object.assign({}, good, { profiles: [{ ...good.profiles[0], look: "nope" }] });
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid profile/);
});

test("farm with non-number coins rejected", () => {
  const bad = Object.assign({}, good, { farm: { ...good.farm, coins: "lots" } });
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid farm/);
});

test("profile array length limit enforced", () => {
  const many = Array.from({ length: 7 }, (_, i) => ({ ...good.profiles[0], id: "k" + i }));
  const bad = Object.assign({}, good, { profiles: many });
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid copy/);
});

test("settings must be object", () => {
  const bad = Object.assign({}, good, { settings: "not-obj" });
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid copy/);
});

test("farm must be object", () => {
  const bad = Object.assign({}, good, { farm: "not-obj" });
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid copy/);
});

test("prototype keys are rejected", () => {
  const badText = `{"app":"sparkle-valley","v":${COPY_VERSION},"saved":${Date.now()},"device":"","settings":{"__proto__":{"polluted":true}},"profiles":${JSON.stringify(good.profiles)},"farm":${JSON.stringify(good.farm)}}`;
  assert.throws(() => readSaveCopy(badText), /invalid copy/);
});

test("copy creation upgrades the internal snapshot and removes secrets", () => {
  const copy = createSaveCopy({ ...good, v: 2, settings: { lang: "en", aiKey: "do-not-export", token: "do-not-export" } });
  assert.equal(copy.v, COPY_VERSION);
  assert.deepEqual(copy.settings, { lang: "en" });
});

test("duplicate profile ids are rejected", () => {
  const bad = { ...good, profiles: [good.profiles[0], { ...good.profiles[0] }] };
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid profile/);
});

test("legacy v2 backup file is accepted by readSaveCopyOrLegacy", () => {
  const legacy = {
    app: "sparkle-valley", v: 2, saved: Date.now() - 1000,
    settings: { lang: "vi", sound: false },
    profiles: good.profiles,
    farm: good.farm
  };
  const parsed = readSaveCopyOrLegacy(JSON.stringify(legacy));
  assert.equal(parsed.app, "sparkle-valley");
  assert.equal(parsed.v, COPY_VERSION);
  assert.equal(parsed.device, "");
  assert.equal(parsed.profiles.length, 1);
  assert.equal(parsed.settings.lang, "vi");
});

test("familyCode in settings is normalized and preserved in save copies", () => {
  const copy = createSaveCopy({ ...good, v: 2, settings: { lang: "en", familyCode: "k7m4 p9q2" } });
  assert.equal(copy.settings.familyCode, "K7M4-P9Q2");
  const bad = { ...good, settings: { lang: "en", familyCode: "not-a-code!" } };
  assert.throws(() => readSaveCopy(JSON.stringify(bad)), /invalid family code/);
});
