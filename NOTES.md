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
screen-relative to the isometric overview; hold Shift to tiptoe, hold E to approach quietly and brake near
a floor target to complete the chore, and press R for an immediate replay. Space makes a loud
slipper thump. The body radius is 0.30m; actual furniture footprints block movement with axis
sliding, while duck, blocks and bunny squeak with individual three-second cooldowns.
Water is reached in front of the sink, door in front of the back wall, pacifier on the rug,
and toy at the blocks. Any chore order works. Walking is much noisier than tiptoeing.
After the first action the toy and unanswered door continue by dt even while standing still.
Reading before the first action is safe. Unresolved toy noise keeps rising through rest;
silencing it gives immediate relief and restores stronger settling. Holding movement at a
wall/furniture is noisy effort, not rest. At 100 noise the baby
wakes and the night is lost; completing all four below 100 wins. R resets world, characters,
gameplay, extension effects, and simulation time through main's `app.restartNight`.

The fallback HUD uses only the existing studio canvas HUD: chores, projected reachable targets,
noise/baby status, interaction progress, controls, event messages and win/loss/replay prompts.
Gameplay yields HUD ownership when an extension explicitly supplies `handlesHud`,
`kind: 'presentation'`, or name/id `presentation`; presentation can read the state and event contract below.
No world, character geometry, generated assets, or studio methods were changed.

`quiet-win` navigates the actual collision map with injected Shift/WASD and holds E at every
chore. `wake-and-replay` holds D for 25 seconds through real updates, including a boundary hold, then injects R; it returns
`{woke, replayed}` and leaves a fresh night. `wake-the-baby` leaves the actual loss visible.
`demoProbe` retains the travelled route or pre-replay loss evidence. The first simulation
verification completed all chores near 20 noise, observed loss at 100 and successful replay;
120 seconds standing idle remained playable at zero noise. Live W moved the real parent.
The initial primary-camera capture has controls, task labels and noise visible, with no errors.

## Iteration 2 — forgiving stealth controls

Quiet-win keeps its exact accepted real-input route, and now returns a truthful final
`state: {phase, tasksCompleted, noise}` snapshot alongside won/route/noise. The identity
failure was the missing nested return field. Periodic toy events use `toy-alarm`, matching
the audio/presentation worker. `events` remains a truthful chronological verification log.
Fallback ownership requires explicit presentation kind/name/id or handlesHud. A character
extension with bindHud alone no longer suppresses the playable controls; presentation
ownership removes all fallback targets and effects to avoid duplicate markers.

The new steady-hands assist uses the same ctx input as live play: holding E while approaching
makes slippers tiptoe, then brakes when a reachable chore enters range. The parent faces
the target and completes the hold even if movement keys remain down. Partial progress is
stored per chore for 1.5 seconds after release, then gently decays; a small reach hysteresis
keeps a partly completed chore selected through position slips. Completed chores remain
complete, and replay clears all new progress/mode fields. Furniture/radius physics and the
accepted quiet route are unchanged. All four existing chores remain reachable.

The canvas fallback now has an explicit TIPTOE / RUSHING / STEADY HANDS badge with truthful
footstep noise rates. Small mint footfall dots distinguish tiptoeing from larger orange
noise rings while rushing; both are items on the existing single studio HUD. Task labels
sit above their anchors, leaving the pacifier object unobscured. No meshes or assets changed.

New probes: `taskProgress` maps ordered task IDs to 0..1; `interactionAssist` is the E brake;
`interactionGrace` is seconds of preserved hold progress; `movementMode` is idle/tiptoe/rush/chore;
`lastMovementMode`, `noiseRate`, `footstepNoise`, `tiptoeTime`, and `rushingTime` are actual
simulation readings. Existing stable state identity, task IDs, mood/phase and event fields
are preserved. `noiseRate` is the continuous net rate including effort/action, actual settling, and source
noise; discrete alarms, knocks, hazards and chore rewards are separate events.

New real-input demos: `tiptoe-vs-rush` compares the same 1.2-second W hold from the same seed
with and without Shift; `steady-hands` holds W/D/E to approach, checks automatic braking,
releases for 0.4 seconds and verifies retained progress, then resumes. The initial stepped
checks returned quieter=true, braked=true, progressRetained=true, resumed=true and ~80.6%
interaction progress. Before the tension correction, quiet-win stayed ~20.2 noise. The final route remains identical
in positions/input and now wins near 18 noise with earlier toy relief; wake-and-replay
still returns both flags true. Baby reaction meshes and the pacifier silhouette remain owned by the pending
characters/home integration; this facet does not duplicate them or expand the one-room game.

### Playtest boundary correction

Read the actual `director/play_1/playtest.json`: tester won all four at 42 noise and replayed,
but held movement for 25 seconds at an edge and noise drained to zero. The cause was treating
`moving === false` as rest and pausing source timers without displacement. Movement intent
is now separate from real displacement. Pressing against a blocker applies the same effort
noise rate, cannot settle the meter, and still advances the night; auto-braked E work is exempt.

The first action starts `nightStarted`; until then controls can be read indefinitely. After
that, `nightTime`, the unanswered toy and door timers advance from dt, including while resting.
Toy source noise grows with nightTime, periodic `toy-alarm` grows more urgent, and resting
settles only 0.15/sec while it remains unresolved. Silencing it cuts 12 noise immediately,
removes the continuous alarm source, and restores 2.2/sec settling. The unanswered door retains
a small source and six-noise floor during rest, until answered. No rooms/tasks/assets were added.

New intent/timer probes: `movementIntent`, `blockedMovement`, cumulative `blockedTime`, `resting`,
`nightStarted`, `nightTime`, `toyTimer`, `doorTimer`, `toyAlarmIn`, `doorKnockIn`, `sourceNoiseRate`,
and `noiseFloor`. Timer countdowns are null when the source is completed; replay restores all.
`wake-and-replay` now tests the exact boundary case with a D hold, then R; its pre-replay probe
retains noise/phase, distance, blockedTime, nightTime and whether the real mood log stirred.

Verification after this fix: real computer D holds reached stirring (70 noise), then loss at
100 with 11.63 seconds of blocked effort; live R restored spawn, zero completed tasks, sleeping
baby, and an unstarted night. Stepped D holds reached stirring around 9 seconds and lost before
25 seconds. 120 seconds of pre-action reading was safe; after one 100ms movement and 30 seconds
of genuine idle, noise rose above 52 with continuing toy-alarm and door-knock events. Further
unattended waiting lost. Exact real-input quiet-win still completes all four near 18 noise.
Rendered regression assertions passed with quiet-win phase=won, four chores and noise
17.9107 matching live state, boundary stirred/lost/replayed, and safe pre-action reading.
Repeated seed/input routes produced identical results. Temporary browser runners are removed;
main.js/studio.js and all other facets’ meshes/assets remain unchanged. Details are recorded
in docs/notes/NOTES.chores.md. Final checkpoints use /tmp/chores-iteration2.bundle from the
accepted 198f18b base; external Git metadata remains read-only for this workspace.

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
`squeak`, `task-start`, `task-complete`, `toy-alarm`, `door-knock`, `stomp`, `mood`, `won`, `lost`,
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
R to replay/reset. These controls are implemented in the shared gameplay update. E also tiptoes on approach
and brakes inside chore reach; partial progress survives brief interrupted holds.
