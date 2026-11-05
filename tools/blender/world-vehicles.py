# (v1.08e vehicles, owner 6 Nov 2026 AEDT: "blender all ... vehicles") Every vehicle a child sees or rides, as a
# small Blender model for js/modelkit.ts: models/world/veh-<id>.glb and boat-<id>.glb.
# Built from the blueprints of the game's own code shapes (tools/vehicle-blueprints.mts), so each model has exactly the
# size, place and facing of the code shape it replaces (colliders, seats and hit areas stay true). Blender gives it the
# picture-book look: welded and smoothed, thinned to its triangle budget, and soft shading baked into the corner colours
# (Cycles ambient occlusion, so the look holds with the game's three toon bands and no pictures).
# Parts that move are their own nodes: wheel0..n (they turn about their own x), and the moving groups (bed, turn, boom,
# arm, bucket). Named points for js/vehicles.ts seatRider: seat, seat2, handleL, handleR, pedalL, pedalR (and the
# passenger's handle2L/R, pedal2L/R on the xích lô), wheelAt for a car's steering wheel.
#   node tools/vehicle-blueprints.mts /tmp/bp.json
#   blender -b -P tools/blender/world-vehicles.py -- /tmp/bp.json <out dir> [names...]
#   then for each: npx -y gltfpack@0.20.0 -i <out>/<name>.glb -o models/world/<name>.glb -cc -kn -km   (tools/make-world-vehicles.mts)
import bpy, bmesh, sys, os, json, math
from mathutils import Vector, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:]
BP, OUT = argv[0], argv[1]; ONLY = set(argv[2:])
os.makedirs(OUT, exist_ok=True)
DATA = json.load(open(BP))

def to_b(x, y, z): return (x, -z, y)          # the game is y-up, Blender z-up; the glTF exporter turns it back
def budget(name, part, nwheels):
    if part == 'body': return 3200 if name.startswith(('veh-bus', 'veh-tram', 'veh-coach')) else 2600
    if part.startswith('wheel'): return 380 if nwheels <= 3 else 240 if nwheels <= 6 else 130
    return 600

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene; s.render.engine = 'CYCLES'; s.cycles.device = 'CPU'; s.cycles.samples = 24
    w = bpy.data.worlds.new('w'); s.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (1, 1, 1, 1)

def paint():
    m = bpy.data.materials.get('paint')
    if m: return m
    m = bpy.data.materials.new('paint'); m.use_nodes = True; nt = m.node_tree; bsdf = nt.nodes['Principled BSDF']
    ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'; nt.links.new(ca.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = .8; return m

def tris_of(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)

def part_obj(name, p):
    t, c = p['tris'], p['cols']
    me = bpy.data.meshes.new(p['name']); bm = bmesh.new(); cl = bm.loops.layers.float_color.new('Col')
    for i in range(0, len(t), 9):
        vs = [bm.verts.new(to_b(t[i + k], t[i + k + 1], t[i + k + 2])) for k in (0, 3, 6)]
        try: f = bm.faces.new(vs)
        except ValueError: continue
        for l, k in zip(f.loops, (0, 3, 6)): l[cl] = (c[i + k], c[i + k + 1], c[i + k + 2], 1)
    bm.to_mesh(me); bm.free()
    me.color_attributes.active_color = me.color_attributes['Col']
    o = bpy.data.objects.new(p['name'], me); bpy.context.scene.collection.objects.link(o); me.materials.append(paint())
    # weld the triangle soup (the corner colours stay), drop the specks, thin to the budget, smooth by angle
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=.0008)
    bmesh.ops.dissolve_degenerate(bm, dist=.0002, edges=bm.edges); bm.to_mesh(me); bm.free()
    want = budget(name, p['name'], sum(1 for q in DATA[name]['parts'] if q['name'].startswith('wheel')))
    if tris_of(o) > want * 1.1:
        d = o.modifiers.new('thin', 'DECIMATE'); d.decimate_type = 'COLLAPSE'; d.ratio = want / tris_of(o); d.use_collapse_triangulate = True
        with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]): bpy.ops.object.modifier_apply(modifier=d.name)
    with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o], selected_editable_objects=[o]):
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(42))
    return o

def bake_ao(objs):
    """soft shading baked into the corner colours: creases and undersides a little darker, the picture-book look"""
    for o in objs:
        me = o.data; ao = me.color_attributes.new('ao', 'FLOAT_COLOR', 'CORNER'); me.color_attributes.active_color = ao
    s = bpy.context.scene; s.cycles.bake_type = 'AO'; s.render.bake.target = 'VERTEX_COLORS'; s.world.light_settings.distance = .6
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    try: bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    except Exception as e: print('AO bake skipped', e)
    for o in objs:
        me = o.data; col, ao = me.color_attributes['Col'], me.color_attributes['ao']
        for i in range(len(col.data)):
            a = ao.data[i].color[0]; k = .62 + .38 * a; c = col.data[i].color
            col.data[i].color = (c[0] * k, c[1] * k, c[2] * k, 1)
        vals = [d.color[0] for d in ao.data]; print('AO', o.name, round(min(vals), 2), round(sum(vals) / max(1, len(vals)), 2), flush=True)
        me.color_attributes.remove(ao); me.color_attributes.active_color = me.color_attributes['Col']

def build(name):
    reset(); bp = DATA[name]; objs = {}
    for p in bp['parts']:
        if not p['tris']:
            o = bpy.data.objects.new(p['name'], None); bpy.context.scene.collection.objects.link(o)
        else: o = part_obj(name, p)
        objs[p['name']] = o
    for p in bp['parts']:
        o = objs[p['name']]
        if p['parent']: o.parent = objs[p['parent']]
        o.location = to_b(*p['pos']); qx, qy, qz, qw = p['quat']; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Quaternion((qw, qx, -qz, qy))
    root = objs['body']
    for k, v in bp['points'].items():
        e = bpy.data.objects.new(k, None); e.empty_display_size = .05; bpy.context.scene.collection.objects.link(e); e.parent = root; e.location = to_b(*v)
    meshes = [o for o in objs.values() if o.type == 'MESH']
    bpy.context.view_layer.update(); bake_ao(meshes)
    total = sum(tris_of(o) for o in meshes)
    path = os.path.join(OUT, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_animations=False, export_lights=False, export_cameras=False,
                              export_vertex_color='ACTIVE', export_normals=True, export_texcoords=False, export_yup=True)
    print('MODEL', name, total, 'tris', ' '.join(f'{o.name}:{tris_of(o)}' for o in meshes), flush=True)

for name in DATA:
    if ONLY and name not in ONLY: continue
    build(name)
