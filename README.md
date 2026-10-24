# TPN

An open-world 3D adventure for children aged 2 to 8, in **English and Vietnamese**. Each child plays as their own character with their own face photo. They explore a valley, solve thinking puzzles in shrines, grow a farm, play traditional Vietnamese games with the village kids, and follow a story.

It is a **standalone web app (PWA)**: it installs on the home screen of an iPhone or Android tablet, works offline after the first visit, and needs no account. Everything is saved on the device.

> Full project brief, design decisions and technical notes: see **[HANDOFF.md](HANDOFF.md)**. Paste that file into a new chat to continue the project.

## Play it on your devices

### 1. Put it online (once)
Choose **one** of these:

**A. GitHub Pages (free, updates automatically)**
1. Merge this work into the `main` branch.
2. On GitHub, open the repository → **Settings** → **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Wait about a minute. The address appears at the top of the Pages screen, for example `https://nguyentuanphu.github.io/tpn/`.

**B. Netlify Drop (free, drag and drop)**
1. Run `./build-netlify.sh` to get the `netlify-site/` folder with only the files the game needs.
2. Go to <https://app.netlify.com/drop> and drag the `netlify-site` folder (or the zip) onto the page.
3. You get a public web address straight away. Sign up (free) so the site isn't deleted after an hour; then you can rename it under **Site configuration → Change site name**.
4. To update later: open the site in Netlify → **Deploys** → drag the new folder onto the drop area.

### 2. Install on each device
- **iPhone / iPad:** open the address in **Safari** → tap **Share** → **Add to Home Screen**.
- **Android:** open the address in **Chrome** → tap **⋮** → **Install app** (or **Add to Home screen**).

Open it once while online so it can save itself for offline play.

### 3. Set up (grown-ups)
On the "Who's playing?" screen, **press and hold** the **Grown-ups** button (bottom left) to:
- add players (up to 6) with a face photo, age (Little or Big kid), and difficulty (Easy, Medium or Hard)
- choose the language (English or Tiếng Việt), the money (AUD or VND) and the voices
- record your own voice for the game's most-used lines
- save or open a backup file to move progress between devices

**Make the voice sound natural:** install a high-quality voice on the device.
- iPhone: **Settings → Accessibility → Spoken Content → Voices** → English / Vietnamese → choose an **Enhanced** or **Premium** voice.
- Android: **Settings → Text-to-speech output → Google → Install voice data** → English / Vietnamese.

### Updating
When new code is pushed, devices pick it up the next time the app is opened online (sometimes it takes two opens). Bump `VERSION` in `sw.js` with every change so devices know there is something new.

## Run it on a computer
```bash
python3 -m http.server 8765
# then open http://localhost:8765
```
Keyboard: WASD or arrows to move, Space jump (press again in the air to glide), Shift run, E act, Q/R turn the camera, Tab for the Sparkle Pad. Player 2 in split screen: arrows, `/` jump, `.` act, `,` run, `[` `]` camera. Game controllers work too.

## Licences
- three.js (MIT), PeerJS (MIT): bundled in `vendor/`.
- Fonts Fredoka and Baloo 2 (SIL Open Font License): bundled in `fonts/`.
- All music and sound effects are generated in code. The children's songs used ("Old MacDonald", "Row, Row, Row Your Boat", "Twinkle Twinkle", "Kìa con bướm vàng"/"Frère Jacques") are traditional and in the public domain.
