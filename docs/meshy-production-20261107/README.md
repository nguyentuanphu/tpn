# Sparkle Valley: Meshy production

7 November 2026 AEDT. Branch `meshy-production-20261107`, based on undeployed `integrate/v108` at `d51e062e5894a2229bd62e7b429dec87a9787a8f`. The owner explicitly asked to proceed with the attached production plan. Its reference-image phase comes first; no generation or paid task is claimed as complete here.

## Current state

- The original [owner plan](OWNER-PRODUCTION-PLAN.md) is preserved unchanged.
- [43 assets](ASSETS.md) and individual prompts are prepared; ASSET-MANIFEST.json records intended runtime destinations, species-specific poses, references, reviews and task status.
- Budget arithmetic matches the supplied plan:23assets at30credits plus20at15credits =990, leaving10of1,000. Current prices, model IDs and retry/private entitlements have not been independently verified.
- **Required image missing:** `clara/clara-young-2.webp`. It is not attached or present in the checked repository. All43sheets must match this reference; the existing game Clara render has not been substituted.
- Image generation0; approved sheets0; separate views0of128; Meshy jobs0; credits spent0.
- MESHY_API_KEY is not bound in this environment. That affects the later paid phase, not preparation of the reference prompts. Never paste the key into chat or source.

[Readiness report](READINESS.json) · [v1.08 compatibility](V108-COMPATIBILITY.md) · [Execution and review steps](NEXT-STEPS.md).

The supplied plan's STYLE block asks for a4–9art brief. This is a reference-art instruction; the game's existing age/accessibility rules are not changed by preparing it.

## Tools

`python tools/meshy/check_readiness.py` validates the roster, group counts,990credit arithmetic, input-plan hash, prompt paths, concept references and image/review availability without a network call. It never reads or prints a credential value and never submits a paid task.

`python tools/meshy/prepare_references.py` builds the initial prompt pack. It refuses to overwrite a progressed production ledger or an existing reference-image directory. Do not rerun it to reset approvals, spending or task IDs.

The old `tools/blender/make-3d.py` is **not** this43asset batch runner. It defaults to five older concepts, one image per job and `ai_model=latest`. Do not run it unchanged against this budget.

No runtime model was overwritten; no source game behaviour, subscription, payment, main merge or deployment was changed.
