# Connected festival visibility · 26 October 2026 AEDT

Studio Festivals and Releases now publish the same festival switches. A public-only endpoint supplies both the website and game. An explicit off hides the calendar entry, related website guides, notices, decorations, festival activities and tester previews. Existing child progress is retained.

Open pages refresh on focus, visibility and at most every 60 seconds while visible. Offline pages use their last public snapshot; an offline device cannot receive a newly changed switch until it reconnects. Website first load waits for the public snapshot before displaying event cards. No family answers, profiles, device lists or photos are exposed by this endpoint.

The end-to-end check uses the real Studio controls, public endpoint, production website and game. First attempt caught an annual date override being removed by an unrelated save; the fix preserves annual dates, decorations and unrelated release settings. The next run passed. Extended checks also cover the Releases controls, all festivals off and a public-service outage; see the current release report for their result.

The six committed screenshots cover English and Vietnamese at phone (390×844), tablet (820×1180) and computer (1280×800) sizes, with Halloween off. They were visually inspected. Other enabled events remain available.

Seven focused unit tests pass, covering privacy filtering, service failure, either off switch, live overrides, Sydney-day release windows and the exact turtle-counting voice inventory. Prior local regressions pass games (206), adventure, accessibility, solid collision, room startup and source types. The previous full GitHub run was 231/235; the replacement must finish before deployment.

Extended festival integration and types pass 2/2 (85s and 22s): both Studio controls synchronize, all-off removes the website festival section, and service failure retains cached off state. No check was weakened.
