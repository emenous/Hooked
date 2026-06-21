import math
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "models"
OUT_DIR.mkdir(parents=True, exist_ok=True)

VIEW_Z = 0.0


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = 0.78
        bsdf.inputs["Metallic"].default_value = 0.18
    return mat


MATS = {}


def make_materials():
    global MATS
    MATS = {
        "gold": material("M gold armor", (1.0, 0.62, 0.02, 1)),
        "gold_light": material("M bright bevels", (1.0, 0.84, 0.2, 1)),
        "gold_dark": material("M shaded armor", (0.58, 0.34, 0.04, 1)),
        "gold_shadow": material("M back-side armor shadow", (0.36, 0.24, 0.06, 1)),
        "black": material("M black under-suit", (0.025, 0.032, 0.035, 1)),
        "charcoal": material("M charcoal joints", (0.08, 0.1, 0.11, 1)),
        "joint_dark": material("M joint dark core", (0.015, 0.018, 0.018, 1)),
        "joint_grey": material("M joint graphite rim", (0.22, 0.24, 0.23, 1)),
        "deep_shadow": material("M overlap shadow", (0.008, 0.011, 0.012, 1)),
        "red": material("M red details", (0.92, 0.08, 0.02, 1)),
        "red_dark": material("M dark red inset", (0.35, 0.015, 0.006, 1)),
        "glow": material("M red eye glow", (1.0, 0.08, 0.03, 1)),
    }


def empty(name, x, y, parent=None, display="PLAIN_AXES", size=0.08):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = display
    obj.empty_display_size = size
    obj.location = (x, y, VIEW_Z)
    if parent:
        obj.parent = parent
    bpy.context.collection.objects.link(obj)
    return obj


def polygon_mesh(name, points, mat_key, parent=None, z=0.0):
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata([(x, y, z) for x, y in points], [], [tuple(range(len(points)))])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(MATS[mat_key])
    if parent:
        obj.parent = parent
    bpy.context.collection.objects.link(obj)
    return obj


def outlined_polygon(name, points, mat_key, parent=None, z=0.0, outline=0.018):
    """Layer a dark duplicate behind a flat armor polygon for readable comic-book edges."""
    cx = sum(point[0] for point in points) / len(points)
    cy = sum(point[1] for point in points) / len(points)
    outline_points = []
    for x, y in points:
        dx = x - cx
        dy = y - cy
        length = math.hypot(dx, dy) or 1
        outline_points.append((x + dx / length * outline, y + dy / length * outline))
    polygon_mesh(name + "_outline", outline_points, "deep_shadow", parent, z - 0.006)
    return polygon_mesh(name, points, mat_key, parent, z)


def rect_points(x, y, w, h, rot=0.0):
    hw = w * 0.5
    hh = h * 0.5
    cr = math.cos(rot)
    sr = math.sin(rot)
    points = []
    for px, py in [(-hw, -hh), (hw, -hh), (hw, hh), (-hw, hh)]:
        points.append((x + px * cr - py * sr, y + px * sr + py * cr))
    return points


def box(name, x, y, w, h, mat_key, parent=None, z=0.0, rot=0.0):
    return polygon_mesh(name, rect_points(x, y, w, h, rot), mat_key, parent, z)


def outlined_box(name, x, y, w, h, mat_key, parent=None, z=0.0, rot=0.0, outline=0.014):
    return outlined_polygon(name, rect_points(x, y, w, h, rot), mat_key, parent, z, outline)


def circle_points(x, y, r, sides=28):
    return [
        (x + math.cos(math.tau * i / sides) * r, y + math.sin(math.tau * i / sides) * r)
        for i in range(sides)
    ]


def circle(name, x, y, r, mat_key, parent=None, z=0.0, sides=28):
    return polygon_mesh(name, circle_points(x, y, r, sides), mat_key, parent, z)


def ring(name, x, y, parent=None, z=0.16, outer=0.1, inner=0.055):
    circle(name + "_shadow", x, y, outer * 1.14, "deep_shadow", parent, z - 0.006, 30)
    circle(name + "_outer", x, y, outer, "joint_dark", parent, z, 30)
    circle(name + "_rim", x, y, outer * 0.74, "gold_light", parent, z + 0.003, 24)
    circle(name + "_inner", x, y, inner, "joint_dark", parent, z + 0.006, 22)


def limb_segment(prefix, parent_pivot, end_pivot_name, length, width, mat_key, z, angle=0.0, child_offset=None, shadow_key="gold_dark"):
    """Create a segment whose local origin is the joint. The child pivot sits at the distal joint."""
    outlined_box(prefix + "_plate", length * 0.5, 0, length, width, mat_key, parent_pivot, z, angle)
    box(prefix + "_edge_highlight", length * 0.48, width * 0.28, length * 0.58, width * 0.16, "gold_light", parent_pivot, z + 0.004, angle)
    box(prefix + "_shade", length * 0.48, -width * 0.2, length * 0.76, width * 0.24, shadow_key, parent_pivot, z + 0.006, angle)
    ring(prefix + "_start_joint", 0, 0, parent_pivot, z + 0.014, outer=width * 0.74, inner=width * 0.42)
    if child_offset is None:
        child_offset = (length, 0)
    child = empty(end_pivot_name, child_offset[0], child_offset[1], parent_pivot, "SPHERE", 0.075)
    ring(prefix + "_end_joint", child.location.x, child.location.y, parent_pivot, z + 0.014, outer=width * 0.64, inner=width * 0.36)
    return child


def vent_stack(name, x, y, parent, z, count=4, spacing=0.07, rot=0.0):
    back_height = spacing * (count - 1) + 0.09
    outlined_box(name + "_socket", x, y - spacing * 0.5, 0.11, back_height, "deep_shadow", parent, z, rot, 0.01)
    for index in range(count):
        box(f"{name}_red_slat_{index + 1}", x, y - index * spacing, 0.085, 0.032, "red", parent, z + 0.012, rot)


def add_fingers(prefix, wrist, z, mirrored=False):
    direction = -1 if mirrored else 1
    for index, offset in enumerate([-0.045, 0.0, 0.045]):
        outlined_box(f"{prefix}_finger_{index + 1}", 0.17, offset, 0.12, 0.026, "gold_light", wrist, z, 0.02 * direction, 0.006)
    outlined_box(f"{prefix}_thumb", 0.08, -0.085 * direction, 0.1, 0.028, "gold", wrist, z + 0.004, -0.65 * direction, 0.006)


def add_ribbon_root(parent):
    for index, y in enumerate([0.15, 0.03]):
        outlined_polygon(
            f"head_ribbon_root_{index + 1}",
            [(-0.34, y + 0.045), (-0.68, y + 0.09), (-0.76, y + 0.01), (-0.44, y - 0.035)],
            "red",
            parent,
            0.07 - index * 0.004,
            0.01,
        )


def add_action_key(obj, frame, rotation_degrees):
    bpy.context.scene.frame_set(frame)
    obj.rotation_euler[2] = math.radians(rotation_degrees)
    obj.keyframe_insert(data_path="rotation_euler", frame=frame)


def create_preview_animation(pivots):
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 72
    for frame, pose in [
        (1, {"left_shoulder": -86, "left_elbow": -16, "right_shoulder": -8, "right_elbow": -42, "left_hip": -96, "left_knee": 24, "right_hip": -70, "right_knee": 32, "head": -8}),
        (24, {"left_shoulder": -132, "left_elbow": -34, "right_shoulder": 22, "right_elbow": -78, "left_hip": -42, "left_knee": 56, "right_hip": -18, "right_knee": 48, "head": -18}),
        (48, {"left_shoulder": -156, "left_elbow": -20, "right_shoulder": 40, "right_elbow": -52, "left_hip": 8, "left_knee": 38, "right_hip": 34, "right_knee": 24, "head": -26}),
        (72, {"left_shoulder": -86, "left_elbow": -16, "right_shoulder": -8, "right_elbow": -42, "left_hip": -96, "left_knee": 24, "right_hip": -70, "right_knee": 32, "head": -8}),
    ]:
        add_action_key(pivots["left_shoulder"], frame, pose["left_shoulder"])
        add_action_key(pivots["left_elbow"], frame, pose["left_elbow"])
        add_action_key(pivots["right_shoulder"], frame, pose["right_shoulder"])
        add_action_key(pivots["right_elbow"], frame, pose["right_elbow"])
        add_action_key(pivots["left_hip"], frame, pose["left_hip"])
        add_action_key(pivots["left_knee"], frame, pose["left_knee"])
        add_action_key(pivots["right_hip"], frame, pose["right_hip"])
        add_action_key(pivots["right_knee"], frame, pose["right_knee"])
        add_action_key(pivots["head"], frame, pose["head"])

    if pivots["root"].animation_data and pivots["root"].animation_data.action:
        pivots["root"].animation_data.action.name = "m_physics_puppet_preview"


def build_character():
    clear_scene()
    make_materials()

    root = empty("M_root", 0, 0, None, "ARROWS", 0.18)
    pelvis = empty("pelvis_pivot", 0, -0.66, root, "CUBE", 0.12)
    waist = empty("waist_pivot", 0.0, 0.32, pelvis, "SPHERE", 0.09)
    chest = empty("chest_pivot", 0.0, 0.39, waist, "CUBE", 0.11)
    neck = empty("neck_pivot", -0.1, 0.3, chest, "SPHERE", 0.075)
    head = empty("head_pivot", 0.0, 0.44, neck, "SPHERE", 0.08)
    left_shoulder = empty("left_shoulder_pivot", 0.15, 0.1, chest, "SPHERE", 0.08)
    right_shoulder = empty("right_shoulder_pivot", -0.09, 0.05, chest, "SPHERE", 0.08)
    left_hip = empty("left_hip_pivot", 0.07, -0.02, pelvis, "SPHERE", 0.08)
    right_hip = empty("right_hip_pivot", -0.08, -0.01, pelvis, "SPHERE", 0.08)

    outlined_polygon("pelvis_black_socket", [(-0.25, 0.12), (0.16, 0.11), (0.24, -0.12), (0.06, -0.3), (-0.23, -0.18)], "black", pelvis, 0.01)
    outlined_polygon("pelvis_gold_shell", [(-0.19, 0.08), (0.13, 0.1), (0.24, -0.08), (0.09, -0.25), (-0.2, -0.16)], "gold", pelvis, 0.055)
    polygon_mesh("pelvis_shadow_lip", [(-0.2, -0.04), (0.1, -0.06), (0.04, -0.23), (-0.19, -0.17)], "deep_shadow", pelvis, 0.072)
    ring("pelvis_side_socket", 0.06, -0.02, pelvis, 0.12, 0.14, 0.075)

    outlined_polygon("lower_torso_black_core", [(-0.16, 0.3), (0.1, 0.25), (0.18, -0.23), (0.02, -0.39), (-0.17, -0.29)], "black", waist, 0.01)
    outlined_polygon("waist_gold_side_band", [(0.02, 0.14), (0.2, 0.06), (0.15, -0.24), (-0.02, -0.18)], "gold", waist, 0.05)
    vent_stack("waist_side_vents", 0.105, 0.05, waist, 0.12, count=3, spacing=0.075, rot=-0.05)

    outlined_polygon("upper_torso_black_core", [(-0.19, 0.27), (0.1, 0.24), (0.26, -0.12), (0.09, -0.35), (-0.22, -0.19)], "black", chest, 0.01)
    outlined_polygon("chest_gold_front_plate", [(-0.05, 0.18), (0.22, 0.2), (0.42, -0.08), (0.19, -0.28), (-0.03, -0.21)], "gold", chest, 0.065)
    polygon_mesh("chest_overlap_shadow", [(-0.13, 0.15), (0.06, 0.13), (0.0, -0.24), (-0.19, -0.18)], "deep_shadow", chest, 0.08)
    vent_stack("chest_side_vents", 0.18, 0.03, chest, 0.14, count=4, spacing=0.062, rot=0.03)
    outlined_box("neck_black_stack", 0.0, 0.16, 0.18, 0.62, "black", neck, 0.03, -0.03)

    outlined_polygon("helmet_gold_shell", [(-0.34, 0.18), (-0.16, 0.46), (0.2, 0.52), (0.48, 0.37), (0.54, 0.08), (0.38, -0.2), (0.04, -0.1), (-0.24, -0.02)], "gold", head, 0.08)
    polygon_mesh("helmet_crown_highlight", [(-0.13, 0.42), (0.18, 0.47), (0.39, 0.33), (0.18, 0.35)], "gold_light", head, 0.095)
    outlined_polygon("helmet_black_mask", [(-0.2, 0.18), (0.02, 0.29), (0.3, 0.13), (0.23, -0.09), (-0.03, -0.03)], "black", head, 0.105)
    outlined_polygon("helmet_beak_plate", [(0.23, 0.09), (0.56, -0.03), (0.37, -0.24), (0.08, -0.08)], "gold_light", head, 0.125)
    outlined_box("helmet_rear_peg", -0.22, 0.4, 0.28, 0.09, "gold_light", head, 0.11, -0.58)
    circle("eye_black_socket", 0.12, 0.19, 0.165, "joint_dark", head, 0.13, 28)
    circle("eye_gold_ring", 0.12, 0.19, 0.12, "gold_light", head, 0.135, 26)
    circle("eye_red_core", 0.12, 0.19, 0.065, "glow", head, 0.145, 18)
    add_ribbon_root(head)
    empty("ribbon_anchor", -0.24, 0.14, head, "SINGLE_ARROW", 0.07)

    outlined_polygon("left_shoulder_squared_pad", [(-0.12, 0.16), (0.17, 0.15), (0.3, -0.02), (0.11, -0.2), (-0.15, -0.1)], "gold", left_shoulder, 0.08)
    polygon_mesh("left_shoulder_lower_shadow", [(-0.1, -0.03), (0.13, -0.06), (0.07, -0.18), (-0.14, -0.1)], "gold_dark", left_shoulder, 0.095)
    ring("left_shoulder_socket", 0, 0, left_shoulder, 0.095, 0.12, 0.065)
    left_elbow = limb_segment("left_upper_arm", left_shoulder, "left_elbow_pivot", 0.5, 0.15, "gold", 0.065)
    box("left_bicep_red_stripe", 0.26, -0.005, 0.16, 0.035, "red", left_shoulder, 0.12, 0)
    left_wrist = limb_segment("left_lower_arm_grapple", left_elbow, "left_wrist_pivot", 0.52, 0.16, "gold_light", 0.075)
    box("left_grapple_attachment", 0.4, -0.08, 0.18, 0.12, "charcoal", left_elbow, 0.12, -0.02)
    outlined_box("left_hand_palm", 0.07, -0.02, 0.17, 0.12, "gold_light", left_wrist, 0.08, 0.05)
    add_fingers("left_hand", left_wrist, 0.1)
    box("left_forearm_red_detail_a", 0.24, 0.055, 0.12, 0.03, "red", left_elbow, 0.1)
    box("left_forearm_red_detail_b", 0.24, -0.055, 0.12, 0.03, "red", left_elbow, 0.1)
    left_wrist_anchor = empty("left_wrist_anchor", 0.23, 0, left_wrist, "SPHERE", 0.06)

    right_elbow = limb_segment("right_upper_arm_shadow", right_shoulder, "right_elbow_pivot", 0.42, 0.115, "gold_shadow", 0.0, shadow_key="deep_shadow")
    right_wrist = limb_segment("right_lower_arm_shadow", right_elbow, "right_wrist_pivot", 0.42, 0.105, "gold_shadow", 0.005, shadow_key="deep_shadow")
    outlined_box("right_hand_shadow", 0.08, -0.02, 0.18, 0.1, "gold_shadow", right_wrist, 0.01)

    left_knee = limb_segment("left_upper_leg", left_hip, "left_knee_pivot", 0.72, 0.19, "gold", 0.05)
    box("left_thigh_red_detail_top", 0.38, 0.055, 0.13, 0.04, "red", left_hip, 0.11)
    box("left_thigh_red_detail_low", 0.52, 0.055, 0.13, 0.04, "red", left_hip, 0.11)
    left_ankle = limb_segment("left_lower_leg", left_knee, "left_ankle_pivot", 0.76, 0.13, "gold_light", 0.06)
    outlined_polygon("left_foot", [(0.0, -0.07), (0.48, -0.07), (0.37, 0.09), (0.07, 0.09)], "gold_light", left_ankle, 0.08)
    polygon_mesh("left_heel_shadow", [(0.0, -0.07), (0.12, -0.07), (0.1, 0.08), (0.02, 0.08)], "deep_shadow", left_ankle, 0.11)

    right_knee = limb_segment("right_upper_leg_shadow", right_hip, "right_knee_pivot", 0.68, 0.15, "gold_shadow", 0.01, shadow_key="deep_shadow")
    right_ankle = limb_segment("right_lower_leg_shadow", right_knee, "right_ankle_pivot", 0.72, 0.11, "gold_shadow", 0.015, shadow_key="deep_shadow")
    outlined_polygon("right_foot_shadow", [(0.0, -0.05), (0.3, -0.05), (0.24, 0.065), (0.04, 0.065)], "gold_shadow", right_ankle, 0.02)

    for idx, (x, y) in enumerate([(0.27, -0.02), (0.27, -0.17)]):
        box(f"red_chest_detail_{idx + 1}", x, y, 0.035, 0.13, "red", chest, 0.14, 0.02)
    for idx, (x, y) in enumerate([(0.24, -0.22), (0.24, -0.36)]):
        box(f"red_waist_detail_{idx + 1}", x, y, 0.035, 0.13, "red", waist, 0.14, 0.02)

    pivots = {
        "root": root,
        "pelvis": pelvis,
        "waist": waist,
        "chest": chest,
        "neck": neck,
        "head": head,
        "left_shoulder": left_shoulder,
        "left_elbow": left_elbow,
        "right_shoulder": right_shoulder,
        "right_elbow": right_elbow,
        "left_hip": left_hip,
        "left_knee": left_knee,
        "right_hip": right_hip,
        "right_knee": right_knee,
        "left_wrist_anchor": left_wrist_anchor,
    }
    create_preview_animation(pivots)
    bpy.context.scene.frame_set(1)

    bpy.ops.object.light_add(type="AREA", location=(0, -3, 5))
    bpy.context.object.name = "M_preview_area_light"
    bpy.context.object.data.energy = 450
    bpy.context.object.data.size = 5

    bpy.ops.object.camera_add(location=(0.18, 0.18, 6), rotation=(0, 0, 0))
    bpy.context.scene.camera = bpy.context.object
    bpy.context.object.name = "M_preview_side_camera"
    bpy.context.object.data.type = "ORTHO"
    bpy.context.object.data.ortho_scale = 4.0

    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_DIR / "m_character.blend"))
    bpy.ops.export_scene.gltf(
        filepath=str(OUT_DIR / "m_character.glb"),
        export_format="GLB",
        export_apply=True,
        export_animations=True,
        export_yup=False,
    )


if __name__ == "__main__":
    build_character()
