const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const defaultUrl = "http://127.0.0.1:5173/";
const targetUrl = process.argv[2] ?? defaultUrl;
const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findBrowserExecutable() {
  return chromeCandidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function withCacheBust(url) {
  return `${url}${url.includes("?") ? "&" : "?"}characterRuntime=${Date.now()}`;
}

async function waitForFile(filePath, timeoutMs = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf8");
    await sleep(50);
  }
  throw new Error(`Timed out waiting for ${filePath}`);
}

async function waitForJson(url, timeoutMs = 10000) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(80);
  }
  throw lastError ?? new Error(`Timed out fetching ${url}`);
}

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.socket = null;
  }

  async connect() {
    this.socket = new WebSocket(this.webSocketUrl);
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(`${message.error.message}: ${message.error.data ?? ""}`));
      } else {
        pending.resolve(message.result);
      }
    });
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    const payload = JSON.stringify({ id, method, params });
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.socket.send(payload);
    return promise;
  }

  close() {
    this.socket?.close();
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
  }
  return result.result?.value;
}

async function waitForRuntime(cdp, expression, timeoutMs = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await evaluate(cdp, expression);
    if (value) return value;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for runtime expression: ${expression}`);
}

async function click(cdp, x, y) {
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
}

async function keyDown(cdp, code, key, windowsVirtualKeyCode) {
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    code,
    key,
    windowsVirtualKeyCode,
    nativeVirtualKeyCode: windowsVirtualKeyCode,
  });
}

async function keyUp(cdp, code, key, windowsVirtualKeyCode) {
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    code,
    key,
    windowsVirtualKeyCode,
    nativeVirtualKeyCode: windowsVirtualKeyCode,
  });
}

async function press(cdp, code, key, windowsVirtualKeyCode) {
  await keyDown(cdp, code, key, windowsVirtualKeyCode);
  await keyUp(cdp, code, key, windowsVirtualKeyCode);
}

function checkByName(health, name) {
  return health.checks?.find((check) => check.name === name) ?? null;
}

function hasBackwardKnees(health) {
  const legs = health.snapshot?.legs ?? {};
  return Object.values(legs).every((leg) => leg?.bendDirection !== "forward");
}

function summarizeHealth(health) {
  return {
    ok: health.ok,
    checks: health.checks,
    animation: health.snapshot?.animation,
    body: health.snapshot?.body,
    leftArm: health.snapshot?.leftArm,
    legs: health.snapshot?.legs,
    sideDepth: health.snapshot?.sideDepth,
    torso: health.snapshot?.torso,
    swing: health.snapshot?.swing,
    flourish: health.snapshot?.flourish,
    ribbon: health.snapshot?.ribbon,
    segments: health.snapshot?.segments,
  };
}

function addResult(results, name, ok, details = {}) {
  results.push({ name, ok: Boolean(ok), ...details });
}

function summarizeSwingSample(health, label) {
  return {
    label,
    ok: health.ok,
    animation: health.snapshot?.animation,
    grappled: health.snapshot?.grappled,
    facing: health.snapshot?.facing,
    ropeErrorDeg: health.snapshot?.leftArm?.ropeAlignmentErrorDeg ?? null,
    ropeOriginScreenDistance: health.snapshot?.rope?.originScreenDistances?.leftWrist ?? null,
    legSeparationDeg: health.snapshot?.swing?.legSeparationDeg ?? null,
    leftKnee: health.snapshot?.legs?.left?.bendDirection ?? null,
    rightKnee: health.snapshot?.legs?.right?.bendDirection ?? null,
  };
}

function summarizeHookPreview(health, label) {
  const bodyScaleX = health.snapshot?.body?.scaleX ?? null;
  return {
    ...summarizeSwingSample(health, label),
    bodyScaleX,
    foregroundSide: health.snapshot?.sideDepth?.foregroundSide ?? null,
    leftArmAligned: health.snapshot?.leftArm?.alignedToRope ?? null,
    ropeOriginAttachment: health.snapshot?.rope?.originAttachment ?? null,
  };
}

function summarizeSwingSequence(samples) {
  const summaries = samples.map(({ label, health }) => summarizeSwingSample(health, label));
  const ropeErrors = summaries
    .map((sample) => Math.abs(sample.ropeErrorDeg ?? Infinity))
    .filter(Number.isFinite);
  const ropeDistances = summaries
    .map((sample) => sample.ropeOriginScreenDistance ?? Infinity)
    .filter(Number.isFinite);
  const legSeparations = summaries
    .map((sample) => Math.abs(sample.legSeparationDeg ?? 0))
    .filter(Number.isFinite);
  const facings = new Set(summaries.map((sample) => sample.facing).filter((facing) => facing !== null));
  return {
    summaries,
    allHealthy: samples.every(({ health }) => health.ok),
    allGrappled: summaries.every((sample) => sample.grappled),
    allKneesSafe: samples.every(({ health }) => hasBackwardKnees(health)),
    maxRopeErrorDeg: ropeErrors.length ? Math.max(...ropeErrors) : null,
    maxRopeOriginScreenDistance: ropeDistances.length ? Math.max(...ropeDistances) : null,
    maxAbsLegSeparationDeg: legSeparations.length ? Math.max(...legSeparations) : null,
    facingCount: facings.size,
  };
}

function summarizeFallSample(health) {
  return {
    ok: health.ok,
    animation: health.snapshot?.animation,
    facing: health.snapshot?.facing,
    speed: health.snapshot?.swing?.speed ?? null,
    localVelocityX: health.snapshot?.swing?.localVelocityX ?? null,
    leftKnee: health.snapshot?.legs?.left?.bendDirection ?? null,
    rightKnee: health.snapshot?.legs?.right?.bendDirection ?? null,
    legSeparationDeg: health.snapshot?.swing?.legSeparationDeg ?? null,
    compactRadius: health.snapshot?.flourish?.compactRadius ?? null,
  };
}

function summarizeFreePose(health, label) {
  return {
    label,
    ok: health.ok,
    animation: health.snapshot?.animation,
    facing: health.snapshot?.facing,
    bodyScaleX: health.snapshot?.body?.scaleX ?? null,
    foregroundSide: health.snapshot?.sideDepth?.foregroundSide ?? null,
    speed: health.snapshot?.swing?.speed ?? null,
    localVelocityX: health.snapshot?.swing?.localVelocityX ?? null,
    leftKnee: health.snapshot?.legs?.left?.bendDirection ?? null,
    rightKnee: health.snapshot?.legs?.right?.bendDirection ?? null,
    legSeparationDeg: health.snapshot?.swing?.legSeparationDeg ?? null,
    compactRadius: health.snapshot?.flourish?.compactRadius ?? null,
  };
}

function vectorDistance2d(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) return Infinity;
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function ribbonMotionDelta(before, after) {
  const beforeRibbon = before?.snapshot?.ribbon;
  const afterRibbon = after?.snapshot?.ribbon;
  if (!beforeRibbon || !afterRibbon) return Infinity;
  return Math.max(
    vectorDistance2d(beforeRibbon.topLineStart, afterRibbon.topLineStart),
    vectorDistance2d(beforeRibbon.bottomLineStart, afterRibbon.bottomLineStart),
    vectorDistance2d(beforeRibbon.topAnchor, afterRibbon.topAnchor),
    vectorDistance2d(beforeRibbon.bottomAnchor, afterRibbon.bottomAnchor),
  );
}

function segmentRigidityReport(baseline, samples, tolerance = 0.025) {
  const baselineSegments = baseline?.snapshot?.segments ?? {};
  const baselineNames = Object.keys(baselineSegments);
  const failures = [];
  const summaries = [];
  let maxDelta = 0;
  let maxRatio = 0;

  for (const { label, health } of samples) {
    const sampleSegments = health?.snapshot?.segments ?? {};
    const sampleSummary = {};
    for (const name of baselineNames) {
      const baselineDistance = baselineSegments[name]?.distance;
      const sampleDistance = sampleSegments[name]?.distance;
      if (!Number.isFinite(baselineDistance) || !Number.isFinite(sampleDistance)) {
        failures.push({ label, segment: name, reason: "missing-distance" });
        continue;
      }
      const delta = Math.abs(sampleDistance - baselineDistance);
      const ratio = delta / Math.max(Math.abs(baselineDistance), 0.001);
      maxDelta = Math.max(maxDelta, delta);
      maxRatio = Math.max(maxRatio, ratio);
      sampleSummary[name] = {
        baseline: baselineDistance,
        distance: sampleDistance,
        delta: Number(delta.toFixed(4)),
        ratio: Number(ratio.toFixed(4)),
      };
      if (delta > tolerance && ratio > 0.08) {
        failures.push({
          label,
          segment: name,
          baseline: baselineDistance,
          distance: sampleDistance,
          delta: Number(delta.toFixed(4)),
          ratio: Number(ratio.toFixed(4)),
        });
      }
    }
    summaries.push({ label, segments: sampleSummary });
  }

  return {
    ok: baselineNames.length >= 10 && failures.length === 0,
    baselineCount: baselineNames.length,
    tolerance,
    maxDelta: Number(maxDelta.toFixed(4)),
    maxRatio: Number(maxRatio.toFixed(4)),
    failures,
    summaries,
  };
}

async function stopBrowser(browser) {
  if (!browser || browser.killed) return;
  const exited = new Promise((resolve) => {
    browser.once("exit", resolve);
  });
  browser.kill();
  await Promise.race([exited, sleep(1500)]);
}

async function removeDirectoryRetry(directory) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      fs.rmSync(directory, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === 7) throw error;
      await sleep(160);
    }
  }
}

async function main() {
  const browserPath = findBrowserExecutable();
  if (!browserPath) {
    throw new Error(`Could not find Chrome or Edge. Tried: ${chromeCandidates.join(", ")}`);
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "hooked-character-runtime-"));
  const devToolsFile = path.join(userDataDir, "DevToolsActivePort");
  const url = withCacheBust(targetUrl);
  const browser = spawn(browserPath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--mute-audio",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "--window-size=1024,768",
    url,
  ], {
    stdio: "ignore",
  });

  let cdp = null;
  try {
    const activePort = await waitForFile(devToolsFile);
    const [portLine] = activePort.trim().split(/\r?\n/);
    const port = Number(portLine);
    if (!Number.isFinite(port)) throw new Error(`Invalid DevTools port: ${activePort}`);
    const tabs = await waitForJson(`http://127.0.0.1:${port}/json/list`);
    const pageTarget = tabs.find((tab) => tab.type === "page") ?? tabs[0];
    if (!pageTarget?.webSocketDebuggerUrl) throw new Error("No debuggable page target found");

    cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await waitForRuntime(cdp, "window.HookedDebug?.poseHealth?.().snapshot?.glbLoaded === true");
    await evaluate(cdp, `
      (() => {
        window.HookedDebug.poseMode("ragdollLite");
        window.HookedDebug.setGlbNeutralOnly(false);
        window.HookedDebug.resetPerformance?.();
        return true;
      })()
    `);

    const results = [];
    await waitForRuntime(cdp, "window.HookedDebug?.poseReferences?.().projectLoaded === true", 5000);
    const poseReferences = await evaluate(cdp, "window.HookedDebug.poseReferences()");
    addResult(results, "project-pose-reference-library-loaded", poseReferences.projectLoaded && !poseReferences.projectError, {
      projectPath: poseReferences.projectPath,
      projectKeys: poseReferences.projectKeys,
      localKeys: poseReferences.localKeys,
      mergedKeys: poseReferences.mergedKeys,
      error: poseReferences.projectError,
    });

    const rig = await evaluate(cdp, "window.HookedDebug.characterRig()");
    addResult(results, "runtime-glb-loaded", rig.loaded && rig.skinnedMeshes >= 1, {
      skinnedMeshes: rig.skinnedMeshes,
      animations: rig.animations,
      poseReferences: rig.poseReferences,
    });

    const idle = await evaluate(cdp, "window.HookedDebug.poseHealth()");
    addResult(results, "idle-pose-health", idle.ok, { health: summarizeHealth(idle) });
    const idleRibbon = checkByName(idle, "ribbon-anchor-attached");
    addResult(results, "idle-ribbon-anchor-attached", idleRibbon?.ok, {
      ribbon: idle.snapshot?.ribbon ?? null,
    });

    await press(cdp, "KeyP", "p", 80);
    await sleep(180);
    const ribbonFreezeStart = await evaluate(cdp, "window.HookedDebug.poseHealth()");
    await sleep(520);
    const ribbonFreezeEnd = await evaluate(cdp, "window.HookedDebug.poseHealth()");
    await press(cdp, "KeyP", "p", 80);
    await sleep(120);
    const ribbonFreezeDelta = ribbonMotionDelta(ribbonFreezeStart, ribbonFreezeEnd);
    addResult(results, "build-mode-ribbon-freezes", ribbonFreezeStart.snapshot?.ribbon?.frozen && ribbonFreezeDelta <= 0.001, {
      delta: ribbonFreezeDelta,
      startRibbon: ribbonFreezeStart.snapshot?.ribbon ?? null,
      endRibbon: ribbonFreezeEnd.snapshot?.ribbon ?? null,
    });

    const falling = await evaluate(cdp, `
      window.HookedDebug.previewPose({
        hasLaunched: true,
        grounded: false,
        grappled: false,
        hookActive: false,
        velocity: [9, -18, 0],
        facing: 1,
        player: [4, 4, 0],
        dt: 1 / 60,
        now: 4.25
      })
    `);
    const fallingSummary = summarizeFallSample(falling);
    addResult(results, "falling-pose-health", falling.ok, { health: summarizeHealth(falling), falling: fallingSummary });
    addResult(results, "falling-animation-selected", falling.snapshot?.animation === "falling", { falling: fallingSummary });
    addResult(results, "falling-knees-do-not-bend-forward", hasBackwardKnees(falling), {
      legs: falling.snapshot?.legs ?? null,
      falling: fallingSummary,
    });
    addResult(results, "falling-limbs-remain-readable", (
      Math.abs(falling.snapshot?.swing?.legSeparationDeg ?? 0) >= 6 &&
      (falling.snapshot?.flourish?.compactRadius ?? 0) >= 1.2
    ), { falling: fallingSummary });
    const fallingRigidity = segmentRigidityReport(idle, [{ label: "falling", health: falling }]);
    addResult(results, "falling-limb-segments-remain-rigid", fallingRigidity.ok, fallingRigidity);

    const jumpLaunch = await evaluate(cdp, `
      window.HookedDebug.previewPose({
        hasLaunched: true,
        grounded: false,
        grappled: false,
        hookActive: false,
        velocity: [7, 4.2, 0],
        facing: 1,
        player: [4, 4, 0],
        dt: 1 / 60,
        now: 4.75
      })
    `);
    const jumpLaunchSummary = summarizeFreePose(jumpLaunch, "jump-launch");
    addResult(results, "jump-launch-pose-health", jumpLaunch.ok, {
      health: summarizeHealth(jumpLaunch),
      jumpLaunch: jumpLaunchSummary,
    });
    addResult(results, "jump-launch-animation-selected", jumpLaunch.snapshot?.animation === "jumpLaunch", {
      jumpLaunch: jumpLaunchSummary,
    });
    addResult(results, "jump-launch-knees-do-not-bend-forward", hasBackwardKnees(jumpLaunch), {
      jumpLaunch: jumpLaunchSummary,
      legs: jumpLaunch.snapshot?.legs ?? null,
    });
    addResult(results, "jump-launch-right-side-foreground", jumpLaunch.snapshot?.sideDepth?.foregroundSide === "right", {
      jumpLaunch: jumpLaunchSummary,
      sideDepth: jumpLaunch.snapshot?.sideDepth ?? null,
    });
    addResult(results, "jump-launch-limbs-remain-readable", (
      (jumpLaunch.snapshot?.flourish?.compactRadius ?? 0) >= 1.2
    ), {
      jumpLaunch: jumpLaunchSummary,
      compactRadius: jumpLaunch.snapshot?.flourish?.compactRadius ?? null,
    });
    const jumpLaunchRigidity = segmentRigidityReport(idle, [{ label: "jump-launch", health: jumpLaunch }]);
    addResult(results, "jump-launch-limb-segments-remain-rigid", jumpLaunchRigidity.ok, jumpLaunchRigidity);

    const backwardHook = await evaluate(cdp, `
      window.HookedDebug.previewPose({
        hasLaunched: true,
        grounded: false,
        grappled: true,
        hookActive: true,
        velocity: [-12, -10, 0],
        facing: -1,
        player: [4, 4, 0],
        hookEnd: [1.3, 6.8, 0],
        dt: 1 / 60,
        now: 5.5
      })
    `);
    const backwardHookSummary = summarizeHookPreview(backwardHook, "backward-hook");
    const backwardHookArm = checkByName(backwardHook, "left-arm-rope-alignment");
    const backwardHookOrigin = checkByName(backwardHook, "rope-origin-left-wrist");
    addResult(results, "backward-hook-pose-health", backwardHook.ok, {
      health: summarizeHealth(backwardHook),
      hook: backwardHookSummary,
    });
    addResult(results, "backward-hook-facing-left", backwardHook.snapshot?.facing === -1 && (backwardHook.snapshot?.body?.scaleX ?? 1) < 0, {
      hook: backwardHookSummary,
    });
    addResult(results, "backward-hook-left-side-foreground", backwardHook.snapshot?.sideDepth?.foregroundSide === "left", {
      hook: backwardHookSummary,
      sideDepth: backwardHook.snapshot?.sideDepth ?? null,
    });
    addResult(results, "backward-hook-left-arm-follows-rope", backwardHookArm?.ok && Math.abs(backwardHook.snapshot?.leftArm?.ropeAlignmentErrorDeg ?? Infinity) <= 6, {
      hook: backwardHookSummary,
      leftArm: backwardHook.snapshot?.leftArm ?? null,
    });
    addResult(results, "backward-hook-rope-origin-left-wrist", backwardHookOrigin?.ok && (backwardHook.snapshot?.rope?.originScreenDistances?.leftWrist ?? Infinity) <= 0.08, {
      hook: backwardHookSummary,
      rope: backwardHook.snapshot?.rope ?? null,
    });
    addResult(results, "backward-hook-knees-do-not-bend-forward", hasBackwardKnees(backwardHook), {
      hook: backwardHookSummary,
      legs: backwardHook.snapshot?.legs ?? null,
    });
    const backwardHookRigidity = segmentRigidityReport(idle, [{ label: "backward-hook", health: backwardHook }]);
    addResult(results, "backward-hook-limb-segments-remain-rigid", backwardHookRigidity.ok, backwardHookRigidity);

    const forwardMidSwing = await evaluate(cdp, `
      window.HookedDebug.previewPose({
        hasLaunched: true,
        grounded: false,
        grappled: true,
        hookActive: true,
        velocity: [12, 0.4, 0],
        facing: 1,
        player: [4, 4, 0],
        hookEnd: [7.1, 6.2, 0],
        dt: 1 / 60,
        now: 5.9
      })
    `);
    const backwardMidSwing = await evaluate(cdp, `
      window.HookedDebug.previewPose({
        hasLaunched: true,
        grounded: false,
        grappled: true,
        hookActive: true,
        velocity: [-12, 0.4, 0],
        facing: -1,
        player: [4, 4, 0],
        hookEnd: [0.9, 6.2, 0],
        dt: 1 / 60,
        now: 5.9
      })
    `);
    const forwardMidSwingSummary = summarizeHookPreview(forwardMidSwing, "mid-swing-forward");
    const backwardMidSwingSummary = summarizeHookPreview(backwardMidSwing, "mid-swing-backward");
    const forwardMidSwingArm = checkByName(forwardMidSwing, "left-arm-rope-alignment");
    const backwardMidSwingArm = checkByName(backwardMidSwing, "left-arm-rope-alignment");
    const forwardMidSwingOrigin = checkByName(forwardMidSwing, "rope-origin-left-wrist");
    const backwardMidSwingOrigin = checkByName(backwardMidSwing, "rope-origin-left-wrist");
    addResult(results, "mid-swing-pose-health", forwardMidSwing.ok && backwardMidSwing.ok, {
      forward: forwardMidSwingSummary,
      backward: backwardMidSwingSummary,
      forwardHealth: summarizeHealth(forwardMidSwing),
      backwardHealth: summarizeHealth(backwardMidSwing),
    });
    addResult(results, "mid-swing-animation-selected", forwardMidSwing.snapshot?.animation === "midSwing" && backwardMidSwing.snapshot?.animation === "midSwing", {
      forward: forwardMidSwingSummary,
      backward: backwardMidSwingSummary,
    });
    addResult(results, "mid-swing-left-arm-follows-rope", (
      forwardMidSwingArm?.ok &&
      backwardMidSwingArm?.ok &&
      Math.abs(forwardMidSwing.snapshot?.leftArm?.ropeAlignmentErrorDeg ?? Infinity) <= 6 &&
      Math.abs(backwardMidSwing.snapshot?.leftArm?.ropeAlignmentErrorDeg ?? Infinity) <= 6
    ), {
      forward: forwardMidSwingSummary,
      backward: backwardMidSwingSummary,
      forwardLeftArm: forwardMidSwing.snapshot?.leftArm ?? null,
      backwardLeftArm: backwardMidSwing.snapshot?.leftArm ?? null,
    });
    addResult(results, "mid-swing-rope-origin-left-wrist", (
      forwardMidSwingOrigin?.ok &&
      backwardMidSwingOrigin?.ok &&
      (forwardMidSwing.snapshot?.rope?.originScreenDistances?.leftWrist ?? Infinity) <= 0.08 &&
      (backwardMidSwing.snapshot?.rope?.originScreenDistances?.leftWrist ?? Infinity) <= 0.08
    ), {
      forward: forwardMidSwingSummary,
      backward: backwardMidSwingSummary,
      forwardRope: forwardMidSwing.snapshot?.rope ?? null,
      backwardRope: backwardMidSwing.snapshot?.rope ?? null,
    });
    addResult(results, "mid-swing-side-depth-follows-facing", (
      forwardMidSwing.snapshot?.sideDepth?.foregroundSide === "right" &&
      backwardMidSwing.snapshot?.sideDepth?.foregroundSide === "left"
    ), {
      forward: forwardMidSwingSummary,
      backward: backwardMidSwingSummary,
      forwardSideDepth: forwardMidSwing.snapshot?.sideDepth ?? null,
      backwardSideDepth: backwardMidSwing.snapshot?.sideDepth ?? null,
    });
    addResult(results, "mid-swing-knees-do-not-bend-forward", hasBackwardKnees(forwardMidSwing) && hasBackwardKnees(backwardMidSwing), {
      forward: forwardMidSwingSummary,
      backward: backwardMidSwingSummary,
      forwardLegs: forwardMidSwing.snapshot?.legs ?? null,
      backwardLegs: backwardMidSwing.snapshot?.legs ?? null,
    });
    const midSwingRigidity = segmentRigidityReport(idle, [
      { label: "mid-swing-forward", health: forwardMidSwing },
      { label: "mid-swing-backward", health: backwardMidSwing },
    ]);
    addResult(results, "mid-swing-limb-segments-remain-rigid", midSwingRigidity.ok, midSwingRigidity);

    const throwHook = await evaluate(cdp, `
      window.HookedDebug.previewPose({
        hasLaunched: true,
        grounded: false,
        grappled: false,
        hookActive: true,
        velocity: [10, -4, 0],
        facing: 1,
        player: [4, 4, 0],
        hookEnd: [7.2, 5.6, 0],
        dt: 1 / 60,
        now: 6.25
      })
    `);
    const throwHookSummary = summarizeHookPreview(throwHook, "throw-hook");
    const throwHookArm = checkByName(throwHook, "left-arm-rope-alignment");
    const throwHookOrigin = checkByName(throwHook, "rope-origin-left-wrist");
    addResult(results, "throw-hook-pose-health", throwHook.ok, {
      health: summarizeHealth(throwHook),
      hook: throwHookSummary,
    });
    addResult(results, "throw-hook-animation-selected", throwHook.snapshot?.animation === "throwHook", {
      hook: throwHookSummary,
    });
    addResult(results, "throw-hook-left-arm-follows-rope", throwHookArm?.ok && Math.abs(throwHook.snapshot?.leftArm?.ropeAlignmentErrorDeg ?? Infinity) <= 6, {
      hook: throwHookSummary,
      leftArm: throwHook.snapshot?.leftArm ?? null,
    });
    addResult(results, "throw-hook-rope-origin-left-wrist", throwHookOrigin?.ok && (throwHook.snapshot?.rope?.originScreenDistances?.leftWrist ?? Infinity) <= 0.08, {
      hook: throwHookSummary,
      rope: throwHook.snapshot?.rope ?? null,
    });
    addResult(results, "throw-hook-right-side-foreground", throwHook.snapshot?.sideDepth?.foregroundSide === "right", {
      hook: throwHookSummary,
      sideDepth: throwHook.snapshot?.sideDepth ?? null,
    });
    const throwHookRigidity = segmentRigidityReport(idle, [{ label: "throw-hook", health: throwHook }]);
    addResult(results, "throw-hook-limb-segments-remain-rigid", throwHookRigidity.ok, throwHookRigidity);

    const releaseForward = await evaluate(cdp, `
      window.HookedDebug.previewPose({
        hasLaunched: true,
        grounded: false,
        grappled: false,
        hookActive: false,
        velocity: [8, 0.4, 0],
        facing: 1,
        player: [4, 4, 0],
        dt: 1 / 60,
        now: 7.0
      })
    `);
    const releaseBackward = await evaluate(cdp, `
      window.HookedDebug.previewPose({
        hasLaunched: true,
        grounded: false,
        grappled: false,
        hookActive: false,
        velocity: [-8, 0.4, 0],
        facing: -1,
        player: [4, 4, 0],
        dt: 1 / 60,
        now: 7.0
      })
    `);
    const releaseForwardSummary = summarizeFreePose(releaseForward, "release-forward");
    const releaseBackwardSummary = summarizeFreePose(releaseBackward, "release-backward");
    const releaseSamples = [
      { label: "release-forward", health: releaseForward },
      { label: "release-backward", health: releaseBackward },
    ];
    addResult(results, "release-pose-health", releaseForward.ok && releaseBackward.ok, {
      forward: releaseForwardSummary,
      backward: releaseBackwardSummary,
      forwardHealth: summarizeHealth(releaseForward),
      backwardHealth: summarizeHealth(releaseBackward),
    });
    addResult(results, "release-animation-selected", releaseForward.snapshot?.animation === "release" && releaseBackward.snapshot?.animation === "release", {
      forward: releaseForwardSummary,
      backward: releaseBackwardSummary,
    });
    addResult(results, "release-knees-do-not-bend-forward", hasBackwardKnees(releaseForward) && hasBackwardKnees(releaseBackward), {
      forward: releaseForwardSummary,
      backward: releaseBackwardSummary,
      forwardLegs: releaseForward.snapshot?.legs ?? null,
      backwardLegs: releaseBackward.snapshot?.legs ?? null,
    });
    addResult(results, "release-side-depth-follows-facing", (
      releaseForward.snapshot?.sideDepth?.foregroundSide === "right" &&
      releaseBackward.snapshot?.sideDepth?.foregroundSide === "left"
    ), {
      forward: releaseForwardSummary,
      backward: releaseBackwardSummary,
      forwardSideDepth: releaseForward.snapshot?.sideDepth ?? null,
      backwardSideDepth: releaseBackward.snapshot?.sideDepth ?? null,
    });
    const releaseRigidity = segmentRigidityReport(idle, releaseSamples);
    addResult(results, "release-limb-segments-remain-rigid", releaseRigidity.ok, releaseRigidity);

    await click(cdp, 520, 380);
    await keyDown(cdp, "Space", " ", 32);
    await sleep(950);
    const swing = await evaluate(cdp, "window.HookedDebug.poseHealth()");
    await sleep(450);
    const swingLater = await evaluate(cdp, "window.HookedDebug.poseHealth()");
    await sleep(450);
    const swingFinal = await evaluate(cdp, "window.HookedDebug.poseHealth()");
    await keyUp(cdp, "Space", " ", 32);
    const swingSamples = [
      { label: "early", health: swing },
      { label: "mid", health: swingLater },
      { label: "late", health: swingFinal },
    ];
    const swingSequence = summarizeSwingSequence(swingSamples);
    const swingArm = checkByName(swing, "left-arm-rope-alignment");
    const ropeOrigin = checkByName(swing, "rope-origin-left-wrist");
    addResult(results, "hooked-swing-pose-health", swing.ok, { health: summarizeHealth(swing) });
    addResult(results, "hooked-swing-sequence-health", swingSequence.allHealthy, { swingSequence });
    addResult(results, "hooked-left-arm-follows-rope", swingArm?.ok && (swing.snapshot?.leftArm?.ropeAlignmentErrorDeg ?? Infinity) <= 6, {
      errorDeg: swing.snapshot?.leftArm?.ropeAlignmentErrorDeg ?? null,
      leftArm: swing.snapshot?.leftArm ?? null,
    });
    addResult(results, "hooked-left-arm-follows-rope-through-swing", (swingSequence.maxRopeErrorDeg ?? Infinity) <= 6, {
      maxRopeErrorDeg: swingSequence.maxRopeErrorDeg,
      samples: swingSequence.summaries,
    });
    addResult(results, "hooked-rope-origin-left-wrist", ropeOrigin?.ok && (swing.snapshot?.rope?.originScreenDistances?.leftWrist ?? Infinity) <= 0.08, {
      rope: swing.snapshot?.rope ?? null,
    });
    addResult(results, "hooked-rope-origin-left-wrist-through-swing", (swingSequence.maxRopeOriginScreenDistance ?? Infinity) <= 0.08, {
      maxRopeOriginScreenDistance: swingSequence.maxRopeOriginScreenDistance,
      samples: swingSequence.summaries,
    });
    addResult(results, "hooked-facing-stays-locked", swingSequence.allGrappled && swingSequence.facingCount === 1, {
      firstFacing: swing.snapshot?.facing ?? null,
      laterFacing: swingFinal.snapshot?.facing ?? null,
      allGrappled: swingSequence.allGrappled,
      facingCount: swingSequence.facingCount,
      samples: swingSequence.summaries,
    });
    addResult(results, "forward-hook-right-side-foreground", swing.snapshot?.sideDepth?.foregroundSide === "right", {
      sideDepth: swing.snapshot?.sideDepth ?? null,
      health: summarizeHealth(swing),
    });
    addResult(results, "hooked-knees-do-not-bend-forward", hasBackwardKnees(swing), {
      legs: swing.snapshot?.legs ?? null,
    });
    addResult(results, "hooked-knees-stay-safe-through-swing", swingSequence.allKneesSafe, {
      samples: swingSequence.summaries,
    });
    addResult(results, "hooked-legs-react-to-swing", (swingSequence.maxAbsLegSeparationDeg ?? 0) >= 8, {
      maxAbsLegSeparationDeg: swingSequence.maxAbsLegSeparationDeg,
      samples: swingSequence.summaries,
    });
    const swingRigidity = segmentRigidityReport(idle, swingSamples);
    addResult(results, "hooked-limb-segments-remain-rigid", swingRigidity.ok, swingRigidity);

    await press(cdp, "KeyV", "v", 86);
    await sleep(275);
    const flourish = await evaluate(cdp, "window.HookedDebug.poseHealth()");
    const tuckCheck = checkByName(flourish, "flourish-tuck-compactness");
    addResult(results, "flourish-tuck-active", flourish.snapshot?.flourish?.active && flourish.snapshot.flourish.tuck > 0.75, {
      flourish: flourish.snapshot?.flourish ?? null,
    });
    addResult(results, "flourish-tuck-compact", tuckCheck?.ok && (flourish.snapshot?.flourish?.compactRadius ?? Infinity) <= 1.35, {
      compactRadius: flourish.snapshot?.flourish?.compactRadius ?? null,
      health: summarizeHealth(flourish),
    });
    const flourishRigidity = segmentRigidityReport(idle, [{ label: "flourish", health: flourish }]);
    addResult(results, "flourish-limb-segments-remain-rigid", flourishRigidity.ok, flourishRigidity);

    const performance = await evaluate(cdp, "window.HookedDebug.performance()");
    const ok = results.every((result) => result.ok);
    console.log(JSON.stringify({
      ok,
      url: targetUrl,
      browser: path.basename(browserPath),
      results,
      performance,
    }, null, 2));
    process.exitCode = ok ? 0 : 1;
  } finally {
    cdp?.close();
    await stopBrowser(browser);
    await removeDirectoryRetry(userDataDir);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error.message,
    stack: error.stack,
    hint: `Start the local game server first, then rerun: node tools/verify_character_runtime.js ${defaultUrl}`,
  }, null, 2));
  process.exit(1);
});
