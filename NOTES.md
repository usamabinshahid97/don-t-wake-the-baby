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

The scene is still deliberately idle. The baby breathes, the parent sways in a shushing pose,
and the sleep label floats. The original overview and three studio HUD labels are preserved.
Movement, noise accumulation, tasks, audio, win/loss, and replay controls await their facets.
The entry remains `index.html` → `src/main.js`; harness-owned studio, HUD, and material files
are unchanged.

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

The initial gameplay contract is:

```js
{ phase: 'scene', noise: 0, tasksCompleted: 0,
  tasks: ['water', 'pacifier', 'toy', 'door'],
  sneaking: false, moving: false, nearestTask: null, interactionProgress: 0,
  eventId: 0, lastEvent: null, babyMood: 'sleeping' }
```

`noise` is reserved for 0..100, `interactionProgress` for 0..1, and `nearestTask` for a task ID
or null. `eventId` increases on future gameplay events within a run and resets to 0; audio and
presentation facets watch it and read `lastEvent`. Gameplay owns future event payloads and
phase/mood values. The stub exports stable `state`, `reset(seed)`, `update(dt, ctx)`, and `probes()`.
Reset restores the contract in place and creates a fresh ordered task-ID array.

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
R to replay/reset. These are recommendations for the gameplay facet, not implemented controls.
