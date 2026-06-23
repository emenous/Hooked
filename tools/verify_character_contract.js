const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const defaultTarget = "assets/models/m_character_skeletal_textures_1k.glb";
const targetArg = process.argv[2] ?? defaultTarget;
const target = path.normalize(targetArg);
const sourcePath = path.join(repoRoot, "src", "main.js");

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
  const audit = runJsonTool("audit_character_skeleton.js", [target]);
  const axes = runJsonTool("diagnose_character_axes.js", [target]);
  const mesh = runJsonTool("audit_glb_mesh_breakdown.js", [target]);
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

  if (mesh.totalVertices > 65000) {
    warnings.push({
      name: "high-poly-character",
      message: "The GLB is usable, but high-poly for a no-load-time target. Rebuild/decimate later.",
      totalVertices: mesh.totalVertices,
      totalTriangles: mesh.totalTriangles,
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
