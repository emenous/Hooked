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
- Generated skeletal GLB:
  `assets/models/m_character_skeletal.glb`

Do not hand-edit the generated skeletal file as the source of truth. If a shoulder, knee, wrist, ankle, or ribbon anchor is wrong, fix the pivot or part placement in `sling_hyper3d_new_rig_prep_pivots_fixed.blend`, then regenerate.

## Export

Run:

```bash
node tools/export_skeletal_hyper3d_character.js
```

The exporter creates:

- A 20-joint armature.
- Rigid skin weights for each mechanical body part.
- `left_wrist_anchor` for the grapple hand.
- `ribbon_anchor` on the back/head area.
- A diagnostic animation clip named `Sling_rig_test`.

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
