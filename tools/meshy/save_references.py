"""Persist generator records and crop reviewed sheets. No image generation or API calls.

Cropping is explicitly requested in OWNER-PRODUCTION-PLAN.md. Originals stay intact.
Records contain id, hint (generator local output path), and exact prompt.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/meshy-production-20261107'

def main():
    global OUT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack',type=Path,default=OUT)
    parser.add_argument('--records', type=Path)
    parser.add_argument('--crop-reviewed', action='store_true')
    args = parser.parse_args()
    OUT = args.pack.resolve()
    if not OUT.is_relative_to(ROOT/'docs'):
        raise ValueError('Reference pack must live under repository docs')
    path = OUT / 'ASSET-MANIFEST.json'
    manifest = json.loads(path.read_text())
    assets = {a['id']: a for a in manifest['assets']}
    if args.records:
        for record in json.loads(args.records.read_text()):
            a = assets[record['id']]
            source = Path(re.search(r'/workspace/generated_images/exec-[\w-]+\.png', record['hint'])[0])
            target = OUT / a['turnaround']
            target.parent.mkdir(parents=True, exist_ok=True)
            previous = record.get('previousGeneration')
            while previous:
                old_source = Path(re.search(r'/workspace/generated_images/exec-[\w-]+\.png',previous['hint'])[0])
                old_digest = hashlib.sha256(old_source.read_bytes()).hexdigest()
                old_target = target.with_name('attempt-'+old_digest[:12]+'.png')
                if not old_target.exists():
                    shutil.copy2(old_source,old_target)
                previous = previous.get('previousGeneration')
            digest = hashlib.sha256(source.read_bytes()).hexdigest()
            if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() != digest:
                backup = target.with_name('attempt-' + hashlib.sha256(target.read_bytes()).hexdigest()[:12] + '.png')
                shutil.copy2(target, backup)
                a['reviewStatus'] = 'not_started'
                a['separateViewStatus'] = 'stale'
                a.pop('viewCrops',None)
                a.pop('cropBoundaries',None)
            shutil.copy2(source, target)
            (target.parent / 'generation.json').write_text(json.dumps(record, indent=2) + '\n')
            a.update(referenceStatus='generated', sourceGenerationFile=str(source), turnaroundSHA256=digest)
    if args.crop_reviewed:
        from PIL import Image
        for a in assets.values():
            if a['reviewStatus'] != 'technical_pass':
                continue
            source = OUT / a['turnaround']
            with Image.open(source) as image:
                w, h = image.size
                boundaries = a.get('cropBoundaries')
                if boundaries is None:
                    raise ValueError(f"Review crop boundaries first: {a['id']}")
                assert boundaries[0] == 0 and boundaries[-1] == w
                assert len(boundaries) == len(a['views']) + 1
                assert all(x < y for x, y in zip(boundaries, boundaries[1:]))
                crops = []
                for i, view in enumerate(a['separateViews']):
                    box = (boundaries[i], 0, boundaries[i+1], h)
                    image.crop(box).save(OUT / view)
                    crops.append({'path': view, 'box': box, 'sha256': hashlib.sha256((OUT/view).read_bytes()).hexdigest()})
                a['viewCrops'] = crops
                a['separateViewStatus'] = 'current'
    path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'turnarounds': sum((OUT/a['turnaround']).exists() for a in assets.values()),
                      'viewCrops': sum((OUT/v).exists() for a in assets.values() for v in a['separateViews'])}))

if __name__ == '__main__':
    main()
