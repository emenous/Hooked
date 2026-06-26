const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const blenderPath = "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe";
const sourceBlend = "assets/models/hyper3d-new/sling_hyper3d_new_game_ready.blend";
const outputGlb = "assets/models/m_character_skeletal.glb";
const backupDir = "assets/models/backups";

fs.mkdirSync(backupDir, { recursive: true });
if (fs.existsSync(outputGlb)) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(outputGlb, path.join(backupDir, `m_character_skeletal_before_saved_game_ready_export_${stamp}.glb`));
}

const code = String.raw`
import bpy
from math import radians
from mathutils import Matrix

EXPORT_COLLECTION = "GAME_READY_EXPORT"
OUT_GLB = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/m_character_skeletal.glb"

collection = bpy.data.collections.get(EXPORT_COLLECTION)
if collection is None:
    raise RuntimeError(f"Missing collection: {EXPORT_COLLECTION}")

export_objects = []
for obj in collection.all_objects:
    if obj.type in {"ARMATURE", "MESH"}:
        export_objects.append(obj)

if not export_objects:
    raise RuntimeError(f"No armature/mesh objects found in {EXPORT_COLLECTION}")

armatures = [obj for obj in export_objects if obj.type == "ARMATURE"]
if not armatures:
    raise RuntimeError(f"No armature found in {EXPORT_COLLECTION}")

# Export a neutral rig. Pose-mode tests should never leak into the runtime GLB.
for armature in armatures:
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="POSE")
    for pose_bone in armature.pose.bones:
        pose_bone.matrix_basis = Matrix.Identity(4)
    bpy.ops.object.mode_set(mode="OBJECT")

# Blender source is standard: Z-up, front-facing in Front Orthographic.
# Hooked is a 2.5D side-view game: exported runtime GLB should present the
# character side-on to the camera, with body left/right distributed on GLB Z.
for armature in armatures:
    armature.rotation_euler.rotate_axis("Z", radians(90))

bpy.ops.object.select_all(action="DESELECT")
for obj in export_objects:
    obj.hide_viewport = False
    obj.hide_render = False
    obj.select_set(True)

bpy.context.view_layer.objects.active = armatures[0]

bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    export_apply=False,
    export_animations=True,
    export_yup=True,
    use_selection=True,
)

print("Exported saved game-ready GLB:", OUT_GLB)
`;

const result = cp.spawnSync(
  blenderPath,
  ["-b", sourceBlend, "--python-expr", code],
  { cwd: process.cwd(), encoding: "utf8", timeout: 180000 },
);

process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.status ?? 1);
