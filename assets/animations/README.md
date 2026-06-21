# Sling Animation Intake

Use this folder for animation clips before they become game-ready.

## Folders

- `inbox/`: put downloaded Mixamo/marketplace animation files here.
- `retargeted/`: generated Sling-compatible animation GLBs go here.

## Mixamo Export Settings

For the easiest retarget:

- Format: `FBX Binary` or `FBX for Unity`
- Skin: `Without Skin`
- Frames per second: `30`
- Keyframe reduction: `None`
- Use in-place versions when Mixamo offers them.

## Retarget Command

```bash
node tools/retarget_animation_to_sling.js assets/animations/inbox/YOUR_ANIMATION.fbx
```

The output will be written to:

`assets/animations/retargeted/YOUR_ANIMATION_sling.glb`

The script also writes a `.report.json` beside the output with the source-to-Sling bone mapping it used.

## Important

Premade animation clips are not universal. A clip only transfers cleanly when the source rig can be mapped to Sling's skeleton and the rest pose/bone axes are close enough.

This pipeline is currently intended for humanoid rigs like Mixamo first. Other marketplaces may need custom bone-name aliases or manual cleanup in Blender.
