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
import numpy as np

HD_BUDGET = {'body': 9000, 'hair': 9500, 'hands': 700, 'item': 900, 'shoes': 900}
HD_FACE = 700
ATLAS = 1024
UV_SHARE = {'hair': .3}
# (v1.08e villagers, owner 6 Nov 2026 AEDT, pop-up "Bake gallery light") the villagers: the gallery's soft studio light
# (the felt sheen, the soft shadows in the folds, the warm bounce) is baked into their picture with everything else
# (COMBINED), skin included, and the game draws it almost unlit ("lit-<part>" materials, js/friend-model.ts), so in the
# valley they look like the gallery renders
LIT = WHO == 'villager'
# (owner, 6 Nov, pop-up "Smoother, heavier": at 8,000 triangles they were lumpy) about 25,000 triangles, smooth normals,
# a 2048 px picture baked at 128 samples
if LIT: HD_BUDGET = {'body': 16000, 'hair': 6500, 'hands': 900, 'item': 700, 'shoes': 1000, 'hat': 1400}; HD_FACE = 450; ATLAS = 2048

def _tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)

def _thin(o, want):
    for _ in range(3):
        now = _tris(o)
        if now <= want * 1.12: break
        d = o.modifiers.new('thin', 'DECIMATE'); d.decimate_type = 'COLLAPSE'; d.ratio = want / now; d.use_collapse_triangulate = True
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
    for o in [o for o in scene.objects if o.type == 'MESH' and o.parent == rig]:
        for m in o.modifiers:
            if m.type == 'SUBSURF': m.levels = 0 if (LIT and o.users_collection[0].name == 'hair') else min(m.levels, 2)   # (villagers: smooth locks as built, not smoothed and thinned into spikes)
            if m.type == 'ARMATURE': m.show_viewport = False
        dg.update(); names = [g.name for g in o.vertex_groups]
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        n = bpy.data.objects.new(o.name + '_h', me); n.matrix_world = o.matrix_world
        for g in names: n.vertex_groups.new(name=g)
        col = o.users_collection[0]; col.objects.link(n)
        key = col.name if col != scene.collection else 'body'
        base = o.name.split('.')[0]
        if key == 'body' and base.startswith(HAND_PROPS): key = 'item'
        elif key == 'body' and base.startswith(SHOE_PARTS): key = 'shoes'
        groups.setdefault(key, []).append(n); bpy.data.objects.remove(o)
    high, low = {}, {}
    for key, objs in groups.items():
        with bpy.context.temp_override(active_object=objs[0], selected_editable_objects=objs, selected_objects=objs):
            bpy.ops.object.join()
        h = objs[0]; h.name = WHO + '-' + key + '_src'; high[key] = h
        if key == 'hat':   # (a hat's shell can face inward: the bake's rays then start inside it and come out dark)
            bm = bmesh.new(); bm.from_mesh(h.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(h.data); bm.free(); h.data.update()
        l = h.copy(); l.data = h.data.copy(); l.name = WHO + '-' + key; h.users_collection[0].objects.link(l); low[key] = l
        _thin(l, HD_FACE if key.startswith('face-') else HD_BUDGET.get(key, 900))
        for p_ in l.data.polygons: p_.use_smooth = True   # smooth shading on the thinned shape (no facets)
        print('hd:', key, _tris(h), '->', _tris(l))
    cloth = [k for k in low if not k.startswith('face-')]
    # one UV atlas for every part that is not a face (smart projection of all of them together packs them side by side)
    objs = [low[k] for k in cloth]
    for o in objs:
        while o.data.uv_layers: o.data.uv_layers.remove(o.data.uv_layers[0])
        o.data.uv_layers.new(name='UVMap')
    # two areas of the picture: the hair's thousand small locks (an even colour) on a narrow strip, the clothes, seams
    # and buttons on the rest; each area is unwrapped and packed on its own, then moved into place
    def unwrap(group, x0, x1):
        if not group: return
        _select(group, group[0])
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=.004)
        bpy.ops.object.mode_set(mode='OBJECT')
        for o in group:
            for d in o.data.uv_layers[0].data: d.uv = (x0 + d.uv[0] * (x1 - x0), d.uv[1])
    hair = [low[k] for k in cloth if k == 'hair']
    unwrap([o for o in objs if o not in hair], 0, 1 - UV_SHARE['hair'])
    unwrap(hair, 1 - UV_SHARE['hair'] + .004, 1)
    # bake: the colour (no light) and the soft shadow in the folds, from the full parts onto the thinned ones
    col_img = bpy.data.images.new('hd-colour', ATLAS, ATLAS); ao_img = bpy.data.images.new('hd-ao', ATLAS, ATLAS)
    col_img.generated_color = (0, 0, 0, 1); ao_img.generated_color = (1, 1, 1, 1)
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 16
    bk = scene.render.bake; bk.use_selected_to_active = True; bk.cage_extrusion = .012; bk.max_ray_distance = .05; bk.margin = 6; bk.use_clear = False
    for c in scene.collection.children: c.hide_render = False; c.hide_viewport = False
    def target(img):
        for o in objs:
            for m in o.data.materials:
                if not m or not m.use_nodes: continue
                nt = m.node_tree; t = nt.nodes.get('hd-bake') or nt.nodes.new('ShaderNodeTexImage'); t.name = 'hd-bake'; t.image = img; nt.nodes.active = t
    # (villagers: the light is baked into everything but the hair, whose thousands of small locks come out speckled;
    # the hair gets its clean colour and the soft shadow, and the game shades it)
    for img, kind in (((col_img, 'COMBINED'), (col_img, 'DIFFUSE'), (ao_img, 'AO')) if LIT else ((col_img, 'DIFFUSE'), (ao_img, 'AO'))):
        target(img)
        for k in cloth:
            if LIT and (kind == 'COMBINED') == (k in ('hair', 'hands')): continue   # (the hands came out dark too)
            _select([high[k], low[k]], low[k])
            if kind == 'COMBINED': scene.cycles.samples = 128; bpy.ops.object.bake(type='COMBINED', use_selected_to_active=True, cage_extrusion=.012, margin=6, use_clear=False)
            elif kind == 'DIFFUSE': bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_selected_to_active=True, cage_extrusion=.012, margin=6, use_clear=False)
            else: bpy.ops.object.bake(type='AO', use_selected_to_active=True, cage_extrusion=.012, margin=6, use_clear=False)
    c = np.array(col_img.pixels[:]).reshape(-1, 4); a = np.array(ao_img.pixels[:]).reshape(-1, 4)
    if not LIT: c[:, :3] *= (.32 + .68 * a[:, :1])   # the folds, seams and buttons a little deeper
    else:   # only the hair's strip takes the soft shadow (the rest has its light baked in)
        u = (np.arange(c.shape[0]) % ATLAS) / ATLAS; hs = u > 1 - UV_SHARE['hair']; c[hs, :3] *= (.45 + .55 * a[hs, :1])
    c[:, 3] = 1
    paint = bpy.data.images.new(WHO + '-hd', ATLAS, ATLAS); paint.pixels[:] = c.reshape(-1).tolist()
    paint.file_format = 'JPEG'; paint.pack()
    for k, h in high.items(): bpy.data.objects.remove(h)
    # one material per part: "cloth-<part>" with the picture, "skin" apart; the faces keep their colours in the corners
    total = 0
    for k, o in low.items():
        me = o.data; mats = list(me.materials); skin = next((m for m in mats if m and m.name.startswith('skin')), None)
        if k.startswith('face-'):
            colr = me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
            for poly in me.polygons:
                cc = _base(mats[poly.material_index] if poly.material_index < len(mats) else None)
                for li in poly.loop_indices: colr.data[li].color = cc
            me.color_attributes.active_color = colr
            one = bpy.data.materials.new(k); one.use_nodes = True; nt = one.node_tree; b = nt.nodes['Principled BSDF']
            ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'; nt.links.new(ca.outputs['Color'], b.inputs['Base Color'])
        else:
            one = bpy.data.materials.new(('lit-' if LIT and k not in ('hair', 'hands') else 'cloth-') + k); one.use_nodes = True; nt = one.node_tree; b = nt.nodes['Principled BSDF']
            t = nt.nodes.new('ShaderNodeTexImage'); t.image = paint; nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = .8
        if skin and k == 'hands': skin = skin.copy(); skin.name = 'skin-grip'
        if LIT and not k.startswith('face-'): skin = None   # (the skin is baked into the picture too)
        keep = [one] + ([skin] if skin else [])
        idx = [keep.index(skin) if (skin and mats[p.material_index] == skin) else 0 for p in me.polygons]
        me.materials.clear()
        for m in keep: me.materials.append(m)
        for p, i in zip(me.polygons, idx): p.material_index = i
        o.parent = rig; o.matrix_parent_inverse = rig.matrix_world.inverted()
        am = o.modifiers.new('rig', 'ARMATURE'); am.object = rig
        if not k.startswith('face-') or k == 'face-smile': total += _tris(o)
    print('hd: total triangles shown', total)
