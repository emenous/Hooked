import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "https://unpkg.com/three@0.165.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.165.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://unpkg.com/three@0.165.0/examples/jsm/postprocessing/ShaderPass.js";

const GAME_VERSION = "v0.5.66";

const gameShell = document.querySelector("#game-shell");
const canvas = document.querySelector("#game");
const scoreEl = document.querySelector("#score");
const speedEl = document.querySelector("#speed");
const ropeEl = document.querySelector("#rope");
const flourishEl = document.querySelector("#flourish");
const failCountEl = document.querySelector("#fail-count");
const slowMoTimerEl = document.querySelector("#slomo-timer");
const slowMoTimeEl = document.querySelector("#slomo-time");
const centerSlowMoTimerEl = document.querySelector("#center-slomo-timer");
const centerSlowMoTimeEl = document.querySelector("#center-slomo-time");
const multiplierPillEl = document.querySelector("#multiplier-pill");
const multiplierCountEl = document.querySelector("#multiplier-count");
const restartButton = document.querySelector("#restart");
const muteButton = document.querySelector("#mute-button");
const flourishButton = document.querySelector("#flourish-button");
const resetAnchorsButton = document.querySelector("#reset-anchors");
const togglePauseButton = document.querySelector("#toggle-pause");
const editorPanel = document.querySelector("#editor");
const editorPane = document.querySelector("#editor-pane");
const buildTools = document.querySelector("#build-tools");
const levelSelect = document.querySelector("#level-select");
const objectTypeSelect = document.querySelector("#object-type");
const addObjectButton = document.querySelector("#add-object");
const removeObjectButton = document.querySelector("#remove-object");
const zoomOutButton = document.querySelector("#zoom-out");
const zoomInButton = document.querySelector("#zoom-in");
const zoomFitButton = document.querySelector("#zoom-fit");
const animateCharacterButton = document.querySelector("#animate-character");
const savePoseButton = document.querySelector("#save-pose");
const resetPoseButton = document.querySelector("#reset-pose");
const exportPoseButton = document.querySelector("#export-poses");
const buildZoomInput = document.querySelector("#build-zoom");
const pixelateToggleButton = document.querySelector("#pixelate-toggle");
const pixelateIntensityInput = document.querySelector("#pixelate-intensity");
const pixelateIntensityValue = document.querySelector("#pixelate-intensity-value");
const pixelatePlaneInputs = {
  foreground: document.querySelector("#pixelate-foreground"),
  gameplay: document.querySelector("#pixelate-gameplay"),
  midground: document.querySelector("#pixelate-midground"),
  background: document.querySelector("#pixelate-background"),
};
const pixelatePlaneValues = {
  foreground: document.querySelector("#pixelate-foreground-value"),
  gameplay: document.querySelector("#pixelate-gameplay-value"),
  midground: document.querySelector("#pixelate-midground-value"),
  background: document.querySelector("#pixelate-background-value"),
};
const fxQualitySelect = document.querySelector("#fx-quality");
const sfxMuteButton = document.querySelector("#sfx-mute");
const sfxVolumeInput = document.querySelector("#sfx-volume");
const sfxVolumeValue = document.querySelector("#sfx-volume-value");
const musicMuteButton = document.querySelector("#music-mute");
const musicVolumeInput = document.querySelector("#music-volume");
const musicVolumeValue = document.querySelector("#music-volume-value");
const levelCompletePanel = document.querySelector("#level-complete");
const completeDeathsEl = document.querySelector("#complete-deaths");
const completeMultiplierEl = document.querySelector("#complete-multiplier");
const completeFlipsEl = document.querySelector("#complete-flips");
const completeScoreEl = document.querySelector("#complete-score");
const completeRankEl = document.querySelector("#complete-rank");
const nextLevelButton = document.querySelector("#next-level");
const gameVersionEl = document.querySelector("#game-version");
const performanceMonitorEl = document.querySelector("#performance-monitor");
const jeremyFireworksEl = document.querySelector("#jeremy-fireworks");
const anchorStorageKey = "hooked.anchor.layout.v5";
const editorLayoutStorageKey = "hooked.editor.layout.v1";
const editorLayoutStoragePrefix = "hooked.editor.layout.v2.";

const config = {
  gravity: -33,
  bottomDeathY: -15,
  ceilingY: 13,
  minForwardSpeed: 0,
  maxForwardSpeed: 24,
  physicsStep: 1 / 120,
  maxPhysicsFrame: 0.08,
  minRopeLength: 2.0,
  maxRopeLength: 12.4,
  ropeExtendSpeed: 5.2,
  hookShotSpeed: 38,
  hookHitRadius: 1.05,
  ropePullStiffness: 92,
  ropeDamping: 0.9985,
  releasePopLift: 4.6,
  releasePopForward: 1.1,
  releasePopTangent: 2.2,
  releasePopUpwardBonus: 2.8,
  grappleRange: 13.5,
  downwardTargetMinDelta: 0.18,
  downwardTargetScreenMargin: 0.75,
  fallbackAimUpwardBias: 0.24,
  forwardGrappleSpeed: 6.5,
  forwardAnchorBonus: 3.2,
  behindAnchorPenalty: 8.5,
  behindAnchorRejectDistance: 1.4,
  regrabSameAnchorVerticalSpeed: 5.5,
  regrabSameAnchorHorizontalSpeed: 5.8,
  aimLength: 8.5,
  flourishMinHeight: 2.5,
  flourishMinSpeed: 0.6,
  flourishBoost: 5,
  flourishLift: 2.2,
  flourishCooldown: 0.42,
  flourishBufferWindow: 0.18,
  flourishSpinDuration: 0.55,
  slowMotionForwardScale: 0.25,
  slowMotionTrickScale: 0.25,
  slowMotionDuration: 3,
  slowMotionRingRadius: 1.05,
  slowMotionCollectionRadius: 1.35,
  tapFlourishMaxDuration: 0.2,
  holdGrappleDelay: 0.12,
  platformStandOffset: 0.8,
  platformJumpForward: 4.2,
  platformJumpLift: 7.6,
  cameraLead: 3,
  cameraVerticalLead: 0.5,
  cameraMinZoom: 10,
  cameraBaseZoom: 18,
  cameraSpeedZoom: 0.58,
  cameraMaxZoom: 40,
  cameraWheelZoomSpeed: 0.035,
  cameraManualZoomMin: -8,
  cameraManualZoomMax: 18,
  restartDelay: 0.55,
  buildPanSpeed: 0.018,
  buildZoomSpeed: 0.028,
  buildMinZoom: 6,
  buildMaxZoom: 1200,
  buildMinY: -40,
  buildMaxY: 50,
  buildZoomStep: 8,
  buildViewPadding: 8,
  speedLineMinSpeed: 6,
  speedLineMaxSpeed: 36,
  speedLineIdleIntensity: 0.12,
  trailPointSpacing: 0.25,
  trailSegments: 52,
  trailBaseOpacity: 0.58,
  ropePulseChance: 0.55,
  ropeSparkPoolSize: 42,
  ropeSparkBurstCount: 5,
  ropeSparkGravityScale: 0.34,
  ropeSparkLifeMin: 0.28,
  ropeSparkLifeMax: 0.62,
  ropeSparkSize: 0.08,
  ropeCrackleChance: 1.25,
  ropeCrackleDuration: 0.12,
  ropeCracklePoints: 18,
  ropeCrackleJitter: 0.26,
  ropeEnergyWrapPoints: 46,
  ropeEnergyWrapAmplitude: 0.24,
  ropeEnergyWrapFrequency: 7.2,
  ropeEnergyWrapSpeed: 8.05,
  ropeShaderTimeScale: 0.7,
  ropeCrackleFrameMs: 60,
  ropeEnergyWrapCoreWidth: 0.032,
  ropeEnergyWrapGlowWidth: 0.1,
  ropeVisualCurvePoints: 18,
  ropeVisualCurveSlack: 0.18,
  ropeVisualCurveWave: 0.095,
  failedGrappleFallSpeedThreshold: -0.8,
  failedGrappleChainSegments: 22,
  failedGrappleChainSegmentLength: 0.46,
  failedGrappleChainThrowSpeed: 12,
  failedGrappleChainDamping: 0.82,
  failedGrappleChainGravityScale: 1.2,
  failedGrappleConstraintPasses: 5,
  fxQuality: "medium",
  anchorPlasmaSparkChance: 26,
  anchorPlasmaArcPoints: 18,
  anchorPlasmaArcCount: 4,
  anchorPlasmaArcRadius: 0.72,
  anchorPlasmaArcJitter: 0.16,
  performanceSampleCount: 180,
  performanceUiUpdateInterval: 0.25,
  performanceStutterFrameMs: 22.2,
  performanceHardStutterFrameMs: 33.4,
  droneMalfunctionChance: 0.2,
  anchorMalfunctionBehindMargin: 0.35,
  droneMalfunctionSparkChance: 18,
  ribbonSpring: 34,
  ribbonDamping: 0.82,
  ribbonWind: 0.08,
  droneTensionStrength: 0.18,
  droneHoverAmount: 0.14,
  stuntLoopAngle: Math.PI * 1.72,
  stuntBurstTargetAngle: -Math.PI * 0.78,
  stuntBurstAngleWindow: Math.PI * 0.18,
  stuntTopOverMinSpeed: 5.5,
  stuntBoostSpeed: 2.6,
  stuntBoostForward: 0.65,
  stuntBoostDownwardSpeed: -2.2,
  scoreSpeedScale: 2.8,
  multiplierWindow: 4,
  multiplierBase: 1,
  multiplierStep: 0.25,
  multiplierMax: 4,
  crashExplosionPieces: 12,
  crashExplosionDuration: 0.92,
  foregroundBlurScale: 1,
  debugShowDroneAnchors: false,
  debugGlbNeutralOnly: false,
  useGlbCharacter: true,
  glbCharacterPath: "./assets/models/m_character_skeletal_textures_1k.glb",
  freezeGlbCharacterPose: false,
  glbPoseMode: "ragdollLite",
  stableGlbPose: true,
  stableGrappleSocketX: 0.14,
  stableGrappleSocketY: 0.5,
  stableGrappleSocketDrift: 0.08,
  useRestRelativeGlbPose: true,
  glbPoseSmoothing: 18,
  glbLoadedArmAimOffset: 0.3,
  characterRimColor: 0xffd21f,
  characterRimIntensity: 1.45,
  characterRimPower: 1.55,
  characterRimLightDirection: new THREE.Vector3(0.58, 0.78, 0.24).normalize(),
  pixelateEnabled: true,
  pixelateIntensity: 0.59,
  pixelateMaxBlockSize: 34,
  pixelateReferenceZoom: 18,
  pixelateZoomScalePower: 1.15,
  pixelateMinZoomScale: 0.22,
  pixelateMaxZoomScale: 1.35,
  pixelatePlaneDefaults: {
    foreground: 0.34,
    gameplay: 0.46,
    midground: 0.62,
    background: 0.72,
  },
};

const characterVisualScale = 1;
const ribbonLengthScale = 0.95;
const ribbonAnchorBackOffset = 0;
const ribbonAnchorLiftOffset = 0.02;

const pixelateSettingsStorageKey = "hooked.pixelate.settings.v2";
const pixelateSettings = {
  enabled: config.pixelateEnabled,
  intensity: config.pixelateIntensity,
  planes: { ...config.pixelatePlaneDefaults },
};
const pixelatePlaneKeys = ["foreground", "gameplay", "midground", "background"];
const fxQualityStorageKey = "hooked.fx.quality.v1";
const fxQualityProfiles = {
  high: {
    label: "High",
    ropeLayerLimit: 3,
    anchorArcLimit: 4,
    sparkRate: 1,
    sparkBurstScale: 1,
    speedLineLimit: 9,
    trailLineLimit: config.trailSegments,
    anchorSparkRate: 1,
    ropeOpacity: 1,
  },
  medium: {
    label: "Medium",
    ropeLayerLimit: 2,
    anchorArcLimit: 2,
    sparkRate: 0.62,
    sparkBurstScale: 0.72,
    speedLineLimit: 6,
    trailLineLimit: 34,
    anchorSparkRate: 0.55,
    ropeOpacity: 0.92,
  },
  low: {
    label: "Low",
    ropeLayerLimit: 1,
    anchorArcLimit: 1,
    sparkRate: 0.32,
    sparkBurstScale: 0.45,
    speedLineLimit: 3,
    trailLineLimit: 18,
    anchorSparkRate: 0.25,
    ropeOpacity: 0.82,
  },
};
const fxQualitySettings = {
  level: config.fxQuality,
};
const characterPoseStorageKey = "hooked.character.pose.references.v1";
const characterPoseProjectPath = "./data/character_pose_references.json";
const characterPoseLibraryVersion = 1;

const levelSelectionStorageKey = "hooked.current.level.v1";
let currentLevelId = localStorage.getItem(levelSelectionStorageKey) || "skyline";

const editorUi = {
  paused: false,
  level: currentLevelId,
  objectType: objectTypeSelect?.value ?? "anchor",
  zoom: config.cameraBaseZoom,
  pixelate: pixelateSettings.enabled,
  pixelateIntensity: pixelateSettings.intensity,
  pixelateForeground: pixelateSettings.planes.foreground,
  pixelateGameplay: pixelateSettings.planes.gameplay,
  pixelateMidground: pixelateSettings.planes.midground,
  pixelateBackground: pixelateSettings.planes.background,
  fxQuality: fxQualitySettings.level,
  sfxMuted: false,
  sfxVolume: 0.7,
  musicMuted: false,
  musicVolume: 0.38,
};

let tweakPane = null;
let syncingEditorPane = false;
const tweakPaneBindings = [];

const state = {
  keys: new Set(),
  player: new THREE.Vector3(-2.35, 7.15, 0),
  previousPlayer: new THREE.Vector3(-2.35, 7.15, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  launchVelocity: new THREE.Vector3(3.1, 0.05, 0),
  hasLaunched: false,
  grounded: false,
  grappled: false,
  hookActive: false,
  failedGrappleActive: false,
  failedGrappleAge: 0,
  hookEnd: new THREE.Vector3(),
  previousHookEnd: new THREE.Vector3(),
  aimEnd: new THREE.Vector3(),
  aimDirection: new THREE.Vector3(1, 0.35, 0),
  ropeLength: config.minRopeLength,
  anchor: null,
  lastReleasedAnchor: null,
  lastFlourishAt: -100,
  queuedFlourishUntil: -100,
  flourishPulse: 0,
  flourishVariant: "backFlip",
  ropePulse: 0,
  ropeCrackle: 0,
  slowMotionRemaining: 0,
  pendingSlowMotion: false,
  score: 0,
  scoreFloat: 0,
  multiplier: 1,
  multiplierExpiresAt: -100,
  multiplierActions: new Set(),
  deaths: 0,
  highestMultiplier: 1,
  completedFlips: 0,
  nextScoreX: 16,
  gameOver: false,
  finished: false,
  levelCompleteShown: false,
  restartAt: 0,
  spaceDownAt: -100,
  spaceIsDown: false,
  spaceHadAnchor: false,
  flourishSpinRemaining: 0,
  flourishFlipDirection: 1,
  flourishCompletionArmed: false,
  hookWrapPulse: 0,
  stuntAnchor: null,
  stuntLastAngle: 0,
  stuntRotation: 0,
  stuntTopOverArmed: false,
  stuntBoostArmed: false,
  stuntBurstClockArmed: false,
  stuntBurstPulse: 0,
  crashExploding: false,
  crashExplosionStartedAt: -100,
  playerAnimation: "idleHang",
  facing: 1,
  draggedObject: null,
  draggedPoseHandle: null,
  selectedObject: null,
  panningCamera: false,
  animatorMode: false,
  manualPoseAngles: {},
  inspectFrozen: false,
  inspectFrozenAt: 0,
  cameraZoomOffset: 0,
  manualCameraZoom: false,
  manualCameraZoomZ: config.cameraBaseZoom,
  pointerWorld: new THREE.Vector3(),
  panStartWorld: new THREE.Vector3(),
  panStartCamera: new THREE.Vector3(),
  paused: false,
};

const scratchVelocityDirection = new THREE.Vector3();
const scratchPerpDirection = new THREE.Vector3();
const scratchRopeStart = new THREE.Vector3();
const scratchRopeEnd = new THREE.Vector3();

function cloneVectorState(vector) {
  return vector.clone();
}

function restoreVectorState(vector, saved) {
  vector.copy(saved);
}

function previewCharacterPose(overrides = {}) {
  const savedState = {
    player: cloneVectorState(state.player),
    previousPlayer: cloneVectorState(state.previousPlayer),
    velocity: cloneVectorState(state.velocity),
    hookEnd: cloneVectorState(state.hookEnd),
    previousHookEnd: cloneVectorState(state.previousHookEnd),
    hasLaunched: state.hasLaunched,
    grounded: state.grounded,
    grappled: state.grappled,
    hookActive: state.hookActive,
    anchor: state.anchor,
    playerAnimation: state.playerAnimation,
    facing: state.facing,
    flourishSpinRemaining: state.flourishSpinRemaining,
    flourishFlipDirection: state.flourishFlipDirection,
    gameOver: state.gameOver,
    finished: state.finished,
  };
  const savedMesh = {
    position: playerMesh.position.clone(),
    rotation: playerMesh.rotation.clone(),
    scale: playerMesh.scale.clone(),
    poseRotation: playerPoseRotationSmoothed,
  };
  const savedAsset = {
    rotation: playerAssetRoot.rotation.clone(),
    scale: playerAssetRoot.scale.clone(),
  };
  const savedAngles = captureCurrentGlbPoseAngles();

  try {
    if (Array.isArray(overrides.player)) state.player.fromArray(overrides.player);
    if (Array.isArray(overrides.velocity)) state.velocity.fromArray(overrides.velocity);
    if (Array.isArray(overrides.hookEnd)) state.hookEnd.fromArray(overrides.hookEnd);
    state.previousPlayer.copy(state.player);
    state.previousHookEnd.copy(state.hookEnd);
    state.hasLaunched = overrides.hasLaunched ?? state.hasLaunched;
    state.grounded = overrides.grounded ?? state.grounded;
    state.grappled = overrides.grappled ?? state.grappled;
    state.hookActive = overrides.hookActive ?? state.hookActive;
    state.anchor = overrides.anchor ?? null;
    state.facing = overrides.facing ?? state.facing;
    state.flourishSpinRemaining = overrides.flourishSpinRemaining ?? 0;
    state.flourishFlipDirection = overrides.flourishFlipDirection ?? state.flourishFlipDirection;
    state.gameOver = overrides.gameOver ?? false;
    state.finished = overrides.finished ?? false;
    if (overrides.animation) state.playerAnimation = overrides.animation;

    playerPoseRotationSmoothed = overrides.poseRotation ?? 0;
    playerMesh.position.copy(state.player);
    const now = Number.isFinite(overrides.now) ? overrides.now : performance.now() / 1000;
    const flourishProgress = state.flourishSpinRemaining > 0
      ? 1 - state.flourishSpinRemaining / config.flourishSpinDuration
      : 0;
    applyPlayerAnimation(now, flourishProgress, overrides.dt ?? config.physicsStep);
    return describeCharacterPoseHealth();
  } finally {
    restoreVectorState(state.player, savedState.player);
    restoreVectorState(state.previousPlayer, savedState.previousPlayer);
    restoreVectorState(state.velocity, savedState.velocity);
    restoreVectorState(state.hookEnd, savedState.hookEnd);
    restoreVectorState(state.previousHookEnd, savedState.previousHookEnd);
    state.hasLaunched = savedState.hasLaunched;
    state.grounded = savedState.grounded;
    state.grappled = savedState.grappled;
    state.hookActive = savedState.hookActive;
    state.anchor = savedState.anchor;
    state.playerAnimation = savedState.playerAnimation;
    state.facing = savedState.facing;
    state.flourishSpinRemaining = savedState.flourishSpinRemaining;
    state.flourishFlipDirection = savedState.flourishFlipDirection;
    state.gameOver = savedState.gameOver;
    state.finished = savedState.finished;
    playerMesh.position.copy(savedMesh.position);
    playerMesh.rotation.copy(savedMesh.rotation);
    playerMesh.scale.copy(savedMesh.scale);
    playerPoseRotationSmoothed = savedMesh.poseRotation;
    playerAssetRoot.rotation.copy(savedAsset.rotation);
    playerAssetRoot.scale.copy(savedAsset.scale);
    applyGlbPoseAngles(savedAngles, true);
    syncGlbCharacterTransform(state.facing, playerAssetRoot.rotation.z);
  }
}

const sfx = (() => {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const storageKey = "hooked.audio.settings.v1";
  const settings = {
    sfxVolume: 0.7,
    musicVolume: 0.38,
    sfxMuted: false,
    musicMuted: false,
    masterMuted: false,
  };
  if (!AudioContextCtor) {
    return {
      settings,
      unlock() {},
      play() {},
      loadSettings() {},
      setSfxVolume(value) { settings.sfxVolume = THREE.MathUtils.clamp(Number(value), 0, 1); },
      setMusicVolume(value) { settings.musicVolume = THREE.MathUtils.clamp(Number(value), 0, 1); },
      setSfxMuted(value) { settings.sfxMuted = Boolean(value); },
      setMusicMuted(value) { settings.musicMuted = Boolean(value); },
      setMasterMuted(value) { settings.masterMuted = Boolean(value); },
    };
  }

  let ctx = null;
  let sfxBus = null;
  let musicBus = null;
  let musicFilter = null;
  let lastPlayed = new Map();
  let noiseBuffer = null;
  let musicTimer = null;
  let nextMusicTime = 0;
  let musicStep = 0;
  const bpm = 92;
  const stepTime = 60 / bpm / 2;
  const bassPattern = [55, 55, 82.41, 55, 46.25, 46.25, 73.42, 82.41, 41.2, 41.2, 61.74, 41.2, 49, 49, 73.42, 82.41];
  const arpPattern = [220, 329.63, 440, 659.25, 246.94, 369.99, 493.88, 739.99];
  const padChords = [
    [110, 164.81, 220],
    [92.5, 146.83, 220],
    [82.41, 123.47, 196],
    [98, 146.83, 246.94],
  ];

  function getContext() {
    if (!ctx) {
      ctx = new AudioContextCtor();
      sfxBus = ctx.createGain();
      musicBus = ctx.createGain();
      musicFilter = ctx.createBiquadFilter();
      musicFilter.type = "lowpass";
      musicFilter.frequency.value = 2100;
      musicFilter.Q.value = 0.55;
      sfxBus.connect(ctx.destination);
      musicBus.connect(musicFilter).connect(ctx.destination);
      applyVolumes();
    }
    return ctx;
  }

  function applyVolumes() {
    if (!ctx || !sfxBus || !musicBus) return;
    const now = ctx.currentTime;
    const masterScale = settings.masterMuted ? 0 : 1;
    sfxBus.gain.setTargetAtTime(settings.sfxMuted ? 0 : settings.sfxVolume * 0.28 * masterScale, now, 0.02);
    musicBus.gain.setTargetAtTime(settings.musicMuted ? 0 : settings.musicVolume * 0.22 * masterScale, now, 0.08);
  }

  function saveSettings() {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }

  function loadSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (!stored || typeof stored !== "object") return;
      if (Number.isFinite(stored.sfxVolume)) settings.sfxVolume = THREE.MathUtils.clamp(stored.sfxVolume, 0, 1);
      if (Number.isFinite(stored.musicVolume)) settings.musicVolume = THREE.MathUtils.clamp(stored.musicVolume, 0, 1);
      if (typeof stored.sfxMuted === "boolean") settings.sfxMuted = stored.sfxMuted;
      if (typeof stored.musicMuted === "boolean") settings.musicMuted = stored.musicMuted;
      if (typeof stored.masterMuted === "boolean") settings.masterMuted = stored.masterMuted;
    } catch {
      localStorage.removeItem(storageKey);
    } finally {
      applyVolumes();
    }
  }

  function startMusic() {
    const audio = getContext();
    if (musicTimer) return;
    nextMusicTime = audio.currentTime + 0.08;
    musicTimer = window.setInterval(scheduleMusic, 120);
    scheduleMusic();
  }

  function unlock() {
    const audio = getContext();
    if (audio.state === "suspended") audio.resume();
    startMusic();
  }

  function getNoiseBuffer() {
    const audio = getContext();
    if (noiseBuffer) return noiseBuffer;

    const length = Math.max(1, Math.floor(audio.sampleRate * 0.55));
    noiseBuffer = audio.createBuffer(1, length, audio.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  function shapeGain(gain, now, points) {
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(points[0][1], now + points[0][0]);
    for (let index = 1; index < points.length; index += 1) {
      gain.linearRampToValueAtTime(points[index][1], now + points[index][0]);
    }
  }

  function tone({
    start,
    type = "sine",
    frequency = 440,
    endFrequency = frequency,
    detune = 0,
    duration = 0.12,
    gain = 0.45,
    attack = 0.006,
    release = 0.04,
    filter = null,
    destination = sfxBus,
  }) {
    const audio = getContext();
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    const now = start ?? audio.currentTime;
    oscillator.type = type;
    oscillator.detune.value = detune;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
    shapeGain(envelope.gain, now, [
      [0, 0.0001],
      [attack, gain],
      [Math.max(attack, duration - release), gain * 0.34],
      [duration, 0.0001],
    ]);
    if (filter) {
      const filterNode = audio.createBiquadFilter();
      filterNode.type = filter.type ?? "lowpass";
      filterNode.frequency.setValueAtTime(filter.frequency ?? 1200, now);
      filterNode.Q.value = filter.q ?? 0.8;
      oscillator.connect(filterNode).connect(envelope).connect(destination);
    } else {
      oscillator.connect(envelope).connect(destination);
    }
    oscillator.start(now);
    oscillator.stop(now + duration + 0.04);
  }

  function noise({ start, duration = 0.12, gain = 0.32, filter = 1200, type = "bandpass", destination = sfxBus }) {
    const audio = getContext();
    const now = start ?? audio.currentTime;
    const source = audio.createBufferSource();
    const filterNode = audio.createBiquadFilter();
    const envelope = audio.createGain();
    source.buffer = getNoiseBuffer();
    filterNode.type = type;
    filterNode.frequency.setValueAtTime(filter, now);
    filterNode.frequency.exponentialRampToValueAtTime(Math.max(40, filter * 0.42), now + duration);
    filterNode.Q.value = 1.3;
    shapeGain(envelope.gain, now, [
      [0, 0.0001],
      [0.01, gain],
      [duration, 0.0001],
    ]);
    source.connect(filterNode).connect(envelope).connect(destination);
    source.start(now);
    source.stop(now + duration + 0.04);
  }

  function canPlay(name, cooldown = 0.035) {
    const audio = getContext();
    const previous = lastPlayed.get(name) ?? -Infinity;
    if (audio.currentTime - previous < cooldown) return false;
    lastPlayed.set(name, audio.currentTime);
    return true;
  }

  function synthKick(start) {
    tone({ start, type: "sine", frequency: 72, endFrequency: 38, duration: 0.18, gain: 0.42, attack: 0.002, release: 0.12, destination: musicBus });
  }

  function synthHat(start, open = false) {
    noise({ start, duration: open ? 0.18 : 0.055, gain: open ? 0.045 : 0.035, filter: 6200, type: "highpass", destination: musicBus });
  }

  function synthBass(start, frequency) {
    tone({ start, type: "sawtooth", frequency, endFrequency: frequency * 0.995, duration: stepTime * 0.72, gain: 0.16, attack: 0.006, release: 0.12, filter: { frequency: 480, q: 1.1 }, destination: musicBus });
    tone({ start, type: "square", frequency: frequency / 2, endFrequency: frequency / 2, duration: stepTime * 0.7, gain: 0.055, attack: 0.006, release: 0.14, filter: { frequency: 360, q: 0.8 }, destination: musicBus });
  }

  function synthArp(start, frequency) {
    tone({ start, type: "triangle", frequency, endFrequency: frequency * 1.004, duration: stepTime * 0.42, gain: 0.055, attack: 0.012, release: 0.08, filter: { frequency: 1850, q: 0.9 }, destination: musicBus });
    tone({ start, type: "sawtooth", frequency: frequency * 2.005, endFrequency: frequency * 2.005, duration: stepTime * 0.36, gain: 0.018, attack: 0.01, release: 0.06, filter: { frequency: 2600, q: 0.6 }, destination: musicBus });
  }

  function synthPad(start, chord) {
    for (const [index, frequency] of chord.entries()) {
      tone({ start, type: "sawtooth", frequency, endFrequency: frequency * 1.002, detune: index % 2 ? -8 : 7, duration: stepTime * 7.5, gain: 0.035, attack: 0.32, release: 0.9, filter: { frequency: 1180, q: 0.45 }, destination: musicBus });
    }
  }

  function scheduleMusic() {
    const audio = getContext();
    while (nextMusicTime < audio.currentTime + 0.75) {
      const step = musicStep % 16;
      if (step % 4 === 0) synthKick(nextMusicTime);
      if (step % 2 === 1) synthHat(nextMusicTime, step % 8 === 7);
      synthBass(nextMusicTime, bassPattern[step]);
      if (step % 2 === 0 || step === 15) synthArp(nextMusicTime + stepTime * 0.52, arpPattern[(musicStep + Math.floor(musicStep / 8)) % arpPattern.length]);
      if (step === 0) synthPad(nextMusicTime, padChords[Math.floor(musicStep / 16) % padChords.length]);
      nextMusicTime += stepTime;
      musicStep += 1;
    }
  }

  const sounds = {
    jump() {
      if (!canPlay("jump", 0.09)) return;
      const now = getContext().currentTime;
      tone({ start: now, type: "sawtooth", frequency: 88, endFrequency: 132, duration: 0.16, gain: 0.13, filter: { frequency: 520, q: 0.7 } });
      noise({ start: now, duration: 0.11, gain: 0.045, filter: 760, type: "bandpass" });
    },
    hookShot() {
      if (!canPlay("hookShot", 0.08)) return;
      const now = getContext().currentTime;
      tone({ start: now, type: "sawtooth", frequency: 176, endFrequency: 82, duration: 0.16, gain: 0.15, filter: { frequency: 1250, q: 1.2 } });
      noise({ start: now, duration: 0.13, gain: 0.08, filter: 2400, type: "bandpass" });
    },
    hookCatch(speed = 0) {
      if (!canPlay("hookCatch", 0.08)) return;
      const now = getContext().currentTime;
      const punch = THREE.MathUtils.clamp(speed / 18, 0, 1);
      tone({ start: now, type: "sawtooth", frequency: 110, endFrequency: 54, duration: 0.13, gain: 0.18 + punch * 0.13, filter: { frequency: 640, q: 1.4 } });
      tone({ start: now + 0.035, type: "triangle", frequency: 220, endFrequency: 165, duration: 0.2, gain: 0.06 + punch * 0.04, filter: { frequency: 900, q: 0.8 } });
      noise({ start: now, duration: 0.1, gain: 0.1 + punch * 0.06, filter: 1450, type: "bandpass" });
    },
    release() {
      if (!canPlay("release", 0.08)) return;
      const now = getContext().currentTime;
      tone({ start: now, type: "triangle", frequency: 196, endFrequency: 330, duration: 0.16, gain: 0.09, filter: { frequency: 1000, q: 0.7 } });
      noise({ start: now, duration: 0.08, gain: 0.035, filter: 1900, type: "highpass" });
    },
    flourish() {
      if (!canPlay("flourish", 0.14)) return;
      const now = getContext().currentTime;
      tone({ start: now, type: "sawtooth", frequency: 220, endFrequency: 440, duration: 0.18, gain: 0.075, filter: { frequency: 1250, q: 0.8 } });
      tone({ start: now + 0.11, type: "triangle", frequency: 329.63, endFrequency: 659.25, duration: 0.18, gain: 0.055, filter: { frequency: 1450, q: 0.7 } });
    },
    ring() {
      if (!canPlay("ring", 0.06)) return;
      const now = getContext().currentTime;
      tone({ start: now, type: "triangle", frequency: 659.25, endFrequency: 493.88, duration: 0.16, gain: 0.08, filter: { frequency: 1800, q: 0.75 } });
      tone({ start: now + 0.055, type: "sine", frequency: 987.77, endFrequency: 739.99, duration: 0.16, gain: 0.045 });
    },
    slowMo() {
      if (!canPlay("slowMo", 0.12)) return;
      const now = getContext().currentTime;
      tone({ start: now, type: "sawtooth", frequency: 440, endFrequency: 110, duration: 0.42, gain: 0.1, filter: { frequency: 780, q: 1.2 } });
      noise({ start: now, duration: 0.32, gain: 0.06, filter: 620, type: "lowpass" });
    },
    crash() {
      if (!canPlay("crash", 0.3)) return;
      const now = getContext().currentTime;
      tone({ start: now, type: "sawtooth", frequency: 96, endFrequency: 32, duration: 0.34, gain: 0.23, filter: { frequency: 520, q: 1.4 } });
      noise({ start: now, duration: 0.3, gain: 0.2, filter: 420, type: "lowpass" });
      noise({ start: now + 0.03, duration: 0.16, gain: 0.1, filter: 2100, type: "bandpass" });
    },
    malfunction() {
      if (!canPlay("malfunction", 0.2)) return;
      const now = getContext().currentTime;
      for (let index = 0; index < 4; index += 1) {
        tone({
          start: now + index * 0.038,
          type: "square",
          frequency: 92 + index * 37,
          endFrequency: 41,
          duration: 0.075,
          gain: 0.085,
          filter: { frequency: 1150 + index * 120, q: 1.1 },
        });
      }
      noise({ start: now, duration: 0.2, gain: 0.075, filter: 2800, type: "bandpass" });
    },
    finish() {
      if (!canPlay("finish", 0.8)) return;
      const now = getContext().currentTime;
      [220, 329.63, 440, 659.25].forEach((frequency, index) => {
        tone({
          start: now + index * 0.08,
          type: "sawtooth",
          frequency,
          endFrequency: frequency * 1.002,
          duration: 0.24,
          gain: 0.075,
          filter: { frequency: 1550, q: 0.65 },
        });
      });
    },
  };

  function play(name, ...args) {
    if (!sounds[name]) return;
    try {
      unlock();
      if (!settings.sfxMuted && settings.sfxVolume > 0) sounds[name](...args);
    } catch {
      // Audio should never interrupt gameplay.
    }
  }

  return {
    settings,
    unlock,
    play,
    loadSettings,
    setSfxVolume(value) {
      settings.sfxVolume = THREE.MathUtils.clamp(Number(value), 0, 1);
      saveSettings();
      applyVolumes();
    },
    setMusicVolume(value) {
      settings.musicVolume = THREE.MathUtils.clamp(Number(value), 0, 1);
      saveSettings();
      applyVolumes();
      if (!settings.musicMuted && settings.musicVolume > 0) startMusic();
    },
    setSfxMuted(value) {
      settings.sfxMuted = Boolean(value);
      saveSettings();
      applyVolumes();
    },
    setMusicMuted(value) {
      settings.musicMuted = Boolean(value);
      saveSettings();
      applyVolumes();
      if (!settings.musicMuted) startMusic();
    },
    setMasterMuted(value) {
      settings.masterMuted = Boolean(value);
      saveSettings();
      applyVolumes();
      if (!settings.masterMuted && !settings.musicMuted && settings.musicVolume > 0) startMusic();
    },
  };
})();

function suppressNativeTouch(event) {
  if (event.touches.length > 1 || gameShell.contains(event.target)) {
    event.preventDefault();
    window.getSelection()?.removeAllRanges();
  }
}

function bindGameButton(button, action) {
  let touchActivated = false;

  button.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;

    event.preventDefault();
    event.stopPropagation();
    touchActivated = true;
    action();
    window.setTimeout(() => {
      touchActivated = false;
    }, 500);
  });
  button.addEventListener("click", (event) => {
    if (touchActivated) {
      event.preventDefault();
      return;
    }

    action();
  });
}

const scene = new THREE.Scene();
const gameplayFog = new THREE.Fog(0x21172c, 46, 108);
scene.fog = gameplayFog;

const backgroundLayer = new THREE.Group();
const midgroundLayer = new THREE.Group();
const gameplayLayer = new THREE.Group();
const foregroundLayer = new THREE.Group();
backgroundLayer.name = "backgroundLayer";
midgroundLayer.name = "midgroundLayer";
gameplayLayer.name = "gameplayLayer";
foregroundLayer.name = "foregroundLayer";
backgroundLayer.renderOrder = 0;
midgroundLayer.renderOrder = 10;
gameplayLayer.renderOrder = 20;
foregroundLayer.renderOrder = 40;
scene.add(backgroundLayer, midgroundLayer, gameplayLayer, foregroundLayer);

function addToLayer(layer, object, layerName) {
  object.userData.layerName = layerName;
  layer.add(object);
  return object;
}

function addGameplay(object) {
  return addToLayer(gameplayLayer, object, "gameplayLayer");
}

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 820);
camera.position.set(0, 0, config.cameraBaseZoom);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
});
renderer.setPixelRatio(1);
renderer.setClearColor(0x21172c, 1);

const PixelateShader = {
  uniforms: {
    tDiffuse: { value: null },
    u_resolution: { value: new THREE.Vector2(1, 1) },
    intensity: { value: config.pixelateIntensity },
    pixelSize: { value: 1 },
    backgroundBoost: { value: 1.3 },
    edgeBlur: { value: 0.72 },
    foregroundDetail: { value: 0.22 },
    layerPixelMix: { value: new THREE.Vector4(
      config.pixelatePlaneDefaults.foreground,
      config.pixelatePlaneDefaults.gameplay,
      config.pixelatePlaneDefaults.midground,
      config.pixelatePlaneDefaults.background,
    ) },
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = uv;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}",
  ].join("\n"),
  fragmentShader: [
    "varying vec2 vUv;",
    "uniform sampler2D tDiffuse;",
    "uniform vec2 u_resolution;",
    "uniform float intensity;",
    "uniform float pixelSize;",
    "uniform float backgroundBoost;",
    "uniform float edgeBlur;",
    "uniform float foregroundDetail;",
    "uniform vec4 layerPixelMix;",
    "vec3 bg(vec2 uv) {",
    "  return texture2D(tDiffuse, clamp(uv, vec2(0.001), vec2(0.999))).rgb;",
    "}",
    "vec3 pixelSample(vec2 uv, float size) {",
    "  float granularity = floor(size);",
    "  vec2 sampleUv = uv;",
    "  if (granularity <= 1.0) {",
    "    granularity = 1.0;",
    "  }",
    "  if (mod(granularity, 2.0) > 0.0 && granularity > 1.0) granularity += 1.0;",
    "  float dx = granularity / u_resolution.x;",
    "  float dy = granularity / u_resolution.y;",
    "  sampleUv = vec2(dx * (floor(sampleUv.x / dx) + 0.5), dy * (floor(sampleUv.y / dy) + 0.5));",
    "  return bg(sampleUv);",
    "}",
    "vec3 blurSample(vec2 uv, float radius) {",
    "  vec2 px = radius / u_resolution;",
    "  vec3 col = bg(uv) * 0.22;",
    "  col += bg(uv + vec2(px.x, 0.0)) * 0.11;",
    "  col += bg(uv - vec2(px.x, 0.0)) * 0.11;",
    "  col += bg(uv + vec2(0.0, px.y)) * 0.11;",
    "  col += bg(uv - vec2(0.0, px.y)) * 0.11;",
    "  col += bg(uv + px) * 0.085;",
    "  col += bg(uv - px) * 0.085;",
    "  col += bg(uv + vec2(px.x, -px.y)) * 0.085;",
    "  col += bg(uv + vec2(-px.x, px.y)) * 0.085;",
    "  return col;",
    "}",
    "void main() {",
    "  vec3 tex = bg(vUv);",
    "  vec2 lensUv = vUv - vec2(0.5);",
    "  lensUv.x *= u_resolution.x / max(u_resolution.y, 1.0);",
    "  float lens = length(lensUv);",
    "  float edge = smoothstep(0.42, 0.86, lens);",
    "  float foregroundMask = 1.0 - smoothstep(0.08, 0.34, vUv.y);",
    "  float gameplayMask = smoothstep(0.16, 0.38, vUv.y) * (1.0 - smoothstep(0.58, 0.78, vUv.y));",
    "  float midgroundMask = smoothstep(0.42, 0.62, vUv.y) * (1.0 - smoothstep(0.72, 0.92, vUv.y));",
    "  float backgroundMask = smoothstep(0.62, 0.98, vUv.y);",
    "  float totalMask = max(foregroundMask + gameplayMask + midgroundMask + backgroundMask, 0.001);",
    "  vec4 masks = vec4(foregroundMask, gameplayMask, midgroundMask, backgroundMask);",
    "  vec4 planeAmounts = clamp(layerPixelMix, vec4(0.0), vec4(1.0));",
    "  float layerMix = dot(masks, planeAmounts) / totalMask;",
    "  float layerIntensity = clamp(intensity * layerMix, 0.0, 1.0);",
    "  float fgSize = pixelSize * mix(0.28, 1.1, planeAmounts.x);",
    "  float playSize = pixelSize * mix(0.28, 1.16, planeAmounts.y);",
    "  float midSize = pixelSize * mix(0.28, 1.24, planeAmounts.z);",
    "  float bgSize = pixelSize * mix(0.28, backgroundBoost, planeAmounts.w);",
    "  vec3 layerPix = (",
    "    pixelSample(vUv, fgSize) * foregroundMask +",
    "    pixelSample(vUv, playSize) * gameplayMask +",
    "    pixelSample(vUv, midSize) * midgroundMask +",
    "    pixelSample(vUv, bgSize) * backgroundMask",
    "  ) / totalMask;",
    "  vec3 detail = tex;",
    "  detail += (tex - pixelSample(vUv, max(1.0, pixelSize * 0.5))) * foregroundDetail * foregroundMask * (1.0 - layerMix);",
    "  vec3 col = mix(detail, layerPix, clamp(layerIntensity * (0.72 + layerMix * 0.38), 0.0, 1.0));",
    "  vec3 edgeBlurCol = blurSample(vUv, edgeBlur * (3.0 + pixelSize * 0.72));",
    "  col = mix(col, edgeBlurCol, edge * 0.28);",
    "  vec3 edgePix = pixelSample(vUv, pixelSize * (1.12 + edge * 0.58));",
    "  col = mix(col, edgePix, edge * intensity * 0.28);",
    "  col *= 1.0 - edge * 0.18;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}",
  ].join("\n"),
};

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const pixelatePass = new ShaderPass(PixelateShader);
composer.addPass(renderPass);
composer.addPass(pixelatePass);
pixelatePass.enabled = pixelateSettings.enabled;

const light = new THREE.DirectionalLight(0xffffff, 3.0);
light.position.set(8, 18, 18);
scene.add(light);
scene.add(new THREE.AmbientLight(0x9fcac0, 1.35));

const tunnel = new THREE.Group();
addGameplay(tunnel);

const pixelTextureSettings = (texture) => {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

function wrapCentered(value, width) {
  return ((value + width * 0.5) % width + width) % width - width * 0.5;
}

class ParallaxLayer {
  constructor({
    name,
    z,
    speedMultiplier,
    verticalMultiplier = 0,
    wrapWidth = 90,
    ambientSpeed = 0,
    enabled = true,
    parent = backgroundLayer,
    layerName = "backgroundLayer",
    renderOrder = 0,
  }) {
    this.name = name;
    this.z = z;
    this.speedMultiplier = speedMultiplier;
    this.verticalMultiplier = verticalMultiplier;
    this.wrapWidth = wrapWidth;
    this.ambientSpeed = ambientSpeed;
    this.enabled = enabled;
    this.layerName = layerName;
    this.renderOrder = renderOrder;
    this.group = new THREE.Group();
    this.group.name = name;
    this.group.position.z = z;
    this.group.renderOrder = renderOrder;
    this.items = [];
    addToLayer(parent, this.group, layerName);
  }

  add(object, baseX, baseY) {
    object.userData.baseX = baseX;
    object.userData.baseY = baseY;
    object.userData.layerName = this.layerName;
    object.renderOrder = this.renderOrder;
    object.traverse?.((child) => {
      child.userData.layerName = this.layerName;
      child.renderOrder = this.renderOrder;
      if (this.layerName === "foregroundLayer" && child.material) {
        child.material.depthTest = false;
        child.material.depthWrite = false;
      }
    });
    this.group.add(object);
    this.items.push(object);
    return object;
  }

  update(dt, now) {
    this.group.visible = this.enabled;
    if (!this.enabled) return;

    const cameraX = camera.position.x;
    const cameraY = camera.position.y;
    for (const object of this.items) {
      const drift = now * this.ambientSpeed * (object.userData.driftScale ?? 1);
      object.position.x =
        cameraX + wrapCentered(object.userData.baseX - cameraX * this.speedMultiplier - drift, this.wrapWidth);
      object.position.y = object.userData.baseY + cameraY * this.verticalMultiplier;
    }
  }
}

const parallaxLayers = {
  sunsetSky: new ParallaxLayer({
    name: "sunsetSky",
    z: -60,
    speedMultiplier: 0,
    verticalMultiplier: 0,
    wrapWidth: 180,
    parent: backgroundLayer,
    layerName: "backgroundLayer",
    renderOrder: 0,
  }),
  moon: new ParallaxLayer({
    name: "moon",
    z: -56,
    speedMultiplier: 0.015,
    verticalMultiplier: 0.02,
    wrapWidth: 150,
    ambientSpeed: 0.02,
    parent: backgroundLayer,
    layerName: "backgroundLayer",
    renderOrder: 1,
  }),
  stars: new ParallaxLayer({
    name: "stars",
    z: -55,
    speedMultiplier: 0.01,
    verticalMultiplier: 0.01,
    wrapWidth: 150,
    ambientSpeed: 0.01,
    parent: backgroundLayer,
    layerName: "backgroundLayer",
    renderOrder: 1,
  }),
  distantClouds: new ParallaxLayer({
    name: "distantClouds",
    z: -50,
    speedMultiplier: 0.04,
    verticalMultiplier: 0.03,
    wrapWidth: 130,
    ambientSpeed: 0.05,
    parent: backgroundLayer,
    layerName: "backgroundLayer",
    renderOrder: 2,
  }),
  nearClouds: new ParallaxLayer({
    name: "nearClouds",
    z: -42,
    speedMultiplier: 0.08,
    verticalMultiplier: 0.05,
    wrapWidth: 120,
    ambientSpeed: 0.08,
    parent: backgroundLayer,
    layerName: "backgroundLayer",
    renderOrder: 4,
  }),
  farSkyline: new ParallaxLayer({
    name: "farSkyline",
    z: -34,
    speedMultiplier: 0.13,
    verticalMultiplier: 0.08,
    wrapWidth: 115,
    parent: midgroundLayer,
    layerName: "midgroundLayer",
    renderOrder: 12,
    enabled: false,
  }),
  nearSkyline: new ParallaxLayer({
    name: "nearSkyline",
    z: -26,
    speedMultiplier: 0.22,
    verticalMultiplier: 0.1,
    wrapWidth: 110,
    parent: midgroundLayer,
    layerName: "midgroundLayer",
    renderOrder: 13,
    enabled: false,
  }),
  foreground: new ParallaxLayer({
    name: "foreground",
    z: 14,
    speedMultiplier: 1.35,
    verticalMultiplier: 0.12,
    wrapWidth: 85,
    parent: foregroundLayer,
    layerName: "foregroundLayer",
    renderOrder: 42,
    enabled: false,
  }),
  foregroundBase: new ParallaxLayer({
    name: "foregroundBase",
    z: 12,
    speedMultiplier: 1.18,
    verticalMultiplier: 0.1,
    wrapWidth: 92,
    parent: foregroundLayer,
    layerName: "foregroundLayer",
    renderOrder: 41,
    enabled: false,
  }),
  foregroundPowerlines: new ParallaxLayer({
    name: "foregroundPowerlines",
    z: 14,
    speedMultiplier: 0.7,
    verticalMultiplier: 0.08,
    wrapWidth: 156,
    parent: foregroundLayer,
    layerName: "foregroundLayer",
    renderOrder: 49,
    enabled: true,
  }),
  edgeHaze: new ParallaxLayer({
    name: "edgeHaze",
    z: -39,
    speedMultiplier: 0.06,
    verticalMultiplier: 0.02,
    wrapWidth: 120,
    ambientSpeed: 0.03,
    parent: backgroundLayer,
    layerName: "backgroundLayer",
    renderOrder: 3,
    enabled: false,
  }),
};

const buildModeHiddenAtmosphereLayers = [
  "distantClouds",
  "nearClouds",
  "edgeHaze",
  "foreground",
  "foregroundBase",
  "foregroundPowerlines",
];
const buildModeLayerState = new Map();

const debugSettings = {
  timeScale: 1,
  pauseParallax: false,
};

const performanceStats = {
  frameSamples: new Float32Array(config.performanceSampleCount),
  cpuSamples: new Float32Array(config.performanceSampleCount),
  sampleIndex: 0,
  sampleCount: 0,
  stutters: 0,
  hardStutters: 0,
  lastUiUpdateAt: 0,
  latest: {
    fps: 0,
    avgFrameMs: 0,
    worstFrameMs: 0,
    avgCpuMs: 0,
    worstCpuMs: 0,
    activeFx: 0,
    drawCalls: 0,
  },
};

window.HookedDebug = {
  layers: parallaxLayers,
  groups: {
    background: backgroundLayer,
    midground: midgroundLayer,
    gameplay: gameplayLayer,
    foreground: foregroundLayer,
  },
  settings: debugSettings,
  performance() {
    return {
      ...performanceStats.latest,
      stutters: performanceStats.stutters,
      hardStutters: performanceStats.hardStutters,
      samples: performanceStats.sampleCount,
      note: "CPU frame cost is JavaScript/render submission time, not exact GPU time.",
    };
  },
  resetPerformance() {
    performanceStats.sampleIndex = 0;
    performanceStats.sampleCount = 0;
    performanceStats.stutters = 0;
    performanceStats.hardStutters = 0;
    performanceStats.frameSamples.fill(0);
    performanceStats.cpuSamples.fill(0);
  },
  fxQuality(level) {
    if (level) setFxQuality(level);
    return {
      level: fxQualitySettings.level,
      profile: getFxProfile(),
    };
  },
  poseMode(mode) {
    if (mode) config.glbPoseMode = mode;
    return {
      mode: config.glbPoseMode,
      available: ["ragdollLite", "relative", "stable"],
      note: "ragdollLite keeps the left arm aligned to the grapple and drives other limbs from velocity/gravity.",
    };
  },
  toggleGroup(name, enabled) {
    const group = this.groups[name];
    if (group) group.visible = enabled;
  },
  describeLayers() {
    return {
      background: backgroundLayer.children.map((child) => child.name || child.type),
      midground: midgroundLayer.children.map((child) => child.name || child.type),
      gameplay: gameplayLayer.children.map((child) => child.userData.layerName || child.type),
      foreground: foregroundLayer.children.map((child) => child.name || child.type),
    };
  },
  setLayerEnabled(name, enabled) {
    if (parallaxLayers[name]) parallaxLayers[name].enabled = enabled;
  },
  setLayerSpeed(name, speedMultiplier) {
    if (parallaxLayers[name]) parallaxLayers[name].speedMultiplier = speedMultiplier;
  },
  setLayerOpacity(name, opacity) {
    const layer = parallaxLayers[name];
    if (!layer) return;
    for (const object of layer.items) {
      if (object.material) object.material.opacity = opacity;
      object.traverse?.((child) => {
        if (child.material?.transparent) child.material.opacity = opacity;
      });
    }
  },
  setForegroundOpacity(opacity) {
    this.setLayerOpacity("foreground", opacity);
    this.setLayerOpacity("foregroundBase", opacity);
  },
  setForegroundBlur(value) {
    config.foregroundBlurScale = value;
    for (const layerName of ["foreground", "foregroundBase"]) {
      const layer = parallaxLayers[layerName];
      if (!layer) continue;
      for (const object of layer.items) {
        object.traverse?.((child) => {
          if (child.userData.foregroundBlur) {
            child.scale.set(THREE.MathUtils.clamp(value, 0.5, 2.2), THREE.MathUtils.clamp(value, 0.5, 2.2), 1);
          }
        });
      }
    }
  },
  pauseWorldScrolling(enabled) {
    debugSettings.pauseParallax = enabled;
  },
  showDroneAnchors(enabled) {
    config.debugShowDroneAnchors = enabled;
    for (const anchor of anchors) anchor.debugAnchor.visible = enabled;
  },
  setGlbNeutralOnly(enabled) {
    config.debugGlbNeutralOnly = Boolean(enabled);
    if (config.debugGlbNeutralOnly) resetGlbPivotAngles();
    syncCharacterSourceVisibility();
    return describeGlbRig();
  },
  characterRig() {
    return describeGlbRig();
  },
  poseSnapshot() {
    return describeCharacterPoseSnapshot();
  },
  poseHealth() {
    return describeCharacterPoseHealth();
  },
  poseReferences() {
    return describeCharacterPoseReferences();
  },
  exportPoseReferences() {
    return createCharacterPoseReferenceLibrary();
  },
  previewPose(overrides) {
    return previewCharacterPose(overrides);
  },
  setDroneTensionStrength(value) {
    config.droneTensionStrength = value;
  },
  setSlowMotion(enabled) {
    debugSettings.timeScale = enabled ? 0.35 : 1;
  },
};

function createPixelMoonTexture() {
  const moonCanvas = document.createElement("canvas");
  moonCanvas.width = 160;
  moonCanvas.height = 160;
  const ctx = moonCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 160, 160);
  const glow = ctx.createRadialGradient(80, 80, 18, 80, 80, 78);
  glow.addColorStop(0, "rgba(255, 249, 218, 0.98)");
  glow.addColorStop(0.58, "rgba(244, 238, 214, 0.86)");
  glow.addColorStop(1, "rgba(244, 212, 178, 0.05)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(80, 80, 76, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff5d8";
  ctx.beginPath();
  ctx.arc(80, 80, 64, 0, Math.PI * 2);
  ctx.fill();

  const craterColors = ["rgba(192, 164, 148, 0.28)", "rgba(255, 255, 241, 0.34)", "rgba(143, 111, 123, 0.18)"];
  const craters = [
    [58, 45, 10, 0],
    [96, 42, 7, 2],
    [106, 82, 13, 0],
    [60, 96, 8, 2],
    [82, 118, 12, 1],
    [43, 72, 8, 0],
    [114, 112, 7, 2],
    [76, 65, 5, 1],
  ];
  for (const [x, y, radius, colorIndex] of craters) {
    ctx.fillStyle = craterColors[colorIndex];
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.2, radius * 0.72, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(moonCanvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createMoonAuraTexture() {
  const auraCanvas = document.createElement("canvas");
  auraCanvas.width = 160;
  auraCanvas.height = 160;
  const ctx = auraCanvas.getContext("2d");
  ctx.clearRect(0, 0, 160, 160);
  const glow = ctx.createRadialGradient(80, 80, 18, 80, 80, 80);
  glow.addColorStop(0, "rgba(255, 248, 214, 0.54)");
  glow.addColorStop(0.44, "rgba(255, 230, 182, 0.24)");
  glow.addColorStop(0.72, "rgba(118, 211, 255, 0.06)");
  glow.addColorStop(1, "rgba(255, 222, 170, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 160, 160);
  const texture = new THREE.CanvasTexture(auraCanvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSunsetSkyTexture() {
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 512;
  skyCanvas.height = 256;
  const ctx = skyCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const gradient = ctx.createLinearGradient(0, 0, 0, skyCanvas.height);
  gradient.addColorStop(0, "#120f21");
  gradient.addColorStop(0.22, "#241838");
  gradient.addColorStop(0.48, "#4b213d");
  gradient.addColorStop(0.7, "#793327");
  gradient.addColorStop(1, "#9e4b22");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

  const hazeBands = [
    ["rgba(225, 111, 44, 0.22)", 150, 35, 210, 18],
    ["rgba(198, 72, 40, 0.2)", 260, 96, 300, 24],
    ["rgba(116, 43, 92, 0.28)", 110, 74, 250, 18],
    ["rgba(240, 166, 76, 0.12)", 36, 122, 170, 16],
    ["rgba(30, 22, 42, 0.54)", 320, 28, 180, 20],
  ];
  for (const [color, x, y, width, height] of hazeBands) {
    ctx.fillStyle = color;
    for (let step = 0; step < 8; step += 1) {
      ctx.fillRect(x - step * 18, y + step * 2, width - step * 18, Math.max(2, height - step * 2));
    }
  }

  const texture = new THREE.CanvasTexture(skyCanvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createStarTexture() {
  const starCanvas = document.createElement("canvas");
  starCanvas.width = 256;
  starCanvas.height = 96;
  const ctx = starCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 256, 96);
  const colors = ["#d9f1ff", "#7ca6ff", "#fff2a8"];
  for (let index = 0; index < 75; index += 1) {
    const x = (index * 53) % 256;
    const y = (index * 29 + Math.floor(index / 3) * 11) % 84;
    const size = index % 9 === 0 ? 2 : 1;
    ctx.fillStyle = colors[index % colors.length];
    ctx.globalAlpha = index % 5 === 0 ? 0.85 : 0.48;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
  return pixelTextureSettings(new THREE.CanvasTexture(starCanvas));
}

function createCloudTexture(
  colors,
  accent = "rgba(255, 143, 48, 0.34)",
  shadow = "rgba(45, 24, 45, 0.44)",
  rim = "rgba(255, 244, 212, 0.34)",
) {
  const cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = 256;
  cloudCanvas.height = 86;
  const ctx = cloudCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 256, 86);
  const blocks = [
    [2, 48, 46, 9],
    [24, 36, 74, 15],
    [76, 28, 64, 20],
    [126, 39, 86, 13],
    [168, 24, 72, 18],
    [206, 47, 46, 10],
    [42, 58, 156, 10],
  ];
  blocks.forEach(([x, y, w, h], index) => {
    ctx.fillStyle = shadow;
    ctx.fillRect(x + 4, y + h - 2, w, h);
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(x, y, w, h);
    ctx.fillRect(x + 8, y - 6, Math.max(12, w - 20), 6);
    ctx.fillRect(x + 22, y + h, Math.max(12, w - 38), 5);
    if (rim) {
      ctx.fillStyle = rim;
      ctx.fillRect(x - 5, y + h - 1, w + 10, 2);
      ctx.fillRect(x + 12, y + h + 4, Math.max(14, w - 18), 2);
    }
  });
  ctx.fillStyle = accent;
  ctx.fillRect(20, 52, 190, 4);
  ctx.fillRect(84, 31, 112, 3);
  if (rim) {
    ctx.fillStyle = rim;
    ctx.fillRect(12, 64, 224, 2);
    ctx.fillRect(64, 70, 128, 2);
  }
  ctx.fillStyle = "rgba(255, 232, 158, 0.18)";
  ctx.fillRect(66, 28, 70, 3);
  ctx.fillRect(158, 23, 62, 3);

  const texture = new THREE.CanvasTexture(cloudCanvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSignTexture(label, color) {
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 64;
  signCanvas.height = 96;
  const ctx = signCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(4, 9, 20, 0.92)";
  ctx.fillRect(0, 0, 64, 96);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(5, 5, 54, 86);
  ctx.fillStyle = color;
  ctx.font = "bold 16px monospace";
  [...label].slice(0, 4).forEach((char, index) => {
    ctx.fillText(char, 22, 27 + index * 17);
  });
  const texture = new THREE.CanvasTexture(signCanvas);
  return pixelTextureSettings(texture);
}

function createBuilding(width, height, color, windowColor, signLabel = "") {
  const group = new THREE.Group();
  const lowerExtension = 16;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height + lowerExtension, 0.6),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.98 }),
  );
  body.position.y = height * 0.5 - lowerExtension * 0.5;
  group.add(body);

  const rows = Math.floor(height / 1.2);
  const cols = Math.max(1, Math.floor(width / 0.55));
  const windowGeometry = new THREE.BoxGeometry(0.08, 0.16, 0.05);
  const windowMaterial = new THREE.MeshBasicMaterial({
    color: windowColor,
    transparent: true,
    opacity: 0.9,
  });
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if ((row * 7 + col * 3 + Math.floor(width * 10)) % 5 === 0) continue;
      const win = new THREE.Mesh(windowGeometry, windowMaterial);
      win.position.set(
        -width * 0.35 + col * 0.45,
        0.7 + row * 0.9,
        0.34,
      );
      group.add(win);
    }
  }

  const antenna = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.8, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x09101b }),
  );
  antenna.position.set(width * 0.25, height + 0.8, 0.32);
  group.add(antenna);

  if (signLabel) {
    const colors = ["#ff2d8d", "#23e7ff", "#ffc928"];
    const texture = createSignTexture(signLabel, colors[signLabel.length % colors.length]);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.min(width * 0.65, 1.3), 2.2),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      }),
    );
    sign.position.set(width * 0.18, height * 0.58, 0.38);
    sign.userData.flickerSeed = signLabel.length * 0.7 + width;
    group.add(sign);
    group.userData.sign = sign;
  }

  return group;
}

function createForegroundProp(kind) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: false,
    depthWrite: false,
    depthTest: false,
  });
  const blurMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: false,
    depthWrite: false,
    depthTest: false,
  });
  if (kind === "billboard") {
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.34, 28, 0.2), material);
    const sidePole = new THREE.Mesh(new THREE.BoxGeometry(0.24, 26, 0.18), material);
    const board = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.55, 0.25), material);
    const blurBoard = new THREE.Mesh(new THREE.BoxGeometry(6.85, 2.95, 0.2), blurMaterial);
    const cable = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.16, 0.14), material);
    const bottomStrut = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, 0.16), material);
    pole.position.y = -9.6;
    sidePole.position.set(2.9, -9.0, 0);
    board.position.set(0.3, 1.75, 0);
    blurBoard.position.copy(board.position);
    blurBoard.position.z = -0.04;
    blurBoard.userData.foregroundBlur = true;
    cable.position.set(0.1, 0.15, 0.04);
    cable.rotation.z = -0.1;
    bottomStrut.position.set(0.18, -1.0, 0.02);
    group.add(blurBoard, pole, sidePole, cable, bottomStrut, board);
  } else {
    const poleA = new THREE.Mesh(new THREE.BoxGeometry(0.26, 28, 0.18), material);
    const poleB = new THREE.Mesh(new THREE.BoxGeometry(0.24, 27, 0.18), material);
    const wire = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.13, 0.12), material);
    const wireShadow = new THREE.Mesh(new THREE.BoxGeometry(7.55, 0.28, 0.08), blurMaterial);
    const lowerWire = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.11, 0.1), material);
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.13, 0.12), material);
    poleA.position.set(-3.15, -9.6, 0);
    poleB.position.set(3.15, -10.1, 0);
    wire.position.set(0, 1.25, 0);
    wire.rotation.z = -0.08;
    wireShadow.position.copy(wire.position);
    wireShadow.rotation.copy(wire.rotation);
    wireShadow.position.z = -0.04;
    wireShadow.userData.foregroundBlur = true;
    lowerWire.position.set(0, 0.55, 0.03);
    lowerWire.rotation.z = -0.12;
    crossbar.position.set(-3.15, 1.0, 0.04);
    crossbar.rotation.z = -0.05;
    group.add(poleA, poleB, wireShadow, wire, lowerWire, crossbar);
  }
  return group;
}

function addWireSegment(group, start, end, material, thickness = 0.055, z = 0) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0.001) return null;

  const segment = new THREE.Mesh(new THREE.BoxGeometry(length, thickness, 0.08), material);
  segment.position.set((start.x + end.x) * 0.5, (start.y + end.y) * 0.5, z);
  segment.rotation.z = Math.atan2(dy, dx);
  group.add(segment);
  return segment;
}

function addSaggingWire(group, startX, endX, startY, endY, sag, material, thickness, z) {
  const segments = 15;
  let previous = new THREE.Vector2(startX, startY);
  for (let index = 1; index <= segments; index += 1) {
    const t = index / segments;
    const x = THREE.MathUtils.lerp(startX, endX, t);
    const y = THREE.MathUtils.lerp(startY, endY, t) - Math.sin(t * Math.PI) * sag;
    const current = new THREE.Vector2(x, y);
    addWireSegment(group, previous, current, material, thickness, z);
    previous = current;
  }
}

function addBrushGrass(group, width, baseY, material, seed) {
  for (let index = 0; index < 34; index += 1) {
    const t = index / 33;
    const x = THREE.MathUtils.lerp(-width * 0.5, width * 0.5, t);
    const height = 0.28 + ((index * 7 + seed) % 9) * 0.08;
    const lean = (((index * 11 + seed) % 7) - 3) * 0.045;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.055, height, 0.06), material);
    blade.position.set(x + lean * 4, baseY + height * 0.5, 0.16);
    blade.rotation.z = lean;
    group.add(blade);
  }
}

function seededUnit(seed) {
  return Math.sin(seed * 12.9898 + 78.233) * 43758.5453 % 1;
}

function seededRange(seed, min, max) {
  const value = seededUnit(seed);
  return THREE.MathUtils.lerp(min, max, value < 0 ? value + 1 : value);
}

function createPowerlineRun(index) {
  const group = new THREE.Group();
  group.userData.driftScale = 1;

  const black = new THREE.MeshBasicMaterial({
    color: 0x020403,
    transparent: false,
    depthWrite: false,
    depthTest: false,
  });
  const soft = new THREE.MeshBasicMaterial({
    color: 0x020403,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    depthTest: false,
  });
  const cap = new THREE.MeshBasicMaterial({
    color: 0x07100f,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
    depthTest: false,
  });

  const widthScale = seededRange(index + 1.1, 0.9, 1.18);
  const poleXs = [
    -12.8 * widthScale + seededRange(index + 4.3, -0.9, 0.55),
    seededRange(index + 5.7, -1.4, 1.25),
    12.4 * widthScale + seededRange(index + 6.9, -0.55, 1.0),
  ];
  const baseY = -49.4 + seededRange(index + 8.5, -2.5, 1.8);
  const heights = [
    32 + ((index * 5) % 7) + seededRange(index + 10.2, -3.4, 4.2),
    38 + ((index * 7) % 9) + seededRange(index + 11.6, -4.2, 6.4),
    33 + ((index * 3) % 8) + seededRange(index + 12.4, -3.0, 5.6),
  ];
  const topYs = heights.map((height, poleIndex) => baseY + height + (poleIndex === 1 ? seededRange(index + 13.8, 0.7, 2.4) : 0));

  for (let poleIndex = 0; poleIndex < poleXs.length; poleIndex += 1) {
    const x = poleXs[poleIndex];
    const topY = topYs[poleIndex];
    const height = topY - baseY;
    const poleWidth = (poleIndex === 1 ? 0.38 : 0.3) * seededRange(index + poleIndex * 2.7, 0.82, 1.22);
    const pole = new THREE.Mesh(new THREE.BoxGeometry(poleWidth, height, 0.22), black);
    pole.position.set(x, baseY + height * 0.5, 0.1);
    group.add(pole);

    const baseBlock = new THREE.Mesh(new THREE.BoxGeometry(poleWidth * 2.4, 2.8, 0.2), black);
    baseBlock.position.set(x, baseY + 1.25, 0.12);
    group.add(baseBlock);

    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(seededRange(index + poleIndex + 18.2, 3.0, 4.55), 0.22, 0.16), black);
    upperArm.position.set(x, topY - 0.65, 0.18);
    group.add(upperArm);

    const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(seededRange(index + poleIndex + 24.1, 2.3, 3.7), 0.18, 0.14), black);
    lowerArm.position.set(x, topY - 3.6, 0.18);
    group.add(lowerArm);

    const capTop = new THREE.Mesh(new THREE.BoxGeometry(seededRange(index + poleIndex + 31.7, 3.2, 4.8), 0.1, 0.12), cap);
    capTop.position.set(x, topY - 0.4, 0.23);
    group.add(capTop);

    for (const yOffset of [-0.95, -3.85]) {
      for (const side of [-1, 1]) {
        const insulator = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.38, 0.14), black);
        insulator.position.set(x + side * 1.25, topY + yOffset, 0.22);
        group.add(insulator);
      }
    }
  }

  for (let poleIndex = 0; poleIndex < poleXs.length - 1; poleIndex += 1) {
    const leftX = poleXs[poleIndex];
    const rightX = poleXs[poleIndex + 1];
    const leftTop = topYs[poleIndex];
    const rightTop = topYs[poleIndex + 1];
    const sag = 1.0 + ((index + poleIndex) % 3) * 0.34 + seededRange(index + poleIndex + 39.2, -0.24, 0.42);
    for (const lane of [0, 1, 2]) {
      const yOffset = -1.15 - lane * 0.68;
      addSaggingWire(group, leftX - 2.1, rightX + 2.1, leftTop + yOffset, rightTop + yOffset - 0.3, sag + lane * 0.16, soft, 0.16, -0.03);
      addSaggingWire(group, leftX - 2.1, rightX + 2.1, leftTop + yOffset, rightTop + yOffset - 0.3, sag + lane * 0.16, black, 0.052, 0.2);
    }
    addSaggingWire(group, leftX - 1.45, rightX + 1.45, leftTop - 4.25, rightTop - 4.45, sag * 0.75, black, 0.045, 0.22);
  }

  addSaggingWire(group, -18, poleXs[0] + 1.6, topYs[0] - 2.1, topYs[0] - 2.5, 0.75, black, 0.045, 0.2);
  addSaggingWire(group, poleXs[2] - 1.4, 18, topYs[2] - 1.9, topYs[2] - 1.55, 0.7, black, 0.045, 0.2);
  addBrushGrass(group, 38 * widthScale, baseY - 0.18, black, index * 13);

  group.traverse((child) => {
    if (child.material) {
      child.material.depthTest = false;
      child.material.depthWrite = false;
    }
    child.userData.foregroundBlur = child.material === soft;
  });

  return group;
}

function createEdgeHazeBand(index) {
  const group = new THREE.Group();
  const colors = [0x101c46, 0x26114b, 0x12375e, 0x3a1348];
  for (let band = 0; band < 5; band += 1) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(18 + ((index + band) % 4) * 5, 1.6 + (band % 3) * 0.8),
      new THREE.MeshBasicMaterial({
        color: colors[(index + band) % colors.length],
        transparent: true,
        opacity: 0.34 + band * 0.045,
        depthWrite: false,
      }),
    );
    mesh.position.set((band - 2) * 5.3, -6 + band * 3.8, 0);
    group.add(mesh);
  }
  return group;
}

function createForegroundBaseBlock(index) {
  const group = new THREE.Group();
  const widths = [4.5, 6.2, 3.7, 5.4];
  const width = widths[index % widths.length];
  const height = 9 + (index % 4) * 2.1;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.3),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    }),
  );
  base.position.y = -height * 0.5;
  group.add(base);

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.9, 0.08, 0.08),
    new THREE.MeshBasicMaterial({
      color: 0x10151e,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    }),
  );
  trim.position.y = 0.1;
  group.add(trim);
  return group;
}

function buildParallaxCity() {
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(190, 86),
    new THREE.MeshBasicMaterial({
      map: createSunsetSkyTexture(),
      transparent: false,
      depthWrite: false,
    }),
  );
  parallaxLayers.sunsetSky.add(sky, 0, 13);

  const moonAura = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshBasicMaterial({
      map: createMoonAuraTexture(),
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  moonAura.userData.orbitRadius = 1.25;
  moonAura.userData.orbitSpeed = 0.08;
  parallaxLayers.moon.add(moonAura, 15, 32);

  const moonLight = new THREE.PointLight(0xffecc6, 1.65, 92, 1.55);
  moonLight.position.z = 9;
  moonLight.userData.orbitRadius = 1.25;
  moonLight.userData.orbitSpeed = 0.08;
  parallaxLayers.moon.add(moonLight, 15, 32);

  const moon = new THREE.Mesh(
    new THREE.PlaneGeometry(28.5, 28.5),
    new THREE.MeshBasicMaterial({
      map: createPixelMoonTexture(),
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    }),
  );
  moon.userData.orbitRadius = 1.25;
  moon.userData.orbitSpeed = 0.08;
  parallaxLayers.moon.add(moon, 15, 32);

  const starTexture = createStarTexture();
  for (let index = 0; index < 5; index += 1) {
    const stars = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 12),
      new THREE.MeshBasicMaterial({
        map: starTexture,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
      }),
    );
    stars.userData.driftScale = 0.2 + index * 0.03;
    parallaxLayers.stars.add(stars, index * 32 - 64, 31 + (index % 2) * 3.8);
  }

  const farCloudTexture = createCloudTexture(
    ["#241d34", "#46263f", "#663036", "#934a2a", "#33243e"],
    "rgba(213, 105, 40, 0.24)",
    "rgba(24, 19, 31, 0.58)",
    "rgba(255, 244, 214, 0.68)",
  );
  const nearCloudTexture = createCloudTexture(
    ["#2d2037", "#582b44", "#82372e", "#b85e26", "#211b31"],
    "rgba(236, 129, 43, 0.26)",
    "rgba(20, 17, 28, 0.64)",
    "rgba(255, 236, 196, 0.62)",
  );
  for (let index = 0; index < 10; index += 1) {
    parallaxLayers.edgeHaze.add(createEdgeHazeBand(index), index * 13 - 58, 0);
  }

  for (let index = 0; index < 9; index += 1) {
    const farCloud = new THREE.Mesh(
      new THREE.PlaneGeometry(24 + (index % 3) * 8, 6.2 + (index % 2) * 1.2),
      new THREE.MeshBasicMaterial({
        map: farCloudTexture,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    );
    farCloud.userData.driftScale = 0.8 + index * 0.05;
    parallaxLayers.distantClouds.add(farCloud, index * 16 - 58, 24 + (index % 4) * 2.4);

    const highCloud = new THREE.Mesh(
      new THREE.PlaneGeometry(26 + (index % 4) * 6, 6.8 + (index % 3) * 0.8),
      new THREE.MeshBasicMaterial({
        map: farCloudTexture,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
    highCloud.userData.driftScale = 0.55 + index * 0.035;
    parallaxLayers.distantClouds.add(highCloud, index * 17 - 64, 35 + (index % 3) * 2.2);

    const crownCloud = new THREE.Mesh(
      new THREE.PlaneGeometry(34 + (index % 3) * 8, 8 + (index % 2) * 1.1),
      new THREE.MeshBasicMaterial({
        map: farCloudTexture,
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
      }),
    );
    crownCloud.userData.driftScale = 0.38 + index * 0.025;
    parallaxLayers.distantClouds.add(crownCloud, index * 19 - 70, 43 + (index % 2) * 2.0);

    const nearCloud = new THREE.Mesh(
      new THREE.PlaneGeometry(22 + (index % 4) * 6, 6.2 + (index % 3) * 0.9),
      new THREE.MeshBasicMaterial({
        map: nearCloudTexture,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
      }),
    );
    nearCloud.userData.driftScale = 1.1 + index * 0.04;
    parallaxLayers.nearClouds.add(nearCloud, index * 14 - 50, 27 + (index % 3) * 2.2);

    const emberCloud = new THREE.Mesh(
      new THREE.PlaneGeometry(18 + (index % 5) * 5, 4.8 + (index % 2) * 1.3),
      new THREE.MeshBasicMaterial({
        map: nearCloudTexture,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      }),
    );
    emberCloud.userData.driftScale = 1.35 + index * 0.06;
    parallaxLayers.nearClouds.add(emberCloud, index * 15 - 56, 18 + (index % 4) * 2.0);
  }

  for (let index = 0; index < 24; index += 1) {
    const width = 2 + (index % 4) * 0.65;
    const height = 7 + ((index * 5) % 9);
    const color = index % 2 ? 0x0c1d45 : 0x122552;
    const windowColor = index % 3 === 0 ? 0xff2d8d : index % 3 === 1 ? 0x23e7ff : 0xf5c84c;
    const sign = index % 5 === 0 ? ["未来", "ホテ", "東京", "NEO"][index % 4] : "";
    const building = createBuilding(width, height, color, windowColor, sign);
    parallaxLayers.farSkyline.add(building, index * 5.4 - 54, -9.2);
  }

  for (let index = 0; index < 20; index += 1) {
    const width = 2.6 + (index % 5) * 0.7;
    const height = 9 + ((index * 7) % 11);
    const color = index % 2 ? 0x102149 : 0x152b5c;
    const windowColor = index % 4 === 0 ? 0xff2d8d : index % 4 === 1 ? 0x22e6ff : 0xf6d447;
    const sign = index % 4 === 0 ? ["未来", "注意", "ネオ", "CYBR"][index % 4] : "";
    const building = createBuilding(width, height, color, windowColor, sign);
    parallaxLayers.nearSkyline.add(building, index * 6 - 50, -11.8);
  }

  for (let index = 0; index < 12; index += 1) {
    parallaxLayers.foregroundBase.add(createForegroundBaseBlock(index), index * 7.5 - 42, -12.6 + (index % 2) * 0.2);
  }

  for (let index = 0; index < 12; index += 1) {
    const prop = createForegroundProp(index % 3 === 0 ? "billboard" : "poles");
    prop.userData.driftScale = 1;
    parallaxLayers.foreground.add(prop, index * 8 - 38, -4.9 + (index % 4) * 0.28);
  }

  for (let index = 0; index < 6; index += 1) {
    const run = createPowerlineRun(index);
    run.scale.setScalar(seededRange(index + 52.4, 0.78, 1.08));
    parallaxLayers.foregroundPowerlines.add(
      run,
      index * 30 - 75 + seededRange(index + 61.8, -3.2, 3.8),
      -2.1 + seededRange(index + 70.3, -1.2, 0.9),
    );
  }
}

function updateParallaxCity(dt, now) {
  if (debugSettings.pauseParallax) return;
  for (const layer of Object.values(parallaxLayers)) layer.update(dt, now);

  for (const moonItem of parallaxLayers.moon.items) {
    if (!moonItem.userData.orbitSpeed) continue;
    moonItem.position.x += Math.cos(now * moonItem.userData.orbitSpeed) * moonItem.userData.orbitRadius;
    moonItem.position.y += Math.sin(now * moonItem.userData.orbitSpeed * 0.7) * 0.9;
  }

  for (const layerName of ["farSkyline", "nearSkyline"]) {
    for (const object of parallaxLayers[layerName].items) {
      if (!object.userData.sign) continue;
      const pulse = 0.68 + Math.sin(now * 2.8 + object.userData.sign.userData.flickerSeed) * 0.18;
      object.userData.sign.material.opacity = THREE.MathUtils.clamp(pulse, 0.42, 0.9);
    }
  }
}

buildParallaxCity();

const playerMesh = new THREE.Group();
const playerAssetRoot = new THREE.Group();
const playerRibbonLayer = new THREE.Group();
let playerPoseRotationSmoothed = 0;
playerMesh.renderOrder = 36;
playerAssetRoot.renderOrder = 36;
playerAssetRoot.visible = false;
playerMesh.add(playerAssetRoot);
playerMesh.add(playerRibbonLayer);
addGameplay(playerMesh);

const glbCharacter = {
  loaded: false,
  group: null,
  leftWristAnchor: null,
  ribbonAnchor: null,
  skinnedMeshCount: 0,
  animationClipNames: [],
  pivots: {},
  pivotKeys: new Map(),
  pivotCalibration: new Map(),
  restQuaternions: new Map(),
  currentAngles: new Map(),
  debugMarkers: [],
};
const glbCharacterBaseScale = 1.7;
const glbPivotNames = {
  root: "M_root",
  torso: "torso_pivot",
  pelvis: "pelvis_pivot",
  waist: "waist_pivot",
  chest: "chest_pivot",
  neck: "neck_pivot",
  head: "head_pivot",
  leftShoulder: "left_shoulder_pivot",
  leftElbow: "left_elbow_pivot",
  leftWrist: "left_wrist_pivot",
  rightShoulder: "right_shoulder_pivot",
  rightElbow: "right_elbow_pivot",
  rightWrist: "right_wrist_pivot",
  leftHip: "left_hip_pivot",
  leftKnee: "left_knee_pivot",
  leftAnkle: "left_ankle_pivot",
  rightHip: "right_hip_pivot",
  rightKnee: "right_knee_pivot",
  rightAnkle: "right_ankle_pivot",
};

const glbPivotDriverAxes = {
  root: "z",
  torso: "z",
  pelvis: "z",
  waist: "z",
  chest: "z",
  neck: "z",
  head: "z",
  leftShoulder: "x",
  leftElbow: "x",
  leftWrist: "z",
  rightShoulder: "x",
  rightElbow: "z",
  rightWrist: "z",
  leftHip: "x",
  leftKnee: "z",
  leftAnkle: "z",
  rightHip: "x",
  rightKnee: "z",
  rightAnkle: "z",
};

const glbPivotChildKeys = {
  root: "pelvis",
  torso: "pelvis",
  pelvis: "waist",
  waist: "chest",
  chest: "neck",
  neck: "head",
  leftShoulder: "leftElbow",
  leftElbow: "leftWrist",
  leftWrist: "leftWristAnchor",
  rightShoulder: "rightElbow",
  rightElbow: "rightWrist",
  leftHip: "leftKnee",
  leftKnee: "leftAnkle",
  rightHip: "rightKnee",
  rightKnee: "rightAnkle",
};

const poseReferenceState = {
  projectPath: characterPoseProjectPath,
  projectLoaded: false,
  projectError: null,
  projectPoses: {},
  localPoses: loadCharacterPoseReferences(),
  poses: {},
};
rebuildCharacterPoseReferences();
loadProjectCharacterPoseReferences();

const poseHandleDefinitions = [
  { key: "pelvis", driverKey: "root" },
  { key: "waist", driverKey: "pelvis" },
  { key: "chest", driverKey: "waist" },
  { key: "neck", driverKey: "chest" },
  { key: "head", driverKey: "neck" },
  { key: "leftShoulder", driverKey: "chest" },
  { key: "leftElbow", driverKey: "leftShoulder" },
  { key: "leftWrist", driverKey: "leftElbow" },
  { key: "rightShoulder", driverKey: "chest" },
  { key: "rightElbow", driverKey: "rightShoulder" },
  { key: "rightWrist", driverKey: "rightElbow" },
  { key: "leftHip", driverKey: "pelvis" },
  { key: "leftKnee", driverKey: "leftHip" },
  { key: "leftAnkle", driverKey: "leftKnee" },
  { key: "rightHip", driverKey: "pelvis" },
  { key: "rightKnee", driverKey: "rightHip" },
  { key: "rightAnkle", driverKey: "rightKnee" },
];

const rigSegmentDefinitions = [
  { key: "torso", from: "pelvis", to: "chest" },
  { key: "neck", from: "neck", to: "head" },
  { key: "leftUpperArm", from: "leftShoulder", to: "leftElbow" },
  { key: "leftForearm", from: "leftElbow", to: "leftWrist" },
  { key: "leftHand", from: "leftWrist", to: "leftWristAnchor" },
  { key: "rightUpperArm", from: "rightShoulder", to: "rightElbow" },
  { key: "rightForearm", from: "rightElbow", to: "rightWrist" },
  { key: "leftThigh", from: "leftHip", to: "leftKnee" },
  { key: "leftShin", from: "leftKnee", to: "leftAnkle" },
  { key: "rightThigh", from: "rightHip", to: "rightKnee" },
  { key: "rightShin", from: "rightKnee", to: "rightAnkle" },
];

const poseHandleLayer = new THREE.Group();
poseHandleLayer.name = "characterPoseHandleLayer";
poseHandleLayer.visible = false;
addGameplay(poseHandleLayer);
const poseHandles = [];
const poseHandleMaterial = new THREE.MeshBasicMaterial({
  color: 0x6cf3ff,
  transparent: true,
  opacity: 0.9,
  depthTest: false,
});
const poseHandleActiveMaterial = new THREE.MeshBasicMaterial({
  color: 0xe4f24b,
  transparent: true,
  opacity: 1,
  depthTest: false,
});

function syncCharacterSourceVisibility() {
  const showGlbCharacter = config.useGlbCharacter && glbCharacter.loaded;
  playerAssetRoot.visible = showGlbCharacter;
  playerRibbonLayer.visible = !config.debugGlbNeutralOnly;
  for (const marker of glbCharacter.debugMarkers) {
    marker.visible = config.debugGlbNeutralOnly;
  }
  updatePoseHandles();
}

function syncGlbCharacterTransform(facing = state.facing, flourishFlip = 0) {
  const visualScale = characterVisualScale * glbCharacterBaseScale;
  playerAssetRoot.scale.set(
    facing * visualScale,
    visualScale,
    facing * visualScale,
  );
  playerAssetRoot.rotation.z = flourishFlip;
  playerRibbonLayer.scale.set(facing * characterVisualScale, characterVisualScale, 1);
  playerRibbonLayer.rotation.z = flourishFlip;
}

function getGlbPivotKey(pivot) {
  return glbCharacter.pivotKeys.get(pivot) ?? null;
}

function getGlbPivotAxisName(key) {
  return glbPivotDriverAxes[key] ?? "z";
}

function getGlbPivotChild(key) {
  const childKey = glbPivotChildKeys[key];
  if (!childKey) return null;
  if (childKey === "leftWristAnchor") return glbCharacter.leftWristAnchor;
  return glbCharacter.pivots[childKey] ?? null;
}

function getGlbNodeByRigKey(key) {
  if (key === "leftWristAnchor") return glbCharacter.leftWristAnchor;
  if (key === "ribbonAnchor") return glbCharacter.ribbonAnchor;
  return glbCharacter.pivots[key] ?? null;
}

function getGlbRopeAttachment() {
  return (
    glbCharacter.leftWristAnchor
    ?? glbCharacter.pivots.leftWrist
    ?? glbCharacter.pivots.leftElbow
    ?? glbCharacter.pivots.leftShoulder
    ?? null
  );
}

function getGlbPivotCalibration(key) {
  if (!key) return { restScreenAngle: 0, screenSign: 1, screenScale: 1 };
  const cached = glbCharacter.pivotCalibration.get(key);
  if (cached) return cached;

  const pivot = glbCharacter.pivots[key];
  const child = getGlbPivotChild(key);
  const restQuaternion = glbCharacter.restQuaternions.get(pivot);
  const axis = glbPoseAxes[getGlbPivotAxisName(key)] ?? glbPoseAxes.z;
  const calibration = {
    restScreenAngle: 0,
    screenSign: 1,
    screenScale: 1,
  };

  if (pivot && child && restQuaternion) {
    const base = glbPoseCalibrationVectorA.copy(child.position).applyQuaternion(restQuaternion);
    if (base.x * base.x + base.y * base.y > 0.000001) {
      calibration.restScreenAngle = Math.atan2(base.y, base.x);
      const calibrationStep = 0.025;
      glbPoseRotationScratch.setFromAxisAngle(axis, calibrationStep);
      const rotated = glbPoseCalibrationVectorB
        .copy(child.position)
        .applyQuaternion(glbPoseRotationScratch)
        .applyQuaternion(restQuaternion);
      const delta = normalizeAngle(Math.atan2(rotated.y, rotated.x) - calibration.restScreenAngle);
      calibration.screenSign = Math.sign(delta) || 1;
      calibration.screenScale = Math.abs(delta) > 0.0001 ? delta / calibrationStep : calibration.screenSign;
    }
  }

  glbCharacter.pivotCalibration.set(key, calibration);
  return calibration;
}

function getGlbRestScreenAngle(key, childPivot) {
  if (!childPivot) return -Math.PI / 2;
  const calibration = getGlbPivotCalibration(key);
  if (Number.isFinite(calibration.restScreenAngle)) return calibration.restScreenAngle;
  return localAngleTo(childPivot);
}

function setGlbPivotAngle(pivot, angle, immediate = false) {
  if (!pivot) return;
  const target = normalizeAngle(angle);
  glbCharacter.currentAngles.set(pivot, target);
  const restQuaternion = glbCharacter.restQuaternions.get(pivot) ?? pivot.quaternion;
  const key = getGlbPivotKey(pivot);
  const axis = glbPoseAxes[getGlbPivotAxisName(key)] ?? glbPoseAxes.z;
  const calibration = getGlbPivotCalibration(key);
  const localTarget = target / (calibration.screenSign || 1);
  glbPoseRotationScratch.setFromAxisAngle(axis, localTarget);
  glbPoseTargetScratch.copy(restQuaternion).multiply(glbPoseRotationScratch);
  if (immediate || glbPoseSmoothingAlpha >= 0.999) {
    pivot.quaternion.copy(glbPoseTargetScratch);
    return;
  }
  pivot.quaternion.slerp(glbPoseTargetScratch, glbPoseSmoothingAlpha);
}

function resetGlbPivotAngles(immediate = true) {
  for (const pivot of Object.values(glbCharacter.pivots)) {
    setGlbPivotAngle(pivot, 0, immediate);
  }
}

function createGlbDebugMarker(name) {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(name === glbPivotNames.root ? 0.065 : 0.04, 10, 8),
    new THREE.MeshBasicMaterial({
      color: name.includes("anchor") ? 0xfff35c : 0x6cf3ff,
      transparent: true,
      opacity: 0.92,
      depthTest: false,
    }),
  );
  marker.name = `${name}_debug_marker`;
  marker.renderOrder = 90;
  marker.visible = false;
  return marker;
}

function roundRigNumber(value, precision = 4) {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}

function roundRigVector(vector) {
  return [roundRigNumber(vector.x), roundRigNumber(vector.y), roundRigNumber(vector.z)];
}

function roundRigScreenDistance(left, right) {
  return roundRigNumber(Math.hypot(left.x - right.x, left.y - right.y));
}

function getRibbonLineWorldPoint(line, index, target) {
  if (!line?.geometry?.attributes?.position) return null;
  playerMesh.updateWorldMatrix(true, true);
  playerRibbonLayer.updateWorldMatrix(true, true);
  target.fromBufferAttribute(line.geometry.attributes.position, index);
  line.localToWorld(target);
  return target;
}

function describeCharacterPoseReferences() {
  return {
    projectPath: poseReferenceState.projectPath,
    projectLoaded: poseReferenceState.projectLoaded,
    projectError: poseReferenceState.projectError,
    projectKeys: Object.keys(poseReferenceState.projectPoses).sort(),
    localKeys: Object.keys(poseReferenceState.localPoses).sort(),
    mergedKeys: Object.keys(poseReferenceState.poses).sort(),
    library: createCharacterPoseReferenceLibrary(),
  };
}

function describeGlbRig() {
  const joints = {};
  for (const [key, pivot] of Object.entries(glbCharacter.pivots)) {
    if (!pivot) continue;
    const child = getGlbPivotChild(key);
    const calibration = getGlbPivotCalibration(key);
    pivot.getWorldPosition(glbPoseCalibrationVectorA);
    joints[key] = {
      node: pivot.name,
      child: child?.name ?? null,
      axis: getGlbPivotAxisName(key),
      screenSign: calibration.screenSign,
      screenScale: roundRigNumber(calibration.screenScale),
      restScreenAngle: roundRigNumber(calibration.restScreenAngle),
      currentAngle: roundRigNumber(glbCharacter.currentAngles.get(pivot) ?? 0),
      world: roundRigVector(glbPoseCalibrationVectorA),
      childLocal: child ? roundRigVector(child.position) : null,
    };
  }

  return {
    loaded: glbCharacter.loaded,
    path: config.glbCharacterPath,
    poseMode: config.glbPoseMode,
    neutralOnly: config.debugGlbNeutralOnly,
    frozen: config.freezeGlbCharacterPose,
    skinnedMeshes: glbCharacter.skinnedMeshCount,
    animations: glbCharacter.animationClipNames,
    driverAxes: { ...glbPivotDriverAxes },
    poseReferences: {
      projectLoaded: poseReferenceState.projectLoaded,
      projectError: poseReferenceState.projectError,
      projectKeys: Object.keys(poseReferenceState.projectPoses).sort(),
      localKeys: Object.keys(poseReferenceState.localPoses).sort(),
      mergedKeys: Object.keys(poseReferenceState.poses).sort(),
    },
    joints,
  };
}

function describeCharacterPoseSnapshot() {
  const snapshot = {
    glbLoaded: glbCharacter.loaded,
    poseMode: config.glbPoseMode,
    animation: state.playerAnimation,
    facing: state.facing,
    hooked: state.hookActive || state.grappled,
    grappled: state.grappled,
    player: roundRigVector(state.player),
    velocity: roundRigVector(state.velocity),
    rope: null,
    leftArm: null,
    body: null,
    legs: {},
    torso: null,
    swing: null,
    flourish: null,
    ribbon: null,
    sideDepth: null,
    segments: {},
    jointAngles: {},
  };

  for (const [key, pivot] of Object.entries(glbCharacter.pivots)) {
    if (pivot) snapshot.jointAngles[key] = roundRigNumber(glbCharacter.currentAngles.get(pivot) ?? 0);
  }

  if (!glbCharacter.loaded) return snapshot;

  playerMesh.updateWorldMatrix(true, true);
  playerAssetRoot.updateWorldMatrix(true, true);
  snapshot.body = {
    meshRotationDeg: roundRigNumber(THREE.MathUtils.radToDeg(playerMesh.rotation.z), 2),
    assetRotationDeg: roundRigNumber(THREE.MathUtils.radToDeg(playerAssetRoot.rotation.z), 2),
    scaleX: roundRigNumber(playerAssetRoot.scale.x),
    scaleZ: roundRigNumber(playerAssetRoot.scale.z),
    facing: state.facing,
  };

  const leftDepthKeys = ["leftShoulder", "leftWrist", "leftHip", "leftAnkle"];
  const rightDepthKeys = ["rightShoulder", "rightWrist", "rightHip", "rightAnkle"];
  const averageDepth = (keys) => {
    let total = 0;
    let count = 0;
    for (const key of keys) {
      const node = getGlbNodeByRigKey(key);
      if (!node) continue;
      const position = new THREE.Vector3();
      node.getWorldPosition(position);
      total += position.z;
      count += 1;
    }
    return count ? total / count : null;
  };
  const leftDepth = averageDepth(leftDepthKeys);
  const rightDepth = averageDepth(rightDepthKeys);
  if (Number.isFinite(leftDepth) && Number.isFinite(rightDepth)) {
    snapshot.sideDepth = {
      cameraForeground: "larger-z",
      leftZ: roundRigNumber(leftDepth),
      rightZ: roundRigNumber(rightDepth),
      zGap: roundRigNumber(leftDepth - rightDepth),
      foregroundSide: leftDepth > rightDepth ? "left" : "right",
    };
  }

  for (const segment of rigSegmentDefinitions) {
    const from = getGlbNodeByRigKey(segment.from);
    const to = getGlbNodeByRigKey(segment.to);
    if (!from || !to) continue;
    const fromWorld = new THREE.Vector3();
    const toWorld = new THREE.Vector3();
    from.getWorldPosition(fromWorld);
    to.getWorldPosition(toWorld);
    snapshot.segments[segment.key] = {
      from: from.name,
      to: to.name,
      distance: roundRigNumber(fromWorld.distanceTo(toWorld)),
      screenDistance: roundRigScreenDistance(fromWorld, toWorld),
      fromWorld: roundRigVector(fromWorld),
      toWorld: roundRigVector(toWorld),
    };
  }

  const ropeStart = new THREE.Vector3();
  const ropeEnd = new THREE.Vector3();
  const hasRope = state.hookActive || state.grappled;
  const shoulder = new THREE.Vector3();
  const elbow = new THREE.Vector3();
  const wrist = new THREE.Vector3();
  getRopeOrigin(ropeStart);
  if (state.grappled && state.anchor) {
    getVisualGrapplePoint(state.anchor, ropeEnd);
  } else {
    ropeEnd.copy(state.hookEnd);
  }

  const ropeDx = ropeEnd.x - ropeStart.x;
  const ropeDy = ropeEnd.y - ropeStart.y;
  const ropeLength = Math.hypot(ropeDx, ropeDy);
  if (state.hookActive || state.grappled) {
    snapshot.rope = {
      start: roundRigVector(ropeStart),
      end: roundRigVector(ropeEnd),
      length: roundRigNumber(ropeLength),
      angle: roundRigNumber(Math.atan2(ropeDy, ropeDx)),
    };
  }

  const shoulderPivot = glbCharacter.pivots.leftShoulder;
  const elbowPivot = glbCharacter.pivots.leftElbow;
  const wristPivot = glbCharacter.leftWristAnchor ?? glbCharacter.pivots.leftWrist;
  if (shoulderPivot && elbowPivot && wristPivot) {
    shoulderPivot.getWorldPosition(shoulder);
    elbowPivot.getWorldPosition(elbow);
    wristPivot.getWorldPosition(wrist);
    const armDx = wrist.x - shoulder.x;
    const armDy = wrist.y - shoulder.y;
    const armAngle = Math.atan2(armDy, armDx);
    const ropeFromShoulderAngle = hasRope
      ? Math.atan2(ropeEnd.y - shoulder.y, ropeEnd.x - shoulder.x)
      : null;
    const ropeAlignmentErrorDeg = hasRope
      ? THREE.MathUtils.radToDeg(normalizeAngle(armAngle - ropeFromShoulderAngle))
      : null;
    snapshot.leftArm = {
      shoulder: roundRigVector(shoulder),
      elbow: roundRigVector(elbow),
      wrist: roundRigVector(wrist),
      shoulderToWristAngle: roundRigNumber(armAngle),
      shoulderToRopeAngle: hasRope ? roundRigNumber(ropeFromShoulderAngle) : null,
      ropeAlignmentErrorDeg: hasRope ? roundRigNumber(ropeAlignmentErrorDeg, 2) : null,
      alignedToRope: hasRope ? Math.abs(ropeAlignmentErrorDeg) <= 6 : null,
    };

    if (snapshot.rope) {
      const pelvisPivot = glbCharacter.pivots.pelvis ?? glbCharacter.pivots.torso;
      const pelvis = new THREE.Vector3();
      pelvisPivot?.getWorldPosition(pelvis);
      snapshot.rope.originAttachment = getGlbRopeAttachment()?.name ?? null;
      snapshot.rope.originDistances = {
        leftWrist: roundRigNumber(ropeStart.distanceTo(wrist)),
        leftShoulder: roundRigNumber(ropeStart.distanceTo(shoulder)),
        pelvis: pelvisPivot ? roundRigNumber(ropeStart.distanceTo(pelvis)) : null,
      };
      snapshot.rope.originScreenDistances = {
        leftWrist: roundRigScreenDistance(ropeStart, wrist),
        leftShoulder: roundRigScreenDistance(ropeStart, shoulder),
        pelvis: pelvisPivot ? roundRigScreenDistance(ropeStart, pelvis) : null,
      };
    }
  }

  for (const side of ["left", "right"]) {
    const hipPivot = glbCharacter.pivots[`${side}Hip`];
    const kneePivot = glbCharacter.pivots[`${side}Knee`];
    const anklePivot = glbCharacter.pivots[`${side}Ankle`];
    if (!hipPivot || !kneePivot || !anklePivot) continue;

    const hip = new THREE.Vector3();
    const knee = new THREE.Vector3();
    const ankle = new THREE.Vector3();
    hipPivot.getWorldPosition(hip);
    kneePivot.getWorldPosition(knee);
    anklePivot.getWorldPosition(ankle);
    const thighAngle = Math.atan2(knee.y - hip.y, knee.x - hip.x);
    const shinAngle = Math.atan2(ankle.y - knee.y, ankle.x - knee.x);
    const bend = normalizeAngle(shinAngle - thighAngle);
    const facingBend = bend * (state.facing || 1);
    const bendDirection = Math.abs(THREE.MathUtils.radToDeg(bend)) < 4
      ? "neutral"
      : facingBend < 0
        ? "backward"
        : "forward";
    snapshot.legs[side] = {
      hip: roundRigVector(hip),
      knee: roundRigVector(knee),
      ankle: roundRigVector(ankle),
      thighAngle: roundRigNumber(thighAngle),
      shinAngle: roundRigNumber(shinAngle),
      kneeBendDeg: roundRigNumber(THREE.MathUtils.radToDeg(bend), 2),
      bendDirection,
      footForwardOfKnee: roundRigNumber((ankle.x - knee.x) * (state.facing || 1)),
    };
  }

  const pelvisAngle = glbCharacter.currentAngles.get(glbCharacter.pivots.pelvis ?? glbCharacter.pivots.torso) ?? 0;
  const waistAngle = glbCharacter.currentAngles.get(glbCharacter.pivots.waist) ?? 0;
  const chestAngle = glbCharacter.currentAngles.get(glbCharacter.pivots.chest) ?? 0;
  snapshot.torso = {
    pelvisDeg: roundRigNumber(THREE.MathUtils.radToDeg(pelvisAngle), 2),
    waistDeg: roundRigNumber(THREE.MathUtils.radToDeg(waistAngle), 2),
    chestDeg: roundRigNumber(THREE.MathUtils.radToDeg(chestAngle), 2),
    totalLeanDeg: roundRigNumber(THREE.MathUtils.radToDeg(pelvisAngle + waistAngle + chestAngle), 2),
  };

  if (snapshot.legs.left && snapshot.legs.right) {
    snapshot.swing = {
      legSeparationDeg: roundRigNumber(
        THREE.MathUtils.radToDeg(normalizeAngle(snapshot.legs.left.thighAngle - snapshot.legs.right.thighAngle)),
        2,
      ),
      speed: roundRigNumber(Math.hypot(state.velocity.x, state.velocity.y)),
      localVelocityX: roundRigNumber(state.velocity.x * (state.facing || 1)),
    };
  }

  if (glbCharacter.ribbonAnchor) {
    const topAnchor = getGlbRibbonWorldAnchor(0, new THREE.Vector3());
    const bottomAnchor = getGlbRibbonWorldAnchor(1, new THREE.Vector3());
    const topStart = getRibbonLineWorldPoint(ribbonLines.top, 0, new THREE.Vector3());
    const bottomStart = getRibbonLineWorldPoint(ribbonLines.bottom, 0, new THREE.Vector3());
    const anchorNode = new THREE.Vector3();
    glbCharacter.ribbonAnchor.getWorldPosition(anchorNode);
    snapshot.ribbon = {
      anchorNode: glbCharacter.ribbonAnchor.name,
      frozen: state.paused || state.animatorMode || state.inspectFrozen,
      visible: playerRibbonLayer.visible && ribbonLines.top.visible && ribbonLines.bottom.visible,
      nodeWorld: roundRigVector(anchorNode),
      topAnchor: topAnchor ? roundRigVector(topAnchor) : null,
      bottomAnchor: bottomAnchor ? roundRigVector(bottomAnchor) : null,
      topLineStart: topStart ? roundRigVector(topStart) : null,
      bottomLineStart: bottomStart ? roundRigVector(bottomStart) : null,
      screenDistances: {
        top: topAnchor && topStart ? roundRigScreenDistance(topAnchor, topStart) : null,
        bottom: bottomAnchor && bottomStart ? roundRigScreenDistance(bottomAnchor, bottomStart) : null,
      },
    };
  }

  const pelvisPivot = glbCharacter.pivots.pelvis ?? glbCharacter.pivots.torso;
  if (pelvisPivot) {
    const pelvis = new THREE.Vector3();
    pelvisPivot.getWorldPosition(pelvis);
    const compactTargets = {
      leftWrist: glbCharacter.leftWristAnchor ?? glbCharacter.pivots.leftWrist,
      rightWrist: glbCharacter.pivots.rightWrist,
      leftAnkle: glbCharacter.pivots.leftAnkle,
      rightAnkle: glbCharacter.pivots.rightAnkle,
      head: glbCharacter.pivots.head,
    };
    const distances = {};
    let compactRadius = 0;
    for (const [key, pivot] of Object.entries(compactTargets)) {
      if (!pivot) continue;
      const point = new THREE.Vector3();
      pivot.getWorldPosition(point);
      const distance = pelvis.distanceTo(point);
      distances[key] = roundRigNumber(distance);
      compactRadius = Math.max(compactRadius, distance);
    }
    const flourishProgress = state.flourishSpinRemaining > 0
      ? 1 - state.flourishSpinRemaining / config.flourishSpinDuration
      : 0;
    snapshot.flourish = {
      active: state.flourishSpinRemaining > 0,
      progress: roundRigNumber(flourishProgress),
      tuck: roundRigNumber(state.flourishSpinRemaining > 0 ? Math.sin(flourishProgress * Math.PI) : 0),
      compactRadius: roundRigNumber(compactRadius),
      distances,
    };
  }

  return snapshot;
}

function describeCharacterPoseHealth() {
  const snapshot = describeCharacterPoseSnapshot();
  const checks = [];
  const fail = (name, details = {}) => checks.push({ name, ok: false, ...details });
  const pass = (name, details = {}) => checks.push({ name, ok: true, ...details });

  if (snapshot.glbLoaded) {
    pass("glb-loaded", { poseMode: snapshot.poseMode });
  } else {
    fail("glb-loaded");
  }

  if (snapshot.hooked && snapshot.leftArm) {
    const error = Math.abs(snapshot.leftArm.ropeAlignmentErrorDeg ?? 999);
    if (error <= 6) {
      pass("left-arm-rope-alignment", { errorDeg: snapshot.leftArm.ropeAlignmentErrorDeg });
    } else {
      fail("left-arm-rope-alignment", { errorDeg: snapshot.leftArm.ropeAlignmentErrorDeg });
    }
  } else {
    pass("left-arm-rope-alignment", { skipped: "not hooked" });
  }

  if (snapshot.hooked && snapshot.rope?.originScreenDistances) {
    const wristDistance = snapshot.rope.originScreenDistances.leftWrist ?? 999;
    if (wristDistance <= 0.08) {
      pass("rope-origin-left-wrist", {
        attachment: snapshot.rope.originAttachment,
        screenDistance: wristDistance,
      });
    } else {
      fail("rope-origin-left-wrist", {
        attachment: snapshot.rope.originAttachment,
        screenDistance: wristDistance,
        screenDistances: snapshot.rope.originScreenDistances,
        distances: snapshot.rope.originDistances,
      });
    }
  } else {
    pass("rope-origin-left-wrist", { skipped: "not hooked" });
  }

  const forwardKnees = Object.entries(snapshot.legs)
    .filter(([, leg]) => leg.bendDirection === "forward" && Math.abs(leg.kneeBendDeg) > 8)
    .map(([side, leg]) => ({ side, bendDeg: leg.kneeBendDeg }));
  if (forwardKnees.length) {
    fail("knees-bend-backward", { forwardKnees });
  } else {
    pass("knees-bend-backward");
  }

  const measuredSegments = Object.keys(snapshot.segments ?? {});
  if (measuredSegments.length >= rigSegmentDefinitions.length - 1) {
    pass("rigid-segment-lengths-present", { count: measuredSegments.length });
  } else {
    fail("rigid-segment-lengths-present", {
      count: measuredSegments.length,
      expected: rigSegmentDefinitions.map((segment) => segment.key),
      measured: measuredSegments,
    });
  }

  if (snapshot.flourish?.active && snapshot.flourish.tuck > 0.75) {
    if (snapshot.flourish.compactRadius <= 1.35) {
      pass("flourish-tuck-compactness", { compactRadius: snapshot.flourish.compactRadius });
    } else {
      fail("flourish-tuck-compactness", { compactRadius: snapshot.flourish.compactRadius });
    }
  } else {
    pass("flourish-tuck-compactness", { skipped: "not mid-tuck" });
  }

  if (snapshot.ribbon) {
    const topDistance = snapshot.ribbon.screenDistances.top ?? 999;
    const bottomDistance = snapshot.ribbon.screenDistances.bottom ?? 999;
    if (topDistance <= 0.08 && bottomDistance <= 0.08) {
      pass("ribbon-anchor-attached", {
        anchor: snapshot.ribbon.anchorNode,
        topScreenDistance: topDistance,
        bottomScreenDistance: bottomDistance,
      });
    } else {
      fail("ribbon-anchor-attached", {
        anchor: snapshot.ribbon.anchorNode,
        distances: snapshot.ribbon.screenDistances,
        topAnchor: snapshot.ribbon.topAnchor,
        topLineStart: snapshot.ribbon.topLineStart,
        bottomAnchor: snapshot.ribbon.bottomAnchor,
        bottomLineStart: snapshot.ribbon.bottomLineStart,
      });
    }
  } else {
    fail("ribbon-anchor-attached", { reason: "missing ribbon_anchor diagnostic" });
  }

  return {
    ok: checks.every((check) => check.ok),
    checks,
    snapshot,
  };
}

function clampJoint(angle, min, max) {
  return THREE.MathUtils.clamp(angle, min, max);
}

const glbBindPoseAngles = {
  leftShoulder: 0,
  rightShoulder: 0,
  leftHip: 0,
  rightHip: 0,
  leftAnkle: 0,
  rightAnkle: 0,
};

let glbPoseSmoothingAlpha = 1;
const glbPoseAxes = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};
const glbPoseRotationScratch = new THREE.Quaternion();
const glbPoseTargetScratch = new THREE.Quaternion();
const glbPoseCalibrationVectorA = new THREE.Vector3();
const glbPoseCalibrationVectorB = new THREE.Vector3();

const glbJointLimits = {
  torso: [-0.32, 0.32],
  neck: [-0.24, 0.24],
  shoulder: [-2.45, 2.45],
  loadShoulder: [-2.95, 2.95],
  elbow: [-1.85, 1.85],
  loadElbow: [-1.65, 0.45],
  wrist: [-0.42, 0.42],
  hip: [-1.1, 1.32],
  knee: [-0.02, 1.35],
  ankle: [-0.48, 0.48],
};

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function localAngleTo(childPivot) {
  if (!childPivot) return -Math.PI / 2;
  return Math.atan2(childPivot.position.y, childPivot.position.x);
}

function localLengthTo(childPivot) {
  if (!childPivot) return 0.35;
  return Math.max(Math.hypot(childPivot.position.x, childPivot.position.y), 0.001);
}

function clampAngle(angle, [min, max]) {
  return THREE.MathUtils.clamp(normalizeAngle(angle), min, max);
}

function loadCharacterPoseReferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(characterPoseStorageKey));
    if (!stored || typeof stored !== "object") return {};
    return stored;
  } catch {
    localStorage.removeItem(characterPoseStorageKey);
    return {};
  }
}

function normalizeCharacterPoseAngles(angles = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(angles)) {
    if (!glbPivotNames[key] || !Number.isFinite(value)) continue;
    normalized[key] = Number(clampPoseAngle(key, value).toFixed(4));
  }
  return normalized;
}

function normalizeCharacterPoseLibrary(payload) {
  const rawPoses = payload?.poses && typeof payload.poses === "object"
    ? payload.poses
    : {};
  const poses = {};
  for (const [key, pose] of Object.entries(rawPoses)) {
    const angles = normalizeCharacterPoseAngles(pose?.angles);
    if (!Object.keys(angles).length) continue;
    poses[key] = {
      key,
      savedAt: typeof pose.savedAt === "string" ? pose.savedAt : null,
      source: typeof pose.source === "string" ? pose.source : "project",
      notes: typeof pose.notes === "string" ? pose.notes : "",
      angles,
    };
  }
  return poses;
}

function rebuildCharacterPoseReferences() {
  poseReferenceState.poses = {
    ...poseReferenceState.projectPoses,
    ...poseReferenceState.localPoses,
  };
}

async function loadProjectCharacterPoseReferences() {
  try {
    const response = await fetch(`${characterPoseProjectPath}?v=${characterPoseLibraryVersion}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    poseReferenceState.projectPoses = normalizeCharacterPoseLibrary(payload);
    poseReferenceState.projectLoaded = true;
    poseReferenceState.projectError = null;
    rebuildCharacterPoseReferences();
    syncAnimatorControls();
    updatePoseHandles();
  } catch (error) {
    poseReferenceState.projectLoaded = false;
    poseReferenceState.projectError = error?.message ?? String(error);
    console.warn("Could not load character pose reference library", poseReferenceState.projectError);
  }
}

function saveCharacterPoseReferences() {
  localStorage.setItem(characterPoseStorageKey, JSON.stringify(poseReferenceState.localPoses));
}

function getCurrentPoseReferenceKey() {
  return state.playerAnimation || resolvePlayerAnimationState();
}

function getPivotLimit(key) {
  if (key === "root" || key === "pelvis" || key === "waist" || key === "chest") return glbJointLimits.torso;
  if (key === "neck" || key === "head") return glbJointLimits.neck;
  if (key.includes("Shoulder")) return glbJointLimits.shoulder;
  if (key.includes("Elbow")) return glbJointLimits.elbow;
  if (key.includes("Wrist")) return glbJointLimits.wrist;
  if (key.includes("Hip")) return glbJointLimits.hip;
  if (key.includes("Knee")) return glbJointLimits.knee;
  if (key.includes("Ankle")) return glbJointLimits.ankle;
  return [-Math.PI, Math.PI];
}

function clampPoseAngle(key, angle) {
  return clampAngle(angle, getPivotLimit(key));
}

function getLoadedLeftArmAimOffset() {
  return config.glbLoadedArmAimOffset * (state.facing < 0 ? 0.4 : 1);
}

function captureCurrentGlbPoseAngles() {
  const angles = {};
  for (const [key, pivot] of Object.entries(glbCharacter.pivots)) {
    if (!pivot) continue;
    angles[key] = Number((glbCharacter.currentAngles.get(pivot) ?? 0).toFixed(4));
  }
  return angles;
}

function applyGlbPoseAngles(angles = {}, immediate = false) {
  for (const [key, angle] of Object.entries(angles)) {
    const pivot = glbCharacter.pivots[key];
    if (!pivot || !Number.isFinite(angle)) continue;
    setGlbPivotAngle(pivot, clampPoseAngle(key, angle), immediate);
  }
}

function getAuthoredPoseForCurrentState() {
  if (!config.useGlbCharacter || !poseReferenceState.poses) return null;
  return poseReferenceState.poses[getCurrentPoseReferenceKey()] ?? null;
}

function applyAuthoredPoseReference(immediate = false) {
  if (state.animatorMode) return;
  const pose = getAuthoredPoseForCurrentState();
  if (pose?.angles) applyGlbPoseAngles(pose.angles, immediate);
}

function createPoseHandles() {
  poseHandleLayer.clear();
  poseHandles.length = 0;
  for (const definition of poseHandleDefinitions) {
    const pivot = glbCharacter.pivots[definition.key];
    const driverPivot = glbCharacter.pivots[definition.driverKey];
    if (!pivot || !driverPivot) continue;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 14, 10),
      poseHandleMaterial.clone(),
    );
    mesh.name = `${definition.key}_pose_handle`;
    mesh.renderOrder = 96;
    mesh.frustumCulled = false;
    mesh.userData.poseHandle = definition;
    poseHandleLayer.add(mesh);
    poseHandles.push({ ...definition, mesh });
  }
}

function updatePoseHandles() {
  poseHandleLayer.visible = state.animatorMode && state.paused && glbCharacter.loaded;
  if (!poseHandleLayer.visible) return;
  for (const handle of poseHandles) {
    const pivot = glbCharacter.pivots[handle.key];
    if (!pivot) continue;
    pivot.getWorldPosition(handle.mesh.position);
    handle.mesh.position.z = 0.82;
    handle.mesh.material = state.draggedPoseHandle === handle
      ? poseHandleActiveMaterial
      : poseHandleMaterial;
    handle.mesh.visible = true;
  }
}

function syncAnimatorControls() {
  setIconButtonLabel(animateCharacterButton, state.animatorMode ? "Animating" : "Animate", "bone");
  setIconButtonLabel(savePoseButton, "Save pose", "save");
  setIconButtonLabel(resetPoseButton, "Reset pose", "rotate-ccw");
  setIconButtonLabel(exportPoseButton, "Download poses", "download");
  animateCharacterButton?.setAttribute("aria-pressed", String(state.animatorMode));
  animateCharacterButton?.classList.toggle("active", state.animatorMode);
}

function setAnimatorMode(enabled) {
  state.animatorMode = Boolean(enabled);
  if (state.animatorMode) {
    if (!state.paused) setPaused(true);
    releaseGrapple();
    const savedPose = getAuthoredPoseForCurrentState();
    state.manualPoseAngles = savedPose?.angles
      ? { ...savedPose.angles }
      : captureCurrentGlbPoseAngles();
    applyGlbPoseAngles(state.manualPoseAngles, true);
  } else {
    state.draggedPoseHandle = null;
    state.manualPoseAngles = {};
  }
  syncAnimatorControls();
  updatePoseHandles();
}

function saveCurrentCharacterPose() {
  if (!glbCharacter.loaded) return;
  const key = getCurrentPoseReferenceKey();
  const angles = state.animatorMode
    ? { ...state.manualPoseAngles, ...captureCurrentGlbPoseAngles() }
    : captureCurrentGlbPoseAngles();
  poseReferenceState.localPoses[key] = {
    key,
    savedAt: new Date().toISOString(),
    source: "local_animator_override",
    angles: normalizeCharacterPoseAngles(angles),
  };
  rebuildCharacterPoseReferences();
  state.manualPoseAngles = { ...poseReferenceState.poses[key].angles };
  saveCharacterPoseReferences();
  syncAnimatorControls();
}

function resetCurrentCharacterPoseReference() {
  const key = getCurrentPoseReferenceKey();
  delete poseReferenceState.localPoses[key];
  rebuildCharacterPoseReferences();
  const fallbackPose = poseReferenceState.poses[key];
  state.manualPoseAngles = fallbackPose?.angles ? { ...fallbackPose.angles } : {};
  if (fallbackPose?.angles) {
    applyGlbPoseAngles(fallbackPose.angles, true);
  } else {
    resetGlbPivotAngles();
  }
  saveCharacterPoseReferences();
  syncAnimatorControls();
  updatePoseHandles();
}

function createCharacterPoseReferenceLibrary() {
  const poses = {};
  for (const key of Object.keys(poseReferenceState.poses).sort()) {
    const pose = poseReferenceState.poses[key];
    const source = poseReferenceState.localPoses[key] ? "local_override" : "project";
    poses[key] = {
      key,
      savedAt: pose.savedAt ?? null,
      source,
      notes: pose.notes ?? "",
      angles: normalizeCharacterPoseAngles(pose.angles),
    };
  }
  return {
    version: characterPoseLibraryVersion,
    updatedAt: new Date().toISOString(),
    model: config.glbCharacterPath,
    poseMode: config.glbPoseMode,
    note: "Committed Sling pose references. Browser-local poses override project poses while authoring.",
    poses,
  };
}

function downloadCharacterPoseReferences() {
  const text = `${JSON.stringify(createCharacterPoseReferenceLibrary(), null, 2)}\n`;
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "character_pose_references.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function pickPoseHandle(event) {
  if (!state.animatorMode || !state.paused || !glbCharacter.loaded) return null;
  updatePointer(event);
  const hits = raycaster.intersectObjects(poseHandles.map((handle) => handle.mesh), false);
  if (!hits.length) return null;
  const definition = hits[0].object.userData.poseHandle;
  return poseHandles.find((handle) => handle.key === definition.key) ?? null;
}

function startPoseHandleDrag(event) {
  const handle = pickPoseHandle(event);
  if (!handle) return false;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  state.draggedPoseHandle = handle;
  updatePoseHandles();
  return true;
}

function dragPoseHandle(event) {
  const handle = state.draggedPoseHandle;
  if (!handle) return false;

  event.preventDefault();
  const driverPivot = glbCharacter.pivots[handle.driverKey];
  const handlePivot = glbCharacter.pivots[handle.key];
  if (!driverPivot || !handlePivot) return true;

  const origin = characterScratchA;
  const current = characterScratchB;
  driverPivot.getWorldPosition(origin);
  handlePivot.getWorldPosition(current);
  const target = updatePointerOnViewPlane(event, current, characterScratchC);
  const currentAngle = Math.atan2(current.y - origin.y, current.x - origin.x);
  const targetAngle = Math.atan2(target.y - origin.y, target.x - origin.x);
  if (!Number.isFinite(currentAngle) || !Number.isFinite(targetAngle)) return true;

  const currentDriverAngle = state.manualPoseAngles[handle.driverKey]
    ?? glbCharacter.currentAngles.get(driverPivot)
    ?? 0;
  state.manualPoseAngles[handle.driverKey] = clampPoseAngle(
    handle.driverKey,
    currentDriverAngle + normalizeAngle(targetAngle - currentAngle),
  );
  applyGlbPoseAngles(state.manualPoseAngles, true);
  updatePoseHandles();
  return true;
}

function stopPoseHandleDrag(event) {
  if (!state.draggedPoseHandle) return false;
  state.draggedPoseHandle = null;
  updatePoseHandles();
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  return true;
}

function solveTwoBoneAngles(targetX, targetY, upperLength, lowerLength, bendSign = 1) {
  const minDistance = Math.max(Math.abs(upperLength - lowerLength) + 0.001, 0.001);
  const maxDistance = Math.max(upperLength + lowerLength - 0.001, minDistance);
  const distance = THREE.MathUtils.clamp(Math.hypot(targetX, targetY), minDistance, maxDistance);
  const direction = Math.atan2(targetY, targetX);
  const shoulderSpread = Math.acos(THREE.MathUtils.clamp(
    (upperLength * upperLength + distance * distance - lowerLength * lowerLength) / (2 * upperLength * distance),
    -1,
    1,
  ));
  const upperAngle = direction + bendSign * shoulderSpread;
  const elbowX = Math.cos(upperAngle) * upperLength;
  const elbowY = Math.sin(upperAngle) * upperLength;
  const lowerAngle = Math.atan2(targetY - elbowY, targetX - elbowX);
  return { upperAngle, lowerAngle };
}

function setGlbTwoBonePose({
  rootPivot,
  midPivot,
  endPivot,
  upperName,
  lowerName,
  targetX,
  targetY,
  parentWorldAngle = 0,
  bendSign = 1,
  upperLimit,
  lowerLimit,
}) {
  if (!rootPivot || !midPivot || !endPivot) return { upperWorld: -Math.PI / 2, lowerWorld: -Math.PI / 2 };
  const upperRestAngle = getGlbRestScreenAngle(upperName, midPivot);
  const lowerRestAngle = getGlbRestScreenAngle(lowerName, endPivot);
  const upperLength = localLengthTo(midPivot);
  const lowerLength = localLengthTo(endPivot);
  const solution = solveTwoBoneAngles(targetX, targetY, upperLength, lowerLength, bendSign);
  const upperRotation = clampAngle(solution.upperAngle - parentWorldAngle - upperRestAngle, upperLimit);
  const upperWorld = parentWorldAngle + upperRestAngle + upperRotation;
  const lowerRotation = clampAngle(solution.lowerAngle - upperWorld - lowerRestAngle, lowerLimit);
  const lowerWorld = upperWorld + lowerRestAngle + lowerRotation;
  setGlbPivotAngle(rootPivot, glbBindPoseAngles[upperName] + upperRotation);
  setGlbPivotAngle(midPivot, lowerRotation);
  return { upperWorld, lowerWorld };
}

function setGlbAlignedTwoBonePose({
  rootPivot,
  midPivot,
  endPivot,
  upperName,
  lowerName,
  targetAngle,
  parentWorldAngle = 0,
  jointBend = 0,
  upperLimit,
  lowerLimit,
  immediate = false,
}) {
  if (!rootPivot || !midPivot || !endPivot) return { upperWorld: targetAngle, lowerWorld: targetAngle };
  const upperRestAngle = getGlbRestScreenAngle(upperName, midPivot);
  const lowerRestAngle = getGlbRestScreenAngle(lowerName, endPivot);
  const upperRotation = clampAngle(targetAngle - parentWorldAngle - upperRestAngle, upperLimit);
  const upperWorld = parentWorldAngle + upperRestAngle + upperRotation;
  const lowerRotation = clampAngle(targetAngle + jointBend - upperWorld - lowerRestAngle, lowerLimit);
  const lowerWorld = upperWorld + lowerRestAngle + lowerRotation;
  setGlbPivotAngle(rootPivot, glbBindPoseAngles[upperName] + upperRotation, immediate);
  setGlbPivotAngle(midPivot, lowerRotation, immediate);
  return { upperWorld, lowerWorld };
}

function setGlbLegSwingPose(pivots, {
  hooked,
  airborne,
  swingFlow,
  swingArcLift,
  fallTuck,
  tuck,
  ropeX,
}) {
  const swingAmount = Math.abs(swingFlow);
  let trail = 0;
  let leftHip = 0.02;
  let rightHip = -0.015;
  let leftKnee = -0.02;
  let rightKnee = -0.02;
  let leftAnkle = -0.02;
  let rightAnkle = 0.02;

  if (hooked) {
    trail = clampJoint(-swingFlow * 0.46 - ropeX * 0.1 + swingArcLift * 0.12, -0.52, 0.52);
    const kneeFlex = clampJoint(0.12 + swingAmount * 0.34 + Math.max(0, fallTuck) * 0.14, 0.06, 0.62);
    leftHip = trail + 0.1;
    rightHip = trail - 0.09;
    leftKnee = kneeFlex;
    rightKnee = kneeFlex * 0.82;
    leftAnkle = clampJoint(-trail * 0.18 + kneeFlex * 0.12, -0.26, 0.26);
    rightAnkle = clampJoint(-trail * 0.14 + kneeFlex * 0.1, -0.24, 0.24);
  } else if (airborne) {
    trail = clampJoint(-swingFlow * 0.38 + swingArcLift * 0.2, -0.55, 0.55);
    const kneeFlex = clampJoint(0.1 + Math.max(0, fallTuck) * 0.28, 0.04, 0.48);
    leftHip = trail + 0.1;
    rightHip = trail - 0.08;
    leftKnee = kneeFlex;
    rightKnee = kneeFlex * 0.75;
    leftAnkle = clampJoint(-trail * 0.2 + kneeFlex * 0.12, -0.26, 0.26);
    rightAnkle = clampJoint(-trail * 0.16 + kneeFlex * 0.1, -0.24, 0.24);
  }

  if (tuck > 0) {
    const compact = THREE.MathUtils.smootherstep(tuck, 0, 1);
    leftHip = THREE.MathUtils.lerp(leftHip, 1.3, compact);
    rightHip = THREE.MathUtils.lerp(rightHip, 1.24, compact);
    leftKnee = THREE.MathUtils.lerp(leftKnee, 1.34, compact);
    rightKnee = THREE.MathUtils.lerp(rightKnee, 1.32, compact);
    leftAnkle = THREE.MathUtils.lerp(leftAnkle, 0.44, compact);
    rightAnkle = THREE.MathUtils.lerp(rightAnkle, 0.42, compact);
  }

  setGlbPivotAngle(pivots.leftHip, clampAngle(leftHip, glbJointLimits.hip));
  setGlbPivotAngle(pivots.rightHip, clampAngle(rightHip, glbJointLimits.hip));
  setGlbPivotAngle(pivots.leftKnee, clampAngle(leftKnee, glbJointLimits.knee));
  setGlbPivotAngle(pivots.rightKnee, clampAngle(rightKnee, glbJointLimits.knee));
  setGlbPivotAngle(pivots.leftAnkle, clampAngle(leftAnkle, glbJointLimits.ankle));
  setGlbPivotAngle(pivots.rightAnkle, clampAngle(rightAnkle, glbJointLimits.ankle));

  return { leftAnkleWorld: leftHip + leftKnee, rightAnkleWorld: rightHip + rightKnee };
}

function setGlbIdlePose(pivots, idleBreath, pelvisWorld, waistWorld, chestWorld) {
  setGlbPivotAngle(pivots.root, 0);
  setGlbPivotAngle(pivots.pelvis ?? pivots.torso, pelvisWorld);
  setGlbPivotAngle(pivots.waist, clampAngle(waistWorld - pelvisWorld, glbJointLimits.torso));
  setGlbPivotAngle(pivots.chest, clampAngle(chestWorld - waistWorld, glbJointLimits.torso));
  setGlbPivotAngle(pivots.neck, clampAngle(-chestWorld * 0.28, glbJointLimits.neck));
  setGlbPivotAngle(pivots.head, clampAngle(-chestWorld * 0.36 + idleBreath * 0.01, glbJointLimits.neck));
  setGlbPivotAngle(pivots.leftShoulder, 0);
  setGlbPivotAngle(pivots.leftElbow, 0);
  setGlbPivotAngle(pivots.leftWrist, 0);
  setGlbPivotAngle(pivots.rightShoulder, 0);
  setGlbPivotAngle(pivots.rightElbow, 0);
  setGlbPivotAngle(pivots.rightWrist, 0);
  setGlbPivotAngle(pivots.leftHip, 0);
  setGlbPivotAngle(pivots.leftKnee, 0);
  setGlbPivotAngle(pivots.leftAnkle, 0);
  setGlbPivotAngle(pivots.rightHip, 0);
  setGlbPivotAngle(pivots.rightKnee, 0);
  setGlbPivotAngle(pivots.rightAnkle, 0);
}

function setGlbRelativePose(now) {
  const pivots = glbCharacter.pivots;
  const idleBreath = state.playerAnimation === "idleHang" ? Math.sin(now * 3.2) : 0;
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  const localVelocityX = state.velocity.x * state.facing;
  const localVelocityY = state.velocity.y;
  const speedLean = clampJoint(localVelocityX * 0.012, -0.18, 0.22);
  const verticalLean = clampJoint(localVelocityY * 0.008, -0.14, 0.14);
  const airborne = state.hasLaunched && !state.grounded && !state.gameOver && !state.finished;
  const hooked = state.hookActive && (state.anchor || state.hookEnd);
  const grappling = state.grappled && state.anchor;
  const fallTuck = clampJoint(-state.velocity.y / 20, -0.2, 0.45);
  const swing = clampJoint(localVelocityX / 20, -0.55, 0.65);
  const flourishProgress = state.flourishSpinRemaining > 0
    ? 1 - state.flourishSpinRemaining / config.flourishSpinDuration
    : 0;
  const tuck = state.flourishSpinRemaining > 0 ? Math.sin(flourishProgress * Math.PI) : 0;
  const rollTuck = state.flourishSpinRemaining > 0 ? THREE.MathUtils.smootherstep(tuck, 0, 1) : 0;

  const pelvis = speedLean * 0.22 - verticalLean * 0.12;
  const waist = speedLean * 0.28 - verticalLean * 0.22 + idleBreath * 0.01;
  const chest = speedLean * 0.34 - verticalLean * 0.28 + idleBreath * 0.014;

  setGlbPivotAngle(pivots.root, 0);
  const pelvisWorld = clampAngle(THREE.MathUtils.lerp(pelvis, 0.24, rollTuck), glbJointLimits.torso);
  const waistWorld = clampAngle(THREE.MathUtils.lerp(waist, -0.1, rollTuck), glbJointLimits.torso);
  const chestWorld = clampAngle(THREE.MathUtils.lerp(chest, -0.24, rollTuck), glbJointLimits.torso);
  setGlbPivotAngle(pivots.pelvis ?? pivots.torso, pelvisWorld);
  setGlbPivotAngle(pivots.waist, clampAngle(waistWorld - pelvisWorld, glbJointLimits.torso));
  setGlbPivotAngle(pivots.chest, clampAngle(chestWorld - waistWorld, glbJointLimits.torso));
  setGlbPivotAngle(pivots.neck, clampAngle(-chestWorld * 0.28, glbJointLimits.neck));
  setGlbPivotAngle(pivots.head, clampAngle(-chestWorld * 0.36 + idleBreath * 0.01, glbJointLimits.neck));

  if (!state.hasLaunched || state.grounded || state.playerAnimation === "idleHang") {
    setGlbIdlePose(pivots, idleBreath, pelvisWorld, waistWorld, chestWorld);
    return;
  }

  const ropeTarget = hooked
    ? (grappling ? getVisualGrapplePoint(state.anchor, scratchRopeEnd) : state.hookEnd)
    : null;
  let ropeDirectionWorld = ropeTarget
    ? scratchVelocityDirection.subVectors(ropeTarget, state.player).normalize()
    : scratchVelocityDirection.set(0.2 * state.facing, -0.98, 0).normalize();
  const shoulderWorld = characterScratchA;
  if (hooked && ropeTarget && pivots.leftShoulder) {
    playerMesh.updateWorldMatrix(true, true);
    pivots.leftShoulder.getWorldPosition(shoulderWorld);
    ropeDirectionWorld = scratchVelocityDirection.subVectors(ropeTarget, shoulderWorld);
    if (ropeDirectionWorld.lengthSq() > 0.0001) {
      ropeDirectionWorld.normalize();
    } else {
      ropeDirectionWorld.set(0.2 * state.facing, 0.98, 0).normalize();
    }
  }
  let ropeDirectionLocal = characterScratchB.copy(ropeDirectionWorld);
  if (hooked && ropeTarget && pivots.leftShoulder && playerAssetRoot) {
    const localTarget = characterScratchB.copy(ropeTarget);
    const localShoulder = characterScratchC.copy(shoulderWorld);
    playerAssetRoot.worldToLocal(localTarget);
    playerAssetRoot.worldToLocal(localShoulder);
    ropeDirectionLocal = localTarget.sub(localShoulder);
    if (ropeDirectionLocal.lengthSq() > 0.0001) {
      ropeDirectionLocal.normalize();
    } else {
      ropeDirectionLocal.set(0.2, 0.98, 0).normalize();
    }
  } else {
    ropeDirectionLocal.set(ropeDirectionWorld.x * state.facing, ropeDirectionWorld.y, 0).normalize();
  }
  const ropeX = ropeDirectionLocal.x;
  const ropeY = ropeDirectionLocal.y;
  const worldTangentX = -ropeDirectionWorld.y;
  const worldTangentY = ropeDirectionWorld.x;
  const tangentSpeed = state.velocity.x * worldTangentX + state.velocity.y * worldTangentY;
  const swingFlow = clampJoint(tangentSpeed / 22, -1, 1);
  const swingArcLift = clampJoint(state.velocity.y / 18, -0.45, 0.45);
  const leftArmLength = localLengthTo(pivots.leftElbow) + localLengthTo(pivots.leftWrist);
  const rightArmLength = localLengthTo(pivots.rightElbow) + localLengthTo(pivots.rightWrist);

  let leftHandTarget = {
    x: -0.04 + idleBreath * 0.01,
    y: -leftArmLength * 0.92,
    bend: 1,
  };
  let rightHandTarget = {
    x: 0.14 - swing * 0.18,
    y: -rightArmLength * 0.72 + idleBreath * 0.025,
    bend: -1,
  };

  if (hooked) {
    leftHandTarget = {
      x: ropeX * leftArmLength * 0.99,
      y: ropeY * leftArmLength * 0.99,
      bend: 0,
    };
    const balanceReach = clampJoint(Math.abs(swingFlow), 0, 1);
    rightHandTarget = {
      x: -ropeX * 0.18 - swingFlow * 0.34 - 0.12,
      y: -rightArmLength * (0.5 + fallTuck * 0.12) + ropeY * 0.14 + balanceReach * 0.08,
      bend: -1,
    };
  } else if (airborne) {
    leftHandTarget = { x: 0.14 + swing * 0.12, y: -leftArmLength * 0.68 + fallTuck * 0.08, bend: 1 };
    rightHandTarget = { x: -0.2 - swing * 0.14, y: -rightArmLength * 0.62 + fallTuck * 0.08, bend: -1 };
  } else if (speed > 0.5) {
    const stride = Math.sin(now * 8.5) * clampJoint(speed / 20, 0, 0.28);
    leftHandTarget.x += stride * 0.12;
    rightHandTarget.x -= stride * 0.12;
  }

  if (tuck > 0) {
    const compact = THREE.MathUtils.smootherstep(tuck, 0, 1);
    leftHandTarget = { x: 0.04, y: -leftArmLength * (0.24 - compact * 0.11), bend: 1 };
    rightHandTarget = { x: -0.04, y: -rightArmLength * (0.24 - compact * 0.11), bend: -1 };
  }

  const ropeAngle = Math.atan2(ropeY, ropeX);
  const leftArm = hooked
    ? setGlbAlignedTwoBonePose({
      rootPivot: pivots.leftShoulder,
      midPivot: pivots.leftElbow,
      endPivot: pivots.leftWrist,
      upperName: "leftShoulder",
      lowerName: "leftElbow",
      targetAngle: ropeAngle + getLoadedLeftArmAimOffset(),
      parentWorldAngle: chestWorld,
      jointBend: 0,
      upperLimit: glbJointLimits.loadShoulder,
      lowerLimit: glbJointLimits.loadElbow,
      immediate: true,
    })
    : setGlbTwoBonePose({
      rootPivot: pivots.leftShoulder,
      midPivot: pivots.leftElbow,
      endPivot: pivots.leftWrist,
      upperName: "leftShoulder",
      lowerName: "leftElbow",
      targetX: leftHandTarget.x,
      targetY: leftHandTarget.y,
      parentWorldAngle: chestWorld,
      bendSign: leftHandTarget.bend,
      upperLimit: glbJointLimits.shoulder,
      lowerLimit: glbJointLimits.elbow,
    });
  const rightArm = setGlbTwoBonePose({
    rootPivot: pivots.rightShoulder,
    midPivot: pivots.rightElbow,
    endPivot: pivots.rightWrist,
    upperName: "rightShoulder",
    lowerName: "rightElbow",
    targetX: rightHandTarget.x,
    targetY: rightHandTarget.y,
    parentWorldAngle: chestWorld,
    bendSign: rightHandTarget.bend,
    upperLimit: glbJointLimits.shoulder,
    lowerLimit: glbJointLimits.elbow,
  });
  setGlbLegSwingPose(pivots, {
    hooked,
    airborne,
    swingFlow,
    swingArcLift,
    fallTuck,
    tuck,
    ropeX,
  });

  setGlbPivotAngle(pivots.leftWrist, hooked
    ? clampAngle(ropeAngle - leftArm.lowerWorld, glbJointLimits.wrist)
    : 0,
  hooked);
  setGlbPivotAngle(pivots.rightWrist, clampAngle(-rightArm.lowerWorld * 0.08, glbJointLimits.wrist));
}

function setGlbRagdollLitePose(now) {
  const pivots = glbCharacter.pivots;
  const idleBreath = !state.hasLaunched || state.grounded ? Math.sin(now * 3.2) : 0;
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  const localVelocityX = state.velocity.x * state.facing;
  const localVelocityY = state.velocity.y;
  const airborne = state.hasLaunched && !state.grounded && !state.gameOver && !state.finished;
  const hooked = state.hookActive && (state.anchor || state.hookEnd);
  const grappling = state.grappled && state.anchor;
  const fallAmount = THREE.MathUtils.clamp(-localVelocityY / 18, 0, 1);
  const riseAmount = THREE.MathUtils.clamp(localVelocityY / 18, 0, 1);
  const speedAmount = THREE.MathUtils.clamp(speed / 28, 0, 1);
  const flourishProgress = state.flourishSpinRemaining > 0
    ? 1 - state.flourishSpinRemaining / config.flourishSpinDuration
    : 0;
  const tuck = state.flourishSpinRemaining > 0 ? Math.sin(flourishProgress * Math.PI) : 0;
  const rollTuck = state.flourishSpinRemaining > 0 ? THREE.MathUtils.smootherstep(tuck, 0, 1) : 0;

  if (!airborne && !hooked) {
    setGlbIdlePose(pivots, idleBreath, 0, idleBreath * 0.012, idleBreath * 0.018);
    return;
  }

  const ropeTarget = hooked
    ? (grappling ? getVisualGrapplePoint(state.anchor, scratchRopeEnd) : state.hookEnd)
    : null;
  let ropeDirectionWorld = ropeTarget
    ? scratchVelocityDirection.subVectors(ropeTarget, state.player).normalize()
    : scratchVelocityDirection.set(localVelocityX || 0.2, localVelocityY || -1, 0).normalize();
  const shoulderWorld = characterScratchA;
  if (hooked && ropeTarget && pivots.leftShoulder) {
    playerMesh.updateWorldMatrix(true, true);
    pivots.leftShoulder.getWorldPosition(shoulderWorld);
    ropeDirectionWorld = scratchVelocityDirection.subVectors(ropeTarget, shoulderWorld);
    if (ropeDirectionWorld.lengthSq() > 0.0001) {
      ropeDirectionWorld.normalize();
    } else {
      ropeDirectionWorld.set(0.2 * state.facing, 0.98, 0).normalize();
    }
  }

  let ropeDirectionLocal = characterScratchB.copy(ropeDirectionWorld);
  if (hooked && ropeTarget && pivots.leftShoulder && playerAssetRoot) {
    const localTarget = characterScratchB.copy(ropeTarget);
    const localShoulder = characterScratchC.copy(shoulderWorld);
    playerAssetRoot.worldToLocal(localTarget);
    playerAssetRoot.worldToLocal(localShoulder);
    ropeDirectionLocal = localTarget.sub(localShoulder);
    if (ropeDirectionLocal.lengthSq() > 0.0001) {
      ropeDirectionLocal.normalize();
    } else {
      ropeDirectionLocal.set(0.2, 0.98, 0).normalize();
    }
  } else {
    ropeDirectionLocal.set(ropeDirectionWorld.x * state.facing, ropeDirectionWorld.y, 0).normalize();
  }

  const ropeX = ropeDirectionLocal.x;
  const ropeY = ropeDirectionLocal.y;
  const worldTangentX = -ropeDirectionWorld.y;
  const worldTangentY = ropeDirectionWorld.x;
  const tangentSpeed = state.velocity.x * worldTangentX + state.velocity.y * worldTangentY;
  const swingFlow = hooked
    ? clampJoint(tangentSpeed / 20, -1, 1)
    : clampJoint(localVelocityX / 22, -1, 1);
  const gravitySag = clampJoint(fallAmount * 0.36 - riseAmount * 0.18, -0.24, 0.46);
  const motionLean = clampJoint(-swingFlow * 0.3 + localVelocityX * 0.006, -0.46, 0.46);
  const tensionLean = hooked ? clampJoint(-ropeX * 0.2 + ropeY * 0.12, -0.28, 0.28) : 0;
  const basePelvisWorld = motionLean * 0.28 + gravitySag * 0.14;
  const baseWaistWorld = motionLean * 0.42 + gravitySag * 0.22 + tensionLean * 0.62;
  const baseChestWorld = motionLean * 0.86 + gravitySag * 0.42 + tensionLean * 1.35;
  const pelvisWorld = clampAngle(THREE.MathUtils.lerp(basePelvisWorld, 0.24, rollTuck), glbJointLimits.torso);
  const waistWorld = clampAngle(THREE.MathUtils.lerp(baseWaistWorld, -0.1, rollTuck), glbJointLimits.torso);
  const chestWorld = clampAngle(THREE.MathUtils.lerp(baseChestWorld, -0.24, rollTuck), glbJointLimits.torso);

  setGlbPivotAngle(pivots.root, 0);
  setGlbPivotAngle(pivots.pelvis ?? pivots.torso, pelvisWorld);
  setGlbPivotAngle(pivots.waist, clampAngle(waistWorld - pelvisWorld, glbJointLimits.torso));
  setGlbPivotAngle(pivots.chest, clampAngle(chestWorld - waistWorld, glbJointLimits.torso));
  setGlbPivotAngle(pivots.neck, clampAngle(-chestWorld * 0.22 + gravitySag * 0.08, glbJointLimits.neck));
  setGlbPivotAngle(pivots.head, clampAngle(-chestWorld * 0.28 + idleBreath * 0.01, glbJointLimits.neck));

  const leftArmLength = localLengthTo(pivots.leftElbow) + localLengthTo(pivots.leftWrist);
  const rightArmLength = localLengthTo(pivots.rightElbow) + localLengthTo(pivots.rightWrist);
  let leftArm = { upperWorld: -Math.PI / 2, lowerWorld: -Math.PI / 2 };
  if (hooked) {
    const ropeAngle = Math.atan2(ropeY, ropeX);
    leftArm = setGlbAlignedTwoBonePose({
      rootPivot: pivots.leftShoulder,
      midPivot: pivots.leftElbow,
      endPivot: pivots.leftWrist,
      upperName: "leftShoulder",
      lowerName: "leftElbow",
      targetAngle: ropeAngle + getLoadedLeftArmAimOffset(),
      parentWorldAngle: chestWorld,
      jointBend: 0,
      upperLimit: glbJointLimits.loadShoulder,
      lowerLimit: glbJointLimits.loadElbow,
      immediate: true,
    });
    setGlbPivotAngle(pivots.leftWrist, clampAngle(ropeAngle - leftArm.lowerWorld, glbJointLimits.wrist), true);
  } else {
    leftArm = setGlbTwoBonePose({
      rootPivot: pivots.leftShoulder,
      midPivot: pivots.leftElbow,
      endPivot: pivots.leftWrist,
      upperName: "leftShoulder",
      lowerName: "leftElbow",
      targetX: clampJoint(THREE.MathUtils.lerp(0.08 + swingFlow * 0.16, 0.04, rollTuck), -0.28, 0.34),
      targetY: -leftArmLength * THREE.MathUtils.lerp(0.68 + fallAmount * 0.1, 0.13, rollTuck),
      parentWorldAngle: chestWorld,
      bendSign: 1,
      upperLimit: glbJointLimits.shoulder,
      lowerLimit: glbJointLimits.elbow,
    });
    setGlbPivotAngle(pivots.leftWrist, clampAngle(-leftArm.lowerWorld * 0.06, glbJointLimits.wrist));
  }

  const balanceReach = Math.abs(swingFlow);
  const rightArm = setGlbTwoBonePose({
    rootPivot: pivots.rightShoulder,
    midPivot: pivots.rightElbow,
    endPivot: pivots.rightWrist,
    upperName: "rightShoulder",
    lowerName: "rightElbow",
    targetX: clampJoint(THREE.MathUtils.lerp(-swingFlow * 0.56 - ropeX * 0.22, -0.04, rollTuck), -0.62, 0.52),
    targetY: -rightArmLength * THREE.MathUtils.lerp(0.56 + fallAmount * 0.14 - balanceReach * 0.12, 0.13, rollTuck),
    parentWorldAngle: chestWorld,
    bendSign: -1,
    upperLimit: glbJointLimits.shoulder,
    lowerLimit: glbJointLimits.elbow,
  });
  setGlbPivotAngle(pivots.rightWrist, clampAngle(-rightArm.lowerWorld * 0.08, glbJointLimits.wrist));

  let legTrail = clampJoint(-swingFlow * 0.82 + (fallAmount - riseAmount) * 0.16, -1.05, 1.05);
  let kneeFlex = clampJoint(0.1 + speedAmount * 0.2 + fallAmount * 0.22 + Math.abs(swingFlow) * 0.18, 0.05, 0.94);
  const legSplit = hooked
    ? clampJoint(-swingFlow * 0.34 + ropeX * 0.08, -0.34, 0.34)
    : clampJoint(
      localVelocityX * 0.022 + fallAmount * 0.08 * Math.sign(localVelocityX || state.facing || 1),
      -0.36,
      0.36,
    );
  let leftHip = legTrail + 0.12 + legSplit * 0.5;
  let rightHip = legTrail - 0.14 - legSplit * 0.5;
  let leftKnee = clampJoint(kneeFlex * (1 + legSplit * 0.28), 0.04, 1.02);
  let rightKnee = clampJoint(kneeFlex * (0.84 - legSplit * 0.22), 0.04, 0.96);
  let leftAnkle = clampJoint(-legTrail * 0.22 + kneeFlex * 0.08 - legSplit * 0.08, -0.36, 0.36);
  let rightAnkle = clampJoint(-legTrail * 0.18 + kneeFlex * 0.08 + legSplit * 0.08, -0.36, 0.36);

  if (tuck > 0) {
    const compact = THREE.MathUtils.smootherstep(tuck, 0, 1);
    leftHip = THREE.MathUtils.lerp(leftHip, 1.3, compact);
    rightHip = THREE.MathUtils.lerp(rightHip, 1.24, compact);
    leftKnee = THREE.MathUtils.lerp(leftKnee, 1.34, compact);
    rightKnee = THREE.MathUtils.lerp(rightKnee, 1.32, compact);
    leftAnkle = THREE.MathUtils.lerp(leftAnkle, 0.44, compact);
    rightAnkle = THREE.MathUtils.lerp(rightAnkle, 0.42, compact);
  }

  setGlbPivotAngle(pivots.leftHip, clampAngle(leftHip, glbJointLimits.hip));
  setGlbPivotAngle(pivots.rightHip, clampAngle(rightHip, glbJointLimits.hip));
  setGlbPivotAngle(pivots.leftKnee, clampAngle(leftKnee, glbJointLimits.knee));
  setGlbPivotAngle(pivots.rightKnee, clampAngle(rightKnee, glbJointLimits.knee));
  setGlbPivotAngle(pivots.leftAnkle, clampAngle(leftAnkle, glbJointLimits.ankle));
  setGlbPivotAngle(pivots.rightAnkle, clampAngle(rightAnkle, glbJointLimits.ankle));
}

function lineAngle(line, startIndex = 0, endIndex = 1) {
  const positions = line.geometry.attributes.position;
  const ax = positions.getX(startIndex);
  const ay = positions.getY(startIndex);
  const bx = positions.getX(endIndex);
  const by = positions.getY(endIndex);
  return Math.atan2(by - ay, bx - ax);
}

function poseGlbCharacterFromPhysics(now, dt = config.physicsStep) {
  if (!glbCharacter.loaded) return;

  if (state.animatorMode) {
    glbPoseSmoothingAlpha = 1;
    applyGlbPoseAngles(state.manualPoseAngles, true);
    return;
  }

  if (dt <= 0 && (state.paused || state.inspectFrozen)) {
    glbPoseSmoothingAlpha = 1;
    return;
  }

  if (config.debugGlbNeutralOnly) {
    resetGlbPivotAngles();
    return;
  }

  if (config.glbPoseMode === "ragdollLite") {
    const smoothingRate = state.hookActive || state.grappled
      ? config.glbPoseSmoothing * 1.25
      : config.glbPoseSmoothing * 0.9;
    glbPoseSmoothingAlpha = 1 - Math.exp(-Math.max(dt, 0.001) * smoothingRate);
    setGlbRagdollLitePose(now);
    glbPoseSmoothingAlpha = 1;
    return;
  }

  if (config.glbPoseMode === "stable" || (config.stableGlbPose && config.glbPoseMode !== "relative")) {
    resetGlbPivotAngles();
    return;
  }

  const smoothingRate = state.hookActive || state.grappled
    ? config.glbPoseSmoothing
    : config.glbPoseSmoothing * 0.72;
  glbPoseSmoothingAlpha = 1 - Math.exp(-Math.max(dt, 0.001) * smoothingRate);
  if (config.useRestRelativeGlbPose) {
    setGlbRelativePose(now);
    applyAuthoredPoseReference();
    glbPoseSmoothingAlpha = 1;
    return;
  }

  resetGlbPivotAngles(false);
  glbPoseSmoothingAlpha = 1;
}

function applyCharacterRimMaterial(material) {
  if (!material || material.userData?.hookedRimLight) return;

  material.userData.hookedRimLight = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHookedRimColor = { value: new THREE.Color(config.characterRimColor) };
    shader.uniforms.uHookedRimDirection = { value: config.characterRimLightDirection.clone() };
    shader.uniforms.uHookedRimIntensity = { value: config.characterRimIntensity };
    shader.uniforms.uHookedRimPower = { value: config.characterRimPower };

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        [
          "#include <common>",
          "uniform vec3 uHookedRimColor;",
          "uniform vec3 uHookedRimDirection;",
          "uniform float uHookedRimIntensity;",
          "uniform float uHookedRimPower;",
        ].join("\n"),
      )
      .replace(
        "vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;",
        [
          "vec3 hookedRimNormal = normalize(normal);",
          "vec3 hookedRimLight = normalize(uHookedRimDirection);",
          "float hookedDirectional = pow(max(dot(hookedRimNormal, hookedRimLight), 0.0), uHookedRimPower);",
          "float hookedEdge = pow(1.0 - abs(dot(hookedRimNormal, normalize(vViewPosition))), 1.45);",
          "float hookedUpperBias = smoothstep(-0.15, 0.85, hookedRimNormal.y);",
          "vec3 hookedRim = uHookedRimColor * hookedDirectional * (0.45 + hookedEdge * 0.9) * (0.35 + hookedUpperBias * 0.65) * uHookedRimIntensity;",
          "vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance + hookedRim;",
        ].join("\n"),
      );
  };
}

function loadGlbCharacter() {
  if (!config.useGlbCharacter) return;

  const loader = new GLTFLoader();
  loader.load(
    `${config.glbCharacterPath}?v=${encodeURIComponent(GAME_VERSION)}`,
    (gltf) => {
      const model = gltf.scene;
      model.name = "M Blender character";
      model.rotation.set(0, 0, 0);
      model.position.set(0, 0, 0);
      model.renderOrder = 36;
      glbCharacter.pivots = {};
      glbCharacter.pivotKeys = new Map();
      glbCharacter.pivotCalibration = new Map();
      glbCharacter.leftWristAnchor = null;
      glbCharacter.ribbonAnchor = null;
      glbCharacter.debugMarkers = [];
      glbCharacter.restQuaternions = new Map();
      glbCharacter.currentAngles = new Map();
      glbCharacter.skinnedMeshCount = 0;
      glbCharacter.animationClipNames = gltf.animations.map((clip) => clip.name || "(unnamed)");
      model.traverse((child) => {
        child.frustumCulled = false;
        child.renderOrder = 36;
        if (child.isSkinnedMesh) {
          glbCharacter.skinnedMeshCount += 1;
        }
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          for (const material of materials) {
            material.transparent = true;
            material.opacity = 1;
            material.depthTest = false;
            material.depthWrite = false;
            applyCharacterRimMaterial(material);
            material.needsUpdate = true;
          }
        }
        if (child.name === "left_wrist_anchor") glbCharacter.leftWristAnchor = child;
        if (child.name === "ribbon_anchor") glbCharacter.ribbonAnchor = child;
        for (const [key, name] of Object.entries(glbPivotNames)) {
          if (child.name === name) {
            glbCharacter.pivots[key] = child;
            glbCharacter.pivotKeys.set(child, key);
            glbCharacter.restQuaternions.set(child, child.quaternion.clone());
            const marker = createGlbDebugMarker(name);
            child.add(marker);
            glbCharacter.debugMarkers.push(marker);
          }
        }
      });
      for (const anchor of [glbCharacter.leftWristAnchor, glbCharacter.ribbonAnchor]) {
        if (!anchor) continue;
        glbCharacter.restQuaternions.set(anchor, anchor.quaternion.clone());
        const marker = createGlbDebugMarker(anchor.name);
        anchor.add(marker);
        glbCharacter.debugMarkers.push(marker);
      }
      playerAssetRoot.clear();
      playerAssetRoot.add(model);
      glbCharacter.loaded = true;
      glbCharacter.group = model;
      createPoseHandles();
      resetGlbPivotAngles();
      syncGlbCharacterTransform();
      syncCharacterSourceVisibility();
      updatePoseHandles();
      console.info("Hooked GLB character loaded", {
        path: config.glbCharacterPath,
        skinnedMeshes: glbCharacter.skinnedMeshCount,
        animations: glbCharacter.animationClipNames,
      });
    },
    undefined,
    () => {
      glbCharacter.loaded = false;
      syncCharacterSourceVisibility();
    },
  );
}

function createRibbonLine(name, color, opacity, pointCount = 12) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: pointCount }, () => new THREE.Vector3())),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      linewidth: 4,
      depthTest: false,
    }),
  );
  line.name = name;
  line.renderOrder = 54;
  line.frustumCulled = false;
  playerRibbonLayer.add(line);
  return line;
}

function setRibbonLine(line, points, z = 0.1) {
  const positions = line.geometry.attributes.position;
  let lastPoint = points[0] ?? [0, 0];
  for (let index = 0; index < positions.count; index += 1) {
    lastPoint = points[index] ?? lastPoint;
    positions.setXYZ(index, lastPoint[0], lastPoint[1], z);
  }
  positions.needsUpdate = true;
}

const ribbonLines = {
  top: createRibbonLine("ribbonTop", 0xff3b24, 0.96, 12),
  bottom: createRibbonLine("ribbonBottom", 0x8f1410, 0.92, 12),
  topShadow: createRibbonLine("ribbonTopShadow", 0x220706, 0.72, 12),
  bottomShadow: createRibbonLine("ribbonBottomShadow", 0x220706, 0.64, 12),
};

function getGlbRibbonWorldAnchor(index, target) {
  if (!glbCharacter.loaded || !glbCharacter.ribbonAnchor) return null;
  glbCharacter.ribbonAnchor.getWorldPosition(target);
  target.x -= ribbonAnchorBackOffset * state.facing;
  target.x += (index === 0 ? -0.03 : 0.03) * state.facing;
  target.y += ribbonAnchorLiftOffset - index * 0.046;
  target.z = state.player.z;
  return target;
}

const ribbonPhysics = [
  {
    points: Array.from({ length: 12 }, (_, index) => new THREE.Vector3(-0.27, 0.9 - index * 0.13, 0)),
    previous: Array.from({ length: 12 }, (_, index) => new THREE.Vector3(-0.27, 0.9 - index * 0.13, 0)),
    segmentLength: 0.13,
  },
  {
    points: Array.from({ length: 12 }, (_, index) => new THREE.Vector3(-0.25, 0.82 - index * 0.125, 0)),
    previous: Array.from({ length: 12 }, (_, index) => new THREE.Vector3(-0.25, 0.82 - index * 0.125, 0)),
    segmentLength: 0.125,
  },
];

function resetRibbonPhysics() {
  for (const [ribbonIndex, ribbon] of ribbonPhysics.entries()) {
    const anchor = (
      getGlbRibbonWorldAnchor(ribbonIndex, new THREE.Vector3())
      ?? new THREE.Vector3(
        state.player.x - 0.26 * state.facing,
        state.player.y + 0.9 - ribbonIndex * 0.08,
        0,
      )
    );
    for (let index = 0; index < ribbon.points.length; index += 1) {
      const point = ribbon.points[index].set(
        anchor.x - (0.02 + index * 0.018) * state.facing,
        anchor.y - index * ribbon.segmentLength * ribbonLengthScale,
        0,
      );
      ribbon.previous[index].copy(point);
    }
  }
}

function getFxProfile() {
  return fxQualityProfiles[fxQualitySettings.level] ?? fxQualityProfiles.medium;
}

function syncFxQualityControls() {
  const profile = getFxProfile();
  config.fxQuality = fxQualitySettings.level;
  if (fxQualitySelect) fxQualitySelect.value = fxQualitySettings.level;
  for (const [index, layer] of ropeEnergyWrapLayers.entries()) {
    layer.mesh.visible = layer.mesh.visible && index < profile.ropeLayerLimit;
  }
  for (const [index, arc] of anchorPlasmaArcs.entries()) {
    arc.mesh.visible = arc.mesh.visible && index < profile.anchorArcLimit;
  }
  syncEditorPane();
}

function saveFxQualitySettings() {
  localStorage.setItem(fxQualityStorageKey, JSON.stringify(fxQualitySettings));
}

function loadFxQualitySettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(fxQualityStorageKey));
    if (stored && fxQualityProfiles[stored.level]) fxQualitySettings.level = stored.level;
  } catch {
    localStorage.removeItem(fxQualityStorageKey);
  } finally {
    syncFxQualityControls();
  }
}

function setFxQuality(level) {
  fxQualitySettings.level = fxQualityProfiles[level] ? level : "medium";
  saveFxQualitySettings();
  syncFxQualityControls();
}

function getPixelateZoomScale() {
  const zoomRatio = config.pixelateReferenceZoom / Math.max(camera.position.z, 0.001);
  return THREE.MathUtils.clamp(
    Math.pow(zoomRatio, config.pixelateZoomScalePower),
    config.pixelateMinZoomScale,
    config.pixelateMaxZoomScale,
  );
}

function getEffectivePixelateIntensity() {
  return THREE.MathUtils.clamp(pixelateSettings.intensity * getPixelateZoomScale(), 0, 1);
}

function getPixelateBlockSize(intensity = getEffectivePixelateIntensity()) {
  let blockSize = Math.floor(THREE.MathUtils.lerp(1, config.pixelateMaxBlockSize, intensity));
  if (blockSize > 1 && blockSize % 2 > 0) blockSize += 1;
  return THREE.MathUtils.clamp(blockSize, 1, config.pixelateMaxBlockSize);
}

function getPixelatePlaneBlockSize(blockSize, plane, amount) {
  const maxScale = plane === "background"
    ? 1.3
    : plane === "midground"
      ? 1.24
      : plane === "gameplay"
        ? 1.16
        : 1.1;
  const planeSize = Math.round(blockSize * THREE.MathUtils.lerp(0.28, maxScale, amount));
  return THREE.MathUtils.clamp(planeSize, 1, config.pixelateMaxBlockSize);
}

function updatePixelatePass() {
  const effectiveIntensity = getEffectivePixelateIntensity();
  const blockSize = getPixelateBlockSize(effectiveIntensity);
  pixelatePass.enabled = pixelateSettings.enabled;
  pixelatePass.uniforms.intensity.value = effectiveIntensity;
  pixelatePass.uniforms.pixelSize.value = blockSize;
  pixelatePass.uniforms.backgroundBoost.value = 1.3;
  pixelatePass.uniforms.edgeBlur.value = THREE.MathUtils.lerp(0.38, 0.86, effectiveIntensity);
  pixelatePass.uniforms.foregroundDetail.value = THREE.MathUtils.lerp(0.12, 0.28, effectiveIntensity);
  pixelatePass.uniforms.layerPixelMix.value.set(
    pixelateSettings.planes.foreground,
    pixelateSettings.planes.gameplay,
    pixelateSettings.planes.midground,
    pixelateSettings.planes.background,
  );
  if (pixelateIntensityValue) {
    pixelateIntensityValue.textContent = `${pixelateSettings.intensity.toFixed(2)} / ${blockSize}px`;
  }
  for (const key of pixelatePlaneKeys) {
    const output = pixelatePlaneValues[key];
    if (!output) continue;
    const planeAmount = pixelateSettings.planes[key];
    const planeSize = getPixelatePlaneBlockSize(blockSize, key, planeAmount);
    output.textContent = `${planeAmount.toFixed(2)} / ${planeSize}px`;
  }
}

function syncPixelateControls() {
  updatePixelatePass();
  if (pixelateToggleButton) {
    setIconButtonLabel(pixelateToggleButton, pixelateSettings.enabled ? "Pixelate on" : "Pixelate off", "scan-line");
    pixelateToggleButton.setAttribute("aria-pressed", String(pixelateSettings.enabled));
  }
  if (pixelateIntensityInput) pixelateIntensityInput.value = String(pixelateSettings.intensity);
  for (const key of pixelatePlaneKeys) {
    if (pixelatePlaneInputs[key]) pixelatePlaneInputs[key].value = String(pixelateSettings.planes[key]);
  }
  syncEditorPane();
}

function syncAudioControls() {
  editorUi.sfxMuted = sfx.settings.sfxMuted;
  editorUi.sfxVolume = sfx.settings.sfxVolume;
  editorUi.musicMuted = sfx.settings.musicMuted;
  editorUi.musicVolume = sfx.settings.musicVolume;

  if (muteButton) {
    setIconButtonLabel(muteButton, sfx.settings.masterMuted ? "" : "", sfx.settings.masterMuted ? "volume-x" : "volume-2");
    muteButton.setAttribute("aria-label", sfx.settings.masterMuted ? "Unmute audio" : "Mute audio");
    muteButton.setAttribute("aria-pressed", String(sfx.settings.masterMuted));
  }
  if (sfxMuteButton) {
    setIconButtonLabel(sfxMuteButton, sfx.settings.sfxMuted ? "SFX off" : "SFX on", sfx.settings.sfxMuted ? "volume-x" : "volume-2");
    sfxMuteButton.setAttribute("aria-pressed", String(sfx.settings.sfxMuted));
  }
  if (musicMuteButton) {
    setIconButtonLabel(musicMuteButton, sfx.settings.musicMuted ? "Music off" : "Music on", sfx.settings.musicMuted ? "volume-x" : "music-2");
    musicMuteButton.setAttribute("aria-pressed", String(sfx.settings.musicMuted));
  }
  if (sfxVolumeInput) sfxVolumeInput.value = String(sfx.settings.sfxVolume);
  if (musicVolumeInput) musicVolumeInput.value = String(sfx.settings.musicVolume);
  if (sfxVolumeValue) sfxVolumeValue.textContent = `${Math.round(sfx.settings.sfxVolume * 100)}%`;
  if (musicVolumeValue) musicVolumeValue.textContent = `${Math.round(sfx.settings.musicVolume * 100)}%`;
  syncEditorPane();
}

function setSfxMuted(muted) {
  sfx.setSfxMuted(muted);
  syncAudioControls();
}

function setMusicMuted(muted) {
  sfx.setMusicMuted(muted);
  syncAudioControls();
}

function setMasterMuted(muted) {
  sfx.setMasterMuted(muted);
  syncAudioControls();
}

function setSfxVolume(value) {
  sfx.setSfxVolume(value);
  syncAudioControls();
}

function setMusicVolume(value) {
  sfx.setMusicVolume(value);
  syncAudioControls();
}

function syncEditorPane() {
  if (!tweakPane || syncingEditorPane) return;

  editorUi.paused = state.paused;
  editorUi.level = currentLevelId;
  editorUi.objectType = objectTypeSelect?.value ?? editorUi.objectType;
  editorUi.zoom = Math.round(camera.position.z);
  editorUi.pixelate = pixelateSettings.enabled;
  editorUi.pixelateIntensity = pixelateSettings.intensity;
  editorUi.pixelateForeground = pixelateSettings.planes.foreground;
  editorUi.pixelateGameplay = pixelateSettings.planes.gameplay;
  editorUi.pixelateMidground = pixelateSettings.planes.midground;
  editorUi.pixelateBackground = pixelateSettings.planes.background;
  editorUi.fxQuality = fxQualitySettings.level;
  editorUi.sfxMuted = sfx.settings.sfxMuted;
  editorUi.sfxVolume = sfx.settings.sfxVolume;
  editorUi.musicMuted = sfx.settings.musicMuted;
  editorUi.musicVolume = sfx.settings.musicVolume;

  syncingEditorPane = true;
  for (const binding of tweakPaneBindings) binding.refresh?.();
  syncingEditorPane = false;
}

function addTweakBinding(container, object, key, options, onChange) {
  const binding = container.addBinding(object, key, options);
  tweakPaneBindings.push(binding);
  binding.on("change", (event) => {
    if (syncingEditorPane) return;
    onChange(event.value);
    syncEditorPane();
  });
  return binding;
}

async function initializeEditorPane() {
  if (!editorPane || tweakPane) return;

  let PaneConstructor = null;
  try {
    ({ Pane: PaneConstructor } = await import("https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js"));
  } catch {
    editorPane.classList.add("hidden");
    return;
  }

  tweakPane = new PaneConstructor({
    container: editorPane,
    title: "Build Tools",
  });
  editorPanel?.classList.add("has-tweakpane");

  const levelOptions = {};
  for (const [levelId, preset] of Object.entries(levelPresets)) {
    levelOptions[preset.label] = levelId;
  }

  addTweakBinding(tweakPane, editorUi, "paused", { label: "Build mode" }, (value) => setPaused(value));
  addTweakBinding(tweakPane, editorUi, "level", { label: "Level", options: levelOptions }, (value) => {
    applyLevel(value, { preserveSavedLayout: true });
  });
  addTweakBinding(
    tweakPane,
    editorUi,
    "objectType",
    {
      label: "Object",
      options: {
        Anchor: "anchor",
        "Slow ring": "slowmo",
        Obstacle: "hazard",
        "Score ring": "bonus",
        Finish: "finish",
      },
    },
    (value) => {
      if (objectTypeSelect) objectTypeSelect.value = value;
    },
  );

  const objectFolder = tweakPane.addFolder({ title: "Objects" });
  objectFolder.addButton({ title: "Add selected" }).on("click", () => addEditorObject());
  objectFolder.addButton({ title: "Remove selected" }).on("click", () => removeSelectedEditorObject());
  objectFolder.addButton({ title: "Reset layout" }).on("click", () => {
    resetEditorLayout();
    reset();
    setPaused(true);
  });

  const viewFolder = tweakPane.addFolder({ title: "View" });
  addTweakBinding(
    viewFolder,
    editorUi,
    "zoom",
    { label: "Zoom", min: config.buildMinZoom, max: config.buildMaxZoom, step: 1 },
    (value) => setBuildZoom(value),
  );
  viewFolder.addButton({ title: "Birds eye" }).on("click", () => {
    fitBuildViewToStage();
    syncEditorPane();
  });

  const animatorFolder = tweakPane.addFolder({ title: "Animator" });
  animatorFolder.addButton({ title: "Animate" }).on("click", () => {
    setAnimatorMode(!state.animatorMode);
    syncEditorPane();
  });
  animatorFolder.addButton({ title: "Save pose" }).on("click", () => {
    saveCurrentCharacterPose();
    syncEditorPane();
  });
  animatorFolder.addButton({ title: "Reset pose" }).on("click", () => {
    resetCurrentCharacterPoseReference();
    syncEditorPane();
  });
  animatorFolder.addButton({ title: "Download poses" }).on("click", () => {
    downloadCharacterPoseReferences();
    syncEditorPane();
  });

  const shaderFolder = tweakPane.addFolder({ title: "Pixel Shader" });
  addTweakBinding(shaderFolder, editorUi, "pixelate", { label: "Enabled" }, (value) => setPixelateEnabled(value));
  addTweakBinding(
    shaderFolder,
    editorUi,
    "pixelateIntensity",
    { label: "Intensity", min: 0, max: 1, step: 0.01 },
    (value) => setPixelateIntensity(value),
  );
  addTweakBinding(
    shaderFolder,
    editorUi,
    "pixelateForeground",
    { label: "Foreground", min: 0, max: 1, step: 0.01 },
    (value) => setPixelatePlaneIntensity("foreground", value),
  );
  addTweakBinding(
    shaderFolder,
    editorUi,
    "pixelateGameplay",
    { label: "Play area", min: 0, max: 1, step: 0.01 },
    (value) => setPixelatePlaneIntensity("gameplay", value),
  );
  addTweakBinding(
    shaderFolder,
    editorUi,
    "pixelateMidground",
    { label: "Midground", min: 0, max: 1, step: 0.01 },
    (value) => setPixelatePlaneIntensity("midground", value),
  );
  addTweakBinding(
    shaderFolder,
    editorUi,
    "pixelateBackground",
    { label: "Background", min: 0, max: 1, step: 0.01 },
    (value) => setPixelatePlaneIntensity("background", value),
  );

  const effectsFolder = tweakPane.addFolder({ title: "Effects" });
  addTweakBinding(
    effectsFolder,
    editorUi,
    "fxQuality",
    {
      label: "FX quality",
      options: {
        High: "high",
        Medium: "medium",
        Low: "low",
      },
    },
    (value) => setFxQuality(value),
  );

  const audioFolder = tweakPane.addFolder({ title: "Audio" });
  addTweakBinding(audioFolder, editorUi, "sfxMuted", { label: "Mute SFX" }, (value) => setSfxMuted(value));
  addTweakBinding(
    audioFolder,
    editorUi,
    "sfxVolume",
    { label: "SFX volume", min: 0, max: 1, step: 0.01 },
    (value) => setSfxVolume(value),
  );
  addTweakBinding(audioFolder, editorUi, "musicMuted", { label: "Mute music" }, (value) => setMusicMuted(value));
  addTweakBinding(
    audioFolder,
    editorUi,
    "musicVolume",
    { label: "Music volume", min: 0, max: 1, step: 0.01 },
    (value) => setMusicVolume(value),
  );

  syncEditorPane();
  setPaused(state.paused);
}

function savePixelateSettings() {
  localStorage.setItem(pixelateSettingsStorageKey, JSON.stringify(pixelateSettings));
}

function loadPixelateSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(pixelateSettingsStorageKey));
    if (!stored || typeof stored !== "object") return;
    if (typeof stored.enabled === "boolean") pixelateSettings.enabled = stored.enabled;
    if (Number.isFinite(stored.intensity)) {
      pixelateSettings.intensity = THREE.MathUtils.clamp(stored.intensity, 0, 1);
    }
    if (stored.planes && typeof stored.planes === "object") {
      for (const key of pixelatePlaneKeys) {
        if (Number.isFinite(stored.planes[key])) {
          pixelateSettings.planes[key] = THREE.MathUtils.clamp(stored.planes[key], 0, 1);
        }
      }
    }
  } catch {
    localStorage.removeItem(pixelateSettingsStorageKey);
  } finally {
    syncPixelateControls();
  }
}

function setPixelateEnabled(enabled) {
  pixelateSettings.enabled = enabled;
  savePixelateSettings();
  syncPixelateControls();
}

function setPixelateIntensity(value) {
  pixelateSettings.intensity = THREE.MathUtils.clamp(Number(value), 0, 1);
  savePixelateSettings();
  syncPixelateControls();
}

function setPixelatePlaneIntensity(plane, value) {
  if (!pixelatePlaneKeys.includes(plane)) return;
  pixelateSettings.planes[plane] = THREE.MathUtils.clamp(Number(value), 0, 1);
  savePixelateSettings();
  syncPixelateControls();
}

const crashPieces = [];
const crashPieceMaterial = new THREE.MeshBasicMaterial({
  color: 0x1dd6b7,
  transparent: true,
  opacity: 1,
  depthTest: false,
});
for (let index = 0; index < config.crashExplosionPieces; index += 1) {
  const piece = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 + (index % 3) * 0.08, 0.18 + (index % 2) * 0.1, 0.08),
    crashPieceMaterial.clone(),
  );
  piece.visible = false;
  piece.renderOrder = 31;
  addGameplay(piece);
  crashPieces.push({
    mesh: piece,
    velocity: new THREE.Vector3(),
    spin: (index % 2 ? -1 : 1) * (5.5 + index * 0.34),
  });
}

const jeremyFireworks = [];
const fireworkColors = ["#e4f24b", "#ff9f36", "#23e7ff", "#ff3d8f", "#f7fff8"];
let nextJeremyParticle = 0;
let nextJeremyBurstAt = 0;
if (gameVersionEl) gameVersionEl.textContent = GAME_VERSION;
if (jeremyFireworksEl) {
  for (let index = 0; index < 96; index += 1) {
    const element = document.createElement("span");
    element.className = "firework-particle";
    jeremyFireworksEl.append(element);
    jeremyFireworks.push({
      element,
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      rotation: 0,
      spin: 0,
      life: 0,
      maxLife: 1,
      size: 1,
    });
  }
}

function spawnJeremyFirework(x, y) {
  if (!jeremyFireworks.length) return;

  const count = 16 + Math.floor(Math.random() * 12);
  for (let index = 0; index < count; index += 1) {
    const particle = jeremyFireworks[nextJeremyParticle];
    nextJeremyParticle = (nextJeremyParticle + 1) % jeremyFireworks.length;
    const angle = (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.34;
    const speed = 88 + Math.random() * 128;
    particle.x = x;
    particle.y = y;
    particle.velocityX = Math.cos(angle) * speed;
    particle.velocityY = Math.sin(angle) * speed - 46 - Math.random() * 36;
    particle.rotation = Math.random() * 360;
    particle.spin = (Math.random() - 0.5) * 560;
    particle.life = 0.62 + Math.random() * 0.58;
    particle.maxLife = particle.life;
    particle.size = 3 + Math.random() * 5;
    particle.element.style.setProperty("--spark-color", fireworkColors[(index + Math.floor(Math.random() * fireworkColors.length)) % fireworkColors.length]);
    particle.element.style.width = `${particle.size}px`;
    particle.element.style.height = `${particle.size}px`;
    particle.element.style.opacity = "1";
    particle.element.style.transform = `translate3d(${particle.x}px, ${particle.y}px, 0)`;
  }
}

function launchJeremyFireworks(now, force = false) {
  if (!jeremyFireworksEl || (now < nextJeremyBurstAt && !force)) return;
  const width = jeremyFireworksEl.clientWidth || 420;
  const height = jeremyFireworksEl.clientHeight || 340;
  const x = width * (0.18 + Math.random() * 0.64);
  const y = height * (0.16 + Math.random() * 0.38);
  spawnJeremyFirework(x, y);
  nextJeremyBurstAt = now + 0.28 + Math.random() * 0.42;
}

function updateJeremyFireworks(dt, now) {
  if (!jeremyFireworks.length) return;
  if (state.levelCompleteShown) launchJeremyFireworks(now);

  for (const particle of jeremyFireworks) {
    if (particle.life <= 0) continue;
    particle.life = Math.max(0, particle.life - dt);
    particle.velocityY += 320 * dt;
    particle.velocityX *= Math.pow(0.72, dt);
    particle.velocityY *= Math.pow(0.86, dt);
    particle.x += particle.velocityX * dt;
    particle.y += particle.velocityY * dt;
    particle.rotation += particle.spin * dt;
    const fade = particle.life / particle.maxLife;
    const scale = 0.45 + fade * 0.9;
    particle.element.style.opacity = String(THREE.MathUtils.clamp(fade * fade, 0, 1));
    particle.element.style.transform = `translate3d(${particle.x}px, ${particle.y}px, 0) rotate(${particle.rotation}deg) scale(${scale})`;
  }
}

function resetJeremyFireworks() {
  nextJeremyBurstAt = 0;
  for (const particle of jeremyFireworks) {
    particle.life = 0;
    particle.element.style.opacity = "0";
    particle.element.style.transform = "translate3d(-999px, -999px, 0)";
  }
}

const ropeMeshMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  depthTest: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    uPulse: { value: 0 },
    uOpacity: { value: 0.96 },
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = uv;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}",
  ].join("\n"),
  fragmentShader: [
    "varying vec2 vUv;",
    "uniform float uTime;",
    "uniform float uPulse;",
    "uniform float uOpacity;",
    "float hash(vec2 p) {",
    "  p = fract(p * vec2(123.34, 456.21));",
    "  p += dot(p, p + 45.32);",
    "  return fract(p.x * p.y);",
    "}",
    "void main() {",
    "  vec2 pixelUv = floor(vUv * vec2(88.0, 520.0)) / vec2(88.0, 520.0);",
    "  float row = floor(vUv.y * 520.0 - uTime * 24.0);",
    "  float col = floor(vUv.x * 88.0);",
    "  float cell = hash(vec2(col, row));",
    "  float rowFlicker = hash(vec2(row, floor(uTime * 10.0)));",
    "  float centerStep = (hash(vec2(floor(row / 7.0), 17.0)) - 0.5) * 0.018;",
    "  float d = abs((pixelUv.x - 0.5) - centerStep) * 2.0;",
    "  float halo = 1.0 - smoothstep(0.18, 0.96, d);",
    "  float shaft = 1.0 - smoothstep(0.18, 0.5 + cell * 0.035, d);",
    "  float core = 1.0 - smoothstep(0.0, 0.07, d);",
    "  float lightDot = step(0.74, cell) * shaft;",
    "  float darkDot = step(cell, 0.18) * shaft * (1.0 - core * 0.65);",
    "  float scan = step(0.9, rowFlicker) * shaft;",
    "  float verticalCut = step(0.92, hash(vec2(col * 2.0 + floor(uTime * 9.0), row))) * shaft;",
    "  float missing = step(0.985, cell) * (1.0 - core);",
    "  float pulse = 0.94 + step(0.78, rowFlicker) * 0.14 + uPulse * 0.32;",
    "  vec3 blue = vec3(0.0, 0.72, 1.0);",
    "  vec3 cyan = vec3(0.18, 0.9, 1.0);",
    "  vec3 pale = vec3(0.72, 0.98, 1.0);",
    "  vec3 white = vec3(1.0);",
    "  vec3 color = mix(blue, cyan, halo);",
    "  color = mix(color, pale, shaft * 0.64 + lightDot * 0.24);",
    "  color = mix(color, white, clamp(core + scan * 0.55 + verticalCut * 0.28, 0.0, 1.0));",
    "  float grain = lightDot * 0.2 - darkDot * 0.18;",
    "  float alpha = (halo * 0.3 + shaft * (0.36 + grain) + core * 0.86 + scan * 0.16 + verticalCut * 0.1) * (1.0 - missing * 0.42) * uOpacity * pulse;",
    "  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));",
    "}",
  ].join("\n"),
});
const ropeMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1), ropeMeshMaterial);
ropeMesh.visible = false;
ropeMesh.renderOrder = 21;
addGameplay(ropeMesh);
const ropeLine = ropeMesh;

const failedGrappleChainPoints = Array.from(
  { length: config.failedGrappleChainSegments },
  () => new THREE.Vector3(),
);
const failedGrappleChainPrevious = Array.from(
  { length: config.failedGrappleChainSegments },
  () => new THREE.Vector3(),
);
const failedGrappleChainGeometry = new THREE.BufferGeometry();
failedGrappleChainGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(new Float32Array(config.failedGrappleChainSegments * 3), 3),
);
const failedGrappleChainLine = new THREE.Line(
  failedGrappleChainGeometry,
  new THREE.LineBasicMaterial({
    color: 0x9fdcff,
    transparent: true,
    opacity: 0.74,
    depthTest: false,
  }),
);
failedGrappleChainLine.visible = false;
failedGrappleChainLine.frustumCulled = false;
failedGrappleChainLine.renderOrder = 24;
addGameplay(failedGrappleChainLine);

const ropeCrackleGeometry = new THREE.BufferGeometry();
ropeCrackleGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(new Float32Array(config.ropeCracklePoints * 3), 3),
);
const ropeCrackleLine = new THREE.Line(
  ropeCrackleGeometry,
  new THREE.LineBasicMaterial({
    color: 0xdfffff,
    transparent: true,
    opacity: 0,
    depthTest: false,
  }),
);
ropeCrackleLine.visible = false;
ropeCrackleLine.frustumCulled = false;
ropeCrackleLine.renderOrder = 25;
addGameplay(ropeCrackleLine);

const ropeVisualCurveGeometry = new THREE.BufferGeometry();
ropeVisualCurveGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(new Float32Array(config.ropeVisualCurvePoints * 3), 3),
);
const ropeVisualCurveLine = new THREE.Line(
  ropeVisualCurveGeometry,
  new THREE.LineBasicMaterial({
    color: 0xbff8ff,
    transparent: true,
    opacity: 0.68,
    depthTest: false,
  }),
);
ropeVisualCurveLine.visible = false;
ropeVisualCurveLine.frustumCulled = false;
ropeVisualCurveLine.renderOrder = 28;
addGameplay(ropeVisualCurveLine);

function createRopeStripGeometry(pointCount) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(pointCount * 2 * 3);
  const indices = [];
  for (let index = 0; index < pointCount - 1; index += 1) {
    const vertex = index * 2;
    indices.push(vertex, vertex + 1, vertex + 2);
    indices.push(vertex + 1, vertex + 3, vertex + 2);
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

function createRopeEnergyWrapLayer({ color, opacity, width, phase, amplitude = 1, frequency = 1, renderOrder = 26 }) {
  const geometry = createRopeStripGeometry(config.ropeEnergyWrapPoints);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  mesh.visible = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = renderOrder;
  addGameplay(mesh);
  return { mesh, geometry, opacity, width, phase, amplitude, frequency };
}

const ropeEnergyCenters = Array.from(
  { length: config.ropeEnergyWrapPoints },
  () => new THREE.Vector3(),
);
const ropeEnergyWrapLayers = [
  createRopeEnergyWrapLayer({
    color: 0x42dfff,
    opacity: 0.34,
    width: config.ropeEnergyWrapGlowWidth,
    phase: 0,
    amplitude: 1,
    frequency: 1,
    renderOrder: 26,
  }),
  createRopeEnergyWrapLayer({
    color: 0xffffff,
    opacity: 0.92,
    width: config.ropeEnergyWrapCoreWidth,
    phase: 0,
    amplitude: 1,
    frequency: 1,
    renderOrder: 27,
  }),
  createRopeEnergyWrapLayer({
    color: 0x9df8ff,
    opacity: 0.22,
    width: config.ropeEnergyWrapGlowWidth * 0.62,
    phase: Math.PI * 0.78,
    amplitude: 0.72,
    frequency: 0.72,
    renderOrder: 26,
  }),
];

function setRopeEnergyWrapsVisible(visible) {
  const profile = getFxProfile();
  for (const [index, layer] of ropeEnergyWrapLayers.entries()) {
    layer.mesh.visible = visible && index < profile.ropeLayerLimit;
  }
}

const ropeSparkGeometry = new THREE.PlaneGeometry(config.ropeSparkSize, config.ropeSparkSize);
const ropeSparks = [];
for (let index = 0; index < config.ropeSparkPoolSize; index += 1) {
  const spark = new THREE.Mesh(
    ropeSparkGeometry,
    new THREE.MeshBasicMaterial({
      color: index % 4 === 0 ? 0xffffff : 0x6cf3ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    }),
  );
  spark.visible = false;
  spark.renderOrder = 24;
  addGameplay(spark);
  ropeSparks.push({
    mesh: spark,
    velocity: new THREE.Vector3(),
    life: 0,
    maxLife: 0,
    spin: index % 2 ? -5.5 : 5.5,
  });
}
let nextRopeSpark = 0;

const speedLineMaterial = new THREE.LineBasicMaterial({
  color: 0xdff9ec,
  transparent: true,
  opacity: 0,
  depthTest: false,
});
const speedLines = [];
const speedLineSeeds = [
  { edge: false, side: -1, lane: -1.35, offset: 0.2, length: 1.6 },
  { edge: false, side: 1, lane: -0.95, offset: 1.2, length: 1.25 },
  { edge: false, side: -1, lane: 0.55, offset: 2.0, length: 1.45 },
  { edge: false, side: 1, lane: 1.15, offset: 2.8, length: 1.1 },
  { edge: false, side: -1, lane: 1.85, offset: 3.55, length: 1.35 },
  { edge: true, side: -1, lane: -0.65, offset: 0.4, length: 2.7 },
  { edge: true, side: 1, lane: -0.4, offset: 1.5, length: 2.2 },
  { edge: true, side: -1, lane: 0.35, offset: 2.4, length: 2.9 },
  { edge: true, side: 1, lane: 0.68, offset: 3.2, length: 2.3 },
];

for (const seed of speedLineSeeds) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const line = new THREE.Line(geometry, speedLineMaterial.clone());
  line.visible = false;
  line.frustumCulled = false;
  line.renderOrder = 28;
  addGameplay(line);
  speedLines.push({ line, seed });
}

const trailPoints = [];
const trailLines = [];
const trailMaterial = new THREE.LineBasicMaterial({
  color: 0x88ffe3,
  transparent: true,
  opacity: 0,
  depthTest: false,
});

for (let index = 0; index < config.trailSegments; index += 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const line = new THREE.Line(geometry, trailMaterial.clone());
  line.visible = false;
  line.frustumCulled = false;
  line.renderOrder = 27;
  addGameplay(line);
  trailLines.push(line);
}

const aimMaterial = new THREE.LineBasicMaterial({
  color: 0x9dc4ff,
  transparent: true,
  opacity: 0.58,
  depthTest: false,
});
const aimGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(),
  new THREE.Vector3(),
]);
const aimLine = new THREE.Line(aimGeometry, aimMaterial);
aimLine.renderOrder = 18;
addGameplay(aimLine);

function createDottedRangeGuide(radius, segments = 96) {
  const points = [];
  for (let index = 0; index < segments; index += 1) {
    if (index % 2 === 1) continue;
    const startAngle = (index / segments) * Math.PI * 2;
    const endAngle = ((index + 0.52) / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(Math.cos(startAngle) * radius, Math.sin(startAngle) * radius, 0.05),
      new THREE.Vector3(Math.cos(endAngle) * radius, Math.sin(endAngle) * radius, 0.05),
    );
  }

  const guide = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: 0xe4f24b,
      transparent: true,
      opacity: 0.78,
      depthTest: false,
    }),
  );
  guide.visible = false;
  guide.frustumCulled = false;
  guide.renderOrder = 18;
  return addGameplay(guide);
}

const grappleRangeGuide = createDottedRangeGuide(config.grappleRange);

const targetGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0x73d7ff,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
});
const targetGlow = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 24), targetGlowMaterial);
targetGlow.visible = false;
targetGlow.renderOrder = 16;
addGameplay(targetGlow);

const targetRingMaterial = new THREE.MeshBasicMaterial({
  color: 0xb9efff,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
});
const targetRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 10, 36), targetRingMaterial);
targetRing.visible = false;
targetRing.renderOrder = 17;
addGameplay(targetRing);

const hookTip = new THREE.Mesh(
  new THREE.ConeGeometry(0.18, 0.45, 16),
  new THREE.MeshStandardMaterial({
    color: 0x8cf7ff,
    emissive: 0x0aa6ff,
    roughness: 0.4,
  }),
);
hookTip.visible = false;
hookTip.renderOrder = 21;
hookTip.material.depthTest = false;
addGameplay(hookTip);

const hookHead = new THREE.Group();
const hookRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.23, 0.035, 8, 24),
  new THREE.MeshBasicMaterial({
    color: 0x8cf7ff,
    transparent: true,
    opacity: 0.92,
    depthTest: false,
  }),
);
const hookBar = new THREE.Mesh(
  new THREE.BoxGeometry(0.48, 0.08, 0.08),
  new THREE.MeshBasicMaterial({
    color: 0x19dfff,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
  }),
);
hookBar.position.y = -0.2;
hookHead.add(hookRing, hookBar);
hookHead.visible = false;
hookHead.renderOrder = 22;
addGameplay(hookHead);

const hookWrapMaterial = new THREE.MeshBasicMaterial({
  color: 0x19dfff,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
});
const hookWrap = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 10, 36), hookWrapMaterial);
hookWrap.visible = false;
hookWrap.renderOrder = 23;
addGameplay(hookWrap);

const anchorPlasmaLock = new THREE.Group();
anchorPlasmaLock.visible = false;
anchorPlasmaLock.renderOrder = 28;
addGameplay(anchorPlasmaLock);

const anchorPlasmaGlowRing = new THREE.Mesh(
  new THREE.TorusGeometry(config.anchorPlasmaArcRadius, 0.045, 4, 28),
  new THREE.MeshBasicMaterial({
    color: 0x35dfff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  }),
);
anchorPlasmaGlowRing.renderOrder = 28;
const anchorPlasmaCoreRing = new THREE.Mesh(
  new THREE.TorusGeometry(config.anchorPlasmaArcRadius * 0.78, 0.025, 4, 20),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  }),
);
anchorPlasmaCoreRing.renderOrder = 29;
anchorPlasmaLock.add(anchorPlasmaGlowRing, anchorPlasmaCoreRing);

function createAnchorPlasmaArcLayer(index) {
  const geometry = createRopeStripGeometry(config.anchorPlasmaArcPoints);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: index % 2 === 0 ? 0xffffff : 0x6cf3ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
  );
  mesh.visible = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = 30 + index;
  anchorPlasmaLock.add(mesh);
  return {
    mesh,
    geometry,
    centers: Array.from({ length: config.anchorPlasmaArcPoints }, () => new THREE.Vector3()),
    phase: index * Math.PI * 0.5,
    width: index % 2 === 0 ? 0.055 : 0.11,
    opacity: index % 2 === 0 ? 0.92 : 0.34,
  };
}

const anchorPlasmaArcs = Array.from(
  { length: config.anchorPlasmaArcCount },
  (_, index) => createAnchorPlasmaArcLayer(index),
);

function setAnchorPlasmaLockVisible(visible) {
  const profile = getFxProfile();
  anchorPlasmaLock.visible = visible;
  anchorPlasmaGlowRing.visible = visible;
  anchorPlasmaCoreRing.visible = visible;
  for (const [index, arc] of anchorPlasmaArcs.entries()) {
    arc.mesh.visible = visible && index < profile.anchorArcLimit;
  }
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const playPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const poseDragPlane = new THREE.Plane();
const poseDragPlaneNormal = new THREE.Vector3();

const anchors = [];
const hazards = [];
const bonuses = [];
const slowMotionRings = [];
const platforms = [];
const editableObjects = [];
let defaultAnchorLayout = [];
let defaultEditorLayout = null;
let startBlock = null;
let startPlatform = null;

const levelPresets = {
  skyline: {
    label: "Skyline",
    anchorVisual: "mixed",
    policeCarAnchorIndexes: [2, 6, 10, 14],
    start: [-2.25, 6.35],
    finish: [250, -3.6],
    anchors: [
      [10.6, 9.1],
      [22.8, 7.3],
      [34.0, 10.0],
      [45.6, 6.6],
      [57.5, 10.2],
      [69.8, 5.8],
      [82.6, 9.5],
      [95.9, 5.0],
      [109.8, 8.7],
      [124.2, 3.9],
      [139.2, 8.0],
      [154.8, 2.7],
      [171.0, 7.2],
      [187.8, 1.7],
      [205.2, 6.4],
      [223.0, 0.8],
      [241.4, 5.6],
    ],
    hazards: [
      [150, -4.4, 1.1, 5.7],
      [178, -3.4, 1.3, 7.4],
      [210, -5.4, 1.2, 5.1],
    ],
    bonuses: [
      [30, 10.3],
      [58, 10.7],
      [86, 9.8],
      [118, 10.2],
      [151, 11.0],
      [184, 10.8],
    ],
    slowMotionRings: [[78.5, 5.8]],
  },
  "vertical-descent": {
    label: "Vertical descent",
    anchorVisual: "policeCar",
    start: [-2.25, 24.2],
    finish: [192, -8.2],
    anchors: [
      [8, 25.6],
      [17, 22.8],
      [26, 24.7],
      [36, 20.2],
      [46, 21.8],
      [57, 16.7],
      [68, 18.1],
      [80, 12.8],
      [92, 14.4],
      [105, 9.5],
      [118, 10.8],
      [132, 5.8],
      [146, 6.6],
      [161, 1.3],
      [176, 2.2],
      [190, -4.8],
    ],
    hazards: [
      [52, 10.8, 1.1, 6.2],
      [103, 3.2, 1.2, 7.2],
      [151, -5.2, 1.1, 5.6],
    ],
    bonuses: [
      [23, 25.8],
      [62, 19.0],
      [96, 15.6],
      [126, 8.2],
      [167, 3.4],
    ],
    slowMotionRings: [
      [73, 14.8],
      [138, 2.8],
    ],
  },
};

const DroneState = Object.freeze({
  IDLE: "IDLE",
  TARGETED: "TARGETED",
  GRAPPLED: "GRAPPLED",
  RELEASED: "RELEASED",
  DISABLED: "DISABLED",
});

const anchorMaterial = new THREE.MeshStandardMaterial({
  color: 0x60e6c8,
  emissive: 0x123f38,
  roughness: 0.32,
});
const anchorHitMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0,
  depthWrite: false,
});
const activeAnchorMaterial = new THREE.MeshStandardMaterial({
  color: 0xe4f24b,
  emissive: 0x767f12,
  roughness: 0.28,
});
const hazardMaterial = new THREE.MeshStandardMaterial({
  color: 0xf05b50,
  emissive: 0x43100d,
  roughness: 0.5,
});
const bonusMaterial = new THREE.MeshStandardMaterial({
  color: 0x9dc4ff,
  emissive: 0x162f64,
  roughness: 0.28,
});
const slowMotionRingMaterial = new THREE.MeshBasicMaterial({
  color: 0x27e7ff,
  transparent: true,
  opacity: 0.88,
  depthTest: false,
});
const slowMotionRingGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xff2d8d,
  transparent: true,
  opacity: 0.26,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
});
const startBlockMaterial = new THREE.MeshStandardMaterial({
  color: 0x14211f,
  emissive: 0x030807,
  roughness: 0.82,
});
const startBlockEdgeMaterial = new THREE.MeshBasicMaterial({
  color: 0x77dbc5,
  transparent: true,
  opacity: 0.32,
  depthWrite: false,
});
const startPipeMaterial = new THREE.MeshStandardMaterial({
  color: 0x263f3b,
  emissive: 0x050d0c,
  roughness: 0.7,
});
const startPipeDarkMaterial = new THREE.MeshBasicMaterial({
  color: 0x091311,
  transparent: true,
  opacity: 0.86,
});
const startPipeHighlightMaterial = new THREE.MeshBasicMaterial({
  color: 0x4ca493,
  transparent: true,
  opacity: 0.58,
  depthWrite: false,
});
const startValveMaterial = new THREE.MeshBasicMaterial({
  color: 0xa55b36,
  transparent: true,
  opacity: 0.72,
});
const startSteamMaterial = new THREE.MeshBasicMaterial({
  color: 0xbdd1c8,
  transparent: true,
  opacity: 0.18,
  depthWrite: false,
});
const finishBuildingMaterial = new THREE.MeshBasicMaterial({
  color: 0x07101c,
  transparent: true,
  opacity: 0.96,
});
const finishRoofMaterial = new THREE.MeshBasicMaterial({
  color: 0xf6d447,
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
});
const droneBodyMaterial = new THREE.MeshBasicMaterial({ color: 0xeaf6ff });
const droneArmMaterial = new THREE.MeshBasicMaterial({ color: 0x283548 });
const droneRotorMaterial = new THREE.MeshBasicMaterial({
  color: 0xa7c7d9,
  transparent: true,
  opacity: 0.56,
  depthWrite: false,
});
const droneHookMaterial = new THREE.MeshBasicMaterial({ color: 0xffd057 });
const droneAnchorDebugMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
});

const droneLightColors = {
  [DroneState.IDLE]: 0xff2424,
  [DroneState.TARGETED]: 0xffc928,
  [DroneState.GRAPPLED]: 0x67ff3e,
  [DroneState.RELEASED]: 0xff2424,
  [DroneState.DISABLED]: 0x5b1515,
};

function createGlowTexture() {
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = 128;
  glowCanvas.height = 128;
  const ctx = glowCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  gradient.addColorStop(0.18, "rgba(255, 255, 255, 0.55)");
  gradient.addColorStop(0.48, "rgba(255, 255, 255, 0.22)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(glowCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const droneGlowTexture = createGlowTexture();

function setDroneState(anchor, nextState) {
  if (!anchor || anchor.droneState === nextState) return;
  anchor.droneState = nextState;
  const color = droneLightColors[nextState] ?? droneLightColors[DroneState.IDLE];
  for (const light of anchor.lights) {
    light.material.color.setHex(color);
    light.scale.setScalar(nextState === DroneState.TARGETED ? 1.28 : nextState === DroneState.GRAPPLED ? 1.38 : 1);
  }
  for (const glow of anchor.lightGlows) {
    glow.material.color.setHex(color);
    glow.material.opacity = nextState === DroneState.GRAPPLED ? 0.52 : nextState === DroneState.TARGETED ? 0.44 : 0.34;
  }
}

function isMalfunctionVehicleAnchor(anchor) {
  return anchor?.visualType === "drone" || anchor?.visualType === "policeCar";
}

function isAnchorBehindPlayer(anchor, player = state.player) {
  return Boolean(anchor && anchor.position.x < player.x - config.anchorMalfunctionBehindMargin);
}

function triggerVehicleMalfunction(anchor) {
  if (!isMalfunctionVehicleAnchor(anchor) || anchor.malfunctioning) return;
  sfx.play("malfunction");
  anchor.malfunctioning = true;
  anchor.used = true;
  anchor.hitMesh.visible = false;

  if (anchor.visualType === "policeCar") {
    anchor.blownThruster = anchor.thrusters[Math.floor(Math.random() * anchor.thrusters.length)] ?? null;
    anchor.malfunctionSide = anchor.blownThruster?.side ?? (Math.random() < 0.5 ? -1 : 1);
    anchor.malfunctionVelocity.set(
      anchor.malfunctionSide * (0.25 + Math.random() * 1.1),
      0.25 + Math.random() * 0.9,
      0,
    );
    anchor.malfunctionSpin = -anchor.malfunctionSide * (1.8 + Math.random() * 2.4);
    if (anchor.blownThruster) {
      anchor.blownThruster.glow.material.color.setHex(0xff2b1c);
      anchor.blownThruster.flame.material.color.setHex(0xff2b1c);
      anchor.blownThruster.hot.material.color.setHex(0xffd34a);
    }
  } else {
    anchor.malfunctionSide = Math.random() < 0.5 ? -1 : 1;
    anchor.malfunctionVelocity.set(
      anchor.malfunctionSide * (0.8 + Math.random() * 1.8),
      0.7 + Math.random() * 1.6,
      0,
    );
    anchor.malfunctionSpin = anchor.malfunctionSide * (2.8 + Math.random() * 3.8);
    anchor.blownRotor = anchor.rotors[Math.floor(Math.random() * anchor.rotors.length)] ?? null;
    if (anchor.blownRotor) anchor.blownRotor.visible = false;
  }

  setDroneState(anchor, DroneState.DISABLED);
  for (let index = 0; index < 14; index += 1) {
    spawnVehicleMalfunctionSpark(anchor, performance.now() / 1000);
  }
}

function createDroneVisual() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.32, 0.24), droneBodyMaterial);
  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.14, 0.26), droneArmMaterial);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.28), droneBodyMaterial);
  belly.position.y = -0.21;
  nose.position.x = 0.52;
  group.add(body, nose);
  group.add(belly);

  const armGeometry = new THREE.BoxGeometry(1.15, 0.06, 0.08);
  const rotorGeometry = new THREE.BoxGeometry(0.58, 0.07, 0.04);
  const rotorHubGeometry = new THREE.BoxGeometry(0.16, 0.16, 0.06);
  const rotorGroups = [];
  for (const rotorDef of [
    { x: -1.0, y: 0.28, scale: 1.05 },
    { x: 1.0, y: 0.28, scale: 1.05 },
    { x: -0.54, y: -0.46, scale: 0.82 },
    { x: 0.54, y: -0.46, scale: 0.82 },
  ]) {
    const arm = new THREE.Mesh(armGeometry, droneArmMaterial);
    arm.position.set(rotorDef.x * 0.46, rotorDef.y * 0.42, 0);
    arm.rotation.z = Math.atan2(rotorDef.y, rotorDef.x);
    arm.scale.x = rotorDef.scale;
    group.add(arm);

    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(rotorDef.x, rotorDef.y, 0.05);
    rotorGroup.scale.set(rotorDef.scale, rotorDef.scale, 1);
    const bladeA = new THREE.Mesh(rotorGeometry, droneRotorMaterial);
    const bladeB = new THREE.Mesh(rotorGeometry, droneRotorMaterial);
    bladeB.rotation.z = Math.PI / 2;
    const hub = new THREE.Mesh(rotorHubGeometry, droneArmMaterial);
    rotorGroup.add(bladeA, bladeB, hub);
    group.add(rotorGroup);
    rotorGroups.push(rotorGroup);
  }

  const lightGeometry = new THREE.BoxGeometry(0.16, 0.16, 0.08);
  const leftLight = new THREE.Mesh(lightGeometry, new THREE.MeshBasicMaterial({ color: droneLightColors.IDLE }));
  const rightLight = new THREE.Mesh(lightGeometry, new THREE.MeshBasicMaterial({ color: droneLightColors.IDLE }));
  leftLight.position.set(-0.26, 0.48, 0.2);
  rightLight.position.set(0.26, 0.48, 0.2);
  group.add(leftLight, rightLight);

  const grapplePoint = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.08), droneHookMaterial);
  grapplePoint.position.set(0, -0.36, 0.1);
  group.add(grapplePoint);

  const leftGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: droneGlowTexture,
      color: droneLightColors.IDLE,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const rightGlow = leftGlow.clone();
  leftGlow.position.copy(leftLight.position);
  rightGlow.position.copy(rightLight.position);
  leftGlow.position.z = 0.14;
  rightGlow.position.z = 0.14;
  leftGlow.scale.setScalar(0.72);
  rightGlow.scale.setScalar(0.72);
  group.add(leftGlow, rightGlow);

  group.renderOrder = 15;
  return {
    group,
    lights: [leftLight, rightLight],
    lightGlows: [leftGlow, rightGlow],
    rotors: rotorGroups,
    blownRotor: null,
    grapplePoint,
  };
}

function createPoliceHoverCarVisual() {
  const group = new THREE.Group();

  const carMaterial = new THREE.MeshBasicMaterial({ color: 0xf0d96a });
  const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xf4f4ee });
  const cabMaterial = new THREE.MeshBasicMaterial({ color: 0x234a7d });
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x171c26 });
  const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x050607 });
  const grayMaterial = new THREE.MeshBasicMaterial({ color: 0x55595b });
  const blueMaterial = new THREE.MeshBasicMaterial({ color: 0x1262ff, transparent: true, opacity: 1, depthWrite: false });
  const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff2b1c, transparent: true, opacity: 1, depthWrite: false });
  const cyanMaterial = new THREE.MeshBasicMaterial({ color: 0x36f6ff, transparent: true, opacity: 1, depthWrite: false });
  const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xff9a1f, transparent: true, opacity: 1, depthWrite: false });
  const hotFlameMaterial = new THREE.MeshBasicMaterial({ color: 0xffff55, transparent: true, opacity: 1, depthWrite: false });
  const smokeMaterial = new THREE.MeshBasicMaterial({ color: 0x9aa0a2, transparent: true, opacity: 0, depthWrite: false });

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.18, 0.12), whiteMaterial);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.22, 0.12), cabMaterial);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.32, 0.16), blackMaterial);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.16), shadowMaterial);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.2), grayMaterial);
  const roofBar = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 0.16), blackMaterial);
  const redBar = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.1, 0.18), redMaterial);
  const blueBar = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.1, 0.18), blueMaterial);
  const centerBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.18), grayMaterial);
  const leftThruster = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.12), blackMaterial);
  const rightThruster = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.12), blackMaterial);
  const leftGlowJet = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.1), cyanMaterial.clone());
  const rightGlowJet = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.1), cyanMaterial.clone());
  const leftFlame = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.42, 4), flameMaterial.clone());
  const rightFlame = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.42, 4), flameMaterial.clone());
  const leftHot = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.26, 4), hotFlameMaterial.clone());
  const rightHot = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.26, 4), hotFlameMaterial.clone());
  const leftSmoke = new THREE.Mesh(new THREE.CircleGeometry(0.12, 8), smokeMaterial.clone());
  const rightSmoke = new THREE.Mesh(new THREE.CircleGeometry(0.12, 8), smokeMaterial.clone());

  roof.position.set(0, 0.34, 0.02);
  windshield.position.set(0, 0.16, 0.08);
  hood.position.set(0, -0.08, 0.1);
  bumper.position.set(0, -0.34, 0.12);
  grille.position.set(0, -0.18, 0.18);
  roofBar.position.set(0, 0.56, 0.12);
  redBar.position.set(-0.31, 0.57, 0.18);
  centerBar.position.set(0, 0.57, 0.18);
  blueBar.position.set(0.31, 0.57, 0.18);
  leftThruster.position.set(-0.56, -0.54, 0.12);
  rightThruster.position.set(0.56, -0.54, 0.12);
  leftGlowJet.position.set(-0.56, -0.42, 0.18);
  rightGlowJet.position.set(0.56, -0.42, 0.18);
  leftFlame.position.set(-0.56, -0.86, 0.08);
  rightFlame.position.set(0.56, -0.86, 0.08);
  leftHot.position.set(-0.56, -0.8, 0.1);
  rightHot.position.set(0.56, -0.8, 0.1);
  leftSmoke.position.set(-0.56, -0.76, 0.11);
  rightSmoke.position.set(0.56, -0.76, 0.11);
  for (const flame of [leftFlame, rightFlame, leftHot, rightHot]) flame.rotation.z = Math.PI;
  group.add(
    roof,
    windshield,
    hood,
    bumper,
    grille,
    roofBar,
    redBar,
    centerBar,
    blueBar,
    leftThruster,
    rightThruster,
    leftGlowJet,
    rightGlowJet,
    leftFlame,
    rightFlame,
    leftHot,
    rightHot,
    leftSmoke,
    rightSmoke,
  );

  const lightGeometry = new THREE.BoxGeometry(0.14, 0.12, 0.08);
  const leftLight = new THREE.Mesh(lightGeometry, new THREE.MeshBasicMaterial({ color: droneLightColors.IDLE }));
  const rightLight = new THREE.Mesh(lightGeometry, new THREE.MeshBasicMaterial({ color: droneLightColors.IDLE }));
  leftLight.position.set(-0.32, -0.28, 0.24);
  rightLight.position.set(0.32, -0.28, 0.24);
  group.add(leftLight, rightLight);

  const grapplePoint = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.08), droneHookMaterial);
  grapplePoint.position.set(0, -0.64, 0.1);
  group.add(grapplePoint);

  const leftGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: droneGlowTexture,
      color: droneLightColors.IDLE,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const rightGlow = leftGlow.clone();
  leftGlow.position.copy(leftLight.position);
  rightGlow.position.copy(rightLight.position);
  leftGlow.position.z = 0.14;
  rightGlow.position.z = 0.14;
  leftGlow.scale.setScalar(0.72);
  rightGlow.scale.setScalar(0.72);
  group.add(leftGlow, rightGlow);

  const createSirenGlow = (color, opacity, scaleX, scaleY) => {
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: droneGlowTexture,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    glow.scale.set(scaleX, scaleY, 1);
    return glow;
  };
  const redSirenGlow = createSirenGlow(0xff2b1c, 0.48, 1.22, 0.72);
  const blueSirenGlow = createSirenGlow(0x36a8ff, 0.48, 1.22, 0.72);
  const redLightWash = createSirenGlow(0xff2b1c, 0.24, 4.1, 1.85);
  const blueLightWash = createSirenGlow(0x36a8ff, 0.24, 4.1, 1.85);
  redSirenGlow.position.copy(redBar.position);
  blueSirenGlow.position.copy(blueBar.position);
  redLightWash.position.set(-0.5, 0.18, 0.02);
  blueLightWash.position.set(0.5, 0.18, 0.02);
  for (const glow of [redSirenGlow, blueSirenGlow, redLightWash, blueLightWash]) {
    glow.position.z += 0.18;
    group.add(glow);
  }

  group.scale.setScalar(1.33);
  group.renderOrder = 15;
  const thrusters = [
    { side: -1, body: leftThruster, glow: leftGlowJet, flame: leftFlame, hot: leftHot, smoke: leftSmoke },
    { side: 1, body: rightThruster, glow: rightGlowJet, flame: rightFlame, hot: rightHot, smoke: rightSmoke },
  ];
  return {
    group,
    lights: [leftLight, rightLight],
    lightGlows: [leftGlow, rightGlow],
    rotors: [],
    thrusters,
    blownThruster: null,
    sirens: { red: redBar, blue: blueBar },
    sirenGlows: {
      red: redSirenGlow,
      blue: blueSirenGlow,
      redWash: redLightWash,
      blueWash: blueLightWash,
    },
    flames: [leftFlame, rightFlame, leftHot, rightHot],
    smokes: [leftSmoke, rightSmoke],
    grapplePoint,
  };
}

function addTunnelSegment(x) {
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.35, 3),
    new THREE.MeshStandardMaterial({ color: 0x2d1718, roughness: 0.8 }),
  );
  ceiling.position.set(x, config.ceilingY + 0.35, 0);
  tunnel.add(ceiling);
}

function setEditorObjectSelected(object, selected) {
  if (!object) return;
  const scale = selected ? 1.22 : 1;
  object.hitMesh?.scale.setScalar(scale);
  if (object.hitMesh?.material) {
    object.hitMesh.material.opacity = selected && !state.paused ? 0.14 : 0;
  }
  if (object.type === "anchor") setDroneState(object, selected ? DroneState.TARGETED : DroneState.IDLE);
}

function selectEditorObject(object) {
  if (state.selectedObject === object) return;
  setEditorObjectSelected(state.selectedObject, false);
  state.selectedObject = object;
  setEditorObjectSelected(state.selectedObject, true);
}

function registerEditableObject(object) {
  editableObjects.push(object);
  object.hitMesh.userData.editorObject = object;
  return object;
}

function moveEditableObject(object, x, y) {
  if (!object) return;
  const nextY = THREE.MathUtils.clamp(Number(y.toFixed(2)), config.buildMinY, config.buildMaxY);
  const nextX = Number(x.toFixed(2));

  if (object.type === "anchor") {
    object.position.set(nextX, nextY, 0);
    object.hitMesh.position.copy(object.position);
    object.mesh.position.copy(object.position);
    object.debugAnchor.position.copy(object.position);
    return;
  }

  if (object.type === "hazard") {
    object.mesh.position.set(nextX, nextY, 0);
    object.hitMesh.position.copy(object.mesh.position);
    return;
  }

  if (object.type === "bonus") {
    object.mesh.position.set(nextX, nextY, 0);
    object.hitMesh.position.copy(object.mesh.position);
    return;
  }

  if (object.type === "slowmo") {
    object.group.position.set(nextX, nextY, 0.02);
    object.hitMesh.position.set(nextX, nextY, 0);
    return;
  }

  if (object.type === "finish") {
    object.x = nextX;
    object.y = nextY;
    object.building.position.set(nextX, nextY - object.buildingHeight * 0.5 - 0.05, -0.02);
    object.roof.position.set(nextX, nextY, 0.04);
    object.beacon.position.set(nextX + object.width * 0.385, nextY + 0.8, 0.08);
    object.platform.x = nextX;
    object.platform.y = nextY;
    object.hitMesh.position.set(nextX, nextY + 0.18, 0);
  }
}

function removeFromArray(array, item) {
  const index = array.indexOf(item);
  if (index >= 0) array.splice(index, 1);
}

function removeEditableObject(object) {
  if (!object || object.type === "finish") return;

  if (object.type === "anchor" && anchors.length <= 1) return;
  removeFromArray(editableObjects, object);
  if (state.selectedObject === object) state.selectedObject = null;
  if (state.draggedObject === object) state.draggedObject = null;

  if (object.type === "anchor") {
    removeFromArray(anchors, object);
    gameplayLayer.remove(object.mesh, object.hitMesh, object.debugAnchor);
  } else if (object.type === "hazard") {
    removeFromArray(hazards, object);
    gameplayLayer.remove(object.mesh, object.hitMesh);
  } else if (object.type === "bonus") {
    removeFromArray(bonuses, object);
    gameplayLayer.remove(object.mesh, object.hitMesh);
  } else if (object.type === "slowmo") {
    removeFromArray(slowMotionRings, object);
    gameplayLayer.remove(object.group, object.hitMesh);
  }
}

function addAnchor(x, y) {
  const visualType = getAnchorVisualType(anchors.length);
  const drone = visualType === "policeCar"
    ? createPoliceHoverCarVisual()
    : createDroneVisual();
  drone.group.position.set(x, y, 0);
  addGameplay(drone.group);

  const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 16), anchorHitMaterial.clone());
  hitMesh.position.set(x, y, 0);
  addGameplay(hitMesh);

  const debugAnchor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), droneAnchorDebugMaterial);
  debugAnchor.position.set(x, y, 0);
  debugAnchor.visible = config.debugShowDroneAnchors;
  addGameplay(debugAnchor);

  const anchor = {
    type: "anchor",
    visualType,
    mesh: drone.group,
    hitMesh,
    position: hitMesh.position,
    used: false,
    index: anchors.length,
    droneState: DroneState.IDLE,
    lights: drone.lights,
    lightGlows: drone.lightGlows,
    rotors: drone.rotors,
    blownRotor: drone.blownRotor ?? null,
    thrusters: drone.thrusters ?? [],
    blownThruster: drone.blownThruster ?? null,
    sirens: drone.sirens ?? null,
    sirenGlows: drone.sirenGlows ?? null,
    flames: drone.flames ?? [],
    smokes: drone.smokes ?? [],
    grapplePoint: drone.grapplePoint,
    debugAnchor,
    visualOffset: new THREE.Vector3(),
    visualVelocity: new THREE.Vector3(),
    impactOffset: new THREE.Vector3(),
    impactVelocity: new THREE.Vector3(),
    malfunctioning: false,
    malfunctionSide: Math.random() < 0.5 ? -1 : 1,
    malfunctionVelocity: new THREE.Vector3(),
    malfunctionSpin: 0,
    releasedAt: -100,
    visualSeed: anchors.length * 1.731 + (visualType === "policeCar" ? 7.2 : 0),
    nextSputterAt: 0.8 + anchors.length * 0.47,
    sputterUntil: -100,
  };
  anchors.push(anchor);
  registerEditableObject(anchor);
  return anchor;
}

function addHazard(x, y, width, height) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.8), hazardMaterial);
  mesh.position.set(x, y, 0);
  addGameplay(mesh);
  const hitMesh = new THREE.Mesh(new THREE.BoxGeometry(width + 0.65, height + 0.65, 0.9), anchorHitMaterial.clone());
  hitMesh.position.set(x, y, 0);
  addGameplay(hitMesh);
  const hazard = { type: "hazard", mesh, hitMesh, width, height, passed: false };
  hazards.push(hazard);
  registerEditableObject(hazard);
  return hazard;
}

function addBonus(x, y) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 10, 28), bonusMaterial);
  mesh.position.set(x, y, 0);
  addGameplay(mesh);
  const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), anchorHitMaterial.clone());
  hitMesh.position.set(x, y, 0);
  addGameplay(hitMesh);
  const bonus = { type: "bonus", mesh, hitMesh, collected: false };
  bonuses.push(bonus);
  registerEditableObject(bonus);
  return bonus;
}

function addSlowMotionRing(x, y) {
  const group = new THREE.Group();
  group.position.set(x, y, 0.02);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(config.slowMotionRingRadius, 0.07, 10, 44),
    slowMotionRingMaterial.clone(),
  );
  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(config.slowMotionRingRadius * 0.72, 0.035, 8, 36),
    slowMotionRingMaterial.clone(),
  );
  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(config.slowMotionRingRadius * 1.18, 0.18, 10, 44),
    slowMotionRingGlowMaterial.clone(),
  );

  group.add(glow, ring, innerRing);
  addGameplay(group);
  const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(config.slowMotionRingRadius * 1.12, 18, 18), anchorHitMaterial.clone());
  hitMesh.position.set(x, y, 0);
  addGameplay(hitMesh);
  const powerup = { type: "slowmo", group, ring, innerRing, glow, hitMesh, collected: false };
  slowMotionRings.push(powerup);
  registerEditableObject(powerup);
  return powerup;
}

function addPlatform(x, y, width, options = {}) {
  const platform = { x, y, width, finish: Boolean(options.finish) };
  platforms.push(platform);
  return platform;
}

function completeLevel() {
  if (state.finished) return;

  state.finished = true;
  releaseGrapple();
  addScore(50, "finish");
  showLevelComplete();
}

function syncScore() {
  state.score = Math.max(0, Math.floor(state.scoreFloat));
}

function updateMultiplier(actionType, now = performance.now() / 1000) {
  if (!actionType) return;
  if (now > state.multiplierExpiresAt) {
    state.multiplier = config.multiplierBase;
    state.multiplierActions.clear();
  }

  if (!state.multiplierActions.has(actionType)) {
    state.multiplierActions.add(actionType);
    state.multiplier = Math.min(
      config.multiplierMax,
      config.multiplierBase + state.multiplierActions.size * config.multiplierStep,
    );
    state.highestMultiplier = Math.max(state.highestMultiplier, state.multiplier);
  }
  state.multiplierExpiresAt = now + config.multiplierWindow;
}

function addScore(amount, actionType = "", now = performance.now() / 1000) {
  updateMultiplier(actionType, now);
  state.scoreFloat += amount * state.multiplier;
  syncScore();
  if (actionType === "score-ring") sfx.play("ring");
  if (actionType === "slow-ring") sfx.play("slowMo");
  if (actionType === "finish") sfx.play("finish");
}

function updateSpeedScore(dt, now) {
  if (!state.hasLaunched || state.gameOver || state.finished) return;
  if (now > state.multiplierExpiresAt) {
    state.multiplier = config.multiplierBase;
    state.multiplierActions.clear();
  }

  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  const speedAmount = Math.max(0, speed - 1.5) * config.scoreSpeedScale * dt;
  if (speedAmount <= 0) return;
  state.scoreFloat += speedAmount * state.multiplier;
  syncScore();
}

function moveStartBlock(x, y) {
  if (!startBlock || !startPlatform) return;
  const blockTop = y;
  const blockCenterX = x - startBlock.blockWidth * 0.5;
  const blockCenterY = blockTop - startBlock.blockHeight * 0.5;
  startBlock.block.position.set(blockCenterX, blockCenterY, -0.05);
  if (startBlock.pipeGroup) startBlock.pipeGroup.position.set(blockCenterX, blockCenterY, 0.01);
  startBlock.edge.position.set(x + 0.04, blockCenterY, 0.02);
  startBlock.ledge.position.set(x - 0.35, blockTop, 0.03);
  startPlatform.x = x;
  startPlatform.y = y;
}

function addStartBlock(x = -2.25, y = 6.35) {
  const blockWidth = 2.5;
  const blockHeight = 26;
  const block = new THREE.Mesh(new THREE.BoxGeometry(blockWidth, blockHeight, 1.2), startBlockMaterial);
  addGameplay(block);

  const pipeGroup = new THREE.Group();
  pipeGroup.name = "start_steam_stacks";
  pipeGroup.renderOrder = 2;
  addGameplay(pipeGroup);

  const addBox = (width, height, depth, material, px, py, pz = 0.6) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(px, py, pz);
    pipeGroup.add(mesh);
    return mesh;
  };

  const addPipe = (px, height, radius, py = 0, material = startPipeMaterial) => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 8), material);
    pipe.position.set(px, py, 0.63);
    pipeGroup.add(pipe);
    return pipe;
  };

  addBox(2.08, blockHeight - 1.3, 0.22, startPipeDarkMaterial, -0.08, -0.34, 0.55);
  addPipe(-0.92, blockHeight - 0.9, 0.1);
  addPipe(-0.45, blockHeight - 2.6, 0.075);
  addPipe(0.18, blockHeight - 1.8, 0.085);
  addPipe(0.72, blockHeight - 4.2, 0.065);

  for (let bandY = -10.7; bandY <= 10.7; bandY += 3.1) {
    addBox(2.0, 0.08, 0.08, startPipeHighlightMaterial, -0.08, bandY, 0.72);
  }

  for (const pipe of [
    { x: -0.32, y: 6.7, width: 1.2 },
    { x: 0.08, y: 2.15, width: 1.72 },
    { x: -0.28, y: -5.65, width: 1.48 },
  ]) {
    const crossPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, pipe.width, 8), startPipeMaterial);
    crossPipe.position.set(pipe.x, pipe.y, 0.68);
    crossPipe.rotation.z = Math.PI / 2;
    pipeGroup.add(crossPipe);
  }

  for (const valve of [
    { x: -0.98, y: 4.9, scale: 1 },
    { x: 0.52, y: -2.1, scale: 0.82 },
  ]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.2 * valve.scale, 0.028, 6, 12), startValveMaterial);
    wheel.position.set(valve.x, valve.y, 0.82);
    pipeGroup.add(wheel);
    addBox(0.06, 0.44 * valve.scale, 0.05, startValveMaterial, valve.x, valve.y, 0.84);
    addBox(0.44 * valve.scale, 0.06, 0.05, startValveMaterial, valve.x, valve.y, 0.84);
  }

  const steamVents = [];
  for (const stack of [
    { x: -0.92, y: 13.08, h: 1.05, r: 0.12 },
    { x: -0.24, y: 13.18, h: 0.82, r: 0.1 },
    { x: 0.52, y: 12.98, h: 1.22, r: 0.11 },
  ]) {
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(stack.r, stack.r, stack.h, 8), startPipeMaterial);
    chimney.position.set(stack.x, stack.y + stack.h * 0.5, 0.66);
    pipeGroup.add(chimney);
    addBox(stack.r * 3.2, 0.1, 0.2, startPipeHighlightMaterial, stack.x, stack.y + stack.h + 0.04, 0.75);
    steamVents.push(new THREE.Vector3(stack.x, stack.y + stack.h + 0.08, 0.82));
  }

  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.08, blockHeight, 1.28), startBlockEdgeMaterial);
  addGameplay(edge);

  const ledge = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 1.25), startBlockEdgeMaterial);
  addGameplay(ledge);

  const smokePuffs = [];
  const smokeGeometry = new THREE.CircleGeometry(0.32, 8);
  for (let index = 0; index < 24; index += 1) {
    const material = startSteamMaterial.clone();
    const puff = new THREE.Mesh(smokeGeometry, material);
    puff.renderOrder = 3;
    pipeGroup.add(puff);
    smokePuffs.push({
      mesh: puff,
      ventIndex: index % steamVents.length,
      seed: index / 24,
      speed: 0.12 + (index % 5) * 0.014,
      drift: (index % 2 === 0 ? -1 : 1) * (0.12 + (index % 7) * 0.018),
      size: 0.12 + (index % 4) * 0.035,
    });
  }

  startPlatform = addPlatform(x, y, 1.35);
  startBlock = { block, edge, ledge, blockWidth, blockHeight, pipeGroup, smokePuffs, steamVents };
  moveStartBlock(x, y);
}

function updateStartSteam(dt, now) {
  if (!startBlock?.smokePuffs?.length || !startBlock.steamVents?.length) return;

  const snap = 36;
  const gust = Math.sin(now * 0.37) * 0.08;
  for (const puff of startBlock.smokePuffs) {
    const progressRaw = now * puff.speed + puff.seed;
    const progress = progressRaw - Math.floor(progressRaw);
    const vent = startBlock.steamVents[puff.ventIndex];
    const pixelJitter = Math.floor((now * 9 + puff.seed * 17) % 3) - 1;
    const wobble = Math.sin((progress + puff.seed) * Math.PI * 4) * 0.08;
    const x = vent.x + (puff.drift + gust) * progress + wobble + pixelJitter * 0.018;
    const y = vent.y + progress * (1.4 + puff.size * 2.4);
    const scale = 0.34 + progress * (0.72 + puff.size);
    puff.mesh.position.set(
      Math.round(x * snap) / snap,
      Math.round(y * snap) / snap,
      vent.z + progress * 0.02,
    );
    puff.mesh.scale.set(scale * (1.0 + puff.size), scale * 0.82, 1);
    puff.mesh.rotation.z = puff.seed * Math.PI * 2 + progress * 0.3;
    puff.mesh.material.opacity = Math.pow(1 - progress, 1.65) * 0.24;
  }
}

function addFinishBuilding() {
  const roofY = -3.6;
  const roofWidth = 13.5;
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(roofWidth, 19, 1.2),
    finishBuildingMaterial,
  );
  building.position.set(250, roofY - 9.55, -0.02);
  addGameplay(building);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(roofWidth + 0.7, 0.22, 1.3), finishRoofMaterial);
  roof.position.set(250, roofY, 0.04);
  addGameplay(roof);

  const beacon = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.4, 0.18),
    new THREE.MeshBasicMaterial({
      color: 0xff2d8d,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    }),
  );
  beacon.position.set(255.2, roofY + 0.8, 0.08);
  addGameplay(beacon);
  const platform = addPlatform(250, roofY, roofWidth, { finish: true });
  const hitMesh = new THREE.Mesh(new THREE.BoxGeometry(roofWidth + 1.3, 1.3, 1.4), anchorHitMaterial.clone());
  hitMesh.position.set(250, roofY + 0.18, 0);
  addGameplay(hitMesh);
  const finish = {
    type: "finish",
    building,
    roof,
    beacon,
    hitMesh,
    platform,
    x: 250,
    y: roofY,
    width: roofWidth,
    buildingHeight: 19,
  };
  registerEditableObject(finish);
  return finish;
}

function buildCourse() {
  addStartBlock();
  addFinishBuilding();
  applyLevel(currentLevelId, { preserveSavedLayout: true, resetRun: false });
}

buildCourse();

function getLevelPreset(levelId = currentLevelId) {
  return levelPresets[levelId] || levelPresets.skyline;
}

function getAnchorVisualType(index = anchors.length, levelId = currentLevelId) {
  const preset = getLevelPreset(levelId);
  if (preset.anchorVisual === "mixed") {
    return preset.policeCarAnchorIndexes?.includes(index) ? "policeCar" : "drone";
  }
  return preset.anchorVisual === "policeCar" ? "policeCar" : "drone";
}

function getCurrentEditorLayoutStorageKey() {
  return `${editorLayoutStoragePrefix}${currentLevelId}`;
}

function getLevelStart(levelId = currentLevelId) {
  const [x, y] = getLevelPreset(levelId).start;
  return new THREE.Vector3(x - 0.1, y + config.platformStandOffset, 0);
}

function serializeEditorLayout() {
  const finish = editableObjects.find((object) => object.type === "finish");
  const preset = getLevelPreset();
  return {
    level: currentLevelId,
    start: startPlatform ? [Number(startPlatform.x.toFixed(2)), Number(startPlatform.y.toFixed(2))] : preset.start,
    anchors: anchors.map((anchor) => [Number(anchor.position.x.toFixed(2)), Number(anchor.position.y.toFixed(2))]),
    hazards: hazards.map((hazard) => [
      Number(hazard.mesh.position.x.toFixed(2)),
      Number(hazard.mesh.position.y.toFixed(2)),
      hazard.width,
      hazard.height,
    ]),
    bonuses: bonuses.map((bonus) => [
      Number(bonus.mesh.position.x.toFixed(2)),
      Number(bonus.mesh.position.y.toFixed(2)),
    ]),
    slowMotionRings: slowMotionRings.map((powerup) => [
      Number(powerup.group.position.x.toFixed(2)),
      Number(powerup.group.position.y.toFixed(2)),
    ]),
    finish: finish ? [Number(finish.x.toFixed(2)), Number(finish.y.toFixed(2))] : null,
  };
}

function saveEditorLayout() {
  const serialized = JSON.stringify(serializeEditorLayout());
  localStorage.setItem(getCurrentEditorLayoutStorageKey(), serialized);
  localStorage.removeItem(editorLayoutStorageKey);
  localStorage.removeItem(anchorStorageKey);
}

function clearEditableType(type) {
  for (const object of [...editableObjects]) {
    if (object.type !== type) continue;
    if (object.type === "anchor") {
      removeFromArray(anchors, object);
      gameplayLayer.remove(object.mesh, object.hitMesh, object.debugAnchor);
    } else if (object.type === "hazard") {
      removeFromArray(hazards, object);
      gameplayLayer.remove(object.mesh, object.hitMesh);
    } else if (object.type === "bonus") {
      removeFromArray(bonuses, object);
      gameplayLayer.remove(object.mesh, object.hitMesh);
    } else if (object.type === "slowmo") {
      removeFromArray(slowMotionRings, object);
      gameplayLayer.remove(object.group, object.hitMesh);
    }
    removeFromArray(editableObjects, object);
  }
}

function applyEditorLayout(layout) {
  if (!layout || typeof layout !== "object") return;
  selectEditorObject(null);
  state.draggedObject = null;
  const preset = getLevelPreset();

  if (Array.isArray(layout.start) && layout.start.length >= 2) {
    moveStartBlock(Number(layout.start[0]), Number(layout.start[1]));
  } else {
    moveStartBlock(Number(preset.start[0]), Number(preset.start[1]));
  }

  clearEditableType("anchor");
  clearEditableType("hazard");
  clearEditableType("bonus");
  clearEditableType("slowmo");

  const anchorLayout = Array.isArray(layout.anchors) && layout.anchors.length ? layout.anchors : defaultAnchorLayout;
  anchorLayout.forEach((point) => {
    if (!Array.isArray(point) || point.length < 2) return;
    addAnchor(Number(point[0]), Number(point[1]));
  });

  if (Array.isArray(layout.hazards)) {
    layout.hazards.forEach((item) => {
      if (!Array.isArray(item) || item.length < 4) return;
      addHazard(Number(item[0]), Number(item[1]), Number(item[2]), Number(item[3]));
    });
  }

  if (Array.isArray(layout.bonuses)) {
    layout.bonuses.forEach((item) => {
      if (!Array.isArray(item) || item.length < 2) return;
      addBonus(Number(item[0]), Number(item[1]));
    });
  }

  if (Array.isArray(layout.slowMotionRings)) {
    layout.slowMotionRings.forEach((item) => {
      if (!Array.isArray(item) || item.length < 2) return;
      addSlowMotionRing(Number(item[0]), Number(item[1]));
    });
  }

  const finish = editableObjects.find((object) => object.type === "finish");
  if (finish && Array.isArray(layout.finish) && layout.finish.length >= 2) {
    moveEditableObject(finish, Number(layout.finish[0]), Number(layout.finish[1]));
  }
}

function isLayoutForCurrentLevel(layout) {
  return Boolean(layout && typeof layout === "object" && layout.level === currentLevelId);
}

function loadEditorLayout() {
  const stored = localStorage.getItem(getCurrentEditorLayoutStorageKey());
  if (!stored) return;

  try {
    const layout = JSON.parse(stored);
    if (!isLayoutForCurrentLevel(layout)) {
      localStorage.removeItem(getCurrentEditorLayoutStorageKey());
      return;
    }
    applyEditorLayout(layout);
  } catch {
    localStorage.removeItem(getCurrentEditorLayoutStorageKey());
  }
}

function resetEditorLayout() {
  localStorage.removeItem(anchorStorageKey);
  localStorage.removeItem(editorLayoutStorageKey);
  localStorage.removeItem(getCurrentEditorLayoutStorageKey());
  applyEditorLayout(defaultEditorLayout);
  releaseGrapple();
}

function applyLevel(levelId, { preserveSavedLayout = true, resetRun = true } = {}) {
  releaseGrapple();
  currentLevelId = levelPresets[levelId] ? levelId : "skyline";
  localStorage.setItem(levelSelectionStorageKey, currentLevelId);
  if (levelSelect) levelSelect.value = currentLevelId;
  const preset = getLevelPreset();
  defaultAnchorLayout = preset.anchors;
  defaultEditorLayout = {
    level: currentLevelId,
    start: preset.start,
    anchors: preset.anchors,
    hazards: preset.hazards,
    bonuses: preset.bonuses,
    slowMotionRings: preset.slowMotionRings,
    finish: preset.finish,
  };
  applyEditorLayout(defaultEditorLayout);
  if (preserveSavedLayout) loadEditorLayout();
  if (resetRun) {
    reset({ resetLevelStats: true });
    setPaused(true);
  }
  syncEditorPane();
}

function addEditorObject() {
  const x = Number(camera.position.x.toFixed(2));
  const y = Number(camera.position.y.toFixed(2));
  const type = objectTypeSelect.value;
  let object = null;

  if (type === "anchor") object = addAnchor(x, y);
  if (type === "slowmo") object = addSlowMotionRing(x, y);
  if (type === "hazard") object = addHazard(x, y, 1.2, 5.4);
  if (type === "bonus") object = addBonus(x, y);
  if (type === "finish") object = editableObjects.find((item) => item.type === "finish");

  if (object) {
    if (type === "finish") moveEditableObject(object, x, y);
    selectEditorObject(object);
    saveEditorLayout();
    reset();
    setPaused(true);
  }
}

function removeSelectedEditorObject() {
  const object = state.selectedObject;
  if (!object || object.type === "finish") return;

  removeEditableObject(object);
  saveEditorLayout();
  reset();
  setPaused(true);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
  pixelatePass.uniforms.u_resolution.value.set(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updatePointerRay(event) {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);
}

function updatePointer(event) {
  updatePointerRay(event);
  raycaster.ray.intersectPlane(playPlane, state.pointerWorld);
}

function updatePointerOnViewPlane(event, planePoint, target = state.pointerWorld) {
  updatePointerRay(event);
  camera.getWorldDirection(poseDragPlaneNormal);
  poseDragPlane.setFromNormalAndCoplanarPoint(poseDragPlaneNormal, planePoint);
  raycaster.ray.intersectPlane(poseDragPlane, target);
  return target;
}

function pickEditableObject(event) {
  updatePointer(event);
  const hits = raycaster.intersectObjects(editableObjects.map((object) => object.hitMesh), false);
  if (!hits.length) return null;

  return hits[0].object.userData.editorObject ?? null;
}

function startEditorDrag(event) {
  if (!state.paused) return;
  if (startPoseHandleDrag(event)) return;

  const object = pickEditableObject(event);
  if (!object) {
    if (state.paused) startCameraPan(event);
    return;
  }

  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  releaseGrapple();
  state.draggedObject = object;
  selectEditorObject(object);
}

function dragEditorObject(event) {
  if (dragPoseHandle(event)) return;

  if (state.panningCamera) {
    panCamera(event);
    return;
  }

  if (!state.draggedObject) return;

  event.preventDefault();
  updatePointer(event);
  moveEditableObject(state.draggedObject, state.pointerWorld.x, state.pointerWorld.y);
}

function stopEditorDrag(event) {
  if (stopPoseHandleDrag(event)) return;

  if (state.panningCamera) {
    stopCameraPan(event);
    return;
  }

  if (!state.draggedObject) return;

  setEditorObjectSelected(state.draggedObject, state.draggedObject === state.selectedObject);
  state.draggedObject = null;
  saveEditorLayout();
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
}

function startCameraPan(event) {
  event.preventDefault();
  updatePointer(event);
  canvas.setPointerCapture(event.pointerId);
  state.panningCamera = true;
  state.panStartWorld.copy(state.pointerWorld);
  state.panStartCamera.copy(camera.position);
}

function panCamera(event) {
  event.preventDefault();
  updatePointer(event);
  const dx = state.panStartWorld.x - state.pointerWorld.x;
  const dy = state.panStartWorld.y - state.pointerWorld.y;
  camera.position.x = state.panStartCamera.x + dx;
  camera.position.y = THREE.MathUtils.clamp(
    state.panStartCamera.y + dy,
    config.buildMinY,
    config.buildMaxY,
  );
  camera.lookAt(camera.position.x, camera.position.y, 0);
}

function stopCameraPan(event) {
  state.panningCamera = false;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
}

function updateBuildZoomControl() {
  if (!buildZoomInput) return;
  buildZoomInput.min = String(config.buildMinZoom);
  buildZoomInput.max = String(config.buildMaxZoom);
  buildZoomInput.value = String(Math.round(camera.position.z));
  syncEditorPane();
}

function setBuildZoom(value) {
  if (!state.paused) return;

  camera.position.z = THREE.MathUtils.clamp(
    Number(value),
    config.buildMinZoom,
    config.buildMaxZoom,
  );
  camera.lookAt(camera.position.x, camera.position.y, 0);
  updateBuildZoomControl();
}

function getEditableObjectBounds() {
  const bounds = {
    minX: state.player.x,
    maxX: state.player.x,
    minY: state.player.y,
    maxY: state.player.y,
  };

  const include = (x, y, halfWidth = 0, halfHeight = 0) => {
    bounds.minX = Math.min(bounds.minX, x - halfWidth);
    bounds.maxX = Math.max(bounds.maxX, x + halfWidth);
    bounds.minY = Math.min(bounds.minY, y - halfHeight);
    bounds.maxY = Math.max(bounds.maxY, y + halfHeight);
  };

  for (const object of editableObjects) {
    if (object.type === "anchor") {
      include(object.position.x, object.position.y, 2, 2);
    } else if (object.type === "hazard") {
      include(object.mesh.position.x, object.mesh.position.y, object.width / 2 + 1, object.height / 2 + 1);
    } else if (object.type === "bonus") {
      include(object.mesh.position.x, object.mesh.position.y, 1.5, 1.5);
    } else if (object.type === "slowmo") {
      include(object.group.position.x, object.group.position.y, config.slowMotionRingRadius + 1, config.slowMotionRingRadius + 1);
    } else if (object.type === "finish") {
      include(object.x, object.y - object.buildingHeight * 0.5, object.width / 2 + 2, object.buildingHeight * 0.5 + 2);
    }
  }

  return bounds;
}

function fitBuildViewToStage() {
  if (!state.paused) return;

  const bounds = getEditableObjectBounds();
  const centerX = (bounds.minX + bounds.maxX) * 0.5;
  const centerY = (bounds.minY + bounds.maxY) * 0.5;
  const halfWidth = (bounds.maxX - bounds.minX) * 0.5 + config.buildViewPadding;
  const halfHeight = (bounds.maxY - bounds.minY) * 0.5 + config.buildViewPadding;
  const fovScale = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
  const zoomForWidth = halfWidth / (fovScale * Math.max(camera.aspect, 0.01));
  const zoomForHeight = halfHeight / fovScale;

  camera.position.x = centerX;
  camera.position.y = THREE.MathUtils.clamp(centerY, config.buildMinY, config.buildMaxY);
  setBuildZoom(Math.max(zoomForWidth, zoomForHeight));
}

function startPointerControl(event) {
  sfx.unlock();
  if (state.paused) {
    startEditorDrag(event);
    return;
  }

  if (event.pointerType === "touch") {
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    state.spaceDownAt = performance.now() / 1000;
    state.spaceIsDown = true;
    state.spaceHadAnchor = false;
    jumpFromPlatform();
    return;
  }

  if (event.button === 2) {
    event.preventDefault();
    queueFlourish(performance.now() / 1000);
    return;
  }

  if (event.button !== 0) return;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  state.spaceDownAt = performance.now() / 1000;
  state.spaceIsDown = true;
  state.spaceHadAnchor = false;
  jumpFromPlatform();
}

function stopPointerControl(event) {
  if (state.inspectFrozen) {
    event.preventDefault();
    return;
  }

  if (state.paused || state.draggedObject || state.panningCamera) {
    stopEditorDrag(event);
    return;
  }

  if (event.pointerType !== "touch" && event.type === "pointerup" && event.button !== 0) return;
  if (!state.spaceIsDown) return;
  event.preventDefault();
  const hadAnchor = state.spaceHadAnchor || state.grappled;
  releaseGrapple({ pop: hadAnchor });
  state.spaceDownAt = -100;
  state.spaceIsDown = false;
  state.spaceHadAnchor = false;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
}

function scrollBuildView(event) {
  event.preventDefault();
  if (!state.paused) {
    const zoomDelta = event.deltaY * config.cameraWheelZoomSpeed;
    const baseZoom = state.manualCameraZoom ? state.manualCameraZoomZ : camera.position.z;
    state.manualCameraZoom = true;
    state.manualCameraZoomZ = THREE.MathUtils.clamp(
      baseZoom + zoomDelta,
      config.cameraMinZoom,
      config.cameraMaxZoom + config.cameraManualZoomMax,
    );
    camera.position.z = state.manualCameraZoomZ;
    camera.lookAt(camera.position.x, camera.position.y, 0);
    return;
  }

  if (event.shiftKey) {
    camera.position.y = THREE.MathUtils.clamp(
      camera.position.y - event.deltaY * config.buildPanSpeed,
      config.buildMinY,
      config.buildMaxY,
    );
    camera.position.x += event.deltaX * config.buildPanSpeed;
  } else {
    camera.position.z = THREE.MathUtils.clamp(
      camera.position.z + event.deltaY * config.buildZoomSpeed,
      config.buildMinZoom,
      config.buildMaxZoom,
    );
  }
  camera.lookAt(camera.position.x, camera.position.y, 0);
  updateBuildZoomControl();
}

function reset({ resetLevelStats = false } = {}) {
  if (resetLevelStats) {
    state.deaths = 0;
    state.highestMultiplier = 1;
    state.completedFlips = 0;
  }
  state.player.copy(getLevelStart());
  state.previousPlayer.copy(state.player);
  state.velocity.set(0, 0, 0);
  state.hasLaunched = false;
  state.grounded = false;
  state.grappled = false;
  state.hookActive = false;
  state.failedGrappleActive = false;
  state.failedGrappleAge = 0;
  state.hookEnd.copy(state.player);
  state.previousHookEnd.copy(state.player);
  state.ropeLength = config.minRopeLength;
  state.anchor = null;
  state.lastReleasedAnchor = null;
  state.lastFlourishAt = -100;
  state.queuedFlourishUntil = -100;
  state.flourishPulse = 0;
  state.flourishVariant = "backFlip";
  state.ropePulse = 0;
  state.ropeCrackle = 0;
  state.slowMotionRemaining = 0;
  state.pendingSlowMotion = false;
  state.score = 0;
  state.scoreFloat = 0;
  state.multiplier = 1;
  state.multiplierExpiresAt = -100;
  state.multiplierActions.clear();
  state.nextScoreX = state.player.x + 18;
  state.gameOver = false;
  state.finished = false;
  state.levelCompleteShown = false;
  state.restartAt = 0;
  state.spaceDownAt = -100;
  state.spaceIsDown = false;
  state.spaceHadAnchor = false;
  state.flourishSpinRemaining = 0;
  state.flourishFlipDirection = 1;
  state.flourishCompletionArmed = false;
  state.hookWrapPulse = 0;
  state.stuntAnchor = null;
  state.stuntLastAngle = 0;
  state.stuntRotation = 0;
  state.stuntTopOverArmed = false;
  state.stuntBoostArmed = false;
  state.stuntBurstClockArmed = false;
  state.stuntBurstPulse = 0;
  state.crashExploding = false;
  state.crashExplosionStartedAt = -100;
  state.facing = 1;
  state.cameraZoomOffset = 0;
  state.manualCameraZoom = false;
  state.manualCameraZoomZ = config.cameraBaseZoom;
  playerPoseRotationSmoothed = 0;
  resetGlbPivotAngles();
  resetRibbonPhysics();
  resetJeremyFireworks();
  levelCompletePanel.classList.add("hidden");
  anchors.forEach((anchor) => {
    anchor.used = false;
    anchor.visualOffset.set(0, 0, 0);
    anchor.visualVelocity.set(0, 0, 0);
    anchor.impactOffset.set(0, 0, 0);
    anchor.impactVelocity.set(0, 0, 0);
    anchor.malfunctioning = false;
    anchor.malfunctionVelocity.set(0, 0, 0);
    anchor.malfunctionSpin = 0;
    anchor.blownRotor = null;
    anchor.blownThruster = null;
    anchor.hitMesh.visible = true;
    for (const rotor of anchor.rotors) rotor.visible = true;
    for (const thruster of anchor.thrusters) {
      thruster.body.visible = true;
      thruster.glow.visible = true;
      thruster.flame.visible = true;
      thruster.hot.visible = true;
      thruster.glow.material.color.setHex(0x36f6ff);
      thruster.glow.material.opacity = 1;
      thruster.glow.scale.set(1, 1, 1);
      thruster.flame.material.color.setHex(0xff9a1f);
      thruster.flame.material.opacity = 1;
      thruster.flame.scale.set(1, 1, 1);
      thruster.hot.material.color.setHex(0xffff55);
      thruster.hot.material.opacity = 1;
      thruster.hot.scale.set(1, 1, 1);
      if (thruster.smoke) {
        thruster.smoke.visible = false;
        thruster.smoke.material.opacity = 0;
        thruster.smoke.scale.setScalar(1);
      }
    }
    anchor.mesh.position.copy(anchor.position);
    anchor.mesh.rotation.set(0, 0, 0);
    anchor.debugAnchor.visible = config.debugShowDroneAnchors;
    setDroneState(anchor, DroneState.IDLE);
  });
  bonuses.forEach((bonus) => {
    bonus.collected = false;
    bonus.mesh.visible = true;
  });
  slowMotionRings.forEach((powerup) => {
    powerup.collected = false;
    powerup.group.visible = true;
    powerup.group.scale.setScalar(1);
    powerup.ring.material.opacity = 0.88;
    powerup.innerRing.material.opacity = 0.88;
    powerup.glow.material.opacity = 0.26;
  });
  ropeLine.visible = false;
  ropeMesh.visible = false;
  failedGrappleChainLine.visible = false;
  ropeCrackleLine.visible = false;
  setRopeEnergyWrapsVisible(false);
  hookTip.visible = false;
  hookHead.visible = false;
  hookWrap.visible = false;
  setAnchorPlasmaLockVisible(false);
  targetGlow.visible = false;
  targetRing.visible = false;
  syncCharacterSourceVisibility();
  for (const piece of crashPieces) {
    piece.mesh.visible = false;
    piece.mesh.material.opacity = 1;
  }
  trailPoints.length = 0;
  for (const line of trailLines) line.visible = false;
  for (const spark of ropeSparks) {
    spark.life = 0;
    spark.mesh.visible = false;
    spark.mesh.material.opacity = 0;
  }
}

function refreshLucideIcons() {
  window.lucide?.createIcons?.({
    attrs: {
      "aria-hidden": "true",
      "stroke-width": 2.25,
    },
  });
}

function setIconButtonLabel(button, label, iconName = null) {
  if (!button) return;

  const currentIcon = iconName ?? button.querySelector("[data-lucide]")?.dataset.lucide;
  if (!currentIcon) {
    button.textContent = label;
    return;
  }

  button.innerHTML = `<span data-lucide="${currentIcon}" aria-hidden="true"></span><span>${label}</span>`;
  refreshLucideIcons();
}

function decorateControls() {
  const buttons = [
    [togglePauseButton, state.paused ? "Play" : "Pause", state.paused ? "play" : "pause"],
    [addObjectButton, "Add", "plus"],
    [removeObjectButton, "Remove", "trash-2"],
    [zoomOutButton, "", "minus"],
    [zoomInButton, "", "plus"],
    [zoomFitButton, "Birds eye", "scan-eye"],
    [animateCharacterButton, state.animatorMode ? "Animating" : "Animate", "bone"],
    [savePoseButton, "Save pose", "save"],
    [resetPoseButton, "Reset pose", "rotate-ccw"],
    [exportPoseButton, "Download poses", "download"],
    [pixelateToggleButton, pixelateSettings.enabled ? "Pixelate on" : "Pixelate off", "scan-line"],
    [muteButton, "", sfx.settings.masterMuted ? "volume-x" : "volume-2"],
    [sfxMuteButton, sfx.settings.sfxMuted ? "SFX off" : "SFX on", sfx.settings.sfxMuted ? "volume-x" : "volume-2"],
    [musicMuteButton, sfx.settings.musicMuted ? "Music off" : "Music on", sfx.settings.musicMuted ? "volume-x" : "music-2"],
    [resetAnchorsButton, "Reset layout", "map"],
  ];

  for (const [button, label, icon] of buttons) setIconButtonLabel(button, label, icon);
  refreshLucideIcons();
}

function setPaused(paused) {
  state.paused = paused;
  if (state.paused) {
    state.inspectFrozenAt = performance.now() / 1000;
    physicsAccumulator = 0;
  }
  if (!state.paused && state.animatorMode) {
    state.animatorMode = false;
    state.draggedPoseHandle = null;
    state.manualPoseAngles = {};
  }
  setIconButtonLabel(togglePauseButton, state.paused ? "Play" : "Pause", state.paused ? "play" : "pause");
  buildTools.classList.toggle("hidden", !state.paused || Boolean(tweakPane));
  editorPane?.classList.toggle("hidden", !state.paused);
  applyBuildVisualMode(state.paused);
  if (state.paused) updateBuildZoomControl();
  setEditorObjectSelected(state.selectedObject, Boolean(state.selectedObject));
  if (!state.paused) {
    selectEditorObject(null);
    state.draggedObject = null;
  }
  syncAnimatorControls();
  updatePoseHandles();
  syncEditorPane();
}

function setInspectFrozen(frozen, now = performance.now() / 1000) {
  state.inspectFrozen = frozen;
  if (frozen) {
    state.inspectFrozenAt = now;
    physicsAccumulator = 0;
    state.keys.delete("Space");
    state.spaceDownAt = -100;
    state.spaceIsDown = false;
  }
}

function applyBuildVisualMode(enabled) {
  scene.fog = enabled ? null : gameplayFog;
  for (const layerName of buildModeHiddenAtmosphereLayers) {
    const layer = parallaxLayers[layerName];
    if (!layer) continue;
    if (enabled) {
      if (!buildModeLayerState.has(layerName)) buildModeLayerState.set(layerName, layer.enabled);
      layer.enabled = false;
      layer.group.visible = false;
    } else {
      layer.enabled = buildModeLayerState.has(layerName)
        ? buildModeLayerState.get(layerName)
        : layer.enabled;
      layer.group.visible = layer.enabled;
      buildModeLayerState.delete(layerName);
    }
  }
}

function getScoreRank(score, deaths) {
  const adjustedScore = score - deaths * 8;
  if (adjustedScore >= 85) return "S";
  if (adjustedScore >= 65) return "A";
  if (adjustedScore >= 45) return "B";
  if (adjustedScore >= 25) return "C";
  return "D";
}

function showLevelComplete() {
  if (state.levelCompleteShown) return;

  state.levelCompleteShown = true;
  completeDeathsEl.textContent = String(state.deaths);
  completeMultiplierEl.textContent = `${state.highestMultiplier.toFixed(1).replace(".0", "")}x`;
  completeFlipsEl.textContent = String(state.completedFlips);
  completeScoreEl.textContent = String(state.score);
  completeRankEl.textContent = getScoreRank(state.score, state.deaths);
  levelCompletePanel.classList.remove("hidden");
  launchJeremyFireworks(performance.now() / 1000, true);
  window.setTimeout(() => launchJeremyFireworks(performance.now() / 1000, true), 180);
  window.setTimeout(() => launchJeremyFireworks(performance.now() / 1000, true), 360);
}

function isSlowMotionActive() {
  return (
    state.slowMotionRemaining > 0 &&
    state.hasLaunched &&
    !state.grounded &&
    !state.grappled &&
    !state.hookActive &&
    !state.gameOver &&
    !state.finished
  );
}

function activateSlowMotion() {
  state.slowMotionRemaining = config.slowMotionDuration;
  state.pendingSlowMotion = false;
  state.flourishPulse = Math.max(state.flourishPulse, 0.65);
}

function collectSlowMotionRing() {
  if (state.grappled || state.hookActive) {
    state.pendingSlowMotion = true;
    state.flourishPulse = Math.max(state.flourishPulse, 0.5);
    return;
  }

  activateSlowMotion();
}

function chooseFlourishVariant() {
  return "backFlip";
}

function distanceFromSegmentToPoint(start, end, point) {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const lengthSq = segmentX * segmentX + segmentY * segmentY;
  if (lengthSq <= 0.0001) return Math.hypot(point.x - end.x, point.y - end.y);

  const t = THREE.MathUtils.clamp(
    ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / lengthSq,
    0,
    1,
  );
  const closestX = start.x + segmentX * t;
  const closestY = start.y + segmentY * t;
  return Math.hypot(point.x - closestX, point.y - closestY);
}

function getVisiblePlayBounds(margin = 0) {
  const visibleHalfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
  const visibleHalfWidth = visibleHalfHeight * camera.aspect;
  return {
    left: camera.position.x - visibleHalfWidth - margin,
    right: camera.position.x + visibleHalfWidth + margin,
    bottom: camera.position.y - visibleHalfHeight - margin,
    top: camera.position.y + visibleHalfHeight + margin,
  };
}

function isWorldPointOnScreen(point, margin = 0) {
  const bounds = getVisiblePlayBounds(margin);
  return (
    point.x >= bounds.left &&
    point.x <= bounds.right &&
    point.y >= bounds.bottom &&
    point.y <= bounds.top
  );
}

function isAnchorTargetable(anchor) {
  return Boolean(
    anchor &&
    !anchor.malfunctioning &&
    anchor.droneState !== DroneState.DISABLED &&
    anchor.hitMesh?.visible !== false
  );
}

function isDownwardAnchorTargetAllowed(anchor, player = state.player) {
  if (anchor.position.y >= player.y - config.downwardTargetMinDelta) return true;
  return isWorldPointOnScreen(anchor.position, config.downwardTargetScreenMargin);
}

function hasVisibleTargetableAnchorBelow(player = state.player) {
  for (const anchor of anchors) {
    if (!isAnchorTargetable(anchor)) continue;
    if (anchor.position.y >= player.y - config.downwardTargetMinDelta) continue;
    if (!isWorldPointOnScreen(anchor.position, config.downwardTargetScreenMargin)) continue;
    if (player.distanceTo(anchor.position) <= config.grappleRange) return true;
  }
  return false;
}

function setFallbackAimDirection(origin = state.player) {
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  if (speed > 0.2) {
    state.aimDirection.set(state.velocity.x / speed, state.velocity.y / speed, 0).normalize();
  } else {
    state.aimDirection.set(state.facing || 1, 0.35, 0).normalize();
  }

  if (state.aimDirection.y < 0 && !hasVisibleTargetableAnchorBelow()) {
    const horizontal = Math.abs(state.aimDirection.x) > 0.05
      ? state.aimDirection.x
      : state.facing || 1;
    state.aimDirection.set(horizontal, config.fallbackAimUpwardBias, 0).normalize();
  }

  state.aimEnd.copy(origin).addScaledVector(state.aimDirection, config.aimLength);
}

function startCrashExplosion(now) {
  state.crashExploding = true;
  state.crashExplosionStartedAt = now;
  playerAssetRoot.visible = false;
  playerRibbonLayer.visible = false;

  for (let index = 0; index < crashPieces.length; index += 1) {
    const piece = crashPieces[index];
    const angle = (index / crashPieces.length) * Math.PI * 2 + 0.18;
    const speed = 3.6 + (index % 4) * 1.15;
    piece.mesh.position.copy(state.player);
    piece.mesh.position.x += Math.cos(angle) * 0.22;
    piece.mesh.position.y += Math.sin(angle) * 0.32 + 0.32;
    piece.mesh.rotation.set(0, 0, angle);
    piece.mesh.material.opacity = 1;
    piece.mesh.visible = true;
    piece.velocity.set(
      Math.cos(angle) * speed + state.velocity.x * 0.08,
      Math.sin(angle) * speed + Math.max(1.4, Math.abs(state.velocity.y) * 0.08),
      0,
    );
  }
}

function updateCrashExplosion(dt, now) {
  if (!state.crashExploding) return;

  const age = now - state.crashExplosionStartedAt;
  const fade = THREE.MathUtils.clamp(1 - age / config.crashExplosionDuration, 0, 1);
  for (const piece of crashPieces) {
    piece.velocity.y += config.gravity * 0.42 * dt;
    piece.mesh.position.addScaledVector(piece.velocity, dt);
    piece.mesh.rotation.z += piece.spin * dt;
    piece.mesh.material.opacity = fade;
    piece.mesh.visible = fade > 0.02;
  }
}

function crash(now) {
  if (state.gameOver) return;
  sfx.play("crash");
  state.deaths += 1;
  state.gameOver = true;
  releaseGrapple();
  startCrashExplosion(now);
  state.restartAt = now + Math.max(config.restartDelay, config.crashExplosionDuration);
  state.velocity.multiplyScalar(0.18);
}

function findAnchorFor(player, velocity, lastReleasedAnchor) {
  let best = null;
  let bestScore = Infinity;
  const speed = Math.hypot(velocity.x, velocity.y);
  const movingForward = velocity.x > config.forwardGrappleSpeed;
  const travelDirection = new THREE.Vector3(
    speed > 0.1 ? velocity.x / speed : 1,
    speed > 0.1 ? velocity.y / speed : 0.35,
    0,
  ).normalize();
  const mostlyVerticalRelease =
    lastReleasedAnchor &&
    velocity.y > config.regrabSameAnchorVerticalSpeed &&
    Math.abs(velocity.x) < config.regrabSameAnchorHorizontalSpeed;

  for (const anchor of anchors) {
    if (!isAnchorTargetable(anchor)) continue;
    const dx = anchor.position.x - player.x;
    const dy = anchor.position.y - player.y;
    if (dy < -config.downwardTargetMinDelta && !isDownwardAnchorTargetAllowed(anchor, player)) continue;

    const distance = Math.hypot(dx, dy);
    if (distance > config.grappleRange) continue;

    const toAnchor = new THREE.Vector3(dx, dy, 0).normalize();
    const directionFit = travelDirection.dot(toAnchor);
    const isSameVerticalRegrab = mostlyVerticalRelease && anchor === lastReleasedAnchor;
    const isBehindForwardMotion = movingForward && dx < -config.behindAnchorRejectDistance;
    if (isBehindForwardMotion && !isSameVerticalRegrab) continue;
    if (!isSameVerticalRegrab && dx < -2.8 && directionFit < 0.35) continue;

    let score = distance - directionFit * 4.5;
    if (isSameVerticalRegrab) score -= 8.0;
    if (dx > 0) score -= 0.8 + (movingForward ? config.forwardAnchorBonus : 0);
    if (dx < 0 && movingForward && !isSameVerticalRegrab) score += config.behindAnchorPenalty;

    if (score < bestScore) {
      best = anchor;
      bestScore = score;
    }
  }

  return best;
}

function findAnchor() {
  return findAnchorFor(state.player, state.velocity, state.lastReleasedAnchor);
}

function findGuideAnchor() {
  let best = null;
  let bestDistance = Infinity;

  for (const anchor of anchors) {
    if (!isAnchorTargetable(anchor)) continue;
    if (!isDownwardAnchorTargetAllowed(anchor)) continue;
    const distance = state.player.distanceTo(anchor.position);
    if (distance > config.grappleRange) continue;

    if (distance < bestDistance) {
      best = anchor;
      bestDistance = distance;
    }
  }

  return best;
}

function hasAvailableAnchorInReach() {
  for (const anchor of anchors) {
    if (!isAnchorTargetable(anchor)) continue;
    if (state.player.distanceTo(anchor.position) <= config.grappleRange) return true;
  }
  return false;
}

function findHookHit() {
  let best = null;
  let bestDistance = Infinity;

  if (isAnchorTargetable(state.anchor) && isDownwardAnchorTargetAllowed(state.anchor)) {
    const targetDistance = state.hookEnd.distanceTo(state.anchor.position);
    const targetPathDistance = distanceFromSegmentToPoint(state.previousHookEnd, state.hookEnd, state.anchor.position);
    if (Math.min(targetDistance, targetPathDistance) < config.hookHitRadius) return state.anchor;
  }

  for (const anchor of anchors) {
    if (!isAnchorTargetable(anchor)) continue;
    if (!isDownwardAnchorTargetAllowed(anchor)) continue;
    const playerDistance = state.player.distanceTo(anchor.position);
    if (playerDistance > config.maxRopeLength + 0.75) continue;

    const hookDistance = state.hookEnd.distanceTo(anchor.position);
    const hookPathDistance = distanceFromSegmentToPoint(state.previousHookEnd, state.hookEnd, anchor.position);
    const hitDistance = Math.min(hookDistance, hookPathDistance);
    if (hitDistance < config.hookHitRadius && hitDistance < bestDistance) {
      best = anchor;
      bestDistance = hitDistance;
    }
  }

  return best;
}

function syncFailedGrappleChainGeometry() {
  const positions = failedGrappleChainGeometry.attributes.position;
  for (let index = 0; index < failedGrappleChainPoints.length; index += 1) {
    const point = failedGrappleChainPoints[index];
    positions.setXYZ(index, point.x, point.y, point.z);
  }
  positions.needsUpdate = true;
}

function startFailedGrapple(origin, options = {}) {
  sfx.play("hookShot");
  state.hookActive = true;
  state.failedGrappleActive = true;
  state.failedGrappleAge = 0;
  state.anchor = null;
  state.grappled = false;
  state.ropeLength = config.minRopeLength;

  scratchVelocityDirection.copy(state.aimDirection);
  if (options.end) scratchVelocityDirection.subVectors(options.end, origin);
  if (scratchVelocityDirection.lengthSq() < 0.001) {
    scratchVelocityDirection.set(
      state.velocity.x || state.facing || 1,
      state.velocity.y || -0.35,
      0,
    );
  }
  scratchVelocityDirection.normalize();

  const initialStep = config.failedGrappleChainThrowSpeed * config.physicsStep;
  const maxChainDistance = config.failedGrappleChainSegmentLength * (failedGrappleChainPoints.length - 1);
  const requestedDistance = options.end
    ? Math.min(origin.distanceTo(options.end), maxChainDistance)
    : maxChainDistance;
  const chainPerp = scratchPerpDirection.set(-scratchVelocityDirection.y, scratchVelocityDirection.x, 0);
  for (let index = 0; index < failedGrappleChainPoints.length; index += 1) {
    const amount = failedGrappleChainPoints.length > 1
      ? index / (failedGrappleChainPoints.length - 1)
      : 0;
    const distance = failedGrappleChainPoints.length > 1
      ? requestedDistance * amount
      : 0;
    const point = failedGrappleChainPoints[index]
      .copy(origin)
      .addScaledVector(scratchVelocityDirection, distance);
    if (options.limp) {
      const sag = Math.sin(amount * Math.PI) * 0.28 + amount * amount * 0.72;
      const sway = Math.sin(amount * Math.PI * 2.4) * 0.12;
      point.x += chainPerp.x * sway;
      point.y += chainPerp.y * sway;
      point.y -= sag;
    }
    point.z = 0.64;
    failedGrappleChainPrevious[index].copy(point);
    if (options.limp) {
      failedGrappleChainPrevious[index]
        .addScaledVector(state.velocity, -config.physicsStep * 0.48)
        .addScaledVector(scratchVelocityDirection, -initialStep * 0.18);
    } else {
      failedGrappleChainPrevious[index].addScaledVector(scratchVelocityDirection, -initialStep);
    }
  }

  state.previousHookEnd.copy(origin);
  state.hookEnd.copy(failedGrappleChainPoints[failedGrappleChainPoints.length - 1]);
  syncFailedGrappleChainGeometry();

  ropeLine.visible = false;
  ropeMesh.visible = false;
  ropeCrackleLine.visible = false;
  setRopeEnergyWrapsVisible(false);
  failedGrappleChainLine.visible = true;
  hookTip.visible = true;
  hookHead.visible = true;
}

function setFacingTowardX(targetX, deadZone = 0.28) {
  if (!Number.isFinite(targetX)) return;
  const dx = targetX - state.player.x;
  if (Math.abs(dx) > deadZone) state.facing = dx >= 0 ? 1 : -1;
}

function attachAnchor(anchor) {
  sfx.play("hookCatch", Math.hypot(state.velocity.x, state.velocity.y));
  state.anchor = anchor;
  state.grappled = true;
  setFacingTowardX(anchor.position.x);
  state.hookWrapPulse = 1;
  state.ropeLength = Math.max(
    config.minRopeLength,
    Math.min(config.maxRopeLength, state.player.distanceTo(anchor.position)),
  );
  state.hookEnd.copy(anchor.position);
  state.stuntAnchor = anchor;
  state.stuntLastAngle = Math.atan2(
    state.player.y - anchor.position.y,
    state.player.x - anchor.position.x,
  );
  state.stuntRotation = 0;
  state.stuntTopOverArmed = false;
  state.stuntBoostArmed = false;
  state.stuntBurstClockArmed = false;
  const catchSpeed = Math.max(0, -state.velocity.y);
  const catchDip = THREE.MathUtils.clamp((catchSpeed - 1.5) * 0.0385, 0.035, 0.385);
  anchor.impactOffset.set(
    THREE.MathUtils.clamp(state.velocity.x * 0.015, -0.18, 0.18),
    -catchDip,
    0,
  );
  anchor.impactVelocity.set(0, -catchDip * 2.45, 0);
  setDroneState(anchor, DroneState.GRAPPLED);
}

function startGrapple(anchorOverride = null) {
  if (state.gameOver || state.finished || state.hookActive) return;
  if (!state.hasLaunched) {
    state.hasLaunched = true;
    state.velocity.copy(state.launchVelocity);
  }
  const overrideAnchor = isAnchorTargetable(anchorOverride) && isDownwardAnchorTargetAllowed(anchorOverride)
    ? anchorOverride
    : null;
  const anchor = overrideAnchor ?? findAnchor();
  const origin = getRopeOrigin();
  if (anchor) {
    state.aimDirection.subVectors(anchor.position, origin).normalize();
  } else {
    setFallbackAimDirection(origin);
  }
  const missedWhileFalling =
    !anchor &&
    state.hasLaunched &&
    !state.grounded &&
    state.velocity.y <= config.failedGrappleFallSpeedThreshold &&
    !hasAvailableAnchorInReach();
  if (missedWhileFalling) {
    scratchRopeEnd.copy(origin).addScaledVector(state.aimDirection, Math.min(config.aimLength, config.maxRopeLength * 0.82));
    startFailedGrapple(origin, { end: scratchRopeEnd, limp: true });
    return;
  }

  sfx.play("hookShot");
  state.hookActive = true;
  state.failedGrappleActive = false;
  state.failedGrappleAge = 0;
  state.anchor = anchor;
  state.grappled = false;
  state.ropeLength = config.minRopeLength;
  if (anchor) {
    setFacingTowardX(anchor.position.x);
  }
  state.hookEnd.copy(origin).addScaledVector(state.aimDirection, config.minRopeLength);
  state.previousHookEnd.copy(origin);

  ropeLine.visible = true;
  ropeMesh.visible = true;
  hookTip.visible = true;
}

function getStandingPlatform() {
  for (const platform of platforms) {
    const standY = platform.y + config.platformStandOffset;
    const withinX = Math.abs(state.player.x - platform.x) <= platform.width / 2 + 0.28;
    const withinY = Math.abs(state.player.y - standY) <= 0.42;
    if (withinX && withinY) return platform;
  }

  return null;
}

function jumpFromPlatform() {
  if (state.gameOver || state.finished) return false;
  const platform = getStandingPlatform();
  if (!platform && state.hasLaunched) return false;

  sfx.play("jump");
  state.hasLaunched = true;
  state.grounded = false;
  state.velocity.set(config.platformJumpForward, config.platformJumpLift, 0);
  state.player.x += 0.08;
  if (platform) state.player.y = platform.y + config.platformStandOffset + 0.03;
  state.flourishPulse = 0.45;
  return true;
}

function getReleasePopVelocity(anchor) {
  const releaseVelocity = state.velocity.clone();
  const toPlayer = new THREE.Vector3().subVectors(state.player, anchor.position);
  const distance = Math.max(toPlayer.length(), 0.001);
  const normal = toPlayer.multiplyScalar(1 / distance);
  const tangent = new THREE.Vector3(-normal.y, normal.x, 0);
  if (releaseVelocity.dot(tangent) < 0) tangent.multiplyScalar(-1);

  releaseVelocity.addScaledVector(tangent, config.releasePopTangent);
  releaseVelocity.x += Math.max(0.25, Math.sign(releaseVelocity.x || 1)) * config.releasePopForward;
  releaseVelocity.y = Math.max(
    releaseVelocity.y + config.releasePopUpwardBonus,
    config.releasePopLift,
  );
  return releaseVelocity;
}

function releaseGrapple({ pop = false } = {}) {
  if (!state.hookActive && !state.grappled) return;
  const hadAnchor = state.grappled && state.anchor;
  const releasedAnchor = state.anchor;
  const shouldActivateSlowMotion = state.pendingSlowMotion;
  state.grappled = false;
  state.hookActive = false;
  state.failedGrappleActive = false;
  state.failedGrappleAge = 0;
  if (hadAnchor) state.lastReleasedAnchor = releasedAnchor;
  if (state.anchor) {
    state.anchor.releasedAt = performance.now() / 1000;
    if (
      isMalfunctionVehicleAnchor(state.anchor) &&
      isAnchorBehindPlayer(state.anchor) &&
      Math.random() < config.droneMalfunctionChance
    ) {
      triggerVehicleMalfunction(state.anchor);
    } else {
      setDroneState(state.anchor, DroneState.RELEASED);
    }
  }
  state.anchor = null;
  state.stuntAnchor = null;
  state.stuntRotation = 0;
  state.stuntTopOverArmed = false;
  state.stuntBoostArmed = false;
  state.stuntBurstClockArmed = false;
  ropeLine.visible = false;
  ropeMesh.visible = false;
  failedGrappleChainLine.visible = false;
  ropeCrackleLine.visible = false;
  setRopeEnergyWrapsVisible(false);
  hookTip.visible = false;
  hookHead.visible = false;
  hookWrap.visible = false;
  setAnchorPlasmaLockVisible(false);

  if (shouldActivateSlowMotion) {
    activateSlowMotion();
  }

  if (hadAnchor && pop && !state.gameOver) {
    sfx.play("release");
    state.velocity.copy(getReleasePopVelocity(releasedAnchor));
  }
}

function canFlourish(now) {
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  return (
    !state.gameOver &&
    !state.finished &&
    state.hasLaunched &&
    state.player.y > config.bottomDeathY + 2 &&
    speed >= config.flourishMinSpeed &&
    now - state.lastFlourishAt >= config.flourishCooldown
  );
}

function flourish(now) {
  if (!canFlourish(now)) return;
  if (state.flourishSpinRemaining > 0) return;
  sfx.play("flourish");
  releaseGrapple();
  state.velocity.x += config.flourishBoost;
  state.velocity.y += config.flourishLift;
  state.lastFlourishAt = now;
  state.flourishPulse = 1;
  state.flourishSpinRemaining = config.flourishSpinDuration;
  state.flourishFlipDirection = state.velocity.x >= 0 ? 1 : -1;
  state.flourishCompletionArmed = true;
  state.flourishVariant = chooseFlourishVariant();
  if (isSlowMotionActive()) {
    addScore(9, "slow-flourish", now);
  } else {
    addScore(5, "flourish", now);
  }
}

function queueFlourish(now) {
  if (state.flourishSpinRemaining > 0) return;
  state.queuedFlourishUntil = now + config.flourishBufferWindow;
  flourish(now);
}

function updateQueuedFlourish(now) {
  if (now > state.queuedFlourishUntil) return;
  if (!canFlourish(now)) return;
  state.queuedFlourishUntil = -100;
  flourish(now);
}

function updateInput(dt) {
  if (!state.hasLaunched) {
    state.velocity.set(0, 0, 0);
    return;
  }

  state.velocity.x = THREE.MathUtils.clamp(
    state.velocity.x,
    -config.maxForwardSpeed * 0.55,
    config.maxForwardSpeed,
  );

  state.velocity.y += config.gravity * dt;
}

function updateStuntBoost(normal) {
  if (!state.grappled || !state.anchor) return;

  const angle = Math.atan2(normal.y, normal.x);
  if (state.stuntAnchor !== state.anchor) {
    state.stuntAnchor = state.anchor;
    state.stuntLastAngle = angle;
    state.stuntRotation = 0;
    state.stuntTopOverArmed = false;
    state.stuntBoostArmed = false;
    state.stuntBurstClockArmed = false;
  }

  let angleDelta = angle - state.stuntLastAngle;
  if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
  if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
  state.stuntLastAngle = angle;
  state.stuntRotation += angleDelta;

  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  const isTopOver =
    normal.y > 0.42 &&
    state.velocity.x < -0.8 &&
    speed >= config.stuntTopOverMinSpeed;
  if (isTopOver) state.stuntTopOverArmed = true;

  const completedLoop = Math.abs(state.stuntRotation) >= config.stuntLoopAngle;
  if (completedLoop || state.stuntTopOverArmed) {
    state.stuntBoostArmed = true;
    state.stuntBurstClockArmed = true;
    state.stuntTopOverArmed = false;
    state.stuntRotation = 0;
  }

  const burstAngleDelta = Math.abs(Math.atan2(
    Math.sin(angle - config.stuntBurstTargetAngle),
    Math.cos(angle - config.stuntBurstTargetAngle),
  ));
  const isBurstPosition = burstAngleDelta <= config.stuntBurstAngleWindow;
  const isDownSwing = state.velocity.y <= -0.9;
  if (!state.stuntBoostArmed || !state.stuntBurstClockArmed || !isBurstPosition || !isDownSwing) return;

  scratchVelocityDirection.set(state.velocity.x, state.velocity.y, 0);
  if (scratchVelocityDirection.lengthSq() > 0.001) {
    scratchVelocityDirection.normalize();
    state.velocity.addScaledVector(scratchVelocityDirection, config.stuntBoostSpeed);
  }
  state.velocity.x += config.stuntBoostForward;
  state.stuntBoostArmed = false;
  state.stuntBurstClockArmed = false;
  state.stuntBurstPulse = 1;
  state.flourishPulse = Math.max(state.flourishPulse, 0.55);
  addScore(3, "loop-burst");
}

function updateFailedGrappleChain(dt) {
  state.failedGrappleAge += dt;
  state.previousHookEnd.copy(state.hookEnd);

  const pinnedPoint = getRopeOrigin(scratchRopeStart);
  failedGrappleChainPoints[0].copy(pinnedPoint);
  failedGrappleChainPoints[0].z = 0.64;
  failedGrappleChainPrevious[0].copy(failedGrappleChainPoints[0]);

  const gravityStep = config.gravity * config.failedGrappleChainGravityScale * dt * dt;
  const playerDrift = state.velocity.x * dt * 0.025;
  for (let index = 1; index < failedGrappleChainPoints.length; index += 1) {
    const point = failedGrappleChainPoints[index];
    const previous = failedGrappleChainPrevious[index];
    const velocityX = (point.x - previous.x) * config.failedGrappleChainDamping;
    const velocityY = (point.y - previous.y) * config.failedGrappleChainDamping;
    previous.copy(point);
    point.x += velocityX + playerDrift;
    point.y += velocityY + gravityStep;
    point.z = 0.64;
  }

  for (let pass = 0; pass < config.failedGrappleConstraintPasses; pass += 1) {
    failedGrappleChainPoints[0].copy(pinnedPoint);
    failedGrappleChainPoints[0].z = 0.64;
    for (let index = 1; index < failedGrappleChainPoints.length; index += 1) {
      const previousPoint = failedGrappleChainPoints[index - 1];
      const point = failedGrappleChainPoints[index];
      scratchRopeEnd.subVectors(point, previousPoint);
      const distance = Math.max(scratchRopeEnd.length(), 0.001);
      const correction = (distance - config.failedGrappleChainSegmentLength) / distance;
      if (index === 1) {
        point.addScaledVector(scratchRopeEnd, -correction);
      } else {
        previousPoint.addScaledVector(scratchRopeEnd, correction * 0.5);
        point.addScaledVector(scratchRopeEnd, -correction * 0.5);
      }
    }
  }

  const chainEnd = failedGrappleChainPoints[failedGrappleChainPoints.length - 1];
  state.hookEnd.copy(chainEnd);
  state.ropeLength = pinnedPoint.distanceTo(chainEnd);
  syncFailedGrappleChainGeometry();
}

function updateGrapple(dt) {
  if (!state.hookActive) return;

  if (state.failedGrappleActive) {
    updateFailedGrappleChain(dt);
    return;
  }

  if (!state.grappled) {
    state.ropeLength = Math.min(
      config.maxRopeLength,
      state.ropeLength + config.hookShotSpeed * dt,
    );
  }

  if (!state.grappled || !state.anchor) {
    if (state.hookActive) {
      state.previousHookEnd.copy(state.hookEnd);
      state.hookEnd.copy(state.player).addScaledVector(state.aimDirection, state.ropeLength);
      const hookHit = findHookHit();
      if (hookHit) attachAnchor(hookHit);
      if (
        !hookHit &&
        state.ropeLength >= config.maxRopeLength - 0.04 &&
        state.velocity.y <= config.failedGrappleFallSpeedThreshold &&
        !hasAvailableAnchorInReach()
      ) {
        startFailedGrapple(getRopeOrigin(new THREE.Vector3()), { end: state.hookEnd, limp: true });
      }
    }
    return;
  }

  const toPlayer = new THREE.Vector3().subVectors(state.player, state.anchor.position);
  const distance = Math.max(toPlayer.length(), 0.001);
  const normal = toPlayer.multiplyScalar(1 / distance);
  if (distance > state.ropeLength) {
    const stretch = distance - state.ropeLength;
    state.player.addScaledVector(normal, -stretch * 0.68);

    const radialVelocity = state.velocity.dot(normal);
    if (radialVelocity > 0) state.velocity.addScaledVector(normal, -radialVelocity * 0.96);
    state.velocity.addScaledVector(normal, -stretch * config.ropePullStiffness * dt);
    state.velocity.multiplyScalar(config.ropeDamping);
  }

  updateStuntBoost(normal);
}

function updatePlayer(dt, now) {
  if (state.finished) {
    state.velocity.multiplyScalar(0.88);
    return;
  }

  state.previousPlayer.copy(state.player);
  updateInput(dt);
  updateGrapple(dt);
  const previousY = state.player.y;
  const movement = scratchRopeEnd.set(state.velocity.x * dt, state.velocity.y * dt, 0);
  state.player.add(movement);

  state.grounded = false;
  if (!state.grappled) {
    for (const platform of platforms) {
      const standY = platform.y + config.platformStandOffset;
      const platformHalfWidth = platform.width / 2 + (platform.finish ? 0.7 : 0.28);
      const withinX = Math.abs(state.player.x - platform.x) <= platformHalfWidth;
      const crossedTop = previousY >= standY && state.player.y <= standY;
      const restingOnFinish =
        platform.finish &&
        Math.abs(state.player.y - standY) <= 0.72 &&
        state.velocity.y <= 0.3;
      if (withinX && state.velocity.y <= 0 && (crossedTop || restingOnFinish)) {
        state.player.y = standY;
        state.velocity.y = 0;
        state.grounded = true;
        if (platform.finish) completeLevel();
        break;
      }
    }
  }

  if (state.player.y <= config.bottomDeathY) {
    crash(now);
  }

  if (state.player.x > state.nextScoreX) {
    addScore(1, "distance");
    state.nextScoreX += 12;
  }
  updateSpeedScore(dt, now);
}

function updateSpaceHold(now) {
  if (
    state.spaceIsDown &&
    !state.hookActive &&
    !state.gameOver &&
    now - state.spaceDownAt >= config.holdGrappleDelay
  ) {
    startGrapple();
    state.spaceHadAnchor = state.grappled;
  }
}

function updateCourse(now, dt) {
  for (const hazard of hazards) {
    const dx = Math.abs(state.player.x - hazard.mesh.position.x);
    const dy = Math.abs(state.player.y - hazard.mesh.position.y);
    if (dx < hazard.width / 2 + 0.34 && dy < hazard.height / 2 + 0.65) {
      crash(now);
    }
  }

  for (const bonus of bonuses) {
    if (bonus.collected) continue;
    bonus.mesh.rotation.z += 2.8 * (1 / 60);
    if (state.player.distanceTo(bonus.mesh.position) < 1.05) {
      bonus.collected = true;
      bonus.mesh.visible = false;
      addScore(10, "score-ring", now);
    }
  }

  for (const powerup of slowMotionRings) {
    if (powerup.collected) continue;

    const pulse = 1 + Math.sin(now * 5.2) * 0.045;
    powerup.group.rotation.z = now * 0.9;
    powerup.innerRing.rotation.z = -now * 1.7;
    powerup.group.scale.setScalar(pulse);
    powerup.glow.material.opacity = 0.22 + Math.sin(now * 6.4) * 0.08;

    const distance = distanceFromSegmentToPoint(
      state.previousPlayer,
      state.player,
      powerup.group.position,
    );
    const currentDistance = state.player.distanceTo(powerup.group.position);
    const ropeDistance =
      state.grappled && state.anchor
        ? distanceFromSegmentToPoint(
            state.player,
            getVisualGrapplePoint(state.anchor, scratchRopeEnd),
            powerup.group.position,
          )
        : Infinity;
    if (
      distance <= config.slowMotionCollectionRadius ||
      currentDistance <= config.slowMotionCollectionRadius ||
      ropeDistance <= config.slowMotionRingRadius * 0.62
    ) {
      powerup.collected = true;
      powerup.group.visible = false;
      collectSlowMotionRing();
      addScore(15, "slow-ring", now);
    }
  }

  updateDroneVisuals(now, dt);
}

function updateDroneVisuals(now, dt) {
  const activeAnchor = isAnchorTargetable(state.anchor) ? state.anchor : null;
  const targetedAnchor = state.grappled ? activeAnchor : state.hookActive ? activeAnchor : findGuideAnchor();

  for (const anchor of anchors) {
    if (anchor.malfunctioning) {
      setDroneState(anchor, DroneState.DISABLED);
    } else if (anchor === state.anchor && state.grappled) {
      setDroneState(anchor, DroneState.GRAPPLED);
    } else if (anchor === targetedAnchor && !state.grappled) {
      setDroneState(anchor, DroneState.TARGETED);
    } else if (now - anchor.releasedAt < 0.28) {
      setDroneState(anchor, DroneState.RELEASED);
    } else {
      setDroneState(anchor, DroneState.IDLE);
    }

    const hover = anchor.malfunctioning ? 0 : Math.sin(now * 2.8 + anchor.index * 0.9) * config.droneHoverAmount;
    const tensionTarget = scratchVelocityDirection.set(0, 0, 0);
    if (!anchor.malfunctioning && anchor === state.anchor && state.grappled) {
      tensionTarget.subVectors(state.player, anchor.position);
      const distance = Math.max(tensionTarget.length(), 0.001);
      tensionTarget.multiplyScalar(1 / distance);
      const ropeTension = THREE.MathUtils.clamp(distance / Math.max(state.ropeLength, 0.1) - 0.82, 0, 1);
      tensionTarget.multiplyScalar(config.droneTensionStrength * ropeTension);
    }

    if (anchor.malfunctioning) {
      anchor.malfunctionVelocity.y += config.gravity * 0.18 * dt;
      anchor.visualOffset.addScaledVector(anchor.malfunctionVelocity, dt);
      anchor.impactOffset.set(0, 0, 0);
      anchor.impactVelocity.set(0, 0, 0);
    } else {
      anchor.visualOffset.lerp(tensionTarget, 0.18);
    }
    anchor.impactVelocity.addScaledVector(anchor.impactOffset, -18 * dt);
    anchor.impactVelocity.multiplyScalar(Math.pow(0.035, dt));
    anchor.impactOffset.addScaledVector(anchor.impactVelocity, dt);
    if (anchor.impactOffset.lengthSq() < 0.0002 && anchor.impactVelocity.lengthSq() < 0.0002) {
      anchor.impactOffset.set(0, 0, 0);
      anchor.impactVelocity.set(0, 0, 0);
    }
    anchor.mesh.position.set(
      anchor.position.x + anchor.visualOffset.x + anchor.impactOffset.x,
      anchor.position.y + hover + anchor.visualOffset.y + anchor.impactOffset.y,
      anchor.position.z,
    );

    const tilt = THREE.MathUtils.clamp((anchor.visualOffset.x + anchor.impactOffset.x) * -0.9, -0.22, 0.22);
    if (anchor.malfunctioning && anchor.visualType === "policeCar") {
      const fallTilt = -anchor.malfunctionSide * (
        0.72 + Math.min(0.62, Math.max(0, -anchor.visualOffset.y) * 0.035)
      );
      const tiltAlpha = 1 - Math.exp(-dt * 5.5);
      anchor.mesh.rotation.z = normalizeAngle(
        anchor.mesh.rotation.z + normalizeAngle(fallTilt - anchor.mesh.rotation.z) * tiltAlpha,
      );
      anchor.mesh.rotation.z += anchor.malfunctionSpin * dt * 0.22;
      anchor.mesh.rotation.y = Math.sin(now * 8.4 + anchor.index) * 0.16;
    } else {
      anchor.mesh.rotation.z = anchor.malfunctioning
        ? anchor.mesh.rotation.z + anchor.malfunctionSpin * dt
        : tilt + Math.sin(now * 1.8 + anchor.index) * 0.025;
      anchor.mesh.rotation.y = anchor.malfunctioning
        ? Math.sin(now * 7.2 + anchor.index) * 0.28
        : Math.sin(now * 1.3 + anchor.index) * 0.08;
    }
    const stateScale =
      anchor.droneState === DroneState.TARGETED ? 1.1 : anchor.droneState === DroneState.GRAPPLED ? 1.14 : 1;
    const currentScale = anchor.mesh.scale.x + (stateScale - anchor.mesh.scale.x) * 0.12;
    anchor.mesh.scale.setScalar(currentScale);

    const rotorSpeed = anchor.malfunctioning
      ? 6
      : anchor.droneState === DroneState.GRAPPLED ? 22 : anchor.droneState === DroneState.TARGETED ? 18 : 14;
    for (const rotor of anchor.rotors) {
      if (rotor === anchor.blownRotor) continue;
      rotor.rotation.z = now * rotorSpeed * (rotor.position.x < 0 ? -1 : 1);
    }
    if ((anchor.droneState === DroneState.GRAPPLED || anchor.malfunctioning) && Math.random() < dt * config.droneMalfunctionSparkChance) {
      spawnVehicleMalfunctionSpark(anchor, now);
    }
    updatePoliceCarEffects(anchor, now);

    const lightGlowOpacity =
      anchor.droneState === DroneState.IDLE ? 0.34 : anchor.droneState === DroneState.TARGETED ? 0.46 : 0.56;
    for (const glow of anchor.lightGlows) {
      glow.material.opacity = lightGlowOpacity;
      const glowScale = anchor.droneState === DroneState.GRAPPLED ? 1.42 : anchor.droneState === DroneState.TARGETED ? 1.24 : 1.08;
      glow.scale.setScalar(glowScale);
    }
    anchor.debugAnchor.visible = config.debugShowDroneAnchors;
  }
}

function updatePoliceCarEffects(anchor, now) {
  if (!anchor.sirens && !anchor.flames.length && !anchor.smokes.length) return;
  const sirenPhase = Math.floor((now * 3.8 + anchor.visualSeed) % 2);
  const bright = 1;
  const dim = 0.38;
  if (anchor.sirens) {
    anchor.sirens.red.material.opacity = sirenPhase === 0 ? bright : dim;
    anchor.sirens.blue.material.opacity = sirenPhase === 1 ? bright : dim;
    anchor.sirens.red.scale.setScalar(sirenPhase === 0 ? 1.12 : 0.96);
    anchor.sirens.blue.scale.setScalar(sirenPhase === 1 ? 1.12 : 0.96);
  }
  if (anchor.sirenGlows) {
    const redOn = sirenPhase === 0;
    anchor.sirenGlows.red.material.opacity = redOn ? 0.72 : 0.1;
    anchor.sirenGlows.blue.material.opacity = redOn ? 0.1 : 0.72;
    anchor.sirenGlows.redWash.material.opacity = redOn ? 0.34 : 0.04;
    anchor.sirenGlows.blueWash.material.opacity = redOn ? 0.04 : 0.34;
    anchor.sirenGlows.red.scale.set(redOn ? 1.34 : 0.78, redOn ? 0.8 : 0.5, 1);
    anchor.sirenGlows.blue.scale.set(redOn ? 0.78 : 1.34, redOn ? 0.5 : 0.8, 1);
    anchor.sirenGlows.redWash.scale.set(redOn ? 4.65 : 2.35, redOn ? 2.05 : 0.95, 1);
    anchor.sirenGlows.blueWash.scale.set(redOn ? 2.35 : 4.65, redOn ? 0.95 : 2.05, 1);
  }

  if (anchor.malfunctioning && anchor.visualType === "policeCar") {
    const failedThruster = anchor.blownThruster;
    const sparkPulse = Math.sin(now * 34 + anchor.visualSeed) > -0.15;
    const burst = 0.5 + 0.5 * Math.sin(now * 41 + anchor.visualSeed * 1.7);
    if (anchor.sirens) {
      anchor.sirens.red.material.opacity = sparkPulse ? 0.92 : 0.24;
      anchor.sirens.blue.material.opacity = 0.18;
      anchor.sirens.red.scale.setScalar(sparkPulse ? 1.18 : 0.9);
      anchor.sirens.blue.scale.setScalar(0.82);
    }
    if (anchor.sirenGlows) {
      anchor.sirenGlows.red.material.opacity = sparkPulse ? 0.58 : 0.16;
      anchor.sirenGlows.blue.material.opacity = 0.07;
      anchor.sirenGlows.redWash.material.opacity = sparkPulse ? 0.26 : 0.08;
      anchor.sirenGlows.blueWash.material.opacity = 0.03;
      anchor.sirenGlows.red.scale.setScalar(sparkPulse ? 1.25 : 0.76);
      anchor.sirenGlows.blue.scale.setScalar(0.72);
      anchor.sirenGlows.redWash.scale.set(sparkPulse ? 3.5 : 2.2, sparkPulse ? 1.55 : 0.9, 1);
      anchor.sirenGlows.blueWash.scale.set(1.8, 0.75, 1);
    }
    for (const thruster of anchor.thrusters) {
      const failed = thruster === failedThruster;
      if (failed) {
        thruster.body.visible = true;
        thruster.glow.visible = true;
        thruster.glow.material.color.setHex(sparkPulse ? 0xff2b1c : 0xffd34a);
        thruster.glow.material.opacity = 0.68 + burst * 0.32;
        thruster.glow.scale.set(1.1 + burst * 0.55, 1.0 + burst * 0.42, 1);
        thruster.flame.visible = true;
        thruster.hot.visible = sparkPulse;
        thruster.flame.material.color.setHex(sparkPulse ? 0xff2b1c : 0xff8d24);
        thruster.hot.material.color.setHex(0xffe65a);
        thruster.flame.material.opacity = sparkPulse ? 1 : 0.42;
        thruster.hot.material.opacity = sparkPulse ? 0.95 : 0.3;
        thruster.flame.scale.set(1.0 + burst * 0.8, 0.75 + burst * 0.65, 1);
        thruster.hot.scale.set(0.8 + burst * 0.5, 0.7 + burst * 0.5, 1);
        if (thruster.smoke) {
          thruster.smoke.visible = true;
          thruster.smoke.material.opacity = 0.28 + burst * 0.22;
          thruster.smoke.position.y = -0.72 + Math.sin(now * 9 + anchor.visualSeed) * 0.06;
          thruster.smoke.scale.setScalar(1.0 + burst * 0.85);
        }
      } else {
        thruster.body.visible = true;
        thruster.glow.visible = true;
        thruster.glow.material.color.setHex(0x36f6ff);
        thruster.glow.material.opacity = 0.72;
        thruster.glow.scale.set(0.9, 0.88, 1);
        thruster.flame.visible = true;
        thruster.hot.visible = true;
        thruster.flame.material.color.setHex(0xff9a1f);
        thruster.hot.material.color.setHex(0xffff55);
        thruster.flame.material.opacity = 0.75;
        thruster.hot.material.opacity = 0.72;
        if (thruster.smoke) {
          thruster.smoke.visible = false;
          thruster.smoke.material.opacity = 0;
        }
      }
    }
    return;
  }

  if (now >= anchor.nextSputterAt) {
    const randomish = Math.sin((anchor.visualSeed + now * 12.9898) * 78.233) * 43758.5453;
    const amount = randomish - Math.floor(randomish);
    anchor.sputterUntil = now + 0.18 + amount * 0.32;
    anchor.nextSputterAt = now + 1.1 + amount * 2.4 + (anchor.index % 3) * 0.23;
  }

  const sputtering = now < anchor.sputterUntil;
  const flicker = 0.82 + Math.sin(now * 28 + anchor.visualSeed) * 0.18;
  for (const flame of anchor.flames) {
    flame.visible = !sputtering;
    flame.material.opacity = sputtering ? 0 : THREE.MathUtils.clamp(flicker, 0.48, 1);
    flame.scale.set(0.85 + flicker * 0.24, 0.9 + flicker * 0.34, 1);
  }
  for (const [index, smoke] of anchor.smokes.entries()) {
    const progress = THREE.MathUtils.clamp((anchor.sputterUntil - now) / 0.5, 0, 1);
    smoke.visible = sputtering || progress > 0;
    smoke.material.opacity = progress * 0.58;
    smoke.position.y = -0.76 + (1 - progress) * 0.28 + Math.sin(now * 7 + index + anchor.visualSeed) * 0.025;
    smoke.scale.setScalar(0.75 + (1 - progress) * 0.85);
  }
}

function updateAimIndicator() {
  const activeAnchor = isAnchorTargetable(state.anchor) && isDownwardAnchorTargetAllowed(state.anchor)
    ? state.anchor
    : null;
  const anchor = state.hookActive ? activeAnchor : findGuideAnchor();
  const origin = getRopeOrigin();

  if (anchor) {
    state.aimEnd.copy(anchor.position);
    state.aimDirection.subVectors(anchor.position, origin).normalize();
  } else {
    setFallbackAimDirection(origin);
  }

  const positions = aimGeometry.attributes.position;
  positions.setXYZ(0, origin.x, origin.y, origin.z);
  positions.setXYZ(1, state.aimEnd.x, state.aimEnd.y, state.aimEnd.z);
  positions.needsUpdate = true;
  aimLine.visible = !state.gameOver && !state.hookActive;
}

function updateTargetGlow(now) {
  targetGlow.visible = false;
  targetRing.visible = false;
}

function updateBuildRangeGuide() {
  grappleRangeGuide.visible = state.paused;
  if (!state.paused) return;

  grappleRangeGuide.position.set(state.player.x, state.player.y, 0);
  grappleRangeGuide.material.opacity = state.selectedObject?.type === "anchor" ? 0.9 : 0.66;
}

function getVisualGrapplePoint(anchor, target = scratchRopeEnd) {
  if (!anchor?.grapplePoint) return target.copy(anchor?.position ?? state.hookEnd);
  anchor.grapplePoint.getWorldPosition(target);
  return target;
}

function getStableGlbRopeOrigin(target = scratchRopeStart) {
  localBodyPointToWorld(
    config.stableGrappleSocketX,
    config.stableGrappleSocketY,
    playerPoseRotationSmoothed,
    target,
  );

  if (state.hookActive) {
    const ropeTarget = state.grappled && state.anchor
      ? getVisualGrapplePoint(state.anchor, characterScratchA)
      : characterScratchA.copy(state.hookEnd);
    const toRopeX = ropeTarget.x - target.x;
    const toRopeY = ropeTarget.y - target.y;
    const toRopeLength = Math.hypot(toRopeX, toRopeY);
    if (toRopeLength > 0.0001) {
      target.x += (toRopeX / toRopeLength) * config.stableGrappleSocketDrift;
      target.y += (toRopeY / toRopeLength) * config.stableGrappleSocketDrift;
    }
  }

  target.z = state.player.z;
  return target;
}

function getRopeOrigin(target = scratchRopeStart) {
  if (config.glbPoseMode === "stable" && config.stableGlbPose && glbCharacter.loaded) {
    return getStableGlbRopeOrigin(target);
  }

  if (glbCharacter.loaded) {
    playerMesh.updateWorldMatrix(true, true);
    playerAssetRoot.updateWorldMatrix(true, true);
    const attachment = getGlbRopeAttachment();
    if (attachment) {
      attachment.getWorldPosition(target);
      target.z = state.player.z;
      return target;
    }
  }
  target.copy(state.player);
  target.z = state.player.z;
  return target;
}

function spawnRopeSpark(start, direction, distance, burst = false) {
  if (distance <= 0.08) return;

  const spark = ropeSparks[nextRopeSpark];
  nextRopeSpark = (nextRopeSpark + 1) % ropeSparks.length;
  const along = 0.12 + Math.random() * 0.76;
  const side = Math.random() < 0.5 ? -1 : 1;
  const scatter = burst ? 2.2 : 1.1;
  scratchPerpDirection.set(-direction.y, direction.x, 0);

  spark.life = THREE.MathUtils.lerp(config.ropeSparkLifeMin, config.ropeSparkLifeMax, Math.random());
  spark.maxLife = spark.life;
  spark.mesh.position
    .copy(start)
    .addScaledVector(direction, distance * along)
    .addScaledVector(scratchPerpDirection, side * (0.08 + Math.random() * 0.12));
  spark.mesh.position.z = 0.36;
  spark.velocity
    .copy(state.velocity)
    .multiplyScalar(0.08 + Math.random() * 0.05)
    .addScaledVector(direction, (Math.random() - 0.5) * scatter)
    .addScaledVector(scratchPerpDirection, side * (1.2 + Math.random() * 2.2) * scatter);
  spark.velocity.y += 0.6 + Math.random() * 1.4;
  spark.mesh.rotation.z = Math.random() * Math.PI;
  spark.mesh.scale.setScalar(0.75 + Math.random() * 0.8);
  spark.mesh.material.color.setHex(Math.random() < 0.25 ? 0xffffff : 0x6cf3ff);
  spark.mesh.material.opacity = 0.9;
  spark.mesh.visible = true;
}

function spawnPhysicsSpark(position, velocity, {
  color = 0xffffff,
  life = 0.38,
  size = 1,
  opacity = 0.96,
} = {}) {
  const spark = ropeSparks[nextRopeSpark];
  nextRopeSpark = (nextRopeSpark + 1) % ropeSparks.length;
  spark.life = life * (0.78 + Math.random() * 0.44);
  spark.maxLife = spark.life;
  spark.mesh.position.copy(position);
  spark.mesh.position.z = position.z ?? 0.42;
  spark.velocity.copy(velocity);
  spark.mesh.material.color.setHex(color);
  spark.mesh.material.opacity = opacity;
  spark.mesh.rotation.z = Math.random() * Math.PI;
  spark.mesh.scale.setScalar(size * (0.7 + Math.random() * 0.8));
  spark.mesh.visible = true;
}

function spawnAnchorPlasmaSpark(anchor, now) {
  const center = getVisualGrapplePoint(anchor, characterScratchA);
  const angle = now * 7.5 + Math.random() * Math.PI * 2;
  const radius = 0.42 + Math.random() * 0.28;
  const position = characterScratchB.set(
    center.x + Math.cos(angle) * radius,
    center.y + Math.sin(angle) * radius,
    0.48,
  );
  const tangent = characterScratchC.set(-Math.sin(angle), Math.cos(angle), 0);
  const outward = scratchPerpDirection.set(Math.cos(angle), Math.sin(angle), 0);
  const velocity = new THREE.Vector3()
    .copy(tangent)
    .multiplyScalar(1.2 + Math.random() * 1.8)
    .addScaledVector(outward, 0.5 + Math.random() * 1.3)
    .addScaledVector(state.velocity, 0.025);
  velocity.y += 0.6 + Math.random() * 1.4;
  spawnPhysicsSpark(position, velocity, {
    color: Math.random() < 0.72 ? 0xffffff : 0x7eefff,
    life: 0.22 + Math.random() * 0.22,
    size: 0.75,
    opacity: 1,
  });
}

function spawnVehicleMalfunctionSpark(anchor, now) {
  if (!anchor) return;
  const side = anchor.malfunctionSide || 1;
  if (anchor.visualType === "policeCar") {
    if (!anchor.malfunctioning) return;
    const position = characterScratchA;
    if (anchor.blownThruster?.body) {
      anchor.blownThruster.body.getWorldPosition(position);
    } else {
      position.set(anchor.mesh.position.x + side * 0.56, anchor.mesh.position.y - 0.54, 0.5);
    }
    position.x += (Math.random() - 0.5) * 0.16;
    position.y += (Math.random() - 0.5) * 0.14;
    position.z = 0.5;
    const velocity = characterScratchB.set(
      side * (0.9 + Math.random() * 2.4),
      -0.2 + Math.random() * 2.6,
      0,
    );
    spawnPhysicsSpark(position, velocity, {
      color: Math.random() < 0.55 ? 0xff2b1c : 0xffd34a,
      life: 0.22 + Math.random() * 0.24,
      size: 0.9,
      opacity: 1,
    });
    return;
  }

  if (anchor.visualType !== "drone") return;
  const position = characterScratchA.set(
    anchor.mesh.position.x + side * (0.62 + Math.random() * 0.18),
    anchor.mesh.position.y + (Math.random() - 0.5) * 0.34,
    0.5,
  );
  const velocity = characterScratchB.set(
    side * (1.4 + Math.random() * 2.6),
    0.8 + Math.random() * 2.6,
    0,
  );
  spawnPhysicsSpark(position, velocity, {
    color: Math.random() < 0.78 ? 0xffffff : 0x79e8ff,
    life: 0.26 + Math.random() * 0.26,
    size: 0.85,
    opacity: 1,
  });
}

function maybeSpawnRopeSparks(dt, start, direction, distance) {
  if (state.paused || state.gameOver || distance <= 0.08) return;

  const profile = getFxProfile();
  if (profile.sparkRate <= 0) return;
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  const pulseChance = dt * config.ropePulseChance * profile.sparkRate * (state.grappled ? 1.5 : 1) * (1 + Math.min(speed, 22) / 36);
  if (Math.random() < pulseChance) {
    state.ropePulse = 1;
    state.ropeCrackle = config.ropeCrackleDuration;
    const count = Math.max(1, Math.round((config.ropeSparkBurstCount + Math.floor(Math.random() * 3)) * profile.sparkBurstScale));
    for (let index = 0; index < count; index += 1) {
      spawnRopeSpark(start, direction, distance, true);
    }
  } else if (Math.random() < dt * config.ropeCrackleChance * profile.sparkRate) {
    state.ropeCrackle = config.ropeCrackleDuration * (0.65 + Math.random() * 0.7);
    spawnRopeSpark(start, direction, distance, false);
  } else if (Math.random() < dt * 2.2 * profile.sparkRate) {
    spawnRopeSpark(start, direction, distance, false);
  }
}

function updateRopeCrackle(start, direction, distance) {
  if (state.ropeCrackle <= 0 || distance <= 0.08) {
    ropeCrackleLine.visible = false;
    return;
  }

  scratchPerpDirection.set(-direction.y, direction.x, 0);
  const positions = ropeCrackleGeometry.attributes.position;
  const snapFrame = Math.floor(performance.now() / config.ropeCrackleFrameMs);
  for (let index = 0; index < config.ropeCracklePoints; index += 1) {
    const rawAmount = index / (config.ropeCracklePoints - 1);
    const amount = Math.round(rawAmount * 18) / 18;
    const edgeFade = Math.sin(amount * Math.PI);
    const seeded = Math.sin((index + 1) * 91.7 + snapFrame * 43.3) * 43758.5453;
    const jitter = ((seeded - Math.floor(seeded)) - 0.5) * config.ropeCrackleJitter * edgeFade;
    const x = start.x + direction.x * distance * amount + scratchPerpDirection.x * jitter;
    const y = start.y + direction.y * distance * amount + scratchPerpDirection.y * jitter;
    positions.setXYZ(index, x, y, 0.42);
  }
  positions.needsUpdate = true;
  ropeCrackleLine.material.opacity = THREE.MathUtils.clamp(state.ropeCrackle / config.ropeCrackleDuration, 0, 1);
  ropeCrackleLine.visible = true;
}

function updateRopeVisualCurve(start, direction, distance, now) {
  if (distance <= 0.08) {
    ropeVisualCurveLine.visible = false;
    return;
  }

  scratchPerpDirection.set(-direction.y, direction.x, 0);
  const positions = ropeVisualCurveGeometry.attributes.position;
  const lastIndex = config.ropeVisualCurvePoints - 1;
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  const motion = THREE.MathUtils.clamp(speed / 22, 0.2, 1);
  const launchMotion = state.grappled ? 0.36 : 1;
  const distanceScale = THREE.MathUtils.clamp(distance / Math.max(config.grappleRange, 0.001), 0.25, 1);
  const slack = config.ropeVisualCurveSlack * launchMotion * distanceScale;
  const wave = config.ropeVisualCurveWave * launchMotion * (0.55 + motion * 0.45);
  const pulse = state.ropePulse * 0.07;

  for (let index = 0; index <= lastIndex; index += 1) {
    const amount = index / lastIndex;
    const edgeFade = Math.sin(amount * Math.PI);
    const whip = Math.sin(amount * Math.PI * 2.65 - now * 14.0) * wave * edgeFade;
    const recoil = !state.grappled
      ? Math.sin((1 - amount) * Math.PI * 1.6 + now * 22.0) * 0.045 * edgeFade
      : 0;
    const sag = -slack * edgeFade * edgeFade;
    const offset = whip + recoil + pulse * edgeFade;
    positions.setXYZ(
      index,
      start.x + direction.x * distance * amount + scratchPerpDirection.x * offset,
      start.y + direction.y * distance * amount + scratchPerpDirection.y * offset + sag,
      0.62,
    );
  }

  positions.needsUpdate = true;
  ropeVisualCurveLine.material.opacity = state.grappled ? 0.42 : 0.72;
  ropeVisualCurveLine.visible = true;
}

function updateRopeStripGeometry(geometry, centers, width, z = 0.56) {
  const positions = geometry.attributes.position;
  const lastIndex = centers.length - 1;
  for (let index = 0; index <= lastIndex; index += 1) {
    const previous = centers[Math.max(0, index - 1)];
    const next = centers[Math.min(lastIndex, index + 1)];
    const tangentX = next.x - previous.x;
    const tangentY = next.y - previous.y;
    const tangentLength = Math.hypot(tangentX, tangentY) || 1;
    const normalX = -tangentY / tangentLength;
    const normalY = tangentX / tangentLength;
    const edgeFade = Math.sin((index / lastIndex) * Math.PI);
    const halfWidth = width * 0.5 * (0.38 + edgeFade * 0.62);
    const center = centers[index];
    const vertex = index * 2;
    positions.setXYZ(vertex, center.x + normalX * halfWidth, center.y + normalY * halfWidth, z);
    positions.setXYZ(vertex + 1, center.x - normalX * halfWidth, center.y - normalY * halfWidth, z);
  }
  positions.needsUpdate = true;
}

function updateRopeEnergyWrap(start, direction, distance, now) {
  if (distance <= 0.08) {
    setRopeEnergyWrapsVisible(false);
    return;
  }

  scratchPerpDirection.set(-direction.y, direction.x, 0);
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  const speedGlow = THREE.MathUtils.clamp(speed / 28, 0, 1);
  const intensity = 0.78 + state.ropePulse * 0.34 + speedGlow * 0.18 + (state.grappled ? 0.12 : 0);
  const lastIndex = config.ropeEnergyWrapPoints - 1;
  const snapTime = Math.floor(now * config.ropeEnergyWrapSpeed);
  const profile = getFxProfile();
  const jaggedNoise = (cell, seed) => {
    const value = Math.sin(cell * 127.1 + seed * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  for (const [layerIndex, layer] of ropeEnergyWrapLayers.entries()) {
    if (layerIndex >= profile.ropeLayerLimit) {
      layer.mesh.visible = false;
      continue;
    }
    const frequency = config.ropeEnergyWrapFrequency * layer.frequency;
    const seed = layer.phase * 100 + snapTime;
    const upwardPhase = (now * config.ropeEnergyWrapSpeed * 0.085 + layer.phase) % 1;
    for (let index = 0; index <= lastIndex; index += 1) {
      const amount = index / lastIndex;
      const edgeFade = Math.sin(amount * Math.PI);
      const cell = Math.floor((amount + upwardPhase) * frequency * 2.0);
      const nextCell = Math.floor((amount + upwardPhase + 0.035) * frequency * 2.0);
      const snapA = Math.round((jaggedNoise(cell, seed) - 0.5) * 6) / 3;
      const snapB = Math.round((jaggedNoise(nextCell, seed + 9.7) - 0.5) * 6) / 3;
      const branchCut = jaggedNoise(cell, seed + 19.1) > 0.72 ? 1 : 0;
      const offset = (
        snapA * 0.7
        + snapB * 0.3
        + branchCut * Math.sign(snapA || 1) * 0.38
      ) * config.ropeEnergyWrapAmplitude * layer.amplitude * edgeFade;
      const forwardSnap = (jaggedNoise(cell, seed + 33.3) - 0.5) * 0.05 * edgeFade;
      ropeEnergyCenters[index].set(
        start.x + direction.x * (distance * amount + forwardSnap) + scratchPerpDirection.x * offset,
        start.y + direction.y * (distance * amount + forwardSnap) + scratchPerpDirection.y * offset,
        0.56,
      );
    }
    updateRopeStripGeometry(layer.geometry, ropeEnergyCenters, layer.width);
    layer.mesh.material.opacity = layer.opacity * profile.ropeOpacity * intensity * (0.72 + jaggedNoise(snapTime, seed) * 0.42);
    layer.mesh.visible = true;
  }
}

function updateRopeSparks(dt) {
  for (const spark of ropeSparks) {
    if (spark.life <= 0) {
      spark.mesh.visible = false;
      continue;
    }

    spark.life = Math.max(0, spark.life - dt);
    spark.velocity.y += config.gravity * config.ropeSparkGravityScale * dt;
    spark.mesh.position.addScaledVector(spark.velocity, dt);
    spark.mesh.rotation.z += spark.spin * dt;
    const fade = spark.life / spark.maxLife;
    spark.mesh.material.opacity = 0.9 * fade * fade;
    spark.mesh.scale.setScalar(0.65 + fade * 0.7);
    spark.mesh.visible = spark.life > 0.01;
  }
}

function plasmaHash(value) {
  const hashed = Math.sin(value * 127.1) * 43758.5453;
  return hashed - Math.floor(hashed);
}

function renderFailedGrappleChain() {
  ropeLine.visible = false;
  ropeMesh.visible = false;
  ropeVisualCurveLine.visible = false;
  ropeCrackleLine.visible = false;
  setRopeEnergyWrapsVisible(false);
  failedGrappleChainLine.visible = true;

  const endIndex = failedGrappleChainPoints.length - 1;
  const end = failedGrappleChainPoints[endIndex];
  const beforeEnd = failedGrappleChainPoints[Math.max(0, endIndex - 1)];
  scratchVelocityDirection.subVectors(end, beforeEnd);
  if (scratchVelocityDirection.lengthSq() < 0.001) scratchVelocityDirection.copy(state.aimDirection);
  scratchVelocityDirection.normalize();

  hookTip.position.copy(end);
  hookTip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), scratchVelocityDirection);
  hookTip.visible = true;

  hookHead.position.copy(end);
  hookHead.quaternion.copy(hookTip.quaternion);
  hookHead.rotation.z = (performance.now() / 1000) * 5;
  hookHead.scale.setScalar(0.86);
  hookHead.visible = true;
}

function renderRope(dt) {
  if (!state.hookActive) {
    ropeLine.visible = false;
    ropeMesh.visible = false;
    ropeVisualCurveLine.visible = false;
    failedGrappleChainLine.visible = false;
    ropeCrackleLine.visible = false;
    setRopeEnergyWrapsVisible(false);
    hookTip.visible = false;
    hookHead.visible = false;
    return;
  }

  if (state.failedGrappleActive) {
    renderFailedGrappleChain();
    return;
  }

  failedGrappleChainLine.visible = false;
  const end = state.grappled && state.anchor ? getVisualGrapplePoint(state.anchor) : state.hookEnd;
  const start = getRopeOrigin(new THREE.Vector3());
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const ropeDirection = new THREE.Vector3().subVectors(end, start);
  const ropeDistance = ropeDirection.length();
  const ropeDirectionUnit = ropeDirection.clone().normalize();
  const ropeRotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    ropeDirectionUnit,
  );
  maybeSpawnRopeSparks(dt, start, ropeDirectionUnit, ropeDistance);
  updateRopeCrackle(start, ropeDirectionUnit, ropeDistance);
  updateRopeEnergyWrap(start, ropeDirectionUnit, ropeDistance, performance.now() / 1000);
  updateRopeVisualCurve(start, ropeDirectionUnit, ropeDistance, performance.now() / 1000);

  ropeMesh.position.copy(midpoint);
  const ropePulse = 0.88 + state.ropePulse * 0.28 + Math.sin(performance.now() / 90) * 0.05;
  ropeMesh.material.uniforms.uTime.value = (performance.now() / 1000) * config.ropeShaderTimeScale;
  ropeMesh.material.uniforms.uPulse.value = state.ropePulse;
  ropeMesh.material.uniforms.uOpacity.value = THREE.MathUtils.clamp(ropePulse, 0.72, 1);
  ropeMesh.scale.set(1, Math.max(ropeDistance, 0.001), 1);
  ropeMesh.quaternion.copy(ropeRotation);
  ropeMesh.visible = ropeDistance > 0.05;

  ropeLine.position.copy(midpoint);
  ropeLine.scale.set(1, Math.max(ropeDistance, 0.001), 1);
  ropeLine.quaternion.copy(ropeRotation);
  ropeLine.visible = ropeDistance > 0.05;

  hookTip.position.copy(end);
  hookTip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), state.aimDirection);
  hookTip.visible = !state.grappled;

  hookHead.position.copy(end);
  hookHead.quaternion.copy(hookTip.quaternion);
  hookHead.rotation.z = (performance.now() / 1000) * (state.grappled ? 6 : 14);
  hookHead.scale.setScalar(state.grappled ? 0.92 : 1.08);
  hookHead.visible = true;
}

function updateAnchorPlasmaLock(center, dt, now) {
  const profile = getFxProfile();
  anchorPlasmaLock.position.copy(center);
  anchorPlasmaLock.position.z = 0;
  anchorPlasmaLock.visible = true;

  const progress = 1 - state.hookWrapPulse;
  const snapFrame = Math.floor(now * 18);
  const pulse = 0.74 + plasmaHash(snapFrame + 3.7) * 0.24 + state.hookWrapPulse * 0.52;
  anchorPlasmaGlowRing.rotation.z = now * 5.8 + snapFrame * 0.035;
  anchorPlasmaCoreRing.rotation.z = -now * 8.6 - snapFrame * 0.05;
  anchorPlasmaGlowRing.scale.setScalar(0.92 + pulse * 0.12 + state.hookWrapPulse * 0.2);
  anchorPlasmaCoreRing.scale.setScalar(0.72 + pulse * 0.08 + state.hookWrapPulse * 0.12);
  anchorPlasmaGlowRing.material.opacity = 0.18 + pulse * 0.22;
  anchorPlasmaCoreRing.material.opacity = 0.38 + state.hookWrapPulse * 0.38;
  anchorPlasmaGlowRing.visible = true;
  anchorPlasmaCoreRing.visible = true;

  for (const [arcIndex, arc] of anchorPlasmaArcs.entries()) {
    if (arcIndex >= profile.anchorArcLimit) {
      arc.mesh.visible = false;
      continue;
    }
    const seed = snapFrame + arcIndex * 17.3;
    const startAngle = arc.phase
      + now * (arcIndex % 2 === 0 ? 4.9 : -6.2)
      + Math.floor(now * 9 + arcIndex) * 0.23;
    const span = Math.PI * (0.42 + plasmaHash(seed + 2.2) * 0.3);
    const radiusBase = config.anchorPlasmaArcRadius * (0.82 + plasmaHash(seed + 4.4) * 0.22);
    const direction = arcIndex % 2 === 0 ? 1 : -1;
    const lastIndex = config.anchorPlasmaArcPoints - 1;

    for (let index = 0; index <= lastIndex; index += 1) {
      const amount = index / lastIndex;
      const steppedAmount = Math.round(amount * 7) / 7;
      const angle = startAngle + steppedAmount * span * direction;
      const corner = Math.round((plasmaHash(seed + index * 5.1) - 0.5) * 4) / 4;
      const radius = radiusBase + corner * config.anchorPlasmaArcJitter;
      arc.centers[index].set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0.62,
      );
    }

    updateRopeStripGeometry(arc.geometry, arc.centers, arc.width, 0.62);
    arc.mesh.material.opacity = arc.opacity * pulse * (0.62 + plasmaHash(seed + 7.7) * 0.42);
    arc.mesh.visible = progress > 0.02;
  }
}

function updateHookWrap(dt, now) {
  if (!state.grappled || !state.anchor) {
    hookWrap.visible = false;
    setAnchorPlasmaLockVisible(false);
    return;
  }

  state.hookWrapPulse = Math.max(0, state.hookWrapPulse - dt * 4.8);
  const progress = 1 - state.hookWrapPulse;
  const grapplePoint = getVisualGrapplePoint(state.anchor, characterScratchA);
  hookWrap.position.copy(grapplePoint);
  hookWrap.rotation.z = -progress * Math.PI * 2.3 + now * 3.4;
  hookWrap.scale.setScalar(0.58 + Math.sin(now * 14) * 0.035 + state.hookWrapPulse * 0.38);
  hookWrap.material.opacity = 0.34 + state.hookWrapPulse * 0.55;
  hookWrap.visible = true;
  updateAnchorPlasmaLock(grapplePoint, dt, now);
  if (Math.random() < dt * config.anchorPlasmaSparkChance * getFxProfile().anchorSparkRate) {
    spawnAnchorPlasmaSpark(state.anchor, now);
  }
}

function updateSpeedLines(now) {
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  let intensity = THREE.MathUtils.clamp(
    (speed - config.speedLineMinSpeed) /
      (config.speedLineMaxSpeed - config.speedLineMinSpeed),
    0,
    1,
  );
  if (speed > 0.8) intensity = Math.max(intensity, config.speedLineIdleIntensity);
  intensity = Math.min(1, intensity + state.stuntBurstPulse * 0.36);

  if (state.paused || state.gameOver || !state.hasLaunched) {
    for (const { line } of speedLines) line.visible = false;
    return;
  }

  scratchVelocityDirection.set(state.velocity.x, state.velocity.y, 0).normalize();
  scratchPerpDirection.set(-scratchVelocityDirection.y, scratchVelocityDirection.x, 0);
  const visibleHalfHeight =
    Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
  const visibleHalfWidth = visibleHalfHeight * camera.aspect;
  const profile = getFxProfile();

  for (const [index, { line, seed }] of speedLines.entries()) {
    if (index >= profile.speedLineLimit) {
      line.visible = false;
      continue;
    }
    const pulse = (Math.sin(now * 10 + seed.offset * 4.7) + 1) * 0.5;
    const lineLength = seed.length * (0.75 + intensity * 1.4 + pulse * 0.25);
    const drift = ((now * (seed.edge ? 7.5 : 4.5) + seed.offset) % 4) - 2;
    const center = new THREE.Vector3();

    if (seed.edge) {
      const edgeX = camera.position.x + seed.side * visibleHalfWidth * 0.82;
      const edgeY = camera.position.y + seed.lane * visibleHalfHeight + pulse * seed.side * 0.35;
      center.set(
        edgeX + drift * 0.8,
        edgeY,
        0,
      );
    } else {
      center
        .copy(state.player)
        .addScaledVector(scratchVelocityDirection, -1.1 - drift * 0.45)
        .addScaledVector(scratchPerpDirection, seed.lane);
    }

    const start = center.clone().addScaledVector(scratchVelocityDirection, lineLength * 0.5);
    const end = center.clone().addScaledVector(scratchVelocityDirection, -lineLength * 0.5);
    const positions = line.geometry.attributes.position;
    positions.setXYZ(0, start.x, start.y, 0.25);
    positions.setXYZ(1, end.x, end.y, 0.25);
    positions.needsUpdate = true;
    line.material.opacity = (seed.edge ? 0.18 : 0.28) * intensity * (0.65 + pulse * 0.35);
    line.visible = true;
  }
}

function updateMotionTrail() {
  if (state.paused) {
    for (const line of trailLines) line.visible = false;
    return;
  }

  if (!state.gameOver) {
    const currentPoint = new THREE.Vector3(state.player.x, state.player.y + 0.35, 0);
    const lastPoint = trailPoints[0];
    if (!lastPoint || currentPoint.distanceTo(lastPoint) >= config.trailPointSpacing) {
      trailPoints.unshift(currentPoint);
      if (trailPoints.length > config.trailSegments + 1) trailPoints.pop();
    }
  }

  const trailLineLimit = getFxProfile().trailLineLimit;
  for (let index = 0; index < trailLines.length; index += 1) {
    const line = trailLines[index];
    if (index >= trailLineLimit) {
      line.visible = false;
      continue;
    }
    const start = trailPoints[index];
    const end = trailPoints[index + 1];

    if (!start || !end) {
      line.visible = false;
      continue;
    }

    const fade = 1 - index / trailLines.length;
    const positions = line.geometry.attributes.position;
    positions.setXYZ(0, start.x, start.y, 0.22);
    positions.setXYZ(1, end.x, end.y, 0.22);
    positions.needsUpdate = true;
    line.material.opacity = config.trailBaseOpacity * fade * fade;
    line.visible = true;
  }
}

function updateCamera(dt) {
  if (state.paused || state.draggedObject || state.panningCamera) return;

  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  const targetX = state.player.x + config.cameraLead;
  const targetY = state.player.y + config.cameraVerticalLead;
  const speedZoom = THREE.MathUtils.smoothstep(speed, 2, 30);
  const lowAltitudeZoom = 1 - THREE.MathUtils.smoothstep(
    config.bottomDeathY + 2.4,
    config.bottomDeathY + 10,
    state.player.y,
  );
  const automaticTargetZ = THREE.MathUtils.clamp(
    config.cameraBaseZoom
      + speedZoom * (config.cameraMaxZoom - config.cameraBaseZoom) * config.cameraSpeedZoom
      + lowAltitudeZoom * 10
      + state.cameraZoomOffset,
    config.cameraMinZoom,
    config.cameraMaxZoom,
  );
  const targetZ = state.manualCameraZoom
    ? state.manualCameraZoomZ
    : automaticTargetZ;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 1 - Math.pow(0.001, dt));
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 1 - Math.pow(0.004, dt));
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 1 - Math.pow(0.008, dt));
  camera.lookAt(camera.position.x, camera.position.y, 0);
}

function countActiveEffects() {
  let active = 0;
  active += ropeMesh.visible ? 1 : 0;
  active += failedGrappleChainLine.visible ? 1 : 0;
  active += ropeCrackleLine.visible ? 1 : 0;
  active += hookWrap.visible ? 1 : 0;
  active += anchorPlasmaLock.visible ? 1 : 0;
  active += ropeEnergyWrapLayers.reduce((total, layer) => total + (layer.mesh.visible ? 1 : 0), 0);
  active += anchorPlasmaArcs.reduce((total, arc) => total + (arc.mesh.visible ? 1 : 0), 0);
  active += ropeSparks.reduce((total, spark) => total + (spark.mesh.visible ? 1 : 0), 0);
  active += speedLines.reduce((total, item) => total + (item.line.visible ? 1 : 0), 0);
  active += trailLines.reduce((total, line) => total + (line.visible ? 1 : 0), 0);
  active += crashPieces.reduce((total, piece) => total + (piece.mesh.visible ? 1 : 0), 0);
  active += jeremyFireworks.reduce((total, particle) => total + (particle.life > 0 ? 1 : 0), 0);
  if (pixelateSettings.enabled) active += 1;
  return active;
}

function recordPerformanceSample(frameMs, cpuMs, now) {
  if (!performanceMonitorEl || !Number.isFinite(frameMs) || frameMs <= 0) return;

  const safeFrameMs = Math.min(frameMs, 250);
  const safeCpuMs = Math.max(0, Math.min(cpuMs, 250));
  performanceStats.frameSamples[performanceStats.sampleIndex] = safeFrameMs;
  performanceStats.cpuSamples[performanceStats.sampleIndex] = safeCpuMs;
  performanceStats.sampleIndex = (performanceStats.sampleIndex + 1) % config.performanceSampleCount;
  performanceStats.sampleCount = Math.min(performanceStats.sampleCount + 1, config.performanceSampleCount);
  if (safeFrameMs >= config.performanceStutterFrameMs) performanceStats.stutters += 1;
  if (safeFrameMs >= config.performanceHardStutterFrameMs) performanceStats.hardStutters += 1;

  if (now - performanceStats.lastUiUpdateAt < config.performanceUiUpdateInterval) return;
  performanceStats.lastUiUpdateAt = now;

  let frameTotal = 0;
  let cpuTotal = 0;
  let worstFrameMs = 0;
  let worstCpuMs = 0;
  for (let index = 0; index < performanceStats.sampleCount; index += 1) {
    const sampleFrameMs = performanceStats.frameSamples[index];
    const sampleCpuMs = performanceStats.cpuSamples[index];
    frameTotal += sampleFrameMs;
    cpuTotal += sampleCpuMs;
    worstFrameMs = Math.max(worstFrameMs, sampleFrameMs);
    worstCpuMs = Math.max(worstCpuMs, sampleCpuMs);
  }

  const avgFrameMs = frameTotal / Math.max(1, performanceStats.sampleCount);
  const avgCpuMs = cpuTotal / Math.max(1, performanceStats.sampleCount);
  const fps = avgFrameMs > 0 ? 1000 / avgFrameMs : 0;
  let activeFx = 0;
  let drawCalls = 0;
  try {
    activeFx = countActiveEffects();
    drawCalls = renderer.info.render.calls || 0;
  } catch (error) {
    console.warn("Performance monitor failed without stopping gameplay", error);
  }
  performanceStats.latest = {
    fps,
    avgFrameMs,
    worstFrameMs,
    avgCpuMs,
    worstCpuMs,
    activeFx,
    drawCalls,
  };

  const warning = avgFrameMs >= 17.5 || worstFrameMs >= config.performanceStutterFrameMs;
  const danger = avgFrameMs >= 24 || worstFrameMs >= config.performanceHardStutterFrameMs;
  document.body.classList.toggle("perf-warning", warning && !danger);
  document.body.classList.toggle("perf-danger", danger);
  performanceMonitorEl.textContent = [
    `FPS ${fps.toFixed(0)}  frame ${avgFrameMs.toFixed(1)}ms`,
    `CPU ${avgCpuMs.toFixed(1)}ms  worst ${worstFrameMs.toFixed(1)}ms`,
    `FX ${activeFx}  draws ${drawCalls}  stutter ${performanceStats.stutters}/${performanceStats.hardStutters}`,
  ].join("\n");
}

function updateHud(now) {
  if (now > state.multiplierExpiresAt && state.multiplier !== config.multiplierBase) {
    state.multiplier = config.multiplierBase;
    state.multiplierActions.clear();
  }

  scoreEl.textContent = String(state.score);
  failCountEl.textContent = String(state.deaths);
  speedEl.textContent = Math.round(Math.hypot(state.velocity.x, state.velocity.y)).toString();
  ropeEl.textContent = state.hookActive
    ? `${state.ropeLength.toFixed(1)}m`
    : state.anchor
      ? "Locked"
      : "Ready";

  const slowMoVisible = state.pendingSlowMotion || state.slowMotionRemaining > 0;
  slowMoTimerEl.classList.add("hidden");
  centerSlowMoTimerEl.classList.toggle("hidden", !slowMoVisible);
  if (slowMoVisible) {
    const displayTime = state.pendingSlowMotion && state.slowMotionRemaining <= 0
      ? config.slowMotionDuration
      : state.slowMotionRemaining;
    const progress = THREE.MathUtils.clamp(displayTime / config.slowMotionDuration, 0, 1);
    slowMoTimeEl.textContent = `${displayTime.toFixed(1)}s`;
    centerSlowMoTimeEl.textContent = `${displayTime.toFixed(1)}s`;
    slowMoTimerEl.style.setProperty("--timer-progress", `${Math.round(progress * 360)}deg`);
    centerSlowMoTimerEl.style.setProperty("--timer-progress", `${Math.round(progress * 360)}deg`);
  }

  const multiplierVisible = state.multiplier > 1 && now <= state.multiplierExpiresAt;
  multiplierPillEl.classList.toggle("hidden", !multiplierVisible);
  multiplierCountEl.textContent = state.multiplier.toFixed(2).replace(/0$/, "");

  if (state.finished) {
    flourishEl.textContent = "Landed";
  } else if (state.gameOver) {
    flourishEl.textContent = "Crash";
  } else if (state.pendingSlowMotion) {
    flourishEl.textContent = "Release";
  } else if (isSlowMotionActive()) {
    flourishEl.textContent = "Slow";
  } else if (state.slowMotionRemaining > 0) {
    flourishEl.textContent = "Air";
  } else if (canFlourish(now)) {
    flourishEl.textContent = "Ready";
  } else if (now - state.lastFlourishAt < config.flourishCooldown) {
    flourishEl.textContent = "Cool";
  } else {
    flourishEl.textContent = "Low";
  }
}

const characterScratchA = new THREE.Vector3();
const characterScratchB = new THREE.Vector3();
const characterScratchC = new THREE.Vector3();

function localBodyPointToWorld(x, y, rotation = 0, target = characterScratchC) {
  const scaledX = x * state.facing * characterVisualScale;
  const scaledY = y * characterVisualScale;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  target.set(
    state.player.x + scaledX * cos - scaledY * sin,
    state.player.y + scaledX * sin + scaledY * cos,
    0,
  );
  return target;
}

function ribbonLayerLocalPointToWorld(x, y, target = characterScratchC) {
  playerMesh.updateWorldMatrix(true, true);
  playerRibbonLayer.updateWorldMatrix(true, true);
  target.set(x, y, 0);
  playerRibbonLayer.localToWorld(target);
  return target;
}

function worldPointToRibbonLayerLocal(point, target = characterScratchC) {
  playerMesh.updateWorldMatrix(true, true);
  playerRibbonLayer.updateWorldMatrix(true, true);
  target.copy(point);
  playerRibbonLayer.worldToLocal(target);
  return target;
}

function worldPointToLocalBody(point, rotation = 0) {
  const relX = point.x - state.player.x;
  const relY = point.y - state.player.y;
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const unrotatedX = relX * cos - relY * sin;
  const unrotatedY = relX * sin + relY * cos;
  return [
    unrotatedX / (state.facing * characterVisualScale),
    unrotatedY / characterVisualScale,
  ];
}

function setFrozenRibbonDrape(ribbonIndex, worldAnchor) {
  const ribbon = ribbonPhysics[ribbonIndex];
  const line = ribbonIndex === 0 ? ribbonLines.top : ribbonLines.bottom;
  const shadowLine = ribbonIndex === 0 ? ribbonLines.topShadow : ribbonLines.bottomShadow;
  const count = line.geometry.attributes.position.count;
  const localPoints = [];
  const shadowPoints = [];
  const shadowOffset = 0.035;
  const sideOffset = (ribbonIndex === 0 ? -0.035 : 0.035) * state.facing;
  for (let index = 0; index < count; index += 1) {
    const amount = count > 1 ? index / (count - 1) : 0;
    const curl = Math.sin(amount * Math.PI) * 0.08;
    const taper = amount * (0.48 + ribbonIndex * 0.06);
    const worldPoint = new THREE.Vector3(
      worldAnchor.x + sideOffset - taper * state.facing - curl * state.facing,
      worldAnchor.y - amount * 1.12 - Math.sin(amount * Math.PI * 0.85) * 0.08,
      0,
    );
    if (ribbon) {
      ribbon.points[index]?.copy(worldPoint);
      ribbon.previous[index]?.copy(worldPoint);
    }
    const local = worldPointToRibbonLayerLocal(worldPoint, new THREE.Vector3());
    localPoints.push([local.x, local.y]);
    shadowPoints.push([local.x + shadowOffset, local.y - shadowOffset]);
  }
  setRibbonLine(shadowLine, shadowPoints, 0.08);
  setRibbonLine(line, localPoints, ribbonIndex === 0 ? 0.18 : 0.17);
}

function updatePlayerRibbonPhysics(now, dt, flourishFlip = 0) {
  if (config.debugGlbNeutralOnly) {
    for (const line of Object.values(ribbonLines)) {
      line.visible = false;
    }
    return;
  }
  if (state.paused || state.animatorMode || state.inspectFrozen) {
    const topAnchor = getGlbRibbonWorldAnchor(0, new THREE.Vector3());
    const bottomAnchor = getGlbRibbonWorldAnchor(1, new THREE.Vector3());
    if (topAnchor && bottomAnchor) {
      setFrozenRibbonDrape(0, topAnchor);
      setFrozenRibbonDrape(1, bottomAnchor);
    }
    for (const line of Object.values(ribbonLines)) line.visible = playerRibbonLayer.visible;
    return;
  }

  const idleBreath = state.playerAnimation === "idleHang" ? Math.sin(now * 3.2) : 0;
  const breathY = idleBreath * 0.035;
  const ribbonTimeScale = isSlowMotionActive() ? config.slowMotionForwardScale : 1;
  const ribbonDt = Math.min(dt * ribbonTimeScale, 0.033);
  const idleHang = !state.hasLaunched || state.grounded || state.playerAnimation === "idleHang";
  const flourishTuck = state.flourishSpinRemaining > 0
    ? Math.sin((1 - state.flourishSpinRemaining / config.flourishSpinDuration) * Math.PI)
    : 0;
  const localAnchors = [
    [-0.3, 0.92 + breathY],
    [-0.25, 0.84 + breathY],
  ];
  const worldAnchors = localAnchors.map(([x, y], index) => (
    getGlbRibbonWorldAnchor(index, new THREE.Vector3())
      ?? ribbonLayerLocalPointToWorld(x, y, new THREE.Vector3())
  ));
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  const stationaryRibbon = idleHang && speed < 0.08 && state.flourishSpinRemaining <= 0;
  for (const [ribbonIndex, ribbon] of ribbonPhysics.entries()) {
    const segmentLength = ribbon.segmentLength * ribbonLengthScale;
    ribbon.points[0].copy(worldAnchors[ribbonIndex]);
    ribbon.previous[0].copy(worldAnchors[ribbonIndex]);
    if (stationaryRibbon) {
      for (let index = 1; index < ribbon.points.length; index += 1) {
        const point = ribbon.points[index].set(
          worldAnchors[ribbonIndex].x + (ribbonIndex === 0 ? -0.04 : 0.04) * state.facing,
          worldAnchors[ribbonIndex].y - segmentLength * index,
          0,
        );
        ribbon.previous[index].copy(point);
      }
      continue;
    }

    for (let index = 1; index < ribbon.points.length; index += 1) {
      const amount = index / (ribbon.points.length - 1);
      const point = ribbon.points[index];
      const previous = ribbon.previous[index];
      const velocityX = (point.x - previous.x) * 0.92;
      const velocityY = (point.y - previous.y) * 0.92;
      previous.copy(point);
      const motionAmount = THREE.MathUtils.clamp(speed / 18, 0, 1);
      const wind = Math.sin(now * (6.2 + ribbonIndex * 0.8) + index * 0.86) * config.ribbonWind * amount * motionAmount;
      const flutter = Math.sin(now * (11.5 + ribbonIndex) + index * 1.35) * 0.018 * amount * motionAmount;
      const flipCurl = Math.sin(amount * Math.PI * 1.7 + ribbonIndex * 0.9 + now * 5.4) * flourishTuck * 0.045;
      point.x += velocityX + (wind + flutter + flipCurl) * state.facing * ribbonDt * 60;
      point.y += velocityY + (config.gravity * 0.006 * amount + (idleHang ? -0.025 : 0.012)) * ribbonDt;
    }

    for (let pass = 0; pass < 8; pass += 1) {
      ribbon.points[0].copy(worldAnchors[ribbonIndex]);
      for (let index = 1; index < ribbon.points.length; index += 1) {
        const prev = ribbon.points[index - 1];
        const point = ribbon.points[index];
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const distance = Math.max(Math.hypot(dx, dy), 0.0001);
        const difference = (distance - segmentLength) / distance;
        if (index === 1) {
          point.x -= dx * difference;
          point.y -= dy * difference;
        } else {
          prev.x += dx * difference * 0.5;
          prev.y += dy * difference * 0.5;
          point.x -= dx * difference * 0.5;
          point.y -= dy * difference * 0.5;
        }
      }
    }
  }
  const topRibbon = ribbonPhysics[0].points.map((point) => {
    const local = worldPointToRibbonLayerLocal(point, new THREE.Vector3());
    return [local.x, local.y];
  });
  const bottomRibbon = ribbonPhysics[1].points.map((point) => {
    const local = worldPointToRibbonLayerLocal(point, new THREE.Vector3());
    return [local.x, local.y];
  });
  const shadowOffset = 0.035;
  setRibbonLine(ribbonLines.topShadow, topRibbon.map(([x, y]) => [x + shadowOffset, y - shadowOffset]), 0.08);
  setRibbonLine(ribbonLines.bottomShadow, bottomRibbon.map(([x, y]) => [x + shadowOffset, y - shadowOffset]), 0.08);
  setRibbonLine(ribbonLines.top, topRibbon, 0.18);
  setRibbonLine(ribbonLines.bottom, bottomRibbon, 0.17);
  for (const line of Object.values(ribbonLines)) line.visible = true;
}

function resolvePlayerAnimationState() {
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  if (state.gameOver) return "hit";
  if (!state.hasLaunched) return "idleHang";
  if (state.flourishSpinRemaining > 0) return speed > 14 ? "barrelRoll" : "midFlip";
  if (state.hookActive && !state.grappled) return "throwHook";
  if (state.grappled && state.velocity.y < -2.5) return "downSwing";
  if (state.grappled && state.velocity.y > 2.5) return "upSwing";
  if (state.grappled) return "midSwing";
  if (state.velocity.y > 1.5) return "jumpLaunch";
  if (state.velocity.y < -5) return "falling";
  return "release";
}

function getFacingTargetX() {
  if (!state.hookActive && !state.grappled) return null;
  if (state.grappled && state.anchor) {
    return getVisualGrapplePoint(state.anchor, characterScratchA).x;
  }
  if (state.hookActive) return state.hookEnd.x;
  return null;
}

function updateFacingDirection() {
  if (!state.hasLaunched || state.gameOver || state.finished) return;
  if (state.grappled) return;

  const facingTargetX = getFacingTargetX();
  if (Number.isFinite(facingTargetX)) {
    const ropeDx = facingTargetX - state.player.x;
    if (Math.abs(ropeDx) > 0.28) {
      state.facing = ropeDx >= 0 ? 1 : -1;
      return;
    }
  }

  if (!state.grappled && Math.abs(state.velocity.x) > 0.35) {
    state.facing = state.velocity.x >= 0 ? 1 : -1;
  }
}

function applyPlayerAnimation(now, flourishProgress, dt) {
  state.playerAnimation = resolvePlayerAnimationState();
  updateFacingDirection();
  let flourishFlip = 0;
  let flourishTuck = 0;
  if (flourishProgress > 0) {
    flourishTuck = Math.sin(flourishProgress * Math.PI);
    const easedFlip = THREE.MathUtils.smootherstep(flourishProgress, 0, 1);
    flourishFlip = easedFlip * Math.PI * 2 * state.flourishFlipDirection;
  }
  let poseRotation = THREE.MathUtils.clamp(-state.velocity.x * 0.035, -0.5, 0.5);

  if (state.playerAnimation === "idleHang") {
    poseRotation = -0.08 + Math.sin(now * 4) * 0.025;
  } else if (state.playerAnimation === "jumpLaunch") {
    poseRotation = -0.32;
  } else if (state.playerAnimation === "throwHook") {
    poseRotation = -0.48;
  } else if (state.playerAnimation === "downSwing") {
    poseRotation = THREE.MathUtils.clamp(-state.velocity.x * 0.03 - 0.28, -0.7, 0.2);
  } else if (state.playerAnimation === "upSwing") {
    poseRotation = THREE.MathUtils.clamp(-state.velocity.x * 0.03 + 0.22, -0.2, 0.7);
  } else if (state.playerAnimation === "falling") {
    poseRotation = 0.35;
  }

  if (flourishProgress > 0) {
    poseRotation += -0.14 * state.flourishFlipDirection * flourishTuck;
  }
  const rotationAlpha = dt <= 0 ? 0 : 1 - Math.exp(-dt * 16);
  playerPoseRotationSmoothed = normalizeAngle(
    playerPoseRotationSmoothed + normalizeAngle(poseRotation - playerPoseRotationSmoothed) * rotationAlpha,
  );
  playerMesh.rotation.z = playerPoseRotationSmoothed;
  playerMesh.rotation.x = 0;
  playerMesh.rotation.y = 0;
  const pulseScale = 1 + state.flourishPulse * 0.08;
  playerMesh.scale.set(pulseScale, pulseScale, 1);
  syncGlbCharacterTransform(state.facing, flourishFlip);
  if (!config.freezeGlbCharacterPose) poseGlbCharacterFromPhysics(now, dt);
  updatePlayerRibbonPhysics(now, dt, flourishFlip);

}

let last = performance.now();
let physicsAccumulator = 0;

function stepGameplay(dt, now) {
  if (state.draggedObject || state.paused) return;

  if (!state.gameOver) {
    const slowMotionActive = isSlowMotionActive();
    const playerDt = slowMotionActive ? dt * config.slowMotionForwardScale : dt;
    updateSpaceHold(now);
    updatePlayer(playerDt, now);
    updateCourse(now, dt);
    updateQueuedFlourish(now);
    if (slowMotionActive) {
      state.slowMotionRemaining = Math.max(0, state.slowMotionRemaining - dt);
    }
  } else if (now >= state.restartAt) {
    reset();
  }
}

function tick(time) {
  const tickStartedAt = performance.now();
  const rawFrameMs = Math.max(0, time - last);
  const liveNow = time / 1000;
  const clockFrozen = state.inspectFrozen || state.paused;
  const now = clockFrozen ? state.inspectFrozenAt : liveNow;
  const frameDt = clockFrozen
    ? 0
    : Math.min(rawFrameMs / 1000, config.maxPhysicsFrame) * debugSettings.timeScale;
  last = time;

  if (state.draggedObject || state.paused || state.inspectFrozen) {
    physicsAccumulator = 0;
  } else {
    physicsAccumulator = Math.min(physicsAccumulator + frameDt, config.maxPhysicsFrame);
    while (physicsAccumulator >= config.physicsStep) {
      stepGameplay(config.physicsStep, now);
      physicsAccumulator -= config.physicsStep;
    }
  }

  const dt = frameDt;

  state.flourishPulse = Math.max(0, state.flourishPulse - dt * 2.6);
  state.ropePulse = Math.max(0, state.ropePulse - dt * 3.8);
  state.ropeCrackle = Math.max(0, state.ropeCrackle - dt);
  const slowMotionActive = isSlowMotionActive();
  const trickDt = dt * (slowMotionActive && state.flourishSpinRemaining > 0 ? config.slowMotionTrickScale : 1);
  const previousFlourishSpinRemaining = state.flourishSpinRemaining;
  state.flourishSpinRemaining = Math.max(0, state.flourishSpinRemaining - trickDt);
  if (
    state.flourishCompletionArmed &&
    previousFlourishSpinRemaining > 0 &&
    state.flourishSpinRemaining <= 0 &&
    !state.gameOver &&
    !state.finished
  ) {
    state.completedFlips += 1;
    state.flourishCompletionArmed = false;
  }
  state.stuntBurstPulse = Math.max(0, state.stuntBurstPulse - dt * 3.4);
  updateCrashExplosion(dt, now);
  playerMesh.position.copy(state.player);
  const flourishProgress =
    state.flourishSpinRemaining > 0
      ? 1 - state.flourishSpinRemaining / config.flourishSpinDuration
      : 0;
  applyPlayerAnimation(now, flourishProgress, dt);
  updatePoseHandles();

  updateAimIndicator();
  updateTargetGlow(now);
  updateBuildRangeGuide();
  renderRope(dt);
  updateRopeSparks(dt);
  updateHookWrap(dt, now);
  updateJeremyFireworks(dt, now);
  updateCamera(dt);
  updatePixelatePass();
  updateParallaxCity(dt, now);
  updateStartSteam(dt, now);
  updateMotionTrail();
  updateSpeedLines(now);
  updateHud(now);
  if (pixelateSettings.enabled) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
  recordPerformanceSample(rawFrameMs, performance.now() - tickStartedAt, liveNow);
  requestAnimationFrame(tick);
}

window.addEventListener("resize", resize);
window.addEventListener("selectstart", (event) => {
  event.preventDefault();
  window.getSelection()?.removeAllRanges();
}, { passive: false });
window.addEventListener("dragstart", (event) => event.preventDefault(), { passive: false });
window.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
window.addEventListener("contextmenu", (event) => event.preventDefault());
gameShell.addEventListener("touchstart", suppressNativeTouch, { passive: false, capture: true });
gameShell.addEventListener("touchmove", suppressNativeTouch, { passive: false, capture: true });
gameShell.addEventListener("touchend", suppressNativeTouch, { passive: false, capture: true });
gameShell.addEventListener("touchcancel", suppressNativeTouch, { passive: false, capture: true });

window.addEventListener("keydown", (event) => {
  sfx.unlock();
  if (event.code === "Space") event.preventDefault();
  if (event.repeat) return;

  state.keys.add(event.code);

  if (event.code === "Space") {
    state.spaceDownAt = performance.now() / 1000;
    state.spaceIsDown = true;
    state.spaceHadAnchor = false;
    jumpFromPlatform();
  }
  if (event.code === "KeyV") queueFlourish(performance.now() / 1000);
  if (event.code === "KeyR") reset();
  if (event.code === "KeyI") setInspectFrozen(!state.inspectFrozen, performance.now() / 1000);
  if (event.code === "KeyP") setPaused(!state.paused);
  if (event.code === "KeyB") {
    event.preventDefault();
    setPaused(!state.paused);
  }
  if (event.code === "KeyG") {
    config.debugGlbNeutralOnly = !config.debugGlbNeutralOnly;
    if (config.debugGlbNeutralOnly) resetGlbPivotAngles();
    syncCharacterSourceVisibility();
  }
});

window.addEventListener("keyup", (event) => {
  state.keys.delete(event.code);
  if (state.inspectFrozen && event.code === "Space") {
    event.preventDefault();
    return;
  }
  if (event.code === "Space") {
    const hadAnchor = state.spaceHadAnchor || state.grappled;
    releaseGrapple({ pop: hadAnchor });
    state.spaceDownAt = -100;
    state.spaceIsDown = false;
    state.spaceHadAnchor = false;
  }
});

canvas.addEventListener("pointerdown", startPointerControl);
canvas.addEventListener("pointermove", dragEditorObject);
canvas.addEventListener("pointerup", stopPointerControl);
canvas.addEventListener("pointercancel", stopPointerControl);
canvas.addEventListener("lostpointercapture", (event) => stopPointerControl(event));
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
canvas.addEventListener("wheel", scrollBuildView, { passive: false });
bindGameButton(restartButton, reset);
bindGameButton(muteButton, () => setMasterMuted(!sfx.settings.masterMuted));
flourishButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  queueFlourish(performance.now() / 1000);
});
bindGameButton(resetAnchorsButton, () => {
  resetEditorLayout();
  reset();
  setPaused(true);
});
bindGameButton(togglePauseButton, () => setPaused(!state.paused));
bindGameButton(addObjectButton, addEditorObject);
bindGameButton(removeObjectButton, removeSelectedEditorObject);
bindGameButton(zoomOutButton, () => setBuildZoom(camera.position.z + config.buildZoomStep));
bindGameButton(zoomInButton, () => setBuildZoom(camera.position.z - config.buildZoomStep));
bindGameButton(zoomFitButton, fitBuildViewToStage);
bindGameButton(animateCharacterButton, () => setAnimatorMode(!state.animatorMode));
bindGameButton(savePoseButton, saveCurrentCharacterPose);
bindGameButton(resetPoseButton, resetCurrentCharacterPoseReference);
bindGameButton(exportPoseButton, downloadCharacterPoseReferences);
buildZoomInput.addEventListener("input", () => setBuildZoom(buildZoomInput.value));
if (levelSelect) {
  levelSelect.value = currentLevelId;
  levelSelect.addEventListener("change", () => applyLevel(levelSelect.value, { preserveSavedLayout: true }));
}
bindGameButton(pixelateToggleButton, () => setPixelateEnabled(!pixelateSettings.enabled));
if (pixelateIntensityInput) {
  pixelateIntensityInput.addEventListener("input", () => setPixelateIntensity(pixelateIntensityInput.value));
}
for (const key of pixelatePlaneKeys) {
  const input = pixelatePlaneInputs[key];
  if (!input) continue;
  input.addEventListener("input", () => setPixelatePlaneIntensity(key, input.value));
}
if (fxQualitySelect) {
  fxQualitySelect.addEventListener("change", () => setFxQuality(fxQualitySelect.value));
}
bindGameButton(sfxMuteButton, () => setSfxMuted(!sfx.settings.sfxMuted));
bindGameButton(musicMuteButton, () => setMusicMuted(!sfx.settings.musicMuted));
if (sfxVolumeInput) {
  sfxVolumeInput.addEventListener("input", () => setSfxVolume(sfxVolumeInput.value));
}
if (musicVolumeInput) {
  musicVolumeInput.addEventListener("input", () => setMusicVolume(musicVolumeInput.value));
}
bindGameButton(nextLevelButton, () => reset({ resetLevelStats: true }));

resize();
sfx.loadSettings();
syncAudioControls();
loadFxQualitySettings();
loadPixelateSettings();
syncGlbCharacterTransform();
syncCharacterSourceVisibility();
initializeEditorPane();
decorateControls();
window.addEventListener("load", refreshLucideIcons);
loadGlbCharacter();
reset();
setPaused(false);
requestAnimationFrame(tick);
