const cp = require("child_process");

const code = String.raw`
import bpy

SOURCE_BLEND = r"C:/Users/emeno/OneDrive/Documents/Hooked/assets/models/hyper3d-new/sling_hyper3d_new_skeletal.blend"
OUT_FBX = r"C:/Users/emeno/OneDrive/Documents/Hooked/unity-transfer/HookedUnityPackage/Assets/Hooked/Models/Characters/Sling/sling_character_skeletal.fbx"

bpy.ops.object.select_all(action="DESELECT")
for obj in bpy.context.scene.objects:
    if obj.type in {"ARMATURE", "MESH"} and not obj.name.endswith("_SOURCE"):
        obj.hide_viewport = False
        obj.hide_render = False
        obj.select_set(True)

armature = bpy.data.objects.get("Sling_Armature")
if armature:
    bpy.context.view_layer.objects.active = armature

bpy.ops.export_scene.fbx(
    filepath=OUT_FBX,
    use_selection=True,
    apply_unit_scale=True,
    apply_scale_options="FBX_SCALE_NONE",
    bake_space_transform=False,
    object_types={"ARMATURE", "MESH"},
    use_mesh_modifiers=True,
    add_leaf_bones=False,
    primary_bone_axis="Y",
    secondary_bone_axis="X",
    bake_anim=False,
)

print("Exported Unity FBX:", OUT_FBX)
`;

const result = cp.spawnSync(
  "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe",
  ["-b", "assets/models/hyper3d-new/sling_hyper3d_new_skeletal.blend", "--python-expr", code],
  { cwd: process.cwd(), encoding: "utf8", timeout: 120000 },
);

process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.status ?? 1);
