# Brief: Studio, three fixes (Studio core, branch `core/studio`)

Owner, 12 Oct 2026 AEDT. Written by the Release chat (`round-t`). A helper chat: plan first and wait for the owner's
"go"; push `core/studio` when your checks pass and write **"ready for Release"** on the board. The Release chat of the day
merges it and runs the combined full suite (the Kid UI chat is the temporary Release for r65; if r65 has gone out, the next
round takes it). Read `CLAUDE.md`, `HANDOFF.md`, `docs/cores/README.md`, `docs/cores/studio.md` and the whole board first.

1. **A cleaner Analytics page** (owner: "a bit too much for the eyes; cleaner but still the details"). Recommendation:
   five big tiles on top (players this week, minutes played, devices, start-up health green/amber/red, battery and
   smoothness); one row per child (name, minutes, favourite game) and one per device type (phone, tablet, computer:
   frames a second, start time, battery use); everything else (by hour, every game, the slowest start-up steps) in folded
   "More detail" sections, closed at first; one colour per meaning (green good, amber watch, red act); small trend lines
   instead of long lists. The battery numbers come from the battery chat (`docs/cores/tasks/battery.md`): agree the field
   names on the board; show "not reported yet" until they arrive.
2. **Real photos show broken.** The downloads are fine (the 134 photos in `studio-draft` are real JPEG/PNG pictures); the
   thumbnails break when Studio shows a saved photo before Publish (online: held in Netlify Blobs `studio-pending`,
   `heldOn` in `netlify/functions/studio.mts`, read through `/studio/api/file/photos/...`, `studio/core.cts`
   `getPhotos1`). Reproduce it in the `studio` check (pretend GitHub and Netlify), fix it, and make the check prove every
   saved thumbnail opens as an image, online and in the exe.
3. **Ads: more guidance and pictures of how they look.** On the Ads page: a live preview of the roadside signboard and of
   the small card after a mini-game, drawn with the ad's own picture and words, at phone and computer sizes; a short
   picture guide made from real game screenshots (put them in `docs/guides/ads-guide/` and in Studio); a checklist that says what
   is missing before an ad can go live (picture, both languages, an allowed link). Link the five ready-made ad videos
   (`marketing/ads-r60/` on `claude/exciting-feynman-5nxzz8`) as examples.
Checks: `studio`, `nostudio`, `phone` (Studio's pages), the full suite; record the result in `docs/cores/studio.md`.
