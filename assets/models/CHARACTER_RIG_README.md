# Sling Character Rig

## Current Runtime Asset

The game should load:

`assets/models/m_character_skeletal.glb`

This file contains the real glTF skeleton/skin. The older `m_character.glb` is only a rigid pivot hierarchy and is not suitable for imported animation clips.

## Source Files

- Manual pivot/part adjustments belong in:
  `assets/models/hyper3d-new/sling_hyper3d_new_rig_prep_pivots_fixed.blend`
- Generated skeletal Blender file:
  `assets/models/hyper3d-new/sling_hyper3d_new_skeletal.blend`
- Generated game-ready Blender file:
  `assets/models/hyper3d-new/sling_hyper3d_new_game_ready.blend` (local byproduct, ignored by Git)
- Generated skeletal GLB:
  `assets/models/m_character_skeletal.glb`

The editable file may use a Blender-friendly view orientation. The runtime GLB must always be baked into game axes:

- X = screen left/right
- Y = up/down
- Z = depth
- side profile faces screen-right

If a shoulder, knee, wrist, ankle, or ribbon anchor is wrong, fix it in `sling_hyper3d_new_skeletal.blend`, then bake a game-ready export.

## Export

Run:

```bash
node tools/export_game_ready_skeletal_character.js
```

The exporter creates:

- A 20-joint armature.
- Rigid skin weights for each mechanical body part.
- `left_wrist_anchor` for the grapple hand.
- `ribbon_anchor` on the back/head area.
- A diagnostic animation clip named `Sling_rig_test`.
- A game-ready GLB whose mesh height is on the Y axis.

## Audit

Run:

```bash
node tools/audit_character_skeleton.js assets/models/m_character_skeletal.glb
```

Expected result:

- `ok: true`
- 1 skin
- 20 joints
- 19 skinned mesh nodes
- all primitives have `JOINTS_0` and `WEIGHTS_0`
- at least one diagnostic animation clip
- `meshPositionSpan.y` is the tallest axis

## Imported Animation Notes

This is an animation-capable skeleton, but it is not a direct Mixamo/Unity humanoid skeleton yet. Imported premade animations will need a retarget map from their source bone names to this rig:

- `M_root`
- `pelvis_pivot`
- `waist_pivot`
- `chest_pivot`
- `neck_pivot`
- `head_pivot`
- `left_shoulder_pivot`
- `left_elbow_pivot`
- `left_wrist_pivot`
- `right_shoulder_pivot`
- `right_elbow_pivot`
- `right_wrist_pivot`
- `left_hip_pivot`
- `left_knee_pivot`
- `left_ankle_pivot`
- `right_hip_pivot`
- `right_knee_pivot`
- `right_ankle_pivot`

If the diagnostic clip bends a part the wrong way, fix the bone rest axis or source pivot in Blender before trying imported animation clips.

## Retargeting Premade Animation Clips

Drop source animation files into:

`assets/animations/inbox/`

Then run:

```bash
node tools/retarget_animation_to_sling.js assets/animations/inbox/YOUR_ANIMATION.fbx
```

Generated Sling-compatible clips are written to:

`assets/animations/retargeted/`

This first-pass retargeter supports common humanoid/Mixamo bone names. It copies source local bone rotations onto Sling's custom bones and writes a report beside the output GLB.

If a converted clip has elbows/knees bending backward, the skeleton is still usable, but that source clip needs either:

- a per-bone axis correction in `tools/retarget_animation_to_sling.js`, or
- manual cleanup in Blender before export.

The long-term goal is:

1. Download/drop animation into `assets/animations/inbox/`.
2. Retarget it onto Sling.
3. Audit/preview the output GLB.
4. Load the converted Sling clip in the game.
