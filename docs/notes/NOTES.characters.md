# Parent and baby reactions — accepted iteration 1 and iteration 3

Implemented the mandatory move with the existing textured character geometry. Parent has reusable shoulder/elbow, hip/knee/ankle, upper-body and face pivots: a crouched slow high-knee tiptoe with lifted slippers versus a brisk arm-swinging walk. The baby breathes under its blanket, stirs with a head roll, worried eyebrows and intermittent half-open eyes, then lifts its head with wide eyes, a large open mouth, tongue, tiny tears, flailing arms and comic rays on wake-up. Kept the cozy palette, crib footprint and delivered bunny intact. No assets were generated because the brief explicitly says the existing characters are suitable.

Preserved createCharacters(scene, world), parent/baby/sleepText/shushText/reset and existing pose handles. Added visual pivots and shins without replacing shared roots. Character idle update is intentionally empty: character-reactions exclusively owns the pose. Main has exactly one import and one extension line inside FACET WIRING; no other main edits.

All animation time comes from dt; seeded reset restores the rig without changing gameplay position, yaw or collision. Read gameplay.state only: moving, sneaking, noise, phase, interactionProgress, eventId/lastEvent and babyMood. Loss forces the awake reaction even if babyMood has not yet changed. Noisy events produce a short startled shrug, interactions extend an arm, and win/loss get separate relief/panic poses. World sprites are children of the parent/baby, switch visibility with mood, and never become extra HUD objects.

## Preview contract

Deterministic demos: character-sleep-tiptoe, character-stir, character-comic-wakeup, character-brisk-walk, character-relieved-win, character-pose-reset. The reset demo deliberately dirties the rig with the awake pose and then resets it from the current seed.

Matching cameras: characters-sleep, characters-stir, characters-awake, characters-walk, characters-win, characters-reset. These use the exact default camera framing. Additional baby-sleep-detail, baby-stir-detail, baby-awake-detail and parent-tiptoe-detail cameras show face/limb construction. Explicitly request camera names when capturing: capture without names currently returns only the first eight cameras.

Previews pose only character descendants and the camera. They never write gameplay.state or parent position/yaw. Previews end on fixed frames and return actualGameplayTriggersVerified: false; normal pose ownership resumes on input, default camera or reset. **Only integrated play verifies actual task/noise/win/loss triggers.** This worktree's gameplay.js is still the scene stub, so the previews are visual character evidence, not a completed gameplay loop.

## Fixed by looking

- Compared the attached base still and c1_default against the edited game. Kept the dollhouse, light, palette and bunny; enlarged heads/eyes modestly for the existing main camera.
- c2 showed the parent step was too subtle and unoutlined sprites disappeared over pale furniture. Raised the knee much farther and outlined/enlarged scene-attached reaction labels.
- c3 revealed that pointing the lifted slipper downward hid the height gain. Kept the lifted sole almost level; c4 and c5 show a visible suspended slipper at the main camera and an unmistakable raised knee in parent-tiptoe-detail.
- Stir preview now fixes a half-open-eyed anxious moment, instead of capturing an ambiguous closed-eye instant. Sleep hides worried eyebrows; awakening has a lifted head and a substantially larger mouth.

## Verification

- Final inspected frames: c5_default, c5_characters-sleep, c5_characters-stir, c5_characters-awake, c5_characters-reset, c5_baby-awake-detail and c5_parent-tiptoe-detail, under runs/run_muy4m15o5n23/facet_characters/self/iter_001. Additional sleep/stir facial detail was inspected in c4. c5 default shows the parent tiptoe and peaceful sleeping baby; c5 stirring/awake use identical main camera framing, so the mood change is directly comparable.
- Live studio inspection: 41 meshes tagged pajama-parent (>10), 30 tagged sleeping-baby (>5), all character mesh materials mapped, both original labels entity-attached, visibleDomElements 0, hudObjects 1. Meshes carry explicit root identity tags as well as tagged pivot groups so exact-tag inspectors count them.
- A focused Node pose check passed all preview gameplay/root immutability, seeded reset after dirty poses, sleep/stir/loss/win visibility, slower sneak than walk, event reaction and parent transform preservation. This checks pose logic with lightweight vectors; it does not claim to test integrated gameplay triggers.
- node --check passed both character modules and main; git diff --check passed. Every capture reported no console errors.
- Ran the required W 1.2s, A 0.8s, Space sequence. Parent remained x=-0.4, y=0.1, z=1.25, yaw=0.36; gameplay stayed phase=scene. [dead-input] is observed in the shared gameplay stub, which this facet does not own. Left gameplay.js unchanged; movement and actual mood triggers require the gameplay facet merge.

Iteration 1 character readability is supported by inspected main-camera frames; the final taste judgement belongs to the harness.

## Iteration 3 — visible interactions and real event reactions

Iteration 2 was rejected by the visual-change gate despite the locally inspected new preview cameras. Its additional previews preserved the original accepted views, so those views did not prove the new behavior. Recovered the useful parent rig/reaction work from the retained attempt, then changed the integration mechanism rather than repeating a preview-only submission.

The chores, home and audio facets have now merged into this workspace. Gameplay is real, not the old idle scene stub. Kept all edits confined to characters.js, character-reactions.js and these notes; did not edit gameplay, world, main, studio, audio or home. Kept the accepted baby geometry and its raised head/arms, open eyes/mouth and WAAAH bubble. No generated replacement assets were needed.

The mandatory move is now visible under actual input: a broad task reach with task-specific water/pacifier/toy/door gestures, followed by an event-driven freeze → recoil → pleading shush at mistakes. Parent gets wide eyes, a large gasp, raised arms, a comic sweat drop and reaction rays. Scene-attached DON’T. MOVE., TOO LOUD! and PLEASE BE QUIET. labels follow the parent. Win has a relaxed curved smile, one raised fist and one shushing hand; loss has wide eyes and hands at the cheeks. Gameplay position, yaw and collision remain exclusively gameplay-owned. During reactions the local upper-body/head pivots glance toward the camera, keeping the expression readable after the player turns.

### Fixed by looking — iteration 3

- c1 showed the new merged room with **no HUD**. Root cause: gameplay's ownsFallback treats any extension with bindHud as a presentation owner; the old character instrumentation exported bindHud and suppressed the fallback HUD. Removed that advertised hook. Character lifecycle instrumentation now installs internally when app.api becomes available; it does not claim HUD ownership or create any HUD item/object. c2/c3 show the original single gameplay HUD working again.
- Merged event.noise means total meter level. It is not a noise delta. The old positive-noise predicate would startle on every footstep and ordinary task completion. React to actual noisy event types (stomp, squeak, toy, door-knock, mistake, bump, noise) and inspect the fresh event history, so a same-frame mood event cannot hide the preceding stomp. Ordinary footsteps preserve the walk/tiptoe; task-complete gets its own brief relief reaction.
- c2/c3 main-camera previews clearly show reach, freeze, broad recoil, pleading shush and distinct win/loss. Outlined labels fit their sprite canvases; no clipped reaction text. Actual s6 controls show the parent reacting after travelling to the left side of the room, with face visibility preserved by visual pivots.
- Inspected s2 real stomp/recoil, s3 real pacifier interaction, s5 real stirring, s6 required controls, s8 real loss/wake-up and s9 replay. These are default-camera **actual gameplay** frames with characterPreview=null, not isolated character previews.

### Verification and remaining scope — iteration 3

Real default-camera input evidence:

- From spawn (-0.4, 0.1, 1.25), Space produced a visible TOO LOUD! recoil without changing that position or yaw. Gameplay emitted stomp; characterPreviewOnly=false.
- Held D for 0.6 s to reach the pacifier, then held E for 0.55 s. The root stayed at (0.9906957620, 0.1, 0.2897576881) throughout interaction, event type task-start/task pacifier appeared, interactionProgress advanced, and FOUND IT! / the retrieval gesture appeared in s3. Held E again to complete the actual chore (s4).
- Four Space taps produced real noise around 61 and babyMood=stirring, while the parent recoiled (s5). Fresh event history contained both stomp and mood in one frame; neither reaction was lost.
- Required W 1.2 s → A 0.8 s → Space: parent travelled from (-0.4, 0.1, 1.25) to (-3.9582453838, 0.1, -0.4395510173), distanceTravelled=5.2686. s6 shows the reaction at the new location. The former dead-input dependency is now resolved by the merged chores code, which this facet left untouched.
- Repeated real Space taps reached phase=lost, noise=100, babyMood=awake; s8 shows parent panic and the accepted big comic baby wake-up. Character preview remained null. R replay returned to playing/sleeping at spawn with the crying and panic sprites cleared (s9).

Live contract inspection: 47 parent meshes (>10), 30 baby meshes (>5), all character mesh materials mapped, original sleep/shush labels entity-attached, 0 visible DOM elements, exactly 1 HUD. Syntax and diff checks pass; captures and console report no errors.

14 deterministic character demos and 20 character cameras remain available. Main-camera interaction/noise/win/wake/reset views are first for eight-view capture tools. The preview-only component check passes every demo/camera with frozen gameplay: root/state unchanged, exact seeded reset, no preview clock advancement, immediate cleanup on debugCamera(default) while paused and on start. Character instrumentation does not export bindHud. No camera demo writes fake gameplay state. Returning from a camera preview restores the real current phase, including a legitimate live loss if one has occurred.

Final preview evidence is c3_default, c3_parent-interaction, c3_parent-noise-freeze, c3_parent-noise-recoil, c3_parent-noise-shush, c3_characters-win, c3_characters-awake and c3_characters-reset in runs/run_muy4m15o5n23/facet_characters/self/iter_003. Compared them with this iteration's accepted c1 views; new parent gestures and the restored HUD are visible. Real input evidence uses s2/s3/s5/s6/s8/s9 from the same directory. Integrated win triggering was not manually rerun here; the existing real quiet-win demo remains owned by chores. Its character outcome pose is verified in the win preview.

No movement/gameplay-trigger HARNESS gap remains in this merged worktree for the exercised chore, stomp, stirring and loss routes. The prescribed character reaction ladder is delivered; stop here for integrated judgement.
