# (v1.08e faces, part 2: owner 6 Nov 2026 AEDT, "higher definition") The high-detail game model of a friend, made in the
# same Blender session as the full model (lumi.py ... game glb hd), so the felt mottle, the fabric, the seams, buttons and
# hair strands of the full model (about a million triangles) are baked into one painted 1024 px picture:
#   1. each part (body, hair, hands, item, shoes, each face) is joined as lighten() does, at full smoothing (the source);
#   2. a copy of it is thinned to its triangle budget (about 22,000 in all, one face shown at a time);
#   3. the thinned parts share one UV atlas; their colour (DIFFUSE, colour only) and the soft shadows in the folds (AO)
#      are baked from the full parts onto it, and multiplied into one picture (a JPEG inside the .glb);
#   4. each part draws with one material, "cloth-<part>" with the picture, plus "skin" kept apart for the skin tone; the
#      faces keep their colours in the corners ("face-<mood>"), as the light model does (game-light.py).
# exec'd by lumi.py, which then exports the .glb; tools/make-friends.mts hd runs gltfpack on it.
import bpy, bmesh, math
from mathutils import Vector
import numpy as np
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hair-finish.py')).read())   # (v1.08e hair round 3: soft hair)

HD_BUDGET = {'body': 8000, 'head': 4000, 'hair': 9500, 'hands': 700, 'item': 900, 'shoes': 900}
HD_FACE = 700
ATLAS = 1024
UV_SHARE = {'hair': .3}
# (v1.08e villagers, owner 6 Nov 2026 AEDT, pop-up "Bake gallery light") the villagers: the gallery's soft studio light
# (the felt sheen, the soft shadows in the folds, the warm bounce) is baked into their picture with everything else
# (COMBINED), all but the skin, and the game draws it almost unlit ("lit-<part>" materials, js/friend-model.ts), so in the
# valley they look like the gallery renders
LIT = WHO == 'villager'
# (owner, 6 Nov, pop-up "Smoother, heavier": at 8,000 triangles they were lumpy) about 25,000 triangles, smooth normals,
# a 2048 px picture baked at 64 samples (the 14 crowd neighbours: 1024 px, VILLAGER_ATLAS)
# (check perf: at 25,000 triangles and 2048 px the village went past 800,000 triangles and the 1024 px picture limit)
# about 18,000 triangles and 1024 px
if LIT: HD_BUDGET = {'body': 8500, 'head': 4000, 'hair': 5000, 'hands': 700, 'item': 600, 'shoes': 800, 'hat': 1200}; HD_FACE = 400; ATLAS = int(os.environ.get('VILLAGER_ATLAS', '1024'))

KEY = Vector((-.45, -.6, .66)).normalized()   # the key light, from above and the viewer's left (the person's right)
def skin_shade(n):
    """the soft form shading of a skin point from its normal: the key light, and a little more light from above"""
    k = max(0.0, n.dot(KEY)); up = .5 + .5 * n.z
    return .82 + .18 * min(1.0, .72 * k + .38 * up)   # (the lit side keeps the skin tone; round 3: gentler, the game's own light shades the form too, and a strong bake showed as patches across the thinned face)

def _smooth(o):
    """(v1.08e round 3, owner 6 Nov: no facets anywhere) smooth shading on a thinned part, its normals the plain average
    (weighted normals were tried: on a thinned shape's uneven triangles they leaned to the big ones and showed facets)"""
    for p_ in o.data.polygons: p_.use_smooth = True
    if o.data.has_custom_normals:
        with bpy.context.temp_override(object=o, active_object=o): bpy.ops.mesh.customdata_custom_splitnormals_clear()

def _tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)

def _thin(o, want, keep=None):
    for _ in range(3):
        now = _tris(o)
        if now <= want * 1.12: break
        d = o.modifiers.new('thin', 'DECIMATE'); d.decimate_type = 'COLLAPSE'; d.ratio = want / now; d.use_collapse_triangulate = True
        if o.name.endswith('-head'): d.use_symmetry = True; d.symmetry_axis = 'X'   # (round 3: the face thinned the same on both sides, no lopsided facets)

        with bpy.context.temp_override(object=o, active_object=o):
            bpy.ops.object.modifier_apply(modifier=d.name)

def _base(m):
    if m and m.use_nodes:
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED': return tuple(n.inputs['Base Color'].default_value)
    return (1, 1, 1, 1)

def _select(objs, active):
    for o in scene.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active

def hd():
    for o in [o for o in scene.objects if o.name.startswith('ground')]: bpy.data.objects.remove(o)
    rig.animation_data.action = None
    for b in pb: b.rotation_euler = (0, 0, 0); b.location = (0, 0, 0)
    dg = bpy.context.evaluated_depsgraph_get(); groups = {}
    face3 = None; full_hair = []
    soften_friend_hair([o for o in scene.objects if o.parent == rig], WHO, subdivide=False)   # (v1.08e hair round 3: round tips)
    thin_friend_hair_evenly([o for o in scene.objects if o.parent == rig], WHO, HD_BUDGET['hair'])   # (every lock thinned by the same share)
    for o in [o for o in scene.objects if o.type == 'MESH' and o.parent == rig]:
        if o.users_collection[0].name == 'face3d': face3 = o; continue   # (part 3: the face keeps its mood keys, as built)
        for m in o.modifiers:
            # (v1.08e hair round 3: the villagers' round locks smoothed once before thinning, so no shards or spikes)
            if m.type == 'SUBSURF': m.levels = 0 if (o.users_collection[0].name == 'hair' and is_cap(o)) else 1 if (LIT and o.users_collection[0].name == 'hair') else min(m.levels, 2)
            if m.type == 'ARMATURE': m.show_viewport = False
        dg.update(); names = [g.name for g in o.vertex_groups]
        ev = [m for m in o.modifiers if m.type == 'DECIMATE' and m.name.startswith('even')]
        if ev:   # (v1.08e faces, Release 7 Nov: the friends' hair took its "full smooth" normals from hair already thinned by
            # thin_friend_hair_evenly, so the facets stayed) the lock as it is without that thinning, kept for its normals
            for m in ev: m.show_viewport = False
            dg.update(); fm = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
            for m in ev: m.show_viewport = True
            dg.update(); fo = bpy.data.objects.new(o.name + '_full', fm); fo.matrix_world = o.matrix_world; scene.collection.objects.link(fo); full_hair.append(fo)
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        n = bpy.data.objects.new(o.name + '_h', me); n.matrix_world = o.matrix_world
        for g in names: n.vertex_groups.new(name=g)
        col = o.users_collection[0]; col.objects.link(n)
        key = col.name if col != scene.collection else 'body'
        base = o.name.split('.')[0]
        if key == 'body' and base in ('head', 'ear') and globals().get('SCULPT'): key = 'head'   # (v1.08e, owner 6 Nov: the sculpted head thinned to a budget of its own, so its shape still reads; joined to the body after)
        elif key == 'body' and base.startswith(HAND_PROPS): key = 'item'
        elif key == 'body' and base.startswith(SHOE_PARTS): key = 'shoes'
        groups.setdefault(key, []).append(n); bpy.data.objects.remove(o)
    high, low = {}, {}
    for key, objs in groups.items():
        with bpy.context.temp_override(active_object=objs[0], selected_editable_objects=objs, selected_objects=objs):
            bpy.ops.object.join()
        h = objs[0]; h.name = WHO + '-' + key + '_src'; high[key] = h
        if key in ('hat', 'hair'):   # (a hat's shell or a lock can face inward: drawn dark, or not at all, in the game)
            bm = bmesh.new(); bm.from_mesh(h.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(h.data); bm.free(); h.data.update()
        l = h.copy(); l.data = h.data.copy(); l.name = WHO + '-' + key; h.users_collection[0].objects.link(l); low[key] = l
        _thin(l, HD_FACE if key.startswith('face-') else HD_BUDGET.get(key, 900))
        for p_ in l.data.polygons: p_.use_smooth = True   # smooth shading on the thinned shape (no facets)
        _smooth(l)
        if key == 'hair':   # (v1.08e hair round 3: the full hair's smooth normals, no sharp edges)
            src = h
            if full_hair:   # (the friends: the hair before thin_friend_hair_evenly, joined; see above)
                with bpy.context.temp_override(active_object=full_hair[0], selected_editable_objects=full_hair, selected_objects=full_hair): bpy.ops.object.join()
                src = full_hair[0]
                bm = bmesh.new(); bm.from_mesh(src.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(src.data); bm.free(); src.data.update()
            soften_hair(l, src)
            if src is not h: bpy.data.objects.remove(src)
        print('hd:', key, _tris(h), '->', _tris(l))
    # (v1.08e, Release 6 Nov 2026 AEDT: the 1024 px picture smeared the clothes, and texels the bake missed came out as
    # black bands and strips in the hair) no picture: each face keeps its material's flat colour in its corners (crisp,
    # as in the gallery), times the light baked into the corners of the thinned shape itself: the gallery's soft studio
    # light for the villagers (LIT: direct and bounced light), the soft shadow in the folds (AO) for the friends and for
    # everyone's hair and hands (the game shades those)
    for k, h in high.items(): bpy.data.objects.remove(h)
    if 'head' in low and 'body' in low:   # the thinned head joined to the thinned body: one part, as before
        hb, bb = low.pop('head'), low['body']
        with bpy.context.temp_override(active_object=bb, selected_editable_objects=[bb, hb], selected_objects=[bb, hb]): bpy.ops.object.join()
    cloth = [k for k in low if not k.startswith('face')]
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'
    for c in scene.collection.children: c.hide_render = False; c.hide_viewport = False
    bk = scene.render.bake; bk.target = 'VERTEX_COLORS'; bk.use_selected_to_active = False; bk.use_clear = True
    def bake(objs, kind):
        if not objs: return
        for o in objs:
            me = o.data; a = me.color_attributes.get('Light') or me.color_attributes.new('Light', 'FLOAT_COLOR', 'CORNER'); me.color_attributes.active_color = a
        _select(objs, objs[0])
        if kind == 'LIGHT': scene.cycles.samples = 256; bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, target='VERTEX_COLORS')
        else: scene.cycles.samples = 128; bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    lit_parts = [low[k] for k in cloth if LIT and k != 'hair' and not k.startswith('hands')]
    bake(lit_parts, 'LIGHT'); bake([low[k] for k in cloth if low[k] not in lit_parts], 'AO')
    # (v1.08e faces, Release 7 Nov 2026 2 am AEDT: dark smudges at the waist and hips, and the friends' hair clumps shaded
    # into facets) the bake is sampled once per corner of the thinned shape, so a corner tucked under a fold or beside a
    # neighbouring clump came out much darker than the corners round it. Each point's light is now the average of its
    # corners, smoothed over its neighbours a few times, and kept above a floor (lit clothes) or made gentle (the AO)
    def soften_light(o, passes, floor):
        me = o.data; L = me.color_attributes.get('Light')
        if L is None: return
        nv = len(me.vertices); acc = [[0.0, 0.0, 0.0, 0] for _ in range(nv)]
        for lp in me.loops:
            c = L.data[lp.index].color; a = acc[lp.vertex_index]; a[0] += c[0]; a[1] += c[1]; a[2] += c[2]; a[3] += 1
        v = [(a[0] / a[3], a[1] / a[3], a[2] / a[3]) if a[3] else (1.0, 1.0, 1.0) for a in acc]
        nb = [[] for _ in range(nv)]
        for e in me.edges: i, j = e.vertices; nb[i].append(j); nb[j].append(i)
        for _ in range(passes):
            v = [tuple(.5 * v[i][c] + .5 * sum(v[j][c] for j in nb[i]) / len(nb[i]) for c in range(3)) if nb[i] else v[i] for i in range(nv)]
        for lp in me.loops:
            r, g, b = v[lp.vertex_index]; lum = (r + g + b) / 3
            if lum < floor: k = floor / max(lum, 1e-4); r, g, b = r * k, g * k, b * k   # (the same warm colour, lifted to the floor)
            L.data[lp.index].color = (r, g, b, 1)
    for k_ in cloth:
        o_ = low[k_]
        if o_ in lit_parts: soften_light(o_, 3, .5)
        elif k_ == 'hair': soften_light(o_, 4, .7)
    total = 0
    if face3: face3.name = WHO + '-face3d'; low['face3d'] = face3   # (part 3: the face keeps its mood keys, as built)
    for k, o in low.items():
        me = o.data; mats = list(me.materials); skin = next((m for m in mats if m and m.name.startswith('skin')), None)
        colr = me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER'); light = me.color_attributes.get('Light')
        lit = o in lit_parts
        skin0_ = next((m for m in mats if m and m.name.startswith('skin')), None)
        cn = me.corner_normals if skin0_ is not None else None
        ref = 1.0
        if lit and light is not None and skin0_ is not None:   # (the lit skin's own brightest tenth reads as full light)
            ls = sorted(sum(light.data[li].color[:3]) / 3 for p_ in me.polygons if mats[p_.material_index] == skin0_ for li in p_.loop_indices)
            ref = max(.05, ls[int(len(ls) * .9)] if ls else 1.0)
        for poly in me.polygons:
            cc = _base(mats[poly.material_index] if poly.material_index < len(mats) else None)
            if skin0_ is not None and mats[poly.material_index] == skin0_:
                # (v1.08e, owner 6 Nov: "the flat corner colours lost all modelling") the skin's corners carry its form
                # shading, a soft key light from above-left times the soft shadow (or the gallery light) baked here; the
                # game multiplies the child's skin tone by it ("skin-shade")
                for li in poly.loop_indices:
                    a = (sum(light.data[li].color[:3]) / 3 / ref) if light is not None else 1.0
                    v = min(1.0, skin_shade(cn[li].vector))   # (round 3: the key light alone; the baked shadow, sampled per point, came out blotchy on the face)
                    colr.data[li].color = (v, v, v, 1)
                continue
            if k == 'hair' and is_hair_mat(mats[poly.material_index] if poly.material_index < len(mats) else None):
                mw = o.matrix_world; nm = mw.to_3x3()   # (v1.08e hair round 3: one base colour and one soft highlight band)
                cc_ = cc
            for li in poly.loop_indices:
                if k == 'hair' and is_hair_mat(mats[poly.material_index] if poly.material_index < len(mats) else None):
                    cc = hair_colour(cc_, mw @ me.vertices[me.loops[li].vertex_index].co, (nm @ me.corner_normals[li].vector).normalized(), HC)
                if light is None: colr.data[li].color = cc; continue
                l = light.data[li].color
                f = [min(1, l[0]), min(1, l[1]), min(1, l[2])] if lit else [(.7 + .3 * min(1, l[0])) if k == 'hair' else (.4 + .6 * min(1, l[0]))] * 3   # (lit: the light's own warm colour)
                cc2 = [cc[0] * f[0], cc[1] * f[1], cc[2] * f[2]]
                colr.data[li].color = (cc2[0], cc2[1], cc2[2], 1)
        if light is not None: me.color_attributes.remove(light)
        me.color_attributes.active_color = me.color_attributes['Col']
        name = k if k.startswith('face') else ('lit-' if lit else 'cloth-') + k
        one = bpy.data.materials.new(name); one.use_nodes = True; nt = one.node_tree; b = nt.nodes['Principled BSDF']
        ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'; nt.links.new(ca.outputs['Color'], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = .8
        if skin and not k.startswith('hands'): skin = skin.copy(); skin.name = 'skin-shade'   # (its corners carry the shading)
        if skin and k.startswith('hands'): skin = skin.copy(); skin.name = 'skin-grip'   # (the part is 'hands-grip': the hands that hold handlebars, shown only when riding; Release 6 Nov saw them drawn over the hands as a dark band)
        # (the skin keeps its own plain colour, the person's skin tone in the game)
        keep = [one] + ([skin] if skin else [])
        skin0 = next((m for m in mats if m and m.name.startswith('skin')), None)   # (the polygons' own skin material, before the copy)
        idx = [keep.index(skin) if (skin and mats[p.material_index] == skin0) else 0 for p in me.polygons]
        me.materials.clear()
        for m in keep: me.materials.append(m)
        for p, i in zip(me.polygons, idx): p.material_index = i
        if k != 'face3d':
            o.parent = rig; o.matrix_parent_inverse = rig.matrix_world.inverted()
            am = o.modifiers.new('rig', 'ARMATURE'); am.object = rig
        if not k.startswith('face-') or k == 'face-smile': total += _tris(o)   # (face3d counts: one face, its moods are keys)
    print('hd: total triangles shown', total)
