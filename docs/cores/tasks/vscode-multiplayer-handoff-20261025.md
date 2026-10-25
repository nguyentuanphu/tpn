# VS Code Handoff Prompt: Multiplayer Expansion

Copy this prompt into the implementation chat after the owner confirms the open decisions in the plan.

```text
You are implementing the Sparkle Valley multiplayer expansion on a new helper branch.

Repository: D:\WorkSpace\Sparkle-Valley
Read CLAUDE.md, HANDOFF.md, docs/README.md, docs/cores/README.md, docs/cores/BOARD.md, docs/cores/release.md, and docs/cores/tasks/multiplayer-expansion-plan-20261025.md before editing.

Release safety:
- v1.01 is already live.
- Never merge to main, deploy, change the version, or start a new release without the owner's explicit "yes, deploy".
- Pull before pushing. Never force-push or overwrite another branch's work.
- Do not change map/world-position files.
- Keep Sydney/AEDT timestamps in notes.

Voice scope:
- The selected Vietnamese voice is FPT Neo Le Minh, API ID leminh.
- Do not use the older Azure/Hanoi assumption.
- First create only isolated FPT tooling and a SMALL sample set for listening review.
- Use the GitHub Actions secret FPT_API_KEY only; never print, commit, or log it.
- Do not regenerate the full voice pack or change voice policy until samples are approved.

Game facts:
- Pending until verified: Meo Duoi Chuot, Cuop Co, Keo Cua Lua Xe, Danh Dao, Nem Con, Trong Nu, Dua Thuyen.
- Rong Ran Len May already exists under another ID; do not duplicate it.
- Co Vua Nho and Co Tuong Nho are puzzles, not full matches.
- Add full Co Vua and Co Tuong under distinct IDs only after checking the registry and existing names.
- Co Ca Ngua is a new addition with beginner and full rules modes.

Implementation order:
1. Inspect and document the current registry, Friend-tab chooser, js/netgames.ts protocol, local/NPC patterns, Studio configuration path, and tests. Do not assume handoff claims are current.
2. Extend registry metadata and the existing netgames protocol; do not create a second multiplayer system.
3. Implement the Friend-tab grouped chooser: board/turn-taking, team/cooperative, fast group games, and clearly marked pending/coming-later entries.
4. Implement the first batch: online O An Quan, online Ran va Thang, shared Keo Co, multiplayer Family Quiz, and Co Ca Ngua.
5. Reuse pure reducers and move validators for online, local, NPC, and tests. NPC mode supports only tested games and exposes Easy/Standard/Hard only where implemented. Use deterministic seeds.
6. Add full two-player Co Vua and Co Tuong in a later focused batch with legal moves, turn validation, win/draw/resign/leave/reconnect behavior, and bounded NPC difficulty.
7. Treat the attached arcade screenshot as unidentified until the owner confirms the exact game, rules, asset rights, and child-safety classification. Do not invent rules from the image.
8. For that confirmed game, add an adult confirmation gate on every participating device before invite acceptance, NPC start, or local start. Default it on. Add Studio controls for gate on/off, NPC allowed, and difficulty. Store only a short-lived session consent marker; never collect identity documents or child-sensitive data.
9. Reject real-money wagering, cash-out, gambling rewards, or child-targeted monetisation. Stop for owner/legal review if those are part of the source game.

Required tests:
- Registry/catalog and duplicate-ID checks.
- Rules, illegal moves, turn order, win/draw, leave/reconnect, deterministic NPC, and option validation.
- Invitation accept/reject, mixed human/NPC seats, malformed moves, disconnects, bounded message sizes.
- Adult-consent privacy: no consent or child identity data in analytics, logs, public manifests, or net messages.
- Phone/tablet/desktop Friend-tab grouping and Studio setting persistence.
- Run focused tests first. Then use the required GitHub full-suite workflow; do not claim full-suite success from local partial checks.

Before coding, report the verified architecture, exact files to change, and any blocking ambiguity. Do not begin paid bulk voice recording or deployment.
```
