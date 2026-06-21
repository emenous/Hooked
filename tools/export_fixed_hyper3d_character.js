const cp = require("child_process");

const code = String.raw`
import bpy

blend_path = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/hyper3d-new/sling_hyper3d_new_rig_prep_pivots_fixed.blend"
out_path = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/m_character.glb"

final_mesh_names = {
    "head", "neck", "chest", "waist", "pelvis",
    "left_shoulder", "left_uppper_arm", "left_forearm", "left_hand",
    "right_shoulder", "right_upper_arm", "right_forearm", "right_hand",
    "left_thigh", "left_shin", "left_foot",
    "right_thigh", "right_shin", "right_foot",
}

empty_names = {
    "M_root",
    "pelvis_pivot", "waist_pivot", "chest_pivot", "neck_pivot", "head_pivot",
    "left_shoulder_pivot", "left_elbow_pivot", "left_wrist_pivot",
    "right_shoulder_pivot", "right_elbow_pivot", "right_wrist_pivot",
    "left_hip_pivot", "left_knee_pivot", "left_ankle_pivot",
    "right_hip_pivot", "right_knee_pivot", "right_ankle_pivot",
    "left_wrist_anchor", "ribbon_anchor",
}

def clean_name(name):
    return name.strip()

for obj in bpy.data.objects:
    normalized = clean_name(obj.name)
    keep = normalized in final_mesh_names or normalized in empty_names
    obj.hide_viewport = not keep
    obj.hide_render = not keep
    obj.select_set(keep)

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format="GLB",
    export_apply=True,
    export_animations=False,
    export_yup=False,
    use_selection=True,
)
print("Exported", out_path)
`;

const result = cp.spawnSync(
  "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe",
  ["-b", "assets/models/hyper3d-new/sling_hyper3d_new_rig_prep_pivots_fixed.blend", "--python-expr", code],
  { cwd: process.cwd(), encoding: "utf8", timeout: 120000 },
);

process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.status ?? 1);
