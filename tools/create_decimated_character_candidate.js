const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const blenderPath = "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe";
const repoRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const options = {
    input: "assets/models/m_character_skeletal_textures_1k.glb",
    output: "assets/models/candidates/m_character_skeletal_textures_1k_decimated.glb",
    ratio: 0.55,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") {
      options.input = argv[index + 1] ?? options.input;
      index += 1;
    } else if (arg === "--output") {
      options.output = argv[index + 1] ?? options.output;
      index += 1;
    } else if (arg === "--ratio") {
      options.ratio = Number(argv[index + 1] ?? options.ratio);
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.ratio) || options.ratio <= 0 || options.ratio > 1) {
    throw new Error("--ratio must be a number > 0 and <= 1");
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node tools/create_decimated_character_candidate.js [--input file.glb] [--output file.glb] [--ratio 0.55]

Creates a non-destructive decimated GLB candidate through Blender.
The live character file is not changed unless you pass it as --output intentionally.`);
}

function main() {
  const options = parseArgs(process.argv);
  if (options.help) {
    printHelp();
    return;
  }
  if (!fs.existsSync(blenderPath)) {
    throw new Error(`Blender not found at ${blenderPath}`);
  }

  const inputPath = path.resolve(repoRoot, options.input);
  const outputPath = path.resolve(repoRoot, options.output);
  if (!fs.existsSync(inputPath)) throw new Error(`Input GLB not found: ${inputPath}`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const code = String.raw`
import bpy
import json
from pathlib import Path

INPUT = Path(r"${inputPath.replace(/\\/g, "\\\\")}")
OUTPUT = Path(r"${outputPath.replace(/\\/g, "\\\\")}")
RATIO = ${options.ratio}

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

bpy.ops.import_scene.gltf(filepath=str(INPUT))
bpy.context.scene.frame_set(1)

report = []
mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
for obj in mesh_objects:
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    before_vertices = len(obj.data.vertices)
    before_faces = len(obj.data.polygons)
    decimate = obj.modifiers.new("Hooked candidate decimate", "DECIMATE")
    decimate.ratio = RATIO
    decimate.use_collapse_triangulate = True

    armature_modifier = next((mod for mod in obj.modifiers if mod.type == "ARMATURE"), None)
    if armature_modifier:
        try:
            while obj.modifiers.find(decimate.name) > obj.modifiers.find(armature_modifier.name):
                bpy.ops.object.modifier_move_up(modifier=decimate.name)
        except Exception:
            pass

    bpy.ops.object.modifier_apply(modifier=decimate.name)
    obj.data.update()
    report.append({
        "name": obj.name,
        "beforeVertices": before_vertices,
        "beforeFaces": before_faces,
        "afterVertices": len(obj.data.vertices),
        "afterFaces": len(obj.data.polygons),
    })

bpy.ops.object.select_all(action="DESELECT")
for obj in bpy.context.scene.objects:
    if obj.type in {"ARMATURE", "MESH"}:
        obj.select_set(True)
        if obj.type == "ARMATURE":
            bpy.context.view_layer.objects.active = obj

bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT),
    export_format="GLB",
    export_apply=False,
    export_animations=True,
    export_yup=True,
    use_selection=True,
)

print(json.dumps({
    "input": str(INPUT),
    "output": str(OUTPUT),
    "ratio": RATIO,
    "meshes": report,
}, indent=2))
`;

  const result = cp.spawnSync(
    blenderPath,
    ["-b", "--python-expr", code],
    {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 240000,
      maxBuffer: 30 * 1024 * 1024,
    },
  );

  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  process.exit(result.status ?? 1);
}

main();
