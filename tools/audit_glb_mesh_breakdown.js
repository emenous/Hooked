const fs = require("fs");
const path = require("path");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node tools/audit_glb_mesh_breakdown.js <file.glb>");
  process.exit(1);
}

const data = fs.readFileSync(file);
if (data.toString("utf8", 0, 4) !== "glTF") {
  throw new Error(`${file} is not a binary glTF/GLB file`);
}

let offset = 12;
let json = null;
while (offset + 8 <= data.length) {
  const chunkLength = data.readUInt32LE(offset);
  const chunkType = data.toString("utf8", offset + 4, offset + 8);
  if (chunkType === "JSON") {
    json = JSON.parse(data.toString("utf8", offset + 8, offset + 8 + chunkLength));
  }
  offset += 8 + chunkLength;
}

if (!json) throw new Error("No JSON chunk found");

const accessors = json.accessors ?? [];
const meshes = json.meshes ?? [];
const rows = meshes.map((mesh, index) => {
  let primitives = 0;
  let vertices = 0;
  let triangles = 0;

  for (const primitive of mesh.primitives ?? []) {
    primitives += 1;
    const position = accessors[primitive.attributes?.POSITION];
    if (position) vertices += position.count ?? 0;
    const indices = accessors[primitive.indices];
    if (indices) triangles += Math.floor((indices.count ?? 0) / 3);
  }

  return {
    mesh: index,
    name: mesh.name ?? "",
    primitives,
    vertices,
    triangles,
  };
});

rows.sort((left, right) => right.vertices - left.vertices);

console.log(JSON.stringify({
  file: path.normalize(file),
  totalMeshes: rows.length,
  totalVertices: rows.reduce((total, row) => total + row.vertices, 0),
  totalTriangles: rows.reduce((total, row) => total + row.triangles, 0),
  meshes: rows,
}, null, 2));
