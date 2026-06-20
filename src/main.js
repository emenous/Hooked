import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const GAME_VERSION = "v0.4.1";

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
const flourishButton = document.querySelector("#flourish-button");
const resetAnchorsButton = document.querySelector("#reset-anchors");
const togglePauseButton = document.querySelector("#toggle-pause");
const buildTools = document.querySelector("#build-tools");
const objectTypeSelect = document.querySelector("#object-type");
const addObjectButton = document.querySelector("#add-object");
const removeObjectButton = document.querySelector("#remove-object");
const zoomOutButton = document.querySelector("#zoom-out");
const zoomInButton = document.querySelector("#zoom-in");
const zoomFitButton = document.querySelector("#zoom-fit");
const buildZoomInput = document.querySelector("#build-zoom");
const characterScaleInput = document.querySelector("#character-scale");
const characterTorsoInput = document.querySelector("#character-torso");
const characterHeadInput = document.querySelector("#character-head");
const characterLimbsInput = document.querySelector("#character-limbs");
const characterRibbonInput = document.querySelector("#character-ribbon");
const characterEditorResetButton = document.querySelector("#character-reset");
const levelCompletePanel = document.querySelector("#level-complete");
const completeDeathsEl = document.querySelector("#complete-deaths");
const completeMultiplierEl = document.querySelector("#complete-multiplier");
const completeScoreEl = document.querySelector("#complete-score");
const completeRankEl = document.querySelector("#complete-rank");
const nextLevelButton = document.querySelector("#next-level");
const gameVersionEl = document.querySelector("#game-version");
const jeremyFireworksEl = document.querySelector("#jeremy-fireworks");
const anchorStorageKey = "hooked.anchor.layout.v5";
const editorLayoutStorageKey = "hooked.editor.layout.v1";
const characterSettingsStorageKey = "hooked.character.settings.v2";

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
  cameraBaseZoom: 25,
  cameraSpeedZoom: 0.34,
  cameraMaxZoom: 40,
  restartDelay: 0.55,
  buildPanSpeed: 0.018,
  buildZoomSpeed: 0.018,
  buildMinZoom: 18,
  buildMaxZoom: 640,
  buildMinY: -40,
  buildMaxY: 50,
  buildZoomStep: 12,
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
  ropeCracklePoints: 14,
  ropeCrackleJitter: 0.16,
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
  useSvgCharacter: false,
};

const defaultCharacterSettings = {
  scale: 1,
  torso: 1,
  head: 1,
  limbs: 1,
  ribbon: 0.95,
};

const characterSettings = { ...defaultCharacterSettings };

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
  selectedObject: null,
  panningCamera: false,
  pointerWorld: new THREE.Vector3(),
  panStartWorld: new THREE.Vector3(),
  panStartCamera: new THREE.Vector3(),
  paused: false,
};

const scratchVelocityDirection = new THREE.Vector3();
const scratchPerpDirection = new THREE.Vector3();
const scratchRopeStart = new THREE.Vector3();
const scratchRopeEnd = new THREE.Vector3();

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
scene.fog = new THREE.Fog(0x21172c, 46, 108);

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
camera.position.set(0, 0, 26);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
});
renderer.setPixelRatio(1);
renderer.setClearColor(0x21172c, 1);

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

const debugSettings = {
  timeScale: 1,
  pauseParallax: false,
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
  setDroneTensionStrength(value) {
    config.droneTensionStrength = value;
  },
  setSlowMotion(enabled) {
    debugSettings.timeScale = enabled ? 0.35 : 1;
  },
  setSvgCharacter(enabled) {
    config.useSvgCharacter = enabled;
    svgPuppet.group.visible = svgPuppet.loaded && enabled;
    setPlaceholderCharacterVisible(!svgPuppet.loaded || !enabled);
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

function createCloudTexture(colors, accent = "rgba(255, 143, 48, 0.34)", shadow = "rgba(45, 24, 45, 0.44)") {
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
  });
  ctx.fillStyle = accent;
  ctx.fillRect(20, 52, 190, 4);
  ctx.fillRect(84, 31, 112, 3);
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
  );
  const nearCloudTexture = createCloudTexture(
    ["#2d2037", "#582b44", "#82372e", "#b85e26", "#211b31"],
    "rgba(236, 129, 43, 0.26)",
    "rgba(20, 17, 28, 0.64)",
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
}

function updateParallaxCity(dt, now) {
  if (debugSettings.pauseParallax) return;
  for (const layer of Object.values(parallaxLayers)) layer.update(dt, now);

  const moon = parallaxLayers.moon.items[0];
  if (moon) {
    moon.position.x += Math.cos(now * moon.userData.orbitSpeed) * moon.userData.orbitRadius;
    moon.position.y += Math.sin(now * moon.userData.orbitSpeed * 0.7) * 0.9;
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

function createNinjaTexture() {
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 128;
  spriteCanvas.height = 192;
  const ctx = spriteCanvas.getContext("2d");

  ctx.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#101816";
  ctx.beginPath();
  ctx.roundRect(46, 52, 38, 86, 14);
  ctx.fill();
  ctx.fillStyle = "#111414";
  ctx.beginPath();
  ctx.arc(70, 40, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0c69e";
  ctx.beginPath();
  ctx.roundRect(70, 34, 24, 15, 6);
  ctx.fill();
  ctx.fillStyle = "#09100f";
  ctx.fillRect(56, 136, 18, 12);
  ctx.strokeStyle = "#f6ff66";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(48, 96);
  ctx.lineTo(86, 92);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(spriteCanvas);
  return pixelTextureSettings(texture);
}

const playerMesh = new THREE.Group();
const playerBody = new THREE.Group();
playerMesh.add(playerBody);
addGameplay(playerMesh);

const limbMaterial = new THREE.LineBasicMaterial({
  color: 0xc98a19,
  transparent: true,
  opacity: 1,
  depthTest: false,
});
const legMaterial = new THREE.LineBasicMaterial({
  color: 0x151719,
  transparent: true,
  opacity: 1,
  depthTest: false,
});
const playerLimbs = {
  frontArm: new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), limbMaterial.clone()),
  backArm: new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), limbMaterial.clone()),
  frontLeg: new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), legMaterial.clone()),
  backLeg: new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), legMaterial.clone()),
};
playerLimbs.backArm.material.opacity = 0.56;
playerLimbs.backLeg.material.opacity = 0.64;
for (const limb of Object.values(playerLimbs)) {
  limb.frustumCulled = false;
  limb.renderOrder = 25;
  playerBody.add(limb);
}

const playerPalette = {
  gold: 0xdca12b,
  goldLight: 0xffdf68,
  goldDark: 0x8b5b17,
  black: 0x101214,
  charcoal: 0x25292d,
  red: 0xd13c2e,
  redDark: 0x8b1e16,
  glow: 0xfff0a3,
};
const playerMaterials = Object.fromEntries(
  Object.entries(playerPalette).map(([name, color]) => [
    name,
    new THREE.MeshBasicMaterial({
      color,
      depthTest: false,
      transparent: true,
      opacity: 1,
    }),
  ]),
);
const playerDotGeometry = new THREE.CircleGeometry(0.5, 14);
const playerLineMaterial = new THREE.LineBasicMaterial({
  color: playerPalette.red,
  transparent: true,
  opacity: 0.94,
  depthTest: false,
});

function createPlayerDot(name, x, y, radius, materialName, z = 0.12) {
  const dot = new THREE.Mesh(playerDotGeometry, playerMaterials[materialName]);
  dot.name = name;
  dot.position.set(x, y, z);
  dot.scale.set(radius, radius, 1);
  dot.renderOrder = 28;
  dot.frustumCulled = false;
  playerBody.add(dot);
  return dot;
}

function createPlayerLine(name, color = playerPalette.red, opacity = 0.94, pointCount = 4) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: pointCount }, () => new THREE.Vector3())),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
    }),
  );
  line.name = name;
  line.renderOrder = 24;
  line.frustumCulled = false;
  playerBody.add(line);
  return line;
}

function setPlayerLine(line, startX, startY, endX, endY, z = 0.1) {
  const positions = line.geometry.attributes.position;
  positions.setXYZ(0, startX, startY, z);
  positions.setXYZ(1, startX + (endX - startX) * 0.33, startY + (endY - startY) * 0.33, z);
  positions.setXYZ(2, startX + (endX - startX) * 0.66, startY + (endY - startY) * 0.66, z);
  positions.setXYZ(3, endX, endY, z);
  positions.needsUpdate = true;
}

function setRibbonLine(line, points, z = 0.1) {
  const positions = line.geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const point = points[index];
    positions.setXYZ(index, point[0], point[1], z);
  }
  positions.needsUpdate = true;
}

const playerRig = {
  dots: {
    torsoShadow: createPlayerDot("torsoShadow", 0.03, 0.18, 0.38, "black", 0.09),
    torsoGold: createPlayerDot("torsoGold", 0.08, 0.34, 0.31, "gold", 0.14),
    chestPlate: createPlayerDot("chestPlate", 0.18, 0.45, 0.18, "goldLight", 0.16),
    waist: createPlayerDot("waist", 0.05, -0.14, 0.24, "black", 0.15),
    helmet: createPlayerDot("helmet", -0.02, 0.96, 0.34, "gold", 0.2),
    helmetBack: createPlayerDot("helmetBack", -0.14, 0.92, 0.24, "goldDark", 0.17),
    visor: createPlayerDot("visor", 0.14, 1.0, 0.13, "black", 0.22),
    helmetShine: createPlayerDot("helmetShine", -0.1, 1.08, 0.08, "goldLight", 0.24),
    scarfKnot: createPlayerDot("scarfKnot", -0.26, 0.88, 0.08, "red", 0.22),
    shoulderBack: createPlayerDot("shoulderBack", -0.12, 0.62, 0.13, "goldDark", 0.11),
    shoulderFront: createPlayerDot("shoulderFront", 0.22, 0.61, 0.15, "gold", 0.2),
    forearmGrapple: createPlayerDot("forearmGrapple", 0.5, 0.18, 0.12, "charcoal", 0.23),
    grappleLight: createPlayerDot("grappleLight", 0.55, 0.21, 0.045, "glow", 0.25),
    frontHand: createPlayerDot("frontHand", 0.62, 0.1, 0.09, "goldLight", 0.23),
    backHand: createPlayerDot("backHand", -0.56, 0.16, 0.08, "goldDark", 0.08),
    hipFront: createPlayerDot("hipFront", 0.2, -0.25, 0.12, "gold", 0.19),
    hipBack: createPlayerDot("hipBack", -0.06, -0.3, 0.1, "goldDark", 0.08),
    kneeFront: createPlayerDot("kneeFront", 0.45, -0.62, 0.1, "goldLight", 0.21),
    kneeBack: createPlayerDot("kneeBack", -0.36, -0.68, 0.09, "goldDark", 0.08),
    footFront: createPlayerDot("footFront", 0.63, -0.98, 0.11, "goldLight", 0.21),
    footBack: createPlayerDot("footBack", -0.42, -1.02, 0.09, "goldDark", 0.08),
  },
  lines: {
    scarfTop: createPlayerLine("scarfTop", playerPalette.red, 0.96, 12),
    scarfBottom: createPlayerLine("scarfBottom", playerPalette.redDark, 0.92, 12),
    scarfTopShadow: createPlayerLine("scarfTopShadow", 0x220706, 0.72, 12),
    scarfBottomShadow: createPlayerLine("scarfBottomShadow", 0x220706, 0.64, 12),
    ribA: createPlayerLine("ribA", playerPalette.red, 0.86),
    ribB: createPlayerLine("ribB", playerPalette.redDark, 0.78),
  },
};

const svgPuppet = {
  loaded: false,
  parts: {},
  group: new THREE.Group(),
};
svgPuppet.group.name = "svgPuppet";
svgPuppet.group.visible = false;
playerBody.add(svgPuppet.group);
for (const line of [
  playerRig.lines.scarfTop,
  playerRig.lines.scarfBottom,
  playerRig.lines.scarfTopShadow,
  playerRig.lines.scarfBottomShadow,
]) {
  line.renderOrder = 54;
}

const svgLayerOrder = [
  "head",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
  "rightUpperLeg",
  "rightLowerLeg",
  "rightFoot",
  "torsoUpper",
  "torsoLower",
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "leftUpperLeg",
  "leftLowerLeg",
  "leftFoot",
];

function getSvgLayerRenderOrder(name) {
  const index = svgLayerOrder.indexOf(name);
  return 32 + (svgLayerOrder.length - index);
}

const svgPartDefinitions = {
  head: { file: "head.svg", height: 0.56, pivot: "joint-neck", z: 0.52 },
  rightUpperArm: { file: "arm_upper.svg", jointA: "joint-shoulder", jointB: "joint-elbow", jointSpan: 0.4, pivot: "joint-shoulder", z: 0.5 },
  rightLowerArm: { file: "arm_lower.svg", jointA: "joint-elbow", jointB: "joint-wrist", jointSpan: 0.38, pivot: "joint-elbow", z: 0.49 },
  rightHand: { file: "hand.svg", height: 0.18, pivot: "joint-wrist", z: 0.48 },
  rightUpperLeg: { file: "leg_upper.svg", jointA: "joint-groin", jointB: "joint-knee", jointSpan: 0.58, pivot: "joint-groin", z: 0.47 },
  rightLowerLeg: { file: "leg_lower.svg", jointA: "joint-knee", jointB: "joint-ankle", jointSpan: 0.58, pivot: "joint-knee", z: 0.46 },
  rightFoot: { file: "foot.svg", height: 0.19, pivot: "joint-foot", z: 0.45 },
  torsoUpper: { file: "torso_upper.svg", jointA: "joint-neck", jointB: "joint-waist", jointSpan: 0.56, pivot: "joint-shoulder", z: 0.44 },
  torsoLower: { file: "torso_lower.svg", jointA: "joint-waist", jointB: "joint-groin", jointSpan: 0.26, pivot: "joint-waist", z: 0.43 },
  leftUpperArm: { file: "arm_upper.svg", jointA: "joint-shoulder", jointB: "joint-elbow", jointSpan: 0.42, pivot: "joint-shoulder", z: 0.42 },
  leftLowerArm: { file: "arm_lower_grapple.svg", jointA: "joint-elbow", jointB: "joint-wrist", jointSpan: 0.4, pivot: "joint-elbow", z: 0.41 },
  leftHand: { file: "hand.svg", height: 0.2, pivot: "joint-wrist", z: 0.4 },
  leftUpperLeg: { file: "leg_upper.svg", jointA: "joint-groin", jointB: "joint-knee", jointSpan: 0.62, pivot: "joint-groin", z: 0.39 },
  leftLowerLeg: { file: "leg_lower.svg", jointA: "joint-knee", jointB: "joint-ankle", jointSpan: 0.58, pivot: "joint-knee", z: 0.38 },
  leftFoot: { file: "foot.svg", height: 0.2, pivot: "joint-foot", z: 0.37 },
};

function parseSvgViewBox(svgText) {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const viewBox = (doc.documentElement.getAttribute("viewBox") || "0 0 1 1")
    .trim()
    .split(/\s+/)
    .map(Number);
  const styleText = doc.querySelector("style")?.textContent || "";
  const greenClasses = new Set(
    Array.from(styleText.matchAll(/\.([a-zA-Z0-9_-]+)\s*\{[^}]*fill:\s*#5eff00/gi))
      .map((match) => match[1]),
  );
  const blueClasses = new Set(
    Array.from(styleText.matchAll(/\.([a-zA-Z0-9_-]+)\s*\{[^}]*fill:\s*(aqua|#00ffff|rgb\(0,\s*255,\s*255\))/gi))
      .map((match) => match[1]),
  );
  const isMarkerCircle = (circle) => {
    const fill = (circle.getAttribute("fill") || "").toLowerCase().replace(/\s+/g, "");
    const className = circle.getAttribute("class") || "";
    return fill === "#5eff00" || fill === "aqua" || fill === "#00ffff" || fill === "rgb(0,255,255)" || greenClasses.has(className) || blueClasses.has(className);
  };
  const joints = Array.from(doc.querySelectorAll("circle"))
    .filter((circle) => {
      const fill = (circle.getAttribute("fill") || "").toLowerCase();
      const className = circle.getAttribute("class") || "";
      return fill === "#5eff00" || greenClasses.has(className);
    })
    .map((circle, index) => ({
      id: circle.id || `joint-${index + 1}`,
      x: Number(circle.getAttribute("cx") || 0),
      y: Number(circle.getAttribute("cy") || 0),
    }));
  const jointsById = Object.fromEntries(joints.filter((joint) => joint.id).map((joint) => [joint.id, joint]));
  const ribbonAnchors = Array.from(doc.querySelectorAll("circle"))
    .filter((circle) => {
      const fill = (circle.getAttribute("fill") || "").toLowerCase().replace(/\s+/g, "");
      const className = circle.getAttribute("class") || "";
      return fill === "aqua" || fill === "#00ffff" || fill === "rgb(0,255,255)" || blueClasses.has(className);
    })
    .map((circle, index) => ({
      id: circle.id || `ribbon-anchor-${index + 1}`,
      x: Number(circle.getAttribute("cx") || 0),
      y: Number(circle.getAttribute("cy") || 0),
    }));
  const ribbonAnchorsById = Object.fromEntries(
    ribbonAnchors.filter((anchor) => anchor.id).map((anchor) => [anchor.id, anchor]),
  );
  return { doc, viewBox, joints, jointsById, ribbonAnchors, ribbonAnchorsById, isMarkerCircle };
}

function stripSvgJointMarkers(doc, isMarkerCircle) {
  for (const circle of Array.from(doc.querySelectorAll("circle"))) {
    if (isMarkerCircle(circle)) circle.remove();
  }
  return new XMLSerializer().serializeToString(doc.documentElement);
}

function chooseSvgPivot(joints, viewBox, mode, jointsById = {}) {
  if (!joints.length) {
    return { x: viewBox[2] * 0.5, y: viewBox[3] * 0.5 };
  }
  if (jointsById[mode]) return jointsById[mode];
  const sortedByY = [...joints].sort((a, b) => a.y - b.y);
  if (mode === "lowest") return sortedByY[sortedByY.length - 1];
  if (mode === "middle") return sortedByY[Math.floor(sortedByY.length * 0.5)];
  return sortedByY[0];
}

function getSvgJointSpan(joints, viewBox) {
  if (joints.length < 2) return Math.max(viewBox[3], 1);
  const sortedByY = [...joints].sort((a, b) => a.y - b.y);
  const top = sortedByY[0];
  const bottom = sortedByY[sortedByY.length - 1];
  return Math.max(Math.hypot(bottom.x - top.x, bottom.y - top.y), 1);
}

function getSvgDefinitionJointSpan(definition, jointsById, viewBox) {
  const start = jointsById[definition.jointA];
  const end = jointsById[definition.jointB];
  if (!start || !end) return Math.max(viewBox[3], 1);
  return Math.max(Math.hypot(end.x - start.x, end.y - start.y), 1);
}

function svgTextToImage(svgText) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });
}

function imageToCanvasTexture(image) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = Math.max(1, image.naturalWidth || image.width || 1);
  textureCanvas.height = Math.max(1, image.naturalHeight || image.height || 1);
  const ctx = textureCanvas.getContext("2d");
  ctx.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
  ctx.drawImage(image, 0, 0, textureCanvas.width, textureCanvas.height);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

async function loadSvgPuppetPart(name, definition) {
  const url = `./svg/${definition.file}`;
  const svgText = await fetch(url).then((response) => response.text());
  const { doc, viewBox, joints, jointsById, ribbonAnchors, ribbonAnchorsById, isMarkerCircle } = parseSvgViewBox(svgText);
  const image = await svgTextToImage(stripSvgJointMarkers(doc, isMarkerCircle));
  const [, , viewWidth = image.naturalWidth || 1, viewHeight = image.naturalHeight || 1] = viewBox;
  const unitsPerPixel = definition.jointSpan
    ? definition.jointSpan / getSvgDefinitionJointSpan(definition, jointsById, viewBox)
    : definition.height
    ? definition.height / viewHeight
    : definition.width / viewWidth;
  const width = viewWidth * unitsPerPixel;
  const height = viewHeight * unitsPerPixel;
  const pivot = chooseSvgPivot(joints, viewBox, definition.pivot, jointsById);
  const jointSpan = getSvgJointSpan(joints, viewBox) * unitsPerPixel;
  const texture = imageToCanvasTexture(image);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(
    width * 0.5 - pivot.x * unitsPerPixel,
    pivot.y * unitsPerPixel - height * 0.5,
    definition.z,
  );
  mesh.renderOrder = getSvgLayerRenderOrder(name);
  mesh.frustumCulled = false;
  const group = new THREE.Group();
  group.name = `svg-${name}`;
  group.renderOrder = getSvgLayerRenderOrder(name);
  group.frustumCulled = false;
  group.add(mesh);
  svgPuppet.group.add(group);
  return { group, mesh, width, height, jointSpan, unitsPerPixel, viewBox, joints, jointsById, ribbonAnchors, ribbonAnchorsById, definition };
}

function setPlaceholderCharacterVisible(visible) {
  for (const dot of Object.values(playerRig.dots)) dot.visible = visible;
  for (const limb of Object.values(playerLimbs)) limb.visible = visible;
  playerRig.lines.ribA.visible = visible;
  playerRig.lines.ribB.visible = visible;
}

async function loadSvgPuppet() {
  try {
    const entries = await Promise.all(
      Object.entries(svgPartDefinitions).map(async ([name, definition]) => [
        name,
        await loadSvgPuppetPart(name, definition),
      ]),
    );
    svgPuppet.parts = Object.fromEntries(entries);
    svgPuppet.loaded = true;
    svgPuppet.group.visible = config.useSvgCharacter;
    setPlaceholderCharacterVisible(!config.useSvgCharacter);
  } catch (error) {
    console.warn("SVG puppet failed to load; keeping placeholder character.", error);
    svgPuppet.loaded = false;
    svgPuppet.group.visible = false;
    setPlaceholderCharacterVisible(true);
  }
}

function placeSvgPart(part, x, y, rotation = 0, scaleX = 1, scaleY = 1) {
  if (!part) return;
  part.group.position.set(x, y, 0);
  part.group.rotation.z = rotation;
  part.group.scale.set(scaleX, scaleY, 1);
}

function placeSvgSegment(part, start, end, widthScale = 1, rotationOffset = Math.PI / 2) {
  if (!part) return;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(Math.hypot(dx, dy), 0.001);
  placeSvgPart(
    part,
    start.x,
    start.y,
    Math.atan2(dy, dx) + rotationOffset,
    widthScale,
    length / Math.max(part.jointSpan, 0.001),
  );
}

function getSvgMarkerLocalPoint(part, marker, target = new THREE.Vector3()) {
  if (!part || !marker) return target.set(0, 0, 0);
  const pivot = chooseSvgPivot(part.joints, part.viewBox, part.definition.pivot, part.jointsById);
  return target.set(
    (marker.x - pivot.x) * part.unitsPerPixel,
    (pivot.y - marker.y) * part.unitsPerPixel,
    0,
  );
}

const svgScratchA = new THREE.Vector3();
const svgScratchB = new THREE.Vector3();
const svgScratchC = new THREE.Vector3();
const svgScratchD = new THREE.Vector3();

function getSvgSortedJoints(part) {
  return part?.joints ? [...part.joints].sort((a, b) => a.y - b.y) : [];
}

function getSvgJoint(part, role = "top") {
  const namedJoint = part?.jointsById?.[role] ?? part?.jointsById?.[`joint-${role}`];
  if (namedJoint) return namedJoint;
  const joints = getSvgSortedJoints(part);
  if (!joints.length) return null;
  if (role === "bottom") return joints[joints.length - 1];
  if (role === "middle") return joints[Math.floor(joints.length * 0.5)];
  return joints[0];
}

function getSvgJointLocalPoint(part, role = "top", target = new THREE.Vector3()) {
  return getSvgMarkerLocalPoint(part, getSvgJoint(part, role), target);
}

function placeSvgPartByJoint(part, role, target, rotation = 0, scale = 1) {
  if (!part || !target) return;
  const local = getSvgJointLocalPoint(part, role, svgScratchA);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const offsetX = (local.x * cos - local.y * sin) * scale;
  const offsetY = (local.x * sin + local.y * cos) * scale;
  placeSvgPart(part, target.x - offsetX, target.y - offsetY, rotation, scale, scale);
}

function getSvgPartJointWorld(part, role, target = new THREE.Vector3()) {
  if (!part) return target.set(0, 0, 0);
  getSvgJointLocalPoint(part, role, target);
  part.group.localToWorld(target);
  return target;
}

function getSvgPartJointRigPoint(part, role, target = new THREE.Vector3()) {
  if (!part) return target.set(0, 0, 0);
  getSvgJointLocalPoint(part, role, target);
  part.group.updateMatrix();
  target.applyMatrix4(part.group.matrix);
  return target;
}

function placeSvgSegmentByStartAndAngle(part, start, angle, scale = 1) {
  if (!part || !start) return;
  const startJoint = part.definition.jointA || "top";
  const endJoint = part.definition.jointB || "bottom";
  const startLocal = getSvgJointLocalPoint(part, startJoint, svgScratchA);
  const endLocal = getSvgJointLocalPoint(part, endJoint, svgScratchB);
  const nativeAngle = Math.atan2(endLocal.y - startLocal.y, endLocal.x - startLocal.x);
  placeSvgPartByJoint(part, startJoint, start, angle - nativeAngle, scale);
}

function segmentAngle(start, end) {
  return Math.atan2(end.y - start.y, end.x - start.x);
}

function getSvgRibbonWorldAnchor(index, target) {
  const head = svgPuppet.parts.head;
  const marker = head?.ribbonAnchors?.[0];
  if (!config.useSvgCharacter || !svgPuppet.loaded || !head || !marker) return null;
  getSvgMarkerLocalPoint(head, marker, target);
  target.x -= (0.03 + index * 0.02) * state.facing;
  target.y -= index * 0.04;
  head.group.localToWorld(target);
  return target;
}

function getSvgSkeletonPose() {
  const pose = {
    torsoShoulder: new THREE.Vector3(0.0, 0.58, 0),
    torsoLower: new THREE.Vector3(0.22, -0.16, 0),
    neck: new THREE.Vector3(-0.12, 1.02, 0),
    head: new THREE.Vector3(-0.14, 1.04, 0),
    frontShoulder: new THREE.Vector3(0.18, 0.6, 0),
    frontElbow: new THREE.Vector3(0.54, 0.48, 0),
    frontWrist: new THREE.Vector3(0.94, 0.5, 0),
    backShoulder: new THREE.Vector3(-0.03, 0.54, 0),
    backElbow: new THREE.Vector3(0.17, 0.24, 0),
    backWrist: new THREE.Vector3(0.42, 0.1, 0),
    frontHip: new THREE.Vector3(0.15, -0.38, 0),
    frontKnee: new THREE.Vector3(0.1, -1.12, 0),
    frontAnkle: new THREE.Vector3(0.15, -1.82, 0),
    backHip: new THREE.Vector3(-0.05, -0.4, 0),
    backKnee: new THREE.Vector3(-0.14, -1.06, 0),
    backAnkle: new THREE.Vector3(-0.1, -1.76, 0),
  };

  if (state.flourishSpinRemaining > 0) {
    const progress = 1 - state.flourishSpinRemaining / config.flourishSpinDuration;
    const tuck = Math.sin(progress * Math.PI);
    pose.frontElbow.set(0.32, 0.25 + tuck * 0.28, 0);
    pose.frontWrist.set(0.46, 0.05 + tuck * 0.34, 0);
    pose.backElbow.set(-0.16, 0.22 + tuck * 0.25, 0);
    pose.backWrist.set(-0.28, 0.02 + tuck * 0.3, 0);
    pose.frontKnee.set(0.24, -0.68 + tuck * 0.5, 0);
    pose.frontAnkle.set(0.42, -0.96 + tuck * 0.46, 0);
    pose.backKnee.set(-0.22, -0.7 + tuck * 0.5, 0);
    pose.backAnkle.set(-0.36, -0.98 + tuck * 0.42, 0);
    return pose;
  }

  if (state.hookActive && (state.anchor || state.hookEnd)) {
    const ropeTarget = state.grappled && state.anchor ? getVisualGrapplePoint(state.anchor, scratchRopeEnd) : state.hookEnd;
    const ropeDirection = scratchVelocityDirection.subVectors(ropeTarget, state.player).normalize();
    const localRopeX = ropeDirection.x * state.facing;
    const localRopeY = ropeDirection.y;
    pose.frontElbow.set(
      pose.frontShoulder.x + localRopeX * 0.38,
      pose.frontShoulder.y + localRopeY * 0.38,
      0,
    );
    pose.frontWrist.set(
      pose.frontShoulder.x + localRopeX * 0.82,
      pose.frontShoulder.y + localRopeY * 0.82,
      0,
    );
    const upswing = THREE.MathUtils.clamp(state.velocity.y / 12, -0.7, 0.7);
    pose.frontKnee.x += 0.16 + upswing * 0.28;
    pose.frontAnkle.x += 0.2 + upswing * 0.36;
    pose.backKnee.x -= 0.14 - upswing * 0.18;
    pose.backAnkle.x -= 0.18 - upswing * 0.24;
    return pose;
  }

  if (state.hasLaunched && !state.grounded && !state.gameOver && !state.finished) {
    const glide = THREE.MathUtils.clamp(state.velocity.x * state.facing / 18, -0.25, 0.45);
    const fall = THREE.MathUtils.clamp(-state.velocity.y / 18, -0.2, 0.5);
    pose.frontElbow.x += 0.14 + glide * 0.18;
    pose.frontWrist.x += 0.2 + glide * 0.24;
    pose.backElbow.x -= 0.14;
    pose.backWrist.x -= 0.18;
    pose.frontKnee.x += 0.18 + glide * 0.12;
    pose.frontAnkle.x += 0.2 + glide * 0.16;
    pose.frontAnkle.y += fall * 0.2;
    pose.backKnee.x -= 0.12;
    pose.backAnkle.x -= 0.18;
    pose.backAnkle.y += fall * 0.18;
  }

  return pose;
}

function updateSvgPuppetRig() {
  if (!config.useSvgCharacter || !svgPuppet.loaded) return;

  const parts = svgPuppet.parts;
  const pose = getSvgSkeletonPose();
  const torsoScale = characterSettings.torso;
  const limbScale = characterSettings.limbs;
  const shoulder = pose.torsoShoulder.clone();

  placeSvgPartByJoint(parts.torsoUpper, "joint-shoulder", shoulder, -0.03, torsoScale);
  const neck = getSvgPartJointRigPoint(parts.torsoUpper, "joint-neck", svgScratchB);
  const waist = getSvgPartJointRigPoint(parts.torsoUpper, "joint-waist", svgScratchC);
  placeSvgPartByJoint(parts.torsoLower, "joint-waist", waist, 0.04, torsoScale);
  const hipRoot = getSvgPartJointRigPoint(parts.torsoLower, "joint-groin", svgScratchD);
  const torsoShoulder = getSvgPartJointRigPoint(parts.torsoUpper, "joint-shoulder", new THREE.Vector3());
  const headNeck = neck.clone().add(new THREE.Vector3(-0.02, -0.14, 0));
  placeSvgPartByJoint(parts.head, "joint-neck", headNeck, -0.08, characterSettings.head);

  const rightShoulder = new THREE.Vector3(torsoShoulder.x - 0.05, torsoShoulder.y - 0.02, 0);
  const leftShoulder = new THREE.Vector3(torsoShoulder.x + 0.16, torsoShoulder.y + 0.02, 0);
  const rightHip = new THREE.Vector3(hipRoot.x - 0.1, hipRoot.y + 0.02, 0);
  const leftHip = new THREE.Vector3(hipRoot.x + 0.11, hipRoot.y + 0.03, 0);

  placeSvgSegmentByStartAndAngle(parts.rightUpperArm, rightShoulder, segmentAngle(pose.backShoulder, pose.backElbow), limbScale);
  const rightElbow = getSvgPartJointRigPoint(parts.rightUpperArm, "joint-elbow", new THREE.Vector3());
  placeSvgSegmentByStartAndAngle(parts.rightLowerArm, rightElbow, segmentAngle(pose.backElbow, pose.backWrist), limbScale);
  const rightWrist = getSvgPartJointRigPoint(parts.rightLowerArm, "joint-wrist", new THREE.Vector3());
  placeSvgPartByJoint(parts.rightHand, "joint-wrist", rightWrist, -0.35, limbScale);

  placeSvgSegmentByStartAndAngle(parts.leftUpperArm, leftShoulder, segmentAngle(pose.frontShoulder, pose.frontElbow), limbScale);
  const leftElbow = getSvgPartJointRigPoint(parts.leftUpperArm, "joint-elbow", new THREE.Vector3());
  placeSvgSegmentByStartAndAngle(parts.leftLowerArm, leftElbow, segmentAngle(pose.frontElbow, pose.frontWrist), limbScale);
  const leftWrist = getSvgPartJointRigPoint(parts.leftLowerArm, "joint-wrist", new THREE.Vector3());
  placeSvgPartByJoint(parts.leftHand, "joint-wrist", leftWrist, -0.2, limbScale);

  placeSvgSegmentByStartAndAngle(parts.rightUpperLeg, rightHip, segmentAngle(pose.backHip, pose.backKnee), limbScale);
  const rightKnee = getSvgPartJointRigPoint(parts.rightUpperLeg, "joint-knee", new THREE.Vector3());
  placeSvgSegmentByStartAndAngle(parts.rightLowerLeg, rightKnee, segmentAngle(pose.backKnee, pose.backAnkle), limbScale);
  const rightAnkle = getSvgPartJointRigPoint(parts.rightLowerLeg, "joint-ankle", new THREE.Vector3());
  placeSvgPartByJoint(parts.rightFoot, "joint-foot", rightAnkle, -0.28, limbScale);

  placeSvgSegmentByStartAndAngle(parts.leftUpperLeg, leftHip, segmentAngle(pose.frontHip, pose.frontKnee), limbScale);
  const leftKnee = getSvgPartJointRigPoint(parts.leftUpperLeg, "joint-knee", new THREE.Vector3());
  placeSvgSegmentByStartAndAngle(parts.leftLowerLeg, leftKnee, segmentAngle(pose.frontKnee, pose.frontAnkle), limbScale);
  const leftAnkle = getSvgPartJointRigPoint(parts.leftLowerLeg, "joint-ankle", new THREE.Vector3());
  placeSvgPartByJoint(parts.leftFoot, "joint-foot", leftAnkle, -0.18, limbScale);
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
    for (let index = 0; index < ribbon.points.length; index += 1) {
      const point = ribbon.points[index].set(
        state.player.x - 0.26 * state.facing,
        state.player.y + 0.9 - ribbonIndex * 0.08 - index * ribbon.segmentLength * characterSettings.ribbon,
        0,
      );
      ribbon.previous[index].copy(point);
    }
  }
}

function applyCharacterSettings() {
  playerBody.scale.set(
    state.facing * characterSettings.scale,
    characterSettings.scale,
    1,
  );
}

function syncCharacterControls() {
  if (!characterScaleInput) return;
  characterScaleInput.value = String(characterSettings.scale);
  characterTorsoInput.value = String(characterSettings.torso);
  characterHeadInput.value = String(characterSettings.head);
  characterLimbsInput.value = String(characterSettings.limbs);
  characterRibbonInput.value = String(characterSettings.ribbon);
}

function saveCharacterSettings() {
  localStorage.setItem(characterSettingsStorageKey, JSON.stringify(characterSettings));
}

function loadCharacterSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(characterSettingsStorageKey));
    if (!stored || typeof stored !== "object") return;
    for (const key of Object.keys(defaultCharacterSettings)) {
      if (Number.isFinite(stored[key])) characterSettings[key] = stored[key];
    }
  } catch {
    localStorage.removeItem(characterSettingsStorageKey);
  }
}

function updateCharacterSetting(key, value) {
  characterSettings[key] = Number(value);
  saveCharacterSettings();
  applyCharacterSettings();
  resetRibbonPhysics();
}

function resetCharacterSettings() {
  Object.assign(characterSettings, defaultCharacterSettings);
  saveCharacterSettings();
  syncCharacterControls();
  applyCharacterSettings();
  resetRibbonPhysics();
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

function createRopeGradientTexture() {
  const ropeCanvas = document.createElement("canvas");
  ropeCanvas.width = 128;
  ropeCanvas.height = 8;
  const ctx = ropeCanvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, ropeCanvas.width, 0);
  gradient.addColorStop(0, "rgba(25, 223, 255, 0)");
  gradient.addColorStop(0.22, "rgba(25, 223, 255, 0.78)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.78, "rgba(25, 223, 255, 0.78)");
  gradient.addColorStop(1, "rgba(25, 223, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ropeCanvas.width, ropeCanvas.height);

  const texture = new THREE.CanvasTexture(ropeCanvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const ropeMeshMaterial = new THREE.MeshBasicMaterial({
  map: createRopeGradientTexture(),
  transparent: true,
  opacity: 0.96,
  depthWrite: false,
  depthTest: false,
  side: THREE.DoubleSide,
});
const ropeMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1), ropeMeshMaterial);
ropeMesh.visible = false;
ropeMesh.renderOrder = 21;
addGameplay(ropeMesh);
const ropeLine = ropeMesh;

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

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const playPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

const anchors = [];
const hazards = [];
const bonuses = [];
const slowMotionRings = [];
const platforms = [];
const editableObjects = [];
let defaultAnchorLayout = [];
let defaultEditorLayout = null;

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
  color: 0x253633,
  emissive: 0x07100f,
  roughness: 0.74,
});
const startBlockEdgeMaterial = new THREE.MeshBasicMaterial({
  color: 0x77dbc5,
  transparent: true,
  opacity: 0.32,
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
    object.hitMesh.material.opacity = selected ? 0.14 : 0;
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
  const drone = createDroneVisual();
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
    mesh: drone.group,
    hitMesh,
    position: hitMesh.position,
    used: false,
    index: anchors.length,
    droneState: DroneState.IDLE,
    lights: drone.lights,
    lightGlows: drone.lightGlows,
    rotors: drone.rotors,
    grapplePoint: drone.grapplePoint,
    debugAnchor,
    visualOffset: new THREE.Vector3(),
    visualVelocity: new THREE.Vector3(),
    impactOffset: new THREE.Vector3(),
    impactVelocity: new THREE.Vector3(),
    releasedAt: -100,
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

function addStartBlock() {
  const blockHeight = 26;
  const blockTop = 8.85;
  const block = new THREE.Mesh(new THREE.BoxGeometry(2.5, blockHeight, 1.2), startBlockMaterial);
  block.position.set(-4.05, blockTop - blockHeight * 0.5, -0.05);
  addGameplay(block);

  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.08, blockHeight, 1.28), startBlockEdgeMaterial);
  edge.position.set(-2.76, blockTop - blockHeight * 0.5, 0.02);
  addGameplay(edge);

  const ledge = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 1.25), startBlockEdgeMaterial);
  ledge.position.set(-2.25, 6.35, 0.03);
  addGameplay(ledge);
  addPlatform(-2.25, 6.35, 1.0);
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

  defaultAnchorLayout = [
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
  ];

  defaultAnchorLayout.forEach(([x, y]) => addAnchor(x, y));

  [
    [150, -4.4, 1.1, 5.7],
    [178, -3.4, 1.3, 7.4],
    [210, -5.4, 1.2, 5.1],
  ].forEach(([x, y, w, h]) => addHazard(x, y, w, h));

  [
    [30, 10.3],
    [58, 10.7],
    [86, 9.8],
    [118, 10.2],
    [151, 11.0],
    [184, 10.8],
  ].forEach(([x, y]) => addBonus(x, y));

  addSlowMotionRing(78.5, 5.8);
  defaultEditorLayout = serializeEditorLayout();
  loadEditorLayout();
}

buildCourse();

function serializeEditorLayout() {
  const finish = editableObjects.find((object) => object.type === "finish");
  return {
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
  localStorage.setItem(editorLayoutStorageKey, JSON.stringify(serializeEditorLayout()));
  localStorage.setItem(anchorStorageKey, JSON.stringify(anchors.map((anchor) => [
    Number(anchor.position.x.toFixed(2)),
    Number(anchor.position.y.toFixed(2)),
  ])));
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

function loadEditorLayout() {
  const stored = localStorage.getItem(editorLayoutStorageKey);
  if (!stored) {
    const legacyAnchors = localStorage.getItem(anchorStorageKey);
    if (!legacyAnchors) return;

    try {
      const anchorsOnly = JSON.parse(legacyAnchors);
      if (Array.isArray(anchorsOnly)) applyEditorLayout({ ...defaultEditorLayout, anchors: anchorsOnly });
    } catch {
      localStorage.removeItem(anchorStorageKey);
    }
    return;
  }

  try {
    const layout = JSON.parse(stored);
    applyEditorLayout(layout);
  } catch {
    localStorage.removeItem(editorLayoutStorageKey);
  }
}

function resetEditorLayout() {
  localStorage.removeItem(anchorStorageKey);
  localStorage.removeItem(editorLayoutStorageKey);
  applyEditorLayout(defaultEditorLayout);
  releaseGrapple();
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
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updatePointer(event) {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(playPlane, state.pointerWorld);
}

function pickEditableObject(event) {
  updatePointer(event);
  const hits = raycaster.intersectObjects(editableObjects.map((object) => object.hitMesh), false);
  if (!hits.length) return null;

  return hits[0].object.userData.editorObject ?? null;
}

function startEditorDrag(event) {
  if (!state.paused) return;

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
  if (!state.paused) return;

  event.preventDefault();
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
  }
  state.player.set(-2.35, 7.15, 0);
  state.previousPlayer.copy(state.player);
  state.velocity.set(0, 0, 0);
  state.hasLaunched = false;
  state.grounded = false;
  state.grappled = false;
  state.hookActive = false;
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
  state.nextScoreX = 16;
  state.gameOver = false;
  state.finished = false;
  state.levelCompleteShown = false;
  state.restartAt = 0;
  state.spaceDownAt = -100;
  state.spaceIsDown = false;
  state.spaceHadAnchor = false;
  state.flourishSpinRemaining = 0;
  state.flourishFlipDirection = 1;
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
    resetRibbonPhysics();
    resetJeremyFireworks();
    levelCompletePanel.classList.add("hidden");
  anchors.forEach((anchor) => {
    anchor.used = false;
    anchor.visualOffset.set(0, 0, 0);
    anchor.visualVelocity.set(0, 0, 0);
    anchor.impactOffset.set(0, 0, 0);
    anchor.impactVelocity.set(0, 0, 0);
    anchor.mesh.position.copy(anchor.position);
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
  ropeCrackleLine.visible = false;
  hookTip.visible = false;
  hookHead.visible = false;
  hookWrap.visible = false;
  targetGlow.visible = false;
  targetRing.visible = false;
  playerBody.visible = true;
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

function setPaused(paused) {
  state.paused = paused;
  togglePauseButton.textContent = state.paused ? "Play" : "Pause";
  buildTools.classList.toggle("hidden", !state.paused);
  if (state.paused) updateBuildZoomControl();
  if (!state.paused) {
    selectEditorObject(null);
    state.draggedObject = null;
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

function startCrashExplosion(now) {
  state.crashExploding = true;
  state.crashExplosionStartedAt = now;
  playerBody.visible = false;

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
    const dx = anchor.position.x - player.x;
    const dy = anchor.position.y - player.y;

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
    const distance = state.player.distanceTo(anchor.position);
    if (distance > config.grappleRange) continue;

    if (distance < bestDistance) {
      best = anchor;
      bestDistance = distance;
    }
  }

  return best;
}

function findHookHit() {
  let best = null;
  let bestDistance = Infinity;

  if (state.anchor) {
    const targetDistance = state.hookEnd.distanceTo(state.anchor.position);
    const targetPathDistance = distanceFromSegmentToPoint(state.previousHookEnd, state.hookEnd, state.anchor.position);
    if (Math.min(targetDistance, targetPathDistance) < config.hookHitRadius) return state.anchor;
  }

  for (const anchor of anchors) {
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

function attachAnchor(anchor) {
  state.anchor = anchor;
  state.grappled = true;
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
  const anchor = anchorOverride ?? findAnchor();

  state.hookActive = true;
  state.anchor = anchor;
  state.grappled = false;
  state.ropeLength = config.minRopeLength;
  const origin = getRopeOrigin();
  if (anchor) {
    state.aimDirection.subVectors(anchor.position, origin).normalize();
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
  if (hadAnchor) state.lastReleasedAnchor = releasedAnchor;
  if (state.anchor) {
    state.anchor.releasedAt = performance.now() / 1000;
    setDroneState(state.anchor, DroneState.RELEASED);
  }
  state.anchor = null;
  state.stuntAnchor = null;
  state.stuntRotation = 0;
  state.stuntTopOverArmed = false;
  state.stuntBoostArmed = false;
  state.stuntBurstClockArmed = false;
  ropeLine.visible = false;
  ropeMesh.visible = false;
  ropeCrackleLine.visible = false;
  hookTip.visible = false;
  hookHead.visible = false;
  hookWrap.visible = false;

  if (shouldActivateSlowMotion) {
    activateSlowMotion();
  }

  if (hadAnchor && pop && !state.gameOver) {
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
  releaseGrapple();
  state.velocity.x += config.flourishBoost;
  state.velocity.y += config.flourishLift;
  state.lastFlourishAt = now;
  state.flourishPulse = 1;
  state.flourishSpinRemaining = config.flourishSpinDuration;
  state.flourishFlipDirection = state.velocity.x >= 0 ? 1 : -1;
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

function updateGrapple(dt) {
  if (!state.hookActive) return;

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
  const targetedAnchor = state.grappled ? state.anchor : state.hookActive ? state.anchor : findGuideAnchor();

  for (const anchor of anchors) {
    if (anchor === state.anchor && state.grappled) {
      setDroneState(anchor, DroneState.GRAPPLED);
    } else if (anchor === targetedAnchor && !state.grappled) {
      setDroneState(anchor, DroneState.TARGETED);
    } else if (now - anchor.releasedAt < 0.28) {
      setDroneState(anchor, DroneState.RELEASED);
    } else {
      setDroneState(anchor, DroneState.IDLE);
    }

    const hover = Math.sin(now * 2.8 + anchor.index * 0.9) * config.droneHoverAmount;
    const tensionTarget = scratchVelocityDirection.set(0, 0, 0);
    if (anchor === state.anchor && state.grappled) {
      tensionTarget.subVectors(state.player, anchor.position);
      const distance = Math.max(tensionTarget.length(), 0.001);
      tensionTarget.multiplyScalar(1 / distance);
      const ropeTension = THREE.MathUtils.clamp(distance / Math.max(state.ropeLength, 0.1) - 0.82, 0, 1);
      tensionTarget.multiplyScalar(config.droneTensionStrength * ropeTension);
    }

    anchor.visualOffset.lerp(tensionTarget, 0.18);
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
    anchor.mesh.rotation.z = tilt + Math.sin(now * 1.8 + anchor.index) * 0.025;
    anchor.mesh.rotation.y = Math.sin(now * 1.3 + anchor.index) * 0.08;
    const stateScale =
      anchor.droneState === DroneState.TARGETED ? 1.1 : anchor.droneState === DroneState.GRAPPLED ? 1.14 : 1;
    const currentScale = anchor.mesh.scale.x + (stateScale - anchor.mesh.scale.x) * 0.12;
    anchor.mesh.scale.setScalar(currentScale);

    const rotorSpeed = anchor.droneState === DroneState.GRAPPLED ? 22 : anchor.droneState === DroneState.TARGETED ? 18 : 14;
    for (const rotor of anchor.rotors) {
      rotor.rotation.z = now * rotorSpeed * (rotor.position.x < 0 ? -1 : 1);
    }

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

function updateAimIndicator() {
  const anchor = state.hookActive ? state.anchor : findGuideAnchor();
  const origin = getRopeOrigin();

  if (anchor) {
    state.aimEnd.copy(anchor.position);
    state.aimDirection.subVectors(anchor.position, origin).normalize();
  } else {
    const speed = Math.hypot(state.velocity.x, state.velocity.y);
    if (speed > 0.2) {
      state.aimDirection.set(state.velocity.x / speed, state.velocity.y / speed, 0).normalize();
    } else {
      state.aimDirection.set(1, 0.35, 0).normalize();
    }
    state.aimEnd.copy(origin).addScaledVector(state.aimDirection, config.aimLength);
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

function getRopeOrigin(target = scratchRopeStart) {
  if (config.useSvgCharacter && svgPuppet.loaded && svgPuppet.parts.leftHand) {
    svgPuppet.parts.leftHand.group.getWorldPosition(target);
    target.z = state.player.z;
    return target;
  }
  playerRig.dots.grappleLight.getWorldPosition(target);
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
  spark.mesh.material.opacity = 0.9;
  spark.mesh.visible = true;
}

function maybeSpawnRopeSparks(dt, start, direction, distance) {
  if (state.paused || state.gameOver || distance <= 0.08) return;

  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  const pulseChance = dt * config.ropePulseChance * (state.grappled ? 1.5 : 1) * (1 + Math.min(speed, 22) / 36);
  if (Math.random() < pulseChance) {
    state.ropePulse = 1;
    state.ropeCrackle = config.ropeCrackleDuration;
    const count = config.ropeSparkBurstCount + Math.floor(Math.random() * 3);
    for (let index = 0; index < count; index += 1) {
      spawnRopeSpark(start, direction, distance, true);
    }
  } else if (Math.random() < dt * config.ropeCrackleChance) {
    state.ropeCrackle = config.ropeCrackleDuration * (0.65 + Math.random() * 0.7);
    spawnRopeSpark(start, direction, distance, false);
  } else if (Math.random() < dt * 2.2) {
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
  for (let index = 0; index < config.ropeCracklePoints; index += 1) {
    const amount = index / (config.ropeCracklePoints - 1);
    const edgeFade = Math.sin(amount * Math.PI);
    const jitter = (Math.random() - 0.5) * config.ropeCrackleJitter * edgeFade;
    const x = start.x + direction.x * distance * amount + scratchPerpDirection.x * jitter;
    const y = start.y + direction.y * distance * amount + scratchPerpDirection.y * jitter;
    positions.setXYZ(index, x, y, 0.42);
  }
  positions.needsUpdate = true;
  ropeCrackleLine.material.opacity = THREE.MathUtils.clamp(state.ropeCrackle / config.ropeCrackleDuration, 0, 1);
  ropeCrackleLine.visible = true;
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

function renderRope(dt) {
  if (!state.hookActive) {
    ropeLine.visible = false;
    ropeMesh.visible = false;
    ropeCrackleLine.visible = false;
    hookTip.visible = false;
    hookHead.visible = false;
    return;
  }

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

  ropeMesh.position.copy(midpoint);
  const ropePulse = 0.88 + state.ropePulse * 0.28 + Math.sin(performance.now() / 90) * 0.05;
  ropeMesh.material.opacity = THREE.MathUtils.clamp(ropePulse, 0.82, 1);
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

function updateHookWrap(dt, now) {
  if (!state.grappled || !state.anchor || state.hookWrapPulse <= 0) {
    hookWrap.visible = false;
    return;
  }

  state.hookWrapPulse = Math.max(0, state.hookWrapPulse - dt * 4.8);
  const progress = 1 - state.hookWrapPulse;
  hookWrap.position.copy(getVisualGrapplePoint(state.anchor));
  hookWrap.rotation.z = -progress * Math.PI * 2.3 + now * 0.8;
  hookWrap.scale.setScalar(0.45 + progress * 0.75);
  hookWrap.material.opacity = state.hookWrapPulse * 0.9;
  hookWrap.visible = state.hookWrapPulse > 0.02;
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

  for (const { line, seed } of speedLines) {
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

  for (let index = 0; index < trailLines.length; index += 1) {
    const line = trailLines[index];
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
  const targetZ = THREE.MathUtils.clamp(
    config.cameraBaseZoom + Math.max(0, speed - 8) * config.cameraSpeedZoom,
    config.cameraBaseZoom,
    config.cameraMaxZoom,
  );
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 1 - Math.pow(0.001, dt));
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 1 - Math.pow(0.004, dt));
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 1 - Math.pow(0.008, dt));
  camera.lookAt(camera.position.x, camera.position.y, 0);
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

function setLimbLine(limb, startX, startY, endX, endY, bend = 0.12) {
  const positions = limb.geometry.attributes.position;
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.max(Math.hypot(dx, dy), 0.001);
  const elbowX = startX + dx * 0.52 - (dy / length) * bend;
  const elbowY = startY + dy * 0.52 + (dx / length) * bend;
  positions.setXYZ(0, startX, startY, 0.08);
  positions.setXYZ(1, elbowX, elbowY, 0.08);
  positions.setXYZ(2, endX, endY, 0.08);
  positions.needsUpdate = true;
}

function getLimbPoint(limb, pointIndex, target) {
  const positions = limb.geometry.attributes.position;
  const index = pointIndex === 1 && positions.count > 2 ? 2 : pointIndex;
  target.set(positions.getX(index), positions.getY(index), positions.getZ(index));
  return target;
}

const playerRigScratchA = new THREE.Vector3();
const playerRigScratchB = new THREE.Vector3();
const playerRigScratchC = new THREE.Vector3();

function placeDotBetween(dot, start, end, amount, offsetX = 0, offsetY = 0) {
  dot.position.lerpVectors(start, end, amount);
  dot.position.x += offsetX;
  dot.position.y += offsetY;
}

function localBodyPointToWorld(x, y, rotation = 0, target = playerRigScratchC) {
  const scaledX = x * state.facing * characterSettings.scale;
  const scaledY = y * characterSettings.scale;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  target.set(
    state.player.x + scaledX * cos - scaledY * sin,
    state.player.y + scaledX * sin + scaledY * cos,
    0,
  );
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
    unrotatedX / (state.facing * characterSettings.scale),
    unrotatedY / characterSettings.scale,
  ];
}

function updateProceduralPlayerRig(now, dt, flourishFlip = 0) {
  const idleBreath = state.playerAnimation === "idleHang" ? Math.sin(now * 3.2) : 0;
  const quickPulse = Math.sin(now * 5.6);
  const breathY = idleBreath * 0.035;
  const breathX = idleBreath * 0.012;
  const torsoScale = characterSettings.torso;
  const headScale = characterSettings.head;

  playerRig.dots.torsoShadow.position.set(0.02 - breathX, 0.16 + breathY * 0.45, 0.09);
  playerRig.dots.torsoShadow.scale.set((0.34 + idleBreath * 0.012) * torsoScale, (0.42 - idleBreath * 0.01) * torsoScale, 1);
  playerRig.dots.torsoGold.position.set(0.08 + breathX, 0.35 + breathY, 0.14);
  playerRig.dots.torsoGold.scale.set((0.28 + idleBreath * 0.012) * torsoScale, (0.34 - idleBreath * 0.012) * torsoScale, 1);
  playerRig.dots.chestPlate.position.set(0.19 + breathX * 1.4, 0.49 + breathY * 1.2, 0.16);
  playerRig.dots.chestPlate.scale.set(0.18 * torsoScale, 0.18 * torsoScale, 1);
  playerRig.dots.waist.position.set(0.05 - breathX * 0.4, -0.15 + breathY * 0.15, 0.15);
  playerRig.dots.waist.scale.set(0.24 * torsoScale, 0.24 * torsoScale, 1);

  playerRig.dots.helmet.position.set(-0.03 + breathX * 0.35, 0.96 + breathY * 0.68, 0.2);
  playerRig.dots.helmet.scale.set(0.34 * headScale, 0.31 * headScale, 1);
  playerRig.dots.helmetBack.position.set(-0.17 + breathX * 0.2, 0.92 + breathY * 0.6, 0.17);
  playerRig.dots.helmetBack.scale.set(0.24 * headScale, 0.24 * headScale, 1);
  playerRig.dots.visor.position.set(0.14 + breathX * 0.25, 0.99 + breathY * 0.68, 0.22);
  playerRig.dots.visor.scale.set(0.15 * headScale, 0.08 * headScale, 1);
  playerRig.dots.helmetShine.position.set(-0.12 + breathX * 0.25, 1.09 + breathY * 0.68, 0.24);
  playerRig.dots.helmetShine.scale.set(0.07 * headScale, 0.1 * headScale, 1);
  playerRig.dots.scarfKnot.position.set(-0.24 + breathX, 0.86 + breathY * 0.8, 0.22);
  updateSvgPuppetRig();

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
    getSvgRibbonWorldAnchor(index, new THREE.Vector3())
      ?? localBodyPointToWorld(x, y, flourishFlip, new THREE.Vector3())
  ));
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  const stationaryRibbon = idleHang && speed < 0.08 && state.flourishSpinRemaining <= 0;
  for (const [ribbonIndex, ribbon] of ribbonPhysics.entries()) {
    const segmentLength = ribbon.segmentLength * characterSettings.ribbon;
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
  const topRibbon = ribbonPhysics[0].points.map((point) => worldPointToLocalBody(point, flourishFlip));
  const bottomRibbon = ribbonPhysics[1].points.map((point) => worldPointToLocalBody(point, flourishFlip));
  const shadowOffset = 0.035;
  setRibbonLine(playerRig.lines.scarfTopShadow, topRibbon.map(([x, y]) => [x + shadowOffset, y - shadowOffset]), 0.08);
  setRibbonLine(playerRig.lines.scarfBottomShadow, bottomRibbon.map(([x, y]) => [x + shadowOffset, y - shadowOffset]), 0.08);
  setRibbonLine(playerRig.lines.scarfTop, topRibbon, 0.18);
  setRibbonLine(playerRig.lines.scarfBottom, bottomRibbon, 0.17);
  playerRig.lines.scarfTop.visible = true;
  playerRig.lines.scarfBottom.visible = true;
  playerRig.lines.scarfTopShadow.visible = true;
  playerRig.lines.scarfBottomShadow.visible = true;

  setPlayerLine(playerRig.lines.ribA, -0.1, 0.27 + breathY * 0.6, 0.26, 0.2 + breathY * 0.2, 0.11);
  setPlayerLine(playerRig.lines.ribB, -0.09, 0.15 + breathY * 0.4, 0.24, 0.1 - breathY * 0.1, 0.11);

  const frontArmStart = getLimbPoint(playerLimbs.frontArm, 0, playerRigScratchA);
  const frontArmEnd = getLimbPoint(playerLimbs.frontArm, 1, playerRigScratchB);
  playerRig.dots.shoulderFront.position.set(frontArmStart.x + 0.03, frontArmStart.y + 0.03, 0.2);
  playerRig.dots.shoulderFront.scale.set(0.15 * characterSettings.limbs, 0.15 * characterSettings.limbs, 1);
  placeDotBetween(playerRig.dots.forearmGrapple, frontArmStart, frontArmEnd, 0.72, 0.04, -0.02);
  playerRig.dots.forearmGrapple.scale.set(0.12 * characterSettings.limbs, 0.12 * characterSettings.limbs, 1);
  placeDotBetween(playerRig.dots.grappleLight, frontArmStart, frontArmEnd, 0.75, 0.08, 0.01);
  playerRig.dots.frontHand.position.set(frontArmEnd.x, frontArmEnd.y, 0.23);
  playerRig.dots.frontHand.scale.set(0.09 * characterSettings.limbs, 0.09 * characterSettings.limbs, 1);

  const backArmStart = getLimbPoint(playerLimbs.backArm, 0, playerRigScratchA);
  const backArmEnd = getLimbPoint(playerLimbs.backArm, 1, playerRigScratchB);
  playerRig.dots.shoulderBack.position.set(backArmStart.x - 0.03, backArmStart.y, 0.11);
  playerRig.dots.shoulderBack.scale.set(0.13 * characterSettings.limbs, 0.13 * characterSettings.limbs, 1);
  playerRig.dots.backHand.position.set(backArmEnd.x, backArmEnd.y, 0.08);
  playerRig.dots.backHand.scale.set(0.08 * characterSettings.limbs, 0.08 * characterSettings.limbs, 1);

  const frontLegStart = getLimbPoint(playerLimbs.frontLeg, 0, playerRigScratchA);
  const frontLegEnd = getLimbPoint(playerLimbs.frontLeg, 1, playerRigScratchB);
  playerRig.dots.hipFront.position.set(frontLegStart.x + 0.04, frontLegStart.y - 0.08, 0.19);
  playerRig.dots.hipFront.scale.set(0.15 * characterSettings.limbs, 0.32 * characterSettings.limbs, 1);
  placeDotBetween(playerRig.dots.kneeFront, frontLegStart, frontLegEnd, 0.56, 0.02, 0.01);
  playerRig.dots.kneeFront.scale.set(0.12 * characterSettings.limbs, 0.26 * characterSettings.limbs, 1);
  playerRig.dots.footFront.position.set(frontLegEnd.x + 0.08, frontLegEnd.y - 0.02, 0.21);
  playerRig.dots.footFront.scale.set(0.2 * characterSettings.limbs, 0.07 * characterSettings.limbs, 1);

  const backLegStart = getLimbPoint(playerLimbs.backLeg, 0, playerRigScratchA);
  const backLegEnd = getLimbPoint(playerLimbs.backLeg, 1, playerRigScratchB);
  playerRig.dots.hipBack.position.set(backLegStart.x - 0.03, backLegStart.y - 0.08, 0.08);
  playerRig.dots.hipBack.scale.set(0.12 * characterSettings.limbs, 0.28 * characterSettings.limbs, 1);
  placeDotBetween(playerRig.dots.kneeBack, backLegStart, backLegEnd, 0.56, -0.02, 0);
  playerRig.dots.kneeBack.scale.set(0.1 * characterSettings.limbs, 0.22 * characterSettings.limbs, 1);
  playerRig.dots.footBack.position.set(backLegEnd.x - 0.08, backLegEnd.y - 0.02, 0.08);
  playerRig.dots.footBack.scale.set(0.17 * characterSettings.limbs, 0.06 * characterSettings.limbs, 1);
}

function updatePlayerLimbs(now, flourishProgress) {
  if (state.flourishSpinRemaining > 0) {
    const tuck = Math.sin(flourishProgress * Math.PI);
    const tightTuck = Math.pow(tuck, 0.72);
    const reach = 1 - tuck;
    setLimbLine(playerLimbs.backArm, -0.06, 0.62, -0.14 - tightTuck * 0.18, 0.12 + tightTuck * 0.42, -0.22);
    setLimbLine(playerLimbs.frontArm, 0.18, 0.58, 0.28 + reach * 0.24, 0.12 + tightTuck * 0.42, 0.22);
    setLimbLine(playerLimbs.backLeg, -0.02, -0.28, -0.12 - tightTuck * 0.22, -0.56 + tightTuck * 0.82, -0.2);
    setLimbLine(playerLimbs.frontLeg, 0.2, -0.26, 0.28 + reach * 0.26, -0.54 + tightTuck * 0.82, 0.2);
    return;
  }

  if (state.hookActive && (state.anchor || state.hookEnd)) {
    const ropeTarget = state.grappled && state.anchor ? getVisualGrapplePoint(state.anchor, scratchRopeEnd) : state.hookEnd;
    const ropeDirection = scratchVelocityDirection.subVectors(ropeTarget, state.player).normalize();
    const localRopeX = ropeDirection.x * state.facing;
    const localRopeY = ropeDirection.y;
    const shoulderX = 0.18;
    const shoulderY = 0.58;
    const reach = 0.92;
    const handX = shoulderX + localRopeX * reach;
    const handY = shoulderY + localRopeY * reach;
    const tensionBend = THREE.MathUtils.clamp(-localRopeY * 0.08, -0.06, 0.08);
    setLimbLine(playerLimbs.frontArm, shoulderX, shoulderY, handX, handY, tensionBend);

    const toPlayer = scratchPerpDirection.subVectors(state.player, ropeTarget).normalize();
    const downSwing = state.velocity.y < -0.7;
    const upSwing = state.velocity.y > 0.7;
    const localVelocityX = state.velocity.x * state.facing;
    const kick = THREE.MathUtils.clamp(localVelocityX / 16, -0.7, 0.9);
    const arcLift = THREE.MathUtils.clamp(state.velocity.y / 12, -0.75, 0.85);
    const legBias = downSwing ? -0.38 : upSwing ? 0.52 : toPlayer.x * 0.22;
    const backArmLift = THREE.MathUtils.clamp(-localRopeY * 0.18 + 0.12, -0.08, 0.36);
    setLimbLine(playerLimbs.backArm, -0.05, 0.62, -0.38 - backArmLift, 0.2 + backArmLift, -0.12);
    setLimbLine(
      playerLimbs.backLeg,
      -0.02,
      -0.28,
      -0.34 + legBias * 0.62 - kick * 0.2,
      -0.88 - arcLift * 0.18,
      -0.14,
    );
    setLimbLine(
      playerLimbs.frontLeg,
      0.2,
      -0.26,
      0.36 + legBias * 0.9 + kick * 0.18,
      -0.82 + arcLift * 0.28,
      0.16,
    );
    return;
  }

  const airborne = state.hasLaunched && !state.grounded && !state.gameOver && !state.finished;
  if (airborne) {
    const fallTuck = THREE.MathUtils.clamp(-state.velocity.y / 18, -0.25, 0.55);
    const glide = THREE.MathUtils.clamp(state.velocity.x / 18, -0.25, 0.45) * state.facing;
    setLimbLine(playerLimbs.backArm, -0.05, 0.62, -0.42 - glide * 0.12, 0.18 + fallTuck * 0.08, -0.1);
    setLimbLine(playerLimbs.frontArm, 0.18, 0.58, 0.52 + glide * 0.16, 0.2 + fallTuck * 0.12, 0.12);
    setLimbLine(playerLimbs.backLeg, -0.02, -0.28, -0.36 - glide * 0.08, -0.86 + fallTuck * 0.2, -0.1);
    setLimbLine(playerLimbs.frontLeg, 0.2, -0.26, 0.48 + glide * 0.1, -0.84 + fallTuck * 0.24, 0.12);
    return;
  }

  const idleDrift = Math.sin(now * 2.2) * 0.04;
  setLimbLine(playerLimbs.backArm, -0.05, 0.62, -0.42, 0.2 + idleDrift, -0.08);
  setLimbLine(playerLimbs.frontArm, 0.18, 0.58, 0.48, 0.18 - idleDrift, 0.08);
  setLimbLine(playerLimbs.backLeg, -0.02, -0.28, -0.34, -0.9, -0.08);
  setLimbLine(playerLimbs.frontLeg, 0.2, -0.26, 0.42, -0.9, 0.08);
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

function applyPlayerAnimation(now, flourishProgress, dt) {
  state.playerAnimation = resolvePlayerAnimationState();
  if (state.hasLaunched && !state.grappled && Math.abs(state.velocity.x) > 0.35) {
    state.facing = state.velocity.x >= 0 ? 1 : -1;
  }
  playerBody.scale.x = state.facing * characterSettings.scale;
  playerBody.scale.y = characterSettings.scale;
  let flourishFlip = 0;
  let twistRotation = 0;
  let flourishTuck = 0;
  if (flourishProgress > 0) {
    flourishTuck = Math.sin(flourishProgress * Math.PI);
    const easedFlip = THREE.MathUtils.smootherstep(flourishProgress, 0, 1);
    flourishFlip = easedFlip * Math.PI * 2 * state.flourishFlipDirection;
  }
  playerBody.rotation.z = flourishFlip;
  updatePlayerLimbs(now, flourishProgress);
  updateProceduralPlayerRig(now, dt, flourishFlip);
  let poseRotation = THREE.MathUtils.clamp(-state.velocity.x * 0.035, -0.5, 0.5);
  let squashX = 1;
  let squashY = 1;

  if (state.playerAnimation === "idleHang") {
    poseRotation = -0.08 + Math.sin(now * 4) * 0.025;
  } else if (state.playerAnimation === "jumpLaunch") {
    poseRotation = -0.32;
    squashX = 1.08;
    squashY = 0.92;
  } else if (state.playerAnimation === "throwHook") {
    poseRotation = -0.48;
    squashX = 1.12;
  } else if (state.playerAnimation === "downSwing") {
    poseRotation = THREE.MathUtils.clamp(-state.velocity.x * 0.03 - 0.28, -0.7, 0.2);
    squashY = 1.08;
  } else if (state.playerAnimation === "upSwing") {
    poseRotation = THREE.MathUtils.clamp(-state.velocity.x * 0.03 + 0.22, -0.2, 0.7);
    squashX = 1.05;
  } else if (state.playerAnimation === "barrelRoll") {
    squashX = 1.15;
    squashY = 0.86;
  } else if (state.playerAnimation === "falling") {
    poseRotation = 0.35;
  }

  if (flourishProgress > 0) {
    poseRotation += -0.14 * state.flourishFlipDirection * flourishTuck;
    squashX *= 0.92 - flourishTuck * 0.1;
    squashY *= 1.04 + flourishTuck * 0.12;
  }
  for (const line of [
    playerRig.lines.scarfTop,
    playerRig.lines.scarfBottom,
    playerRig.lines.scarfTopShadow,
    playerRig.lines.scarfBottomShadow,
  ]) {
    line.rotation.z = 0;
  }
  playerMesh.rotation.z = poseRotation;
  playerMesh.rotation.x = THREE.MathUtils.clamp(state.velocity.y * 0.025, -0.45, 0.45);
  playerMesh.rotation.y = twistRotation;
  playerMesh.scale.set(
    (1 + state.flourishPulse * 0.22 + Math.sin(flourishProgress * Math.PI) * 0.08) * squashX,
    (1 + state.flourishPulse * 0.22) * squashY,
    1,
  );

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
  const now = time / 1000;
  const frameDt = Math.min((time - last) / 1000, config.maxPhysicsFrame) * debugSettings.timeScale;
  last = time;

  if (state.draggedObject || state.paused) {
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
  state.flourishSpinRemaining = Math.max(0, state.flourishSpinRemaining - trickDt);
  state.stuntBurstPulse = Math.max(0, state.stuntBurstPulse - dt * 3.4);
  updateCrashExplosion(dt, now);
  playerMesh.position.copy(state.player);
  const flourishProgress =
    state.flourishSpinRemaining > 0
      ? 1 - state.flourishSpinRemaining / config.flourishSpinDuration
      : 0;
  applyPlayerAnimation(now, flourishProgress, dt);

  updateAimIndicator();
  updateTargetGlow(now);
  updateBuildRangeGuide();
  renderRope(dt);
  updateRopeSparks(dt);
  updateHookWrap(dt, now);
  updateJeremyFireworks(dt, now);
  updateCamera(dt);
  updateParallaxCity(dt, now);
  updateMotionTrail();
  updateSpeedLines(now);
  updateHud(now);
  renderer.render(scene, camera);
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
  if (event.code === "KeyP") setPaused(!state.paused);
});

window.addEventListener("keyup", (event) => {
  state.keys.delete(event.code);
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
buildZoomInput.addEventListener("input", () => setBuildZoom(buildZoomInput.value));
if (characterScaleInput) {
  characterScaleInput.addEventListener("input", () => updateCharacterSetting("scale", characterScaleInput.value));
  characterTorsoInput.addEventListener("input", () => updateCharacterSetting("torso", characterTorsoInput.value));
  characterHeadInput.addEventListener("input", () => updateCharacterSetting("head", characterHeadInput.value));
  characterLimbsInput.addEventListener("input", () => updateCharacterSetting("limbs", characterLimbsInput.value));
  characterRibbonInput.addEventListener("input", () => updateCharacterSetting("ribbon", characterRibbonInput.value));
  bindGameButton(characterEditorResetButton, resetCharacterSettings);
}
bindGameButton(nextLevelButton, () => reset({ resetLevelStats: true }));

resize();
loadCharacterSettings();
syncCharacterControls();
applyCharacterSettings();
loadSvgPuppet();
reset();
setPaused(false);
requestAnimationFrame(tick);
