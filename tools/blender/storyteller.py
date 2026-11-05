# The four friends as storytellers (round v1.08c; owner, 3 Nov 2026 AEDT: in the old tales the friends appear only at the
# start and the end, in their own clothes): a scene for storypage.py from a tale's first page, its own people taken out and
# Finn, Clara, Sol and Lumi standing together in front of it, for the film's opening (intro) and its goodbye (outro).
#   python3 tools/blender/storyteller.py <tale>-p0-0.json <out intro.json> <out outro.json>
import sys, json, math
src, oi, oo = sys.argv[1:4]
D = json.load(open(src))
(cx, cy, cz), (lx, ly, lz) = D['cams'][0]
# the friends stand where the first page's camera looks, facing the camera
dx, dz = cx - lx, cz - lz; yaw = math.atan2(dx, dz); c, s = math.cos(yaw), math.sin(yaw)
def m(x, z, turn=0.0):
    a = yaw + turn; ca, sa = math.cos(a), math.sin(a)
    px, pz = lx + x * c, lz - x * s
    return [ca, 0, -sa, 0, 0, 1, 0, 0, sa, 0, ca, 0, px, 0, pz, 1]
def scene(order, turns, cam_back, cam_up, look_up, moods, speaker):
    d = json.loads(json.dumps(D))
    # (faces with feeling) each friend's own feeling; one tells the story and the others look at them
    xs = (-1.35, -.45, .45, 1.35); sx = xs[order.index(speaker)]
    d['actors'] = [{'look': {}, 'kit': who, 'm': [m(x, 0, t)], 'state': ['idle'], 'mood': md, 'talk': who == speaker,
                    'eyes': None if who == speaker else ('lookL' if sx > x else 'lookR')} for who, x, t, md in zip(order, xs, turns, moods)]
    dist = 4.6 + cam_back
    d['cams'] = [[[lx + s * dist, cam_up, lz + c * dist], [lx, look_up, lz]]]
    return d
json.dump(scene(('finn', 'clara', 'sol', 'lumi'), (.25, .1, -.1, -.25), 0, 1.55, 1.0, ('smile', 'excited', 'smile', 'happy'), 'lumi'), open(oi, 'w'))   # the start: Lumi begins the story, Clara can't wait
json.dump(scene(('lumi', 'sol', 'clara', 'finn'), (.2, .08, -.08, -.2), .8, 1.8, 1.05, ('happy', 'happy', 'shy', 'excited'), 'finn'), open(oo, 'w'))   # the end: Finn says goodbye
