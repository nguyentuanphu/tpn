"""Keep full body/eye textures; compact only the four generated closed-eye PNG atlases.
python tools/meshy/compact_cow_lids.py INPUT.glb OUTPUT.glb
RGBA palette PNG preserves transparency; meshes, rig and clips are copied unchanged.
"""
import io
import json
from pathlib import Path
import struct
import sys
from PIL import Image
import numpy as np

source, destination = map(Path, sys.argv[1:])
assert source.resolve() != destination.resolve(), 'Preserve the source GLB'
raw=source.read_bytes();assert struct.unpack('<4sII',raw[:12])==(b'glTF',2,len(raw))
n,kind=struct.unpack('<II',raw[12:20]);doc=json.loads(raw[20:20+n]);binary=raw[28+n:]
assert len(doc['buffers'])==1
images=set()
for material in doc['materials']:
    if material.get('name','').startswith(('meshy-cow-shut','meshy-cow-joy')):
        texture=doc['textures'][material['pbrMetallicRoughness']['baseColorTexture']['index']]
        samplers=doc.setdefault('samplers',[])
        sampler=dict(samplers[texture['sampler']]) if 'sampler' in texture else {}
        sampler.update(minFilter=9729,magFilter=9729)
        texture['sampler']=len(samplers);samplers.append(sampler)
        images.add(doc['images'][texture['source']]['bufferView'])
assert len(images)==4
payload=[];offset=0;before=after=0
for index,view in enumerate(doc['bufferViews']):
    data=binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
    if index in images:
        before+=len(data);rgba=np.array(Image.open(io.BytesIO(data)).convert('RGBA'))
        # Quantize opaque and feather pixels separately: FASTOCTREE otherwise turns
        # fully opaque alpha 255 into e.g. 235, exposing the painted pupil underneath.
        opaque=rgba[...,3]==255;feather=(rgba[...,3]>0)&~opaque
        indices=np.full(rgba.shape[:2],255,dtype=np.uint8);palette=np.zeros((256,4),dtype=np.uint8)
        if opaque.any():
            samples=Image.fromarray(rgba[opaque,:3].reshape(-1,1,3),'RGB')
            quant=samples.quantize(colors=191,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
            indices[opaque]=np.array(quant).ravel()
            palette[:191,:3]=np.array(quant.getpalette()[:191*3]).reshape(191,3);palette[:191,3]=255
        if feather.any():
            samples=Image.fromarray(rgba[feather].reshape(-1,1,4),'RGBA')
            quant=samples.quantize(colors=64,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE)
            indices[feather]=np.array(quant).ravel()+191
            palette[191:255]=np.array(quant.getpalette('RGBA')[:64*4]).reshape(64,4)
        image=Image.fromarray(indices,'P');image.putpalette(palette.ravel().tolist(),rawmode='RGBA')
        decoded=np.array(image.convert('RGBA'))[...,3]
        assert np.all(decoded[opaque]==255), 'Opaque eye cover alpha must remain exactly 255'
        assert np.all(decoded[rgba[...,3]==0]==0), 'Transparent borders must remain exactly zero'
        stream=io.BytesIO();image.save(stream,format='PNG',optimize=True);data=stream.getvalue();after+=len(data)
    view['byteOffset']=offset;view['byteLength']=len(data)
    data+=b'\0'*((-len(data))%4);payload.append(data);offset+=len(data)
doc['buffers'][0]['byteLength']=offset
j=json.dumps(doc,separators=(',',':'),ensure_ascii=False).encode();j+=b' '*((-len(j))%4)
b=b''.join(payload);result=struct.pack('<4sII',b'glTF',2,28+len(j)+len(b))+struct.pack('<II',len(j),0x4E4F534A)+j+struct.pack('<II',len(b),0x004E4942)+b
destination.write_bytes(result)
print(json.dumps({'lidBytesBefore':before,'lidBytesAfter':after,'outputBytes':len(result),'opaqueAlphaPreserved':True}))
