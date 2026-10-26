# Owner-supplied Fruit Parade reference

Source: https://chatgpt.com/share/6addab30-5460-83ec-a19a-39b5c0b93774

Owner, 25 October 2026 AEDT: “The fruit parade should be designed this way. Ensure everything is typescript.” Latest screen-only design below; older cabinet suggestions are superseded. This is implementation authorization, not deployment approval.

Yes. Since you only want the **screen/game experience** and not the physical cabinet, I would expand it into a proper Sparkle Valley mini-game system rather than just copying a reel screen.

A few additions would make it much stronger:

- **Multiple game modes on the same screen**: Fruit Match, Memory Match, Colour Match, Number Match, Music Match, Animal Rescue, Treasure Hunt.
- **Adaptive difficulty** based on child age or ability. Ages 2–4 get slower movement, larger targets, visual hints and forgiving outcomes; ages 5–8 get faster patterns, objectives, combos and multi-step challenges.
- **Co-op as the main multiplayer mode**, with competitive mode optional.
- **Shared missions** such as “Collect 3 apples + 2 ladybugs together”.
- **Round-based play** so sessions stay short: roughly 30–90 seconds per round.
- **Special symbols** like Rainbow, Star, Dragon, Ladybug and Magic Key that trigger different effects rather than just increasing a score.
- **World-linked rewards**, where successful games can unlock seeds, food ingredients, clothes, stickers, decorations, emotes or temporary effects.
- **No gambling terminology or mechanics**: no bet, wager, jackpot, payout, casino credit or purchasable spins.
- **Bilingual EN/VN throughout**, using the existing Sparkle Valley `T()` translation approach.
- **Character reactions** visible around the game UI: happy, excited, surprised, thinking and celebrating.
- **Accessibility mode** with reduced motion, slower animations, sound-independent cues and larger controls.
- **Touch + keyboard + controller support** from the same implementation.
- **Offline single-player** with local saves.
- **Multiplayer reconnect**, so a temporary disconnect doesn't instantly end a child's game.
- **Deterministic multiplayer rounds** so both players always see the same underlying game state.
- **Spectator/family mode** later, where another family member can watch without controlling.
- **Daily/weekly missions**, but without streak pressure. Missing a day should never penalise the child.
- **Seasonal content packs** using the same engine: Tết, Mid-Autumn, Christmas, birthdays, school holidays.
- **Mini-game chaining**: a Magic Key won here can open a treasure activity somewhere else in Sparkle Valley.
- **NPC challenges**, so children can play cooperatively against or alongside an NPC when no second player is available.
- **Parent-safe reporting** limited to useful information like games played, favourite activity and skills practiced, without turning it into complicated analytics.

I would also avoid making the whole game resemble a slot machine visually. We can retain the satisfying **vertical scrolling / stopping mechanic**, but present it more like a moving matching board.

For example:

```text
╭─────────────────────────────────────╮
│      [Rainbow] SPARKLE FRUIT PARADE        │
│                                     │
│        FIND: [Apple]  [Apple]  [Ladybird]            │
│                                     │
│     ┌──────┬──────┬──────┐         │
│     │  [Strawberry]  │  [Star]  │  [Apple]  │         │
│     │  [Apple]  │  [Ladybird]  │  [Flower]  │         │
│     │  [Star]  │  [Apple]  │  [Strawberry]  │         │
│     └──────┴──────┴──────┘         │
│                                     │
│        [Red button]      [Yellow button]      [Green button]          │
│       STOP    STOP    STOP          │
│                                     │
│  Clara [Star][Star][Star]      TEAM [Star][Star][Star][Star]        │
│                                     │
│       2 / 3 mission items           │
╰─────────────────────────────────────╯
```

For multiplayer, the same UI could dynamically become:

```text
╭──────────────────────────────────────────────╮
│              TEAM FRUIT PARADE               │
│                                              │
│ Mission: Find [Apple] [Apple] [Strawberry] [Ladybird] [Star]                │
│                                              │
│   CLARA                     TRIXIE            │
│ ┌────┬────┬────┐         ┌────┬────┬────┐   │
│ │ [Apple] │ [Ladybird] │ [Star] │         │ [Strawberry] │ [Apple] │ [Flower] │   │
│ │ [Flower] │ [Strawberry] │ [Apple] │         │ [Ladybird] │ [Star] │ [Strawberry] │   │
│ └────┴────┴────┘         └────┴────┴────┘   │
│                                              │
│      Shared progress: [Apple][Apple] [Strawberry] [Ladybird] _          │
│                                              │
│             [Sparkles] ONE MORE STAR! [Sparkles]             │
╰──────────────────────────────────────────────╯
```

One feature I'd particularly add is **“Adventure Result”**. Instead of every successful round merely saying “You win”, certain combinations can create something in the main world:

**[Ladybird][Ladybird][Ladybird] → Ladybug Adventure**  
**[Dragon][Star][Star] → Dragon Mission**  
**[Seedling][Rain][Sun] → Grow a plant**  
**[Magic key][Map][Star] → Treasure Hunt**  
**[Music][Music][Rainbow] → Music challenge**

That gives the mini-game a reason to exist inside Sparkle Valley rather than feeling like a separate arcade game.

Here is the implementation prompt I would use with Codex/Claude or another development AI:

:::writing{variant="document" id="58321" title="Sparkle Valley Screen Mini-Game Implementation Prompt"}
You are working on the existing **Sparkle Valley** project.

Your task is to design and implement a new reusable **screen-only Sparkle Arcade / Fruit Parade mini-game system** for children aged approximately 2–8.

This is NOT a physical arcade cabinet task. Do not create or model a cabinet. Build only the in-game screen/UI/game experience that can later be displayed on an in-world screen or opened as a Sparkle Valley mini-game.

## PRIMARY GOAL

Create a polished, child-friendly matching/reaction mini-game inspired only by the satisfying idea of vertically moving symbols and pressing controls to stop/select them.

Do NOT create a casino game or slot machine.

There must be:
- no betting
- no wagering
- no gambling
- no jackpots
- no casino credits
- no cash-value rewards
- no purchasable spins
- no payout terminology

The mechanic must instead be based on:
- matching
- timing
- memory
- cooperation
- simple learning activities
- exploration rewards

The initial game should be called:

**Sparkle Fruit Parade**

Build it as a reusable framework so additional modes can later use the same engine.

---

# 1. FIRST RULE: PRESERVE SPARKLE VALLEY

Before modifying anything:

1. Inspect the existing project architecture.
2. Inspect existing UI components and styling.
3. Inspect existing mini-game framework.
4. Inspect multiplayer architecture.
5. Inspect save architecture.
6. Inspect translation implementation including `T()`.
7. Inspect input handling.
8. Inspect audio/music/voice systems.

DO NOT redesign global Sparkle Valley UI.

DO NOT replace existing architecture unnecessarily.

DO NOT delete existing functionality.

Reuse existing project patterns wherever practical.

Maintain visual consistency with Sparkle Valley.

Use TypeScript where the project architecture supports it.

Keep changes modular and easy for another AI/developer to understand.

---

# 2. TARGET AUDIENCE

Children approximately 2–8 years old.

The game must work for children who cannot yet read.

Use:
- large symbols
- clear icons
- simple animation
- minimal text
- large controls
- obvious visual feedback

Avoid:
- complex menus
- tiny buttons
- excessive pop-ups
- long instructions
- stressful countdowns
- punishment mechanics

---

# 3. LANGUAGE

All visible text must support:

English
Vietnamese

Use Sparkle Valley's existing translation system and `T()` conventions.

Do not hard-code English-only UI strings.

---

# 4. CORE SCREEN

Create a responsive game screen approximately structured as:

Header:
Sparkle Fruit Parade

Mission:
Visual objective such as:

[Apple] [Apple] [Ladybird]

Main area:
Three animated vertical symbol lanes.

Example symbols:

[Apple] Apple
[Strawberry] Strawberry
[Banana] Banana
[Flower] Flower
[Ladybird] Ladybug
[Star] Sparkle Star
[Rainbow] Rainbow
[Dragon] Dragon
[Magic key] Magic Key

Controls:

STOP 1
STOP 2
STOP 3

Use large touch-friendly buttons.

Keyboard/controller equivalents should also be supported through the existing Sparkle Valley input system.

---

# 5. GAMEPLAY

Each round generates an objective.

Examples:

Find:
[Apple] [Apple] [Strawberry]

Find:
[Ladybird] [Star] [Ladybird]

Find:
three matching colours

Find:
two animals and one flower

The lanes move vertically.

Player stops/selects each lane.

A round should normally last approximately 30–90 seconds.

Provide clear positive feedback for:
- success
- partial success
- near match
- completing mission

Do not use harsh failure screens.

Use language such as:

"Great try!"
"Almost!"
"One more!"
"Wonderful!"
"Teamwork!"

---

# 6. AGE / DIFFICULTY ADAPTATION

Support at least three configurations.

## Easy / younger children
Approximately ages 2–4.

- slower lanes
- fewer symbols
- larger symbols
- forgiving timing
- visual hints
- simple 1–2 item objectives
- allow gentle assistance when close

## Normal
Approximately ages 4–6.

- moderate speed
- more symbols
- 2–3 item objectives
- simple combinations

## Advanced
Approximately ages 6–8.

- faster movement
- multi-step missions
- memory sequences
- combos
- additional objectives

Difficulty should be configurable rather than creating three separate games.

---

# 7. SPECIAL SYMBOLS

Implement extensible special-symbol behaviour.

Examples:

[Rainbow] Rainbow
Can substitute for a required common symbol.

[Star] Sparkle Star
Adds to shared mission progress or activates a bonus animation.

[Ladybird] Ladybug
Can trigger a Ladybug-related Sparkle Valley activity.

[Dragon] Dragon
Can unlock a Dragon challenge.

[Magic key] Magic Key
Can trigger a treasure-hunt hook.

Special actions should use an extensible data/config system rather than being deeply hard-coded.

---

# 8. SINGLE PLAYER

Single player must work completely offline where possible.

Flow:

Player opens mini-game
→ mission appears
→ lanes begin
→ player stops/selects
→ result calculated
→ celebration
→ reward/progress stored
→ play again OR exit

Do not require a server for normal single-player gameplay.

---

# 9. MULTIPLAYER

Design multiplayer from the beginning.

Support architecture for:

1. Same-device two-player
2. Online two-player/family play
3. NPC partner fallback

The default multiplayer philosophy should be COOPERATIVE rather than competitive.

Example:

Player 1 finds:
[Apple] [Ladybird]

Player 2 finds:
[Apple] [Star]

Shared mission:

[Apple] [Apple] [Ladybird] [Star]

Both contribute toward the same objective.

Display:

PLAYER 1
PLAYER 2
SHARED PROGRESS

Example:

Shared progress:
[Apple] [Apple] [Ladybird] _

"ONE MORE STAR!"

---

# 10. OPTIONAL COMPETITIVE MODE

Competitive play may exist later but must not be the primary experience.

Potential mode:

Fruit Race

Players race to complete identical objectives.

No humiliating win/lose screens.

After the round:

Player A:
Great work!

Player B:
Great work!

Then optionally show who completed first.

---

# 11. MULTIPLAYER TECHNICAL REQUIREMENTS

For online multiplayer:

Server/session authority must control important shared state.

Do not independently calculate authoritative results on both clients.

Use a deterministic round seed.

Conceptually:

Session created
→ shared seed generated
→ both players receive round configuration
→ clients animate locally
→ player actions submitted
→ shared result validated
→ state synchronized

Synchronize only necessary information such as:

sessionId
roundId
seed
playerId
gameMode
lane action
symbol result
mission progress
round state
reward result

Avoid excessive continuous network traffic.

The animation itself should normally remain client-side.

---

# 12. RECONNECT

Handle temporary network interruption gracefully.

If Player 2 disconnects:

Do not immediately destroy the game.

Show a small status:

"Waiting for friend…"

Allow reconnection for a reasonable period.

If reconnection fails, allow the remaining player to:

Continue alone

OR

Continue with an NPC helper

depending on existing Sparkle Valley multiplayer conventions.

---

# 13. NPC PARTNER

If multiplayer is unavailable, allow an NPC to participate.

NPC behaviour should:

- appear human-like but simple
- not always play perfectly
- be slightly slower for younger-player modes
- contribute toward cooperative objectives

This allows children to experience co-op gameplay even when alone.

---

# 14. GAME MODES FRAMEWORK

Build the system so additional modes can use the same screen/game engine.

Initial:

### Fruit Parade
Match moving symbols.

Future-ready configuration for:

### Colour Match
Find matching colours.

### Number Match
Simple counting and quantities.

### Memory Garden
Remember a sequence.

### Music Match
Repeat notes/patterns.

### Animal Rescue
Match symbols to free animals.

### Treasure Hunt
Find combinations that reveal map pieces.

Do NOT necessarily build all modes fully now.

Build the architecture so they can be added without rewriting the engine.

---

# 15. ADVENTURE RESULT SYSTEM

Add hooks for successful combinations to trigger Sparkle Valley world activities.

Examples:

[Ladybird] [Ladybird] [Ladybird]
→ Ladybug Adventure

[Dragon] [Star] [Star]
→ Dragon Mission

[Seedling] [Rain] [Sun]
→ Grow Plant activity

[Magic key] [Map] [Star]
→ Treasure Hunt

[Music] [Music] [Rainbow]
→ Music activity

These should initially be implemented as event/hooks if the related world activity does not already exist.

Do not invent or break unrelated Sparkle Valley systems.

Example event concept:

sparkleArcade:adventureTriggered

with payload:

activityType
playerId
combination
reward
sourceGame

Use existing project event architecture if one exists.

---

# 16. REWARDS

Rewards must have no monetary or gambling value.

Possible Sparkle Valley rewards:

- stickers
- clothes
- accessories
- garden seeds
- food ingredients
- furniture decorations
- collectible cards
- emotes
- temporary sparkle effects
- world activity unlocks
- achievement progress

Use existing inventory/reward architecture where available.

Do not duplicate an existing inventory system.

---

# 17. ACCESSIBILITY

Include support for:

- reduced motion
- larger UI targets
- slower animation
- visual cues independent of sound
- audio cues independent of colour
- no critical information conveyed only by colour

Respect existing Sparkle Valley accessibility/settings architecture.

---

# 18. AUDIO / VOICE

Integrate through Sparkle Valley's existing combined audio/music/voice architecture.

Suggested effects:

lane moving
button press
symbol stop
near match
success
special symbol
team success

Do not create a separate conflicting audio settings interface.

If voice guidance is supported:

English and Vietnamese should use the existing Sparkle Valley voice system.

---

# 19. CHARACTER REACTIONS

Where the project architecture permits, trigger reactions for the currently selected character.

Examples:

happy
surprised
thinking
excited
celebrate
team high-five

Do not replace the character system.

Use animation hooks/events where possible.

---

# 20. RESPONSIVE DESIGN

Must work on:

desktop
tablet
mobile
touchscreen

Avoid UI overflow.

Maintain correct scaling.

Do not make dialogs unnecessarily large.

Keep selection windows small and discrete in accordance with Sparkle Valley's existing owner requirements.

---

# 21. PERFORMANCE

The game must remain lightweight.

Avoid:

- unnecessary large dependencies
- excessive particle effects
- constant server updates
- high-frequency React/state rerenders
- expensive animation loops

Prefer:

requestAnimationFrame or existing game animation system

and deterministic animation where practical.

---

# 22. SAVE SYSTEM

Single-player progress:

Store locally using the existing Sparkle Valley save architecture.

Online play:

Reconcile through existing multiplayer/cloud systems when available.

Do not create a competing save system.

---

# 23. DAILY / SEASONAL CONTENT

Architecture should allow configuration packs such as:

Tết
Mid-Autumn Festival
Christmas
Birthday
Summer
School holiday

Do not create pressure-based streak systems.

Missing a day should never remove rewards or punish a child.

---

# 24. ADMIN / ANALYTICS HOOKS

If Sparkle Valley already has tester/Ladybug reporting architecture, provide hooks for:

game started
game completed
mode
difficulty
duration
single/multiplayer
disconnect/reconnect
errors

Do not collect unnecessary personal information.

Integrate with existing reporting rather than making another separate reporting system.

---

# 25. VISUAL STYLE

Keep the screen visually consistent with Sparkle Valley.

Desired feeling:

colourful
soft
friendly
rounded
polished
3D-inspired
simple
magical
child-safe

Avoid looking like:

casino
poker machine
adult arcade gambling screen
commercial slot machine

Symbols should be large and expressive.

Animation should feel smooth rather than mechanical.

---

# 26. CODE ARCHITECTURE

Prefer a reusable structure conceptually similar to:

SparkleArcade
├── ArcadeScreen
├── ArcadeGameEngine
├── GameModeConfig
├── SymbolRegistry
├── MissionEngine
├── RewardAdapter
├── MultiplayerAdapter
├── AdventureTrigger
├── AudioAdapter
├── CharacterReactionAdapter
└── ArcadeTests

Adapt naming and structure to the actual Sparkle Valley project rather than blindly creating these files.

The existing repository architecture takes priority.

---

# 27. TESTING

Add appropriate tests covering at minimum:

- game boot
- single-player round
- mission generation
- stopping lanes
- success result
- partial result
- special symbols
- English
- Vietnamese
- touch input
- keyboard input
- offline operation
- two-player state
- shared mission progress
- multiplayer deterministic seed
- disconnect/reconnect
- NPC fallback
- rewards
- save/load
- reduced motion
- responsive mobile layout

Do not break existing Sparkle Valley regression tests.

---

# 28. OWNER UI RULE

Very important:

DO NOT change unrelated Sparkle Valley UI.

DO NOT redesign existing menus.

DO NOT enlarge dialogs unnecessarily.

DO NOT remove working code unless necessary.

DO NOT replace an existing project system simply because you prefer another architecture.

Any required architectural deviation must be documented.

---

# 29. DOCUMENTATION

Document:

- files changed
- architecture used
- game-state model
- multiplayer flow
- configuration system
- special-symbol system
- reward integration
- Adventure Result hooks
- remaining future work

Create/update the appropriate Sparkle Valley handoff/work-order documentation so another AI can continue without guessing.

---

# 30. EVIDENCE

After implementation:

Run relevant tests.

Provide evidence of:

1. Single-player screen
2. Mission objective
3. Lane movement/stopped result
4. Successful match
5. Special symbol result
6. Two-player cooperative mode
7. Shared progress
8. English
9. Vietnamese
10. Mobile view
11. Reduced-motion/accessibility state if visually applicable

Screenshots should demonstrate actual implemented code, not mockups.

---

# 31. WORKFLOW

Before coding:

1. Inspect repository.
2. Identify existing relevant systems.
3. Produce a concise implementation plan.
4. Identify files likely to change.
5. Check for conflicts with existing Sparkle Valley rules.

Then implement systematically.

Stay focused on this task until the feature is complete, tested and documented.

Do not expand the scope into unrelated Sparkle Valley redesign work.

The final result should feel like a native Sparkle Valley feature rather than a separate web game pasted into the project.
:::

I would use that as the **development prompt**, because it gives the next AI enough freedom to inspect and reuse your existing Sparkle Valley code instead of blindly creating a completely separate mini-game architecture. 

---

If you want, I can:

- Outline development steps for implementing the Sparkle Fruit Parade screen-only mini-game
- Develop UI mockups and interaction flow for single-player and multiplayer Sparkle Fruit Parade modes
- Explain how to implement adaptive difficulty and special symbol mechanics in the Sparkle Fruit Parade mini-game

Reference symbols are transcribed as names to respect the repository’s no-phone-emoji rule. Implemented screens use the game’s original SVG illustrations.
