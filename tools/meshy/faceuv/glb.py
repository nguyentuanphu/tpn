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
def tex_image(J, ti):   # the image index behind a texture (plain or webp extension)
    t = J['textures'][ti]
    return t['source'] if 'source' in t else t['extensions']['EXT_texture_webp']['source']
def world(J):   # every node's world matrix (row-major 4x4, column vectors)
    def local(n):
        if 'matrix' in n: return np.array(n['matrix'], np.float64).reshape(4, 4).T
        M = np.eye(4); t = n.get('translation', [0, 0, 0]); x, y, z, w = n.get('rotation', [0, 0, 0, 1]); s = n.get('scale', [1, 1, 1])
        Rm = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
        M[:3, :3] = Rm * np.array(s)[None]; M[:3, 3] = t; return M
    W = {}; par = {c: i for i, n in enumerate(J['nodes']) for c in n.get('children', [])}
    def get(i):
        if i not in W: W[i] = (get(par[i]) if i in par else np.eye(4)) @ local(J['nodes'][i])
        return W[i]
    for i in range(len(J['nodes'])): get(i)
    return W
