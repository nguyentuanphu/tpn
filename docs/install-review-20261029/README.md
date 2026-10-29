# Persistent installation guidance and observed installation analytics

29 October 2026 AEDT. Preparation only; no new version or deployment approval.

The existing Welcome chip and Grown-ups install entry are retained. Opening the guide now keeps it visible until installation is confirmed or the user explicitly chooses Hide. Backdrop taps do not dismiss it. Hide is remembered on this device and removes the Welcome reminder; the Grown-ups entry remains available. No guide is forced open over play.

On supporting browsers the native install prompt is used. Accepting that prompt is not installation confirmation. Confirmation comes from `appinstalled` or an actual standalone/minimal-UI app launch; iPhone/iPad cannot report the exact Add to Home Screen action, so confirmation follows an app-window launch. Ordinary browser fullscreen is not treated as installation. The old `sv-installed` flag is deliberately not trusted because older code set it on prompt acceptance.

The existing Analytics hello/outbox carries only a bounded installation-evidence value on the existing pseudonymous device record. No extra identifiers, names, photos, browser fingerprint or endpoint are introduced. The Analytics-off gate remains in front of outbox writes/sends. Current/last reported app-window context is separate from historical installation confirmation; a later browser hello cannot erase an earlier observation. The server's first-observed date is not an installation date. Old records with app-window evidence have no invented confirmation date.

Studio shows observed-confirmation, last-app-context and unconfirmed counts, plus the status per existing device. Unconfirmed does not mean not installed. A later uninstall is unknowable. Safari and the iOS Home Screen app may have separate storage and appear as separate device records; they are not silently linked or claimed as distinct people.

## Verification

- `node --test tests/install-state.mts tests/unit/hello-clean.test.mjs`: **8/8 passed**, including bounded payloads, legacy actual app launches, later browser hellos, stale-session monotonic history, unknown records and report counts.
- Browser fixture `installFlowCheck(browser)` in `tests/install-browser.mts`: ready for Release. Tests explicit Hide and reload, Settings access after Hide, backdrop persistence, old acceptance flag, accepted native prompt versus appinstalled, zero Analytics-off requests, opt-in native/standalone hello, and six EN/VI guide layouts.
- Browser fixture `installStudioCheck(browser)`: synthetic fake-server device statuses/counts and six EN/VI Studio screenshots.
- Browser execution, full type checks, screenshot inspection and full regression are owned by Release and remain pending at handoff. No physical iOS installation confirmation is claimed.

All implementation and assertions are TypeScript. `tests/unit/install-state.test.mjs` is only the existing discovery pattern's import entry. New generated `js/content/install-state.js` must be included by Release in service-worker/preload regeneration. No new spoken lines or recording requests.

## Release checkpoint execution status

Studio browser check passed with six synthetic EN/VI captures; types passed (214 explicit +57 server/tool files). The first install-flow browser execution failed on unexpected navigation before computer captures. The revised fixture uses the production paused Quick/Grown-ups path and adds navigation/lifecycle diagnostics. The guide now pauses covered gameplay and restores prior pause state. Revised flow remains unverified; do not claim a browser pass. See the release preparation STATUS.md for takeover steps.
