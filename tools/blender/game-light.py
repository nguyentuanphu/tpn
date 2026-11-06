# (v1.08b friends) The light game model of a friend for phones (plan docs/plans/new-friends-characters.md, section 7):
# reads the full game .glb that lumi.py makes (`lumi.py -- <dir> <who> game glb`, about 40 MB, a million triangles) and
# thins every part to its own triangle budget, keeping the skeleton (the game's joint names), the skin weights, the
# moves (walk, idle, wave, cheer, ride, sit, passenger), the eight face moods (one mesh each) and the plain colours
# (no texture: each part keeps its material colour, and the game recolours the "skin" material for the skin tone).
#   blender -b -P tools/blender/game-light.py -- <in.glb> <out.glb>
# then: gltfpack -i out.glb -o models/<who>.glb -cc -kn -km   (meshopt compression; tools/make-friends.mts does both)
import bpy, sys
from mathutils import Vector
KEY = Vector((-.45, -.6, .66)).normalized()   # the key light, from above and the viewer's left (the person's right)
argv = sys.argv[sys.argv.index('--') + 1:]
SRC, DST = argv[0], argv[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
# triangle budgets per part, about 7,000 in all (v1.08d polish: the item in the hand and the boots, once in the body's
# 3,600, are parts of their own now: the body keeps the rest)
BUDGET = {'body': 2400, 'head': 900, 'hair': 4200, 'hands': 260, 'item': 350, 'shoes': 250}
FACE = 420  # each of the eleven face moods (only one shows at a time); (v1.08e faces) 280 left the eyes faceted
# (v1.08e villagers) the villagers' clothes are layers close together (a shirt over shorts, a belt): thinned to 3,000 the
# lower layer showed through in patches, so their bodies keep more
if any(o.name.startswith('villager-') for o in bpy.context.scene.objects if o.type == 'MESH'): BUDGET['body'] = 4600
def tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)
total = 0
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    key = next((k for k in BUDGET if ('-' + k) in o.name), None)
    want = BUDGET[key] if key else FACE
    have = tris(o)
    if '-hair' in o.name or '-hat' in o.name:   # (v1.08e, Release 6 Nov: every lock and hat shell facing out, none drawn dark)
        import bmesh; bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(o.data); bm.free(); o.data.update()
    if o.data.shape_keys: print('light:', o.name, have, '(kept: its mood keys)'); total += have; continue   # (v1.08e part 3: the face, built small)
    for _ in range(3):  # (small separate pieces, such as Lumi's leaves, thin less each time: up to three goes)
        now = tris(o)
        if now <= want * 1.15: break
        d = o.modifiers.new('thin', 'DECIMATE'); d.decimate_type = 'COLLAPSE'; d.ratio = want / now; d.use_collapse_triangulate = True
        o.modifiers.move(o.modifiers.find(d.name), 0)  # (before the skin, so the weights are thinned with the shape)
        with bpy.context.temp_override(object=o, active_object=o):
            bpy.ops.object.modifier_apply(modifier=d.name)
    print('light:', o.name, have, '->', tris(o)); total += tris(o)
print('light: total triangles', total)
# (v1.08e, owner 6 Nov: the sculpted head thinned on its own, its shape kept) joined to the body again: one part, as before
_h = next((o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.endswith('-head')), None)
_b = next((o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.endswith('-body')), None)
if _h and _b:
    with bpy.context.temp_override(active_object=_b, selected_editable_objects=[_b, _h], selected_objects=[_b, _h]): bpy.ops.object.join()
# fewer draws: each part's colours go into its corners (one colour per face, from its material), so a part draws with one
# material, plus "skin" kept apart for the skin tone; a face mood's material is named "face-<mood>" so the game finds it
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    me = o.data; mats = list(me.materials)
    if not mats: continue
    def base(m):
        if m and m.use_nodes:
            for n in m.node_tree.nodes:
                if n.type == 'BSDF_PRINCIPLED': return tuple(n.inputs['Base Color'].default_value)
        return (1, 1, 1, 1)
    col = me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
    skin0 = next((m for m in mats if m and m.name.startswith('skin')), None); cn = me.corner_normals
    for poly in me.polygons:
        c = base(mats[poly.material_index] if poly.material_index < len(mats) else None)
        if skin0 is not None and mats[poly.material_index] == skin0 and 'hands' not in o.name:
            # (v1.08e, owner 6 Nov: the flat skin lost all modelling) the skin's corners carry a soft key light from above-left
            # (the game multiplies the skin tone by it, "skin-shade"); the same light as the high-detail models (game-hd.py)
            for li in poly.loop_indices:
                n = cn[li].vector; k = max(0.0, n.dot(KEY)); v = .64 + .36 * min(1.0, .72 * k + .38 * (.5 + .5 * n.z)); col.data[li].color = (v, v, v, 1)
            continue
        for li in poly.loop_indices: col.data[li].color = c
    me.color_attributes.active_color = col
    part = o.name.split('-', 1)[1] if '-' in o.name else o.name
    one = bpy.data.materials.new(part if part.startswith('face') else 'cloth-' + part); one.use_nodes = True   # (face-<mood>, or face3d)
    nt = one.node_tree; bsdf = nt.nodes['Principled BSDF']; ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'
    nt.links.new(ca.outputs['Color'], bsdf.inputs['Base Color']); bsdf.inputs['Roughness'].default_value = .8
    skin = next((m for m in mats if m and m.name.startswith('skin')), None)
    if skin and 'hands' not in part: skin = skin.copy(); skin.name = 'skin-shade'   # (its corners carry the shading)
    if skin and 'hands' in part: skin = skin.copy(); skin.name = 'skin-grip'  # (the hands that hold handlebars: shown when riding)
    keep = [one] + ([skin] if skin else [])
    idx = [keep.index(skin) if (skin and mats[p.material_index] == skin0) else 0 for p in me.polygons]   # (the polygons' own skin material, before the copy)
    me.materials.clear()
    for m in keep: me.materials.append(m)
    for p, i in zip(me.polygons, idx): p.material_index = i
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.name.split('-')[0] in ('finn', 'sol', 'clara', 'lumi', 'villager')]:  # (v1.08e: the villagers too)
    bpy.data.objects.remove(o)  # (the importer's bone shapes)
bpy.ops.export_scene.gltf(filepath=DST, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS', export_lights=False,
                          export_cameras=False, export_apply=False, export_skins=True, export_morph=True, export_morph_normal=False, use_selection=False,
                          export_vertex_color='ACTIVE')
