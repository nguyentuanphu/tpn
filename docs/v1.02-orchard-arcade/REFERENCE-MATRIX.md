# Shared-design acceptance matrix

The shared references include both a playable first game and later platform ideas. This matrix distinguishes those; no release is approved.

| Reference item | Current implementation | Evidence / limit |
|---|---|---|
| Distinct Orchard, keeping Fruit Parade | Separate IDs/catalogue/engines; Orchard ring and Fruit Parade three-lane UI | Catalogue check, real browser completion |
| Original game art, EN/VI, child controls | Existing own SVGs, bilingual cues, 64px buttons, calm mode | Twelve device/language images; bounds assertions |
| Ring, Stop, picture mission, gentle assistance | Real moving perimeter, collection progress, age speed and near-hit/repeated-miss assistance | Pure seeded mission tests; actual local/online finish |
| Solo, helper, same-device family play | Orchard solo/NPC/local-two modes; Fruit Parade individual panels | Actual NPC/local completions |
| Online shared missions, reconnect | 2–4 seats; host-committed ordered commands, replay, original guest seat retained during NPC continuation | Four-seat pure state test, two-browser play and guest continuation |
| Keyboard/controller | Orchard scoped Space/Enter and controller A; Fruit Parade lane keys/controller adapter | Actual input-event checks |
| Trusted session server / anti-cheat | Existing family-room host owns commits; shared seed, authenticated known seats | Not a new trusted central backend or ranked anti-cheat service |
| Special combinations and world link | Real in-session combinations; adopted extension event with reward:null | World ladybird tours, dragon flights, garden prizes and treasure-map inventory are not implemented by this change |
| Number/colour/animal/music/festival symbol games | Extension direction, not new finished games | Future content/configuration work |
| All alternate path/relay/split layouts | Ring shared turn-taking in Orchard; split three-lane co-op in Fruit Parade | Additional path layouts and independent relay variants remain extensions |
| Separate parent area and tester controls | Grown-ups entry and hold gate per device; accepted testers plus separate master/single/multiplayer switches | Non-tester rejection, six real Studio controls, duplicate-window and pause restoration checks |
| Virtual parent counters | 100,000 start; free refill; 0–100 allocations; clear/repeat; weighted/equal frequencies; 20 rounds | Pure debit/result/limit tests and actual parent round |
| Parent multiplayer shared result | Same seeded result, individual allocations/balances; local, practice helper and online up to four | Two-browser identical balances/result, no child save writes |
| Isolated economy | Memory-only parent session, no purchase/cash-out/exchange/child coins, rewards or public leaderboard | No profile dependency in engine; actual unchanged child-save assertion |
| Parent statistics | Current round, balances, last returns and biggest return in session | No permanent bank, saved tournament history or public rankings |
| Bonus games / alternate reels / daily tournament | Not implemented | Reference expansion ideas; not advertised as finished |
| Sound/voice production | Existing default audio; 6,319 baseline plus 11 reviewed new Lê Minh clips staged and fully decoded | Parent all-Vietnamese selector/cache/background-pack integration and listening review still pending |
| Studio analytics | All five tiles retained; bilingual persistent overview fold, responsive alignment | Six EN/VI device cases, collapsed state after reload |
| Release regression | Dedicated UI checks and fast checks pass; final full --all on GitHub | See latest PR #602 checks; no deployment approval |
