"""Validate delivered cow GLBs, including feather alpha surviving export AND packing.
python tools/meshy/verify_cow.py NEAR.glb FAR.glb
"""
import json
from pathlib import Path
import struct
import sys

assert len(sys.argv) == 3, 'Supply near and far GLB paths'

for path, ceiling in zip(map(Path, sys.argv[1:]), (800*1024, 400*1024)):
    data = path.read_bytes()
    assert struct.unpack('<4sII', data[:12]) == (b'glTF', 2, len(data)), 'Incomplete GLB'
    length, kind = struct.unpack('<II', data[12:20]); doc = json.loads(data[20:20+length])
    binary = data[28+length:]
    assert len(data) <= ceiling, 'Model size budget exceeded'
    clips = {a['name'] for a in doc.get('animations', [])}
    assert {'idle','walk','wag','follow','cheer','sad','surprised','sleep','run','jump'} <= clips
    assert max(len(s['joints']) for s in doc['skins']) == 20
    lids = [m for m in doc['materials'] if m['name'].startswith(('meshy-cow-shut', 'meshy-cow-joy'))]
    assert len(lids) == 4
    for mat in lids:
        assert mat.get('alphaMode') == 'BLEND', 'Feather alpha was stripped: '+mat['name']
        tex = doc['textures'][mat['pbrMetallicRoughness']['baseColorTexture']['index']]
        assert doc['samplers'][tex['sampler']]['minFilter'] == 9729, 'Eyelid atlas must not blend across mip tiles'
        image = doc['images'][tex['source']]; view = doc['bufferViews'][image['bufferView']]
        image_data = binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
        assert image_data[:8] == b'\x89PNG\r\n\x1a\n' and (image_data[25] == 6 or (image_data[25] == 3 and b'tRNS' in image_data)), 'Lid texture must preserve PNG alpha (RGBA or RGBA palette)'
    triangles = sum(doc['accessors'][p['indices']]['count']//3 for m in doc['meshes'] for p in m['primitives'])
    print(json.dumps({'file':str(path),'bytes':len(data),'triangles':triangles,'clips':sorted(clips),'featherRGBA':'PASS'}))
