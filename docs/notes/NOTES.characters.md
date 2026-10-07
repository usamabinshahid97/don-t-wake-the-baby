# Parent and baby reactions — iteration 1

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

No contract checks are impossible as written. Character readability is supported by inspected main-camera frames; the final taste judgement belongs to the harness.
