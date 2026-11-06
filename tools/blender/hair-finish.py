# (v1.08e hair round 3, owner 6 Nov 2026 9 pm AEDT: "the hair ... will 100% scare the kids": sharp shards and facets)
# The finish every person's hair gets in the game models, after it is smoothed (one subdivision) and thinned:
#   soften_hair(o): smooth shading everywhere, no sharp edges, and weighted normals (the big faces lead), so the thinned
#                   clumps shade as soft round shapes, with no facets;
#   hair_colour(cc, p, n, centre): one base colour and one soft highlight band round the upper head, from the light side,
#                   fading out at the back and toward the hairline (never stripes of light and dark locks).
# exec'd by tools/blender/game-light.py (the light models) and tools/blender/game-hd.py (the high-detail models).
import bpy, math
from mathutils import Vector

def is_hair_mat(m):
    return bool(m) and m.name.split('.')[0].startswith(('hair', 'braid', 'bun'))

def soften_hair(o):
    """smooth shading, no sharp edges, then weighted normals applied (before the skin), on a thinned hair part"""
    me = o.data
    for p in me.polygons: p.use_smooth = True
    for name in ('sharp_edge', 'sharp_face'):
        a = me.attributes.get(name)
        if a is not None: me.attributes.remove(a)
    if me.has_custom_normals:
        with bpy.context.temp_override(object=o, active_object=o):
            bpy.ops.mesh.customdata_custom_splitnormals_clear()
    wn = o.modifiers.new('soft', 'WEIGHTED_NORMAL'); wn.mode = 'FACE_AREA'; wn.weight = 50; wn.keep_sharp = False; wn.thresh = .01
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
    return tuple(cc[i] + (min(1.0, cc[i] + (1 - cc[i]) * BAND_LIFT) - cc[i]) * b for i in range(3)) + (1.0,)
