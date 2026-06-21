const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const blenderPath = "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe";
const sourceBlend = "assets/models/hyper3d-new/sling_hyper3d_new_skeletal.blend";
const outputGlb = "assets/models/m_character_skeletal.glb";
const backupDir = "C:/tmp/hooked-character-backups";

fs.mkdirSync(backupDir, { recursive: true });
if (fs.existsSync(outputGlb)) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(outputGlb, path.join(backupDir, `m_character_skeletal_before_manual_export_${stamp}.glb`));
}

const code = String.raw`
import bpy

OUT_GLB = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/m_character_skeletal.glb"
EXPORT_COLLECTION = "SKELETAL_EXPORT"
ARMATURE_NAME = "Sling_Armature"

collection = bpy.data.collections.get(EXPORT_COLLECTION)
if collection is None:
    raise RuntimeError(f"Missing collection: {EXPORT_COLLECTION}")

armature = bpy.data.objects.get(ARMATURE_NAME)
if armature is None:
    raise RuntimeError(f"Missing armature: {ARMATURE_NAME}")

bpy.ops.object.mode_set(mode="OBJECT")
bpy.ops.object.select_all(action="DESELECT")

selected = []
for obj in collection.objects:
    obj.hide_viewport = False
    obj.hide_render = False
    if obj.type in {"ARMATURE", "MESH"}:
        obj.select_set(True)
        selected.append(obj.name)

armature.select_set(True)
bpy.context.view_layer.objects.active = armature

bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    export_apply=False,
    export_animations=True,
    export_yup=False,
    use_selection=True,
)

print("Exported current skeletal blend to:", OUT_GLB)
print("Selected objects:", ", ".join(selected))
`;

const result = cp.spawnSync(
  blenderPath,
  ["-b", sourceBlend, "--python-expr", code],
  { cwd: process.cwd(), encoding: "utf8", timeout: 120000 },
);

process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.status ?? 1);
