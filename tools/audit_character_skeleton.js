const fs = require("fs");
const path = require("path");

const REQUIRED_JOINTS = [
  "M_root",
  "pelvis_pivot",
  "waist_pivot",
  "chest_pivot",
  "neck_pivot",
  "head_pivot",
  "ribbon_anchor",
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
];

const EXPECTED_PARENT = {
  pelvis_pivot: "M_root",
  waist_pivot: "pelvis_pivot",
  chest_pivot: "waist_pivot",
  neck_pivot: "chest_pivot",
  head_pivot: "neck_pivot",
  ribbon_anchor: "head_pivot",
  left_shoulder_pivot: "chest_pivot",
  left_elbow_pivot: "left_shoulder_pivot",
  left_wrist_pivot: "left_elbow_pivot",
  left_wrist_anchor: "left_wrist_pivot",
  right_shoulder_pivot: "chest_pivot",
  right_elbow_pivot: "right_shoulder_pivot",
  right_wrist_pivot: "right_elbow_pivot",
  left_hip_pivot: "pelvis_pivot",
  left_knee_pivot: "left_hip_pivot",
  left_ankle_pivot: "left_knee_pivot",
  right_hip_pivot: "pelvis_pivot",
  right_knee_pivot: "right_hip_pivot",
  right_ankle_pivot: "right_knee_pivot",
};

function readGlbJson(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString("utf8", 0, 4) !== "glTF") {
    throw new Error(`${filePath} is not a binary glTF file`);
  }

  let offset = 12;
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.toString("utf8", offset + 4, offset + 8);
    if (type === "JSON") {
      return JSON.parse(buffer.slice(offset + 8, offset + 8 + length).toString("utf8"));
    }
    offset += 8 + length;
  }

  throw new Error(`${filePath} has no JSON chunk`);
}

function indexByName(nodes) {
  const map = new Map();
  nodes.forEach((node, index) => {
    if (node.name) map.set(node.name, index);
  });
  return map;
}

function buildParentMap(nodes) {
  const parents = new Map();
  nodes.forEach((node, parentIndex) => {
    for (const childIndex of node.children ?? []) {
      parents.set(childIndex, parentIndex);
    }
  });
  return parents;
}

function audit(filePath) {
  const gltf = readGlbJson(filePath);
  const nodes = gltf.nodes ?? [];
  const meshes = gltf.meshes ?? [];
  const accessors = gltf.accessors ?? [];
  const skins = gltf.skins ?? [];
  const animations = gltf.animations ?? [];
  const names = indexByName(nodes);
  const parents = buildParentMap(nodes);
  const failures = [];
  const warnings = [];

  if (skins.length !== 1) failures.push(`Expected exactly 1 skin, found ${skins.length}`);
  if (animations.length < 1) warnings.push("No diagnostic animation clips found");

  const skin = skins[0];
  const jointIndices = new Set(skin?.joints ?? []);
  const jointNames = [...jointIndices].map((index) => nodes[index]?.name).filter(Boolean);
  for (const jointName of REQUIRED_JOINTS) {
    const index = names.get(jointName);
    if (index === undefined) {
      failures.push(`Missing required joint node: ${jointName}`);
    } else if (!jointIndices.has(index)) {
      failures.push(`Node exists but is not in the skin joints: ${jointName}`);
    }
  }

  for (const [childName, parentName] of Object.entries(EXPECTED_PARENT)) {
    const childIndex = names.get(childName);
    const expectedParentIndex = names.get(parentName);
    if (childIndex === undefined || expectedParentIndex === undefined) continue;
    const actualParentIndex = parents.get(childIndex);
    const actualParentName = nodes[actualParentIndex]?.name;
    if (actualParentIndex !== expectedParentIndex) {
      failures.push(`Bad parent for ${childName}: expected ${parentName}, found ${actualParentName ?? "none"}`);
    }
  }

  const skinnedMeshNodes = nodes
    .map((node, index) => ({ node, index }))
    .filter(({ node }) => node.mesh !== undefined);
  const missingSkinNodes = skinnedMeshNodes.filter(({ node }) => node.skin === undefined);
  if (missingSkinNodes.length) {
    failures.push(`Mesh nodes without skin: ${missingSkinNodes.map(({ node }) => node.name).join(", ")}`);
  }

  let primitiveCount = 0;
  let skinnedPrimitiveCount = 0;
  const positionMin = [Infinity, Infinity, Infinity];
  const positionMax = [-Infinity, -Infinity, -Infinity];
  meshes.forEach((mesh) => {
    for (const primitive of mesh.primitives ?? []) {
      primitiveCount += 1;
      if (primitive.attributes?.JOINTS_0 !== undefined && primitive.attributes?.WEIGHTS_0 !== undefined) {
        skinnedPrimitiveCount += 1;
      }
      const positionAccessor = accessors[primitive.attributes?.POSITION];
      if (positionAccessor?.min && positionAccessor?.max) {
        for (let axis = 0; axis < 3; axis += 1) {
          positionMin[axis] = Math.min(positionMin[axis], positionAccessor.min[axis]);
          positionMax[axis] = Math.max(positionMax[axis], positionAccessor.max[axis]);
        }
      }
    }
  });
  if (primitiveCount !== skinnedPrimitiveCount) {
    failures.push(`Skinned primitives ${skinnedPrimitiveCount}/${primitiveCount}`);
  }

  const positionSpan = positionMax.map((value, axis) => value - positionMin[axis]);
  const majorAxis = positionSpan.indexOf(Math.max(...positionSpan));
  if (majorAxis !== 1) {
    failures.push(
      `Mesh basis is not game-ready: tallest axis should be Y, found ${["X", "Y", "Z"][majorAxis]} span ${JSON.stringify(positionSpan)}`,
    );
  }

  return {
    file: path.normalize(filePath),
    ok: failures.length === 0,
    failures,
    warnings,
    summary: {
      nodes: nodes.length,
      meshes: meshes.length,
      meshNodes: skinnedMeshNodes.length,
      skins: skins.length,
      joints: jointNames.length,
      animations: animations.map((animation) => ({
        name: animation.name ?? "(unnamed)",
        channels: animation.channels?.length ?? 0,
        samplers: animation.samplers?.length ?? 0,
      })),
      skinnedPrimitives: `${skinnedPrimitiveCount}/${primitiveCount}`,
      meshPositionSpan: {
        x: positionSpan[0],
        y: positionSpan[1],
        z: positionSpan[2],
      },
    },
    joints: jointNames,
  };
}

const target = process.argv[2] ?? "assets/models/m_character_skeletal.glb";
const report = audit(target);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
