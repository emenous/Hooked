const fs = require("fs");

const target = process.argv[2] ?? "assets/models/m_character_skeletal.glb";

function readGlb(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString("utf8", 0, 4) !== "glTF") {
    throw new Error(`${filePath} is not a binary glTF file`);
  }

  let offset = 12;
  let json = null;
  let bin = null;
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.toString("utf8", offset + 4, offset + 8);
    const chunk = buffer.slice(offset + 8, offset + 8 + length);
    if (type === "JSON") json = JSON.parse(chunk.toString("utf8"));
    if (type === "BIN\0") bin = chunk;
    offset += 8 + length;
  }
  if (!json || !bin) throw new Error(`${filePath} is missing JSON or BIN data`);
  return { json, bin };
}

function getAccessor(json, bin, index) {
  const accessor = json.accessors[index];
  const view = json.bufferViews[accessor.bufferView];
  const componentSize = accessor.componentType === 5126 ? 4 : 2;
  const componentCount = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT4: 16,
  }[accessor.type];
  const stride = view.byteStride ?? componentSize * componentCount;
  const byteOffset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const rows = [];
  for (let i = 0; i < accessor.count; i += 1) {
    const row = [];
    for (let c = 0; c < componentCount; c += 1) {
      const offset = byteOffset + i * stride + c * componentSize;
      row.push(componentSize === 4 ? bin.readFloatLE(offset) : bin.readUInt16LE(offset));
    }
    rows.push(row);
  }
  return rows;
}

function quatToMat4(q) {
  const [x, y, z, w] = q ?? [0, 0, 0, 1];
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;
  return [
    1 - (yy + zz), xy + wz, xz - wy, 0,
    xy - wz, 1 - (xx + zz), yz + wx, 0,
    xz + wy, yz - wx, 1 - (xx + yy), 0,
    0, 0, 0, 1,
  ];
}

function multiply(a, b) {
  const out = Array(16).fill(0);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      for (let k = 0; k < 4; k += 1) {
        out[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
      }
    }
  }
  return out;
}

function compose(node) {
  if (node.matrix) return node.matrix;
  const t = node.translation ?? [0, 0, 0];
  const s = node.scale ?? [1, 1, 1];
  const m = quatToMat4(node.rotation);
  m[0] *= s[0];
  m[1] *= s[0];
  m[2] *= s[0];
  m[4] *= s[1];
  m[5] *= s[1];
  m[6] *= s[1];
  m[8] *= s[2];
  m[9] *= s[2];
  m[10] *= s[2];
  m[12] = t[0];
  m[13] = t[1];
  m[14] = t[2];
  return m;
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

const { json, bin } = readGlb(target);
const nodes = json.nodes ?? [];
const parents = new Map();
nodes.forEach((node, parent) => {
  for (const child of node.children ?? []) parents.set(child, parent);
});
const worldCache = new Map();
function worldMatrix(index) {
  if (worldCache.has(index)) return worldCache.get(index);
  const local = compose(nodes[index]);
  const parent = parents.get(index);
  const world = parent === undefined ? local : multiply(worldMatrix(parent), local);
  worldCache.set(index, world);
  return world;
}

const names = new Map(nodes.map((node, index) => [node.name, index]));
const interesting = [
  "M_root",
  "pelvis_pivot",
  "chest_pivot",
  "left_shoulder_pivot",
  "left_elbow_pivot",
  "left_wrist_pivot",
  "left_wrist_anchor",
  "right_shoulder_pivot",
  "right_elbow_pivot",
  "right_wrist_pivot",
  "left_hip_pivot",
  "left_knee_pivot",
  "left_ankle_pivot",
  "right_hip_pivot",
  "right_knee_pivot",
  "right_ankle_pivot",
  "ribbon_anchor",
];

const joints = interesting.map((name) => {
  const index = names.get(name);
  if (index === undefined) return { name, missing: true };
  const node = nodes[index];
  const matrix = worldMatrix(index);
  return {
    name,
    parent: nodes[parents.get(index)]?.name ?? null,
    localTranslation: (node.translation ?? [0, 0, 0]).map(round),
    localRotation: (node.rotation ?? [0, 0, 0, 1]).map(round),
    worldPosition: [round(matrix[12]), round(matrix[13]), round(matrix[14])],
  };
});

const animationRanges = (json.animations ?? []).map((animation) => ({
  name: animation.name,
  channels: animation.channels?.map((channel) => {
    const sampler = animation.samplers[channel.sampler];
    const input = getAccessor(json, bin, sampler.input).flat();
    const output = getAccessor(json, bin, sampler.output);
    const targetNode = nodes[channel.target.node]?.name;
    return {
      target: targetNode,
      path: channel.target.path,
      start: input[0],
      end: input[input.length - 1],
      first: output[0]?.map(round),
      second: output[1]?.map(round),
    };
  }).filter((channel) => channel.path === "rotation").slice(0, 12),
}));

console.log(JSON.stringify({ target, joints, animationRanges }, null, 2));
