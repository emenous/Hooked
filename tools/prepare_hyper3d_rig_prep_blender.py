import argparse
import math
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "models"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def collection(name):
    coll = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(coll)
    return coll


def move_to_collection(obj, coll):
    for old in obj.users_collection:
        old.objects.unlink(obj)
    coll.objects.link(obj)


def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = 0.78
    return mat


def hyper3d_material(import_dir):
    mat = bpy.data.materials.new("Hyper3D texture material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        return mat

    def connect_image(filename, input_name, color_space):
        path = import_dir / filename
        if not path.exists():
            return
        image = bpy.data.images.load(str(path))
        image.colorspace_settings.name = color_space
        node = nodes.new("ShaderNodeTexImage")
        node.image = image
        links.new(node.outputs["Color"], bsdf.inputs[input_name])

    connect_image("texture_diffuse.png", "Base Color", "sRGB")
    connect_image("texture_roughness.png", "Roughness", "Non-Color")
    connect_image("texture_metallic.png", "Metallic", "Non-Color")

    normal_path = import_dir / "texture_normal.png"
    if normal_path.exists():
        image = bpy.data.images.load(str(normal_path))
        image.colorspace_settings.name = "Non-Color"
        image_node = nodes.new("ShaderNodeTexImage")
        image_node.image = image
        normal_node = nodes.new("ShaderNodeNormalMap")
        links.new(image_node.outputs["Color"], normal_node.inputs["Color"])
        links.new(normal_node.outputs["Normal"], bsdf.inputs["Normal"])

    return mat


def empty(name, location=(0, 0, 0), parent=None, display="PLAIN_AXES", size=0.08):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = display
    obj.empty_display_size = size
    obj.location = location
    if parent:
        obj.parent = parent
    bpy.context.collection.objects.link(obj)
    return obj


def add_target_marker(name, location, parent, coll, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=8, radius=0.035, location=location)
    marker = bpy.context.object
    marker.name = f"target_{name}"
    marker.data.materials.append(mat)
    marker.parent = parent
    move_to_collection(marker, coll)
    return marker


def make_pivot_rig(coll):
    bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection
    root = empty("M_root", (0, 0, 0), None, "ARROWS", 0.22)
    move_to_collection(root, coll)

    pivots = {
        "pelvis": empty("pelvis_pivot", (0, -0.62, 0), root, "CUBE", 0.13),
        "waist": None,
        "chest": None,
        "neck": None,
        "head": None,
        "left_shoulder": None,
        "right_shoulder": None,
        "left_elbow": None,
        "right_elbow": None,
        "left_wrist": None,
        "right_wrist": None,
        "left_hip": None,
        "right_hip": None,
        "left_knee": None,
        "right_knee": None,
        "left_ankle": None,
        "right_ankle": None,
    }
    move_to_collection(pivots["pelvis"], coll)
    pivots["waist"] = empty("waist_pivot", (0, 0.3, 0), pivots["pelvis"], "SPHERE", 0.1)
    pivots["chest"] = empty("chest_pivot", (0, 0.38, 0), pivots["waist"], "CUBE", 0.12)
    pivots["neck"] = empty("neck_pivot", (-0.11, 0.28, 0), pivots["chest"], "SPHERE", 0.08)
    pivots["head"] = empty("head_pivot", (0, 0.42, 0), pivots["neck"], "SPHERE", 0.09)
    pivots["left_shoulder"] = empty("left_shoulder_pivot", (0.15, 0.08, 0), pivots["chest"], "SPHERE", 0.09)
    pivots["right_shoulder"] = empty("right_shoulder_pivot", (-0.08, 0.04, 0), pivots["chest"], "SPHERE", 0.09)
    pivots["left_elbow"] = empty("left_elbow_pivot", (0.5, 0, 0), pivots["left_shoulder"], "SPHERE", 0.08)
    pivots["right_elbow"] = empty("right_elbow_pivot", (0.42, 0, 0), pivots["right_shoulder"], "SPHERE", 0.08)
    pivots["left_wrist"] = empty("left_wrist_pivot", (0.52, 0, 0), pivots["left_elbow"], "SPHERE", 0.08)
    pivots["right_wrist"] = empty("right_wrist_pivot", (0.42, 0, 0), pivots["right_elbow"], "SPHERE", 0.08)
    pivots["left_hip"] = empty("left_hip_pivot", (0.06, -0.02, 0), pivots["pelvis"], "SPHERE", 0.09)
    pivots["right_hip"] = empty("right_hip_pivot", (-0.07, -0.01, 0), pivots["pelvis"], "SPHERE", 0.09)
    pivots["left_knee"] = empty("left_knee_pivot", (0.72, 0, 0), pivots["left_hip"], "SPHERE", 0.08)
    pivots["right_knee"] = empty("right_knee_pivot", (0.68, 0, 0), pivots["right_hip"], "SPHERE", 0.08)
    pivots["left_ankle"] = empty("left_ankle_pivot", (0.76, 0, 0), pivots["left_knee"], "SPHERE", 0.08)
    pivots["right_ankle"] = empty("right_ankle_pivot", (0.72, 0, 0), pivots["right_knee"], "SPHERE", 0.08)
    empty("left_wrist_anchor", (0.23, 0, 0), pivots["left_wrist"], "SPHERE", 0.06)
    empty("ribbon_anchor", (-0.24, 0.14, 0), pivots["head"], "SINGLE_ARROW", 0.07)

    for obj in bpy.context.scene.objects:
        if obj.type == "EMPTY" and obj.name not in coll.objects:
            move_to_collection(obj, coll)

    return root, pivots


def split_loose_parts(imported, parts_coll, mat):
    if not imported:
        raise RuntimeError("No mesh objects were imported from the Hyper3D OBJ")

    bpy.ops.object.select_all(action="DESELECT")
    for obj in imported:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
    if len(imported) > 1:
        bpy.ops.object.join()
        joined = bpy.context.object
    else:
        joined = imported[0]
        bpy.context.view_layer.objects.active = joined
        joined.select_set(True)
    joined.name = "hyper3d_actual_joined_for_split"
    joined.data.materials.clear()
    joined.data.materials.append(mat)

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")

    parts = [obj for obj in bpy.context.selected_objects if obj.type == "MESH"]
    parts.sort(key=lambda obj: obj.bound_box[0][0] if obj.bound_box else 0)
    for index, obj in enumerate(parts, start=1):
        obj.name = f"hyper3d_part_{index:02d}"
        obj.data.name = f"{obj.name}_mesh"
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        obj.rotation_euler[1] = math.radians(90)
        obj.location = (0, 0, 0)
        move_to_collection(obj, parts_coll)
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
        obj.select_set(False)
    return parts


def add_notes(coll):
    text = bpy.data.texts.new("README_HYPER3D_RIG_PREP")
    text.write(
        "Hooked Hyper3D rig prep\n\n"
        "Goal: use the real Hyper3D meshes, not the procedural stand-in.\n\n"
        "Collections:\n"
        "- HYPER3D_LOOSE_PARTS: the actual exported model, split into loose movable pieces.\n"
        "- GAME_RIG_PIVOTS: named empties that src/main.js already animates.\n"
        "- ASSEMBLY_TARGETS: small green markers for the intended joint/character layout.\n\n"
        "Manual work needed:\n"
        "1. Move/rotate/scale each hyper3d_part_* into one assembled side-view character.\n"
        "2. Parent each assembled piece to the matching pivot empty, keeping transforms.\n"
        "3. If a piece contains multiple body parts, split it further in Edit Mode.\n"
        "4. Set pivot origins/empty positions exactly at the visible circular joints.\n"
        "5. Hide/delete unused exploded reference parts.\n"
        "6. Export GLB as assets/models/m_character.glb with the pivot names preserved.\n"
    )

    font_curve = bpy.data.curves.new("rig_prep_notes_curve", "FONT")
    font_curve.body = "Open README_HYPER3D_RIG_PREP in Blender Text Editor"
    font_curve.align_x = "LEFT"
    font_curve.size = 0.08
    obj = bpy.data.objects.new("rig_prep_notes_label", font_curve)
    obj.location = (-1.8, -1.7, 0)
    bpy.context.collection.objects.link(obj)
    move_to_collection(obj, coll)


def prepare(zip_path):
    clear_scene()
    temp_root = Path(tempfile.gettempdir()) / "hooked_hyper3d_rig_prep"
    if temp_root.exists():
        shutil.rmtree(temp_root)
    temp_root.mkdir(parents=True)

    with zipfile.ZipFile(zip_path) as archive:
        archive.extractall(temp_root)

    parts_coll = collection("HYPER3D_LOOSE_PARTS")
    rig_coll = collection("GAME_RIG_PIVOTS")
    target_coll = collection("ASSEMBLY_TARGETS")
    notes_coll = collection("NOTES")

    mat = hyper3d_material(temp_root)
    target_mat = material("Target marker green", (0.1, 1.0, 0.45, 1))

    before_import = set(bpy.data.objects)
    bpy.ops.wm.obj_import(filepath=str(temp_root / "base.obj"))
    imported = [obj for obj in bpy.data.objects if obj not in before_import and obj.type == "MESH"]
    parts = split_loose_parts(imported, parts_coll, mat)

    root, pivots = make_pivot_rig(rig_coll)
    target_locations = {
        "head": (0.0, 0.76, 0.02),
        "left_shoulder": (0.15, 0.16, 0.02),
        "left_elbow": (0.64, 0.12, 0.02),
        "left_wrist": (1.12, 0.08, 0.02),
        "left_hip": (0.07, -0.67, 0.02),
        "left_knee": (0.76, -0.7, 0.02),
        "left_ankle": (1.46, -0.7, 0.02),
    }
    for name, loc in target_locations.items():
        add_target_marker(name, loc, root, target_coll, target_mat)

    for obj in parts:
        obj.hide_select = False
    add_notes(notes_coll)

    bpy.ops.object.light_add(type="AREA", location=(0, -3, 5))
    bpy.context.object.name = "rig_prep_area_light"
    bpy.context.object.data.energy = 450
    bpy.context.object.data.size = 5
    bpy.ops.object.camera_add(location=(0, 0.1, 6), rotation=(0, 0, 0))
    bpy.context.scene.camera = bpy.context.object
    bpy.context.object.name = "rig_prep_side_camera"
    bpy.context.object.data.type = "ORTHO"
    bpy.context.object.data.ortho_scale = 4.2

    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_DIR / "hyper3d_rig_prep.blend"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", required=True)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else sys.argv[1:]
    args = parser.parse_args(argv)
    prepare(Path(args.zip))


if __name__ == "__main__":
    main()
