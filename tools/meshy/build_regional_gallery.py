"""Build the regional reference gallery; no paid-model budget or runtime mapping implied."""
import hashlib
import html
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/meshy-regional-40-100'

def main():
    manifest=json.loads((OUT/'ASSET-MANIFEST.json').read_text())
    assert len(manifest['assets'])==61
    assert [a['number'] for a in manifest['assets']]==list(range(40,101))
    assert hashlib.sha256((OUT/manifest['source']).read_bytes()).hexdigest()==manifest['sourceSHA256']
    cards=[]
    md=['# Regional reference gallery','','61 additional sheets from owner messages 40–100. Original 43-reference pack is preserved separately. These are pictures, not new runtime models. Technical review status is shown per item; owner review is separate.','']
    generated=views=reviewed=0
    for a in manifest['assets']:
        source=OUT/a['turnaround']
        if not source.exists():continue
        with Image.open(source) as im:im.verify()
        generated+=1
        reviewed+=a['reviewStatus']=='technical_pass'
        title=f"{a['number']}. {a['name']}"
        links=[]
        for v,path in zip(a['views'],a['separateViews']):
            if not (OUT/path).exists():continue
            with Image.open(OUT/path) as im:im.verify()
            views+=1
            links.append(f'[{v}]({path})')
        md.extend(['## '+title,'',f"![{title}]({a['turnaround']})",'',' · '.join(links),''])
        review_label='Technical review passed' if a['reviewStatus']=='technical_pass' else 'Technical review pending'
        cards.append(f'<article id="{a["id"]}"><h2>{html.escape(title)}</h2><p>{review_label}</p><a href="{a["turnaround"]}"><img loading="lazy" src="{a["turnaround"]}" alt="{html.escape(title)}"></a><p>'+ ' · '.join(f'<a href="{path}">{v}</a>' for v,path in zip(a['views'],a['separateViews']) if (OUT/path).exists())+'</p></article>')
    style='body{margin:0;background:#faf7f1;color:#302a24;font:16px/1.5 system-ui}main{max-width:1100px;margin:auto;padding:16px}article{background:white;border:1px solid #ded8cd;border-radius:14px;padding:12px;margin:24px 0}h2{font-size:22px}img{display:block;width:100%;height:auto}a{display:inline-block;min-height:44px}article>a{display:block}a:focus-visible{outline:3px solid green}'
    intro=f'<h1>Regional people and animals</h1><p>{generated}/61 sheets · {views}/183 separate views · {reviewed} technically reviewed. Tap any image to open and zoom.</p><p>References only. No additional Meshy budget or runtime IDs are assigned. <a href="../meshy-production-20261107/GALLERY.md">Original reference pack</a></p>'
    page='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Regional reference review</title><style>'+style+'</style><main>'+intro+'\n'.join(cards)+'</main></html>'
    (OUT/'gallery.html').write_text(page)
    (OUT/'GALLERY.md').write_text('\n'.join(md))
    # A separate compact page for checking six complete sheets at a time in the browser.
    review_style=style+'main{max-width:none}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}article{margin:0}h2{font-size:18px;margin:0}article p{margin:0}article>a{min-height:0}'
    (OUT/'review-grid.html').write_text('<!doctype html><meta charset="utf-8"><style>'+review_style+'</style><main><div class="grid">'+''.join(cards)+'</div></main>')
    print(json.dumps({'sheets':generated,'viewCrops':views,'technicallyReviewed':reviewed,'paidCalls':0}))

if __name__=='__main__':main()
