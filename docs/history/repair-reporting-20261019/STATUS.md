# Reporting repair checkpoint — 19 October 2026 AEDT

Branch work/bugs-typescript-20261019, based on live r87. Plan approved; next release number and deployment remain separate owner decisions.

Fixes cover #372 retry feedback/recovery and #375 report layout/capture. Typed sources: tester.ts, screencapture.ts, tester-detection.ts and report-outbox.ts. The latter two retain strict contract checking.

The reporting form follows visualViewport size/position, keeps header/footer accessible, uses 64 px little controls and offers a larger picture viewer. Sending has a 15 s bound, coalesces concurrent retries, retains unacknowledged reports and removes acknowledged rows individually, including when another report arrives mid-send. Queue/sending/sent/retry/offline feedback updates while the panel is open. Closed panels release their observers/listeners.

World pixels are composed outside foreignObject to avoid losing them when nested images are omitted. Full/scene options use the same complete on-screen frame, ignoring offscreen portrait renders and waiting through both split-screen passes. User/private field redaction remains in place.

Verification: related suite 6/6 (unit 175, types, ownercapture, reportdetectors, reportingflow, reportstorage). Strong final focused run 2/2: reportingflow 242 s, types 24 s. Twelve EN/VI phone 320/430 px, short, landscape, tablet and computer layouts, keyboard viewport, nonblank frames, 64 px targets, picture viewer, timeout/coalescing, offline/invalid/503 recovery all pass. Twelve normal HUD scans observed zero offscreen controls; promoted to a GitHub assertion. Final images inspected; evidence/before and evidence/after contain screenshots and metrics.

Physical iOS Safari/keyboard confirmation remains unverified. Full GitHub suite pending. #375's separate game-ending request proceeds in the next batch; these reporting fixes do not claim it is complete. The remaining migration and bugs stay in the approved combined plan.

Full GitHub verification: run 39237648036 on 7c28d21a passed 223/223, with zero failures or repeated checks in the complete logs. Quick checks passed 8/8. AI review 39237648251 did not finish; it is not a pass. This verifies the reporting checkpoint only.
