const cp = require("child_process");

const code = String.raw`
import math
import bpy
from mathutils import Vector, Matrix

SOURCE_BLEND = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/hyper3d-new/sling_hyper3d_new_rig_prep_pivots_fixed.blend"
OUT_BLEND = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/hyper3d-new/sling_hyper3d_new_game_axes.blend"
OUT_GLB = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/m_character.glb"

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

PARENT = {
    "M_root": None,
    "pelvis_pivot": "M_root",
    "waist_pivot": "pelvis_pivot",
    "chest_pivot": "waist_pivot",
    "neck_pivot": "chest_pivot",
    "head_pivot": "neck_pivot",
    "left_shoulder_pivot": "chest_pivot",
    "left_elbow_pivot": "left_shoulder_pivot",
    "left_wrist_pivot": "left_elbow_pivot",
    "right_shoulder_pivot": "chest_pivot",
    "right_elbow_pivot": "right_shoulder_pivot",
    "right_wrist_pivot": "right_elbow_pivot",
    "left_hip_pivot": "pelvis_pivot",
    "left_knee_pivot": "left_hip_pivot",
    "left_ankle_pivot": "left_knee_pivot",
    "right_hip_pivot": "pelvis_pivot",
    "right_knee_pivot": "right_hip_pivot",
    "right_ankle_pivot": "right_knee_pivot",
    "left_wrist_anchor": "left_wrist_pivot",
    "ribbon_anchor": "head_pivot",
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
    # Blender source is upright in X/Z, with the front view facing along Y.
    # Hooked is a side-view game: screen X/Y are gameplay axes and Z is depth.
    # Map Blender vertical Z -> game Y, Blender side width X -> game depth Z,
    # and Blender front/back Y -> game X so the game camera sees a side profile.
    shifted = world_point - origin
    return Vector((-shifted.y, shifted.z, shifted.x))

source_objects = {name: find_obj(name) for name in set(FINAL_MESHES.keys()) | set(PARENT.keys())}
source_root = find_obj("M_root")
origin = source_root.matrix_world.translation.copy()
game_positions = {name: game_point(source_objects[name].matrix_world.translation, origin) for name in source_objects}

for source in list(bpy.data.objects):
    source.hide_viewport = True
    source.hide_render = True
    source.select_set(False)
    source.name = source.name + "_SOURCE"

export_collection = bpy.data.collections.new("GAME_AXIS_EXPORT")
bpy.context.scene.collection.children.link(export_collection)

created = {}

def pivot_local(world_point, pivot_name):
    return world_point - game_positions[pivot_name]

def empty_local(name, parent_name):
    if parent_name is None:
        return game_positions[name]
    return game_positions[name] - game_positions[parent_name]

for name, parent_name in PARENT.items():
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = "SPHERE" if name != "M_root" else "ARROWS"
    empty.empty_display_size = 0.055 if name != "M_root" else 0.16
    empty.rotation_euler = (0, 0, 0)
    export_collection.objects.link(empty)
    created[name] = empty

for name, parent_name in PARENT.items():
    child = created[name]
    if parent_name:
        parent = created[parent_name]
        child.parent = parent
    child.location = empty_local(name, parent_name)

for mesh_name, pivot_name in FINAL_MESHES.items():
    src = source_objects[mesh_name]
    pivot = created[pivot_name]
    mesh = bpy.data.meshes.new(mesh_name + "_mesh_data")

    verts = []
    for vertex in src.data.vertices:
        world = src.matrix_world @ vertex.co
        game_world = game_point(world, origin)
        verts.append(pivot_local(game_world, pivot_name))

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
    obj.parent = pivot
    obj.location = (0, 0, 0)
    obj.rotation_euler = (0, 0, 0)
    obj.scale = (1, 1, 1)
    export_collection.objects.link(obj)

bpy.ops.object.light_add(type="AREA", location=(0, -3, 3))
bpy.context.object.name = "game_axes_preview_light"
bpy.context.object.data.energy = 450
bpy.context.object.data.size = 5
export_collection.objects.link(bpy.context.object)
for coll in list(bpy.context.object.users_collection):
    if coll != export_collection:
        coll.objects.unlink(bpy.context.object)

bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)

bpy.ops.object.select_all(action="DESELECT")
for obj in export_collection.objects:
    obj.hide_viewport = False
    obj.hide_render = False
    obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    export_apply=True,
    export_animations=False,
    export_yup=False,
    use_selection=True,
)

print("Saved game-axis blend:", OUT_BLEND)
print("Exported game-axis GLB:", OUT_GLB)
`;

const result = cp.spawnSync(
  "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe",
  ["-b", "assets/models/hyper3d-new/sling_hyper3d_new_rig_prep_pivots_fixed.blend", "--python-expr", code],
  { cwd: process.cwd(), encoding: "utf8", timeout: 120000 },
);

process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.status ?? 1);
