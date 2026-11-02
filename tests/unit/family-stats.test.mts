// (v1.07 family-code) Studio's family counts from made-up devices only: netlify/lib/players.mts familyStats
import test from "node:test";
import assert from "node:assert/strict";
import { familyStats } from "../../netlify/lib/players.mts";

const since = "2026-10-03";
const devices = [
  { id: "a1", family: "1111111111111111", first: "2026-09-01" },
  { id: "a2", family: "1111111111111111", first: "2026-10-20" }, // a new or wiped device joined later by code
  { id: "a3", family: "1111111111111111", first: "2026-09-15" }, // older device: not new this month
  { id: "b1", family: "2222222222222222", first: "2026-10-10" }, // a new family: its first device did not come back
  { id: "b2", family: "2222222222222222", first: "2026-10-10" }, // made the same day: not counted as coming back
  { id: "c1", first: "2026-10-25" },                               // no family code
];

test("familyStats counts families, devices per family and devices that came back by code", () => {
  const f = familyStats(devices, since);
  assert.equal(f.count, 2);
  assert.equal(f.linkedDevices, 5);
  assert.equal(f.devicesPerFamily, 2.5);
  assert.equal(f.cameBack, 1);
  assert.deepEqual(f.list[0], { fh: "1111111111111111", devices: 3, ids: ["a1", "a2", "a3"] });
});

test("familyStats never needs or returns a family code or a name", () => {
  const f = familyStats(devices, since);
  assert.ok(!/[A-Z0-9]{4}-[A-Z0-9]{4}/.test(JSON.stringify(f)));
  assert.deepEqual(familyStats([], since), { count: 0, linkedDevices: 0, devicesPerFamily: 0, cameBack: 0, list: [] });
});
