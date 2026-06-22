const fs = require("fs");

const target = process.argv[2] ?? "assets/models/m_character_skeletal.glb";

function readGlb(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString("utf8", 0, 4) !== "glTF") {
    throw new Error(`${filePath} is not a binary glTF file`);
  }

  let offset = 12;
  let json = null;
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.toString("utf8", offset + 4, offset + 8);
    if (type === "JSON") {
      json = JSON.parse(buffer.slice(offset + 8, offset + 8 + length).toString("utf8"));
      break;
    }
    offset += 8 + length;
  }
  if (!json) throw new Error(`${filePath} has no JSON chunk`);
  return json;
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

function normalize(v) {
  const length = Math.hypot(v[0], v[1], v[2]);
  if (length < 1e-8) return [0, 0, 0];
  return [v[0] / length, v[1] / length, v[2] / length];
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function column(matrix, index) {
  const offset = index * 4;
  return normalize([matrix[offset], matrix[offset + 1], matrix[offset + 2]]);
}

function position(matrix) {
  return [matrix[12], matrix[13], matrix[14]];
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function roundedVector(vector) {
  return vector.map(round);
}

const json = readGlb(target);
const nodes = json.nodes ?? [];
const parents = new Map();
nodes.forEach((node, parentIndex) => {
  for (const childIndex of node.children ?? []) parents.set(childIndex, parentIndex);
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
const chains = [
  ["left_shoulder_pivot", "left_elbow_pivot"],
  ["left_elbow_pivot", "left_wrist_pivot"],
  ["left_wrist_pivot", "left_wrist_anchor"],
  ["right_shoulder_pivot", "right_elbow_pivot"],
  ["right_elbow_pivot", "right_wrist_pivot"],
  ["left_hip_pivot", "left_knee_pivot"],
  ["left_knee_pivot", "left_ankle_pivot"],
  ["right_hip_pivot", "right_knee_pivot"],
  ["right_knee_pivot", "right_ankle_pivot"],
  ["waist_pivot", "chest_pivot"],
  ["chest_pivot", "neck_pivot"],
  ["neck_pivot", "head_pivot"],
];

const worldZ = [0, 0, 1];
const worldX = [1, 0, 0];
const worldY = [0, 1, 0];
const report = chains.map(([jointName, childName]) => {
  const jointIndex = names.get(jointName);
  const childIndex = names.get(childName);
  if (jointIndex === undefined || childIndex === undefined) {
    return { joint: jointName, child: childName, missing: true };
  }
  const jointWorld = worldMatrix(jointIndex);
  const childWorld = worldMatrix(childIndex);
  const axes = {
    x: column(jointWorld, 0),
    y: column(jointWorld, 1),
    z: column(jointWorld, 2),
  };
  const axisScores = Object.fromEntries(Object.entries(axes).map(([axis, vector]) => [
    axis,
    {
      world: roundedVector(vector),
      screenHingeScore: round(Math.abs(dot(vector, worldZ))),
      sidewaysScore: round(Math.abs(dot(vector, worldX))),
      verticalScore: round(Math.abs(dot(vector, worldY))),
    },
  ]));
  const bestScreenAxis = Object.entries(axisScores)
    .sort((a, b) => b[1].screenHingeScore - a[1].screenHingeScore)[0][0];
  return {
    joint: jointName,
    child: childName,
    jointWorld: roundedVector(position(jointWorld)),
    childWorld: roundedVector(position(childWorld)),
    childOffsetWorld: roundedVector(subtract(position(childWorld), position(jointWorld))),
    currentRuntimeAxis: "local z",
    currentRuntimeAxisWorld: axisScores.z.world,
    currentRuntimeScreenHingeScore: axisScores.z.screenHingeScore,
    recommendedScreenAxis: `local ${bestScreenAxis}`,
    axes: axisScores,
  };
});

const sidePositions = {};
for (const name of [
  "left_shoulder_pivot",
  "right_shoulder_pivot",
  "left_hip_pivot",
  "right_hip_pivot",
  "left_wrist_anchor",
]) {
  const index = names.get(name);
  if (index !== undefined) sidePositions[name] = roundedVector(position(worldMatrix(index)));
}

console.log(JSON.stringify({
  target,
  note: "For this game camera, a screen-plane hinge axis should point close to world Z. Low currentRuntimeScreenHingeScore means local Z is the wrong rotation axis for that joint.",
  sidePositions,
  report,
}, null, 2));
