"""Build an offline review gallery and Meshy job specifications; never submits jobs."""
import hashlib
import html
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/meshy-production-20261107'

def main():
    manifest = json.loads((OUT/'ASSET-MANIFEST.json').read_text())
    jobs = OUT/'job-specifications'
    jobs.mkdir(exist_ok=True)
    cards, markdown, ledger = [], ['# Character and creature reference gallery', '',
        '43 generated sheets and 128 separate views. Technical reference review complete; final owner review pending. These are pictures, not new 3D models. Tap a picture to open it and zoom.', ''], []
    for a in manifest['assets']:
        assert a['reviewStatus'] == 'technical_pass', a['id']
        images = []
        for i, v in enumerate(a['separateViews']):
            path = OUT/v
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            assert digest == a['viewCrops'][i]['sha256']
            with Image.open(path) as im:
                assert min(im.size) >= 32 and path.stat().st_size <= 20*1024*1024
            images.append({'view': a['views'][i], 'localPath': v, 'sha256': digest})
        parameters = {'ai_model': 'meshy-7.1' if a['group'] in 'ABCD' else 'meshy-6-lite',
            'geometry_resolution': 'standard', 'should_texture': True,
            'texture_resolution': '2k', 'enable_pbr': False, 'pose_mode': '', 'target_formats': ['glb']}
        if parameters['ai_model']=='meshy-7.1':
            parameters['image_enhancement']=False
        spec = {'assetId': a['id'], 'group': a['group'], 'endpoint': 'https://api.meshy.ai/openapi/v1/multi-image-to-3d',
            'method': 'POST', 'parameters': parameters, 'inputImages': images,
            'transportNote': 'Runner must populate image_urls with public URLs or data URIs in this order. Local paths are not accepted by the API.',
            'plannedCredits': a['plannedCredits'], 'submitted': False, 'taskId': None,
            'accountVerified': False, 'privateSettingsVerified': False,
            'rawDownloadDestination': f"raw-models/{a['group']}/{a['id']}.glb",
            'runtimeDestinationAfterFittingAndValidation': a['runtimeModelPath']}
        (jobs/f"{a['number']:02d}-{a['id']}.json").write_text(json.dumps(spec, indent=2)+'\n')
        ledger.append({'assetId':a['id'], 'plannedCredits':a['plannedCredits'], 'reservedCredits':0,
            'chargedCredits':0, 'taskId':None, 'state':'not_submitted'})
        title = f"{a['number']:02d}. {a['name']}"
        links = ' · '.join(f'[{v}]({p})' for v,p in zip(a['views'],a['separateViews']))
        markdown.extend([f'## {title}', '', f'![{title} turnaround]({a["turnaround"]})', '', links, ''])
        views = ''.join(f'<a href="{html.escape(p)}"><img loading="lazy" src="{html.escape(p)}" alt="{html.escape(a["name"])} {v}"><span>{v}</span></a>' for v,p in zip(a['views'],a['separateViews']))
        cards.append(f'<article id="{a["id"]}"><h2>{html.escape(title)}</h2><p>Group {a["group"]} · {a["plannedCredits"]} planned credits · technical review passed</p><a href="{a["turnaround"]}"><img class="sheet" loading="lazy" src="{a["turnaround"]}" alt="{html.escape(title)} full turnaround"></a><div class="views">{views}</div></article>')
    ledger_path = OUT/'CREDIT-LEDGER.json'
    if not ledger_path.exists():
        ledger_path.write_text(json.dumps({'budget':1000,'planned':990,'reserve':10,'charged':0,'entries':ledger},indent=2)+'\n')
    (OUT/'GALLERY.md').write_text('\n'.join(markdown))
    page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sparkle Valley reference review</title><style>
    *{box-sizing:border-box}body{margin:0;background:#faf7f1;color:#302a24;font:16px/1.5 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:20px}h1{font-size:28px}h2{font-size:22px;margin:0}article{background:white;border:1px solid #ded8cd;border-radius:16px;padding:16px;margin:24px 0}article p{color:#625a51}.sheet{display:block;width:100%;height:auto;border-radius:10px}.views{display:flex;gap:12px;margin-top:16px}.views a{flex:1;min-width:0;color:#3c5540;text-align:center;min-height:44px}.views img{display:block;width:100%;height:260px;object-fit:contain;background:#eee}.views span{display:block;padding:10px}a:focus-visible{outline:3px solid #285d40}@media(max-width:600px){main{padding:12px}article{padding:10px}.views{gap:6px}.views img{height:170px}h1{font-size:24px}}
    </style><main><h1>Sparkle Valley character reference review</h1><p>43 sheets · 128 separate views. Tap any picture to open and zoom. These are reference images; new 3D models have not been generated or deployed.</p><p>Technical image review complete. Final owner review remains pending. Sol's transparent variant is linked below; grey-background originals remain the production inputs.</p><p><a href="reference-images/03-sol/turnaround-transparent.png">Sol transparent turnaround</a> · <a href="CURRENT-STATUS.md">Production status</a></p>'''
    (OUT/'gallery.html').write_text(page+'\n'.join(cards)+'</main></html>')
    print(json.dumps({'jobSpecifications':43,'galleryCards':len(cards),'viewInputs':sum(len(a['views']) for a in manifest['assets']),'paidCalls':0}))

if __name__ == '__main__':
    main()
