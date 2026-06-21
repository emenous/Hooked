import argparse
import math
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "models"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def empty(name, x=0, y=0, z=0, parent=None, display="PLAIN_AXES", size=0.08):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = display
    obj.empty_display_size = size
    obj.location = (x, y, z)
    if parent:
        obj.parent = parent
    bpy.context.collection.objects.link(obj)
    return obj


def make_principled_material(import_dir):
    mat = bpy.data.materials.new("Hyper3D actual material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        return mat

    def add_image(filename, socket_name, color_space="sRGB"):
        path = import_dir / filename
        if not path.exists():
            return
        image = bpy.data.images.load(str(path))
        image.colorspace_settings.name = color_space
        node = nodes.new("ShaderNodeTexImage")
        node.image = image
        links.new(node.outputs["Color"], bsdf.inputs[socket_name])

    add_image("texture_diffuse.png", "Base Color", "sRGB")
    add_image("texture_roughness.png", "Roughness", "Non-Color")
    add_image("texture_metallic.png", "Metallic", "Non-Color")

    normal_path = import_dir / "texture_normal.png"
    if normal_path.exists():
        image = bpy.data.images.load(str(normal_path))
        image.colorspace_settings.name = "Non-Color"
        image_node = nodes.new("ShaderNodeTexImage")
        image_node.image = image
        normal_node = nodes.new("ShaderNodeNormalMap")
        links.new(image_node.outputs["Color"], normal_node.inputs["Color"])
        links.new(normal_node.outputs["Normal"], bsdf.inputs["Normal"])

    bsdf.inputs["Roughness"].default_value = 0.78
    return mat


def create_game_pivots():
    root = empty("M_root", display="ARROWS", size=0.2)
    pelvis = empty("pelvis_pivot", 0, -0.62, 0, root, "CUBE", 0.12)
    waist = empty("waist_pivot", 0, 0.3, 0, pelvis, "SPHERE", 0.09)
    chest = empty("chest_pivot", 0, 0.38, 0, waist, "CUBE", 0.11)
    neck = empty("neck_pivot", -0.11, 0.28, 0, chest, "SPHERE", 0.075)
    head = empty("head_pivot", 0, 0.42, 0, neck, "SPHERE", 0.08)
    left_shoulder = empty("left_shoulder_pivot", 0.15, 0.08, 0, chest, "SPHERE", 0.08)
    right_shoulder = empty("right_shoulder_pivot", -0.08, 0.04, 0, chest, "SPHERE", 0.08)
    left_elbow = empty("left_elbow_pivot", 0.5, 0, 0, left_shoulder, "SPHERE", 0.075)
    right_elbow = empty("right_elbow_pivot", 0.42, 0, 0, right_shoulder, "SPHERE", 0.075)
    left_wrist = empty("left_wrist_pivot", 0.52, 0, 0, left_elbow, "SPHERE", 0.075)
    right_wrist = empty("right_wrist_pivot", 0.42, 0, 0, right_elbow, "SPHERE", 0.075)
    left_hip = empty("left_hip_pivot", 0.06, -0.02, 0, pelvis, "SPHERE", 0.08)
    right_hip = empty("right_hip_pivot", -0.07, -0.01, 0, pelvis, "SPHERE", 0.08)
    left_knee = empty("left_knee_pivot", 0.72, 0, 0, left_hip, "SPHERE", 0.075)
    right_knee = empty("right_knee_pivot", 0.68, 0, 0, right_hip, "SPHERE", 0.075)
    empty("left_ankle_pivot", 0.76, 0, 0, left_knee, "SPHERE", 0.075)
    empty("right_ankle_pivot", 0.72, 0, 0, right_knee, "SPHERE", 0.075)
    empty("left_wrist_anchor", 0.23, 0, 0, left_wrist, "SPHERE", 0.06)
    empty("ribbon_anchor", -0.24, 0.14, 0, head, "SINGLE_ARROW", 0.07)
    return root


def import_actual_model(zip_path):
    clear_scene()
    temp_root = Path(tempfile.gettempdir()) / "hooked_hyper3d_import"
    if temp_root.exists():
        shutil.rmtree(temp_root)
    temp_root.mkdir(parents=True)

    with zipfile.ZipFile(zip_path) as archive:
        archive.extractall(temp_root)

    obj_path = temp_root / "base.obj"
    if not obj_path.exists():
        raise FileNotFoundError(f"base.obj not found in {zip_path}")

    bpy.ops.wm.obj_import(filepath=str(obj_path))
    imported = [obj for obj in bpy.context.selected_objects if obj.type == "MESH"]
    mat = make_principled_material(temp_root)
    for obj in imported:
        obj.name = "hyper3d_actual_mesh"
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        obj.rotation_euler = (0, 0, 0)
        obj.location = (0, 0, 0)

    root = create_game_pivots()
    holder = empty("hyper3d_actual_static_model", parent=root, display="CUBE", size=0.12)
    holder.location = (0, -0.98, 0)
    holder.scale = (2.3, 2.3, 2.3)
    holder.rotation_euler[2] = 0

    # Hyper3D's useful side silhouette is in the source Z/Y plane. Rotate it into
    # the game's X/Y plane, then keep the whole mesh as one static child for now.
    for obj in imported:
        obj.parent = holder
        obj.rotation_euler[1] = math.radians(90)
        obj.location = (0, 0, 0)

    bpy.ops.object.light_add(type="AREA", location=(0, -3, 5))
    bpy.context.object.name = "Hyper3D_preview_area_light"
    bpy.context.object.data.energy = 450
    bpy.context.object.data.size = 5
    bpy.ops.object.camera_add(location=(0, 0.25, 6), rotation=(0, 0, 0))
    bpy.context.scene.camera = bpy.context.object
    bpy.context.object.name = "Hyper3D_preview_side_camera"
    bpy.context.object.data.type = "ORTHO"
    bpy.context.object.data.ortho_scale = 4.1

    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_DIR / "hyper3d_character.blend"))
    bpy.ops.export_scene.gltf(
        filepath=str(OUT_DIR / "hyper3d_character.glb"),
        export_format="GLB",
        export_apply=True,
        export_animations=False,
        export_yup=False,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", required=True, help="Path to the Hyper3D export zip")
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else sys.argv[1:]
    args = parser.parse_args(argv)
    import_actual_model(Path(args.zip))


if __name__ == "__main__":
    main()
