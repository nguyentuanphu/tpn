# Current private website preview

**r89 release integration (23 October 2026 AEDT, Release).** The website is now the real `/home` page, made from this folder's reviewed design by `tools/build-website.mts` (the review switcher, drawn game stage and pretend Settings are taken out; pictures sit in `home/assets/`). In the game it opens floating over the Welcome screen (Website beside About) and over Settings (Website row); the corner Home button is gone and the goal row moved up into its space. Re-synced against release source `da4191e2`: catalogue counts unchanged (17 valley goals, 24 lantern steps, 56 daily adventures, 15 family missions, 24 festivals); the game list now also holds the ten r89 drawing games; no explanation needed changing. `home/` is no longer part of the review lock: `node tools/build-website.mts --check` keeps it equal to the design.

**Parent settings, child play reports and illustrative graphs added (23 October 2026 AEDT).** Private preview publication succeeded at 12:30 pm AEDT. [Complete source-backed guide](parent-controls-guide.md) · [Release integration handoff](RELEASE-HANDOFF.md). For Parents now has nine expandable control guides, a three-step path to each child's Play report, six explanations of its statistics/limits, weekly-note guidance, manual backup and separate Analytics choices. Actual r88 Settings/report UI captures use an isolated empty example profile. The website reads no child saves and creates no private dashboard. At the owner’s follow-up request, an interactive illustrative graph now shows invented seven-day play time (93 minutes/15 recorded rounds) and example favourite games. It is clearly labelled made-up data in EN/VI; the actual zero-history report captures remain alongside it.

Latest placement decision: Website remains on Welcome; during play it belongs in Settings, with the HUD Home control removed and the quest bar safely reclaiming space. **This is represented in the preview; runtime removal/quest geometry are not implemented by this branch.** The handoff names the exact current code and null-handler, safe-area, companion/daily-row and split-screen risks. Release must implement and test those changes before shipping. An integration branch from current main carries these artifacts without copying older game source.

[Open the website normally](https://sparkle-valley-family-preview-20261023.henry-tpnguyen.chatgpt.site) — this HTTPS link renders the design; GitHub's HTML file view shows source code.

## Simpler navigation, full information (23 October 2026 AEDT)

Four top-level sections: **Discover**, **Play & Learn**, **Guides & Rewards**, **For Parents**. The side menu groups detailed destinations under those four headings. Learning activities, Vietnamese folk games and stories have their own page; rewards/festival introduction and parent/family information also have their own pages. The searchable complete Quest Guide and festival directory keep their separate views and deep links. Pictures, expandable details, parent-authored quiz guidance and all substantive EN/VI copy remain available. Static content comparison against `26b4829f`: 1,163 unique bilingual text pairs before, 1,175 after; the only removed/relabelled pairs are navigation labels and the menu's introduction.

[Website/game rules](WEBSITE-RULES.md) now govern navigation, shared UI, art/capture provenance, one-release data, automatic regeneration, review gates and publication. `CLAUDE.md` and the design handbook link those rules. `sync-website.mjs` reads a supplied immutable game commit, refreshes all catalogues, renders the guides, imports that source's icon renderer/theme tokens/fonts, checks game/cache/editor version agreement, and exports hosted assets. A recorded game-source fingerprint detects added/deleted/changed game files. It names unreviewed changes and fails rather than assuming an old gameplay explanation remains correct.

The proposed `website-consistency.yml` builds on main pushes and relevant PRs and keeps the static artifact plus drift report. This workflow is staged on the design branch. **Production `/home/`, the game package, required branch protection and automatic production publication are not integrated yet.** Release must package the verified site and game together and retain the owner's explicit release approval. The private Sites preview is a separate review deployment, not an automatic main mirror.

Current handoff branch: **`work/family-website-20261023`**, created from current main without copying game files from the earlier design branch. Production integration is pending; see [the Release handoff](RELEASE-HANDOFF.md).

Current game source: `781089d6f1c3533a226d4a49271baa61142b940d` (r88). Review Site: `appgprj_6ada78c4d6648191a5bdfd47aea3e24a`; local static checkout `/workspace/sites/sparkle-valley-family-preview-20261023`. Tokens are not saved in the repository.

Checks: navigation, original photo/quest/Family Quiz/printing, rewards and festivals pass in EN/VI on phone, tablet, desktop, small phone and landscape. Phone/tablet/desktop screenshots inspected; the initial black focus outline and heading scroll offset were adjusted. A real temporary Git source change to `js/adventure.ts` correctly fails the consistency gate and names that file; the baseline rebuild passes. Early test adaptations counted two directory image duplicates and attempted to click a photo after navigating away; assertions now retain the original 14-picture scope and navigate to the proper page. One reward run was interrupted after an overlapping check was noticed, then rerun alone successfully. Changed-file suite: **9/9 pass** (`--changed --jobs 1`, five minutes), including 175 unit tests; evidence in `evidence/changed-checks.json`. Private preview v2 published successfully, source commit `2079d68da1cd9299676702c22dba3e271029ba10` (23 October, 8:24 am AEDT). No game runtime or saves changed.

Rebuild against the intended release:

```sh
SV_WEBSITE_SOURCE=origin/main node docs/website-review-20261023/sync-website.mjs
```

For full commands, review-lock requirements and pending release integration, read [WEBSITE-RULES.md](WEBSITE-RULES.md).

---

# Sparkle Valley website: review and proposed design

Reviewed 23 October 2026 AEDT. The initial review used GitHub `main` at [`f1dc57cd`](https://github.com/nguyentuanphu/Sparkle-Valley/commit/f1dc57cd), recording **r88**. The live service worker at [sparklevalley.au/sw.js](https://sparklevalley.au/sw.js) also serves `sv-2026-10-19-r88`. The current website is [sparklevalley.au/home/](https://sparklevalley.au/home/).

[Download/open the interactive concept](prototype.html) · [Desktop first screen](evidence/first-screen-desktop.png) · [Phone first screen](evidence/first-screen-phone.png) · [Phone floating view](evidence/overlay-phone.png) · [New Welcome-screen entry](evidence/welcome-desktop.png)

This is a **design proposal**, rather than a deployed website or an implemented game overlay. The self-contained HTML works after download: try Website, Welcome and In game in its preview bar, switch English/Vietnamese, open Menu, and open/close the website from Welcome or Settings. The background is game artwork; it does not run a game session or read family saves.

## Expanded parent-first version

The owner asked for considerably more information about what the game offers, Vietnamese folk games, learning and the value to parents. The updated concept now contains six learning areas, five detailed folk games, three Vietnamese story examples, six parent benefits, age guidance, practical follow-ups and six parent FAQs. [Read the complete bilingual parent guide](parent-guide.md) or [edit the content](parent-content.mjs).

Each learning area explains **what children do → what they can practise → something to try together afterwards**. The friendly cartoon style stays, while expandable details let parents explore the information without crowding the first screen. The final production site should give the learning directory, folk games, stories and parent guidance their own pages, with a shorter overview on Home. The downloadable concept collects the material in one place for review.

## More pictures, a separate Quest Guide and Family Quiz

The owner requested more imagery, a complete quest guide in its own menu, and Family Questions that parents can write. The updated preview adds **12 bilingual screenshot sets** (24 unchanged project captures): places, learning, folk games, stories, daily adventures and family missions. Pictures open in a keyboard-accessible enlargement dialog, change with EN/VI and return focus when closed. [Image provenance](assets/game-previews/manifest.json). These are saved marketing captures; they are not labelled as new r88 test evidence.

**Quest Guide / Hướng dẫn nhiệm vụ** has a dedicated primary-navigation and drawer entry and a separate view, with its own section menu. It covers all **136 entries** in the reviewed catalogues: 17 valley goals, 24 lantern-story steps including the prologue, 56 daily adventures (including seasonal entries), 15 family missions and 24 festival hunts. It includes numbered actions, age differences, chapter rewards, expandable clues, bilingual search, help and printing. It also includes a Family Quiz setup entry, bringing searchable guide entries to **137**. The guide does not read or change child progress. [Full bilingual guide](quest-guide.md) · [Open the guide directly](prototype.html#quest-guide).

The quest snapshot was checked against `main` at [`781089d6`](https://github.com/nguyentuanphu/Sparkle-Valley/tree/781089d6), fetched explicitly on 23 October AEDT. [Snapshot](quest-snapshot.json) and [reviewed walkthrough explanations](quest-help.mjs) keep coverage auditable. No future chapters or proposed quests are presented as available.

**Family Questions / Family Quiz / Đố Vui Gia Đình** now has its own homepage section, menu link, playable website example and parent setup instructions. The game already supports grown-up-authored questions: EN/VI question text, optional game drawing, two to four answers, correct-answer selection, Save and authorised Publish, then delivery on the next online game opening. It appears only when valid questions are supplied and age/family settings permit it. Source: `js/games/more.ts`, `js/games/catalog.ts`, `js/custom.js`, `studio/ui/app.ts` at the pinned snapshot. The website example has two answers and makes no game saves. No real family questions are entered or collected by this public preview.

**Access limitation:** the existing question editor is a protected content-management page. It requires editing permission; this proposal does not claim every parent already has a self-service editor inside the game. If the owner wants that new in-game flow, it remains runtime work requiring implementation, account/permission review and release checks.

To rebuild: `node docs/website-review-20261023/build-preview.mjs` writes the self-contained preview, parent guide and quest guide. To refresh against a newer release, use `SV_WEBSITE_SOURCE=<release-sha> node docs/website-review-20261023/sync-website.mjs`, review the drift report and follow `WEBSITE-RULES.md`. Serve the repo root on port 8765, then run `node docs/website-review-20261023/check-preview.cjs` for the visual-guide interaction checks. It uses the existing Playwright dependency and runs serially across device sizes.

## Pictured prizes and badges

The owner asked to make prizes prominent because children enjoy seeing what they can earn. The preview now has a hero link, a **Prizes & Badges / Quà thưởng & Huy hiệu** menu entry and a corresponding section in the Quest Guide. Eight illustrated cards pair **Complete this → Earn this → Where to see it**. Expandable picture collections show nine stamp-chest prizes, four Passport wearables, all 24 festival badges, nine example stickers, six Hard reasoning stickers and six example mystery collectibles.

The content distinguishes fixed rewards, one-time unlocks, the stamp chest's next-not-owned order, and variable mystery-box contents. It does not show a fictitious child's collection. Daily-adventure guide entries identify their actual sticker, coins and stamp; family missions and festival hunts have picture reward strips; lantern chapters show the chapter's coins/keepsake, and main quest entries show matching one-time picture-book bonuses. The main-journey crown is tied to all 17 main goals, not to finishing every game or festival.

[Complete bilingual reward guide](rewards-guide.md) includes all 56 adventure-to-sticker mappings, 24 badge requirements, 252 catalogue sticker clues, ten picture-book bonuses and all 25 mystery collectible names. [Pinned reward snapshot](reward-snapshot.json) comes from the same source ref as the quest guide. The walkthrough also mentions construction-yard, job-board, daily gift and mini-game rewards without presenting a universal coin amount for every activity. Existing protected parent question editing remains unchanged.

Validation: [reward checks](evidence/reward-checks.json) passed at 390 px, 820 px, 1440 px, 320 px and phone landscape, including EN/VI, expanded details retained across language changes, specific reward pictures, exact badge-to-quest links, search recovery and no horizontal overflow. The original photo/guide/Family Quiz/printing checks also passed on the update. Phone, tablet and desktop reward screenshots were inspected. The first reward-check attempt asserted search clearing before the browser's hash-change navigation completed; the automation now waits for the destination route and cleared search, and passed on all five layouts. This was a check timing issue; no game check or reward rule was weakened.

The prize pictures reuse the game's SVG artwork. Festival medallion frames are website presentation around the actual festival symbols, not new in-game badges. These are design-document changes only; the website does not grant prizes or alter child saves.

## Festivals to join or watch, with softer cartoon scenery

The owner asked whether festivals, decorations, folk games and participation were all included, then requested more artistic/cartoon treatment of game photos and clarification of festival-exclusive prizes. The preview now has a dedicated **Festivals & celebrations / Lễ hội và ngày kỷ niệm** menu destination and separate directory view, rather than only the hunt/badge list. [Complete bilingual festival guide](festival-guide.md) · [Default calendar and activity snapshot](festival-snapshot.json).

All **24 festival entries** explain locations, decorations, the festival-table activity, any scheduled display, the five-object hunt and rewards. Filters show Vietnam (10), Australia and friends (8) or other celebrations (6). The year selector shows default game dates for 2026/2027 using the game's lunar/Easter/weekday/year-table rules. Dates are explanatory defaults, not a live reading of family settings. Quiet remembrance days have no evening show. Party-day times follow the device clock used by the game: 08:00 greeting/present, 15:00 game, 18:30 show or 17:30 when an under-five is playing. Opening the in-game calendar does not launch a festival or travel.

The directory separates three systems: festival-table games; seasonal five-object hunts with an **event-specific Passport badge and hunt keepsake**; and three-step daily festival adventures with their sticker, 10 coins and stamp. Ordinary coins and some stickers are not festival-exclusive. Halloween trick-or-treat (five different doors/treats for a pumpkin-lantern keepsake) is explained separately from its five-object hunt. Existing featured folk-game explanations remain reachable; festival games include Rồng Rắn Lên Mây for Tết, Kéo Co for Đoan Ngọ and Thả Diều for Trung Thu.

Two new storybook illustrations soften the scenic presentation: a composite valley inspired by the Hội An/Hà Nội/Sydney game captures and a painted Tết village. Cream buildings, rounded trees, flowers and **five-pointed đèn ông sao** retain the game identity. Both are captioned as artistic interpretations; their original game captures remain accessible in expandable comparison sections. Learning/game-interface screenshots remain clear factual views. [Illustration provenance](assets/storybook-manifest.json) · [Saved festival-capture provenance](assets/festivals/manifest.json). The homepage now retains 14 original game captures plus the two new storybook illustrations.

[Festival checks](evidence/festival-checks.json) cover all five device layouts, group counts, year switching, EN/VI, retained expanded cards, original-scene enlargement, festival-to-hunt links, Back, folk-guide navigation and floating-view close/focus/settings preservation. Existing photo/guide/Family Quiz/printing checks were rerun serially. The first illustration regression check caught the missing valley-art insertion in the template; that insertion was fixed, the check now requires both storybook images, and the five-layout regression passed. No live game changes, festival scheduling or deployment is performed by the proposal.

## What the current website needs

The live site was inspected on a 390 × 844 phone, 820 × 1180 tablet and 1440 × 1000 computer, in English and Vietnamese. [Measured results](evidence/live-findings.json) and [screenshots](evidence/live-phone-en.png) are saved with the proposal.

| Finding | Evidence | Recommended improvement |
| --- | --- | --- |
| Phone menu is almost invisible | Its scrolling area measures **4 px wide** in both languages; the links themselves need 606–645 px | Give navigation its own usable space. Use a compact Menu button and a side drawer on phones; retain four short primary links on larger screens |
| Play competes with all navigation | Brand, six links, language and Play share one flex row; the phone Play link is only 28 px high in EN / 34 px in VI | Put Play on a separate line below the hero introduction. Use a clear green game-style button, with generous touch area |
| The homepage does not show the game's visual identity | The inspected homepage has **zero image/SVG elements** and uses generic emoji in text cards | Use the real game SVG artwork, rounded fonts, cream panels, pink/purple branding and a Vietnamese/Australian illustrated hero |
| Every page follows a sparse text-card pattern | The home page has a text-only introduction and three generic cards | Build a useful visitor journey: introduction, real game examples, stories/heritage, family guidance, places, help and privacy |
| Consent banner duplicates on language change | A fresh visit shows one banner; switching language produces **two** on all three tested sizes | Keep one persistent consent component; update its language without appending another, and reserve space for it |
| Current Home icon is an information symbol | `js/hud.js` uses `ICONS.info` with a Home label | Use a recognisable house-and-star icon, labelled **Website / Trang web** to distinguish it from the child's in-game house |
| Website browsing is a separate tab | Current HUD handler calls `window.open('/home', '_blank', ...)` | Add a floating website view inside the game, with a persistent Close / Back to game action |
| Sharing and discovery need a stronger foundation | `/home/index.html` contains a generic title and no page description or social-card metadata | Add appropriate bilingual page titles/descriptions, canonical URLs and real artwork for shared links; preserve readable routes |

The new-tab approach already avoids replacing the game tab. The proposed overlay improves the browsing experience while retaining that protection against an accidental game restart.

## Recommended look

**A polished family game website, recognisably Sparkle Valley.** Use the actual Fredoka and Baloo 2 fonts, dark purple outlines, cream surfaces, restrained pink/purple accents and the game's green Play button. Use more space around fewer useful elements, rather than shrinking text or tap targets.

The hero illustration connects Vietnam on the left—Cầu Rồng, Hồ Gươm/Tháp Rùa and Chùa Một Cột—to Australia on the right—Sydney Opera House and Harbour Bridge. Vietnamese festive decoration uses five-pointed **đèn ông sao**. This new marketing illustration is derived from the approved banner and game references; it is identified as illustration, not an actual gameplay screenshot.

The content sequence:

1. **Discover:** a clear family-facing headline, age/language context, attractive world art, and Play on its own line.
2. **Games & learning:** named examples and the actions children take, using actual game illustrations. Describe practice opportunities rather than guaranteed educational outcomes.
3. **Vietnamese stories & traditions:** Thánh Gióng, Cây khế, Ô Ăn Quan and Thả Diều, with concise explanations and links to more detail.
4. **For parents:** age/difficulty choices, family missions, shared play, rest/bedtime and sound guidance.
5. **Places and family stories:** preserve the current Countries and Memory Villages sections, with factual feature availability and clear private-family boundaries. These remain destinations in the final navigation; the concept focuses on the main landing page.
6. **Help, privacy and updates:** useful instructions and concise policies, with release/internal testing notes kept in the appropriate support area.

The approved [bilingual game banner](../learning-banner-20261021/README.md) appears as an illustrated overview further down the concept page. It supports exploration without making the entire homepage a text-heavy poster.

## Smaller navigation and a separate Play row

Desktop: a compact bar with the brand, **Discover · Games · Quest Guide · For parents**, language switch and Menu for the other destinations. Phone/tablet: brand, Menu and language controls, with a full-height side drawer containing every destination. The current Memory Villages, Countries, Help and Privacy content must remain reachable.

The owner's word “sliceable” is still awaiting clarification. **Slide-out navigation is a design recommendation**, not an assumed instruction to implement it. If sideways-scrolling tabs were intended, they should get a full-width row of their own, with visible overflow hints and enough room to swipe. The Play button should not compete for that row.

Play sits below the hero introduction on a new line. On phones it fills the available width. Compact visual navigation still needs at least 44 px targets; child-facing controls retain 64 px targets.

## A recognisable website icon

The concept proposes a cream house, warm roof and small gold star, drawn with the game's dark-purple outline. Label it **Website / Trang web**; accessible names can use “Sparkle Valley website”.

- **Welcome:** one clearly placed website entry with a generous target, away from the main Start button.
- **In-game Settings:** a matching illustrated Website entry. Its label explains where it goes.
- **Existing HUD button:** keep its current function during integration, then apply the same icon/overlay behavior. Do not silently remove an existing control; agree on placement before changing it.

## Floating website behavior

Desktop/tablet: a centred, stable, rounded panel above a dimmed game. Phone: a full-height sheet with safe-area spacing. The header and Close action remain visible; only the website body scrolls. Opening a drawer must keep that drawer's close action reachable.

The real implementation should:

- Keep the existing game canvas, current session, player state and saves intact. Opening the website must not navigate the game document to `/home/` or start another game instance.
- Lazy-load the public website into an isolated frame/host. The current website stylesheet changes global body layout; injecting it directly into the game would risk changing the game's layout. An isolated same-origin `/home/?embedded=1` frame is the simplest starting point.
- Use the game's established modal/input lifecycle: suspend local movement, camera gestures and autoplay input while browsing, and restore the prior state when closed. Online/server activity may continue; do not promise a global multiplayer pause.
- Change an embedded Play action into **Back to game**, which closes the panel. Standalone `/home/` retains the normal Play destination.
- Support Close, Escape and appropriate mobile Back behavior; restore focus to the opener and preserve the website's own route/language/scroll position separately from game saves.
- Load images as needed, use responsive production assets and avoid autoplay video. Disposing the frame on close while retaining its small website state is worth considering for memory-limited phones.
- Show a recoverable offline/loading state with a working Close action. Website availability must never block returning to the game.
- Preserve current analytics consent and reporting boundaries. If parent/child messages are used, validate message origin and source; do not expose family data to the marketing page.

## Implementation scope for a later approved round

| Area | Likely files on r88 | Work |
| --- | --- | --- |
| Website | `home/index.html`, `home/app.ts`, `home/style.css` | Content structure, responsive navigation, imagery, language, consent fix and embedded mode |
| Welcome/settings entries | `js/ui.ts`, `js/ui-settings.ts`, `js/icons.js` | Matching labelled icon and entry placement using existing shells |
| Existing HUD entry | `js/hud.js` | Replace the new-tab action with the common website opener |
| Floating shell | A small deferred TypeScript module plus existing modal/input wiring | Open/close/focus, isolation, lifecycle and return behavior |
| Release integration | Existing bundle/offline/check mapping | Ensure the new optional website view does not add mandatory game-startup work |

Before release: verify EN/VI, 320 px and normal phone sizes, tablet/computer, portrait/landscape, keyboard, offline, repeated open/close, unchanged saved progress, multiplayer/input behavior and memory. Run the appropriate game checks, GitHub release suite and local speed checks under the existing release process. No game integration or deployment is authorized by this proposal.

## Verification and limits

- Photo/guide update: [five-layout results](evidence/visual-guide-checks.json), covering bilingual search, no-results recovery, picture enlargement, focus return, guide navigation, retained expanded content, Family Quiz sample/setup, print expansion and the floating guide with retained sample Settings. Phone, tablet, desktop, 320 px phone and phone landscape screenshots inspected.
- Live website: browser inspection/screenshots in both languages at the three sizes above; no JavaScript page errors. Menu compression, short Play targets and consent duplication were reproduced.
- Prototype: language switch, drawer, Welcome entry, Settings entry, Escape, Close, focus return and retention of the underlying sample Settings panel checked on phone/tablet/computer. [Interaction results](evidence/prototype-checks.json).
- Parent content: six learning areas, five folk games, three stories, six parent benefits and six FAQs checked on phone/tablet/computer; every bilingual entry has English and Vietnamese text. Learning, folk-game and FAQ expanders work, and changing language retains expanded content. [Parent content results](evidence/parent-content-checks.json).
- Additional layouts: 320 px phone, 844 × 390 phone landscape and 1180 × 820 tablet landscape checked alongside the normal phone/computer sizes; no horizontal overflow and the modal Close control remains visible with at least a 44 px target. [Layout results](evidence/additional-layout-checks.json).
- Visual review: phone, tablet and computer screenshots inspected. The first concept review found a 34 px-wide phone Menu button; it was corrected to a 44 px minimum before the final check.
- This demonstrates the proposed website interaction with artwork only. It does not prove actual game-session preservation, input suspension, network behavior, physical iPhone behavior or performance after runtime integration.
- The downloadable HTML embeds artwork/fonts for convenient offline review. Its size is **not** the proposed production startup payload; production should use separately cached, appropriately sized assets.
- No game suite was run for this documentation/prototype proposal; browser checks exercise the proposal and the read-only live website.

## Source references

- [r88 main snapshot](https://github.com/nguyentuanphu/Sparkle-Valley/tree/f1dc57cd)
- [Current website app](https://github.com/nguyentuanphu/Sparkle-Valley/blob/f1dc57cd/home/app.ts)
- [Current website styles](https://github.com/nguyentuanphu/Sparkle-Valley/blob/f1dc57cd/home/style.css)
- [Current Home button](https://github.com/nguyentuanphu/Sparkle-Valley/blob/f1dc57cd/js/hud.js)
- [Actual game SVG artwork reused in the concept](https://github.com/nguyentuanphu/Sparkle-Valley/blob/f1dc57cd/js/art.js)
- [Live website](https://sparklevalley.au/home/)
- [Editable concept template](prototype.template.html) and [self-contained preview builder](build-preview.mjs)

The Sites design guidance was used for presentation and local-preview planning. No Sites-hosted project was created or published; the existing GitHub/Netlify site remains the deployment target.


## Final handoff validation (23 October 2026 AEDT)

Current-main changed-file suite: 9/9 passed, 187 unit tests, seven minutes, serial. Parent/control/report/graph tests pass five screen sizes, including selectable sample days, zero-play Wednesday, totals, EN/VI selection retention, disclosure, image enlargement, focus return, no overflow and no Storage reads/API calls. Navigation and original quest/photo/Family Quiz/printing regression also pass five layouts; phone/tablet/computer pictures inspected. Earlier capture failures during world startup/fade were corrected using the actual r88 UI renderer in an isolated harness and waiting for full opacity. No game code was changed. New graph disclosure and swipe hint were checked visually.

[Release handoff](RELEASE-HANDOFF.md) · [Copyable Release prompt](RELEASE-PROMPT.md). The handoff names runtime changes that remain, rather than claiming Home has already moved in the live game. Reward/festival checks reuse prior unchanged r88 results; no new game full suite, speed/offline/update integration or release zip is claimed.

## The page script is TypeScript (v1.08c, 5 Nov 2026 AEDT)
- The family website's behaviour (the four destinations and topic pages, the menu, the language switch, the Quest Guide
  search and printing, pictures, the festival calendar, the sample quiz and the example day) is `home/page.ts`, run by
  `home/site.ts`, built and type-checked like the rest of the game.
- How the sections move onto their topic pages and how one page is shown at a time is `home/navigation.ts`, the one
  source for both the website and this design preview (`build-preview.mts` makes it into JavaScript for the preview).
- `navigation.mts` only makes the HTML now. `tools/build-website.mts` takes the design's inline script out of
  `home/index.html` and refuses a page that still has one, apart from the one-line festival switch in the head.
- The 1 KB browser guard in the game's own `index.html` stays plain JavaScript, on purpose.
