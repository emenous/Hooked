# Swing Pose References

Drop the swing reference images for Sling in this folder.

Use this naming pattern:

```text
pose_<bucket>_<short-note>_v01.png
```

Examples:

```text
pose_idle_hang_relaxed_v01.png
pose_hook_catch_left-arm-rope_v01.png
pose_down_swing_legs-trailing_v01.png
pose_bottom_swing_legs-forward_v01.png
pose_up_swing_body-extended_v01.png
pose_release_launch_stretched_v01.png
pose_falling_loose_v01.png
pose_backflip_tuck_barrel_v01.png
```

Step 1 goal: collect references, not solve animation yet.

For each image, we need to know:

- Which swing moment it represents.
- What direction Sling is moving.
- Where the grapple/rope is.
- What the left arm must do.
- What the legs should do.
- Whether the pose is required or just inspiration.

Priority references:

1. `hook_catch`: left wrist/hand aligned with rope.
2. `down_swing`: body hanging under tension, legs trailing.
3. `bottom_swing`: fast arc, legs forward, torso pulled by rope.
4. `up_swing`: body extended, momentum carrying upward.
5. `release_launch`: launch silhouette after letting go.
6. `falling`: no rope, loose but believable.
7. `backflip_tuck`: compact barrel/tuck pose.
8. `idle_hang`: relaxed default hang.

After images are added here, update:

```text
data/swing_pose_reference_manifest.json
```

Set each entry's `file` to the matching image path and change `status` from `needs_reference` to `ready_for_pose_blockout`.
