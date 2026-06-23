const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const defaultTarget = "assets/models/m_character_skeletal_textures_1k.glb";
const targetArg = process.argv[2] ?? defaultTarget;
const target = path.normalize(targetArg);
const sourcePath = path.join(repoRoot, "src", "main.js");
const poseReferencePath = path.join(repoRoot, "data", "character_pose_references.json");
const expectedProjectPoseKeys = [
  "idleHang",
  "jumpLaunch",
  "throwHook",
  "midSwing",
  "downSwing",
  "upSwing",
  "falling",
  "release",
  "midFlip",
  "barrelRoll",
];

function normalizeSlash(value) {
  return path.normalize(value.replace(/^\.\//, ""));
}

function runJsonTool(scriptName, args = []) {
  const scriptPath = path.join(repoRoot, "tools", scriptName);
  const output = execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output);
}

function parseConfig(source) {
  const useGlbMatch = source.match(/useGlbCharacter:\s*(true|false)/);
  const pathMatch = source.match(/glbCharacterPath:\s*"([^"]+)"/);
  const modeMatch = source.match(/glbPoseMode:\s*"([^"]+)"/);
  const axesBlock = source.match(/const glbPivotDriverAxes = \{([\s\S]*?)\};/);
  const axes = {};
  if (axesBlock) {
    for (const match of axesBlock[1].matchAll(/([A-Za-z0-9_]+):\s*"([xyz])"/g)) {
      axes[match[1]] = match[2];
    }
  }

  return {
    useGlbCharacter: useGlbMatch?.[1] === "true",
    glbCharacterPath: pathMatch?.[1] ?? null,
    glbPoseMode: modeMatch?.[1] ?? null,
    axes,
  };
}

function pushCheck(checks, name, ok, details = {}) {
  checks.push({ name, ok: Boolean(ok), ...details });
}

function readPoseReferenceLibrary() {
  if (!fs.existsSync(poseReferencePath)) {
    return { exists: false, error: "missing-file" };
  }
  try {
    const payload = JSON.parse(fs.readFileSync(poseReferencePath, "utf8"));
    return {
      exists: true,
      version: payload.version,
      model: payload.model,
      poseMode: payload.poseMode,
      poses: payload.poses && typeof payload.poses === "object" ? payload.poses : null,
      poseKeys: payload.poses && typeof payload.poses === "object" ? Object.keys(payload.poses) : [],
    };
  } catch (error) {
    return { exists: true, error: error.message };
  }
}

function jointToRuntimeKey(jointName) {
  const map = {
    M_root: "root",
    torso_pivot: "torso",
    pelvis_pivot: "pelvis",
    waist_pivot: "waist",
    chest_pivot: "chest",
    neck_pivot: "neck",
    head_pivot: "head",
    left_shoulder_pivot: "leftShoulder",
    left_elbow_pivot: "leftElbow",
    left_wrist_pivot: "leftWrist",
    right_shoulder_pivot: "rightShoulder",
    right_elbow_pivot: "rightElbow",
    right_wrist_pivot: "rightWrist",
    left_hip_pivot: "leftHip",
    left_knee_pivot: "leftKnee",
    left_ankle_pivot: "leftAnkle",
    right_hip_pivot: "rightHip",
    right_knee_pivot: "rightKnee",
    right_ankle_pivot: "rightAnkle",
  };
  return map[jointName] ?? null;
}

function recommendedAxis(reportRow) {
  return reportRow.recommendedScreenAxis?.replace("local ", "") ?? null;
}

function sidePosition(sidePositions, name) {
  return sidePositions?.[name] ?? null;
}

function main() {
  const source = fs.readFileSync(sourcePath, "utf8");
  const config = parseConfig(source);
  const poseLibrary = readPoseReferenceLibrary();
  const audit = runJsonTool("audit_character_skeleton.js", [target]);
  const axes = runJsonTool("diagnose_character_axes.js", [target]);
  const mesh = runJsonTool("audit_glb_mesh_breakdown.js", [target]);
  const prototypeBudget = runJsonTool("check_character_model_budget.js", [target, "--budget", "prototype"]);
  const finalBudget = runJsonTool("check_character_model_budget.js", [target, "--budget", "final"]);
  const checks = [];
  const warnings = [];

  pushCheck(checks, "source-uses-glb-character", config.useGlbCharacter, {
    value: config.useGlbCharacter,
  });
  pushCheck(checks, "source-glb-path-matches-target", normalizeSlash(config.glbCharacterPath ?? "") === normalizeSlash(target), {
    sourcePath: config.glbCharacterPath,
    target,
  });
  pushCheck(checks, "source-default-pose-mode-ragdoll-lite", config.glbPoseMode === "ragdollLite", {
    value: config.glbPoseMode,
  });
  pushCheck(checks, "project-pose-reference-library", (
    poseLibrary.exists &&
    !poseLibrary.error &&
    poseLibrary.version === 1 &&
    poseLibrary.poses &&
    source.includes("characterPoseProjectPath") &&
    source.includes("data/character_pose_references.json")
  ), {
    file: path.relative(repoRoot, poseReferencePath),
    version: poseLibrary.version,
    model: poseLibrary.model,
    poseMode: poseLibrary.poseMode,
    poseKeys: poseLibrary.poseKeys,
    error: poseLibrary.error ?? null,
  });
  const missingProjectPoseKeys = expectedProjectPoseKeys
    .filter((key) => !poseLibrary.poseKeys?.includes(key));
  const posesWithInvalidBlend = Object.entries(poseLibrary.poses ?? {})
    .filter(([, pose]) => !Number.isFinite(pose?.blend) || pose.blend < 0 || pose.blend > 1)
    .map(([key, pose]) => ({ key, blend: pose?.blend ?? null }));
  pushCheck(checks, "project-baseline-pose-keys", (
    missingProjectPoseKeys.length === 0 &&
    posesWithInvalidBlend.length === 0
  ), {
    expected: expectedProjectPoseKeys,
    poseKeys: poseLibrary.poseKeys,
    missing: missingProjectPoseKeys,
    invalidBlend: posesWithInvalidBlend,
  });
  pushCheck(checks, "ragdoll-lite-applies-authored-pose-reference", (
    /setGlbRagdollLitePose\(now\);\s*applyAuthoredPoseReference\(/.test(source) &&
    source.includes("authoredPoseRopeProtectedKeys") &&
    source.includes("leftShoulder") &&
    source.includes("rope-arm-protected")
  ), {
    expected: "ragdollLite applies authored pose overlays while protecting the rope hand chain",
  });
  pushCheck(checks, "skeleton-contract", audit.ok, {
    failures: audit.failures,
    warnings: audit.warnings,
    summary: audit.summary,
  });
  pushCheck(checks, "diagnostic-animation-present", (audit.summary.animations ?? []).length > 0, {
    animations: audit.summary.animations,
  });

  const leftShoulder = sidePosition(axes.sidePositions, "left_shoulder_pivot");
  const rightShoulder = sidePosition(axes.sidePositions, "right_shoulder_pivot");
  const leftHip = sidePosition(axes.sidePositions, "left_hip_pivot");
  const rightHip = sidePosition(axes.sidePositions, "right_hip_pivot");
  const leftWrist = sidePosition(axes.sidePositions, "left_wrist_anchor");
  const sideOk = (
    leftShoulder && rightShoulder && leftHip && rightHip && leftWrist &&
    leftShoulder[2] < 0 &&
    rightShoulder[2] > 0 &&
    leftHip[2] < 0 &&
    rightHip[2] > 0 &&
    leftWrist[2] < 0
  );
  pushCheck(checks, "left-right-side-semantics", sideOk, {
    expected: "left joints on negative Z, right joints on positive Z in the exported GLB",
    sidePositions: axes.sidePositions,
  });

  const axisMismatches = [];
  const weakHingeAxes = [];
  for (const row of axes.report ?? []) {
    const key = jointToRuntimeKey(row.joint);
    if (!key) continue;
    const configured = config.axes[key];
    const recommended = recommendedAxis(row);
    if (configured !== recommended) {
      axisMismatches.push({
        joint: row.joint,
        runtimeKey: key,
        configured,
        recommended,
      });
    }
    if ((row.axes?.[configured]?.screenHingeScore ?? 0) < 0.7) {
      weakHingeAxes.push({
        joint: row.joint,
        runtimeKey: key,
        configured,
        screenHingeScore: row.axes?.[configured]?.screenHingeScore ?? null,
      });
    }
  }
  pushCheck(checks, "runtime-axis-map-matches-glb", axisMismatches.length === 0, {
    mismatches: axisMismatches,
  });
  pushCheck(checks, "runtime-axes-are-screen-plane-hinges", weakHingeAxes.length === 0, {
    weakHingeAxes,
  });

  const placeholderSymbols = source.match(/\b(playerBody|playerLimbs|playerArm|playerLeg|createNinjaTexture)\b/g) ?? [];
  pushCheck(checks, "old-placeholder-character-renderer-removed", placeholderSymbols.length === 0, {
    found: [...new Set(placeholderSymbols)],
  });
  pushCheck(checks, "prototype-model-budget", prototypeBudget.ok, {
    budget: prototypeBudget.budget,
    failed: prototypeBudget.checks.filter((check) => !check.ok),
    summary: {
      totalBytes: prototypeBudget.audit.totalBytes,
      geometryBytesApprox: prototypeBudget.audit.geometryBytesApprox,
      vertices: prototypeBudget.audit.vertices,
      triangles: prototypeBudget.audit.triangles,
      materials: prototypeBudget.audit.materials,
      textures: prototypeBudget.audit.textures,
    },
  });
  const finalBudgetSummary = {
    totalBytes: finalBudget.audit.totalBytes,
    geometryBytesApprox: finalBudget.audit.geometryBytesApprox,
    vertices: finalBudget.audit.vertices,
    triangles: finalBudget.audit.triangles,
    materials: finalBudget.audit.materials,
    textures: finalBudget.audit.textures,
    images: finalBudget.audit.images,
    skins: finalBudget.audit.skins,
    joints: finalBudget.audit.joints,
    skinnedPrimitiveCount: finalBudget.audit.skinnedPrimitiveCount,
  };

  if (mesh.totalVertices > 65000) {
    warnings.push({
      name: "high-poly-character",
      message: "The GLB is usable, but high-poly for a no-load-time target. Rebuild/decimate later.",
      totalVertices: mesh.totalVertices,
      totalTriangles: mesh.totalTriangles,
    });
  }
  if (!finalBudget.ok) {
    warnings.push({
      name: "final-model-budget-not-met",
      message: "The current GLB preserves visual geometry, but is not final load-budget ready. Use retopo or selective mesh cleanup before making final budget a hard gate.",
      failed: finalBudget.checks.filter((check) => !check.ok),
      summary: finalBudgetSummary,
    });
  }

  const ok = checks.every((check) => check.ok);
  const report = {
    ok,
    target,
    checks,
    warnings,
    mesh: {
      totalMeshes: mesh.totalMeshes,
      totalVertices: mesh.totalVertices,
      totalTriangles: mesh.totalTriangles,
      largestMeshes: mesh.meshes.slice(0, 5),
    },
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(ok ? 0 : 1);
}

main();
