// Sparkle Valley checks: The family website content, captures and art.
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { contentProgressCheck, contentWebsiteCheck, contentVoiceCheck, contentArtCheck, contentPairCheck, contentCaptureCheck, open, check, b } from './shared.mts';

await check('contentcaptures', async () => contentCaptureCheck(b));

await check('contentpair', async () => contentPairCheck(b));

await check('contentvoice', async () => contentVoiceCheck(b));

await check('contentprogress', async () => contentProgressCheck(b));

await check('contentwebsite', async () => contentWebsiteCheck(b));

await check('contentart', async () => contentArtCheck(b));

await check('familyuiart', async () => (await import('../family-ui-art.mts')).familyUIArtCheck(b));

// (r89, owner 23 Oct AEDT) the family website: Welcome and Settings open it floating over the game, the corner Home button
// is gone and the goal row moved up into its space (tests/website-float.mts)
await check('website', async () => (await import('../website-float.mts')).websiteCheck(b));
