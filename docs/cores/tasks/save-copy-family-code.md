# Next round after r89.1: Save a copy, and the family code (Release, 23 Oct 2026 AEDT)

Owner, 23 Oct 2026 AEDT (pop-up, "Save copy + family code"): "Is there a way we can capture these devices as unique so
regardless of opening a new game we can still track? Also can we save progress right to iCloud or anywhere accessible to
the user?"

## Why not fingerprinting

A wiped browser keeps nothing the game wrote. Guessing a device from its screen, system and browser ("fingerprinting")
cannot tell identical iPhones apart and is tracking without consent, which children's privacy rules and the game's own
privacy rules (PRIV-*) do not allow. The family code below is the consented way to get the same result.

## Part 1: Save a copy / Load a copy (Grown-ups)

- Grown-ups (behind the grown-up gate) gets "Save a copy · Lưu một bản" and "Load a copy · Mở bản đã lưu".
- Save a copy makes one small file (`sparkle-valley-<date>.svsave`, JSON: the same snapshot as js/state.ts, profiles,
  farm, settings, the device number) and hands it to the share sheet (js/printpage.ts sharePDF's way): Save to Files
  (iCloud Drive), Google Drive, Mail. A browser that cannot share files downloads it.
- Load a copy picks the file, checks it (format, size, every field as normalizeProfile expects), shows the children's
  names and the date, and asks before replacing what is on the device (never silently overwrites a child's save:
  CLAUDE.md, never assumed).
- Works offline; nothing is sent to the website.
- Checks: a unit test of the file format and the checker (bad, old, too large files refused); a browser check that saves,
  wipes the device, loads the file and finds the same progress; phone, tablet and computer screenshots.

## Part 2: The family code (made and shared inside the game; owner, 24 Oct 2026 AEDT)

Owner: "Family code don't involve Studio in here, users wouldn't know who I am as creator let alone contacting me to
get QR code and family code." So a family never needs the creator, Studio or the website to get a code:

- **Make it on the first device.** Grown-ups (behind the grown-up gate) gets "Family code · Mã gia đình". On the first
  device a grown-up taps "Make a family code · Tạo mã gia đình": the game makes a short random code by itself (no
  account, no name, no email) and shows it with a QR.
- **Add the other devices.** On each other device (a second tablet, the Safari tab and the Home Screen app on the same
  iPhone, a wiped phone) a grown-up taps "Join with a code · Nhập mã gia đình" and types the code or scans the QR shown
  on the first device.
- **Kept with the saves.** The code is stored with the device's saves and inside "Save a copy", so a device restored
  from its copy is in the family again without typing anything.
- **What it gives the family:** every device of the family shows the same family name and code in Grown-ups. (Sharing
  progress between devices is not part of this part.)
- **What it gives the owner:** the device's hello to the website carries a one-way hash of the code, never the code,
  the children's names or anything else new. Studio only reads it: it counts devices with the same hash as one family
  in Analytics (families, devices per family, a wiped device coming back). Studio never makes, shows or hands out codes.
- **Leaving:** "Leave the family · Rời gia đình" removes the code from the device.
- Privacy notice wording in English and Vietnamese, shown before the code is made, for the owner to approve first.
- Builds on the Family devices trial (js/familydevices.ts, netlify/lib/family-devices.mts).
- Checks: unit tests for the code, its hash and joining; a browser check that makes a code on one device, joins on a
  second, wipes one and rejoins from "Save a copy"; phone, tablet and computer screenshots in both languages.

## Order

Part 1 first (small, no server change), then Part 2. Each with its plan shown to the owner before building.

Short privacy wording approved and implementation included in v1.01 candidate (not deployed); QR scans to code text for copying/pasting into Join with a code, not a one-tap URL. See the v1.01 release report. Wording: [approved EN/VI copy](family-code-privacy-wording-v1.01.md) (24 October 2026 AEDT).
