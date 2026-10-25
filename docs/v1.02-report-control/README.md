# Floating ladybird and ride destinations · 26 October 2026 AEDT

Owner requested reporting during games, dragging the ladybird anywhere, double-tap to restore its home, and removal of duplicate Brisbane cards.

The 64px original-art control lives outside the HUD stacking context, above games and menus. The report form and picture viewer also sit above the window being reported. Dragging saves a relative position on this device; resize clamps it to the visible safe area. Double-tap cancels a pending report capture and restores home. Keyboard Enter/Space reports, Home resets. The existing long hold still sends a quick report. Disabling tester mode removes the floating control and viewport subscriptions.

The destination picker groups by normalized visible name and retains the nearest eligible physical stop. Distinct stop IDs can share the label Brisbane; ID-only grouping was insufficient and failed the actual picker regression. No world stops or map geometry are removed.

Six phone/tablet/computer and English/Vietnamese gesture/form cases pass. Native captures inspected. Initial fixture used the wrong Close selector and assumed a particular city ID; these were corrected. One gesture rerun exposed a real slow double-tap/capture race, fixed using event timestamps and cancellation. The first actual duplicate-destination run also exposed different IDs sharing one name; grouping now uses the visible name. The destination-only rerun passes with original physical stops preserved. The actual running-game, bounds and saved-position integration check passes; the icon opens the report while a real memory game remains open. Position survives controller remount, and off-screen drags clamp to the viewport.

Pictures use synthetic profiles. Queued-report badges are produced inside an intercepted test service and do not represent real reports or real families. Browser profiles emulate device sizes; physical-device confirmation remains outstanding. New logic and behavioural checks are TypeScript; the large legacy Studio test stays in its original JavaScript entry and calls a typed analytics layout reader. Its five-tile assertion additionally verifies all five remain visible, and the other detail panels still begin closed.

Main/live remains v1.01. These fixes belong to draft PR #602 for v1.02, with no deployment approval.

Default voice run 40217606701 successfully generated 96 clips and passed coverage, but its final push lost a concurrent branch-update race. The original generated commit was recovered from GitHub, with no repeated paid synthesis; all 96 clips fully decode locally and current source coverage reports zero missing. The recording saver now retries only pull/push up to three times. Evidence: default-voice-audit.json.
