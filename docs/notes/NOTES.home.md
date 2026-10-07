# Cozy dollhouse — iteration 2: distinct chore landmarks

Read `.studio/BRIEF.md` first and inspected the accepted live default before editing. Iteration 1 passed cozy-night-home, mapped-room, no-dom-ui and single-hud. Followed the director steer: focus on useful pacifier/toy/sink/door landmarks, preserve the accepted lighting and navigation, and stop without room expansion, extra furnishing, character animation, audio or movement work.

## This iteration's mandatory move

- Pacifier: replaced the flat saucer shield with a rounded extruded pink butterfly shield, raised mint grab loop, contrasting vents and teat. Same `pacifier` group, exact target position (0.7, 0.18, -0.43), and same public `ring` mesh handle. Existing meshes retain identity; only their geometry/material/local pose changes. The 1.8× miniature has a distinct silhouette visible in the full 960×600 frame. Its loop bottom rests on the rug.
- Sink: a relief water-drop tile physically mounted against the existing rear wall, and a larger handled mug with a dark water surface and ivory rim. All additions are attached to the existing water-station; no target movement.
- Doorstep: thin woven SHH mat, amber doorbell and brass mail slot at the existing door. The lettering is physical embroidery on a floor mesh, not a floating marker, sprite UI or HUD. The mat is nonblocking cosmetic dressing.
- Toy: enlarged BEEP-O's existing glowing power cap and added a physical power symbol. Existing `toys`, `toyBlocks`, antenna, robot face, eyes and `toy-off-button` handles/tags remain. The registered extension still consumes gameplay state for toy dimming; no new gameplay or character behavior.

No furniture, room expansion or optional bunny-surface work was added. Reused the exact delivered generated bunny with its loading callback unchanged; no new asset generation was required.

## Navigation and API verification

**Added navigation footprint changes: none.** The original collision snapshot is still built before cosmetic dressing. Stored min/max values, blocking flags, bounds, taskTargets, target group positions, bunny URL, load/reset callbacks and all original returned handles remain intact. Cosmetic doorbell/tile/mat are excluded from collision snapshots; they do not make routes solid. The mug's cosmetic scale/height changes do not change the sink target or stored footprint.

Geometry API decisions: no changes at all to `src/geometry.js` this iteration. All signatures, materials color/roughness handling and character dependencies match the accepted build. No changes to main or its existing one-import/one-init wiring. `home-atmosphere.js` remains the dressing module; world only passes the existing kitchen/mug/door handles into it.

A temporary in-memory Node assertion confirmed world.js is byte-identical to the accepted version outside the dressing arguments, and geometry/main/gameplay/characters/materials/studio are unchanged. It also checked exact target declarations, snapshot-before-decoration ordering, and absence of input listeners, DOM append, random or wall-clock sources. Node syntax checks and git diff --check passed. No test fixtures shipped.

## Fixed by looking

- Baseline `iter_002/s1_screen.jpg` matches the accepted frame: lamp/moonlight balance works, but pacifier is saucer-like and sink/door landmarks are weak.
- Inspected `iter_002/c1_default.jpg` and `s1_zoom.jpg`: raised pacifier loop and butterfly shield read clearly, water tile/mug, doorstep mat/doorbell and power icon are visible. Noticed the water tile was floating ahead of the wall and the pacifier loop bottom was slightly above the rug.
- Mounted the tile against the existing wall and lowered only local pacifier parts. Inspected `iter_002/c2_default.jpg`: landmarks remain visible, no lighting changes, and center route remains open.
- Ran W 1.2s, A 0.8s, Space and inspected final `iter_002/s2_screen.jpg` at 960×600. The new silhouette is clear in the photographed frame. Console errors since load: none; live performance 60–62 FPS, 504 scene draw calls, 445,220 scene triangles. MeanLuma remains 38, matching the accepted night atmosphere.

Frame directory:
`/Users/usamabinshahid/Library/Application Support/Genex/runs/run_muy4m15o5n23/facet_home/self/iter_002/`.
Compare accepted `s1_screen.jpg` with final `c2_default.jpg` / `s2_screen.jpg`.

## Contract review

- cozy-night-home: accepted lighting/materials/camera remain unchanged; final frame still shows warm lamp, blue window panes, readable rounded furniture.
- mapped-room: actual scene traversal probes `homeMappedSurfaces: true`, `sofaMappedSurfaces: true`. Every new standard material also uses a texture map.
- no-dom-ui / single-hud: unchanged canvas HUD, no new HUD object or visible DOM. Physical prop lettering is a mapped mesh, and screenshot/state retain the original three HUD labels.
- defect-the-pacifier-near-the-rug-s-right: raised loop and butterfly shield replace the saucer silhouette; visually inspected at the original default camera/full resolution. Awaiting judge result, not claiming acceptance.
- defect-dead-input-the-parent-remains-at-: input sequence still reports exact player x/y/z (-0.4, 0.1, 1.25) in this intentionally idle foundation fork. No movement hack or unrelated code edit was made.

HARNESS: defect-dead-input-the-parent-remains-at- cannot pass in this home-owned idle foundation fork: createGameplay.update is intentionally empty, and the director explicitly assigns movement/chore behavior to the chores worker. Route this defect to chores/integration and evaluate it after that merge; do not require home to edit gameplay/characters or main outside FACET WIRING. The camera correctly reports/photographs the unchanged player, so re-pointing the camera would not fix input.

---

# Cozy dollhouse — iteration 1

Read `.studio/BRIEF.md` first, then `CLAUDE.md`, existing world/geometry/main, the attached baseline, and live `s1_screen.jpg`. The original room was bright and evenly lit with a small lamp; the mandatory move was a visible amber-versus-moonlit nighttime atmosphere with tactile miniature surfaces.

## Implemented

- Kept the compact cutaway and camera composition. Reduced overhead illumination, retained readable cool fill, warmed the practical lamp, added a blue window source and four softly feathered moonlight panes across the rug. Soft amber light sits around the existing stand. The moon/window now use cool blue emission.
- Baked wood, cloth and plaster through the unchanged `materials.js`. Nineteen seeded floor planks replace the applied scratch strips. Sofa cushions gain cloth, welt seams and tuft buttons; rug gains cloth; the shade gains a fabric map. Added slim window curtains, sill, low wall dado and one drawer within existing furniture. No extra rooms, solid obstacles or UI.
- At the original `noisy-toys` group position, the original first block becomes BEEP-O, an electronic robot alarm with screen eyes, speaker grille, antenna and glowing top button. The other original blocks become piano keys. All three `toyBlocks` handles still exist. The pacifier is 1.65× with a teat and shield vents at the original target position. Duck and exact delivered bunny remain readable floor hazards.
- `createHomeAtmosphere(app)` is registered by exactly one import/one extension push inside FACET WIRING. It only reads gameplay state; its deterministic dt pulse dims after ordered toy completion (`tasksCompleted >= 3`), `toyOff`, completedTasks, or a completed task record. It never writes tasks, noise, input, or outcomes.

## Geometry and integration contract

`box`, `ball`, `rod`, `group`, `label` and `capturePoses` signatures and implementation bodies remain unchanged. `mappedMaterial(color, roughness, options)` preserves color identity, explicit roughness, and Three.js option forwarding; it adds optional `grain`, `repeat`, and `bumpScale`. Character skin/hair/blue/white values remain intact. Texture maps are cached by kind/seed/grain/repeat. No roughnessMap is injected that would override the caller's intended roughness.

Original collision footprint construction occurs before cosmetic dressing, so its exact stored bounds are preserved even where toy silhouette grows. Navigation bounds, taskTargets, all original public handles and semantic tags, and `BUNNY_ASSET_PATH` remain intact. The exact bunny path is:
`assets/genex/e8c7e356-7ef7-4cbf-a1d7-adc63b1760dd/a-single-adorable-chunky-stuffed-bunny-t-cmuy4n9e.glb`.

Genex status returned accountVerified true and no service blocker. Reused the suitable already-delivered generated bunny; no new generation or spending was needed. Did not touch characters/gameplay/harness modules, publish, or add an input listener. Only owned files and the allowed main wiring were changed.

## Fixed by looking

- Inspected baseline `s1_screen.jpg`: near-daylight flat fill and thin scratch marks, weak distinction between warm lamp and window.
- Inspected `c1_default.jpg`: four moonlit panes, blue window, amber crib/stand, robot face/antenna/button, enlarged pacifier and wood all visible. Left sink was a little dim and the lamp spill brighter than needed.
- Raised hemisphere from 0.85 to 1.05 and soft key from 1.3 to 1.6; reduced practical lamp from 20 to 16. Inspected `c2_default.jpg`: warm/cool contrast retained with readable parent, sink, sofa and door. Whole-frame meanLuma 38 vs baseline 65; room surfaces remain legible. The outside blue ground is intentionally darker.
- Final post-input frame `s3_screen.jpg` also inspected at 960×600, showing the whole room, duck, bunny and open center. Console errors since load: none. Live preview reports 60 FPS, ~479 scene draw calls, ~435,526 triangles.

Frames live under:
`/Users/usamabinshahid/Library/Application Support/Genex/runs/run_muy4m15o5n23/facet_home/self/iter_001/`.
Primary comparison: baseline `s1_screen.jpg` → final `c2_default.jpg` / `s3_screen.jpg`.

## Contract verification

- cozy-night-home: visually reviewed default frames show a compact miniature home at night, cool blue window/rug panes against amber practical light and clear furniture. Awaiting taste judge; do not claim judge acceptance.
- mapped-room: real scene traversal probes `homeMappedSurfaces: true` and `sofaMappedSurfaces: true`; all these surfaces are MeshStandardMaterial with maps. Sofa contains no other untextured material type.
- no-dom-ui / single-hud: no new DOM UI or HUD objects, and no edits outside main FACET WIRING. Visible screenshot contains only the original canvas HUD; state reports the original three HUD labels. Harness-owned exact scene checks remain for the judge.
- A temporary in-memory Node check passed exact source preservation of footprint array/bounds/targets/bunny URL; unchanged main outside wiring; unchanged geometry helper bodies; material color/roughness option forwarding; visual reset, pulse and toy completion dimming against frozen gameplay state; and no random/wall-clock source.
- `git diff --check` and Node syntax checks for every modified JS file passed. No test fixture added to the game.

## Integration gap observed

[dead-input] The required W 1.2s, A 0.8s, Space sequence leaves player x/y/z exactly (-0.4, 0.1, 1.25). This isolated copy still has the pre-existing `createGameplay` idle stub (`phase: scene`, noise 0, tasksCompleted 0). Movement and chore loop belong to the other facet; they were not implemented or edited here. Home API and open center routes are preserved for that merge. This is a gameplay gap, not a reason to change the home visual checks or camera.
