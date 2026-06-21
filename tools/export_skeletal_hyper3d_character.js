const cp = require("child_process");

const code = String.raw`
import bpy
from mathutils import Vector

OUT_BLEND = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/hyper3d-new/sling_hyper3d_new_skeletal.blend"
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

TAIL_TARGET = {
    "M_root": "waist_pivot",
    "pelvis_pivot": "waist_pivot",
    "waist_pivot": "chest_pivot",
    "chest_pivot": "neck_pivot",
    "neck_pivot": "head_pivot",
    "left_shoulder_pivot": "left_elbow_pivot",
    "left_elbow_pivot": "left_wrist_pivot",
    "left_wrist_pivot": "left_wrist_anchor",
    "right_shoulder_pivot": "right_elbow_pivot",
    "right_elbow_pivot": "right_wrist_pivot",
    "left_hip_pivot": "left_knee_pivot",
    "left_knee_pivot": "left_ankle_pivot",
    "right_hip_pivot": "right_knee_pivot",
    "right_knee_pivot": "right_ankle_pivot",
}

EXTRA_TAILS = {
    "head_pivot": Vector((0, 0.18, 0)),
    "ribbon_anchor": Vector((0.08, 0, 0)),
    "left_wrist_anchor": Vector((0.08, 0, 0)),
    "right_wrist_pivot": Vector((0.18, 0, 0)),
    "left_ankle_pivot": Vector((0.22, -0.04, 0)),
    "right_ankle_pivot": Vector((0.22, -0.04, 0)),
}

def find_obj(name):
    found = bpy.data.objects.get(name)
    if found:
        return found
    target = name.strip().lower()
    for candidate in bpy.data.objects:
        if candidate.name.strip().lower() == target:
            return candidate
    raise RuntimeError("Missing object: " + name)

def game_point(world_point, origin):
    shifted = world_point - origin
    return Vector((-shifted.y, shifted.z, shifted.x))

source_names = set(FINAL_MESHES.keys()) | set(BONE_PARENT.keys())
source_objects = {name: find_obj(name) for name in source_names}
origin = find_obj("M_root").matrix_world.translation.copy()
game_positions = {name: game_point(source_objects[name].matrix_world.translation, origin) for name in source_objects}

for source in list(bpy.data.objects):
    source.hide_viewport = True
    source.hide_render = True
    source.select_set(False)
    source.name = source.name + "_SOURCE"

export_collection = bpy.data.collections.new("SKELETAL_EXPORT")
bpy.context.scene.collection.children.link(export_collection)

arm_data = bpy.data.armatures.new("Sling_Armature_data")
arm_obj = bpy.data.objects.new("Sling_Armature", arm_data)
export_collection.objects.link(arm_obj)
bpy.context.view_layer.objects.active = arm_obj
arm_obj.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")

edit_bones = {}
for bone_name in BONE_PARENT.keys():
    bone = arm_data.edit_bones.new(bone_name)
    head = game_positions[bone_name]
    target_name = TAIL_TARGET.get(bone_name)
    if target_name:
        tail = game_positions[target_name]
    else:
        tail = head + EXTRA_TAILS.get(bone_name, Vector((0, 0.12, 0)))
    if (tail - head).length < 0.025:
        tail = head + EXTRA_TAILS.get(bone_name, Vector((0, 0.12, 0)))
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

for mesh_name, bone_name in FINAL_MESHES.items():
    src = source_objects[mesh_name]
    mesh = bpy.data.meshes.new(mesh_name + "_mesh_data")
    verts = []
    for vertex in src.data.vertices:
        world = src.matrix_world @ vertex.co
        verts.append(game_point(world, origin))

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
            for src_loop_index, dst_loop_index in zip(poly.loop_indices, mesh.polygons[poly.index].loop_indices):
                dst_uv_layer.data[dst_loop_index].uv = src_uv_layer.data[src_loop_index].uv

    obj = bpy.data.objects.new(mesh_name.strip(), mesh)
    export_collection.objects.link(obj)
    obj.parent = arm_obj
    group = obj.vertex_groups.new(name=bone_name)
    group.add(list(range(len(mesh.vertices))), 1.0, "ADD")
    modifier = obj.modifiers.new("Rigid bone bind", "ARMATURE")
    modifier.object = arm_obj

bpy.ops.object.light_add(type="AREA", location=(0, -3, 3))
bpy.context.object.name = "skeletal_preview_light"
bpy.context.object.data.energy = 450
bpy.context.object.data.size = 5
export_collection.objects.link(bpy.context.object)
for coll in list(bpy.context.object.users_collection):
    if coll != export_collection:
        coll.objects.unlink(bpy.context.object)

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

print("Saved skeletal blend:", OUT_BLEND)
print("Exported skeletal GLB:", OUT_GLB)
`;

const result = cp.spawnSync(
  "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe",
  ["-b", "assets/models/hyper3d-new/sling_hyper3d_new_rig_prep_pivots_fixed.blend", "--python-expr", code],
  { cwd: process.cwd(), encoding: "utf8", timeout: 120000 },
);

process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.status ?? 1);
