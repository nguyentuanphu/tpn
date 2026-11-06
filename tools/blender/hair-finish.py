# (v1.08e hair round 3, owner 6 Nov 2026 9 pm AEDT: "the hair ... will 100% scare the kids": sharp shards and facets)
# The finish every person's hair gets in the game models, after it is smoothed (one subdivision) and thinned:
#   soften_hair(o): smooth shading everywhere, no sharp edges, and angle-weighted normals, so the thinned
#                   clumps shade as soft round shapes, with no facets;
#   hair_colour(cc, p, n, centre): one base colour and one soft highlight band round the upper head, from the light side,
#                   fading out at the back and toward the hairline (never stripes of light and dark locks).
# exec'd by tools/blender/game-light.py (the light models) and tools/blender/game-hd.py (the high-detail models).
import bpy, math
from mathutils import Vector

def is_hair_mat(m):
    return bool(m) and m.name.split('.')[0].startswith(('hair', 'braid', 'bun'))

def soften_hair(o, src=None):
    """smooth shading, no sharp edges, then soft normals applied (before the skin), on a thinned hair part: with src (the
    same hair before it was thinned) each corner takes the full smooth hair's normal there, so the thinned clumps still
    shade as the round shapes they were; without, angle-weighted normals"""
    me = o.data
    for p in me.polygons: p.use_smooth = True
    for name in ('sharp_edge', 'sharp_face'):
        a = me.attributes.get(name)
        if a is not None: me.attributes.remove(a)
    if me.has_custom_normals:
        with bpy.context.temp_override(object=o, active_object=o):
            bpy.ops.mesh.customdata_custom_splitnormals_clear()
    # (angle-weighted: each corner's normal from the faces round it by their angle, so long thin triangles left by the
    # thinning do not pull it and big flat triangles do not read as slabs)
    if src is not None:
        for p in src.data.polygons: p.use_smooth = True
        wn = o.modifiers.new('soft', 'DATA_TRANSFER'); wn.object = src; wn.use_object_transform = True
        wn.use_loop_data = True; wn.data_types_loops = {'CUSTOM_NORMAL'}; wn.loop_mapping = 'POLYINTERP_NEAREST'
    else:
        wn = o.modifiers.new('soft', 'WEIGHTED_NORMAL'); wn.mode = 'CORNER_ANGLE'; wn.weight = 50; wn.keep_sharp = False; wn.thresh = .01
    o.modifiers.move(o.modifiers.find(wn.name), 0)   # (before the skin)
    with bpy.context.temp_override(object=o, active_object=o):
        bpy.ops.object.modifier_apply(modifier=wn.name)

BAND_EL, BAND_W, BAND_LIFT = .72, .24, .2   # the band's height on the head (radians up from the ear line), its softness, its lightness

def hair_colour(cc, p, n, centre):
    """one hair corner's colour: the base colour, lifted softly toward a lighter tone inside the highlight band"""
    d = p - centre
    if d.length < 1e-6: return cc
    d.normalize(); el = math.asin(max(-1.0, min(1.0, d.z)))
    g = math.exp(-((el - BAND_EL) / BAND_W) ** 2)
    front = .55 + .45 * max(0.0, -d.y) + .15 * max(0.0, -d.x)   # (the key light comes from the front and the person's right)
    face = max(0.0, n.dot(d)) ** .5
    b = min(1.0, .9 * g * front * face)
    warm = (1.0, .82, .66)   # (lifted toward a warm light, so a dark brown band stays brown, never grey)
    return tuple(cc[i] + (cc[i] + (warm[i] - cc[i]) * BAND_LIFT - cc[i]) * b for i in range(3)) + (1.0,)

FRIEND_SOFT = ('finn', 'sol', 'clara')   # (Lumi's leaf hair keeps its leaves and their three greens; it is only smoothed)

def round_tube(o, subdivide=True):
    """a friend's felt clump or lock (svkit tube: rings of points, then the two cap points) made soft at export: the same
    path and root, but never thinner than about half its root and ending in a round dome, not a point; then one
    subdivision, so it is smoothed before it is thinned. Anything that is not a tube is left as it is."""
    if o.name.split('.')[0] not in ('hairClump', 'hairLock'): return False   # (spheres have the same layout: beads, petals)
    me = o.data; nv = len(me.vertices)
    seg = next((s for s in (10, 12, 16) if (nv - 2) % s == 0 and (nv - 2) // s >= 3), None)
    if seg is None: return False
    n = (nv - 2) // seg; V = me.vertices
    rings = [[V[i * seg + k] for k in range(seg)] for i in range(n)]
    cen = [sum((v.co for v in r), Vector()) / seg for r in rings]
    rad = [max((v.co - c).length for v in r) for r, c in zip(rings, cen)]
    r0 = max(rad[:max(1, n // 3)])
    if r0 < 1e-6: return False
    for i, (r, c) in enumerate(zip(rings, cen)):
        f = i / (n - 1); want = r0 * (.55 + .2 * (1 - f))
        if i == n - 1: want = r0 * .42
        if rad[i] < want:
            s = want / max(rad[i], 1e-6)
            for v in r: v.co = c + (v.co - c) * s
    tip = V[nv - 1]; d = (cen[-1] - cen[-2]); d = d.normalized() if d.length > 1e-6 else Vector((0, 0, -1))
    tip.co = cen[-1] + d * r0 * .4   # (a round end)
    me.update()
    for p in me.polygons: p.use_smooth = True
    if subdivide and not any(m.type == 'SUBSURF' for m in o.modifiers):
        sm = o.modifiers.new('soft', 'SUBSURF'); sm.levels = sm.render_levels = 1
        o.modifiers.move(o.modifiers.find(sm.name), 0)
    return True

def soften_friend_hair(objs, who, subdivide=True):
    """the friends' felt hair before it is thinned (Finn, Sol and Clara): round tips for the clumps and locks. Their tubes
    are already dense (10-12 sides, 7-13 rings), so they are not subdivided again: subdivided, Clara's hair came to 81,000
    triangles and the thinning to 9,500 cut it back into facets (taking out every other ring instead kinked the wavy locks
    into spikes). As built they are thinned by about half, and keep the full hair's smooth normals (soften_hair). Lumi's leaves are
    left as built"""
    if who not in FRIEND_SOFT: return
    main = bpy.data.materials.get('hair')
    for o in objs:
        if o.type != 'MESH' or o.users_collection[0].name != 'hair': continue
        round_tube(o, subdivide)
        # one base colour: the locks, clumps and beads in the main shade (the cap under them keeps its darker shade, the
        # soft depth under the locks)
        if main is not None and o.name.split('.')[0] != 'hairCap':
            for i, m in enumerate(o.data.materials):
                if m is not None and m.name.split('.')[0] in ('hairDark', 'hairLight'): o.data.materials[i] = main

def is_cap(o):
    """the villagers' thin hair base under the locks: not subdivided in the game models (it hardly shows; its triangles go to
    the locks). The friends' cap keeps its one subdivision: its trimmed edge round the face is jagged without it"""
    return o.name.split('.')[0] == 'hairCap' and WHO == 'villager'

def thin_friend_hair_evenly(objs, who, budget):
    """the light models: each clump, lock and bead of a friend's hair thinned by the same share before they are joined, so
    the hair keeps its budget evenly (thinned all together, the long smooth locks lost most and turned into flat slabs)"""
    if who not in FRIEND_SOFT: return
    hs = [o for o in objs if o.type == 'MESH' and o.users_collection[0].name == 'hair']
    def tri(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)
    have = sum(tri(o) * (4 if any(m.type == 'SUBSURF' and m.levels for m in o.modifiers) else 1) for o in hs)
    r = budget / max(have, 1)
    if r >= 1: return
    for o in hs:
        if o.name.split('.')[0] == 'hairCap': continue   # (thinned with the rest after its smoothing)
        d = o.modifiers.new('even', 'DECIMATE'); d.decimate_type = 'COLLAPSE'; d.ratio = max(.12, r); d.use_collapse_triangulate = True
