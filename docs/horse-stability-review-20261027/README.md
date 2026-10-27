# Horse board stability (#633)

27 October2026 AEDT. Working branch; not released.

Prevent whole-board recentering when move buttons appear: anchor the game and board at the top, put the fixed-width die control before the changing move choices, and top-align the board inside the desktop grid. The original drawn horse now has its team's coat colour and a larger icon cap (28px to40px).

Final focused check passes84s:108 actual roll/move actions, fixed board/die rectangles in six device/language layouts, visible red/blue coats. Captures under shots/.

Earlier checks: one run lost its page execution context (unexplained navigation); a separate run then reproduced an actual49.6px desktop board shift. The grid margin fix resolved that measured shift. Do not describe the earlier context loss as a diagnosed game fix or omit it from release limitations.
