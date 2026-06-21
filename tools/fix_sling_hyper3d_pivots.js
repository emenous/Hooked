const cp = require("child_process");

const code = String.raw`
import bpy
from mathutils import Vector, Matrix

BLEND_PATH = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/hyper3d-new/sling_hyper3d_new_rig_prep.blend"
OUT_PATH = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/hyper3d-new/sling_hyper3d_new_rig_prep_pivots_fixed.blend"

def obj(name):
    found = bpy.data.objects.get(name)
    if found:
        return found
    target = name.strip().lower()
    for candidate in bpy.data.objects:
        if candidate.name.strip().lower() == target:
            return candidate
    return None

def mesh(name):
    return bpy.data.objects.get(name)

def bbox(names):
    points = []
    for name in names:
        o = obj(name)
        if not o or o.type != "MESH":
            continue
        points.extend(o.matrix_world @ Vector(corner) for corner in o.bound_box)
    if not points:
        raise RuntimeError("Missing bbox objects: " + ", ".join(names))
    xs = [p.x for p in points]
    ys = [p.y for p in points]
    zs = [p.z for p in points]
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)

def center(names):
    mnx, mxx, mny, mxy, mnz, mxz = bbox(names)
    return Vector(((mnx + mxx) * 0.5, (mny + mxy) * 0.5, (mnz + mxz) * 0.5))

def top_center(names):
    mnx, mxx, mny, mxy, mnz, mxz = bbox(names)
    return Vector(((mnx + mxx) * 0.5, (mny + mxy) * 0.5, mxz))

def bottom_center(names):
    mnx, mxx, mny, mxy, mnz, mxz = bbox(names)
    return Vector(((mnx + mxx) * 0.5, (mny + mxy) * 0.5, mnz))

def side_joint(left_name, right_name=None, z_bias=0.5):
    mnx, mxx, mny, mxy, mnz, mxz = bbox([left_name])
    return Vector(((mnx + mxx) * 0.5, (mny + mxy) * 0.5, mnz + (mxz - mnz) * z_bias))

def set_world(o, loc):
    if not o:
        return
    o.matrix_world.translation = loc
    o.rotation_euler = (0, 0, 0)
    o.scale = (1, 1, 1)

def parent_keep_world(child, parent):
    if not child or not parent:
        return
    mw = child.matrix_world.copy()
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()
    child.matrix_world = mw

def ensure_empty(name):
    o = obj(name)
    if o:
        return o
    o = bpy.data.objects.new(name, None)
    o.empty_display_type = "SPHERE"
    o.empty_display_size = 0.055
    bpy.context.collection.objects.link(o)
    return o

final_meshes = [
    "head", "neck", "chest", "waist", "pelvis",
    "left_shoulder", "left_uppper_arm", "left_forearm", "left_hand",
    "right_shoulder", "right_upper_arm", "right_forearm", "right_hand",
    "left_thigh", "left_shin", "left_foot",
    "right_thigh", "right_shin", "right_foot",
]

missing = [name for name in final_meshes if not obj(name)]
if missing:
    print("WARNING missing final meshes:", ", ".join(missing))

all_bbox = bbox([name for name in final_meshes if obj(name)])
mnx, mxx, mny, mxy, mnz, mxz = all_bbox
mid_y = (mny + mxy) * 0.5

positions = {
    "M_root": center(["pelvis"]),
    "pelvis_pivot": center(["pelvis"]),
    "waist_pivot": center(["waist"]),
    "chest_pivot": center(["chest"]),
    "neck_pivot": center(["neck"]),
    "head_pivot": center(["head"]),
    "left_shoulder_pivot": center(["left_shoulder"]),
    "right_shoulder_pivot": center(["right_shoulder"]),
    "left_elbow_pivot": bottom_center(["left_uppper_arm"]),
    "right_elbow_pivot": bottom_center(["right_upper_arm"]),
    "left_wrist_pivot": bottom_center(["left_forearm"]),
    "right_wrist_pivot": bottom_center(["right_forearm"]),
    "left_hip_pivot": top_center(["left_thigh"]),
    "right_hip_pivot": top_center(["right_thigh"]),
    "left_knee_pivot": bottom_center(["left_thigh"]),
    "right_knee_pivot": bottom_center(["right_thigh"]),
    "left_ankle_pivot": bottom_center(["left_shin"]),
    "right_ankle_pivot": bottom_center(["right_shin"]),
}

# Wrist/ankle/hip estimates are nudged toward the visible circular joints when possible.
for key, name in [
    ("left_elbow_pivot", "left_forearm"),
    ("right_elbow_pivot", "right_forearm"),
    ("left_wrist_pivot", "left_hand"),
    ("right_wrist_pivot", "right_hand"),
    ("left_ankle_pivot", "left_foot"),
    ("right_ankle_pivot", "right_foot"),
]:
    if obj(name):
        positions[key] = top_center([name])

for name, loc in positions.items():
    set_world(ensure_empty(name), loc)

hierarchy = {
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
}

for child, parent in hierarchy.items():
    parent_keep_world(obj(child), obj(parent))

mesh_parent = {
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

for mesh_name, pivot_name in mesh_parent.items():
    parent_keep_world(obj(mesh_name), obj(pivot_name))

if obj("left_wrist_anchor"):
    set_world(obj("left_wrist_anchor"), center(["left_hand"]))
    parent_keep_world(obj("left_wrist_anchor"), obj("left_wrist_pivot"))
if obj("ribbon_anchor"):
    head_box = bbox(["head"])
    loc = Vector(((head_box[0] + head_box[1]) * 0.5, head_box[2] - 0.03, head_box[5] - (head_box[5] - head_box[4]) * 0.22))
    set_world(obj("ribbon_anchor"), loc)
    parent_keep_world(obj("ribbon_anchor"), obj("head_pivot"))

# Hide guide marker spheres so the fixed rig is easier to inspect.
for o in bpy.data.objects:
    if o.name.startswith("target_"):
        o.hide_viewport = True
        o.hide_render = True

bpy.ops.wm.save_as_mainfile(filepath=OUT_PATH)
print("Saved fixed pivot file:", OUT_PATH)
for name in positions:
    o = obj(name)
    print(name, tuple(round(v, 4) for v in o.matrix_world.translation))
`;

const result = cp.spawnSync(
  "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe",
  ["-b", "assets/models/hyper3d-new/sling_hyper3d_new_rig_prep.blend", "--python-expr", code],
  { cwd: process.cwd(), encoding: "utf8", timeout: 120000 },
);

process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.status ?? 1);
