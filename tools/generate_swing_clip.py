import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RIG_PATH = ROOT / "data" / "m-rig.json"


def rotate_point(point, pivot, degrees):
    radians = math.radians(degrees)
    cos_a = math.cos(radians)
    sin_a = math.sin(radians)
    rel_x = point["x"] - pivot["x"]
    rel_y = point["y"] - pivot["y"]
    return {
        "x": pivot["x"] + rel_x * cos_a - rel_y * sin_a,
        "y": pivot["y"] + rel_x * sin_a + rel_y * cos_a,
    }


def rounded_pose(pose):
    next_pose = {}
    for key, values in pose.items():
        next_pose[key] = {
            "x": round(values["x"]),
            "y": round(values["y"]),
            "scale": round(values["scale"], 4),
            "rotation": round(values["rotation"], 2),
        }
    return next_pose


data = json.loads(RIG_PATH.read_text(encoding="utf-8"))
base = data["animations"].get("m_mid_swing", data["parts"])

# The current rig's left grapple forearm is the best available stand-in for the
# wrist/rope center until exact runtime joint export lands.
pivot = {
    "x": base["leftLowerArm"]["x"] + 4,
    "y": base["leftLowerArm"]["y"] - 6,
}

frames = [
    ("start_swinging_01", -28, -0.55, -0.20),
    ("start_swinging_02", -22, -0.35, -0.10),
    ("start_swinging_03", -13, -0.10, 0.05),
    ("start_swinging_04", -3, 0.10, 0.18),
    ("start_swinging_05", 9, 0.32, 0.28),
    ("start_swinging_06", 20, 0.55, 0.32),
    ("start_swinging_07", 27, 0.70, 0.20),
    ("start_swinging_08", 20, 0.50, -0.05),
    ("start_swinging_09", 8, 0.20, -0.22),
    ("start_swinging_10", -8, -0.12, -0.18),
]

body_parts = {
    "head",
    "rightUpperArm",
    "rightLowerArm",
    "rightHand",
    "rightUpperLeg",
    "rightLowerLeg",
    "rightFoot",
    "torsoUpper",
    "torsoLower",
    "leftUpperLeg",
    "leftLowerLeg",
    "leftFoot",
}

for frame_name, body_angle, swing_phase, recoil in frames:
    pose = json.loads(json.dumps(base))

    for key in body_parts:
      rotated = rotate_point(base[key], pivot, body_angle)
      pose[key]["x"] = rotated["x"]
      pose[key]["y"] = rotated["y"]
      pose[key]["rotation"] = base[key]["rotation"] + body_angle

    # Keep the grapple forearm/hand closer to the rope contact so the rest of
    # the body appears to swing around that point.
    pose["leftLowerArm"]["x"] = base["leftLowerArm"]["x"] + recoil * 6
    pose["leftLowerArm"]["y"] = base["leftLowerArm"]["y"] + recoil * 4
    pose["leftLowerArm"]["rotation"] = base["leftLowerArm"]["rotation"] + body_angle * 0.18
    pose["leftHand"]["x"] = base["leftHand"]["x"] + recoil * 8
    pose["leftHand"]["y"] = base["leftHand"]["y"] + recoil * 6
    pose["leftHand"]["rotation"] = base["leftHand"]["rotation"] + body_angle * 0.12
    pose["leftUpperArm"]["rotation"] = base["leftUpperArm"]["rotation"] + body_angle * 0.55

    # Secondary motion: legs trail on the downswing and kick through on the
    # upswing. The right/free arm counters for a more fluid silhouette.
    pose["rightUpperLeg"]["rotation"] += swing_phase * 18
    pose["rightLowerLeg"]["rotation"] += swing_phase * 24
    pose["rightFoot"]["rotation"] += swing_phase * 28
    pose["leftUpperLeg"]["rotation"] += swing_phase * 12
    pose["leftLowerLeg"]["rotation"] += swing_phase * 18
    pose["leftFoot"]["rotation"] += swing_phase * 22
    pose["rightUpperArm"]["rotation"] -= swing_phase * 20
    pose["rightLowerArm"]["rotation"] -= swing_phase * 26
    pose["rightHand"]["rotation"] -= swing_phase * 18
    pose["head"]["rotation"] += recoil * 8

    data["animations"][frame_name] = rounded_pose(pose)

data.setdefault("clips", {})["start_swinging"] = {
    "label": "Start Swinging",
    "fps": 12,
    "loop": True,
    "easing": "smoothstep",
    "frames": [name for name, *_ in frames],
}

RIG_PATH.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
