# Foundation split

Read `CLAUDE.md` and `docs/CONTRACT.md`; `.studio/BRIEF.md` was absent.

Extracted furniture/lights into `createWorld(scene)`, parent/baby geometry into
`createCharacters(scene, world)`, and reusable mapped materials/geometry/pose snapshots into
`geometry.js`. Kept every authored position, dimension, default camera, lighting setting, and
HUD label. Preserved the exact delivered Genex bunny URL and its visible floor placement.

Added named task objects, actual furniture footprints, bounds, character pose handles, a stable
idle gameplay state contract, and the shared app context. Main is 93 lines of renderer/camera,
studio installation, facet wiring, and lifecycle glue. It forwards facet reset/update/probes,
camera/demo registries, and late HUD binding. Reset restores time and authored transforms;
no callbacks read an uninitialized studio API. `player()` exposes the actual parent pose.

Updated `NOTES.md` with pitch/style, current idle scope, seam contracts, lifecycle order, and
recommended WASD/arrows + Shift + E + R controls. Left the existing entry module and
harness-owned `studio.js`, `hud.js`, and `materials.js` untouched. No commit was made, as requested.

## Fixed by looking

- Inspected the baseline `c1_default.jpg` and refactor `c2_default.jpg` captures. The same
  elevated dollhouse composition, furniture, parent/baby poses, warm lamp, HUD, and front-right
  bunny are visible. Both report litFraction 1.00 and meanLuma 65.
- Inspected `s1_cam-eye-here.jpg`: the newly enabled studio player-eye view correctly looks
  from the parent toward the sink/door, demonstrating a real character-origin camera.
- Final default capture: `c3_default.jpg`; console errors since load: none.

## Verification

- Live studio state reports phase `scene`, noise 0, all four task IDs in order, eventId 0,
  sleeping mood, all three original HUD labels, and parent position (-0.4, 0.1, 1.25), yaw 0.36.
- An in-memory Node VM check passed stable gameplay reset; idle behavior; transform, visibility,
  and light reset; synchronous install reset without TDZ; one-import/one-push facet wiring;
  update/probe/camera/demo forwarding; HUD binding after API assignment; and player pose
  following a moved parent. The fixture was not added to the shipped game.
- No full gameplay loop was built: this task only establishes shared foundations. No asset
  generation, publishing, or harness modification was needed. No blockers found.
