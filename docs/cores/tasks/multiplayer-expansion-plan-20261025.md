# Sparkle Valley Multiplayer Expansion Plan

**Date:** 25 October 2026 AEDT  
**Status:** Planning only; no implementation, paid recording, merge, or deployment is authorized by this document.

## 1. Decisions

- The selected Vietnamese recording voice is FPT Neo Le Minh (`leminh`). Record a small listening-review sample first; do not regenerate the full pack until the sample scope is approved.
- These seven games are now registered and playable as child-safe single-player mini-games: Mèo Đuổi Chuột, Cướp Cờ, Kéo Cưa Lừa Xẻ, Đánh Đáo, Ném Còn, Trồng Nụ, and Đua Thuyền. They remain controlled by the existing Studio `newGames` switch and star-based second-set unlock rules. Their online multiplayer upgrades remain future work.
- Rong Ran Len May already exists under another ID. Do not add a duplicate.
- Co Vua Nho and Co Tuong Nho are puzzle experiences, not full two-player matches. New full matches need distinct IDs and labels.
- Co Ca Ngua is a new addition with a beginner mode using fewer pieces and a fuller rules mode.
- Multiplayer games should also support a local NPC opponent when the game permits it. NPC difficulty is configurable per game.
- The replacement game is the screen-only, child-safe Sparkle Fruit Parade. It is not a physical cabinet, slot machine, casino game, or gambling system.

## 2. Friend-tab experience

1. The player opens **Friends** and taps **Play a game**.
2. A grouped chooser opens instead of one long list:
   - **Board and turn-taking:** Co Ca Ngua, O An Quan, Ran va Thang, Caro, Co Vua, Co Tuong, Tien Len.
   - **Team and cooperative:** Keo Co, Da Cau, Chuyen Qua, Family Quiz.
   - **Fast group games:** Oan Tu Ti, Memory Match, Snap, races, and other verified games.
   - **Coming later:** unregistered games and games awaiting rule or asset confirmation.
3. Each card shows player count, turn style, online/NPC availability, and a short learning goal.
4. After selecting a game, the inviter chooses friends, NPC, or local pass-and-play where supported, then chooses options and difficulty.
5. Online invitations reuse the existing accept/reject flow. The invite shows the game name, player count, and any adult-consent requirement before acceptance.
6. The same game definition opens on every device. The host owns the authoritative seed, options, turn order, and result; clients validate legal moves and render state.

## 3. NPC design

- Use the same rules engine and state reducer as online play; only the move source changes.
- Expose Easy, Standard, and Hard only where an algorithm exists and is tested.
- Easy makes understandable mistakes, Standard is a reliable family opponent, and Hard is reserved for games with a bounded search or strategy model.
- NPC decisions are deterministic from a supplied seed so tests reproduce a match.
- Studio controls enable or disable NPC mode per game and choose available/default difficulty. Child-facing UI never exposes Studio administration.

## 4. Implementation batches

### Batch A: foundation and first playable set

- Extend `js/netgames.ts` definitions without replacing the existing invitation protocol.
- Add capability metadata for `online`, `npc`, `local`, `maxPlayers`, `turnBased`, `teamBased`, `difficultyLevels`, and `adultConsent`.
- Build the Friend-tab chooser from registry metadata, not a second hard-coded list.
- Upgrade existing shared games in this order: online O An Quan, online Ran va Thang, shared Keo Co, and multiplayer Family Quiz.
- Add Co Ca Ngua with beginner and full rules modes.
- Add NPC opponents only after each shared reducer and move validator is stable.

### Batch B: full board matches

- Add full two-player Co Vua under a new ID, separate from `covuanho` puzzle content.
- Add full two-player Co Tuong under a new ID, separate from existing small-puzzle content after verifying exact IDs.
- Implement legal moves, check/checkmate or equivalent win conditions, resignation, draw/timeout handling, reconnect/leave handling, and a tested NPC difficulty ladder.
- Keep the first release scoped: no clocks, ratings, spectators, chat, or matchmaking unless the existing transport and privacy model supports them.

### Batch C: additional verified games

- Add only after confirming rules, content, assets, and registration: Co Ganh and picture/number Dominoes.
- Keep the seven games in the verified single-player set; add them to multiplayer only after a shared reducer and invitation protocol are tested.
- Re-check every proposed upgrade before changing unlock lists or release content.

### Separate workstream: Le Minh recordings

- Create isolated FPT tooling and a small sample set: one greeting, one game instruction, and one story narration line.
- Use the GitHub Actions secret `FPT_API_KEY`; never print or persist the key.
- Keep current voice files and manifests untouched while the sample is reviewed.
- Only after approval define which Vietnamese voice categories, if any, move to Le Minh and update manifests/coverage tests.

## 5. Sparkle Fruit Parade design

- Use the existing mini-game framework and visual language; do not redesign global Sparkle Valley UI.
- The initial reusable mode is Fruit Parade: three animated vertical symbol lanes, a visual mission, and large STOP 1/2/3 controls.
- Use large symbols and minimal text for ages 2-8. Support English and Vietnamese through the existing translation system and `T()` conventions.
- Easy (roughly ages 2-4): slower lanes, fewer symbols, 1-2 item missions, visual hints, forgiving timing, and gentle assistance.
- Normal (roughly ages 4-6): moderate speed, 2-3 item objectives, and simple combinations.
- Advanced (roughly ages 6-8): faster movement, memory sequences, multi-step missions, and combos.
- Use cooperative play as the default: players contribute to one shared mission and see shared progress. Competitive Fruit Race remains optional and secondary.
- Support single-player offline play, same-device two-player play, online family play, and NPC partner fallback through the same state engine.
- Special symbols are configuration-driven: Rainbow substitutes, Sparkle Star advances shared progress, Ladybug/Dragon/Key emit Adventure Result hooks, and future symbols can be added without hard-coded rules.
- Positive results use non-monetary Sparkle Valley rewards only: stickers, clothes, accessories, seeds, decorations, cards, emotes, sparkle effects, activities, or achievement progress.
- Reduced motion, larger controls, audio-independent visual cues, colour-independent audio cues, and responsive mobile/tablet/desktop layouts are required.
- Use existing audio, voice, character reaction, save, event, analytics, and multiplayer systems; do not create competing systems.
- Add hooks for start, completion, mode, difficulty, duration, multiplayer, disconnect/reconnect, errors, and Adventure Result events without collecting unnecessary personal data.

## 6. Technical shape

- Keep `js/games/registry.ts` as the source of game metadata and registration.
- Keep `js/netgames.ts` as the invitation/session transport; add validated capability and option payloads rather than a parallel protocol.
- Give each upgraded game a pure state reducer and move validator so online, NPC, local, replay, and tests use the same rules.
- Add bounded message sizes, seat validation, turn validation, option validation, and host/session expiry checks.
- Keep game rendering in the game module and shared invitation/consent/option UI in the existing Friend/online UI layer.
- Do not change map or world-position files.

## 7. Verification gates

- Every visible game has a registered implementation or is clearly marked pending.
- Rong Ran has one canonical ID; puzzle chess entries remain distinct from full matches.
- Test legal and illegal moves, turn order, win/draw/leave/reconnect behavior, deterministic NPC decisions, and option validation.
- Test invitation acceptance/rejection, mixed human/NPC seats, malformed moves, disconnects, and bounded messages.
- Verify no child identity or adult-consent details enter analytics, logs, public manifests, or multiplayer messages.
- Verify Friend-tab grouping on phone, tablet, and desktop.
- Verify Studio toggles persist privately.
- Run focused checks first, then the required GitHub full suite. Do not claim full-suite success from local partial checks.

## 8. Decisions needed before implementation

1. Confirm whether the first implementation slice should be the reusable engine plus Fruit Parade single-player, or include cooperative multiplayer in the first code pass.
2. Confirm standard versus child-friendly simplified rules for Co Vua and Co Tuong.
3. Confirm the Batch A order if it differs from the recommendation.
4. Confirm whether Studio NPC/difficulty settings are owner-only or available to all administrators.
5. Review and approve the Le Minh sample scope before paid bulk synthesis.
