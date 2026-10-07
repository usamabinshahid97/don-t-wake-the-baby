# Don’t Wake the Baby

_The studio's living memory of this game. Whoever builds here keeps it current — the pitch, the
key decisions and why, and the current state (features, known issues). A newcomer should
understand the game from this file alone. It is injected into every conversation about this
game, so decisions written here survive any chat window._

## Pitch

A pajama-clad parent must survive ridiculous nighttime errands without waking the baby:
get water, find the pacifier, silence a toy, and answer the door. Rising noise and expressive
baby reactions should turn a tiny stealth game into an escalating, replayable slapstick scene.

## Selected style

Keep the delivered cozy, pastel 3D dollhouse: rounded furniture, striped pajamas, oversized
nursery clutter, a warm nightlight, moonlit blue walls, and a fixed elevated overview.
The exact existing Genex stuffed bunny remains visible at the front-right of the floor:
`assets/genex/e8c7e356-7ef7-4cbf-a1d7-adc63b1760dd/a-single-adorable-chunky-stuffed-bunny-t-cmuy4n9e.glb`.
Geometry helpers add subtle seeded surface maps through the harness material library without
changing the composition. No new assets were generated for this foundation split.

## Current state

Iteration 1 implements a complete playable night in `src/gameplay.js`. WASD/arrows move
screen-relative to the isometric overview; hold Shift to tiptoe, hold E while stationary near
a floor target to complete the chore, and press R for an immediate replay. Space makes a loud
slipper thump. The body radius is 0.30m; actual furniture footprints block movement with axis
sliding, while duck, blocks and bunny squeak with individual three-second cooldowns.
Water is reached in front of the sink, door in front of the back wall, pacifier on the rug,
and toy at the blocks. Any chore order works. Walking is much noisier than tiptoeing.
The toy escalates while active until disabled; the unanswered door occasionally knocks.
Standing still settles noise, and reading controls cannot cause a loss. At 100 noise the baby
wakes and the night is lost; completing all four below 100 wins. R resets world, characters,
gameplay, extension effects, and simulation time through main's `app.restartNight`.

The fallback HUD uses only the existing studio canvas HUD: chores, projected reachable targets,
noise/baby status, interaction progress, controls, event messages and win/loss/replay prompts.
Gameplay yields HUD ownership when an extension supplies `bindHud`, `handlesHud`, or
`kind: 'presentation'`; presentation can read the state and event contract below.
No world, character geometry, generated assets, or studio methods were changed.

`quiet-win` navigates the actual collision map with injected Shift/WASD and holds E at every
chore. `wake-and-replay` rushes and stomps through real updates, then injects R; it returns
`{woke, replayed}` and leaves a fresh night. `wake-the-baby` leaves the actual loss visible.
`demoProbe` retains the travelled route or pre-replay loss evidence. The first simulation
verification completed all chores near 20 noise, observed loss at 100 and successful replay;
120 seconds standing idle remained playable at zero noise. Live W moved the real parent.
The initial primary-camera capture has controls, task labels and noise visible, with no errors.

## Iteration 1 verification

- Rendered `quiet-win`: won with four completed tasks and noise 20.2181. Every footstep in
  the real event log was sneaking; all chore completions came from held E after navigation.
- Rendered `wake-and-replay`: `{woke: true, replayed: true}`; pre-replay loss noise 100,
  real distance travelled 11.7433m. Fresh run restores spawn, chores, baby mood and noise.
- Ran quiet-win twice with seed 17 and compared the actual route probes: identical.
- Browser assertions verified `inspect().domUi().length === 0` and `count('hud') === 1`.
- Personally drove W, A, Space, D/S, held E at every chore to a full win, and pressed R from
  a won run to reset. The scripted W/A/Space path moves the player and makes noise.
- Inspected primary-camera frames for initial play, 1/4 progress, 4/4 win, replay and loss.
  Corrected the demo key driver after seeing that studio applies downs before ups: it now
  injects only changed keys, preserving Shift across steps. No console errors; live ~60 fps.
- Temporary browser assertion runners were appended to index.html for testing and then
  removed; index.html and studio.js are unchanged in the final diff. Final source owns only
  gameplay.js, main.js outside FACET WIRING, and this note. Existing assets remain intact.
- The sandbox prevents writes to this worktree's external Git metadata. The first playable
  revision was checkpointed immediately in Studio and saved as commit `6c2dd6e` in
  `/tmp/chores-checkpoint.git`. A final local commit and incremental Git bundle are saved
  there and at `/tmp/chores-checkpoint.bundle`; the game edits remain in the workspace for
  Studio integration. No permissions or protected files were altered.

## Shared foundation contracts

- `createWorld(scene)` in `src/world.js` owns furniture, lights, and the bunny loader. It returns
  `sink`, `door`, `pacifier`, `toys`, `duck`, `crib`, `nightlight`, `materials`, `collisionFootprints`,
  `bounds`, `taskTargets`, and `reset(seed)`. Extra handles include `doorPanel`, `doorKnob`,
  `toyBlocks`, `lamp`, `lampshade`, `mug`, `ring`, `sofa`, `rug`, and `bunny`.
  `bunnyReady` resolves to the loaded model (or null after a logged load failure).
- Collision footprints are static world-space X/Z AABBs in metres:
  `{id, object, blocking, minX, maxX, minZ, maxZ}`. Furniture blocks movement; toys, duck,
  and bunny are nonblocking noise hazards. Expand by the player radius when testing movement.
  The bunny has a conservative authored footprint; other footprints come from actual geometry.
  `bounds` includes both walls and open floor edges. `taskTargets` maps water/pacifier/toy/door
  to their world objects; target positions do not prescribe where the player must stand.
- `createCharacters(scene, world)` in `src/characters.js` returns `parent`, `baby`, `sleepText`,
  `shushText`, `parentPose`, `babyPose`, `reset(seed)`, and the default idle
  `update(dt, ctx, time)`. Pose handles are existing local meshes, not a skeletal rig:
  parent torso/head/legs/slippers/eyes/pupils/eyebrows/mouth/arms/hands; baby body/head/eyes/mouth/cheeks.
  A character facet can replace `characters.update`, or apply its poses in its later extension update.
- `src/geometry.js` exports `box`, `ball`, `rod`, `group`, `label`, `mappedMaterial`,
  `createMaterials`, and `capturePoses`. Every geometry helper takes its owning parent first.
  Group tags cover children; labels have their own tags. Shared materials should be cloned
  before a facet changes the color of just one object.
- `src/main.js` exports `app = {scene, camera, renderer, world, characters, state, extensions, api}`
  and owns `app.gameplay = createGameplay(app)`. `app.state` contains simulation `time` and `seed`.
  Consumers read `app.gameplay.state`; they do not duplicate or replace it.

The gameplay state object keeps its identity across reset. Its current contract is:

```js
{ phase: 'playing' | 'won' | 'lost', noise: 0..100,
  tasks: ['water', 'pacifier', 'toy', 'door'],
  completedTasks: [], tasksCompleted: 0, taskDetails: {water, pacifier, toy, door},
  sneaking: false, moving: false, nearestTask: null, interactionProgress: 0..1,
  eventId: 0, lastEvent: null, events: [], babyMood: 'sleeping' | 'stirring' | 'awake',
  elapsed: 0, activeTime: 0, toyUrgency: 0..1, distanceTravelled: 0, demoProbe: null }
```

`tasks` always contains those ordered IDs; it never becomes task objects or completion flags.
`completedTasks` contains completed IDs in completion order, and `taskDetails[id]` supplies
`label`, `action`, accessible floor `x/z`, `duration`, and `reach`. Consumers never write state.
Baby starts sleeping, stirs at 45 noise, and wakes at 100. All gameplay input comes from ctx.

Events are emitted by incrementing `eventId` and assigning
`lastEvent = {type, task?, noise?, text?, ...details}`. `events` is a chronological log of up to
64 real events with additional `id` and simulation `time` fields. Types are `footstep`,
`squeak`, `task-start`, `task-complete`, `toy`, `door-knock`, `stomp`, `mood`, `won`, `lost`,
and `replay`. Footsteps include `sneaking`; squeaks include `hazard` and `amount`; mood includes `mood`.
`task`, when present, is one of the four ordered task IDs.
Noise in an event is the resulting meter value, not a delta. Each reset restarts IDs at zero;
R then emits a `replay` event in the fresh run. Audio/presentation should watch both reset and
new event IDs, and can consume the log when several events occur in one update. The phases,
noise, tasks, completedTasks, babyMood, nearestTask and events are truthful studio probes.

## Fixed by looking

The idle reference had no visible way to play. The primary-camera capture now shows four
reachable numbered targets, a 0/4 checklist, noise/baby status, and the full controls on the
one canvas HUD. Existing room composition, materials and asset paths remain intact.

## Facet wiring and lifecycle

Add ONE import and ONE `app.extensions.push(createFacet(app))` line inside the single
`FACET WIRING` block, after context and core gameplay creation. No other main edits are needed.
An extension may return `reset(seed)`, `update(dt, ctx)`, `probes()`, `cameras`, `demos`, and
`bindHud(api)`. Camera/demo properties are name-to-function maps merged into studio config;
choose unique names and probe keys. Their closures can access the entire app.

Studio reset runs synchronously during installation: `app.api` is initially null. Reset must
work without HUD access. Main assigns `app.api` after installation and then calls optional
`bindHud(app.api)` hooks. Reset order is time/seed → world → characters → gameplay → extensions
→ default camera; object/state identities stay stable. Captured transforms, visibility, and light
intensity return to the authored baseline, including the asynchronously loaded bunny model.
Facets reset their own additional effects and material changes.

Update order is time → gameplay → default character idle → extensions. Input comes only from
studio `ctx.keys`, `ctx.look`, `ctx.wheel`, and `ctx.rng`; time comes only from `dt`.
Probes merge gameplay then extensions and append renderer stats before the HUD render.
Studio `player()` reads the actual parent's world position and orientation, enabling eye cameras.
All existing studio methods remain available through the untouched harness.

## Recommended controls

WASD/arrows to move; hold Shift to tiptoe; hold E to interact with the nearest task;
R to replay/reset. These controls are implemented in the shared gameplay update.
