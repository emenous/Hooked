const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const blenderPath = "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe";
const sourceBlend = "assets/models/hyper3d-new/sling_hyper3d_new_skeletal.blend";
const outputBlend = "assets/models/hyper3d-new/sling_hyper3d_new_game_ready.blend";
const outputGlb = "assets/models/m_character_skeletal.glb";
const backupDir = "assets/models/backups";

fs.mkdirSync(backupDir, { recursive: true });
if (fs.existsSync(outputGlb)) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(outputGlb, path.join(backupDir, `m_character_skeletal_before_game_ready_export_${stamp}.glb`));
}

const code = String.raw`
import bpy
from math import radians
from mathutils import Vector

SOURCE_COLLECTION = "SKELETAL_EXPORT"
OUTPUT_COLLECTION = "GAME_READY_EXPORT"
SOURCE_ARMATURE = "Sling_Armature"
OUT_BLEND = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/hyper3d-new/sling_hyper3d_new_game_ready.blend"
OUT_GLB = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/m_character_skeletal.glb"

FINAL_MESHES = {
    "head": "head_pivot",
    "neck": "neck_pivot",
    "chest": "chest_pivot",
    "waist": "waist_pivot",
    "pelvis": "pelvis_pivot",
    "left_shoulder": "left_shoulder_pivot",
    "left_uppper_arm": "left_shoulder_pivot",
    "left_forearm": "left_elbow_pivot",
    "left_hand": "left_wrist_pivot",
    "right_shoulder": "right_shoulder_pivot",
    "right_upper_arm": "right_shoulder_pivot",
    "right_forearm": "right_elbow_pivot",
    "right_hand": "right_wrist_pivot",
    "left_thigh": "left_hip_pivot",
    "left_shin": "left_knee_pivot",
    "left_foot": "left_ankle_pivot",
    "right_thigh": "right_hip_pivot",
    "right_shin": "right_knee_pivot",
    "right_foot": "right_ankle_pivot",
}

BONE_PARENT = {
    "M_root": None,
    "pelvis_pivot": "M_root",
    "waist_pivot": "pelvis_pivot",
    "chest_pivot": "waist_pivot",
    "neck_pivot": "chest_pivot",
    "head_pivot": "neck_pivot",
    "ribbon_anchor": "head_pivot",
    "left_shoulder_pivot": "chest_pivot",
    "left_elbow_pivot": "left_shoulder_pivot",
    "left_wrist_pivot": "left_elbow_pivot",
    "left_wrist_anchor": "left_wrist_pivot",
    "right_shoulder_pivot": "chest_pivot",
    "right_elbow_pivot": "right_shoulder_pivot",
    "right_wrist_pivot": "right_elbow_pivot",
    "left_hip_pivot": "pelvis_pivot",
    "left_knee_pivot": "left_hip_pivot",
    "left_ankle_pivot": "left_knee_pivot",
    "right_hip_pivot": "pelvis_pivot",
    "right_knee_pivot": "right_hip_pivot",
    "right_ankle_pivot": "right_knee_pivot",
}

def find_object(name, collection=None):
    candidates = collection.objects if collection else bpy.data.objects
    for obj in candidates:
        if obj.name == name:
            return obj
    target = name.lower()
    for obj in candidates:
        if obj.name.lower() == target:
            return obj
    raise RuntimeError("Missing object: " + name)

def reset_pose(armature):
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")
    for pose_bone in armature.pose.bones:
        pose_bone.rotation_mode = "XYZ"
        pose_bone.location = (0, 0, 0)
        pose_bone.rotation_euler = (0, 0, 0)
        pose_bone.scale = (1, 1, 1)
    bpy.ops.object.mode_set(mode="OBJECT")

def blender_world_to_game(world_point, origin):
    shifted = world_point - origin
    # Source editing file is Blender/Rigify-friendly: X body width, -Y forward, Z up.
    # Runtime GLB is side-scroller-friendly: X forward/screen, Y up, Z depth.
    return Vector((-shifted.y, shifted.z, shifted.x))

def delete_collection(name):
    collection = bpy.data.collections.get(name)
    if collection is None:
        return
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.collections.remove(collection)

source_collection = bpy.data.collections.get(SOURCE_COLLECTION)
if source_collection is None:
    raise RuntimeError("Missing source collection: " + SOURCE_COLLECTION)

source_armature = bpy.data.objects.get(SOURCE_ARMATURE)
if source_armature is None:
    raise RuntimeError("Missing source armature: " + SOURCE_ARMATURE)

bpy.ops.object.mode_set(mode="OBJECT")
bpy.context.scene.frame_set(1)
reset_pose(source_armature)

bpy.context.view_layer.objects.active = source_armature
bpy.ops.object.mode_set(mode="EDIT")
source_edit_bones = source_armature.data.edit_bones
if "M_root" not in source_edit_bones:
    raise RuntimeError("Source armature has no M_root bone")

origin = source_armature.matrix_world @ source_edit_bones["M_root"].head
bone_heads = {}
bone_tails = {}
for bone_name in BONE_PARENT:
    bone = source_edit_bones.get(bone_name)
    if not bone:
        raise RuntimeError("Missing source bone: " + bone_name)
    bone_heads[bone_name] = blender_world_to_game(source_armature.matrix_world @ bone.head, origin)
    bone_tails[bone_name] = blender_world_to_game(source_armature.matrix_world @ bone.tail, origin)
bpy.ops.object.mode_set(mode="OBJECT")

for action in list(bpy.data.actions):
    bpy.data.actions.remove(action)

delete_collection(OUTPUT_COLLECTION)
export_collection = bpy.data.collections.new(OUTPUT_COLLECTION)
bpy.context.scene.collection.children.link(export_collection)

arm_data = bpy.data.armatures.new("Sling_Armature_data")
arm_obj = bpy.data.objects.new("Sling_Armature", arm_data)
export_collection.objects.link(arm_obj)
bpy.context.view_layer.objects.active = arm_obj
arm_obj.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")

edit_bones = {}
for bone_name in BONE_PARENT:
    bone = arm_data.edit_bones.new(bone_name)
    head = bone_heads[bone_name]
    tail = bone_tails[bone_name]
    if (tail - head).length < 0.025:
        tail = head + Vector((0, 0.08, 0))
    bone.head = head
    bone.tail = tail
    bone.roll = 0
    edit_bones[bone_name] = bone

for bone_name, parent_name in BONE_PARENT.items():
    if parent_name:
        edit_bones[bone_name].parent = edit_bones[parent_name]
        edit_bones[bone_name].use_connect = False

bpy.ops.object.mode_set(mode="OBJECT")
arm_data.display_type = "STICK"
arm_obj.show_in_front = True

bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 72
bpy.context.scene.render.fps = 30
for pose_bone in arm_obj.pose.bones:
    pose_bone.rotation_mode = "XYZ"

arm_obj.animation_data_create()
test_action = bpy.data.actions.new("Sling_rig_test")
arm_obj.animation_data.action = test_action

def key_rig_pose(frame, rotations):
    bpy.context.scene.frame_set(frame)
    for pose_bone in arm_obj.pose.bones:
        pose_bone.rotation_euler = (0, 0, 0)
        pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame)
    for bone_name, angle_degrees in rotations.items():
        pose_bone = arm_obj.pose.bones.get(bone_name)
        if pose_bone:
            pose_bone.rotation_euler[2] = radians(angle_degrees)
            pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame)

key_rig_pose(1, {})
key_rig_pose(18, {
    "left_shoulder_pivot": -38,
    "left_elbow_pivot": -8,
    "left_wrist_pivot": 6,
    "right_shoulder_pivot": 20,
    "right_elbow_pivot": -32,
    "left_hip_pivot": 18,
    "left_knee_pivot": -38,
    "left_ankle_pivot": 10,
    "right_hip_pivot": -12,
    "right_knee_pivot": -24,
    "right_ankle_pivot": 8,
})
key_rig_pose(36, {})
key_rig_pose(54, {
    "left_shoulder_pivot": 26,
    "left_elbow_pivot": -22,
    "right_shoulder_pivot": -34,
    "right_elbow_pivot": -8,
    "left_hip_pivot": -16,
    "left_knee_pivot": -24,
    "right_hip_pivot": 20,
    "right_knee_pivot": -38,
    "waist_pivot": -7,
    "chest_pivot": 9,
    "head_pivot": -6,
})
key_rig_pose(72, {})
bpy.context.scene.frame_set(1)

for mesh_name, bone_name in FINAL_MESHES.items():
    src = find_object(mesh_name, source_collection)
    mesh = bpy.data.meshes.new(mesh_name + "_mesh_data")
    verts = []
    for vertex in src.data.vertices:
        world = src.matrix_world @ vertex.co
        verts.append(blender_world_to_game(world, origin))

    faces = [tuple(poly.vertices) for poly in src.data.polygons]
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    for mat in src.data.materials:
        mesh.materials.append(mat.copy() if mat else None)
    for index, poly in enumerate(src.data.polygons):
        mesh.polygons[index].material_index = poly.material_index

    for src_uv_layer in src.data.uv_layers:
        dst_uv_layer = mesh.uv_layers.new(name=src_uv_layer.name)
        for poly in src.data.polygons:
            dst_poly = mesh.polygons[poly.index]
            for src_loop_index, dst_loop_index in zip(poly.loop_indices, dst_poly.loop_indices):
                dst_uv_layer.data[dst_loop_index].uv = src_uv_layer.data[src_loop_index].uv

    obj = bpy.data.objects.new(mesh_name, mesh)
    export_collection.objects.link(obj)
    obj.parent = arm_obj
    group = obj.vertex_groups.new(name=bone_name)
    group.add(list(range(len(mesh.vertices))), 1.0, "ADD")
    modifier = obj.modifiers.new("Rigid bone bind", "ARMATURE")
    modifier.object = arm_obj

for source in bpy.data.objects:
    if source.name not in {obj.name for obj in export_collection.objects}:
        source.hide_viewport = True
        source.hide_render = True

bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)

bpy.ops.object.select_all(action="DESELECT")
arm_obj.select_set(True)
for obj in export_collection.objects:
    obj.hide_viewport = False
    obj.hide_render = False
    if obj.type == "MESH":
        obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj

bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    export_apply=False,
    export_animations=True,
    export_yup=False,
    use_selection=True,
)

print("Saved game-ready skeletal blend:", OUT_BLEND)
print("Exported game-ready skeletal GLB:", OUT_GLB)
`;

const result = cp.spawnSync(
  blenderPath,
  ["-b", sourceBlend, "--python-expr", code],
  { cwd: process.cwd(), encoding: "utf8", timeout: 180000 },
);

process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.status ?? 1);
