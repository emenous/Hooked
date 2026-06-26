import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const scratchA = new THREE.Vector3();
const scratchB = new THREE.Vector3();
const scratchC = new THREE.Vector3();
const scratchD = new THREE.Vector3();

function clampUnit(value) {
  return THREE.MathUtils.clamp(value, -1, 1);
}

function smooth01(value, min = 0, max = 1) {
  return THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(value, min, max), min, max);
}

function signedAngleFromVector(vector) {
  return Math.atan2(vector.y, vector.x);
}

export function createCharacterController({
  state,
  config,
  glbCharacter,
  playerMesh,
  playerAssetRoot,
  limits,
  setPivotAngle,
  clampPoseAngle,
  clampAngle,
  getVisualGrapplePoint,
  getFlourishTuck,
  getRestScreenAngle,
  getLoadedLeftArmAimOffset,
  updateFreeArmSwingMemory,
}) {
  function pivot(key) {
    return glbCharacter.pivots[key] ?? null;
  }

  function pose(key, angle, immediate = false) {
    const node = pivot(key);
    if (!node) return 0;
    const clamped = clampPoseAngle(key, angle);
    setPivotAngle(node, clamped, immediate);
    return clamped;
  }

  function getRopeState(hooked) {
    if (!hooked) {
      return {
        target: null,
        worldDirection: scratchA.set(
          state.velocity.x || state.facing || 1,
          state.velocity.y || -1,
          0,
        ).normalize(),
        localDirection: scratchB.set(state.facing || 1, -0.2, 0).normalize(),
      };
    }

    const target = state.grappled && state.anchor
      ? getVisualGrapplePoint(state.anchor, scratchC)
      : scratchC.copy(state.hookEnd);
    let shoulderWorld = scratchD.copy(state.player);
    if (pivot("leftShoulder")) {
      playerMesh.updateWorldMatrix(true, true);
      pivot("leftShoulder").getWorldPosition(shoulderWorld);
    }

    const worldDirection = scratchA.subVectors(target, shoulderWorld);
    if (worldDirection.lengthSq() < 0.0001) {
      worldDirection.set(0.2 * (state.facing || 1), 0.98, 0);
    }
    worldDirection.normalize();

    const localTarget = scratchB.copy(target);
    const localShoulder = scratchD.copy(shoulderWorld);
    if (playerAssetRoot) {
      playerAssetRoot.worldToLocal(localTarget);
      playerAssetRoot.worldToLocal(localShoulder);
    }
    const localDirection = localTarget.sub(localShoulder);
    if (localDirection.lengthSq() < 0.0001) {
      localDirection.set(0.2, 0.98, 0);
    }
    localDirection.normalize();

    return { target, worldDirection, localDirection };
  }

  function applyTorso({ airborne, hooked, fall, rise, swing, ropeY, tuck }) {
    const fallCurl = airborne && !hooked ? THREE.MathUtils.smootherstep(fall, 0.12, 0.92) : 0;
    const ropeLift = hooked ? THREE.MathUtils.clamp(ropeY, -1, 1) : 0;
    const pelvis = clampAngle(
      THREE.MathUtils.lerp(swing * 0.08 + fall * 0.03, 0.18, tuck),
      limits.torso,
    );
    const waistWorld = clampAngle(
      THREE.MathUtils.lerp(swing * 0.22 + fall * 0.12 - rise * 0.04 + ropeLift * 0.04 - fallCurl * 0.16, -0.08, tuck),
      limits.torso,
    );
    const chestWorld = clampAngle(
      THREE.MathUtils.lerp(swing * 0.36 + fall * 0.22 - rise * 0.06 + ropeLift * 0.08 - fallCurl * 0.28, -0.18, tuck),
      limits.torso,
    );

    pose("root", 0);
    pose("pelvis", pelvis);
    pose("waist", clampAngle(waistWorld - pelvis, limits.torso));
    pose("chest", clampAngle(chestWorld - waistWorld, limits.torso));
    pose("neck", clampAngle(-chestWorld * 0.18 + fall * 0.04, limits.neck));
    pose("head", clampAngle(-chestWorld * 0.24, limits.neck));
    return { pelvis, waistWorld, chestWorld };
  }

  function applyArms({ hooked, ropeAngle, ropeX, chestWorld, swing, fall, rise, tuck }) {
    let leftShoulder = 0.02;
    let leftElbow = -0.03;
    let leftWrist = 0.02;
    let rightShoulder = clampAngle(-swing * 0.28 + fall * 0.06 - rise * 0.04, limits.shoulder);
    let rightElbow = clampAngle(-0.06 - Math.abs(swing) * 0.14 - fall * 0.08, limits.elbow);
    let rightWrist = clampAngle(-rightElbow * 0.18, limits.wrist);

    if (hooked) {
      const rest = getRestScreenAngle("leftShoulder", pivot("leftElbow"));
      leftShoulder = clampAngle(
        ropeAngle + getLoadedLeftArmAimOffset() - chestWorld - rest,
        limits.loadShoulder,
      );
      leftElbow = 0;
      leftWrist = 0;

      rightShoulder = clampAngle(-swing * 0.34 - ropeX * 0.12 + fall * 0.04, limits.shoulder);
      rightElbow = clampAngle(-0.08 - Math.abs(swing) * 0.16, limits.elbow);
      rightWrist = clampAngle(-rightElbow * 0.18, limits.wrist);
    }

    if (tuck > 0) {
      leftShoulder = THREE.MathUtils.lerp(leftShoulder, 0.3, tuck);
      leftElbow = THREE.MathUtils.lerp(leftElbow, -0.58, tuck);
      leftWrist = THREE.MathUtils.lerp(leftWrist, 0.08, tuck);
      rightShoulder = THREE.MathUtils.lerp(rightShoulder, -0.3, tuck);
      rightElbow = THREE.MathUtils.lerp(rightElbow, -0.58, tuck);
      rightWrist = THREE.MathUtils.lerp(rightWrist, -0.08, tuck);
    }

    pose("leftShoulder", leftShoulder, hooked);
    pose("leftElbow", leftElbow, hooked);
    pose("leftWrist", leftWrist, hooked);
    pose("rightShoulder", rightShoulder);
    pose("rightElbow", rightElbow);
    pose("rightWrist", rightWrist);
  }

  function applyLegs({ hooked, airborne, swing, fall, rise, speed, tuck, dt }) {
    const bottomLoad = hooked
      ? THREE.MathUtils.smoothstep(fall + Math.abs(swing) * 0.35, 0.1, 0.9)
      : THREE.MathUtils.smoothstep(fall, 0.08, 0.92);
    const apexDangle = hooked
      ? THREE.MathUtils.smoothstep(rise, 0.18, 0.8) * (1 - Math.abs(swing) * 0.5)
      : THREE.MathUtils.smoothstep(rise, 0.1, 0.7) * (1 - speed * 0.35);
    const split = THREE.MathUtils.clamp(swing * 0.12, -0.18, 0.18);

    let leftHip = -0.04 + split - bottomLoad * 0.16 + fall * 0.02;
    let rightHip = -0.1 - split * 0.7 - bottomLoad * 0.24 + fall * 0.1;
    let leftKnee = 0.06 + bottomLoad * 0.62 + fall * 0.18;
    let rightKnee = -(0.06 + bottomLoad * 0.72 + fall * 0.12);
    let leftAnkle = -0.02;
    let rightAnkle = 0.02;

    if (apexDangle > 0) {
      leftHip = THREE.MathUtils.lerp(leftHip, 0.02 + split * 0.3, apexDangle);
      rightHip = THREE.MathUtils.lerp(rightHip, -0.03 - split * 0.3, apexDangle);
      leftKnee = THREE.MathUtils.lerp(leftKnee, 0.08, apexDangle);
      rightKnee = THREE.MathUtils.lerp(rightKnee, -0.07, apexDangle);
    }

    if (tuck > 0) {
      leftHip = THREE.MathUtils.lerp(leftHip, 1.08, tuck);
      rightHip = THREE.MathUtils.lerp(rightHip, 1.02, tuck);
      leftKnee = THREE.MathUtils.lerp(leftKnee, 1.28, tuck);
      rightKnee = THREE.MathUtils.lerp(rightKnee, -1.28, tuck);
      leftAnkle = THREE.MathUtils.lerp(leftAnkle, -0.44, tuck);
      rightAnkle = THREE.MathUtils.lerp(rightAnkle, -0.44, tuck);
    }

    const localVelocityX = state.velocity.x * (state.facing || 1);
    const wind = THREE.MathUtils.clamp(
      Math.hypot(localVelocityX, state.velocity.y * 0.35) / 18,
      0,
      1,
    ) * (1 - THREE.MathUtils.smootherstep(tuck, 0.15, 0.9));
    const footClockwise = THREE.MathUtils.degToRad(75) * THREE.MathUtils.smootherstep(wind, 0, 1);
    leftAnkle -= footClockwise;
    rightAnkle -= footClockwise;

    pose("leftHip", leftHip);
    pose("rightHip", rightHip);
    pose("leftKnee", leftKnee);
    pose("rightKnee", rightKnee);
    pose("leftAnkle", leftAnkle);
    pose("rightAnkle", rightAnkle);
  }

  function apply(now, dt = config.physicsStep) {
    const speed = Math.hypot(state.velocity.x, state.velocity.y);
    const localVelocityX = state.velocity.x * (state.facing || 1);
    const airborne = state.hasLaunched && !state.grounded && !state.gameOver && !state.finished;
    const hooked = state.hookActive && (state.anchor || state.hookEnd);
    const fall = THREE.MathUtils.clamp(-state.velocity.y / 18, 0, 1);
    const rise = THREE.MathUtils.clamp(state.velocity.y / 18, 0, 1);
    const speedAmount = THREE.MathUtils.clamp(speed / 28, 0, 1);
    const tuck = state.flourishSpinRemaining > 0
      ? THREE.MathUtils.smootherstep(getFlourishTuck(), 0, 1)
      : 0;
    const rope = getRopeState(hooked);
    const ropeX = rope.localDirection.x;
    const ropeY = rope.localDirection.y;
    const tangentSpeed = hooked
      ? state.velocity.x * -rope.worldDirection.y + state.velocity.y * rope.worldDirection.x
      : localVelocityX;
    const swing = updateFreeArmSwingMemory(clampUnit(tangentSpeed / (hooked ? 20 : 22)), dt);
    const idle = !airborne && !hooked;
    const idleBreath = idle ? Math.sin(now * 3.2) : 0;

    if (idle) {
      updateFreeArmSwingMemory(0, dt);
      pose("root", 0);
      pose("pelvis", 0);
      pose("waist", idleBreath * 0.012);
      pose("chest", idleBreath * 0.018);
      pose("neck", -idleBreath * 0.004);
      pose("head", -idleBreath * 0.006);
      pose("leftShoulder", 0);
      pose("leftElbow", 0);
      pose("leftWrist", 0);
      pose("rightShoulder", 0);
      pose("rightElbow", 0);
      pose("rightWrist", 0);
      pose("leftHip", 0);
      pose("leftKnee", 0);
      pose("leftAnkle", 0);
      pose("rightHip", 0);
      pose("rightKnee", 0);
      pose("rightAnkle", 0);
      return;
    }

    const torso = applyTorso({ airborne, hooked, fall, rise, swing, ropeY, tuck });
    applyArms({
      hooked,
      ropeAngle: signedAngleFromVector(rope.localDirection),
      ropeX,
      chestWorld: torso.chestWorld,
      swing,
      fall,
      rise,
      tuck,
    });
    applyLegs({ hooked, airborne, swing, fall, rise, speed: speedAmount, tuck, dt });
  }

  return { apply };
}
