# v1.07 brief: tester-bugs

Name: tester-bugs. Branch: work/v107-tester-bugs.

Fix the tester reports filed on GitHub during v1.06, issues #746 to #781. Most come from auto play:
- These games cannot be played, do not close, or show 0 frames a second: Tower Stack, Sparkle Fruit Parade, Sparkle Orchard Quest, Robot Planner, Mountain Maze, Blindfold Goat, Blindfold Tag, Horse Racing Chess, Piggy Bank, Picture Sudoku, Đông Hồ Paintings, My Body, Opposites.
- Auto play gets stuck in the meadow at 69, 151 and at 57, -149.
- These games do not open: Wrap Bánh Chưng, Cat and Mouse, Throw the Còn.
- A button is covered in Shopping List and in Swap and Trade.
- Slow or frozen: #746 (16 frames a second), #780 (3.2 s freeze), #781 (13 frames a second).

Read each issue with its report. Replay it on current main (v1.06) before changing any code. Some reports may come from v1.05 devices and already be fixed: check the build named in each report. Fix only what you can reproduce, and add a check for each fix. Earlier rounds used the checks `ownerautoplayplans`, `ownerautoplaynavigation` and `autoplayhidden`, and the auto play plans (look at how v1.06 handled #687-#694, #727-#736).

Do not close the issues yourself. List each one in your status file as fixed (with the check), not reproduced (with what you tried), or needs owner. Release closes them after the deploy.
