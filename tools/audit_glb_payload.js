const fs = require("fs");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node tools/audit_glb_payload.js <file.glb>");
  process.exit(1);
}

const data = fs.readFileSync(file);
if (data.toString("utf8", 0, 4) !== "glTF") {
  throw new Error(`${file} is not a binary glTF/GLB file`);
}

let offset = 12;
let json = null;
const chunks = [];
while (offset + 8 <= data.length) {
  const chunkLength = data.readUInt32LE(offset);
  const chunkType = data.toString("utf8", offset + 4, offset + 8);
  const chunkStart = offset + 8;
  const chunkEnd = chunkStart + chunkLength;
  chunks.push({ type: chunkType, length: chunkLength });
  if (chunkType === "JSON") {
    json = JSON.parse(data.toString("utf8", chunkStart, chunkEnd));
  }
  offset = chunkEnd;
}

if (!json) throw new Error("No JSON chunk found");

const accessors = json.accessors ?? [];
const meshes = json.meshes ?? [];
let primitiveCount = 0;
let vertexCount = 0;
let triangleCount = 0;
let skinnedPrimitiveCount = 0;

for (const mesh of meshes) {
  for (const primitive of mesh.primitives ?? []) {
    primitiveCount += 1;
    if (primitive.attributes?.JOINTS_0 !== undefined && primitive.attributes?.WEIGHTS_0 !== undefined) {
      skinnedPrimitiveCount += 1;
    }
    const position = accessors[primitive.attributes?.POSITION];
    if (position) vertexCount += position.count ?? 0;
    const indices = accessors[primitive.indices];
    if (indices) triangleCount += Math.floor((indices.count ?? 0) / 3);
  }
}

const images = json.images ?? [];
const bufferViews = json.bufferViews ?? [];
const imagePayloads = images.map((image, index) => {
  const view = bufferViews[image.bufferView];
  return {
    index,
    mimeType: image.mimeType ?? "external",
    bytes: view?.byteLength ?? 0,
  };
});

const imageBytes = imagePayloads.reduce((total, image) => total + image.bytes, 0);

console.log(JSON.stringify({
  file,
  totalBytes: data.length,
  chunks,
  nodes: json.nodes?.length ?? 0,
  meshes: meshes.length,
  primitives: primitiveCount,
  skinnedPrimitives: `${skinnedPrimitiveCount}/${primitiveCount}`,
  skins: json.skins?.length ?? 0,
  joints: json.skins?.reduce((total, skin) => total + (skin.joints?.length ?? 0), 0) ?? 0,
  animations: (json.animations ?? []).map((animation) => ({
    name: animation.name ?? "",
    channels: animation.channels?.length ?? 0,
    samplers: animation.samplers?.length ?? 0,
  })),
  materials: json.materials?.length ?? 0,
  textures: json.textures?.length ?? 0,
  images: images.length,
  imageBytes,
  geometryBytesApprox: data.length - imageBytes,
  vertices: vertexCount,
  triangles: triangleCount,
  imagePayloads,
}, null, 2));
