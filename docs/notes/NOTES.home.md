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
