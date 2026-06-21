const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const blenderPath = "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe";
const slingBlend = "assets/models/hyper3d-new/sling_hyper3d_new_game_ready.blend";
const outputDir = "assets/animations/retargeted";

const sourcePath = process.argv[2];
const requestedOutput = process.argv[3];

if (!sourcePath) {
  console.error("Usage: node tools/retarget_animation_to_sling.js <source.fbx|glb|gltf|dae> [output.glb]");
  process.exit(1);
}

if (!fs.existsSync(sourcePath)) {
  console.error(`Source animation not found: ${sourcePath}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

const baseName = path.basename(sourcePath, path.extname(sourcePath)).replace(/[^a-z0-9_-]+/gi, "_");
const outputPath = requestedOutput || path.join(outputDir, `${baseName}_sling.glb`);
const reportPath = outputPath.replace(/\.glb$/i, ".report.json");

const python = String.raw`
import bpy
import json
import os
import sys

SOURCE_PATH = ${JSON.stringify(path.resolve(sourcePath))}
OUTPUT_PATH = ${JSON.stringify(path.resolve(outputPath))}
REPORT_PATH = ${JSON.stringify(path.resolve(reportPath))}

TARGET_ARMATURE = "Sling_Armature"
EXPORT_COLLECTION = "GAME_READY_EXPORT"

TARGET_TO_SOURCE = {
    "M_root": ["Hips", "Root", "Armature", "mixamorig:Hips"],
    "pelvis_pivot": ["Hips", "Pelvis", "mixamorig:Hips"],
    "waist_pivot": ["Spine", "mixamorig:Spine"],
    "chest_pivot": ["Spine2", "Spine1", "Chest", "UpperChest", "mixamorig:Spine2", "mixamorig:Spine1"],
    "neck_pivot": ["Neck", "mixamorig:Neck"],
    "head_pivot": ["Head", "mixamorig:Head"],
    "left_shoulder_pivot": ["LeftArm", "LeftUpperArm", "LeftShoulder", "mixamorig:LeftArm"],
    "left_elbow_pivot": ["LeftForeArm", "LeftLowerArm", "mixamorig:LeftForeArm"],
    "left_wrist_pivot": ["LeftHand", "mixamorig:LeftHand"],
    "right_shoulder_pivot": ["RightArm", "RightUpperArm", "RightShoulder", "mixamorig:RightArm"],
    "right_elbow_pivot": ["RightForeArm", "RightLowerArm", "mixamorig:RightForeArm"],
    "right_wrist_pivot": ["RightHand", "mixamorig:RightHand"],
    "left_hip_pivot": ["LeftUpLeg", "LeftUpperLeg", "LeftThigh", "mixamorig:LeftUpLeg"],
    "left_knee_pivot": ["LeftLeg", "LeftLowerLeg", "LeftShin", "mixamorig:LeftLeg"],
    "left_ankle_pivot": ["LeftFoot", "mixamorig:LeftFoot"],
    "right_hip_pivot": ["RightUpLeg", "RightUpperLeg", "RightThigh", "mixamorig:RightUpLeg"],
    "right_knee_pivot": ["RightLeg", "RightLowerLeg", "RightShin", "mixamorig:RightLeg"],
    "right_ankle_pivot": ["RightFoot", "mixamorig:RightFoot"],
}

def normalize_name(name):
    return "".join(ch for ch in name.lower().replace("mixamorig:", "") if ch.isalnum())

def import_source_animation(filepath):
    before = set(bpy.data.objects)
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=filepath)
    elif ext in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=filepath)
    elif ext == ".dae":
        bpy.ops.wm.collada_import(filepath=filepath)
    else:
        raise RuntimeError(f"Unsupported animation format: {ext}")
    return [obj for obj in bpy.data.objects if obj not in before]

def find_source_armature(imported_objects):
    candidates = [obj for obj in imported_objects if obj.type == "ARMATURE"]
    candidates += [
        obj for obj in bpy.data.objects
        if obj.type == "ARMATURE" and obj.name != TARGET_ARMATURE and obj not in candidates
    ]
    animated = [
        obj for obj in candidates
        if obj.animation_data and (obj.animation_data.action or obj.animation_data.nla_tracks)
    ]
    return (animated or candidates or [None])[0]

def find_source_action(source_armature):
    if source_armature.animation_data and source_armature.animation_data.action:
        return source_armature.animation_data.action
    for action in bpy.data.actions:
        if action.users:
            return action
    return None

def find_source_bone(source_armature, aliases):
    bones = source_armature.pose.bones
    by_exact = {bone.name: bone.name for bone in bones}
    by_normal = {normalize_name(bone.name): bone.name for bone in bones}
    for alias in aliases:
        if alias in by_exact:
            return by_exact[alias]
    for alias in aliases:
        normalized = normalize_name(alias)
        if normalized in by_normal:
            return by_normal[normalized]
    for alias in aliases:
        normalized = normalize_name(alias)
        for source_normal, source_name in by_normal.items():
            if source_normal.endswith(normalized) or normalized.endswith(source_normal):
                return source_name
    return None

def clear_target_animation(target_armature):
    target_armature.animation_data_create()
    target_armature.animation_data.action = None
    for pose_bone in target_armature.pose.bones:
        pose_bone.rotation_mode = "QUATERNION"
        pose_bone.rotation_quaternion = (1, 0, 0, 0)
        pose_bone.location = (0, 0, 0)
        pose_bone.scale = (1, 1, 1)

def key_target_rest(target_armature, frame):
    bpy.context.scene.frame_set(frame)
    for pose_bone in target_armature.pose.bones:
        pose_bone.rotation_quaternion = (1, 0, 0, 0)
        pose_bone.keyframe_insert(data_path="rotation_quaternion", frame=frame)

target_armature = bpy.data.objects.get(TARGET_ARMATURE)
if target_armature is None:
    raise RuntimeError(f"Missing target armature: {TARGET_ARMATURE}")

imported = import_source_animation(SOURCE_PATH)
source_armature = find_source_armature(imported)
if source_armature is None:
    raise RuntimeError("No source armature found in animation file")

source_action = find_source_action(source_armature)
if source_action is None:
    raise RuntimeError("No source animation action found")

source_armature.animation_data_create()
source_armature.animation_data.action = source_action

frame_start = int(source_action.frame_range[0])
frame_end = int(source_action.frame_range[1])
if frame_end <= frame_start:
    frame_end = frame_start + 1

bpy.context.scene.frame_start = frame_start
bpy.context.scene.frame_end = frame_end
bpy.context.scene.render.fps = 30

mapping = {}
missing = {}
for target_name, aliases in TARGET_TO_SOURCE.items():
    if target_name not in target_armature.pose.bones:
        missing[target_name] = "missing target bone"
        continue
    source_bone_name = find_source_bone(source_armature, [target_name] + aliases)
    if source_bone_name:
        mapping[target_name] = source_bone_name
    else:
        missing[target_name] = "missing source bone"

if len(mapping) < 10:
    raise RuntimeError(f"Only mapped {len(mapping)} bones; source rig does not look humanoid enough")

clear_target_animation(target_armature)
action_name = "Sling_" + os.path.splitext(os.path.basename(SOURCE_PATH))[0].replace(" ", "_")
target_action = bpy.data.actions.new(action_name)
target_armature.animation_data.action = target_action

for frame in range(frame_start, frame_end + 1):
    bpy.context.scene.frame_set(frame)
    key_target_rest(target_armature, frame)
    for target_name, source_name in mapping.items():
        target_bone = target_armature.pose.bones[target_name]
        source_bone = source_armature.pose.bones[source_name]
        target_bone.rotation_mode = "QUATERNION"
        # First-pass retarget: copy local rotation animation onto the mapped Sling bone.
        # If a clip bends backward, the source/target rest axes need a per-bone correction map.
        source_bone.rotation_mode = "QUATERNION"
        target_bone.rotation_quaternion = source_bone.rotation_quaternion
        target_bone.keyframe_insert(data_path="rotation_quaternion", frame=frame)

bpy.context.scene.frame_set(frame_start)

bpy.ops.object.mode_set(mode="OBJECT")
bpy.ops.object.select_all(action="DESELECT")
collection = bpy.data.collections.get(EXPORT_COLLECTION)
if collection is None:
    raise RuntimeError(f"Missing export collection: {EXPORT_COLLECTION}")

selected = []
for obj in collection.objects:
    obj.hide_viewport = False
    obj.hide_render = False
    if obj.type in {"ARMATURE", "MESH"}:
        obj.select_set(True)
        selected.append(obj.name)

target_armature.select_set(True)
bpy.context.view_layer.objects.active = target_armature

bpy.ops.export_scene.gltf(
    filepath=OUTPUT_PATH,
    export_format="GLB",
    export_apply=False,
    export_animations=True,
    export_yup=False,
    use_selection=True,
)

report = {
    "source": SOURCE_PATH,
    "output": OUTPUT_PATH,
    "sourceArmature": source_armature.name,
    "sourceAction": source_action.name,
    "targetAction": target_action.name,
    "frameStart": frame_start,
    "frameEnd": frame_end,
    "mappedBones": mapping,
    "missingBones": missing,
    "selectedForExport": selected,
    "note": "This is a first-pass local-rotation retarget. Clips with wrong bend directions need a per-bone axis correction map or manual cleanup in Blender.",
}
with open(REPORT_PATH, "w", encoding="utf8") as handle:
    json.dump(report, handle, indent=2)

print("Retargeted animation:", OUTPUT_PATH)
print("Report:", REPORT_PATH)
print("Mapped bones:", len(mapping))
if missing:
    print("Missing:", ", ".join(f"{target}={reason}" for target, reason in missing.items()))
`;

const result = cp.spawnSync(
  blenderPath,
  ["-b", slingBlend, "--python-expr", python],
  { cwd: process.cwd(), encoding: "utf8", timeout: 180000 },
);

process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.status ?? 1);
