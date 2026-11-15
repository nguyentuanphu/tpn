"""Prepare the owner's reference pack. Offline only: never generates images or submits paid jobs."""
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/meshy-production-20261107"
existing = OUT / "ASSET-MANIFEST.json"
if existing.exists():
    previous = json.loads(existing.read_text())
    progressed = (previous.get("MeshySpend", 0) != 0 or
                  any(a.get("meshyTaskId") or a.get("referenceStatus") != "blocked_missing_style_reference"
                      for a in previous.get("assets", [])) or
                  (OUT / "reference-images").exists())
    if progressed:
        raise SystemExit("Production has progressed: preserve its ledger; do not regenerate/reset status.")
raw = (OUT / "OWNER-PRODUCTION-PLAN.md").read_text()
section = raw.split("## 3.", 1)[1].split("## 4.", 1)[0]
starts = list(re.finditer(r"(?m)^(\d+)\. \*\*([^*]+)\*\*([^\n]*)", section))
assert len(starts) == 43
slugs = "clara finn sol lumi mai ba teo ti bong su jack mit bom ruby lan puppy kitty bunny panda joey calf dragon firefly chicken cow sheep pig buffalo bull bear unicorn koala emu platypus elephant penguin turtle peacock crane vn-aodai vn-dad au-dad au-mum".split()

style = raw.split("### STYLE block", 1)[1].split("### Then", 1)[0]
style = "\n".join(line[2:] if line.startswith("> ") else line
                  for line in style.splitlines()[2:]).strip()
(OUT / "STYLE-PROMPT.txt").write_text(style + "\n")
(OUT / "prompts").mkdir(exist_ok=True)
poses = {
    20: "Upright on hind legs; forepaws separate and visible; tail on ground.",
    22: "Standing on hind legs; empty forepaws visible; folded wings clearly separate from torso.",
    23: "Only front and top views, at matching scale; all four translucent wings and antennae visible. Floating neutral pose; no ground shadow.",
    24: "Standing on two legs; wings folded, beak closed; both legs and feet visible.",
    30: "Upright relaxed A-pose; open empty paws, glasses and apron worn; no held props.",
    33: "Standing on two legs; wings folded, beak closed; both legs and feet visible.",
    36: "Standing upright on two feet; flippers clearly separated from torso.",
    37: "Neutral sea-turtle pose, all four flippers and tail visible; no mammal paws.",
    38: "Standing on two legs; tail feathers folded but fully visible.",
    39: "Standing on two straight legs; wings folded, beak closed.",
}
assets = []
for index, match in enumerate(starts):
    number = int(match.group(1))
    end = starts[index + 1].start() if index + 1 < len(starts) else len(section)
    block = section[match.start():end].split("\n\n", 1)[0].strip()
    description = re.sub(r"^\d+\.\s*", "", block).replace("**", "")
    group = next(g for limit, g in [(4, "A"), (15, "B"), (21, "C"), (23, "D"),
                                   (29, "E"), (39, "F"), (43, "G")] if number <= limit)
    slug = slugs[index]
    humanoid = group in ["A", "B", "G"]
    cost = 30 if group in ["A", "B", "C", "D"] else 15
    default_pose = ("Relaxed standing A-pose, hands empty/open and clear of torso, feet flat."
                    if humanoid else "Neutral quadruped stance; all four legs, paws and tail visible and separated.")
    pose = poses.get(number, default_pose)
    views = ["front", "top"] if number == 23 else ["front", "left-side", "back"]
    prompt = (
        f"{style}\n\nASSET {number:02d}: {description}\n\n"
        f"Species-specific pose (takes precedence over the generic pose rule): {pose}\n"
        "All views depict the same individual, clothes, proportions and colours. "
        "No perspective-size changes, duplicate limbs, pedestal, detached accessories or text. "
        "Worn accessories remain attached; hands/paws hold nothing. "
        "Keep fabric/fur detail stylized; individual hair/fur strands are not required for the game.\n"
    )
    if number == 23:
        prompt += "Only two views, front and top; replace the generic three-view layout.\n"
    prompt_path = OUT / "prompts" / f"{number:02d}-{slug}.txt"
    prompt_path.write_text(prompt)
    concept = f"docs/characters-v108/concept-{slug}.png" if number in [2, 3, 4] else None
    if group == "A":
        model = f"models/{slug}.glb"
    elif group in ["B", "G"]:
        model = f"models/villager-{slug}.glb"
    else:
        model = f"models/world/creature-{slug}.glb"
    assets.append({
        "number": number, "id": slug, "name": match.group(2), "group": group,
        "description": description, "kind": "humanoid" if humanoid else "creature",
        "pose": pose, "views": views,
        "modelInOwnerPlan": "Meshy 7.1" if cost == 30 else "Meshy 6 Lite",
        "plannedCredits": cost, "pricingVerified": False, "runtimeModelPath": model,
        "conceptReference": concept,
        "requiredStyleReference": "reference-images/style/clara-young-2.webp",
        "prompt": prompt_path.relative_to(OUT).as_posix(),
        "turnaround": f"reference-images/{number:02d}-{slug}/turnaround.png",
        "separateViews": [f"reference-images/{number:02d}-{slug}/{v}.png" for v in views],
        "referenceStatus": "blocked_missing_style_reference", "reviewStatus": "not_started",
        "meshyTaskId": None, "modelStatus": "not_submitted",
    })

assert [a["number"] for a in assets] == list(range(1, 44))
assert len({a["id"] for a in assets}) == 43
total = sum(a["plannedCredits"] for a in assets)
assert total == 990
manifest = {
    "schemaVersion": 1, "planSource": "OWNER-PRODUCTION-PLAN.md",
    "planSHA256": hashlib.sha256(raw.encode()).hexdigest(),
    "reviewedIntegrationSource": subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
    "phase": "prepare_references_first", "styleReferenceAvailable": False,
    "creditsAvailableInOwnerPlan": 1000, "plannedCredits": total,
    "reserveCredits": 1000 - total, "generationServicesCalled": False,
    "MeshySpend": 0, "assets": assets,
}
(OUT / "ASSET-MANIFEST.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
table = "".join(
    f"| {a['number']:02d} | {a['name']} | {a['group']} | {a['modelInOwnerPlan']} | {a['plannedCredits']} | Pending style reference |\n"
    for a in assets)
(OUT / "ASSETS.md").write_text(
    "# The 43 assets\n\nPrompts prepared; images await the required young-Clara style reference. "
    "No Meshy tasks submitted or credits spent. Prices are assumptions copied from the owner plan, not independently verified.\n\n"
    "| No. | Asset | Group | Model in plan | Planned credits | Reference status |\n"
    "|---|---|---|---|---:|---|\n" + table +
    "\nTotal: 43 assets, 990 planned credits, 10 reserve. Species-specific pose exceptions are explicit in the manifest and prompts.\n")
print(json.dumps({"assets": 43, "plannedCredits": total, "reserve": 1000-total,
                  "prompts": len(list((OUT / 'prompts').glob('*.txt'))), "styleMissing": True}))
