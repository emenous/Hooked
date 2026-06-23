const fs = require("fs");
const path = require("path");

const defaultTarget = "assets/models/m_character_skeletal_textures_1k.glb";

const budgets = {
  prototype: {
    totalBytes: 9_500_000,
    geometryBytesApprox: 6_500_000,
    vertices: 120_000,
    triangles: 40_000,
    materials: 24,
    textures: 64,
    images: 4,
    minSkins: 1,
    minJoints: 18,
    requireAllPrimitivesSkinned: true,
  },
  final: {
    totalBytes: 4_000_000,
    geometryBytesApprox: 2_500_000,
    vertices: 60_000,
    triangles: 20_000,
    materials: 4,
    textures: 8,
    images: 4,
    minSkins: 1,
    minJoints: 18,
    requireAllPrimitivesSkinned: true,
  },
};

function parseArgs(argv) {
  const options = {
    file: defaultTarget,
    budgetName: "prototype",
    strict: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--budget") {
      options.budgetName = argv[index + 1] ?? options.budgetName;
      index += 1;
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      options.file = arg;
    }
  }

  return options;
}

function readGlb(file) {
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
  return { data, json, chunks };
}

function auditGlb(file) {
  const { data, json, chunks } = readGlb(file);
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

  return {
    file,
    totalBytes: data.length,
    chunks,
    nodes: json.nodes?.length ?? 0,
    meshes: meshes.length,
    primitives: primitiveCount,
    skinnedPrimitiveCount,
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
  };
}

function evaluateBudget(audit, budget) {
  const checks = [];
  const add = (name, ok, details = {}) => checks.push({ name, ok: Boolean(ok), ...details });

  for (const key of [
    "totalBytes",
    "geometryBytesApprox",
    "vertices",
    "triangles",
    "materials",
    "textures",
    "images",
  ]) {
    add(`${key}-within-budget`, audit[key] <= budget[key], {
      value: audit[key],
      limit: budget[key],
    });
  }

  add("has-required-skin", audit.skins >= budget.minSkins, {
    value: audit.skins,
    min: budget.minSkins,
  });
  add("has-required-joints", audit.joints >= budget.minJoints, {
    value: audit.joints,
    min: budget.minJoints,
  });
  add("all-primitives-skinned", !budget.requireAllPrimitivesSkinned || audit.skinnedPrimitiveCount === audit.primitives, {
    skinned: audit.skinnedPrimitiveCount,
    primitives: audit.primitives,
  });
  add("has-animation-clip", audit.animations.length > 0, {
    animations: audit.animations,
  });

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}

function printHelp() {
  console.log(`Usage: node tools/check_character_model_budget.js [file.glb] [--budget prototype|final] [--strict]

Default file: ${defaultTarget}

Budgets:
  prototype  Current playable target. Allows the existing AI mesh while preserving skeleton safety.
  final      Clean-model target for low-load gameplay. Intended for rebuilt/decimated candidates.

Without --strict, this reports JSON and exits 0 even when a budget fails.
With --strict, it exits 1 if the selected budget fails.`);
}

function main() {
  const options = parseArgs(process.argv);
  if (options.help) {
    printHelp();
    return;
  }

  const budget = budgets[options.budgetName];
  if (!budget) {
    throw new Error(`Unknown budget "${options.budgetName}". Use one of: ${Object.keys(budgets).join(", ")}`);
  }

  const file = path.normalize(options.file);
  const audit = auditGlb(file);
  const budgetResult = evaluateBudget(audit, budget);
  const report = {
    ok: budgetResult.ok,
    file,
    budget: options.budgetName,
    strict: options.strict,
    audit,
    budgetLimits: budget,
    checks: budgetResult.checks,
  };

  console.log(JSON.stringify(report, null, 2));
  if (options.strict && !budgetResult.ok) process.exitCode = 1;
}

main();
