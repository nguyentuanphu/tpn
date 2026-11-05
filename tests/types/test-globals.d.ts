// (v1.08b quality, TypeScript everywhere) what the checks see of the game page. The checks run their code inside the
// page (page.evaluate), where the game's globals are: the game itself (__sv, js/main.ts) and the network (__Net), and
// a few things a check leaves on window for itself. They drive the page loosely, as a child's taps would, so the page
// globals are typed loosely here; the game's own code is checked strictly by tests/tsconfig.json.
declare var __sv: any;
declare var __Net: any;
declare var __st: any;
declare var __frame: any;
declare var __gap: any;
declare var __lt: any;
// a check taps and reads what it found with querySelector (an Element): the HTML element's taps and fields
interface Element { click(): void; dataset: DOMStringMap; hidden: boolean; disabled: boolean; open: boolean; value: string; checked: boolean; style: CSSStyleDeclaration; innerText: string; offsetWidth: number; offsetHeight: number; offsetTop: number; offsetLeft: number; focus(): void; blur(): void; }
// a check leaves its own probes on window (window.__starts, window.__stStop ...) and reads them back
interface Window { [probe: string]: any }
