// Capture release evidence screenshots for Stage 1 r88 integration
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const OUT = path.join(REPO, 'evidence', 'release');
fs.mkdirSync(OUT, { recursive: true });

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mts': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/home' || urlPath.startsWith('/home/')) {
    const homeHtml = path.join(REPO, 'home', 'index.html');
    if (fs.existsSync(homeHtml) && !urlPath.includes('.')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(homeHtml).pipe(res);
      return;
    }
  }
  if (urlPath === '/' || urlPath.endsWith('/')) urlPath += 'index.html';
  const filePath = path.join(REPO, urlPath);
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(indexPath).pipe(res);
      return;
    }
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise(res => server.listen(8765, '127.0.0.1', res));
console.log('Static server started at http://127.0.0.1:8765/');

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']
});

try {
  // 1. Integrated game on desktop
  console.log('Capturing desktop valley...');
  const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const desktopPage = await desktopCtx.newPage();
  await desktopPage.addInitScript(() => {
    localStorage.setItem('sv2_settings', JSON.stringify({ lang: 'en', voice: false, sound: false, music: false, quality: 'low', online: false }));
    localStorage.setItem('sv2_profiles', JSON.stringify([{ id: 'kna', name: 'Bé Na', age: 'little', difficulty: 'easy' }]));
  });
  await desktopPage.goto('http://127.0.0.1:8765/');
  await desktopPage.waitForTimeout(3000);
  await desktopPage.screenshot({ path: path.join(OUT, 'desktop-integrated-game.png') });
  await desktopCtx.close();

  // 2. Kid-UI Autoplay bar on mobile
  console.log('Capturing mobile Kid-UI autoplay...');
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.addInitScript(() => {
    localStorage.setItem('sv2_settings', JSON.stringify({ lang: 'en', voice: false, sound: false, music: false, quality: 'low', online: false, autoplay: true }));
    localStorage.setItem('sv2_profiles', JSON.stringify([{ id: 'kna', name: 'Bé Na', age: 'little', difficulty: 'easy' }]));
  });
  await mobilePage.goto('http://127.0.0.1:8765/');
  await mobilePage.waitForTimeout(3000);
  // Try to toggle autoplay UI or inspect
  await mobilePage.evaluate(() => {
    const bar = document.querySelector('.ap-float') || document.querySelector('.autoplay-bar');
    if (bar) bar.scrollIntoView();
  });
  await mobilePage.screenshot({ path: path.join(OUT, 'mobile-kid-ui-autoplay.png') });
  await mobileCtx.close();

  // 3. Tablet view
  console.log('Capturing tablet view...');
  const tabletCtx = await browser.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true });
  const tabletPage = await tabletCtx.newPage();
  await tabletPage.addInitScript(() => {
    localStorage.setItem('sv2_settings', JSON.stringify({ lang: 'en', voice: false, sound: false, music: false, quality: 'low', online: false }));
    localStorage.setItem('sv2_profiles', JSON.stringify([{ id: 'kna', name: 'Bé Na', age: 'little', difficulty: 'easy' }]));
  });
  await tabletPage.goto('http://127.0.0.1:8765/');
  await tabletPage.waitForTimeout(3000);
  await tabletPage.screenshot({ path: path.join(OUT, 'tablet-integrated-game.png') });
  await tabletCtx.close();

  // 4. Studio bot panel
  console.log('Capturing Studio bot panel...');
  const studioCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const studioPage = await studioCtx.newPage();
  await studioPage.goto('http://127.0.0.1:8765/studio/');
  await studioPage.waitForTimeout(3000);
  await studioPage.screenshot({ path: path.join(OUT, 'studio-bot-panel.png') });
  await studioCtx.close();

  // 5. Parent website: Desktop (EN & VI)
  console.log('Capturing parent website desktop (EN & VI)...');
  const webDeskCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const webDeskPage = await webDeskCtx.newPage();
  await webDeskPage.goto('http://127.0.0.1:8765/home');
  await webDeskPage.waitForTimeout(1500);
  await webDeskPage.screenshot({ path: path.join(OUT, 'website-desktop-en.png') });

  // Toggle VI via #lang
  const viBtn = await webDeskPage.$('#lang');
  if (viBtn) {
    await viBtn.click();
    await webDeskPage.waitForTimeout(800);
    await webDeskPage.screenshot({ path: path.join(OUT, 'website-desktop-vi.png') });
  }
  await webDeskCtx.close();

  // 6. Parent website: Tablet (EN & VI, Portrait & Landscape)
  console.log('Capturing parent website tablet (portrait & landscape)...');
  const webTabCtx = await browser.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true });
  const webTabPage = await webTabCtx.newPage();
  await webTabPage.goto('http://127.0.0.1:8765/home');
  await webTabPage.waitForTimeout(1500);
  await webTabPage.screenshot({ path: path.join(OUT, 'website-tablet-en.png') });
  const viTabBtn = await webTabPage.$('#lang');
  if (viTabBtn) {
    await viTabBtn.click();
    await webTabPage.waitForTimeout(800);
    await webTabPage.screenshot({ path: path.join(OUT, 'website-tablet-vi.png') });
  }
  await webTabCtx.close();

  const webTabLandCtx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true });
  const webTabLandPage = await webTabLandCtx.newPage();
  await webTabLandPage.goto('http://127.0.0.1:8765/home');
  await webTabLandPage.waitForTimeout(1500);
  await webTabLandPage.screenshot({ path: path.join(OUT, 'website-tablet-landscape-en.png') });
  const viTabLandBtn = await webTabLandPage.$('#lang');
  if (viTabLandBtn) {
    await viTabLandBtn.click();
    await webTabLandPage.waitForTimeout(800);
    await webTabLandPage.screenshot({ path: path.join(OUT, 'website-tablet-landscape-vi.png') });
  }
  await webTabLandCtx.close();

  // 7. Parent website: Mobile (EN & VI, Portrait & Landscape)
  console.log('Capturing parent website mobile (portrait & landscape)...');
  const webMobCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const webMobPage = await webMobCtx.newPage();
  await webMobPage.goto('http://127.0.0.1:8765/home');
  await webMobPage.waitForTimeout(1500);
  await webMobPage.screenshot({ path: path.join(OUT, 'website-mobile-en.png') });
  const viMobBtn = await webMobPage.$('#lang');
  if (viMobBtn) {
    await viMobBtn.click();
    await webMobPage.waitForTimeout(800);
    await webMobPage.screenshot({ path: path.join(OUT, 'website-mobile-vi.png') });
  }
  await webMobCtx.close();

  const webMobLandCtx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const webMobLandPage = await webMobLandCtx.newPage();
  await webMobLandPage.goto('http://127.0.0.1:8765/home');
  await webMobLandPage.waitForTimeout(1500);
  await webMobLandPage.screenshot({ path: path.join(OUT, 'website-mobile-landscape-en.png') });
  const viMobLandBtn = await webMobLandPage.$('#lang');
  if (viMobLandBtn) {
    await viMobLandBtn.click();
    await webMobLandPage.waitForTimeout(800);
    await webMobLandPage.screenshot({ path: path.join(OUT, 'website-mobile-landscape-vi.png') });
  }
  await webMobLandCtx.close();

  console.log('All screenshots captured successfully under evidence/release/');
} finally {
  await browser.close();
  server.close();
}
