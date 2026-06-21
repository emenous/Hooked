const cp = require("child_process");

// Compatibility wrapper. The old implementation exported the Blender-friendly
// editing file directly, which preserved the wrong runtime axis basis.
// Use the game-ready baker instead.
const result = cp.spawnSync(
  process.execPath,
  ["tools/export_game_ready_skeletal_character.js"],
  { cwd: process.cwd(), encoding: "utf8", stdio: "inherit" },
);

process.exit(result.status ?? 1);
