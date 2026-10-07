# Honest outcome text

Changed only `src/presentation.js` plus this note. No main wiring changes, gameplay edits,
layout changes, DOM, screens, assets or new permanent review hooks. No commit made, as
instructed; Studio owns the commit.

- Won current-task copy: `All errands finished.`
- Lost current-task copy: `Night shift interrupted · N chores left`, using the actual
  task order minus completed count. Loss with zero completions now correctly says 4 left.
- Recognize merged gameplay's actual `toy-alarm` event as noise and use the existing
  `UNINVITED ENCORE.` headline. Existing `door-knock` handling was already correct.
- Preserved event history consumption, empty/footstep filtering, four-second readable
  feedback, HUD mutation cache and shared `api.hud`.

## Verification

Read merged `src/gameplay.js`, main wiring and studio control/demo contract. Opened and
visually inspected all evidence named below at the actual 960×600 preview size.

Capture directory:
`/Users/usamabinshahid/Library/Application Support/Genex/runs/run_muy4m15o5n23/facet_presentation-final/self/iter_001/`

- `c1_default.jpg`: fresh default after correction; existing layout and 0/4 errands clear.
  The capture tool also captured every existing registered character camera.
- Clicked the live canvas at (480,300), held W for 0.8 seconds. Actual position changed
  from (-0.4,1.25) to (-1.58184,-0.46163), distanceTravelled=2.08; real footstep event emitted.
- `s2_cam-review-loss.jpg`: actual `wake-the-baby` demo, seed 17, real held D for 1,500
  simulation frames. Gameplay reports lost, noise=100, awake, completedTasks=[], count=0,
  woke=true and stirred=true. Frame shows interrupted/4 left, awake baby and replay controls.
- `s3_cam-review-toy.jpg`: seed 17, actual W input starts the night, idle fixed steps to the
  real timed alarm, then W for 550ms produces a subsequent empty footstep. History shows
  toy-alarm at elapsed=8.45 and footstep at 8.98333. At 9.06667 the frame still shows
  `UNINVITED ENCORE.` and `+5 NOISE · The toy starts its 2 AM world tour.`
- `s4_cam-review-door.jpg`: actual timed door-knock at elapsed=17.0, real emitted text
  `Knock knock. Your sleep deprivation has arrived.` Frame shows distinct
  `WHO KNOCKS AT 2:13 AM?` and +4 noise caption.
- `s5_cam-review-win.jpg`: actual `quiet-win` route completes all four chores using
  gameplay inputs. Won, tasksCompleted=4, noise=17.91067. Frame shows `All errands finished.`,
  four checkmarks and `PARENT OF THE NIGHT.`
- Temporary camera aliases only invoked existing real demos or seed/input/step methods;
  no score, noise, position or outcome state was authored. Removed every alias afterward.
- `c2_default.jpg`: fresh capture of final production module after alias removal/reload;
  readable default at 960×600, no console errors.
- `s6_screen.jpg`: final production module, focused live canvas, held D for 25 seconds.
  Actual distanceTravelled=4.18480, lost, noise=100, count=0, awake. Visually confirms
  interrupted/4 left and all existing loss feedback. This is fresh final-build evidence.
- Pressed R through the live keyboard path afterward; inspected fresh replay screenshot.
  Returned to 0/4, sleeping baby, next chore and normal controls.

Node module syntax check and `git diff --check` pass. Small in-memory HUD assertions pass
for lost remaining counts at 0/4 and 3/4, won copy and zero HUD mutations on an unchanged
update. This assertion check is separate from the real gameplay visual evidence above.
Final computer console reports no errors. No requested verification was blocked.
