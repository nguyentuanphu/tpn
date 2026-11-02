// Make the key pair for grown-ups' push notifications (v1.08 notifications). Run it once on your own computer:
//   node tools/make-vapid-keys.mts
// It prints three lines to paste into Netlify → Site configuration → Environment variables (never into the repo):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (secret) and VAPID_SUBJECT (a contact address for the push services).
// Then deploy again. Keep the same pair for good: a new pair means every device has to turn notifications on again.
import crypto from 'node:crypto';
const e = crypto.createECDH('prime256v1'); e.generateKeys();
console.log('VAPID_PUBLIC_KEY=' + e.getPublicKey().toString('base64url'));
console.log('VAPID_PRIVATE_KEY=' + e.getPrivateKey().toString('base64url'));
console.log('VAPID_SUBJECT=mailto:your-address@example.com');
