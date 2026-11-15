"""Offline checks only. Never reads a key value or sends a Meshy request."""
from collections import Counter
import hashlib
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/meshy-production-20261107"
manifest = json.loads((OUT / "ASSET-MANIFEST.json").read_text())
assets = manifest["assets"]
assert len(assets) == 43 and len({a["id"] for a in assets}) == 43
assert [a["number"] for a in assets] == list(range(1, 44))
assert Counter(a["group"] for a in assets) == dict(A=4, B=11, C=6, D=2, E=6, F=10, G=4)
assert sum(a["plannedCredits"] for a in assets) == manifest["plannedCredits"] == 990
assert manifest["reserveCredits"] == 10
assert hashlib.sha256((OUT / manifest["planSource"]).read_bytes()).hexdigest() == manifest["planSHA256"]
assert all((OUT / a["prompt"]).is_file() for a in assets)
assert all((ROOT / a["conceptReference"]).is_file() for a in assets if a["conceptReference"])
assert len(next(a for a in assets if a["id"] == "firefly")["views"]) == 2
assert all(len(a["views"]) == 3 for a in assets if a["id"] != "firefly")
styles = {a['requiredStyleReference'] for a in assets}
reference_ready = all((OUT / s).is_file() for s in styles)
provenance = json.loads((OUT / 'REFERENCE-PROVENANCE.json').read_text())
assert provenance['userReferenceReceived']
assert hashlib.sha256((OUT / provenance['generatedStyleAnchor']).read_bytes()).hexdigest() == provenance['generatedStyleAnchorSHA256']
reviewed = sum(a["reviewStatus"] == "approved" for a in assets)
technical = sum(a['reviewStatus'] in ('technical_pass', 'approved') for a in assets)
turnarounds = sum((OUT / a["turnaround"]).is_file() for a in assets)
views = sum((OUT / v).is_file() for a in assets for v in a["separateViews"])
for a in assets:
    if a.get('viewCrops'):
        for view in a['viewCrops']:
            assert hashlib.sha256((OUT/view['path']).read_bytes()).hexdigest() == view['sha256']
blockers = []
if turnarounds != 43 or views != 128 or technical != 43:
    blockers.append('All 43 reference sheets and 128 views must pass technical review first.')
if not os.environ.get('MESHY_API_KEY'):
    blockers.append('MESHY_API_KEY must be bound securely; never paste it into chat or source.')
blockers.extend([
    'Verify actual account API balance, private settings and usable subscription entitlements.',
    'Web-app free retries are not assumed to apply to API tasks.',
    'Runner is offline-tested only; validate the authenticated Clara pilot before continuing.',
])
report = {
    "manifestValid": True, "assets": 43, "plannedCredits": 990, "reserveCredits": 10,
    "requiredStyleReferencePresent": reference_ready, "turnaroundsPresent": turnarounds,
    "separateViewsPresent": views, "requiredSeparateViews": sum(len(a["views"]) for a in assets),
    "assetsReviewedAndApproved": reviewed,
    "assetsTechnicallyReviewed": technical,
    "originalUserImageAvailableLocally": provenance['originalLocalFileAvailable'],
    "MeshyAPIKeyPresent": bool(os.environ.get("MESHY_API_KEY")),
    "keyValuePrinted": False, "paidCallsMadeByThisCheck": 0,
    "referenceGenerationReady": reference_ready,
    "paidSubmissionReady": False,
    "paidSubmissionBlockers": blockers,
}
(OUT / "READINESS.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
