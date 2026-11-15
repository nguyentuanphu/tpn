"""Suggest vertical crop cuts in background gaps. Review images before technical_pass.

Only analyses pixels and records crop coordinates; never edits source images.
"""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image

def gap_cut(counts,lo,hi):
    runs=[];start=None
    for x in range(lo,hi+1):
        clear=x<hi and counts[x]<=2
        if clear and start is None:start=x
        if not clear and start is not None:runs.append((start,x));start=None
    if not runs:
        return None
    left,right=max(runs,key=lambda r:r[1]-r[0])
    return (left+right)//2

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pack',type=Path)
    parser.add_argument('--apply',action='store_true')
    args=parser.parse_args()
    path=args.pack/'ASSET-MANIFEST.json';manifest=json.loads(path.read_text())
    report=[]
    for a in manifest['assets']:
        file=args.pack/a['turnaround']
        if not file.exists():continue
        with Image.open(file) as im:
            pixels=np.asarray(im.convert('RGB')).astype(np.int16)
        h,w,_=pixels.shape
        mask=((pixels.max(2)-pixels.min(2))>12)|(pixels.mean(2)<175)
        counts=mask.sum(0)
        cuts=[gap_cut(counts,int(w*.23),int(w*.45)),gap_cut(counts,int(w*.56),int(w*.77))]
        report.append({'id':a['id'],'cuts':cuts,'clear':None not in cuts})
        if args.apply and None not in cuts:
            a['cropBoundaries']=[0,*cuts,w]
    if args.apply:path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(report))

if __name__=='__main__':main()
