# Minimal GLB read/write for the sol-eyes tools (Blender's bundled Python: numpy + OpenImageIO)
import json, struct, numpy as np
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def read(path):
    b = open(path, 'rb').read(); n = struct.unpack_from('<I', b, 12)[0]
    J = json.loads(b[20:20 + n]); o = 20 + n; bl = struct.unpack_from('<I', b, o)[0]
    return J, bytearray(b[o + 8:o + 8 + bl])
def acc(J, B, i):
    a = J['accessors'][i]; v = J['bufferViews'][a['bufferView']]; dt = CT[a['componentType']]; nc = NC[a['type']]
    off = v.get('byteOffset', 0) + a.get('byteOffset', 0); st = v.get('byteStride', 0); isz = np.dtype(dt).itemsize * nc
    if st and st != isz:
        raw = np.frombuffer(bytes(B), np.uint8, count=a['count'] * st, offset=off).reshape(-1, st)[:, :isz].copy()
        arr = raw.view(dt).reshape(a['count'], nc)
    else: arr = np.frombuffer(bytes(B), dt, count=a['count'] * nc, offset=off).reshape(a['count'], nc).copy()
    if a.get('normalized'):
        arr = arr.astype(np.float32) / float(np.iinfo(dt).max)
    return arr[:, 0] if nc == 1 else arr
def view_bytes(J, B, vi):
    v = J['bufferViews'][vi]; o = v.get('byteOffset', 0); return bytes(B[o:o + v['byteLength']])
def add_view(J, B, data, target=None):
    while len(B) % 4: B.append(0)
    o = len(B); B.extend(data); v = {'buffer': 0, 'byteOffset': o, 'byteLength': len(data)}
    if target: v['target'] = target
    J['bufferViews'].append(v); return len(J['bufferViews']) - 1
def add_acc(J, B, arr, ctype, typ, target=None, minmax=False, normalized=False):
    arr = np.ascontiguousarray(arr.astype(CT[ctype])); vi = add_view(J, B, arr.tobytes(), target)
    a = {'bufferView': vi, 'componentType': ctype, 'count': int(arr.shape[0]), 'type': typ}
    if normalized: a['normalized'] = True
    if minmax:
        r = arr.reshape(arr.shape[0], -1); a['min'] = [float(x) for x in r.min(0)]; a['max'] = [float(x) for x in r.max(0)]
    J['accessors'].append(a); return len(J['accessors']) - 1
def write(path, J, B):
    while len(B) % 4: B.append(0)
    J['buffers'] = [{'byteLength': len(B)}]
    js = json.dumps(J, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    out = struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(B)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(B), 0x004E4942) + bytes(B)
    open(path, 'wb').write(out)
