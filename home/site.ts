// (v1.08c) the page script itself (home/page.ts) runs first: it was an inline script that ran before this module
import { startPage } from './page.js';
import {setupWebsiteFestivals} from './festivals.js';
import {setupLaunchBanner} from './launch.js';
import { setupWhatsNew } from './whatsnew.js'; // (v1.08b story) What's new strip and the Calendar part
// (r89) first-party visit counts for the standalone family website (/home), on by default (owner, 23 Oct AEDT), never
// inside the game's floating view (a child's device). The page itself is tools/build-website.mts's; the counting is
// home/analytics.ts, the same allowlisted events netlify/functions/parent-analytics.mts accepts. No names, family
// content, typed text or full addresses are sent.
import { consent, startAnalytics, track } from './analytics.js';

const embedded = new URLSearchParams(location.search).get('embed') === '1' && window.parent !== window;
declare global { interface Window { svWebsitePlay?: () => void } }

if (!embedded) {
  window.svWebsitePlay = () => track('play_conversion', '/');
  if (consent() !== 'no') startAnalytics('/');
}

startPage();
setupWebsiteFestivals();
setupLaunchBanner();
setupWhatsNew();
