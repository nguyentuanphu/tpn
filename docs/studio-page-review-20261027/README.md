# Every Studio page — screenshot review

27 October 2026 AEDT. Open **index.html** for the offline gallery, or **Studio-all-pages-desktop.pdf** for a bookmarked desktop review.

The gallery covers all **41 Studio pages**, the **Family, Game and Setup section menus**, and **sign-in**, each at **1440×1000 desktop**, **820×1180 tablet**, and **390×844 phone**: 135 screen states. First-screen and full-page images are provided; very long pages use an explicitly labelled collapsed overview.

These are real browser captures of the implemented online Studio and routes with synthetic in-memory records/providers. No production sign-in, paid provider, deployment, real invoice or family data is used. Empty/unavailable states are kept visible. Finance fixtures use ExampleOnly/DEMO-ONLY identifiers. The Windows executable and live Netlify SQL connection are not verified by this review.

The default gallery starts with Home, Family and Game, then Analytics and Setup. Use section/search filters, device buttons and Previous/Next. Source app commit: `35bffe6ad5d8ca757ed60a49be670bca08b38f86`.

Capture metadata and any observed browser/layout issues are in **captures.json**. Reproduce with `PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright node docs/studio-page-review-20261027/tools/capture.mjs`, then `python docs/studio-page-review-20261027/tools/build.py`. The capture helper only uses local synthetic services. It is never a production action.
