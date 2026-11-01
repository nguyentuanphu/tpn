// (Học vui phase 4) where Trường Học Vui stands: a small module, so the map's place list knows it at start while the
// school itself (js/school.ts: the building and Cô Tam) loads after the title screen (start-up download, PERF-001)
import { TOWN } from '../world.js';
import { TOWN_SCHOOL } from './map.js';
export const SCHOOL = { x: TOWN.x + TOWN_SCHOOL.off[0], z: TOWN.z + TOWN_SCHOOL.off[1], w: TOWN_SCHOOL.w, d: TOWN_SCHOOL.d, yard: TOWN_SCHOOL.yard,
  get front() { return this.z - this.d / 2; },
  get teacher() { return { x: this.x - 1.5, z: this.front - .9 }; },
  /** where the child stands to talk to her, on the yard */
  get spot() { return { x: this.x - 1.5, z: this.front - 2.1 }; },
  /** the school's point on the map and its floating name: the yard, east of the door (so the name is not over Cô Tam's) */
  get place() { return { x: this.x + 2, z: this.front - 2.4 }; } };
