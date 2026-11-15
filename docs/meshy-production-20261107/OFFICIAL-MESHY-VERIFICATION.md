# Official Meshy documentation verification

Checked 7 November 2026 AEDT. Public documentation, no authenticated requests or paid calls.

Sources: https://docs.meshy.ai/en/api/multi-image-to-3d ; https://docs.meshy.ai/en/api/pricing ; https://www.meshy.ai/pricing

- POST https://api.meshy.ai/openapi/v1/multi-image-to-3d accepts 1–4 image URLs or data URIs. First view is front for meshy-7.1.
- Explicit generation model IDs: meshy-7.1 and meshy-6-lite. Do not use latest.
- Standard geometry, textures enabled, default texture model, 2K textures: 30 credits for meshy-7.1 and 15 for meshy-6-lite. The owner budget arithmetic remains 990 credits plus 10 reserve.
- geometry_resolution=standard is distinct from texture_resolution=2k. Ultra geometry adds a surcharge; do not select it for this budget.
- Each input JPG/PNG/WebP must be at most 20 MB, at least 32 pixels per side. Up to 4 views; firefly has 2.
- Official API pricing says API uses prepaid credits. Pro membership and its displayed monthly credit allowance do not establish this account's usable API balance. Confirm in the actual account before submitting.
- Pro comparison lists private/customer-owned assets and 4 free retries for each task specifically in the WEB APP. API retry entitlement was not established. Never implement automatic paid POST retries.
- API reference and pricing prose differ about texture-model cost implications. Use the default texture model and the explicit pricing table. Do not introduce alternate texture models.
- No evidence of account membership, current balance, private settings or credentials is available here. No subscription purchase has occurred.

Original owner plan is retained unchanged. This verification supplements its assumptions; it does not assert access to the account.

## Pose and image enhancement

The multi-image reference documents pose_mode as an empty string for no forced pose. The job specifications set it explicitly. image_enhancement defaults to true for supported models, so meshy-7.1 jobs explicitly set it false to preserve the reviewed artwork. Meshy 6 Lite rejects this field with HTTP 400, even when false; Lite jobs omit it. Do not copy unsupported parameters from one tier to the other.
