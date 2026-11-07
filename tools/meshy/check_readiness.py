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
style = OUT / "reference-images/style/clara-young-2.webp"
reference_ready = style.is_file()
reviewed = sum(a["reviewStatus"] == "approved" for a in assets)
turnarounds = sum((OUT / a["turnaround"]).is_file() for a in assets)
views = sum((OUT / v).is_file() for a in assets for v in a["separateViews"])
report = {
    "manifestValid": True, "assets": 43, "plannedCredits": 990, "reserveCredits": 10,
    "requiredStyleReferencePresent": reference_ready, "turnaroundsPresent": turnarounds,
    "separateViewsPresent": views, "requiredSeparateViews": sum(len(a["views"]) for a in assets),
    "assetsReviewedAndApproved": reviewed,
    "MeshyAPIKeyPresent": bool(os.environ.get("MESHY_API_KEY")),
    "keyValuePrinted": False, "paidCallsMadeByThisCheck": 0,
    "referenceGenerationReady": reference_ready,
    "paidSubmissionReady": False,
    "paidSubmissionBlockers": [
        "All43reference sheets/views must exist and pass review first.",
        "Confirm current official pricing, model IDs and multi-image API contract.",
        "Verify account/private settings and claimed retry entitlements; do not assume web retries apply to API.",
        "Use a secure binding and a reviewed credit ledger; the old make-3d.py is not this batch runner.",
    ],
}
(OUT / "READINESS.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
