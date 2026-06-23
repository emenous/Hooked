const fs = require("fs");
const path = require("path");

function align4(buffer, pad = 0) {
  while (buffer.length % 4) buffer.push(pad);
}

function readGlb(filePath) {
  const data = fs.readFileSync(filePath);
  if (data.toString("utf8", 0, 4) !== "glTF") {
    throw new Error(`${filePath} is not a binary glTF/GLB file`);
  }

  const version = data.readUInt32LE(4);
  const length = data.readUInt32LE(8);
  if (version !== 2 || length !== data.length) {
    throw new Error(`${filePath} is not a valid GLB v2 file`);
  }

  let offset = 12;
  let json = null;
  let bin = null;
  while (offset + 8 <= data.length) {
    const chunkLength = data.readUInt32LE(offset);
    const chunkType = data.toString("utf8", offset + 4, offset + 8);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    const chunk = data.subarray(chunkStart, chunkEnd);
    if (chunkType === "JSON") {
      json = JSON.parse(chunk.toString("utf8").trim());
    } else if (chunkType === "BIN\u0000") {
      bin = Buffer.from(chunk);
    }
    offset = chunkEnd;
  }

  if (!json || !bin) throw new Error("Expected JSON and BIN chunks");
  return { json, bin, inputBytes: data.length };
}

function writeGlb(filePath, json, bin) {
  const jsonChunk = Array.from(Buffer.from(JSON.stringify(json), "utf8"));
  align4(jsonChunk, 0x20);
  const binChunk = Array.from(bin);
  align4(binChunk, 0x00);

  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const output = Buffer.alloc(totalLength);
  let offset = 0;
  output.write("glTF", offset, 4, "utf8");
  offset += 4;
  output.writeUInt32LE(2, offset);
  offset += 4;
  output.writeUInt32LE(totalLength, offset);
  offset += 4;
  output.writeUInt32LE(jsonChunk.length, offset);
  offset += 4;
  output.write("JSON", offset, 4, "utf8");
  offset += 4;
  Buffer.from(jsonChunk).copy(output, offset);
  offset += jsonChunk.length;
  output.writeUInt32LE(binChunk.length, offset);
  offset += 4;
  output.write("BIN\u0000", offset, 4, "utf8");
  offset += 4;
  Buffer.from(binChunk).copy(output, offset);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, output);
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (!value || typeof value !== "object") return JSON.stringify(value);
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function dedupeArray(items, keyForItem) {
  const keys = new Map();
  const output = [];
  const indexMap = [];
  for (const [index, item] of items.entries()) {
    const key = keyForItem(item);
    if (!keys.has(key)) {
      keys.set(key, output.length);
      output.push(item);
    }
    indexMap[index] = keys.get(key);
  }
  return { output, indexMap };
}

function remapMaterialTextureIndices(value, textureIndexMap) {
  if (!value || typeof value !== "object") return;
  if (
    Object.prototype.hasOwnProperty.call(value, "index") &&
    Number.isInteger(value.index) &&
    textureIndexMap[value.index] !== undefined
  ) {
    value.index = textureIndexMap[value.index];
  }
  for (const child of Object.values(value)) {
    remapMaterialTextureIndices(child, textureIndexMap);
  }
}

function materialKey(material) {
  const clone = JSON.parse(JSON.stringify(material));
  delete clone.name;
  return stableStringify(clone);
}

function main() {
  const input = process.argv[2];
  const output = process.argv[3];
  if (!input || !output || process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: node tools/dedupe_glb_materials.js <input.glb> <output.glb>");
    console.log("Deduplicates repeated texture objects, remaps materials, then deduplicates equivalent materials.");
    process.exit(input && output ? 0 : 1);
  }

  const { json, bin, inputBytes } = readGlb(input);
  const original = {
    materials: json.materials?.length ?? 0,
    textures: json.textures?.length ?? 0,
  };

  const textureDedupe = dedupeArray(json.textures ?? [], stableStringify);
  json.textures = textureDedupe.output;

  for (const material of json.materials ?? []) {
    remapMaterialTextureIndices(material, textureDedupe.indexMap);
  }

  const materialDedupe = dedupeArray(json.materials ?? [], materialKey);
  json.materials = materialDedupe.output;
  for (const mesh of json.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      if (Number.isInteger(primitive.material) && materialDedupe.indexMap[primitive.material] !== undefined) {
        primitive.material = materialDedupe.indexMap[primitive.material];
      }
    }
  }

  writeGlb(output, json, bin);
  const outputBytes = fs.statSync(output).size;
  console.log(JSON.stringify({
    input,
    output,
    inputBytes,
    outputBytes,
    bytesSaved: inputBytes - outputBytes,
    original,
    optimized: {
      materials: json.materials?.length ?? 0,
      textures: json.textures?.length ?? 0,
    },
    textureIndexMap: textureDedupe.indexMap,
    materialIndexMap: materialDedupe.indexMap,
  }, null, 2));
}

main();
