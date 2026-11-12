# Optional offline QA: blender -b --python scripts/render-model-preview.py
import bpy, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/models/pi4.glb'))
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=False
scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(0.63,0.69,0.65,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
bpy.ops.mesh.primitive_plane_add(size=2, location=(0,0,-.005));plane=bpy.context.object
mat=bpy.data.materials.new('Neutral stage');mat.diffuse_color=(.36,.42,.39,1);plane.data.materials.append(mat)
for loc,power,size in [((-.06,-.06,.15),.65,.12),((.1,.03,.12),.3,.08)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,0,0))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(.105,-.125,.115));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.005))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=.13;cam.data.clip_start=.0001;scene.camera=cam
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=90;scene.render.filepath=str(ROOT / 'docs/hardware-model-preview.jpg')
bpy.ops.render.render(write_still=True)
