# Scale every picture in a .blend down to at most N px on its longer side and save a copy (a light model's 500 KB limit).
#   blender -b -P tools/meshy/tex_max.py -- in.blend out.blend 400
import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=a[0])
mx = int(a[2])
for im in bpy.data.images:
    w, h = im.size
    if max(w, h) > mx:
        k = mx / max(w, h); im.scale(max(1, int(w * k)), max(1, int(h * k))); im.pack()
        print('TM', im.name, w, h, '->', tuple(im.size))
bpy.ops.wm.save_as_mainfile(filepath=a[1])
