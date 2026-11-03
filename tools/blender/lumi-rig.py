# ---------- skeleton with the game's joint names (js/avatar.ts), skin weights, and moves: walk, idle, wave, cheer ----------
# L is the friend's own left (+x here; the friend faces -y). Bones: root > torso > head, armL > elbowL, armR > elbowR; root > legL > kneeL, legR > kneeR.
KNEE = (B['zCr'] + B['zAnk']) / 2 + .02 * S
def joints():
    j = {'root': (Vector((0, 0, 0)), Vector((0, 0, B['zCr'] * .5))), 'torso': (Vector((0, 0, B['zCr'])), Vector((0, 0, B['zN']))),
         'head': (Vector((0, 0, B['zN'])), HC + Vector((0, 0, R)))}
    for s, n in ((1, 'L'), (-1, 'R')):
        sh, el, wr = [Vector((s * p[0], p[1], p[2])) for p in (B['sh'], B['el'], B['wr'])]
        j['arm' + n] = (sh, el); j['elbow' + n] = (el, wr + (wr - el).normalized() * B['rA'] * 2.2)
        j['leg' + n] = (Vector((s * B['legX'], 0, B['zCr'])), Vector((s * B['legX'], 0, KNEE)))
        j['knee' + n] = (Vector((s * B['legX'], 0, KNEE)), Vector((s * B['legX'], -.01, B['zAnk'])))
    return j
PARENT = {'torso': 'root', 'head': 'torso', 'armL': 'torso', 'armR': 'torso', 'elbowL': 'armL', 'elbowR': 'armR', 'legL': 'root', 'legR': 'root', 'kneeL': 'legL', 'kneeR': 'legR'}
J = joints()
ad = bpy.data.armatures.new('rig'); rig = bpy.data.objects.new('rig', ad); scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
for n, (h, t) in J.items():
    eb = ad.edit_bones.new(n); eb.head, eb.tail = h, t; eb.roll = 0
for n, p in PARENT.items(): ad.edit_bones[n].parent = ad.edit_bones[p]
bpy.ops.object.mode_set(mode='OBJECT')

HAND_PROPS = ('lantern', 'staff', 'vineLeaf', 'staffPetal', 'staffHeart', 'compass', 'sunCrystal', 'sunRay', 'basket')
TORSO_ONLY = ('shirt', 'collar', 'bib', 'backPanel', 'strap', 'button', 'bibStar', 'pocketLeaf', 'bag', 'belt', 'buckle', 'coat', 'spyglass', 'bodice', 'skirt', 'frill', 'petalHem', 'corset', 'brace', 'tunic', 'cape', 'clasp', 'sun', 'apron', 'scarf', 'aoBaBa', 'longSkirt', 'aoDai', 'dressTop', 'dressSkirt', 'dressBelt', 'tee', 'pocket', 'dressStrap', 'necklace', 'bowtie', 'redScarf', 'backpack')
ARM = ('arm', 'sleeve', 'sleeveRoll', 'hand', 'thumb', 'coatSleeve', 'coatCuff', 'shirtSleeve', 'glove', 'sleevePuff', 'sleeveFrill', 'watch', 'bracelet')
LEG = ('leg', 'sock', 'sockRib', 'boot', 'bootToe', 'sole', 'bootCuff', 'bootLeaf', 'bootStrap', 'bootBuckle', 'lace', 'shoe', 'sandal', 'toes', 'rainboot', 'sneaker', 'thong', 'longSock')
HIP = ('shortsLeg', 'shortsCuff', 'trouser', 'seat')
def seg_d(p, a, b):
    ab = b - a; t = max(0, min(1, (p - a).dot(ab) / ab.length_squared)); return (p - (a + ab * t)).length
def bind(o, rigid=None):
    base = o.name.split('.')[0]
    if base.startswith('soft_'): base = 'soft'
    for key in sorted(HAND_PROPS + TORSO_ONLY + ARM + LEG + HIP, key=len, reverse=True):
        if base.startswith(key): base = key; break
    mw = o.matrix_world.copy(); groups = {}
    def g(n):
        if n not in groups: groups[n] = o.vertex_groups.new(name=n)
        return groups[n]
    for v in o.data.vertices:
        p = mw @ v.co; side = 'L' if p.x > 0 else 'R'
        if rigid: w = {rigid: 1.0}
        elif base.startswith(HAND_PROPS): w = {'elbowL': 1.0}
        elif base in TORSO_ONLY: w = {'torso': 1.0}
        elif base == 'neck': w = {'torso': .5, 'head': .5} if p.z > B['zN'] else {'torso': 1.0}
        elif base == 'soft':  # a melted garment or the skin: choose the bones by where the point is
            sh = J['arm' + side][0]; d_arm = min(seg_d(p, *J['arm' + side]), seg_d(p, *J['elbow' + side]))
            if d_arm < B['rU'] * 2.1 and abs(p.x) > B['wC'] * .75 and p.z < sh.z + B['rU'] * 1.6:
                cand = ['arm' + side, 'elbow' + side] + (['torso'] if (p - sh).length < B['rU'] * 2.4 else [])
            elif p.z < B['zCr'] + .02 * S: cand = ['leg' + side, 'knee' + side] + (['torso'] if p.z > B['zCr'] - .07 * S else [])
            elif p.z > B['zN'] - .015: cand = ['torso', 'head']
            else: w = {'torso': 1.0}; cand = None
            if cand:
                ws = {n: 1 / (seg_d(p, *J[n]) + .004) ** 6 for n in cand}
                top = sorted(ws.items(), key=lambda kv: -kv[1])[:2]; tot = sum(x for _, x in top); w = {n: x / tot for n, x in top}
        else:
            cand = ['arm' + side, 'elbow' + side] if base in ARM else ['leg' + side, 'knee' + side] if base in LEG else ['torso', 'leg' + side, 'knee' + side] if base in HIP else ['torso', 'leg' + side, 'knee' + side, 'arm' + side, 'elbow' + side]
            ws = {n: 1 / (seg_d(p, *J[n]) + .004) ** 6 for n in cand}
            top = sorted(ws.items(), key=lambda kv: -kv[1])[:2]; tot = sum(x for _, x in top); w = {n: x / tot for n, x in top}
        for n, x in w.items(): g(n).add([v.index], x, 'REPLACE')
    mods = [(m.type, getattr(m, 'levels', 0), getattr(m, 'render_levels', 0), getattr(m, 'thickness', 0)) for m in o.modifiers]
    for m in list(o.modifiers): o.modifiers.remove(m)
    am = o.modifiers.new('rig', 'ARMATURE'); am.object = rig
    for t, lv, rlv, th in mods:
        m = o.modifiers.new(t.lower(), t)
        if t == 'SUBSURF': m.levels, m.render_levels = lv, rlv
        if t == 'SOLIDIFY': m.thickness = th
    o.parent = rig
for col in bpy.data.collections:
    rigid = 'head' if col.name.split('.')[0] in ('hair', 'hat') or col.name.startswith('face-') else None
    for o in col.objects:
        if o.type == 'MESH': bind(o, rigid)
for o in list(scene.collection.objects):
    if o.type == 'MESH' and o.name.split('.')[0] in ('head', 'ear'): bind(o, 'head')
    if o.type == 'LIGHT' and o.name.startswith(('lanternLight', 'propLight')):
        mw = o.matrix_world.copy(); o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = 'elbowL'; o.matrix_world = mw

# moves, matching the game's own poses: the legs swing from the hip, a knee bends as its leg comes forward, the arms swing against the legs
pb = rig.pose.bones
for b in pb: b.rotation_mode = 'XYZ'
def key(f, pose, lift=0.0):
    for n, (x, y, z) in pose.items(): pb[n].rotation_euler = (x, y, z); pb[n].keyframe_insert('rotation_euler', frame=f)
    if isinstance(lift, tuple): pb['root'].location = lift   # (sideways, up, forward) in the root bone's own axes
    else: pb['root'].location = (0, lift, 0)
    pb['root'].keyframe_insert('location', frame=f)   # the root bone points up: its local y is world z
def rest(): return {n: (0, 0, 0) for n in J}
def action(name, frames, make, loop=True):
    rig.animation_data_create(); act = bpy.data.actions.new(name); rig.animation_data.action = act
    for f in range(frames + 1):
        pose, lift = make(f / frames); key(f + 1, pose, lift)
    for fc in act.fcurves:
        for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'
        if loop: fc.modifiers.new('CYCLES')
    act.use_fake_user = True; return act
def walk(t):
    a = 2 * math.pi * t; p = rest(); sa, ca = math.sin(a), math.cos(a)
    p['root'] = (0, .09 * sa, .035 * math.cos(2 * a + .5))   # the hips turn with each step and sway a little
    p['legL'] = (-.45 * sa + .05, 0, 0); p['legR'] = (.45 * sa + .05, 0, 0)
    p['kneeL'] = (.1 + .8 * max(0, ca) ** 1.4 + .08 * max(0, -sa), 0, 0); p['kneeR'] = (.1 + .8 * max(0, -ca) ** 1.4 + .08 * max(0, sa), 0, 0)
    p['armL'] = (.34 * math.sin(a - .25), 0, -.1); p['armR'] = (-.34 * math.sin(a - .25), 0, .1)
    p['elbowL'] = (-.28 - .22 * max(0, -math.sin(a - .4)), 0, 0); p['elbowR'] = (-.28 - .22 * max(0, math.sin(a - .4)), 0, 0)
    p['torso'] = (-.04, -.13 * sa, -.03 * math.cos(2 * a + .5)); p['head'] = (.025 * math.cos(2 * a + .8), .04 * sa, .02 * math.cos(2 * a + .5))
    return p, .016 * math.cos(2 * a + .3) - .012
def idle(t):
    a = 2 * math.pi * t; p = rest()
    p['torso'] = (.02 * math.sin(a), 0, .02 * math.sin(a * .5 * 2)); p['head'] = (.04 * math.sin(a + 1), .06 * math.sin(a), .04 * math.sin(a * 2))
    p['armL'] = (.04 * math.sin(a), 0, -.1); p['armR'] = (.04 * math.sin(a + .5), 0, .1); p['elbowL'] = (-.25, 0, 0); p['elbowR'] = (-.15, 0, 0)
    p['kneeL'] = (.05, 0, 0); p['kneeR'] = (.05, 0, 0)
    return p, .004 * math.sin(a)
def wave(t):
    a = 2 * math.pi * t; p, lift = idle(t)
    p['armR'] = (-.25, 0, 2.5); p['elbowR'] = (-.35 * 0, 0, .45 + .45 * math.sin(2 * a)); p['head'] = (.05, -.08, .1)
    return p, lift
def cheer(t):
    a = 2 * math.pi * t; up = max(0, math.sin(a)); p = rest()
    p['armL'] = (-.3, 0, -2.4 - .3 * up); p['armR'] = (-.3, 0, 2.4 + .3 * up); p['elbowL'] = (-.3, 0, 0); p['elbowR'] = (-.3, 0, 0)
    p['kneeL'] = (.5 * (1 - up), 0, 0); p['kneeR'] = (.5 * (1 - up), 0, 0); p['legL'] = (-.25 * (1 - up), 0, 0); p['legR'] = (-.25 * (1 - up), 0, 0)
    p['head'] = (.12 * up, 0, 0)
    return p, .14 * up - .035 * (1 - up)
CANE = [o for o in bpy.data.objects if o.name.startswith('cane')]
for o in CANE: o.vertex_groups.clear(); o.vertex_groups.new(name='elbowR').add(list(range(len(o.data.vertices))), 1.0, 'REPLACE')
def sit(t):   # sitting on a seat: thighs forward, shins down, hands on the lap
    a = 2 * math.pi * t; p = rest()
    p['legL'] = (-1.5, 0, -.06); p['legR'] = (-1.5, 0, .06); p['kneeL'] = (1.5, 0, 0); p['kneeR'] = (1.5, 0, 0)
    p['armL'] = (-.45, 0, -.12); p['armR'] = (-.45, 0, .12); p['elbowL'] = (-.75, 0, 0); p['elbowR'] = (-.75, 0, 0)
    p['torso'] = (.02 * math.sin(a), 0, 0); p['head'] = (.03 * math.sin(a + 1), .1 * math.sin(a), 0)
    return p, 0.0
def ride(t):  # riding a bicycle or a scooter: astride, hands forward on the handlebars, leaning in
    a = 2 * math.pi * t; p = rest(); pedal = 1.0   # pedalling (frame 7: one foot forward and up, one back and down)
    p['legL'] = (-1.15 - pedal * .35 * math.sin(a), 0, -.18); p['legR'] = (-1.15 + pedal * .35 * math.sin(a), 0, .18)
    p['kneeL'] = (1.25 + pedal * .35 * math.sin(a), 0, 0); p['kneeR'] = (1.25 - pedal * .35 * math.sin(a), 0, 0)
    p['armL'] = (-.85, 0, -.05); p['armR'] = (-.85, 0, .05); p['elbowL'] = (-.45, 0, 0); p['elbowR'] = (-.45, 0, 0)
    p['torso'] = (-.28, 0, 0); p['head'] = (.2, .06 * math.sin(a), 0)
    return p, 0.0
def passenger(t):  # sitting behind the rider, hands at the rider's waist
    p, lift = ride(t); p['armL'] = (-.8, 0, .15); p['armR'] = (-.8, 0, -.15); p['elbowL'] = (-.5, 0, 0); p['elbowR'] = (-.5, 0, 0); p['torso'] = (-.1, 0, 0); return p, lift
ACTIONS = {'walk': action('walk', 24, walk), 'idle': action('idle', 48, idle), 'wave': action('wave', 24, wave), 'cheer': action('cheer', 24, cheer), 'sit': action('sit', 48, sit), 'ride': action('ride', 24, ride), 'passenger': action('passenger', 48, passenger)}
for n, act in ACTIONS.items():
    tr = rig.animation_data.nla_tracks.new(); tr.name = n; tr.strips.new(n, 1, act); tr.mute = True
rig.animation_data.action = ACTIONS['idle']

def lighten():
    for o in [o for o in scene.objects if o.name.startswith('ground')]: bpy.data.objects.remove(o)
    """for phones: bake the smoothing, join the parts into one mesh per group (body, hair, each face) and thin the hair"""
    rig.animation_data.action = None
    for b in pb: b.rotation_euler = (0, 0, 0); b.location = (0, 0, 0)
    dg = bpy.context.evaluated_depsgraph_get()
    groups = {}
    for o in [o for o in scene.objects if o.type == 'MESH' and o.parent == rig]:
        for m in o.modifiers:
            if m.type == 'SUBSURF': m.levels = 0 if o.users_collection[0].name == 'hair' else min(m.levels, 1)
            if m.type == 'ARMATURE': m.show_viewport = False
        dg.update(); names = [g.name for g in o.vertex_groups]
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        n = bpy.data.objects.new(o.name + '_l', me); n.matrix_world = o.matrix_world
        for g in names: n.vertex_groups.new(name=g)
        col = o.users_collection[0]; col.objects.link(n)
        key = col.name if col != scene.collection else 'body'
        groups.setdefault(key, []).append(n); bpy.data.objects.remove(o)
    for key, objs in groups.items():
        with bpy.context.temp_override(active_object=objs[0], selected_editable_objects=objs, selected_objects=objs):
            bpy.ops.object.join()
        o = objs[0]; o.name = WHO + '-' + key; o.parent = rig; o.matrix_parent_inverse = rig.matrix_world.inverted()
        am = o.modifiers.new('rig', 'ARMATURE'); am.object = rig
    # glTF keeps a plain colour: unhook the felt mottle so the base colour is the friend's own
    for m in bpy.data.materials:
        if m.use_nodes and 'Principled BSDF' in m.node_tree.nodes:
            b = m.node_tree.nodes['Principled BSDF']
            for l in list(b.inputs['Base Color'].links): m.node_tree.links.remove(l)
