import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const scratchA = new THREE.Vector3();
const scratchB = new THREE.Vector3();
const scratchC = new THREE.Vector3();
const scratchD = new THREE.Vector3();
const scratchE = new THREE.Vector3();
const scratchF = new THREE.Vector3();
const scratchG = new THREE.Vector3();
const scratchH = new THREE.Vector3();
const scratchI = new THREE.Vector3();

const DEG = THREE.MathUtils.DEG2RAD;

const defaultPoseTuning = {
  idle: {
    waistBreath: 0.012,
    chestBreath: 0.018,
    neckCounter: -0.004,
    headCounter: -0.006,
    shoulderRest: 0,
    elbowRest: 0,
    wristRest: 0,
    hipRest: 0,
    kneeRest: 0,
    ankleRest: 0,
  },
  torso: {
    pelvisSwing: 0.08,
    pelvisFall: 0.03,
    waistSwing: 0.22,
    waistFall: 0.12,
    waistRise: -0.04,
    waistRopeLift: 0.04,
    waistFallCurl: -0.16,
    chestSwing: 0.36,
    chestFall: 0.22,
    chestRise: -0.06,
    chestRopeLift: 0.08,
    chestFallCurl: -0.28,
    neckCounter: -0.18,
    neckFall: 0.04,
    headCounter: -0.24,
  },
  grappleArm: {
    shoulderOffset: 0,
    elbowBend: 0,
    wristBend: 0,
    tuckShoulder: 0.92,
    tuckElbow: 2.094,
    tuckWrist: 0.18,
  },
  freeArm: {
    shoulderIdle: 0,
    elbowIdle: -0.06,
    wristFollow: -0.18,
    swingTrail: -0.473,
    fallLift: 0.06,
    riseDrop: -0.04,
    hookedSwingTrail: -0.575,
    hookedRopeCounter: -0.156,
    hookedFallLift: 0.04,
    bendFromSwing: -0.27,
    bendFromFall: -0.08,
    tuckShoulder: 0.92,
    tuckElbow: 2.094,
    tuckWrist: 0.18,
  },
  legs: {
    splitAmount: 0.12,
    splitLimit: 0.18,
    leftHipRest: -0.04,
    rightHipRest: -0.1,
    leftHipBottomLoad: -0.16,
    rightHipBottomLoad: -0.24,
    leftHipFall: 0.02,
    rightHipFall: 0.1,
    leftKneeRest: 0.06,
    rightKneeRest: -0.06,
    leftKneeBottomLoad: 0.62,
    rightKneeBottomLoad: -0.72,
    leftKneeFall: 0.18,
    rightKneeFall: -0.12,
    leftAnkleRest: -0.02,
    rightAnkleRest: 0.02,
    apexLeftHip: 0.02,
    apexRightHip: -0.03,
    apexLeftKnee: 0.08,
    apexRightKnee: -0.07,
    tuckLeftHip: 1.3,
    tuckRightHip: 1.22,
    tuckLeftKnee: 1.35,
    tuckRightKnee: -1.35,
    tuckLeftAnkle: -0.18,
    tuckRightAnkle: -0.18,
    footWindDegrees: 75,
    leftFacingLeftHipLead: 0.28,
    leftFacingLeftKneeLead: 0.44,
    leftFacingLeftAnkleLead: -0.16,
  },
};

function clampUnit(value) {
  return THREE.MathUtils.clamp(value, -1, 1);
}

function smooth01(value, min = 0, max = 1) {
  return THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(value, min, max), min, max);
}

function signedAngleFromVector(vector) {
  return Math.atan2(vector.y, vector.x);
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
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

  function pose(key, angle, immediate = false, calibrationChild = null) {
    const node = pivot(key);
    if (!node) return 0;
    const clamped = clampPoseAngle(key, angle);
    setPivotAngle(node, clamped, immediate, calibrationChild);
    return clamped;
  }

  function currentPoseAngle(key) {
    const node = pivot(key);
    return node ? (glbCharacter.currentAngles.get(node) ?? 0) : 0;
  }

  function screenAngle(from, to) {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }

  function screenDistance(from, to) {
    return Math.hypot(to.x - from.x, to.y - from.y);
  }

  function solveLeftGrappleArmIk(ropeTarget) {
    const shoulder = pivot("leftShoulder");
    const elbow = pivot("leftElbow");
    const wrist = pivot("leftWrist");
    const wristAnchor = glbCharacter.leftWristAnchor ?? wrist;
    if (!ropeTarget || !shoulder || !elbow || !wrist || !wristAnchor) return;

    pose("leftWrist", 0, true);

    for (let iteration = 0; iteration < 16; iteration += 1) {
      playerMesh.updateWorldMatrix(true, true);
      playerAssetRoot?.updateWorldMatrix(true, true);
      shoulder.getWorldPosition(scratchE);
      const ropeDirection = scratchI.subVectors(ropeTarget, scratchE);
      if (ropeDirection.lengthSq() < 0.0001) return;
      ropeDirection.normalize();
      const ropeLineAngle = screenAngle(scratchE, scratchD.copy(scratchE).add(ropeDirection));

      for (const [key, child] of [
        ["leftShoulder", wristAnchor],
        ["leftElbow", wristAnchor],
        ["leftWrist", wristAnchor],
      ]) {
        const joint = pivot(key);
        if (!joint) continue;
        joint.getWorldPosition(scratchA);
        child.getWorldPosition(scratchB);
        const current = screenAngle(scratchA, scratchB);
        const delta = normalizeAngle(ropeLineAngle - current);
        pose(key, currentPoseAngle(key) + delta, true, child);
        playerMesh.updateWorldMatrix(true, true);
        playerAssetRoot?.updateWorldMatrix(true, true);
      }
    }
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

  function getAlignedTwoBoneAngles({
    upperKey,
    lowerKey,
    endPivot,
    targetAngle,
    parentWorldAngle,
    jointBend,
    upperLimit,
    lowerLimit,
  }) {
    const upperPivot = pivot(upperKey);
    const lowerPivot = pivot(lowerKey);
    if (!upperPivot || !lowerPivot || !endPivot) {
      return { upper: 0, lower: 0 };
    }

    const upperRest = getRestScreenAngle(upperKey, lowerPivot);
    const lowerRest = getRestScreenAngle(lowerKey, endPivot);
    const upper = clampAngle(targetAngle - parentWorldAngle - upperRest, upperLimit);
    const upperWorld = parentWorldAngle + upperRest + upper;
    const lower = clampAngle(targetAngle + jointBend - upperWorld - lowerRest, lowerLimit);
    return { upper, lower };
  }

  function applyTorso({ airborne, hooked, fall, rise, swing, ropeY, tuck }) {
    const tuning = defaultPoseTuning.torso;
    const fallCurl = airborne && !hooked ? THREE.MathUtils.smootherstep(fall, 0.12, 0.92) : 0;
    const ropeLift = hooked ? THREE.MathUtils.clamp(ropeY, -1, 1) : 0;
    const rightFacingClockwiseCounter = hooked && state.facing > 0 && swing > 0.05
      ? THREE.MathUtils.smootherstep(Math.abs(swing), 0.08, 0.85) *
        (config.rightFacingClockwiseLegCounterDegrees ?? 60) *
        DEG
      : 0;
    const pelvis = clampAngle(
      THREE.MathUtils.lerp(swing * tuning.pelvisSwing + fall * tuning.pelvisFall, 0.28, tuck),
      limits.torso,
    );
    const waistWorld = clampAngle(
      THREE.MathUtils.lerp(
        swing * tuning.waistSwing +
          fall * tuning.waistFall +
          rise * tuning.waistRise +
          ropeLift * tuning.waistRopeLift +
          fallCurl * tuning.waistFallCurl +
          rightFacingClockwiseCounter * 0.35,
        -0.18,
        tuck,
      ),
      limits.torso,
    );
    const chestWorld = clampAngle(
      THREE.MathUtils.lerp(
        swing * tuning.chestSwing +
          fall * tuning.chestFall +
          rise * tuning.chestRise +
          ropeLift * tuning.chestRopeLift +
          fallCurl * tuning.chestFallCurl +
          rightFacingClockwiseCounter * 0.18,
        -0.32,
        tuck,
      ),
      limits.torso,
    );

    pose("root", 0);
    pose("pelvis", pelvis);
    pose("waist", clampAngle(waistWorld - pelvis, limits.torso));
    pose("chest", clampAngle(chestWorld - waistWorld, limits.torso));
    pose("neck", clampAngle(chestWorld * tuning.neckCounter + fall * tuning.neckFall, limits.neck));
    pose("head", clampAngle(chestWorld * tuning.headCounter, limits.neck));
    return { pelvis, waistWorld, chestWorld };
  }

  function applyArms({ airborne, hooked, ropeTarget, ropeAngle, ropeX, chestWorld, swing, fall, rise, tuck }) {
    const grappleArm = defaultPoseTuning.grappleArm;
    const freeArm = defaultPoseTuning.freeArm;
    const idle = defaultPoseTuning.idle;
    let leftShoulder = idle.shoulderRest + 0.02;
    let leftElbow = idle.elbowRest - 0.03;
    let leftWrist = idle.wristRest + 0.02;
    let rightShoulder = clampAngle(
      freeArm.shoulderIdle + swing * freeArm.swingTrail + fall * freeArm.fallLift + rise * freeArm.riseDrop,
      limits.shoulder,
    );
    let rightElbow = clampAngle(
      freeArm.elbowIdle + Math.abs(swing) * freeArm.bendFromSwing * 0.875 + fall * freeArm.bendFromFall,
      limits.elbow,
    );
    let rightWrist = clampAngle(rightElbow * freeArm.wristFollow, limits.wrist);

    if (hooked) {
      const wristAnchor = glbCharacter.leftWristAnchor ?? pivot("leftWrist");
      const directRopeAngle = ropeAngle + grappleArm.shoulderOffset;
      const alignedLeftArm = getAlignedTwoBoneAngles({
        upperKey: "leftShoulder",
        lowerKey: "leftElbow",
        endPivot: wristAnchor,
        targetAngle: directRopeAngle,
        parentWorldAngle: chestWorld,
        jointBend: grappleArm.elbowBend,
        upperLimit: limits.loadShoulder,
        lowerLimit: limits.loadElbow ?? limits.elbow,
      });
      leftShoulder = alignedLeftArm.upper;
      leftElbow = alignedLeftArm.lower;
      leftWrist = clampAngle(grappleArm.wristBend, limits.wrist);

      rightShoulder = clampAngle(
        swing * freeArm.hookedSwingTrail + ropeX * freeArm.hookedRopeCounter + fall * freeArm.hookedFallLift,
        limits.shoulder,
      );
      rightElbow = clampAngle(freeArm.elbowIdle - 0.02 + Math.abs(swing) * freeArm.bendFromSwing, limits.elbow);
      rightWrist = clampAngle(rightElbow * freeArm.wristFollow, limits.wrist);
    }

    if (!hooked && airborne && state.facing > 0) {
      const loose = THREE.MathUtils.smootherstep(
        THREE.MathUtils.clamp(Math.hypot(state.velocity.x, state.velocity.y) / 18, 0, 1),
        0,
        1,
      );
      const shoulderTarget = 158 * DEG;
      const elbowTarget = 20 * DEG;
      leftShoulder = THREE.MathUtils.lerp(leftShoulder, shoulderTarget, loose);
      rightShoulder = THREE.MathUtils.lerp(rightShoulder, shoulderTarget, loose);
      leftElbow = THREE.MathUtils.lerp(leftElbow, elbowTarget, loose);
      rightElbow = THREE.MathUtils.lerp(rightElbow, elbowTarget, loose);
      leftWrist = THREE.MathUtils.lerp(leftWrist, elbowTarget * 0.5, loose);
      rightWrist = THREE.MathUtils.lerp(rightWrist, elbowTarget * 0.5, loose);
    }

    if (tuck > 0) {
      leftShoulder = THREE.MathUtils.lerp(leftShoulder, grappleArm.tuckShoulder, tuck);
      leftElbow = THREE.MathUtils.lerp(leftElbow, grappleArm.tuckElbow, tuck);
      leftWrist = THREE.MathUtils.lerp(leftWrist, grappleArm.tuckWrist, tuck);
      rightShoulder = THREE.MathUtils.lerp(rightShoulder, freeArm.tuckShoulder, tuck);
      rightElbow = THREE.MathUtils.lerp(rightElbow, freeArm.tuckElbow, tuck);
      rightWrist = THREE.MathUtils.lerp(rightWrist, freeArm.tuckWrist, tuck);
    }

    pose("leftShoulder", leftShoulder, hooked);
    pose("leftElbow", leftElbow, hooked);
    pose("leftWrist", leftWrist, hooked);
    if (hooked && tuck < 0.05) solveLeftGrappleArmIk(ropeTarget);
    pose("rightShoulder", rightShoulder);
    pose("rightElbow", rightElbow);
    pose("rightWrist", rightWrist);
  }

  function applyLegs({ hooked, airborne, swing, fall, rise, speed, tuck, dt }) {
    const tuning = defaultPoseTuning.legs;
    const bottomLoad = hooked
      ? THREE.MathUtils.smoothstep(fall + Math.abs(swing) * 0.35, 0.1, 0.9)
      : THREE.MathUtils.smoothstep(fall, 0.08, 0.92);
    const apexDangle = hooked
      ? THREE.MathUtils.smoothstep(rise, 0.18, 0.8) * (1 - Math.abs(swing) * 0.5)
      : THREE.MathUtils.smoothstep(rise, 0.1, 0.7) * (1 - speed * 0.35);
    const split = THREE.MathUtils.clamp(swing * tuning.splitAmount, -tuning.splitLimit, tuning.splitLimit);

    let leftHip = tuning.leftHipRest + split + bottomLoad * tuning.leftHipBottomLoad + fall * tuning.leftHipFall;
    let rightHip = tuning.rightHipRest - split * 0.7 + bottomLoad * tuning.rightHipBottomLoad + fall * tuning.rightHipFall;
    let leftKnee = tuning.leftKneeRest + bottomLoad * tuning.leftKneeBottomLoad + fall * tuning.leftKneeFall;
    let rightKnee = tuning.rightKneeRest + bottomLoad * tuning.rightKneeBottomLoad + fall * tuning.rightKneeFall;
    let leftAnkle = tuning.leftAnkleRest;
    let rightAnkle = tuning.rightAnkleRest;

    const leftFacingLeftSwing = hooked && state.facing < 0 && state.velocity.x < -0.35
      ? THREE.MathUtils.smootherstep(
          THREE.MathUtils.clamp(Math.abs(state.velocity.x) / 20 + Math.abs(swing) * 0.22, 0, 1),
          0.08,
          0.86,
        ) * (config.leftFacingLeftLegMotionScale ?? 0.42)
      : 0;
    if (leftFacingLeftSwing > 0) {
      leftHip += leftFacingLeftSwing * tuning.leftFacingLeftHipLead;
      rightHip += leftFacingLeftSwing * tuning.leftFacingLeftHipLead * 0.58;
      leftKnee += leftFacingLeftSwing * tuning.leftFacingLeftKneeLead;
      rightKnee += leftFacingLeftSwing * tuning.leftFacingLeftKneeLead * 0.42;
      leftAnkle += leftFacingLeftSwing * tuning.leftFacingLeftAnkleLead;
      rightAnkle += leftFacingLeftSwing * tuning.leftFacingLeftAnkleLead * 0.72;
    }

    const rightFacingClockwiseSwing = hooked && state.facing > 0 && swing > 0.05
      ? THREE.MathUtils.smootherstep(Math.abs(swing), 0.08, 0.85)
      : 0;
    if (rightFacingClockwiseSwing > 0) {
      const counter = rightFacingClockwiseSwing * (config.rightFacingClockwiseLegCounterDegrees ?? 60) * DEG;
      leftHip += counter;
      rightHip += counter * 0.84;
      leftKnee += counter * 0.16;
      rightKnee += counter * 0.12;
    }

    if (!hooked && airborne && state.facing > 0) {
      const freefall = THREE.MathUtils.smootherstep(
        THREE.MathUtils.clamp(Math.hypot(state.velocity.x, state.velocity.y) / 18, 0, 1),
        0,
        1,
      );
      const kneeClockwise = 20 * DEG * freefall;
      leftKnee -= kneeClockwise;
      rightKnee -= kneeClockwise;
    }

    if (apexDangle > 0) {
      leftHip = THREE.MathUtils.lerp(leftHip, tuning.apexLeftHip + split * 0.3, apexDangle);
      rightHip = THREE.MathUtils.lerp(rightHip, tuning.apexRightHip - split * 0.3, apexDangle);
      leftKnee = THREE.MathUtils.lerp(leftKnee, tuning.apexLeftKnee, apexDangle);
      rightKnee = THREE.MathUtils.lerp(rightKnee, tuning.apexRightKnee, apexDangle);
    }

    if (tuck > 0) {
      leftHip = THREE.MathUtils.lerp(leftHip, tuning.tuckLeftHip, tuck);
      rightHip = THREE.MathUtils.lerp(rightHip, tuning.tuckRightHip, tuck);
      leftKnee = THREE.MathUtils.lerp(leftKnee, tuning.tuckLeftKnee, tuck);
      rightKnee = THREE.MathUtils.lerp(rightKnee, tuning.tuckRightKnee, tuck);
      leftAnkle = THREE.MathUtils.lerp(leftAnkle, tuning.tuckLeftAnkle, tuck);
      rightAnkle = THREE.MathUtils.lerp(rightAnkle, tuning.tuckRightAnkle, tuck);
    }

    const localVelocityX = state.velocity.x * (state.facing || 1);
    const wind = THREE.MathUtils.clamp(
      Math.hypot(localVelocityX, state.velocity.y * 0.35) / 18,
      0,
      1,
    ) * (1 - THREE.MathUtils.smootherstep(tuck, 0.15, 0.9));
    const footClockwise = tuning.footWindDegrees * DEG * THREE.MathUtils.smootherstep(wind, 0, 1);
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
    const rawTuck = state.flourishSpinRemaining > 0 ? getFlourishTuck() : 0;
    const tuck = rawTuck > 0 ? THREE.MathUtils.clamp(Math.pow(rawTuck, 0.58), 0, 1) : 0;
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
      const idleTuning = defaultPoseTuning.idle;
      updateFreeArmSwingMemory(0, dt);
      pose("root", 0);
      pose("pelvis", 0);
      pose("waist", idleBreath * idleTuning.waistBreath);
      pose("chest", idleBreath * idleTuning.chestBreath);
      pose("neck", idleBreath * idleTuning.neckCounter);
      pose("head", idleBreath * idleTuning.headCounter);
      pose("leftShoulder", idleTuning.shoulderRest);
      pose("leftElbow", idleTuning.elbowRest);
      pose("leftWrist", idleTuning.wristRest);
      pose("rightShoulder", idleTuning.shoulderRest);
      pose("rightElbow", idleTuning.elbowRest);
      pose("rightWrist", idleTuning.wristRest);
      pose("leftHip", idleTuning.hipRest);
      pose("leftKnee", idleTuning.kneeRest);
      pose("leftAnkle", idleTuning.ankleRest);
      pose("rightHip", idleTuning.hipRest);
      pose("rightKnee", idleTuning.kneeRest);
      pose("rightAnkle", idleTuning.ankleRest);
      return;
    }

    const torso = applyTorso({ airborne, hooked, fall, rise, swing, ropeY, tuck });
    applyArms({
      airborne,
      hooked,
      ropeTarget: rope.target,
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
