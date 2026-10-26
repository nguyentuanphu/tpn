export const PARADE_STYLE = `
.gl-parade>.mascot,.gl-parade>.mascot-say{display:none}
.gl-stage.parade-stage{display:block;overflow:auto;padding:10px;overscroll-behavior:contain}
.parade{width:min(100%,1100px);margin:auto;color:#3b2a4f;--parade-cell:clamp(55px,8vh,78px)}
.parade button{font:inherit;font-weight:800;color:#3b2a4f;min-height:64px;min-width:64px;border:3px solid #70548f;border-radius:20px;touch-action:manipulation;cursor:pointer;box-shadow:0 4px 0 #c8b7dc;background:#fff9ef;padding:8px 12px}
.parade button:focus-visible{outline:4px solid #3579c8;outline-offset:3px}
.parade button:disabled{cursor:default;opacity:.68;box-shadow:none}
.parade .parade-primary{background:#ffe094}.parade .parade-friend{background:#d6f2df}
.parade-intro{background:#fff9ef;border:3px solid #c4addf;border-radius:28px;padding:20px;text-align:center;max-width:680px;margin:15px auto}
.parade-intro>.art{width:100px;height:100px}.parade-choices{display:grid;gap:14px}.parade-choices button{display:flex;align-items:center;justify-content:center;gap:14px}.parade-choices .art{width:48px;height:48px}
.parade-team{position:sticky;top:0;z-index:2;background:#fff9ef;border:3px solid #c4addf;border-radius:24px;padding:10px 14px;display:grid;gap:6px;text-align:center;box-shadow:0 5px 0 #d5c7e7}
.parade-team h2{font-size:clamp(19px,4vw,26px);margin:0}.parade-mission{display:flex;justify-content:center;flex-wrap:wrap;gap:5px}.parade-mission .art{width:clamp(30px,6vw,46px);height:clamp(30px,6vw,46px)}
.parade-meter{height:12px;background:#e3d5f3;border-radius:20px;overflow:hidden}.parade-meter>i{display:block;height:100%;background:#409d77;transition:width .25s}
.parade-tools{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin:4px 0}.parade-tools button{font-size:16px}
.parade-boards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px;margin-top:14px;align-items:start}
.parade-player{background:#edf8f4;border:3px solid #8bc9ad;border-radius:26px;padding:10px;min-width:0}.parade-player.npc{background:#f5f0ff;border-color:#baa0dc}
.parade-player h3{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 8px;font-size:clamp(18px,4vw,22px);overflow-wrap:anywhere}.parade-player h3 .art{width:36px;height:36px}
.parade-lanes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.parade-lane{display:grid;gap:9px;text-align:center;min-width:0}
.parade-hint{min-height:36px;display:flex;align-items:center;justify-content:center;gap:3px;font-size:14px}.parade-hint .art{height:32px;width:32px}
.parade-window{height:calc(var(--parade-cell)*3);position:relative;overflow:hidden;border:3px solid #8ab6ca;border-radius:22px;background:linear-gradient(#d8edf8,#fff 34%,#fff 66%,#d8edf8)}
.parade-window::after{content:'';position:absolute;left:0;right:0;top:var(--parade-cell);height:var(--parade-cell);border-top:3px solid #af78d5;border-bottom:3px solid #af78d5;background:#ffd23f16;box-sizing:border-box;pointer-events:none}
.parade button.parade-window{padding:0;box-shadow:none;width:100%;min-width:0;min-height:calc(var(--parade-cell)*3);border-color:#8ab6ca;background:linear-gradient(#d8edf8,#fff 34%,#fff 66%,#d8edf8)}.parade button.parade-window:disabled{opacity:1}
.parade-strip{position:absolute;top:calc(var(--parade-cell)*-1);left:0;right:0;will-change:transform}.parade-cell{height:var(--parade-cell);display:grid;place-items:center}.parade-cell .art{height:calc(var(--parade-cell)*.86);width:calc(var(--parade-cell)*.86)}
.parade-lane.locked .parade-window{border-color:#409d77;background:#f2ffe9}.parade-lane.locked .parade-window::after{background:#5fd39a20;border-color:#409d77}
.parade-stop{width:100%;padding:8px 2px!important;background:#ffe094!important}.parade-change{font-size:14px!important;padding:6px 2px!important;background:#e5f2fc!important}
.parade-result{background:#fff9ef;border:3px solid #c4addf;border-radius:24px;padding:16px;margin:16px 0;text-align:center}.parade-result h3{margin:0 0 8px}.parade-result .art{height:46px;width:46px}.parade-result button{margin-top:10px}
.parade-connection{background:#fff3cc;border:3px solid #d4b44b;border-radius:20px;padding:12px;text-align:center;margin-top:12px}.parade-connection[hidden]{display:none}.parade-connection button{margin:8px 5px 0}
.parade-keyboard{font-size:14px;text-align:center;margin:12px 0}.parade-spark{font-size:16px;min-height:24px}
.parade[data-calm=true] .parade-strip{will-change:auto}.parade[data-calm=true] .parade-meter>i{transition:none}.parade[data-calm=true] .art *{animation:none!important}
@media(max-width:600px){.parade-boards{grid-template-columns:1fr}.parade-team{position:relative}.parade-player{padding:9px}.parade-team h2{font-size:19px}}
@media(prefers-reduced-motion:reduce){.parade .art *{animation:none!important}.parade-meter>i{transition:none}}
`;
