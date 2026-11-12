"""Run with Blender: -b --python THIS -- ORIGINAL_GLB REMESH_30K_GLB OUTPUT_BLEND.
Stores editable source meshes and packed textures; does not fit, rig or edit game files.
"""
import bpy
import sys
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:]
original, remesh, output=map(lambda p:str(Path(p).resolve()),args)
bpy.ops.wm.read_factory_settings(use_empty=True)
for label,path in [('original',original),('remesh-30k',remesh)]:
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    group=bpy.data.collections.new('cow-'+label)
    bpy.context.scene.collection.children.link(group)
    for obj in set(bpy.data.objects)-before:
        for collection in list(obj.users_collection):collection.objects.unlink(obj)
        group.objects.link(obj)
        obj.name='cow-'+label+'-'+obj.name
    group.hide_viewport=label=='original'
    group.hide_render=label=='original'
bpy.ops.file.pack_all()
bpy.context.scene['scope']='Cow only; original plus Meshy 30k. Unfitted, unrigged; no runtime install.'
bpy.context.scene['meshy_original_task']='01a1d19a-7a61-7711-9f5a-8687a2c45778'
bpy.context.scene['meshy_30k_task']='01a1d1ae-6111-76ee-b081-82919b93869b'
bpy.ops.wm.save_as_mainfile(filepath=output,compress=True)
print('WORKSPACE_SAVED',output)
