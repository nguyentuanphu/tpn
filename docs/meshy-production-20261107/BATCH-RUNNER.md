# Running the paid 3D batch later

The runner is implemented and tested offline. It has not been exercised against an authenticated Meshy account. No paid task, subscription or raw model is claimed as completed.

## Before submitting

1. Review the [43 sheets](GALLERY.md) and their separate views. The ledger distinguishes technical review from owner approval. Keep the original grey-background references; the transparent Sol variant is separate.
2. Check the actual account's usable API credit balance, private/customer-owned settings and current prices. [Official verification](OFFICIAL-MESHY-VERIFICATION.md) records the public documentation. A Pro subscription alone does not establish this account's API balance. Web-app free retries are not implemented as API retries.
3. Bind `MESHY_API_KEY` securely in environment settings. Never put it in chat, source, account metadata or a command argument.
4. Create an account metadata JSON file **outside the repository**, containing `verifiedAt` as an actual ISO timestamp with timezone, `sameAccountAsKey`, `privateAssetsConfirmed`, `apiCreditBalanceConfirmed`, `pricingConfirmed` as true only after verification, and `batchStartingAPIBalance` as the actual starting API balance (at least 1000 for this batch). Set `claraPilotAccepted` false initially. This is a manual verification record, not proof obtained automatically from the provider.
5. Choose one durable SQLite journal outside the repository and reuse it for every command. Back it up privately. It holds task IDs, results and signed download URLs, so never commit it. The JSON credit ledger in this folder is the initial planning ledger; the live SQLite journal becomes the submission record.

## Commands

Run from the repo root. These example paths are outside the checkout; replace them with your actual private files. Do not include a key in these commands.

```sh
python tools/meshy/run_batch.py plan
python tools/meshy/run_batch.py submit --asset clara --journal /workspace/meshy-jobs.sqlite3 --account /workspace/meshy-account.json
python tools/meshy/run_batch.py poll --asset clara --journal /workspace/meshy-jobs.sqlite3
python tools/meshy/run_batch.py download --asset clara --journal /workspace/meshy-jobs.sqlite3 --raw-root /workspace/meshy-raw
```

`plan` is offline and needs no credentials. `submit` makes exactly one POST for one asset. `poll` makes one GET; repeat polling manually as needed. `download` uses the returned GLB URL on `assets.meshy.ai`, without an Authorization header, and refuses to overwrite a raw file or write into the game repo. A different official download host needs verification before updating the allowlist.

Inspect the Clara pilot's geometry/textures before setting `claraPilotAccepted` true in account metadata. Continue one asset at a time in manifest order A → G. Reference budget: 23 × 30 + 20 × 15 = 990 credits; 10 remain reserved. Alternate texture models, Ultra geometry, extra jobs and paid retries are outside this runner's configuration.

## Lost responses and failures

The runner commits an `ambiguous` reservation **before** sending the POST. Successful responses attach a task ID. A crash, timeout, HTTP error or unrecognized response leaves the reservation in place and blocks further submissions. It never repeats a POST automatically. Failed tasks retain their reserved cost; the runner does not assume a refund or free retry.

Use the account dashboard/request log to identify the exact submitted task and compare asset inputs, model tier, request time and charge. After independently matching it, attach its ID with:

```sh
python tools/meshy/run_batch.py attach --asset clara --task-id VERIFIED_TASK_ID --confirmed-task-matches --journal /workspace/meshy-jobs.sqlite3
```

This performs a GET and records the known task. The flag records the operator's matching decision; it does not automatically prove identity. If the submission cannot be matched, stop and resolve it with Meshy. Do not delete the reservation or start a new journal to bypass it. The no-duplicate guarantee applies to this journal, not tasks submitted in a different journal, another machine or the web app.

## After download

Raw GLBs are not runtime replacements. Use [v1.08 compatibility notes](V108-COMPATIBILITY.md): obtain/recreate the external people-fitting workflow, mark joints, preserve skin/material/face conventions, build light/high-detail versions, prove puppy fitting before other animals, and rig the companions. Validate size, animation, dressing, riding, skin tones, save compatibility, offline fallbacks and phone/tablet/desktop output. No deployment or version change is included.

Offline verification: `python tools/meshy/test_batch.py` covers duplicate prevention, lost-response persistence, budget/reserve limits, changed inputs, account/pilot gates and safe raw-output paths. It does not validate Meshy account access or the quality of any new 3D model.

## Farm cloud exception — owner, 13 Nov 2026 AEDT

Only cow, sheep and chicken may carry `tierOverride: "meshy-7.1"`, `plannedCredits: 30`
and an `approval` reason. Submission requires the asset ID in the private metadata's
`approvedTierOverrides` and `creditCap: 120`. This trial bypasses the old Clara pilot and
1000-credit batch minimum, retaining the 10-credit reserve. Other assets keep their tiers
and prices. See [farm handoff](../meshy-farm-cloud/HANDOFF.md) for per-POST approvals.
