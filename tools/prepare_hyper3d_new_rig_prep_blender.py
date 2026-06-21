import argparse
import math
import shutil
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_GLB = ROOT / "assets" / "models" / "hyper3d-new" / "sling-hyper3d-new-pbr.glb"
DEFAULT_OUT = ROOT / "assets" / "models" / "hyper3d-new" / "sling_hyper3d_new_rig_prep.blend"


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def collection(name):
    coll = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(coll)
    return coll


def move_to_collection(obj, coll):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    coll.objects.link(obj)


def empty(name, location=(0, 0, 0), parent=None, display="PLAIN_AXES", size=0.08, coll=None):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = display
    obj.empty_display_size = size
    obj.location = location
    if parent:
        obj.parent = parent
    bpy.context.collection.objects.link(obj)
    if coll:
        move_to_collection(obj, coll)
    return obj


def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = 0.78
    return mat


def world_bbox(objects):
    points = []
    for obj in objects:
        if obj.type != "MESH":
            continue
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    xs = [p.x for p in points]
    ys = [p.y for p in points]
    zs = [p.z for p in points]
    return (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs))


def copy_object_tree(objects, target_coll, suffix):
    copies = []
    for obj in objects:
        new_obj = obj.copy()
        if obj.data:
            new_obj.data = obj.data.copy()
        new_obj.name = f"{obj.name}_{suffix}"
        new_obj.data.name = f"{new_obj.name}_mesh" if new_obj.data else new_obj.name
        target_coll.objects.link(new_obj)
        copies.append(new_obj)
    return copies


def make_pivot_rig(coll, bbox):
    min_x, max_x, min_y, max_y, min_z, max_z = bbox
    height = max_z - min_z
    center_x = (min_x + max_x) * 0.5
    center_y = (min_y + max_y) * 0.5

    def loc(x, y, z):
        return (center_x + x, center_y + y, min_z + z * height)

    root = empty("M_root", loc(0, 0, 0.47), None, "ARROWS", 0.16, coll)
    pelvis = empty("pelvis_pivot", loc(0, 0, 0.48), root, "CUBE", 0.08, coll)
    waist = empty("waist_pivot", loc(0, 0, 0.58), pelvis, "SPHERE", 0.065, coll)
    chest = empty("chest_pivot", loc(0, 0, 0.69), waist, "CUBE", 0.07, coll)
    neck = empty("neck_pivot", loc(0, 0, 0.81), chest, "SPHERE", 0.055, coll)
    head = empty("head_pivot", loc(0, 0, 0.88), neck, "SPHERE", 0.06, coll)

    left_shoulder = empty("left_shoulder_pivot", loc(0.17, 0, 0.71), chest, "SPHERE", 0.06, coll)
    right_shoulder = empty("right_shoulder_pivot", loc(-0.17, 0, 0.71), chest, "SPHERE", 0.06, coll)
    left_elbow = empty("left_elbow_pivot", loc(0.25, 0, 0.57), left_shoulder, "SPHERE", 0.055, coll)
    right_elbow = empty("right_elbow_pivot", loc(-0.25, 0, 0.57), right_shoulder, "SPHERE", 0.055, coll)
    left_wrist = empty("left_wrist_pivot", loc(0.25, 0, 0.43), left_elbow, "SPHERE", 0.05, coll)
    right_wrist = empty("right_wrist_pivot", loc(-0.25, 0, 0.43), right_elbow, "SPHERE", 0.05, coll)

    left_hip = empty("left_hip_pivot", loc(0.11, 0, 0.48), pelvis, "SPHERE", 0.06, coll)
    right_hip = empty("right_hip_pivot", loc(-0.11, 0, 0.48), pelvis, "SPHERE", 0.06, coll)
    left_knee = empty("left_knee_pivot", loc(0.1, 0, 0.29), left_hip, "SPHERE", 0.055, coll)
    right_knee = empty("right_knee_pivot", loc(-0.1, 0, 0.29), right_hip, "SPHERE", 0.055, coll)
    left_ankle = empty("left_ankle_pivot", loc(0.1, 0, 0.08), left_knee, "SPHERE", 0.05, coll)
    right_ankle = empty("right_ankle_pivot", loc(-0.1, 0, 0.08), right_knee, "SPHERE", 0.05, coll)
    empty("left_wrist_anchor", loc(0.25, -0.04, 0.42), left_wrist, "SPHERE", 0.04, coll)
    empty("ribbon_anchor", loc(0, -0.07, 0.93), head, "SINGLE_ARROW", 0.05, coll)

    return root


def add_target_markers(coll, bbox):
    mat = material("Target marker green", (0.08, 1.0, 0.45, 1))
    min_x, max_x, min_y, max_y, min_z, max_z = bbox
    height = max_z - min_z
    center_x = (min_x + max_x) * 0.5
    center_y = (min_y + max_y) * 0.5
    points = {
        "head": (0, 0, 0.88),
        "neck": (0, 0, 0.8),
        "chest": (0, 0, 0.68),
        "pelvis": (0, 0, 0.48),
        "left_shoulder": (0.17, 0, 0.71),
        "left_elbow": (0.25, 0, 0.57),
        "left_wrist": (0.25, 0, 0.43),
        "left_hip": (0.11, 0, 0.48),
        "left_knee": (0.1, 0, 0.29),
        "left_ankle": (0.1, 0, 0.08),
        "right_shoulder": (-0.17, 0, 0.71),
        "right_elbow": (-0.25, 0, 0.57),
        "right_wrist": (-0.25, 0, 0.43),
        "right_hip": (-0.11, 0, 0.48),
        "right_knee": (-0.1, 0, 0.29),
        "right_ankle": (-0.1, 0, 0.08),
    }
    for name, (x, y, z) in points.items():
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=24,
            ring_count=8,
            radius=0.018,
            location=(center_x + x, center_y + y, min_z + z * height),
        )
        marker = bpy.context.object
        marker.name = f"target_{name}"
        marker.data.materials.append(mat)
        move_to_collection(marker, coll)


def separate_loose_and_materials(work_objects, target_coll):
    generated = []
    for obj in work_objects:
        if obj.type != "MESH":
            continue
        bpy.ops.object.select_all(action="DESELECT")
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)

        if len(obj.data.materials) > 1:
            bpy.ops.object.mode_set(mode="EDIT")
            bpy.ops.mesh.select_all(action="DESELECT")
            bpy.ops.object.mode_set(mode="OBJECT")
            for slot_index, mat in enumerate(obj.data.materials):
                if not mat:
                    continue
                for poly in obj.data.polygons:
                    poly.select = poly.material_index == slot_index
                bpy.ops.object.mode_set(mode="EDIT")
                bpy.ops.mesh.separate(type="SELECTED")
                bpy.ops.object.mode_set(mode="OBJECT")
                selected = [item for item in bpy.context.selected_objects if item.type == "MESH"]
                for item in selected:
                    if item not in generated and item != obj:
                        generated.append(item)

        bpy.ops.object.select_all(action="DESELECT")
        candidates = [obj] + [item for item in generated if item.type == "MESH"]
        for item in candidates:
            if item.name in bpy.data.objects:
                item.select_set(True)
                bpy.context.view_layer.objects.active = item
                try:
                    bpy.ops.object.mode_set(mode="EDIT")
                    bpy.ops.mesh.select_all(action="SELECT")
                    bpy.ops.mesh.separate(type="LOOSE")
                    bpy.ops.object.mode_set(mode="OBJECT")
                except RuntimeError:
                    bpy.ops.object.mode_set(mode="OBJECT")

    parts = [obj for obj in bpy.context.scene.objects if obj.type == "MESH" and obj.name.endswith("_WORK")]
    parts.extend(obj for obj in bpy.context.selected_objects if obj.type == "MESH" and obj not in parts)
    for index, obj in enumerate([o for o in bpy.context.scene.objects if o.type == "MESH" and "REFERENCE" not in o.name], start=1):
        if any(coll.name == target_coll.name for coll in obj.users_collection):
            obj.name = f"auto_part_{index:02d}_{obj.name}"
    return parts


def add_notes():
    text = bpy.data.texts.new("README_SLING_HYPER3D_NEW_RIG_PREP")
    text.write(
        "SLING Hyper3D new rig prep\n\n"
        "This file is non-destructive. The untouched imported model is in REFERENCE_ORIGINAL.\n"
        "Work from AUTO_SPLIT_WORK and MANUAL_SPLIT_WORK.\n\n"
        "Recommended split strategy:\n"
        "1. Use existing armor seams and black joint gaps as boundaries.\n"
        "2. Separate with P > Selection. Do not delete faces unless you are sure.\n"
        "3. Let parts overlap slightly under circular joints. This prevents visible gaps.\n"
        "4. Parent each final mesh to the matching empty in GAME_RIG_PIVOTS.\n"
        "5. Put each pivot/origin at the visible center of rotation.\n"
        "6. Hide or delete guide markers before final export.\n\n"
        "Final export target: assets/models/m_character.glb\n"
    )


def prepare(glb_path, out_path):
    clear_scene()
    ref_coll = collection("REFERENCE_ORIGINAL_DO_NOT_EDIT")
    work_coll = collection("MANUAL_SPLIT_WORK")
    auto_coll = collection("AUTO_SPLIT_EXPERIMENT")
    rig_coll = collection("GAME_RIG_PIVOTS")
    target_coll = collection("JOINT_TARGET_MARKERS")

    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(glb_path))
    imported = [obj for obj in bpy.data.objects if obj not in before]
    mesh_objects = [obj for obj in imported if obj.type == "MESH"]
    bbox = world_bbox(mesh_objects)

    for obj in imported:
        move_to_collection(obj, ref_coll)
        obj.name = f"{obj.name}_REFERENCE"
        obj.hide_select = True

    work_copies = copy_object_tree(mesh_objects, work_coll, "WORK")
    auto_copies = copy_object_tree(mesh_objects, auto_coll, "AUTO")
    for obj in auto_copies:
        obj.name = f"{obj.name}_WORK"
    separate_loose_and_materials(auto_copies, auto_coll)

    make_pivot_rig(rig_coll, bbox)
    add_target_markers(target_coll, bbox)
    add_notes()

    min_x, max_x, min_y, max_y, min_z, max_z = bbox
    bpy.ops.object.light_add(type="AREA", location=(0, -3, max_z + 2))
    bpy.context.object.name = "rig_prep_area_light"
    bpy.context.object.data.energy = 500
    bpy.context.object.data.size = 5
    bpy.ops.object.camera_add(location=(0, -4, min_z + (max_z - min_z) * 0.55), rotation=(math.radians(90), 0, 0))
    bpy.context.scene.camera = bpy.context.object
    bpy.context.object.name = "rig_prep_front_camera"
    bpy.context.object.data.type = "ORTHO"
    bpy.context.object.data.ortho_scale = (max_z - min_z) * 1.25

    bpy.ops.wm.save_as_mainfile(filepath=str(out_path))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--glb", default=str(DEFAULT_GLB))
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    args = parser.parse_args(argv)
    prepare(Path(args.glb), Path(args.out))


if __name__ == "__main__":
    main()
