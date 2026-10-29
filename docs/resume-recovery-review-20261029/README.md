# Installed-app return and startup recovery review

Owner reports, 29 October 2026 AEDT: installed apps across devices can return to a white screen after reopening; an iPad Air also showed the generic connection error despite being online. This is a software-path audit and simulated lifecycle/GPU verification, not physical-device confirmation of every reported cause.

## Changes

- Restore one frame chain, reset its clock and resize the drawing buffer on pageshow/visible return. Existing game state remains in place.
- Prevent context loss from starting a four-second background reload timer. A suspended timer could resume before the browser restored the GPU. Save validated progress, attempt actual context restoration while visible and retain a clear Retry control if restoration is unavailable; no reload loop. Device-wide recovery stays outside split-screen holders.
- Reuse the normal validated safe-position writer; saving still runs if the renderer fails before position services are ready. No saves, family data, voices or cache stores are cleared.
- Startup graphics failure no longer destroys the Welcome shell. The TypeScript launcher tolerates missing shell children and distinguishes graphics failure from an explicit offline state. Generic online failures no longer assert that the internet is disconnected. Messages wrap and Retry remains64px.

## Verification

Initial browser fixture passed122s: cancel pending frame callbacks/discard the buffer then resume; actual WEBGL_lose_context loss/restore without reload; profile/device sentinel retained; simulated missing shell and graphics error on phone/tablet, plus a real aborted production-bundle chunk on computer. Both languages and all three device classes captured. Three focused lifecycle units pass. Follow-up browser check passed92s with an explicitly rejected current position: recovery retained the previous saved position. Expanded cleanup-unit teardown was corrected to restore fake globals once; all three lifecycle units pass. Final source/full suite and physical installed-device review remain required.

Apple installation remains user controlled: a site cannot silently install itself to the iPhone/iPad Home Screen. Chrome/Android can open the native prompt; confirmation is the user’s choice. Persistent guide/install evidence tracking is being prepared separately with existing analytics consent.
