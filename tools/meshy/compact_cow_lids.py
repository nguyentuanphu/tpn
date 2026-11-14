"""Keep full body/eye textures; compact only the four generated closed-eye PNG atlases.
python tools/meshy/compact_cow_lids.py INPUT.glb OUTPUT.glb
Lossless RGBA PNG preserves edge RGB and alpha; meshes, rig and clips are copied unchanged.
"""
import io
import json
from pathlib import Path
import struct
import sys
import zlib
from PIL import Image
import numpy as np

use_zopfli = '--zopfli' in sys.argv[1:]
source, destination = map(Path, [a for a in sys.argv[1:] if a != '--zopfli'])
def lossless_png_deflate(png):
    """Recompress filtered bytes only; palette, alpha and pixels stay identical."""
    import zopfli.zlib
    chunks=[];offset=8
    while offset<len(png):
        size=struct.unpack_from('>I',png,offset)[0]
        chunks.append((png[offset+4:offset+8],png[offset+8:offset+8+size]))
        offset+=size+12
    original=b''.join(data for kind,data in chunks if kind==b'IDAT')
    filtered=zlib.decompress(original)
    encoded=zopfli.zlib.compress(filtered,numiterations=10)
    if len(encoded)>=len(original):return png
    assert zlib.decompress(encoded)==filtered
    output=[png[:8]];written=False
    for kind,data in chunks:
        if kind==b'IDAT':
            if written:continue
            data=encoded;written=True
        output.append(struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)))
    result=b''.join(output)
    assert np.array_equal(np.array(Image.open(io.BytesIO(png)).convert('RGBA')),np.array(Image.open(io.BytesIO(result)).convert('RGBA')))
    return result
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
        # The continuous eyelid images are small enough to keep every RGBA
        # byte. In particular, RGB at alpha zero must survive linear filtering.
        stream=io.BytesIO();Image.fromarray(rgba,'RGBA').save(stream,format='PNG',optimize=True)
        data=stream.getvalue()
        if use_zopfli:data=lossless_png_deflate(data)
        assert np.array_equal(rgba,np.array(Image.open(io.BytesIO(data)).convert('RGBA')))
        after+=len(data)
    view['byteOffset']=offset;view['byteLength']=len(data)
    data+=b'\0'*((-len(data))%4);payload.append(data);offset+=len(data)
doc['buffers'][0]['byteLength']=offset
j=json.dumps(doc,separators=(',',':'),ensure_ascii=False).encode();j+=b' '*((-len(j))%4)
b=b''.join(payload);result=struct.pack('<4sII',b'glTF',2,28+len(j)+len(b))+struct.pack('<II',len(j),0x4E4F534A)+j+struct.pack('<II',len(b),0x004E4942)+b
destination.write_bytes(result)
print(json.dumps({'lidBytesBefore':before,'lidBytesAfter':after,'outputBytes':len(result),'opaqueAlphaPreserved':True,'losslessDeflate':use_zopfli,'losslessRGBA':True}))
